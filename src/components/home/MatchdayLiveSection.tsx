"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Zap, Radio, BarChart2, Shield, Trophy, MessageCircle } from "lucide-react";
import { useLiveMatches, LiveMatchData } from "@/hooks/useLiveMatches";
import { Product } from "@/lib/types";
import { fetchProductsByTeamIds } from "@/lib/api";
import ProductCard from "@/components/ui/ProductCard";
import { translateTeamNameToSpanish } from "@/lib/teamNames";
import { usePrefersReducedMotion } from "@/hooks/useOptimization";
import useToastMessage from "@/hooks/useToastMessage";
import { motion, AnimatePresence } from "@/lib/motion";

const MatchCenterModal = dynamic(() => import("@/components/match/MatchCenterModal"), {
    ssr: false,
});

interface MatchdayLiveSectionProps {
    allProducts?: Product[];
}

export default function MatchdayLiveSection({ allProducts = [] }: MatchdayLiveSectionProps) {
    const liveMatches = useLiveMatches();
    const [selectedMatch, setSelectedMatch] = useState<LiveMatchData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeMatchIndex, setActiveMatchIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [dynamicProducts, setDynamicProducts] = useState<Record<string, Product[]>>({});
    const prefersReducedMotion = usePrefersReducedMotion();
    const toast = useToastMessage();
    const tabsContainerRef = useRef<HTMLDivElement>(null);

    // Deduplicar partidos únicos
    const activeEntries = useMemo(() => {
        const rawEntries = Object.entries(liveMatches);
        const uniqueMatchMap = new Map<string, [string, LiveMatchData]>();
        for (const [id, match] of rawEntries) {
            const fixtureKey = [match.homeTeam, match.awayTeam]
                .map((t) => (t || "").toLowerCase().trim())
                .sort()
                .join(" vs ");

            if (!uniqueMatchMap.has(fixtureKey)) {
                uniqueMatchMap.set(fixtureKey, [id, match]);
            }
        }

        return Array.from(uniqueMatchMap.values()).sort((a, b) => {
            const matchA = a[1];
            const matchB = b[1];

            // 1. Prioridad de Estado: EN JUEGO (3) > PRÓXIMO (2) > FINALIZADO (1)
            const getStatusScore = (m: LiveMatchData) => {
                if (!m.isFinished && !m.isUpcoming) return 3; // En juego
                if (m.isUpcoming) return 2;                    // Próximo a jugarse hoy
                return 1;                                      // Finalizado
            };

            const scoreDiff = getStatusScore(matchB) - getStatusScore(matchA);
            if (scoreDiff !== 0) return scoreDiff;

            // 1.1 Si ambos están EN JUEGO: del que viene iniciando al que ya está por terminar (minuto menor a mayor)
            const isLiveA = !matchA.isFinished && !matchA.isUpcoming;
            const isLiveB = !matchB.isFinished && !matchB.isUpcoming;
            if (isLiveA && isLiveB) {
                const getMinute = (m: LiveMatchData) => {
                    if (m.minute != null && !isNaN(m.minute)) return m.minute;
                    if (m.isHalftime) return 45;
                    if (m.displayClock) {
                        const parsed = m.displayClock.match(/^(\d+)/);
                        if (parsed) return parseInt(parsed[1], 10);
                    }
                    return 0;
                };
                const minA = getMinute(matchA);
                const minB = getMinute(matchB);
                if (minA !== minB) return minA - minB;
            }

            // 2. Si ambos son PRÓXIMOS: orden cronológico por hora (del más cercano a empezar al último del día)
            if (matchA.isUpcoming && matchB.isUpcoming) {
                const timeA = matchA.eventTimestamp || (matchA.rawDate ? new Date(matchA.rawDate).getTime() : 0);
                const timeB = matchB.eventTimestamp || (matchB.rawDate ? new Date(matchB.rawDate).getTime() : 0);
                if (timeA && timeB && timeA !== timeB) return timeA - timeB;
            }

            // 3. Si ambos son FINALIZADOS: por hora de finalización (el más recientemente finalizado primero)
            if (matchA.isFinished && matchB.isFinished) {
                const timeA = matchA.eventTimestamp || (matchA.rawDate ? new Date(matchA.rawDate).getTime() : 0);
                const timeB = matchB.eventTimestamp || (matchB.rawDate ? new Date(matchB.rawDate).getTime() : 0);
                if (timeA && timeB && timeA !== timeB) return timeB - timeA;
            }

            return 0;
        });
    }, [liveMatches]);

    // Ajustar índice de forma segura si la cantidad de partidos cambia
    useEffect(() => {
        if (activeEntries.length === 0) return;
        if (activeMatchIndex >= activeEntries.length) {
            setActiveMatchIndex(0);
        }
    }, [activeEntries.length, activeMatchIndex]);

    // Rotación automática cada 7.5 segundos si hay más de 1 partido
    useEffect(() => {
        if (activeEntries.length <= 1 || isPaused || isModalOpen || prefersReducedMotion) return;

        const interval = setInterval(() => {
            setActiveMatchIndex((prev) => (prev + 1) % activeEntries.length);
        }, 7500);

        return () => clearInterval(interval);
    }, [activeEntries.length, isPaused, isModalOpen, prefersReducedMotion]);

    // Desplazar suavemente SOLO el contenedor horizontal sin mover la ventana del navegador
    useEffect(() => {
        const container = tabsContainerRef.current;
        if (!container) return;
        if (container.scrollWidth <= container.clientWidth) return;

        // Si es el primer elemento, siempre volver al inicio absoluto limpio (scrollLeft: 0)
        if (activeMatchIndex === 0) {
            container.scrollTo({
                left: 0,
                behavior: prefersReducedMotion ? "auto" : "smooth",
            });
            return;
        }

        // Si es el último elemento, llevar hasta el final del contenedor
        if (activeMatchIndex === activeEntries.length - 1) {
            container.scrollTo({
                left: container.scrollWidth,
                behavior: prefersReducedMotion ? "auto" : "smooth",
            });
            return;
        }

        const activeBtn = container.children[activeMatchIndex] as HTMLElement;
        if (activeBtn) {
            const containerRect = container.getBoundingClientRect();
            const btnRect = activeBtn.getBoundingClientRect();
            const offsetWithinContainer = (btnRect.left - containerRect.left) + container.scrollLeft;
            const targetLeft = offsetWithinContainer - (container.clientWidth / 2) + (btnRect.width / 2);
            container.scrollTo({
                left: Math.max(0, targetLeft),
                behavior: prefersReducedMotion ? "auto" : "smooth",
            });
        }
    }, [activeMatchIndex, activeEntries.length, prefersReducedMotion]);

    const currentMatchEntry = activeEntries[activeMatchIndex] || activeEntries[0];
    const currentMatch = currentMatchEntry ? currentMatchEntry[1] : null;

    const homeTeamName = currentMatch?.homeTeam || "";
    const awayTeamName = currentMatch?.awayTeam || "";
    const homeTeamId = currentMatch?.homeTeamId;
    const awayTeamId = currentMatch?.awayTeamId;

    // Cargar prendas de la base de datos específicamente para los clubes del partido activo
    useEffect(() => {
        if (!currentMatch) return;
        const matchKey = `${homeTeamName}_${awayTeamName}`;
        if (dynamicProducts[matchKey]) return;

        const teamIds: string[] = [];
        if (homeTeamId) teamIds.push(homeTeamId);
        if (awayTeamId) teamIds.push(awayTeamId);

        if (teamIds.length > 0) {
            fetchProductsByTeamIds(teamIds).then((prods) => {
                if (prods && prods.length > 0) {
                    setDynamicProducts((prev) => ({ ...prev, [matchKey]: prods }));
                }
            });
        }
    }, [currentMatch, homeTeamId, awayTeamId, homeTeamName, awayTeamName, dynamicProducts]);

    // Filtrar prendas exactas de los clubes del partido
    const matchProducts = useMemo(() => {
        if (!currentMatch) return [];
        const matchKey = `${homeTeamName}_${awayTeamName}`;
        const fromDynamic = dynamicProducts[matchKey] || [];

        const hName = translateTeamNameToSpanish(homeTeamName).toLowerCase();
        const aName = translateTeamNameToSpanish(awayTeamName).toLowerCase();
        const hRaw = homeTeamName.toLowerCase();
        const aRaw = awayTeamName.toLowerCase();

        // Buscar en el pool inicial por id o por nombre de club
        const fromPool = allProducts.filter((p) => {
            if (homeTeamId && p.team_id === homeTeamId) return true;
            if (awayTeamId && p.team_id === awayTeamId) return true;
            const eq = (p.equipo || "").toLowerCase();
            return (
                (hName && eq.includes(hName)) ||
                (aName && eq.includes(aName)) ||
                (hRaw && eq.includes(hRaw)) ||
                (aRaw && eq.includes(aRaw))
            );
        });

        const combinedMap = new Map<string, Product>();
        [...fromDynamic, ...fromPool].forEach((p) => combinedMap.set(p.id, p));
        return Array.from(combinedMap.values()).slice(0, 8);
    }, [allProducts, dynamicProducts, currentMatch, homeTeamName, awayTeamName, homeTeamId, awayTeamId]);

    // Formatear hora de inicio exacta para partidos próximos (debe ejecutarse antes de cualquier early return)
    const kickoffInfo = useMemo(() => {
        if (!currentMatch) return { day: "HOY", time: "Por comenzar" };

        if (currentMatch.startTime && currentMatch.startTime !== "vs") {
            const raw = currentMatch.startTime.trim();
            const parts = raw.split(/\s+/);
            if (parts.length >= 2 && /^(hoy|mañana|sáb|dom|lun|mar|mié|jue|sab|mie)/i.test(parts[0])) {
                return {
                    day: parts[0].toUpperCase(),
                    time: parts.slice(1).join(" "),
                };
            }
            if (/\d/.test(raw)) {
                return {
                    day: "HOY",
                    time: raw,
                };
            }
        }

        const dateSource = currentMatch.rawDate || (currentMatch.eventTimestamp ? new Date(currentMatch.eventTimestamp) : null);
        if (dateSource) {
            try {
                const d = new Date(dateSource);
                if (!isNaN(d.getTime())) {
                    const timeStr = d.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                        timeZone: 'America/Tegucigalpa',
                    });
                    return { day: "HOY", time: timeStr };
                }
            } catch {
                // fallback
            }
        }

        return { day: "HOY", time: "Por comenzar" };
    }, [currentMatch]);

    // Si no hay partidos hoy, ocultar completamente la sección para no dejar huecos
    if (!currentMatch || activeEntries.length === 0) {
        return null;
    }

    const isLive = !currentMatch.isFinished && !currentMatch.isUpcoming;
    const homeName = translateTeamNameToSpanish(currentMatch.homeTeam);
    const awayName = translateTeamNameToSpanish(currentMatch.awayTeam);
    const competitionName = currentMatch.leagueName || "Competición Oficial";

    return (
        <section
            aria-label="Matchday Live"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => {
                setTimeout(() => setIsPaused(false), 6000);
            }}
            className="py-8 sm:py-14 my-6 sm:my-8 border-y border-white/[0.08] bg-gradient-to-b from-[#0b0c11] via-[#0d0f18] to-[#0b0c11] relative overflow-hidden"
        >
            {/* Resplandor ambiental de estadio */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] sm:w-[600px] h-[250px] sm:h-[300px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
                {/* Header de la sección */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-5 sm:mb-7">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2 text-red-400">
                            {isLive ? (
                                <>
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                                    </span>
                                    <span>En Juego Ahora</span>
                                </>
                            ) : (
                                <>
                                    <Zap className="w-3.5 h-3.5 text-primary" />
                                    <span className="text-white/60">Matchday Hoy</span>
                                </>
                            )}
                        </div>
                        <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                            Matchday Hub · Pasión en Tiempo Real
                        </h2>
                        <p className="text-white/60 text-xs sm:text-sm font-medium mt-0.5">
                            Sigue el partido y consigue la camiseta oficial de los clubes en cancha.
                        </p>
                    </div>

                    {/* Selector de partidos si hay más de 1 */}
                    {activeEntries.length > 1 && (
                        <div
                            ref={tabsContainerRef}
                            className="relative flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/5 overflow-x-auto pb-1 scrollbar-none w-full sm:w-auto"
                        >
                            {activeEntries.map(([id, m], idx) => {
                                const hName = translateTeamNameToSpanish(m.homeTeam);
                                const aName = translateTeamNameToSpanish(m.awayTeam);
                                const active = idx === activeMatchIndex;
                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => {
                                            setActiveMatchIndex(idx);
                                            setIsPaused(true);
                                            setTimeout(() => setIsPaused(false), 8000);
                                        }}
                                        className="relative px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors select-none"
                                    >
                                        {active && (
                                            <motion.div
                                                layoutId="matchdayActiveTabPill"
                                                className="absolute inset-0 rounded-xl bg-white shadow-md z-0"
                                                transition={{ type: "spring", damping: 28, stiffness: 380 }}
                                            />
                                        )}
                                        <span className={`relative z-10 transition-colors duration-200 ${
                                            active ? "text-black font-bold" : "text-white/60 hover:text-white"
                                        }`}>
                                            {hName} vs {aName}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Marcador del Partido Seleccionado */}
                <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-2xl overflow-hidden min-h-[175px] sm:min-h-[195px] flex flex-col justify-between">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={currentMatchEntry ? currentMatchEntry[0] : activeMatchIndex}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                            className="w-full"
                        >
                            {/* COMPETENCIA - Tipografía limpia sin píldora */}
                            <div className="flex items-center justify-center gap-1.5 mb-3 sm:mb-4 text-white/50 text-[11px] sm:text-xs font-semibold uppercase tracking-widest">
                                <Trophy className="w-3.5 h-3.5 text-amber-400/90" />
                                <span>{competitionName}</span>
                            </div>

                            <div className="flex items-center justify-between gap-2 sm:gap-6">
                                {/* EQUIPO LOCAL */}
                                <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-start min-w-0">
                                    <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/[0.06] border border-white/10 p-1.5 sm:p-2 flex items-center justify-center shrink-0">
                                        {currentMatch.homeLogo ? (
                                            <Image
                                                src={currentMatch.homeLogo}
                                                alt={homeName}
                                                width={48}
                                                height={48}
                                                className="object-contain max-h-8 max-w-8 sm:max-h-12 sm:max-w-12"
                                            />
                                        ) : (
                                            <Shield className="w-5 h-5 sm:w-7 sm:h-7 text-gray-500" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-xs sm:text-lg font-black text-white truncate sm:whitespace-normal">
                                            {homeName}
                                        </h3>
                                    </div>
                                </div>

                                {/* MARCADOR / HORA DE INICIO - Tipografía clara, sin 0' ni píldoras */}
                                <div className="flex flex-col items-center justify-center px-2 sm:px-6 shrink-0">
                                    {currentMatch.isUpcoming ? (
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <span className="text-[10px] sm:text-xs font-bold text-amber-400 uppercase tracking-widest">
                                                {kickoffInfo.day}
                                            </span>
                                            <div className="text-xl sm:text-3xl font-black text-white tracking-tight tabular-nums mt-0.5">
                                                {kickoffInfo.time}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 sm:gap-4">
                                            <span className="text-2xl sm:text-5xl font-black text-white tabular-nums">
                                                {currentMatch.homeScore ?? 0}
                                            </span>
                                            <span className="text-base sm:text-2xl font-black text-white/40">-</span>
                                            <span className="text-2xl sm:text-5xl font-black text-white tabular-nums">
                                                {currentMatch.awayScore ?? 0}
                                            </span>
                                        </div>
                                    )}

                                    {isLive && (
                                        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-red-400 mt-1 sm:mt-1.5">
                                            <Radio className="w-3.5 h-3.5 animate-pulse" />
                                            <span>{currentMatch.displayClock || "En Vivo"}</span>
                                        </div>
                                    )}
                                    {currentMatch.isFinished && (
                                        <span className="text-[11px] sm:text-xs font-semibold text-white/50 mt-1 uppercase tracking-wider">
                                            Finalizado
                                        </span>
                                    )}
                                </div>

                                {/* EQUIPO VISITANTE */}
                                <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end text-right min-w-0">
                                    <div className="min-w-0">
                                        <h3 className="text-xs sm:text-lg font-black text-white truncate sm:whitespace-normal">
                                            {awayName}
                                        </h3>
                                    </div>
                                    <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/[0.06] border border-white/10 p-1.5 sm:p-2 flex items-center justify-center shrink-0">
                                        {currentMatch.awayLogo ? (
                                            <Image
                                                src={currentMatch.awayLogo}
                                                alt={awayName}
                                                width={48}
                                                height={48}
                                                className="object-contain max-h-8 max-w-8 sm:max-h-12 sm:max-w-12"
                                            />
                                        ) : (
                                            <Shield className="w-5 h-5 sm:w-7 sm:h-7 text-gray-500" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Botón para abrir el Match Center con estadísticas */}
                    <div className="mt-4 pt-3 border-t border-white/10 flex justify-center">
                        <button
                            onClick={() => {
                                setSelectedMatch(currentMatch);
                                setIsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/15 border border-white/15 text-white text-[11px] sm:text-xs font-bold transition-all active:scale-95 cursor-pointer"
                        >
                            <BarChart2 className="w-3.5 h-3.5 text-primary" />
                            <span>Ver Estadísticas & Alineaciones</span>
                        </button>
                    </div>
                </div>

                {/* Camisetas Oficiales de los Equipos en Cancha */}
                {matchProducts.length > 0 ? (
                    <div>
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <h3 className="text-xs sm:text-base font-bold text-white">
                                Camisetas de este partido
                            </h3>
                        </div>

                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={`prods-${currentMatchEntry ? currentMatchEntry[0] : activeMatchIndex}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5"
                            >
                                {matchProducts.map((prod) => (
                                    <ProductCard
                                        key={prod.id}
                                        item={prod}
                                        enableGlow={!prefersReducedMotion}
                                        liveMatch={currentMatch}
                                        onPress={() => toast.loading("Cargando personalización...")}
                                    />
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                ) : (
                    /* Si ninguno de los dos clubes tiene prendas en stock inmediato, ofrecer pedido especial sin confundir con otros equipos */
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-7 text-center max-w-lg mx-auto space-y-3">
                        <div className="w-9 h-9 rounded-full bg-white/10 mx-auto flex items-center justify-center text-white/80">
                            <MessageCircle className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-xs sm:text-sm font-bold text-white">
                                ¿Buscas la camiseta de {homeName} o {awayName}?
                            </h4>
                            <p className="text-[11px] sm:text-xs text-white/60 leading-relaxed">
                                Podemos traerte cualquier equipación oficial de esta temporada o temporadas anteriores bajo pedido en ~1 mes.
                            </p>
                        </div>
                        <a
                            href={`https://wa.me/50499999999?text=${encodeURIComponent(`Hola 90+5 Store, quisiera cotizar la camiseta de ${homeName} / ${awayName}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-md active:scale-95"
                        >
                            <MessageCircle className="w-3.5 h-3.5 fill-black" />
                            <span>Cotizar esta camiseta por WhatsApp</span>
                        </a>
                    </div>
                )}
            </div>

            {/* Modal de Centro de Partido */}
            {isModalOpen && selectedMatch && (
                <MatchCenterModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    match={selectedMatch}
                />
            )}
        </section>
    );
}
