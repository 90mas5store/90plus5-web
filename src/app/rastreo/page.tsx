"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "@/lib/motion";
import { Search, Package, MapPin, Calendar, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import Button from "@/components/ui/MainButton";
import ProductImage from "@/components/ProductImage";
import { formatDate } from "@/lib/utils";

function TrackingContent() {
    const searchParams = useSearchParams();
    const [orderId, setOrderId] = useState(searchParams.get("order") || "");
    const [loading, setLoading] = useState(false);
    const [orderData, setOrderData] = useState<any>(null);
    const [error, setError] = useState("");

    // Auto-search if URL has order param
    useEffect(() => {
        const urlOrderId = searchParams.get("order");
        if (urlOrderId) {
            setOrderId(urlOrderId);
            fetchOrder(urlOrderId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const fetchOrder = async (id: string) => {
        if (!id.trim()) return;

        setLoading(true);
        setError("");
        setOrderData(null);

        try {
            const res = await fetch(`/api/orders/track?id=${id.trim()}`);
            const data = await res.json();

            if (data.success) {
                setOrderData(data.order);
            } else {
                setError(data.error || "No encontramos ese pedido.");
            }
        } catch (err) {
            setError("Ocurrió un error al buscar. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        fetchOrder(orderId);
    };

    return (
        <div className="max-w-xl mx-auto relative z-10">
            {/* Same JSX content as before... */}
            <div className="text-center mb-6 md:mb-8">
                <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-3 md:mb-4">
                    RASTREA TU PEDIDO
                </h1>
                <p className="text-gray-400 text-sm md:text-base">
                    Ingresa el ID que recibiste en tu correo para ver el estado en tiempo real.
                </p>
            </div>

            <form onSubmit={handleTrack} className="mb-12">
                <div className="relative group">
                    <input
                        type="text"
                        placeholder="Ej. a0eebc99-9c..."
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 md:py-4 pl-10 md:pl-12 pr-4 text-sm md:text-base text-white placeholder:text-gray-600 focus:border-primary focus:bg-white/10 outline-none transition-all font-mono"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <Button
                            disabled={loading || !orderId}
                            className="!py-2 !px-4 text-xs !rounded-xl"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
            </form>

            <AnimatePresence mode="wait">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 md:p-6 text-center text-red-400 flex flex-col items-center gap-2"
                    >
                        <AlertCircle className="w-8 h-8" />
                        <p className="font-bold">{error}</p>
                    </motion.div>
                )}

                {orderData && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Card de Estado Principal */}
                        <div className="bg-[#111] border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
                                <div
                                    className="h-full bg-primary transition-all duration-1000 ease-out"
                                    style={{ width: `${orderData.status.progress}%` }}
                                />
                            </div>

                            <div className="flex flex-col items-center text-center gap-3 md:gap-4 py-3 md:py-4">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                                    <Package className="w-8 h-8 md:w-10 md:h-10" />
                                </div>
                                <div>
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white mb-2">
                                        {orderData.status.label}
                                    </h2>
                                    <p className="text-gray-400 max-w-xs mx-auto text-xs md:text-sm">
                                        {orderData.status.desc}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Detalles */}
                        <div className="bg-white/5 border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-6 space-y-3 md:space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3 md:mb-4">Detalles del Envío</h3>

                            <div className="flex items-start gap-3 md:gap-4">
                                <MapPin className="w-4 h-4 md:w-5 md:h-5 text-gray-400 mt-1" />
                                <div>
                                    <p className="font-bold text-white text-sm md:text-base">Destino</p>
                                    <p className="text-gray-400 text-xs md:text-sm">{orderData.location}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 md:gap-4">
                                <Calendar className="w-4 h-4 md:w-5 md:h-5 text-gray-400 mt-1" />
                                <div>
                                    <p className="font-bold text-white text-sm md:text-base">Fecha de Orden</p>
                                    <p className="text-gray-400 text-xs md:text-sm">
                                        {formatDate(orderData.date)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Productos */}
                        <div className="space-y-3">
                            {orderData.items.map((item: any, i: number) => (
                                <div key={i} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/50 relative flex-shrink-0">
                                        <ProductImage
                                            src={item.image}
                                            alt={item.product}
                                            width={64}
                                            height={64}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-sm">{item.team} - {item.product}</p>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">
                                            {item.version} {item.personalization && `• ${item.personalization}`}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function TrackingPage() {
    return (
        <main className="min-h-screen pt-20 md:pt-24 pb-12 px-4 bg-black text-white relative overflow-hidden">
            {/* Background Aura */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

            <Suspense fallback={<div className="text-center mt-20 text-gray-500">Cargando...</div>}>
                <TrackingContent />
            </Suspense>
        </main>
    )
}
