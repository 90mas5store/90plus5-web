"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock, Truck, Sparkles, MessageCircle, ShieldCheck, Flame, Star, Tag, Zap, LucideIcon } from "lucide-react";
import type { LiveGoalAlert } from "@/hooks/useLiveMatches";
import { MarqueeBarSettings, DEFAULT_MARQUEE_SETTINGS, calculateNextCutoffDate, MarqueeIconType } from "@/lib/marqueeSettings";

const ICON_MAP: Record<MarqueeIconType, LucideIcon> = {
    clock: Clock,
    truck: Truck,
    sparkles: Sparkles,
    shield: ShieldCheck,
    message: MessageCircle,
    flame: Flame,
    star: Star,
    tag: Tag,
    zap: Zap,
};

interface HomeTrustBarProps {
    settings?: MarqueeBarSettings;
}

export default function HomeTrustBar({ settings = DEFAULT_MARQUEE_SETTINGS }: HomeTrustBarProps) {
    const [goalAlert, setGoalAlert] = useState<LiveGoalAlert | null>(null);

    // ⚽ Escuchar evento global de goles en vivo ('matchday:goal')
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const handleGoal = (e: Event) => {
            const customEvent = e as CustomEvent<LiveGoalAlert>;
            if (customEvent.detail) {
                setGoalAlert(customEvent.detail);
                clearTimeout(timeoutId);
                // La alerta de gol se mantiene activa en la marquesina por 45 segundos
                timeoutId = setTimeout(() => {
                    setGoalAlert(null);
                }, 45000);
            }
        };

        window.addEventListener("matchday:goal", handleGoal);
        return () => {
            window.removeEventListener("matchday:goal", handleGoal);
            clearTimeout(timeoutId);
        };
    }, []);

    // Calcular próximo día de cierre
    const nextCutoffText = useMemo(() => calculateNextCutoffDate(), []);

    // Alertas activas procesadas con reemplazo de variables si aplica
    const activeAlerts = useMemo(() => {
        const sourceItems = (settings?.items && settings.items.length > 0)
            ? settings.items
            : DEFAULT_MARQUEE_SETTINGS.items;

        return sourceItems
            .filter((item) => item.active !== false)
            .map((item) => {
                const IconComponent = ICON_MAP[item.icon as MarqueeIconType] || Sparkles;
                let processedText = item.text || "";

                if (settings?.autoCalculateCutoff !== false) {
                    processedText = processedText.replace(/\{proximo_cierre\}|\{auto_cutoff\}/gi, nextCutoffText);
                }

                return {
                    id: item.id,
                    icon: IconComponent,
                    highlight: item.highlight,
                    text: processedText,
                };
            });
    }, [settings, nextCutoffText]);

    // Si está desactivada por el admin y no hay un gol en vivo, no mostrar
    if (!settings?.enabled && !goalAlert) {
        return null;
    }

    if (activeAlerts.length === 0 && !goalAlert) {
        return null;
    }

    const durationSeconds = settings?.speedSeconds || 32;

    return (
        <section
            aria-label="Avisos y garantías de 90+5 Store"
            className="relative z-20 border-b border-white/[0.08] bg-[#0c0d12] overflow-hidden select-none"
            style={{ paddingTop: "var(--header-height, 4.5rem)" }}
        >
            <div className={`relative w-full h-8 sm:h-9 flex items-center overflow-hidden transition-colors duration-500 ${
                goalAlert ? "bg-red-600/30 border-y border-red-500/50" : "bg-primary/[0.08]"
            }`}>
                
                {/* SI HAY UN GOL EN VIVO: Mostrar ticker de gol en ese mismo tamaño slim */}
                {goalAlert ? (
                    <div className="flex w-max animate-marquee items-center text-white">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2.5 px-6 sm:px-10 text-[11px] sm:text-xs font-black tracking-wide whitespace-nowrap shrink-0 text-white"
                            >
                                <span className="animate-ping w-2 h-2 rounded-full bg-red-400 shrink-0" />
                                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white uppercase text-[9px] font-black tracking-widest shadow-md">
                                    ⚽ ¡GOOOOOOL!
                                </span>
                                <span className="text-[#FFD700]">
                                    {goalAlert.scoringPlayer || goalAlert.scoringTeam} {goalAlert.minute ? `(${goalAlert.minute})` : ""}
                                </span>
                                <span className="text-white/70 font-bold">
                                    {goalAlert.homeTeam} {goalAlert.homeScore} - {goalAlert.awayScore} {goalAlert.awayTeam}
                                </span>
                                <span className="text-white/50 font-normal">
                                    · ¡Camiseta disponible bajo pedido en 90+5!
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* MARQUESINA DINÁMICA: Editada desde el Admin */
                    <div
                        className="flex w-max animate-marquee hover:[animation-play-state:paused] items-center"
                        style={{ animationDuration: `${durationSeconds}s` }}
                    >
                        {[...activeAlerts, ...activeAlerts].map((item, idx) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={`${item.id}-${idx}`}
                                    className="flex items-center gap-2 px-5 sm:px-8 text-[11px] sm:text-xs text-white/80 whitespace-nowrap shrink-0"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                    <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                                    {item.highlight && (
                                        <span className="font-bold text-white tracking-tight">
                                            {item.highlight}:
                                        </span>
                                    )}
                                    <span className="text-white/70 font-medium">
                                        {item.text}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes marquee {
                    0% {
                        transform: translateX(0%);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
                }
                .animate-marquee {
                    animation-name: marquee;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
                @media (max-width: 640px) {
                    .animate-marquee {
                        animation-duration: ${Math.round(durationSeconds * 0.7)}s !important;
                    }
                }
            `}</style>
        </section>
    );
}
