'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
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
import MobileCheckoutBar from '@/components/checkout/MobileCheckoutBar';
import { trackPurchaseOnce } from '@/components/analytics/AnalyticsTracker';

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
    const [paymentType, setPaymentType] = useState<'deposit' | 'full'>('deposit');
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>(PAYMENT_METHODS_FALLBACK);
    const [bankAccounts, setBankAccounts] = useState<BankAccountRecord[]>(DEFAULT_BANK_ACCOUNTS);
    const [aceptoTerminos, setAceptoTerminos] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const submitLock = useRef(false);

    // Estados colapsables interactivos
    const [shippingOpen, setShippingOpen] = useState(false);
    const [paymentOpen, setPaymentOpen] = useState(false);

    // 🏦 Cargar métodos de pago y cuentas bancarias dinámicas
    useEffect(() => {
        let isMounted = true;
        async function loadPaymentData() {
            try {
                const res = await fetch('/api/payment-methods', { cache: 'no-store' });
                if (res.ok && isMounted) {
                    const data = await res.json();
                    const filterMethods = (list: PaymentMethodConfig[]) =>
                        list.filter((m) => {
                            if (m.active === false) return false;
                            if (m.code === 'tarjeta' || m.type === 'tarjeta') {
                                return process.env.NEXT_PUBLIC_ENABLE_PIXELPAY === 'true';
                            }
                            return true;
                        }).sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99));

                    if (Array.isArray(data)) {
                        setPaymentMethods(filterMethods(data));
                    } else if (data && typeof data === 'object') {
                        if (data.methods && Array.isArray(data.methods)) {
                            setPaymentMethods(filterMethods(data.methods));
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
    const checkoutTrackedRef = useRef(false);

    useEffect(() => {
        if (items.length > 0 && !checkoutTrackedRef.current) {
            checkoutTrackedRef.current = true;
            if (typeof window !== 'undefined' && window.trackEvent) {
                window.trackEvent('checkout_start', {
                    itemCount: items.length,
                    total,
                });
            }
        }
    }, [items.length, total]);

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
    const discountAmount = discountState?.amount ?? 0;
    const discountedSubtotal = total - discountAmount;
    const orderTotal = discountedSubtotal + shippingCost;
    const anticipo = orderTotal * BUSINESS_LOGIC.ORDER.DEPOSIT_PERCENTAGE;

    const selectedMethod = paymentMethods.find((m) => (m.code || m.id) === metodoPago);
    const isCardPayment = process.env.NEXT_PUBLIC_ENABLE_PIXELPAY === 'true' && (metodoPago === 'tarjeta' || selectedMethod?.type === 'tarjeta');
    const chargeAmount = isCardPayment && paymentType === 'full' ? orderTotal : anticipo;

    // Validación de secciones
    const isContactFilled = Boolean(
        formData.nombre.trim() &&
        formData.correo.includes('@') &&
        formData.telefono.replace(/\D/g, '').length >= 8
    );

    const isShippingFilled = Boolean(
        formData.departamento &&
        formData.municipio &&
        formData.direccion.trim().length >= 5
    );

    // 🚀 Despliegue progresivo interactivo (solo una vez de forma automática, sin bloquear al usuario)
    const autoOpenedShipping = useRef(false);
    const autoOpenedPayment = useRef(false);

    // Al completar correo y contacto, se despliega Lugar de Entrega por primera vez
    useEffect(() => {
        if (isContactFilled && !autoOpenedShipping.current) {
            autoOpenedShipping.current = true;
            setShippingOpen(true);
        }
    }, [isContactFilled]);

    // Función segura para desplegar Pago cuando el cliente termina su dirección (en blur o tras terminar)
    const handleShippingComplete = () => {
        if (isShippingFilled && !autoOpenedPayment.current) {
            autoOpenedPayment.current = true;
            setPaymentOpen(true);
        }
    };

    const isFormValid = Boolean(
        formData.nombre.trim() &&
        formData.correo.trim() &&
        formData.telefono.trim() &&
        formData.direccion.trim() &&
        formData.departamento.trim() &&
        formData.municipio.trim() &&
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

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

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

        if (!validateForm(metodoPago, aceptoTerminos)) {
            if (!isContactFilled) {
                const el = document.getElementById('section-contacto');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else if (!isShippingFilled) {
                setShippingOpen(true);
                const el = document.getElementById('section-entrega');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                setPaymentOpen(true);
                const el = document.getElementById('section-pago');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            return;
        }

        submitLock.current = true;
        setIsSubmitting(true);

        try {
            const orderPayload = buildOrderPayload();

            // 💳 Flujo especial de Pasarela de Pagos (PixelPay Hosted)
            if (isCardPayment) {
                const response = await fetch('/api/checkout/pixelpay/initiate-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderPayload,
                        paymentType,
                    }),
                });

                const result = await response.json();

                if (!response.ok || !result.success || !result.redirect_url) {
                    console.error('❌ PixelPay Error Details:', result);
                    throw new Error(result.error || 'No se pudo iniciar el cobro con tarjeta vía PixelPay');
                }

                setOrderSuccess(true);
                clearCart();
                toastMsg.celebrate('¡Conectando con PixelPay!');
                window.location.href = result.redirect_url;
                return;
            }

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

            const orderKey = String(result.order_id || result.order_number || '');
            if (orderKey) {
                trackPurchaseOnce(orderKey, {
                    order_id: result.order_id,
                    order_number: result.order_number,
                    total: result.total,
                    item_count: items.length,
                    payment_method: metodoPago,
                });
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

    if (items.length === 0 && !orderSuccess) {
        return <EmptyCartState />;
    }

    return (
        <main className="min-h-dvh bg-[#07080a] text-white pt-24 pb-36 lg:pb-24 px-4 sm:px-6 relative overflow-hidden">
            {/* ✨ Apple-style ambient glows */}
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/[0.04] blur-[150px] -z-10 pointer-events-none" />
            <div className="absolute bottom-1/3 right-0 w-[500px] h-[500px] bg-primary/[0.03] blur-[140px] -z-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto">
                {/* 🔙 Botón Volver & Badge de Seguridad */}
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group cursor-pointer active:scale-[0.98]"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-bold uppercase tracking-widest">Volver a la tienda</span>
                    </button>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-bold uppercase tracking-wider">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Checkout Seguro</span>
                    </div>
                </div>

                {/* 🏷️ Header Principal */}
                <header className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase leading-none text-white">
                        Finalizar Pedido
                    </h1>
                    <p className="text-zinc-400 mt-1 font-medium text-xs sm:text-sm">
                        Ingresa tus datos de entrega y selecciona tu forma de pago.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-8">
                    {/* 🧾 COLUMNA IZQUIERDA: FORMULARIO INTERACTIVO COLAPSABLE */}
                    <div className="lg:col-span-7 space-y-4">
                        {/* 1. Información de Contacto: Siempre visible */}
                        <PersonalInfoSection
                            formData={formData}
                            errores={errores}
                            onChange={handleChange}
                            onBlur={handleBlur}
                        />

                        {/* 2. Lugar de Entrega: Colapsable interactivo con auto-despliegue */}
                        <ShippingDetailsSection
                            formData={formData}
                            errores={errores}
                            uniqueDepartments={uniqueDepartments}
                            municipalities={municipalities}
                            onDepartmentChange={handleDepartmentChange}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            onDetectLocation={detectLocation}
                            isOpen={shippingOpen}
                            onToggle={() => setShippingOpen((prev) => !prev)}
                            onShippingComplete={handleShippingComplete}
                        />

                        {/* 3. Método de Pago: Colapsable interactivo con auto-despliegue */}
                        <PaymentMethodSection
                            metodoPago={metodoPago}
                            setMetodoPago={setMetodoPago}
                            paymentMethods={paymentMethods}
                            bankAccounts={bankAccounts}
                            paymentType={paymentType}
                            setPaymentType={setPaymentType}
                            depositAmount={anticipo}
                            fullAmount={orderTotal}
                            isOpen={paymentOpen}
                            onToggle={() => setPaymentOpen((prev) => !prev)}
                        />
                    </div>

                    {/* 🛒 COLUMNA DERECHA: RESUMEN LATERAL (DESKTOP) */}
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
                            paymentType={paymentType}
                            setPaymentType={setPaymentType}
                            paymentMethods={paymentMethods}
                        />
                    </div>
                </div>
            </div>

            {/* 📱 BARRA INFERIOR FIJA PARA MÓVILES */}
            <MobileCheckoutBar
                total={total}
                anticipo={anticipo}
                chargeAmount={chargeAmount}
                paymentType={paymentType}
                isCard={isCardPayment}
                isSubmitting={isSubmitting}
                isFormValid={isFormValid}
                metodoPago={metodoPago}
                aceptoTerminos={aceptoTerminos}
                onSubmit={handleSubmit}
                items={items}
                shippingCost={shippingCost}
                discountAmount={discountAmount}
            />
        </main>
    );
}
