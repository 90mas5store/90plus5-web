"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
    ChevronRight,
    MapPin,
    CreditCard,
    Building2,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    ShoppingBag,
    User,
    Mail,
    Phone,
    Truck
} from "lucide-react";
import MainButton from "../../components/ui/MainButton";
import { useCart } from "../../context/CartContext";
import useToastMessage from "../../hooks/useToastMessage";
import { getShippingZones } from "../../lib/api";
import { ShippingZone } from "../../lib/types";
import { BUSINESS_LOGIC } from "../../lib/constants";

// 📝 Interfaces
interface FormData {
    nombre: string;
    correo: string;
    telefono: string;
    direccion: string;
    departamento: string;
    municipio: string;
    description?: string; // Honeypot field (hidden)
}

interface FormErrors {
    nombre?: boolean;
    correo?: boolean;
    telefono?: boolean;
    direccion?: boolean;
    departamento?: boolean;
    municipio?: boolean;
    metodoPago?: boolean;
}



// Interface para el payload de la orden (alineado con backend)
interface CreateOrderPayload {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    shipping_department: string;
    shipping_municipality: string;
    shipping_address: string;
    payment_method: string;
    items: Array<{
        product_id: string;
        variant_id: string | null;
        size_id: string | null;
        patch_id: string | null;
        quantity: number;
        unit_price: number;
        personalization_type: 'none' | 'player' | 'custom';
        player_id: string | null; // UUID
        custom_number: number | null;
        custom_name: string | null;
    }>;
    _honey?: string; // Honeypot
}

interface OrderResponse {
    success: boolean;
    order_id?: string;
    order_number?: string;
    total: number;
    deposit: number;
    payment_id?: string;
    error?: string;
}

// Interface manual para el hook JS
interface ToastHook {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
    warning: (msg: string) => void;
    celebrate: (msg: string) => void;
    location: (msg: string) => void;
    dismiss: (id?: string) => void;
    loading: (msg: string) => void;
}

export default function CheckoutPage() {
    const router = useRouter();
    const { items, total, clearCart } = useCart();
    const toastMsg = useToastMessage() as ToastHook;

    const [formData, setFormData] = useState<FormData>({
        nombre: "",
        correo: "",
        telefono: "",
        direccion: "",
        departamento: "",
        municipio: "",
        description: "", // Init honeypot
    });

    const [metodoPago, setMetodoPago] = useState("");
    const [aceptoTerminos, setAceptoTerminos] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errores, setErrores] = useState<FormErrors>({});

    const anticipo = total * BUSINESS_LOGIC.ORDER.DEPOSIT_PERCENTAGE;


    // Estado para zonas dinámicas
    const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);

    // Obtener zonas únicas (departamentos) para el select
    const uniqueDepartments = Array.from(new Set(shippingZones.map(z => z.department))).sort();

    // Obtener municipios filtrados por departamento seleccionado
    const municipalities = shippingZones
        .filter(z => z.department === formData.departamento)
        .map(z => z.municipality);

    // 📍 Cargar datos (Sin geolocalización automática forzada al inicio, solo si ya tiene permisos)
    useEffect(() => {
        getShippingZones().then(zones => {
            setShippingZones(zones);
        });
    }, []);

    // 📍 Lógica de Geolocalización Reutilizable
    const detectLocation = () => {
        if (typeof navigator === 'undefined' || !("geolocation" in navigator)) {
            toastMsg.error("Tu navegador no soporta geolocalización.");
            return;
        }

        toastMsg.loading("Detectando ubicación...");

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                let masCercano: ShippingZone | null = null;
                let menorDist = Infinity;

                // Solo consideramos zonas que tengan coordenadas
                const zonasConCoords = shippingZones.filter(z => z.latitude && z.longitude);

                for (const zona of zonasConCoords) {
                    const d = Math.sqrt(
                        Math.pow(latitude - (zona.latitude || 0), 2) +
                        Math.pow(longitude - (zona.longitude || 0), 2)
                    );

                    if (d < menorDist) {
                        menorDist = d;
                        masCercano = zona;
                    }
                }

                if (masCercano) {
                    toastMsg.success(`Ubicación: ${masCercano.municipality}, ${masCercano.department}`);
                    setFormData((prev) => ({
                        ...prev,
                        departamento: masCercano!.department,
                        municipio: masCercano!.municipality,
                    }));
                } else {
                    toastMsg.info("No encontramos una zona cercana. Selecciona manualmente.");
                }
            },
            (err) => {
                console.warn("Geolocation error:", err);
                if (err.code === err.PERMISSION_DENIED) {
                    toastMsg.error("Permiso denegado. Actívalo en el navegador.");
                } else {
                    toastMsg.error("No se pudo detectar la ubicación.");
                }
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    };

    // Auto-detect si ya hay permiso (silent)
    useEffect(() => {
        if (shippingZones.length > 0 && typeof navigator !== 'undefined' && "geolocation" in navigator) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                if (result.state === 'granted') {
                    detectLocation();
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shippingZones]);


    // 📍 Efecto de Geolocalización


    // === VALIDACIÓN ===
    const validate = (): boolean => {
        const newErrors: FormErrors = {};
        const telRegex = /^[0-9]{4}-[0-9]{4}$/;

        if (!formData.nombre.trim()) newErrors.nombre = true;
        if (!formData.correo.includes("@")) newErrors.correo = true;
        if (!telRegex.test(formData.telefono)) newErrors.telefono = true;
        if (!formData.direccion.trim()) newErrors.direccion = true;
        if (!formData.departamento) newErrors.departamento = true;
        if (!formData.municipio) newErrors.municipio = true;
        if (!metodoPago.trim()) newErrors.metodoPago = true;
        if (!aceptoTerminos) {
            toastMsg.warning("Debes aceptar los términos y condiciones");
            return false;
        }

        setErrores(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // === INPUT HANDLER ===
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === "telefono") {
            const digits = value.replace(/\D/g, "").slice(0, 8);
            const formatted = digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
            setFormData({ ...formData, telefono: formatted });
            return;
        }
        setFormData((prev) => ({ ...prev, [name]: value as string }));
    };

    // === SUBMIT ===
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toastMsg.warning("Completa todos los campos obligatorios");
            return;
        }

        if (metodoPago === "tarjeta") {
            toastMsg.info("Esta función estará disponible próximamente");
            return;
        }

        setIsSubmitting(true);

        try {
            // 🎯 MAPEAR ITEMS DEL CARRITO AL FORMATO SUPABASE
            const itemsPayload = items.map((item) => {
                // Determinar tipo de personalización
                let personalizationType: 'none' | 'player' | 'custom' = 'none';
                let playerId: string | null = null;
                let customNumber: number | null = null;
                let customName: string | null = null;

                if (item.dorsalNumero || item.dorsalNombre) {
                    if (item.player_id) {
                        // Es jugador real
                        personalizationType = 'player';
                        playerId = item.player_id;
                    } else {
                        // Es custom
                        personalizationType = 'custom';
                        customNumber = item.dorsalNumero ? parseInt(item.dorsalNumero, 10) : null;
                        customName = item.dorsalNombre || null;
                    }
                }

                // Retornar objeto tipado
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

            // 🚀 Payload Final
            const orderPayload: CreateOrderPayload = {
                customer_name: formData.nombre,
                customer_email: formData.correo,
                customer_phone: BUSINESS_LOGIC.CONTACT.PHONE_PREFIX + formData.telefono.replace("-", ""),
                shipping_department: formData.departamento,
                shipping_municipality: formData.municipio,
                shipping_address: formData.direccion,
                payment_method: metodoPago,
                items: itemsPayload,
                _honey: formData.description, // Enviar honeypot
            };

            const response = await fetch('/api/orders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                console.error("❌ Server Error Details:", result);
                throw new Error(result.details || result.error || 'Error desconocido al crear la orden');
            }

            // ✅ ORDEN CREADA EXITOSAMENTE
            clearCart();
            toastMsg.celebrate("¡Pedido registrado correctamente!");

            // Redirigir a página de confirmación
            const query = new URLSearchParams({
                orderId: result.order_number || '',
                metodo: metodoPago,
                nombre: formData.nombre,
                total: result.total.toFixed(2),
                anticipo: result.deposit.toFixed(2),
                municipio: formData.municipio,
                departamento: formData.departamento,
            }).toString();

            router.push(`/checkout/done?${query}`);

        } catch (error: any) {
            console.error('Checkout error:', error);
            toastMsg.error(error.message || "Error al procesar el pedido. Intenta nuevamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // === UI ===
    if (items.length === 0) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white px-6">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/10 mb-6">
                    <ShoppingBag className="w-12 h-12 text-gray-600" />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Tu carrito está vacío</h2>
                <p className="text-gray-500 mb-8 text-center max-w-xs">Parece que aún no has añadido nada a tu pedido.</p>
                <MainButton onClick={() => router.push("/catalogo")} className="px-10 py-4 font-black tracking-widest">
                    VOLVER AL CATÁLOGO
                </MainButton>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-20 px-4 sm:px-6 relative overflow-hidden">
            {/* ✨ Background Glows */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] -z-10" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] -z-10" />

            <div className="max-w-7xl mx-auto">
                {/* 🔙 Back Link */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest">Volver</span>
                </button>

                <header className="mb-8 md:mb-12">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">Finalizar Pedido</h1>
                    <p className="text-gray-500 mt-2 font-medium text-sm md:text-base">Completa tus datos para procesar tu orden.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12">

                    {/* 🧾 COLUMNA IZQUIERDA: FORMULARIO */}
                    <div className="lg:col-span-7 space-y-6 md:space-y-8">

                        {/* SECCIÓN 1: DATOS PERSONALES */}
                        <section className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                            <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center border border-primary/20">
                                    <User className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                                </div>
                                <h2 className="text-lg md:text-xl font-black uppercase tracking-tight">Información Personal</h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Nombre Completo *</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                        <input
                                            name="nombre"
                                            value={formData.nombre}
                                            onChange={handleChange}
                                            placeholder="Ej. Juan Pérez"
                                            className={`w-full pl-12 pr-4 py-4 rounded-2xl bg-black/40 border ${errores.nombre ? "border-red-500/50" : "border-white/10"
                                                } focus:border-primary/50 outline-none text-white transition-all font-medium`}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Correo Electrónico *</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                        <input
                                            type="email"
                                            name="correo"
                                            value={formData.correo}
                                            onChange={handleChange}
                                            placeholder="juan@ejemplo.com"
                                            className={`w-full pl-12 pr-4 py-4 rounded-2xl bg-black/40 border ${errores.correo ? "border-red-500/50" : "border-white/10"
                                                } focus:border-primary/50 outline-none text-white transition-all font-medium`}
                                        />
                                    </div>
                                </div>

                                {/* 🍯 HONEYPOT (Invisible para humanos) */}
                                <div className="hidden absolute opacity-0 -z-50 h-0 w-0 overflow-hidden">
                                    <label htmlFor="description">Business Address</label>
                                    <input
                                        type="text"
                                        id="description"
                                        name="description"
                                        value={formData.description || ''}
                                        onChange={handleChange}
                                        tabIndex={-1}
                                        autoComplete="off"
                                    />
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Teléfono de Contacto *</label>
                                    <div className="relative flex items-center">
                                        <div className="absolute left-3 sm:left-4 flex items-center gap-1 sm:gap-2 text-gray-500 border-r border-white/10 pr-2 sm:pr-3">
                                            <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                                            <span className="text-xs sm:text-sm font-bold">{BUSINESS_LOGIC.CONTACT.PHONE_PREFIX}</span>
                                        </div>
                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            maxLength={9}
                                            name="telefono"
                                            value={formData.telefono}
                                            onChange={handleChange}
                                            placeholder="0000-0000"
                                            className={`w-full pl-20 sm:pl-24 pr-4 py-4 rounded-2xl bg-black/40 border ${errores.telefono ? "border-red-500/50" : "border-white/10"
                                                } focus:border-primary/50 outline-none text-white transition-all font-medium tracking-widest`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* SECCIÓN 2: ENTREGA */}
                        <section className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                                    <MapPin className="w-6 h-6 text-primary" />
                                </div>
                                <h2 className="text-xl font-black uppercase tracking-tight">Detalles de Entrega</h2>
                            </div>

                            {/* 📍 BOTÓN DE GEOLOCALIZACIÓN MANUAL */}
                            <div className="mb-6">
                                <button
                                    onClick={detectLocation}
                                    type="button"
                                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary hover:text-primary-light transition-colors p-2 hover:bg-primary/5 rounded-lg border border-transparent hover:border-primary/20"
                                >
                                    <MapPin className="w-4 h-4" />
                                    <span>Usar mi ubicación actual</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Departamento *</label>
                                    <select
                                        name="departamento"
                                        value={formData.departamento}
                                        onChange={(e) =>
                                            setFormData(prev => ({ ...prev, departamento: e.target.value, municipio: "" }))
                                        }
                                        className={`w-full px-4 py-4 rounded-2xl bg-black/40 border ${errores.departamento ? "border-red-500/50" : "border-white/10"
                                            } text-white focus:border-primary/50 outline-none transition-all font-medium appearance-none`}
                                    >
                                        <option value="" className="bg-[#0a0a0a]">Selecciona...</option>
                                        {uniqueDepartments.map((dep) => (
                                            <option key={dep} value={dep} className="bg-[#0a0a0a]">
                                                {dep}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Municipio *</label>
                                    <select
                                        name="municipio"
                                        value={formData.municipio}
                                        onChange={handleChange}
                                        disabled={!formData.departamento}
                                        className={`w-full px-4 py-4 rounded-2xl bg-black/40 border ${errores.municipio ? "border-red-500/50" : "border-white/10"
                                            } text-white focus:border-primary/50 outline-none transition-all font-medium appearance-none disabled:opacity-30`}
                                    >
                                        <option value="" className="bg-[#0a0a0a]">Selecciona...</option>
                                        {formData.departamento &&
                                            municipalities.map((mun) => (
                                                <option key={mun} value={mun} className="bg-[#0a0a0a]">
                                                    {mun}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Dirección Exacta *</label>
                                    <div className="relative">
                                        <Truck className="absolute left-4 top-5 w-4 h-4 text-gray-600" />
                                        <textarea
                                            name="direccion"
                                            rows={3}
                                            value={formData.direccion}
                                            onChange={handleChange}
                                            placeholder="Barrio, calle, número de casa, puntos de referencia..."
                                            className={`w-full pl-12 pr-4 py-4 rounded-2xl bg-black/40 border ${errores.direccion ? "border-red-500/50" : "border-white/10"
                                                } focus:border-primary/50 outline-none text-white transition-all font-medium resize-none`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* SECCIÓN 3: PAGO */}
                        <section className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                                    <CreditCard className="w-6 h-6 text-primary" />
                                </div>
                                <h2 className="text-xl font-black uppercase tracking-tight">Método de Pago</h2>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {[
                                    { id: "transferencia", label: "Transferencia Bancaria", icon: Building2, desc: "Paga el 50% de anticipo vía transferencia.", disabled: false },
                                    { id: "tarjeta", label: "Tarjeta de Crédito / Débito", icon: CreditCard, desc: "Pago seguro en línea.", disabled: true }
                                ].map((opt) => (
                                    <label
                                        key={opt.id}
                                        className={`group relative flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer overflow-hidden ${metodoPago === opt.id
                                            ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(229,9,20,0.15)]"
                                            : "border-white/5 bg-black/40 hover:border-white/20"
                                            } ${opt.disabled ? "opacity-60" : ""}`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${metodoPago === opt.id ? "bg-primary text-white" : "bg-white/5 text-gray-500 group-hover:text-white"
                                            }`}>
                                            <opt.icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-black uppercase tracking-tight text-sm">{opt.label}</span>
                                                {opt.disabled && (
                                                    <span className="text-[8px] bg-white/10 px-2 py-0.5 rounded-full text-gray-400 font-bold tracking-widest">PRÓXIMAMENTE</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 font-medium">{opt.desc}</p>
                                        </div>
                                        <input
                                            type="radio"
                                            name="metodoPago"
                                            value={opt.id}
                                            checked={metodoPago === opt.id}
                                            onChange={(e) => setMetodoPago(e.target.value)}
                                            className="hidden"
                                            disabled={opt.disabled}
                                        />
                                        {metodoPago === opt.id && (
                                            <motion.div layoutId="check" className="absolute right-6">
                                                <CheckCircle2 className="w-6 h-6 text-primary" />
                                            </motion.div>
                                        )}
                                    </label>
                                ))}
                            </div>

                            <AnimatePresence>
                                {metodoPago === "tarjeta" && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="mt-6 p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-3"
                                    >
                                        <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold text-white uppercase tracking-tight">Función no disponible</p>
                                            <p className="text-xs text-gray-400 mt-1">Estamos trabajando para integrar pagos con tarjeta. Por favor, selecciona otro método de pago por ahora.</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </section>
                    </div>

                    {/* 🛒 COLUMNA DERECHA: RESUMEN */}
                    <div className="lg:col-span-5">
                        <div className="sticky top-28 space-y-8">
                            <section className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-black uppercase tracking-tight">Tu Pedido</h2>
                                    <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        {items.length} {items.length === 1 ? 'Ítem' : 'Ítems'}
                                    </span>
                                </div>

                                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar mb-8">
                                    {items.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 group">
                                            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-black border border-white/5 shrink-0">
                                                <Image src={item.imagen} alt={item.equipo} fill className="object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-black text-white uppercase truncate tracking-tight">{item.equipo}</h3>
                                                <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-0.5">{item.modelo}</p>
                                                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                                                    {item.version && <span className="text-[9px] text-gray-500 font-bold uppercase">{item.version}</span>}
                                                    {item.talla && <span className="text-[9px] text-gray-500 font-bold uppercase">Talla {item.talla}</span>}
                                                </div>
                                                {(item.dorsalNombre || item.dorsalNumero) && (
                                                    <div className="mt-1 flex items-center gap-1.5">
                                                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                                                        <span className="text-[9px] font-black text-white uppercase">Dorsal: {item.dorsalNumero || ''} · {item.dorsalNombre || ''}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-white">L{item.precio.toLocaleString()}</p>
                                                <p className="text-[10px] text-gray-500 font-bold mt-1">x{item.cantidad}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-4 pt-6 border-t border-white/5">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500">
                                        <span>Subtotal</span>
                                        <span className="text-white">L{total.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500">
                                        <span>Envío</span>
                                        <span className="text-green-500">Gratis</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-white uppercase tracking-tighter">Total a Pagar</span>
                                            <span className="text-[10px] text-primary font-bold uppercase tracking-widest">Anticipo del {BUSINESS_LOGIC.ORDER.DEPOSIT_PERCENTAGE * 100}% requerido</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-3xl font-black text-white tracking-tighter">L{total.toLocaleString()}</p>
                                            <p className="text-sm font-black text-primary drop-shadow-[0_0_10px_rgba(229,9,20,0.3)]">Anticipo: L{anticipo.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>


                                <div className="mt-8 mb-4">
                                    <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                                        <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all ${aceptoTerminos ? 'bg-primary border-primary' : 'border-white/20 bg-black/40 group-hover:border-white/40'}`}>
                                            {aceptoTerminos && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={aceptoTerminos}
                                            onChange={(e) => setAceptoTerminos(e.target.checked)}
                                        />
                                        <p className="text-xs text-gray-500 font-medium leading-relaxed select-none">
                                            He leído y acepto los <a href="/legal/terminos" target="_blank" className="text-white hover:text-primary underline decoration-white/30 hover:decoration-primary underline-offset-2 transition-colors" onClick={(e) => e.stopPropagation()}>términos de servicio</a> y <a href="/legal/privacidad" target="_blank" className="text-white hover:text-primary underline decoration-white/30 hover:decoration-primary underline-offset-2 transition-colors" onClick={(e) => e.stopPropagation()}>políticas de privacidad</a>.
                                        </p>
                                    </label>
                                </div>

                                <MainButton
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !metodoPago || metodoPago === "tarjeta" || !aceptoTerminos}
                                    className="w-full py-5 bg-primary hover:bg-primary-dark text-white font-black rounded-2xl shadow-[0_20px_40px_rgba(229,9,20,0.25)] flex items-center justify-center gap-3 group disabled:opacity-50 disabled:grayscale transition-all disabled:cursor-not-allowed"
                                >
                                    <span>{isSubmitting ? "PROCESANDO..." : "CONFIRMAR PEDIDO"}</span>
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </MainButton>
                            </section>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
