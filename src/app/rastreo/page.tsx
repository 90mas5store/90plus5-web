"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { m as motion, AnimatePresence } from "@/lib/motion";
import { AlertCircle, RotateCcw } from "lucide-react";
import type { TrackingOrder } from "@/components/rastreo/TrackingTypes";
import TrackingSearchBar from "@/components/rastreo/TrackingSearchBar";
import TrackingHeroStatus from "@/components/rastreo/TrackingHeroStatus";
import TrackingTimeline from "@/components/rastreo/TrackingTimeline";
import TrackingOrderItems from "@/components/rastreo/TrackingOrderItems";
import TrackingBillingCard from "@/components/rastreo/TrackingBillingCard";
import TrackingInfoGuide from "@/components/rastreo/TrackingInfoGuide";

function TrackingContent() {
    const searchParams = useSearchParams();
    const [orderId, setOrderId] = useState(searchParams.get("order") || "");
    const [loading, setLoading] = useState(false);
    const [orderData, setOrderData] = useState<TrackingOrder | null>(null);
    const [error, setError] = useState("");

    const fetchOrder = useCallback(async (id: string) => {
        const cleanId = id.trim().replace(/^#/, "");
        if (!cleanId) return;

        setLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/orders/track?id=${encodeURIComponent(cleanId)}`);
            const data = await res.json();

            if (data.success && data.order) {
                setOrderData(data.order);
                // Sincronizar URL sin recargar para que el usuario pueda compartir o recargar
                if (typeof window !== "undefined") {
                    const url = new URL(window.location.href);
                    url.searchParams.set("order", cleanId);
                    window.history.replaceState({}, "", url.toString());
                }
            } else {
                setOrderData(null);
                setError(data.error || "No encontramos ningún pedido con ese identificador.");
            }
        } catch {
            setOrderData(null);
            setError("Ocurrió un error al consultar el servidor. Por favor intenta de nuevo en unos momentos.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Búsqueda automática inicial si la URL contiene parámetro ?order=
    useEffect(() => {
        const urlOrderId = searchParams.get("order");
        if (urlOrderId) {
            setOrderId(urlOrderId);
            fetchOrder(urlOrderId);
        }
    }, [searchParams, fetchOrder]);

    const handleReset = () => {
        setOrderId("");
        setOrderData(null);
        setError("");
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.delete("order");
            window.history.replaceState({}, "", url.toString());
        }
    };

    return (
        <div className="max-w-6xl mx-auto relative z-10">
            {/* Cabecera Principal */}
            <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
                {/* Badge de Estado del Sistema */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono tracking-widest text-primary mb-4 backdrop-blur-md shadow-inner">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                    </span>
                    <span>SEGUIMIENTO EN TIEMPO REAL · LOGÍSTICA OFICIAL</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase leading-tight">
                    Rastreo de <span className="text-primary">Pedido</span>
                </h1>

                <p className="text-white/60 text-xs sm:text-sm md:text-base mt-2.5 leading-relaxed">
                    Consulta el estado de tu camiseta en cada etapa del partido: desde la validación de tu anticipo y confección de élite hasta el despacho final.
                </p>
            </div>

            {/* Buscador de Pedido */}
            <TrackingSearchBar
                orderId={orderId}
                setOrderId={setOrderId}
                onSearch={fetchOrder}
                loading={loading}
            />

            {/* Alerta de Error si no se encuentra */}
            <AnimatePresence mode="wait">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        className="max-w-xl mx-auto mt-6 bg-red-500/10 border border-red-500/25 rounded-2xl p-4 sm:p-5 text-center text-red-400 flex flex-col items-center gap-2.5 backdrop-blur-md shadow-lg"
                    >
                        <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
                        <p className="text-xs sm:text-sm font-bold text-white">{error}</p>
                        <p className="text-[11px] text-white/55">
                            Verifica que hayas ingresado los 8 caracteres iniciales o el código completo que recibiste por correo electrónico.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Resultado del Rastreo */}
            <AnimatePresence mode="wait">
                {orderData && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="mt-8 sm:mt-10 space-y-6 sm:space-y-8"
                    >
                        {/* Botón de Nueva Búsqueda */}
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white/50 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition-all active:scale-95"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Rastrear otro pedido</span>
                            </button>
                        </div>

                        {/* Marcador Hero con Estado y Progreso */}
                        <TrackingHeroStatus order={orderData} />

                        {/* Bento Grid: 2 Columnas (Izquierda: Timeline / Derecha: Productos y Finanzas) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            {/* Columna Izquierda (7 cols): Bitácora y Logística */}
                            <div className="lg:col-span-7 space-y-6">
                                <TrackingTimeline
                                    history={orderData.history}
                                    currentStatus={orderData.status}
                                    location={orderData.location}
                                />
                            </div>

                            {/* Columna Derecha (5 cols): Prendas y Estado Financiero */}
                            <div className="lg:col-span-5 space-y-6">
                                <TrackingOrderItems items={orderData.items} />
                                <TrackingBillingCard
                                    billing={orderData.billing}
                                    orderId={orderData.id}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Guía Informativa (Visible si no hay pedido buscado aún) */}
            {!orderData && !loading && <TrackingInfoGuide />}
        </div>
    );
}

export default function TrackingPage() {
    return (
        <main
            style={{ paddingTop: "calc(var(--header-height, 4.5rem) + 1.75rem)" }}
            className="min-h-dvh bg-[#07080a] text-white relative overflow-hidden pb-20 md:pb-28 px-4 sm:px-6"
        >
            {/* Hairline specular superior */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            {/* Resplandor ambiental de fondo */}
            <div
                className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[450px] bg-primary/10 blur-[140px] rounded-full pointer-events-none"
                aria-hidden="true"
            />
            <div
                className="absolute top-80 right-0 w-[300px] h-[300px] bg-red-600/5 blur-[100px] rounded-full pointer-events-none"
                aria-hidden="true"
            />

            <Suspense
                fallback={
                    <div className="max-w-6xl mx-auto text-center py-24 text-white/50 text-sm">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p>Cargando centro de seguimiento...</p>
                    </div>
                }
            >
                <TrackingContent />
            </Suspense>
        </main>
    );
}
