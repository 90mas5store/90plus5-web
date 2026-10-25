"use client";

import { useState } from "react";
import { Package, Copy, Check, MapPin, Calendar, CheckCircle2, Plane, Clock, ShieldCheck, Trophy, Sparkles, User } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { TrackingOrder } from "./TrackingTypes";

interface TrackingHeroStatusProps {
    order: TrackingOrder;
}

export default function TrackingHeroStatus({ order }: TrackingHeroStatusProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!order.id) return;
        navigator.clipboard.writeText(order.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isCancelled = order.status.code?.toLowerCase().includes("cancel");
    const progress = Math.min(100, Math.max(0, order.status.progress || 0));

    // Mapeo de fases de alto nivel para el stepper visual
    const phases = [
        { name: "Confirmación", minProgress: 12, icon: ShieldCheck },
        { name: "Confección", minProgress: 37, icon: Sparkles },
        { name: "En Tránsito a HN", minProgress: 50, icon: Plane },
        { name: "Entrega Final", minProgress: 87, icon: Trophy },
    ];

    // Status icon selector
    const getStatusIcon = () => {
        if (isCancelled) return Clock;
        if (progress >= 100) return Trophy;
        if (progress >= 87) return Package;
        if (progress >= 50) return Plane;
        if (progress >= 37) return Sparkles;
        if (progress >= 25) return ShieldCheck;
        return Package;
    };

    const StatusIcon = getStatusIcon();

    return (
        <div className="w-full space-y-4">
            {/* Meta Bar: ID, Comprador, Fecha, Destino */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
                {/* ID de la orden con botón de copia + Nombre del Comprador */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">Pedido</span>
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white font-mono text-xs font-bold transition-all active:scale-95 group"
                            title="Copiar ID de pedido"
                        >
                            <span>#{order.id.slice(0, 8)}</span>
                            {copied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                                <Copy className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                            )}
                            {copied && <span className="text-[10px] text-emerald-400 font-sans font-semibold">¡Copiado!</span>}
                        </button>
                    </div>

                    {order.customer_name && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white">
                            <User className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Comprador:</span>
                            <span className="text-xs font-bold text-white tracking-tight">{order.customer_name}</span>
                        </div>
                    )}
                </div>

                {/* Fecha y Destino */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-white/60">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-white/40" />
                        <span>{formatDate(order.date, false)}</span>
                    </div>
                    {order.location && (
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            <span className="font-medium text-white/80">{order.location}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Marcador Principal de Estado (Hero Card Apple Sports) */}
            <div className="relative rounded-3xl bg-gradient-to-b from-[#11131a] via-[#0b0c10] to-[#07080a] border border-white/[0.09] p-6 sm:p-8 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
                {/* Specular hairline superior */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

                {/* Resplandor ambiental de acento */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/15 blur-[80px] rounded-full pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    {/* Bloque Izquierdo: Icono + Título + Narrativa */}
                    <div className="flex items-start gap-4 sm:gap-5">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-inner">
                            <StatusIcon className="w-7 h-7 sm:w-8 sm:h-8" />
                        </div>

                        <div>
                            {/* Píldora de Estado Activo y Comprador */}
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                                    </span>
                                    <span>{isCancelled ? "Cancelado" : "En Seguimiento"}</span>
                                </div>

                                {order.customer_name && (
                                    <span className="text-xs text-white/60 font-medium">
                                        Fichaje de <strong className="text-white font-bold">{order.customer_name}</strong>
                                    </span>
                                )}
                            </div>

                            {/* Título de Estado */}
                            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
                                {order.status.label.replace(/^\d+\.\s*/, "")}
                            </h2>

                            {/* Narrativa de Estadio */}
                            <p className="text-white/70 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                                {order.status.desc}
                            </p>
                        </div>
                    </div>

                    {/* Bloque Derecho: Porcentaje */}
                    {!isCancelled && (
                        <div className="self-end md:self-center shrink-0 text-right">
                            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
                                {progress}%
                            </span>
                            <span className="block text-[11px] font-bold text-white/40 uppercase tracking-widest">
                                Progreso
                            </span>
                        </div>
                    )}
                </div>

                {/* Barra de Progreso con resplandor */}
                {!isCancelled && (
                    <div className="mt-6 sm:mt-8 pt-4 border-t border-white/[0.06]">
                        {/* Track de Progreso */}
                        <div className="relative h-2.5 sm:h-3 w-full bg-white/[0.05] rounded-full overflow-hidden p-0.5 border border-white/[0.06]">
                            <div
                                className="h-full bg-gradient-to-r from-primary/80 via-primary to-rose-400 rounded-full transition-all duration-1000 ease-out relative"
                                style={{ width: `${progress}%` }}
                            >
                                {/* Punto de luz specular en la cabeza del progreso */}
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_12px_#fff]" />
                            </div>
                        </div>

                        {/* Fases de alto nivel (Stepper 4 Fases) */}
                        <div className="grid grid-cols-4 gap-2 mt-4">
                            {phases.map((ph, idx) => {
                                const isPassed = progress >= ph.minProgress;
                                const isCurrent =
                                    progress >= ph.minProgress &&
                                    (idx === phases.length - 1 || progress < phases[idx + 1].minProgress);
                                const PhIcon = ph.icon;

                                return (
                                    <div
                                        key={idx}
                                        className={`flex flex-col items-center text-center p-2 rounded-xl transition-colors ${
                                            isCurrent
                                                ? "bg-white/[0.05] border border-white/10"
                                                : "opacity-60"
                                        }`}
                                    >
                                        <div
                                            className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1.5 transition-colors ${
                                                isPassed
                                                    ? "bg-primary text-white"
                                                    : "bg-white/[0.05] text-white/40 border border-white/10"
                                            }`}
                                        >
                                            {isPassed ? (
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                            ) : (
                                                <PhIcon className="w-3.5 h-3.5" />
                                            )}
                                        </div>
                                        <span
                                            className={`text-[10px] sm:text-xs font-bold leading-tight ${
                                                isPassed ? "text-white" : "text-white/40"
                                            }`}
                                        >
                                            {ph.name}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
