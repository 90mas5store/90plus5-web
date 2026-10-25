"use client";

import { Clock, CheckCircle2, ShieldCheck, MapPin, Truck } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { TrackingHistoryItem, TrackingStatus } from "./TrackingTypes";

interface TrackingTimelineProps {
    history: TrackingHistoryItem[];
    currentStatus: TrackingStatus;
    location: string;
}

function daysBetween(dateA: string, dateB: string): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.floor((new Date(dateB).getTime() - new Date(dateA).getTime()) / msPerDay);
}

function daysSince(date: string): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.floor((Date.now() - new Date(date).getTime()) / msPerDay);
}

function formatDays(days: number): string {
    if (days <= 0) return "Mismo día";
    if (days === 1) return "1 día";
    return `${days} días`;
}

export default function TrackingTimeline({
    history,
    currentStatus,
    location,
}: TrackingTimelineProps) {
    const reversedHistory = [...history].reverse();

    return (
        <div className="space-y-6">
            {/* Tarjeta de Historial y Bitácora */}
            <div className="rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/[0.08] p-5 sm:p-7 backdrop-blur-xl relative overflow-hidden">
                {/* Hairline superior */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                            <Clock className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                                Bitácora del Fichaje
                            </h3>
                            <p className="text-[11px] text-white/50">
                                Registro cronológico de hitos y actualizaciones
                            </p>
                        </div>
                    </div>

                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-white/60">
                        {history.length} {history.length === 1 ? "Registro" : "Registros"}
                    </span>
                </div>

                {/* Timeline vertical */}
                <div className="relative pl-1">
                    {reversedHistory.map((entry, idx) => {
                        const isLatest = idx === 0;
                        const isCurrent = entry.status_id === currentStatus.code;
                        const nextEntry = reversedHistory[idx + 1];
                        const elapsed = nextEntry ? daysBetween(nextEntry.date, entry.date) : null;
                        const sinceLast = isLatest ? daysSince(entry.date) : null;

                        return (
                            <div key={idx} className="relative pb-6 last:pb-0">
                                {/* Línea conectora entre hitos */}
                                {idx < reversedHistory.length - 1 && (
                                    <div className="absolute left-[13px] top-[26px] bottom-0 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent" />
                                )}

                                {/* Píldora de "Hace X días en este estado" en el estado activo */}
                                {isLatest && isCurrent && sinceLast !== null && sinceLast > 0 && (
                                    <div className="flex items-center gap-2 ml-9 mb-2">
                                        <span className="text-[10px] font-medium text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                                            Hace {formatDays(sinceLast)} en este estado
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-start gap-4">
                                    {/* Icono / Nodo del Timeline */}
                                    <div className="relative shrink-0 mt-0.5">
                                        {isLatest ? (
                                            <div className="w-7 h-7 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center shadow-[0_0_12px_rgba(225,29,72,0.4)]">
                                                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                                            </div>
                                        ) : (
                                            <div className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/15 flex items-center justify-center text-white/50">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Contenido del hito */}
                                    <div className="flex-1 min-w-0 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] rounded-xl p-3 sm:p-3.5 transition-colors">
                                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                                            <p
                                                className={`text-xs sm:text-sm font-bold tracking-tight ${
                                                    isLatest ? "text-white" : "text-white/80"
                                                }`}
                                            >
                                                {entry.label.replace(/^\d+\.\s*/, "")}
                                            </p>

                                            {elapsed !== null && elapsed > 0 && (
                                                <span className="text-[10px] font-mono font-medium text-white/40 bg-white/[0.05] px-2 py-0.5 rounded">
                                                    +{formatDays(elapsed)}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-[11px] text-white/45 mt-1 font-mono">
                                            {formatDate(entry.date, true)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Tarjeta de Destino y Garantía Logística 90+5 */}
            <div className="rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/[0.08] p-5 sm:p-6 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Truck className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-sm font-extrabold text-white">Logística & Cobertura</h4>
                        <p className="text-[11px] text-white/50">Transporte seguro y entrega garantizada</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-white/70">
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div>
                            <span className="block font-bold text-white text-xs mb-0.5">Destino Registrado</span>
                            <span className="text-white/60 text-[11px]">{location || "Honduras"}</span>
                        </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-start gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                            <span className="block font-bold text-white text-xs mb-0.5">Control de Calidad</span>
                            <span className="text-white/60 text-[11px]">Revisión de costuras y dorsal antes del despacho</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
