'use client';

import React, { useMemo } from 'react';
import {
    Filter,
    Users,
    Eye,
    MessageCircle,
    ShoppingBag,
    CreditCard,
    CheckCircle2,
    TrendingDown,
    Lightbulb,
    ArrowRight,
    Clock,
} from 'lucide-react';
import { AnalyticsFunnelStep, AnalyticsWhatsAppClickItem } from '@/lib/analytics/types';
import { getCountryFlag } from '@/lib/analytics/geo';

interface AnalyticsFunnelCardProps {
    funnel: AnalyticsFunnelStep[];
    whatsappClicks?: AnalyticsWhatsAppClickItem[];
    loading?: boolean;
}

export default function AnalyticsFunnelCard({ funnel, whatsappClicks = [] }: AnalyticsFunnelCardProps) {
    const insight = useMemo(() => {
        if (!funnel || funnel.length < 2) return null;

        const droppableSteps = funnel.slice(0, funnel.length - 1).filter((s) => s.id !== 'whatsapp');
        const worstStep = [...droppableSteps].sort((a, b) => b.dropOffPercentage - a.dropOffPercentage)[0];

        if (!worstStep || worstStep.dropOffPercentage <= 0) return null;

        const adviceMap: Record<string, { title: string; text: string }> = {
            visit: {
                title: 'Bajo descubrimiento de productos',
                text: 'Muchos usuarios llegan a la tienda pero no entran a ver detalles de camisetas. Sugerencia: Destaca más novedades o banners llamativos en la portada.',
            },
            product: {
                title: 'Fuga en ficha de camiseta',
                text: 'Los aficionados revisan las camisetas pero no las añaden a la bolsa. Sugerencia: Verifica la claridad de las fotos, opciones de dorsal y versión (jugador vs aficionado).',
            },
            cart: {
                title: 'Abandono de carrito de compra',
                text: 'Tienen interés real pero no inician el checkout. Sugerencia: Destaca el beneficio del anticipo inicial o confirma la cobertura de envío a todo el país.',
            },
            checkout: {
                title: 'Fricción en el proceso de pago',
                text: 'Llegaron a la pantalla final pero no completaron la orden. Sugerencia: Asegura que los números de cuenta bancaria y pasarela de tarjeta sean claros y rápidos.',
            },
        };

        const advice = adviceMap[worstStep.id] || {
            title: `Fuga detectada en ${worstStep.name}`,
            text: `El ${worstStep.dropOffPercentage}% de los clientes abandona en este punto.`,
        };

        return {
            stepName: worstStep.name,
            dropOff: worstStep.dropOffPercentage,
            ...advice,
        };
    }, [funnel]);

    const stepIcons = {
        visit: Users,
        product: Eye,
        whatsapp: MessageCircle,
        cart: ShoppingBag,
        checkout: CreditCard,
        order: CheckCircle2,
    };

    return (
        <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
            {/* Header del Embudo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 pb-3.5 border-b border-white/[0.06] mb-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                            <Filter className="w-4 h-4" />
                        </span>
                        <div>
                            <h2 className="text-sm sm:text-base md:text-lg font-black text-white tracking-tight">
                                Embudo de Conversión Comercial
                            </h2>
                            <p className="text-xs text-neutral-400">
                                Viaje del aficionado desde la primera visita hasta la camiseta confirmada
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono font-bold text-neutral-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {funnel?.length || 4} Fases Clave
                    </span>
                </div>
            </div>

            {/* Fases del Embudo */}
            {funnel && funnel.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                    {/* Vista Compacta para Móviles */}
                    <div className="sm:hidden space-y-2">
                        {funnel.map((step, idx) => {
                            const IconComponent = stepIcons[step.id] || Users;
                            const isLast = idx === funnel.length - 1;

                            return (
                                <div
                                    key={step.id}
                                    className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] transition-all"
                                >
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div
                                                className={`p-1.5 rounded-lg border shrink-0 ${
                                                    isLast
                                                        ? 'bg-primary/10 text-primary border-primary/20'
                                                        : 'bg-white/[0.04] text-neutral-300 border-white/[0.08]'
                                                }`}
                                            >
                                                <IconComponent className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-xs font-bold text-white block truncate">{step.name}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-xs font-black font-mono text-white">
                                                {step.count.toLocaleString('es-HN')}
                                            </span>
                                            <span
                                                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                                    isLast
                                                        ? 'bg-primary/10 text-primary border-primary/20'
                                                        : 'bg-white/[0.05] text-neutral-300 border-white/[0.08]'
                                                }`}
                                            >
                                                {step.percentage}%
                                            </span>
                                            {!isLast ? (
                                                <span className="text-[10px] font-mono font-semibold text-neutral-400">
                                                    -{step.dropOffPercentage}%
                                                </span>
                                            ) : (
                                                <CheckCircle2 className="w-3 h-3 text-primary" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Mini Barra de progreso unificada */}
                                    <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${
                                                isLast ? 'bg-primary' : 'bg-white/75'
                                            }`}
                                            style={{ width: `${Math.max(step.percentage, 4)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Vista en Cuadrícula para Tablet / Desktop */}
                    <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                        {funnel.map((step, idx) => {
                            const IconComponent = stepIcons[step.id] || Users;
                            const isLast = idx === funnel.length - 1;
                            const isWhatsApp = step.id === 'whatsapp';

                            return (
                                <div
                                    key={step.id}
                                    className="relative flex flex-col justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 group"
                                >
                                    {!isLast && (
                                        <div className="hidden xl:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-white/20 group-hover:text-white/50 transition-colors pointer-events-none">
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    )}

                                    <div>
                                        <div className="flex items-center justify-between mb-2.5">
                                            <div
                                                className={`p-2 rounded-xl border transition-transform duration-200 ${
                                                    isLast
                                                        ? 'bg-primary/10 text-primary border-primary/20'
                                                        : isWhatsApp
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                            : 'bg-white/[0.04] text-neutral-300 border-white/[0.08]'
                                                }`}
                                            >
                                                <IconComponent className="w-4 h-4" />
                                            </div>
                                            <span
                                                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                                                    isLast
                                                        ? 'bg-primary/10 text-primary border-primary/20'
                                                        : isWhatsApp
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                            : 'bg-white/[0.04] text-neutral-300 border-white/[0.08]'
                                                }`}
                                            >
                                                {step.percentage}%
                                            </span>
                                        </div>

                                        <h3 className="text-xs font-extrabold text-white mb-0.5 tracking-tight">
                                            {step.name}
                                        </h3>
                                        <p className="text-[11px] text-neutral-400 line-clamp-1 mb-3">
                                            {step.description}
                                        </p>
                                    </div>

                                    <div>
                                        <div className="text-xl md:text-2xl font-black text-white font-mono tracking-tight">
                                            {step.count.toLocaleString('es-HN')}
                                        </div>

                                        {/* Barra de progreso unificada Apple */}
                                        <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden my-2">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    isLast
                                                        ? 'bg-primary'
                                                        : isWhatsApp
                                                            ? 'bg-emerald-400'
                                                            : 'bg-white/75'
                                                }`}
                                                style={{ width: `${Math.max(step.percentage, 4)}%` }}
                                            />
                                        </div>

                                        {isWhatsApp ? (
                                            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold font-mono">
                                                <MessageCircle className="w-3 h-3 shrink-0" />
                                                <span>Chat directo</span>
                                            </div>
                                        ) : !isLast ? (
                                            <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-semibold font-mono">
                                                <TrendingDown className="w-3 h-3 shrink-0 text-neutral-500" />
                                                <span>{step.dropOffPercentage}% fuga</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-[10px] text-primary font-bold font-mono">
                                                <CheckCircle2 className="w-3 h-3 shrink-0" />
                                                <span>Conversión final</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Bitácora detallada de clics a WhatsApp (Producto, Configuración y Hora exacta) */}
                    {whatsappClicks.length > 0 && (
                        <div className="pt-3 border-t border-white/[0.06] space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <h3 className="text-xs font-extrabold text-white tracking-tight uppercase">
                                        Detalle de Clics a WhatsApp (Hora y Camiseta)
                                    </h3>
                                </div>
                                <span className="text-[11px] font-mono text-neutral-400">
                                    Últimos {whatsappClicks.length} chats iniciados
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                                {whatsappClicks.map((item) => {
                                    const dt = new Date(item.created_at);
                                    const dateTimeStr = dt.toLocaleString('es-HN', {
                                        timeZone: 'America/Tegucigalpa',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true,
                                    });
                                    const details = [
                                        item.version,
                                        item.size ? `Talla ${item.size}` : null,
                                        item.dorsal,
                                        item.patch,
                                    ].filter(Boolean);

                                    return (
                                        <div
                                            key={item.id}
                                            className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-3 text-xs"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold shrink-0">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                        WhatsApp
                                                    </span>
                                                    <span className="font-bold text-white truncate">
                                                        {item.teamName ? `${item.teamName} — ` : ''}
                                                        {item.productName}
                                                    </span>
                                                </div>
                                                {details.length > 0 && (
                                                    <p className="text-[11px] text-neutral-400 font-mono mt-1 truncate">
                                                        {details.join(' · ')}
                                                        {item.price && item.price > 0 ? ` · L ${item.price.toLocaleString('es-HN')}` : ''}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="text-right shrink-0">
                                                <div className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-300">
                                                    <Clock className="w-3 h-3 text-neutral-500" />
                                                    <span>{dateTimeStr}</span>
                                                </div>
                                                {(item.country || item.city) && (
                                                    <p className="text-[10px] text-neutral-500 mt-0.5">
                                                        {item.country ? getCountryFlag(item.country) : ''} {item.city || item.device}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Recomendación Accionable Basada en Datos Reales */}
                    {insight && (
                        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 text-xs">
                            <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
                                <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                                    <Lightbulb className="w-4 h-4" />
                                </span>
                                <div>
                                    <span className="font-bold text-white text-xs block">
                                        Oportunidad Clave: {insight.title} ({insight.dropOff}% de caída)
                                    </span>
                                    <p className="text-[11px] text-neutral-400 mt-0.5">{insight.text}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="p-8 text-center text-xs text-neutral-500 border border-dashed border-white/[0.08] rounded-2xl">
                    Sin eventos suficientes para procesar el embudo en este rango de tiempo.
                </div>
            )}
        </div>
    );
}
