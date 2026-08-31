'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import useToastMessage from '@/hooks/useToastMessage';
import { calcShippingCost, BUSINESS_LOGIC } from '@/lib/constants';
import {
    PAYMENT_METHODS_FALLBACK,
    PaymentMethodConfig,
    DEFAULT_BANK_ACCOUNTS,
    BankAccountRecord,
} from '@/lib/config/banks';
import { CreateOrderPayload, ToastHook } from '@/types/checkout';
import { useCheckoutForm } from '@/hooks/useCheckoutForm';
import { useDiscountCoupon } from '@/hooks/useDiscountCoupon';
import EmptyCartState from '@/components/checkout/EmptyCartState';
import PersonalInfoSection from '@/components/checkout/PersonalInfoSection';
import ShippingDetailsSection from '@/components/checkout/ShippingDetailsSection';
import PaymentMethodSection from '@/components/checkout/PaymentMethodSection';
import OrderSummarySidebar from '@/components/checkout/OrderSummarySidebar';

export default function CheckoutPage() {
    const router = useRouter();
    const { items, total, clearCart } = useCart();
    const toastMsg = useToastMessage() as ToastHook;

    const {
        formData,
        errores,
        uniqueDepartments,
        municipalities,
        handleChange,
        handleDepartmentChange,
        handleBlur,
        validateForm,
        detectLocation,
    } = useCheckoutForm(toastMsg);

    const {
        discountCode,
        setDiscountCode,
        discountState,
        discountLoading,
        discountError,
        setDiscountError,
        applyDiscount,
        removeDiscount,
    } = useDiscountCoupon();

    const [metodoPago, setMetodoPago] = useState('');
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>(PAYMENT_METHODS_FALLBACK);
    const [bankAccounts, setBankAccounts] = useState<BankAccountRecord[]>(DEFAULT_BANK_ACCOUNTS);
    const [aceptoTerminos, setAceptoTerminos] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const submitLock = useRef(false);

    // 🏦 Cargar métodos de pago y cuentas bancarias dinámicas
    useEffect(() => {
        let isMounted = true;
        async function loadPaymentData() {
            try {
                const res = await fetch('/api/payment-methods', { cache: 'no-store' });
                if (res.ok && isMounted) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setPaymentMethods([...data].sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99)));
                    } else if (data && typeof data === 'object') {
                        if (data.methods && Array.isArray(data.methods)) {
                            setPaymentMethods([...data.methods].sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99)));
                        }
                        if (data.bankAccounts && Array.isArray(data.bankAccounts)) {
                            setBankAccounts([...data.bankAccounts].sort((a, b) => (a.orden || 99) - (b.orden || 99)));
                        }
                    }
                }
            } catch {
                // fallback activo por defecto
            }
        }
        loadPaymentData();
        return () => {
            isMounted = false;
        };
    }, []);

    // 🛡️ Idempotency key determinista basada en el contenido del carrito
    const idempotencyKey = useRef('');
    useEffect(() => {
        const cartFingerprint = items
            .map((i) => `${i.id}:${i.variant_id || ''}:${i.size_id || ''}:${i.cantidad}:${i.dorsalNombre || ''}:${i.dorsalNumero || ''}`)
            .sort()
            .join('|');

        let hash = 5381;
        for (let i = 0; i < cartFingerprint.length; i++) {
            hash = ((hash << 5) + hash) + cartFingerprint.charCodeAt(i);
            hash = hash & hash;
        }

        const sessionId = typeof window !== 'undefined'
            ? sessionStorage.getItem('checkout_session') || crypto.randomUUID()
            : 'static-session';

        if (typeof window !== 'undefined') {
            sessionStorage.setItem('checkout_session', sessionId);
        }
        idempotencyKey.current = `${Math.abs(hash).toString(36)}-${sessionId}`;
    }, [items]);

    const shippingCost = calcShippingCost(formData.departamento, formData.municipio);

    const isFormValid = Boolean(
        formData.nombre.trim() &&
        formData.correo.trim() &&
        formData.telefono.trim() &&
        formData.direccion.trim() &&
        formData.departamento.trim() &&
        formData.municipio.trim() &&
        aceptoTerminos &&
        items.length > 0
    );

    const buildOrderPayload = (): CreateOrderPayload => {
        const itemsPayload = items.map((item) => {
            let personalizationType: 'none' | 'player' | 'custom' = 'none';
            let playerId: string | null = null;
            let customNumber: number | null = null;
            let customName: string | null = null;

            if (item.dorsalNumero || item.dorsalNombre) {
                if (item.player_id) {
                    personalizationType = 'player';
                    playerId = item.player_id;
                } else {
                    personalizationType = 'custom';
                    customNumber = item.dorsalNumero ? parseInt(item.dorsalNumero, 10) : null;
                    customName = item.dorsalNombre || null;
                }
            }

            return {
                product_id: item.id,
                variant_id: item.variant_id || null,
                size_id: item.size_id || null,
                patch_id: item.patch_id || null,
                quantity: item.cantidad,
                unit_price: item.precio,
                personalization_type: personalizationType,
                player_id: playerId,
                custom_number: customNumber,
                custom_name: customName,
            };
        });

        return {
            customer_name: formData.nombre,
            customer_email: formData.correo,
            customer_phone: BUSINESS_LOGIC.CONTACT.PHONE_PREFIX + formData.telefono.replace('-', ''),
            shipping_department: formData.departamento,
            shipping_municipality: formData.municipio,
            shipping_address: formData.direccion,
            payment_method: metodoPago,
            items: itemsPayload,
            ...(discountState ? { discount_code: discountCode.trim().toUpperCase() } : {}),
            _honey: formData.description,
            idempotency_key: idempotencyKey.current,
        };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (submitLock.current || isSubmitting) return;

        if (items.length === 0) {
            toastMsg.error('Tu carrito está vacío');
            return;
        }

        // 🛡️ Honeypot bot protection
        if (formData.description) {
            console.warn('🤖 Bot detectado via honeypot');
            setOrderSuccess(true);
            clearCart();
            router.push('/checkout/done');
            return;
        }

        if (!validateForm(metodoPago, aceptoTerminos)) return;

        submitLock.current = true;
        setIsSubmitting(true);

        try {
            const orderPayload = buildOrderPayload();
            const response = await fetch('/api/orders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                console.error('❌ Server Error Details:', result);
                throw new Error(result.details || result.error || 'Error desconocido al crear la orden');
            }

            setOrderSuccess(true);
            clearCart();
            toastMsg.celebrate('¡Pedido registrado correctamente!');

            const query = new URLSearchParams({
                orderId: result.order_number || '',
                fullOrderId: result.order_id || '',
                metodo: metodoPago,
                nombre: formData.nombre,
                total: result.total.toFixed(2),
                anticipo: result.deposit.toFixed(2),
                envio: result.shipping.toFixed(2),
                municipio: formData.municipio,
                departamento: formData.departamento,
            }).toString();

            router.push(`/checkout/done?${query}`);
        } catch (error: unknown) {
            console.error('Checkout error:', error);
            toastMsg.error((error as Error).message || 'Error al procesar el pedido. Intenta nuevamente.');
        } finally {
            setIsSubmitting(false);
            submitLock.current = false;
        }
    };

    const handlePayPalSuccess = (result: {
        order_id: string;
        order_number: string;
        total: number;
        deposit?: number;
        shipping?: number;
    }) => {
        setOrderSuccess(true);
        clearCart();
        const params = new URLSearchParams({
            orderId: result.order_number || result.order_id.slice(0, 8).toUpperCase(),
            fullOrderId: result.order_id,
            nombre: formData.nombre.trim(),
            total: (result.total ?? total).toFixed(2),
            anticipo: (result.deposit ?? result.total ?? total).toFixed(2),
            envio: (result.shipping ?? 0).toFixed(2),
            metodo: 'paypal',
            municipio: formData.municipio || '',
            departamento: formData.departamento || '',
        });
        router.push(`/checkout/done?${params.toString()}`);
    };

    if (items.length === 0 && !orderSuccess) {
        return <EmptyCartState />;
    }

    return (
        <main className="min-h-dvh bg-[#0a0a0a] text-white pt-24 pb-20 px-4 sm:px-6 relative overflow-hidden">
            {/* ✨ Background Glows */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] -z-10" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] -z-10" />

            <div className="max-w-7xl mx-auto">
                {/* 🔙 Botón Volver */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 group cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest">Volver</span>
                </button>

                <header className="mb-8 md:mb-12">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">
                        Finalizar Pedido
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium text-sm md:text-base">
                        Completa tus datos para procesar tu orden.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12">
                    {/* 🧾 COLUMNA IZQUIERDA: FORMULARIO */}
                    <div className="lg:col-span-7 space-y-6 md:space-y-8">
                        <PersonalInfoSection
                            formData={formData}
                            errores={errores}
                            onChange={handleChange}
                            onBlur={handleBlur}
                        />

                        <ShippingDetailsSection
                            formData={formData}
                            errores={errores}
                            uniqueDepartments={uniqueDepartments}
                            municipalities={municipalities}
                            onDepartmentChange={handleDepartmentChange}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            onDetectLocation={detectLocation}
                        />

                        <PaymentMethodSection
                            metodoPago={metodoPago}
                            setMetodoPago={setMetodoPago}
                            paymentMethods={paymentMethods}
                            bankAccounts={bankAccounts}
                        />
                    </div>

                    {/* 🛒 COLUMNA DERECHA: RESUMEN */}
                    <div className="lg:col-span-5">
                        <OrderSummarySidebar
                            items={items}
                            total={total}
                            shippingCost={shippingCost}
                            discountState={discountState}
                            discountCode={discountCode}
                            discountLoading={discountLoading}
                            discountError={discountError}
                            setDiscountCode={setDiscountCode}
                            setDiscountError={setDiscountError}
                            applyDiscount={() => applyDiscount(formData.correo, items)}
                            removeDiscount={removeDiscount}
                            formData={formData}
                            metodoPago={metodoPago}
                            aceptoTerminos={aceptoTerminos}
                            setAceptoTerminos={setAceptoTerminos}
                            isFormValid={isFormValid}
                            isSubmitting={isSubmitting}
                            orderPayload={buildOrderPayload()}
                            handleSubmit={handleSubmit}
                            onPayPalSuccess={handlePayPalSuccess}
                            onPayPalError={(msg) => toastMsg.error(msg)}
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}
