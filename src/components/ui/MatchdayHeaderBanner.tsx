"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, ArrowRight, Flame, Trophy, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "@/lib/motion";
import { useLiveMatches, LiveMatchData, LiveGoalAlert } from "@/hooks/useLiveMatches";
import { translateTeamNameToSpanish, translateTeamShortName, translateTeamAbbr } from "@/lib/teamNames";

const MatchCenterModal = dynamic(() => import("@/components/match/MatchCenterModal"), { ssr: false });

export default function MatchdayHeaderBanner() {
  const pathname = usePathname();
  const liveMatches = useLiveMatches();
  const [selectedMatch, setSelectedMatch] = useState<LiveMatchData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalQueue, setGoalQueue] = useState<LiveGoalAlert[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Escuchar eventos globales de gol para activar el Ticker Takeover
  useEffect(() => {
    const handleGoal = (e: Event) => {
      const customEvt = e as CustomEvent<LiveGoalAlert>;
      if (customEvt.detail) {
        // Feedback háptico en dispositivos móviles al anotar un gol
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate([150, 80, 150]);
          } catch {}
        }

        setGoalQueue(prev => {
          const isDuplicate = prev.some(
            g => g.id === customEvt.detail.id ||
                 (g.homeTeam.toLowerCase() === customEvt.detail.homeTeam.toLowerCase() &&
                  g.awayTeam.toLowerCase() === customEvt.detail.awayTeam.toLowerCase() &&
                  g.homeScore === customEvt.detail.homeScore &&
                  g.awayScore === customEvt.detail.awayScore)
          );
          if (isDuplicate) return prev;
          return [...prev, customEvt.detail];
        });
      }
    };
    window.addEventListener('matchday:goal', handleGoal);
    return () => window.removeEventListener('matchday:goal', handleGoal);
  }, []);

  // Avanzar la cola de goles secuencialmente cada 7 segundos
  useEffect(() => {
    if (goalQueue.length === 0) return;
    const timer = setTimeout(() => {
      setGoalQueue(prev => prev.slice(1));
    }, 7000);
    return () => clearTimeout(timer);
  }, [goalQueue]);

  // Soporte de apertura directa de Match Center vía URL (?match=equipo)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const matchQuery = params.get('match') || params.get('partido');
    if (matchQuery && Object.keys(liveMatches).length > 0) {
      const q = matchQuery.toLowerCase().trim();
      const found = Object.values(liveMatches).find(
        m => m.homeTeam.toLowerCase().includes(q) || m.awayTeam.toLowerCase().includes(q)
      );
      if (found) {
        setSelectedMatch(found);
        setIsModalOpen(true);
      }
    }
  }, [liveMatches]);

  const rawEntries = Object.entries(liveMatches);

  // Deduplicar partidos por enfrentamiento único
  const uniqueMatchMap = new Map<string, [string, LiveMatchData]>();
  for (const [id, match] of rawEntries) {
    const fixtureKey = [match.homeTeam, match.awayTeam]
      .map((t) => t.toLowerCase().trim())
      .sort()
      .join(' vs ');

    if (!uniqueMatchMap.has(fixtureKey)) {
      uniqueMatchMap.set(fixtureKey, [id, match]);
    }
  }

  const activeEntries = Array.from(uniqueMatchMap.values()).sort((a, b) => {
    const matchA = a[1];
    const matchB = b[1];

    // 1. Prioridad de Estado: EN VIVO (3) > PRÓXIMO (2) > FINALIZADO (1)
    const getStatusScore = (m: LiveMatchData) => {
      if (!m.isFinished && !m.isUpcoming) return 3; // En juego ahora
      if (m.isUpcoming) return 2;                    // Próximo a jugarse hoy
      return 1;                                      // Ya finalizado
    };

    const scoreDiff = getStatusScore(matchB) - getStatusScore(matchA);
    if (scoreDiff !== 0) return scoreDiff;

    // 2. Si ambos son PRÓXIMOS: Orden cronológico ascendente (el más temprano del día primero)
    if (matchA.isUpcoming && matchB.isUpcoming) {
      const timeA = matchA.eventTimestamp || (matchA.rawDate ? new Date(matchA.rawDate).getTime() : 0);
      const timeB = matchB.eventTimestamp || (matchB.rawDate ? new Date(matchB.rawDate).getTime() : 0);
      if (timeA && timeB && timeA !== timeB) return timeA - timeB;
    }

    // 3. Si ambos son FINALIZADOS: El más recientemente finalizado primero
    if (matchA.isFinished && matchB.isFinished) {
      const timeA = matchA.eventTimestamp || (matchA.rawDate ? new Date(matchA.rawDate).getTime() : 0);
      const timeB = matchB.eventTimestamp || (matchB.rawDate ? new Date(matchB.rawDate).getTime() : 0);
      if (timeA && timeB && timeA !== timeB) return timeB - timeA;
    }

    return 0;
  });

  // ORDEN ESTRICTO: LOCAL A LA IZQUIERDA, VISITA A LA DERECHA
  const matchItems = activeEntries.map(([id, match]) => {
    const homeFullName = match.homeTeamDbName || translateTeamNameToSpanish(match.homeTeam);
    const awayFullName = match.awayTeamDbName || translateTeamNameToSpanish(match.awayTeam);
    const homeShortName = match.homeShortTeam || translateTeamShortName(homeFullName);
    const awayShortName = match.awayShortTeam || translateTeamShortName(awayFullName);
    const homeAbbr = match.homeAbbr ? translateTeamAbbr(homeFullName, match.homeAbbr) : (match.homeShortTeam?.slice(0, 3) || translateTeamAbbr(homeFullName));
    const awayAbbr = match.awayAbbr ? translateTeamAbbr(awayFullName, match.awayAbbr) : (match.awayShortTeam?.slice(0, 3) || translateTeamAbbr(awayFullName));
    const homeScore = match.homeScore;
    const awayScore = match.awayScore;

    const hasHomeInDb = Boolean(match.hasHomeTeamInDb || match.homeTeamId);
    const hasAwayInDb = Boolean(match.hasAwayTeamInDb || match.awayTeamId);

    const storeTeamName = hasHomeInDb ? homeFullName : hasAwayInDb ? awayFullName : homeFullName;
    const storeTeamId = hasHomeInDb ? (match.homeTeamId || id) : hasAwayInDb ? match.awayTeamId : null;

    return {
      id,
      match,
      homeFullName,
      awayFullName,
      homeShortName,
      awayShortName,
      homeAbbr,
      awayAbbr,
      homeScore,
      awayScore,
      hasHomeInDb,
      hasAwayInDb,
      storeTeamName,
      storeTeamId,
    };
  });

  const isMultiple = matchItems.length > 1;

  // Auto-rotación pausada y cómoda (7.5 segundos por partido)
  useEffect(() => {
    if (!isMultiple || isHovered) return;
    const interval = setInterval(() => {
      setCurrentMatchIndex((prev) => (prev + 1) % matchItems.length);
    }, 7500);
    return () => clearInterval(interval);
  }, [matchItems.length, isMultiple, isHovered]);

  // Protección de índice si cambia el número de partidos
  useEffect(() => {
    if (currentMatchIndex >= matchItems.length && matchItems.length > 0) {
      setCurrentMatchIndex(0);
    }
  }, [matchItems.length, currentMatchIndex]);

  const currentGoal = goalQueue[0] || null;

  // Si no hay gol activo, ocultar en home o si no hay partidos, pero mantener el modal para deep-linking (?match=...)
  if (!currentGoal && (pathname === '/' || activeEntries.length === 0)) {
    return (
      <MatchCenterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        match={selectedMatch}
      />
    );
  }

  const handleOpenMatch = (match: LiveMatchData) => {
    setSelectedMatch(match);
    setIsModalOpen(true);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMatchIndex((prev) => (prev - 1 + matchItems.length) % matchItems.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMatchIndex((prev) => (prev + 1) % matchItems.length);
  };

  // Soporte de gestos táctiles (Swipe) para dispositivos móviles con umbral de 35px
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsHovered(true);
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX !== null) {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 35) {
        if (diff > 0) {
          // Swipe a la izquierda -> siguiente
          setCurrentMatchIndex((prev) => (prev + 1) % matchItems.length);
        } else {
          // Swipe a la derecha -> anterior
          setCurrentMatchIndex((prev) => (prev - 1 + matchItems.length) % matchItems.length);
        }
      }
    }
    setTouchStartX(null);
    setTimeout(() => setIsHovered(false), 2000);
  };

  const activeItem = matchItems[currentMatchIndex] || matchItems[0];
  const hasAnyLive = matchItems.some(i => !i.match.isFinished && !i.match.isUpcoming);

  return (
    <>
      <div className="relative z-30 w-full bg-[#09090b]/90 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-all">
        {currentGoal ? (
          /* TAKEOVER DE GOL EN VIVO: Apple Live Alert Banner */
          <div className="w-full bg-gradient-to-r from-red-950/70 via-[#0c0d12]/95 to-amber-950/70 backdrop-blur-3xl border-y border-amber-500/30 py-2 sm:py-2.5 px-3 sm:px-6 shadow-[0_12px_40px_rgba(0,0,0,0.7)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
            {/* Info Gol */}
            <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-4 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-red-600 text-white font-bold text-[10px] sm:text-xs tracking-tight shadow-[0_2px_10px_rgba(239,68,68,0.5)] border-t border-white/30 shrink-0">
                  <span>⚽ ¡GOL!</span>
                  {goalQueue.length > 1 && (
                    <span className="bg-black/40 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-medium">
                      1/{goalQueue.length}
                    </span>
                  )}
                </span>

                <div className="flex items-center gap-1.5 font-bold text-white text-xs sm:text-sm tracking-tight truncate">
                  <span className="text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)] truncate">
                    {translateTeamNameToSpanish(currentGoal.scoringTeam)}
                  </span>
                  {currentGoal.scoringPlayer && (
                    <span className="text-white/70 font-normal text-[11px] sm:text-xs truncate">
                      · {currentGoal.jersey ? `${currentGoal.jersey}. ` : ''}{currentGoal.scoringPlayer}
                      {currentGoal.minute ? ` (${currentGoal.minute})` : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Marcador actual con números tabulares Apple */}
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/60 border border-white/15 font-mono tabular-nums font-bold text-white text-[11px] sm:text-xs shrink-0 shadow-sm">
                <span>{translateTeamAbbr(currentGoal.homeTeam)}</span>
                <span className="text-amber-400 mx-1">{currentGoal.homeScore}:{currentGoal.awayScore}</span>
                <span>{translateTeamAbbr(currentGoal.awayTeam)}</span>
              </div>
            </div>

            {/* Acciones de Gol */}
            <div className="flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleOpenMatch(currentGoal.matchData)}
                className="flex-1 sm:flex-none text-center px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-xs transition-all cursor-pointer shadow-sm active:scale-95 backdrop-blur-md"
              >
                Match Center →
              </button>

              <Link
                href={`/catalogo?query=${encodeURIComponent(translateTeamNameToSpanish(currentGoal.scoringTeam))}`}
                className="flex-1 sm:flex-none text-center inline-flex items-center justify-center gap-1 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs tracking-tight transition-all shadow-[0_4px_16px_rgba(229,9,20,0.4)] border-t border-white/30 cursor-pointer active:scale-95"
              >
                <span>Camiseta 10% OFF</span>
                <ArrowRight className="w-3 h-3" />
              </Link>

              <button
                type="button"
                onClick={() => setGoalQueue(prev => prev.slice(1))}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer text-xs ml-1 active:scale-90"
                title="Siguiente / Cerrar"
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          /* BARRA DE PARTIDOS: Estilo Apple puro, alturas uniformes y bordes sutiles */
          <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="max-w-7xl mx-auto px-3 sm:px-6 py-2 select-none"
          >
            {/* 🖥️ VISTA DESKTOP / PC (md: y superior): Alturas 100% uniformes (h-8 = 32px), nombres completos, sin rebordes blancos toscos */}
            <div className="hidden md:flex items-center justify-between gap-4 w-full h-8">
              {/* Lado izquierdo: Píldora unificada de Estado y Navegación (h-8) */}
              <div className="flex items-center h-8 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md px-3 gap-2.5 shrink-0">
                <span className="flex items-center gap-1.5 text-xs font-bold text-white tracking-tight">
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hasAnyLive ? "bg-red-400" : "bg-emerald-400"}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${hasAnyLive ? "bg-red-500" : "bg-emerald-500"}`}></span>
                  </span>
                  <span>{hasAnyLive ? "En Vivo" : "Matchday"}</span>
                </span>

                {isMultiple && (
                  <>
                    <span className="w-px h-3.5 bg-white/10" />
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={handlePrev}
                        aria-label="Partido anterior"
                        title="Partido anterior"
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>

                      <span className="text-[11px] font-mono font-medium text-white/60 px-1 tabular-nums">
                        {currentMatchIndex + 1}/{matchItems.length}
                      </span>

                      <button
                        type="button"
                        onClick={handleNext}
                        aria-label="Siguiente partido"
                        title="Siguiente partido"
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Centro: Cápsula Desktop con nombres completos (h-8 uniforme) */}
              <div className="flex-1 flex justify-center min-w-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeItem.id}
                    initial={{ opacity: 0, y: 3, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -3, scale: 0.99 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="flex justify-center"
                  >
                    <DesktopMatchCapsule item={activeItem} onOpenMatch={handleOpenMatch} />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Lado derecho: Cupón y Botón Ver Camisetas (ambos h-8) */}
              <div className="flex items-center gap-3 shrink-0 h-8">
                <span className="inline-flex text-xs font-medium text-white/70 items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cupón <code className="bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold border border-amber-500/20">MATCHDAY</code>: 10% OFF</span>
                </span>

                {(activeItem.hasHomeInDb || activeItem.hasAwayInDb) && (
                  <Link
                    href={activeItem.storeTeamId
                      ? `/catalogo?equipo=${encodeURIComponent(activeItem.storeTeamId)}`
                      : `/catalogo?query=${encodeURIComponent(activeItem.storeTeamName)}`}
                    className="inline-flex items-center justify-center h-8 px-3.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs tracking-tight shadow-sm active:scale-95 whitespace-nowrap cursor-pointer transition-all gap-1.5"
                  >
                    <span>Ver Camiseta</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>

            {/* 📱 VISTA MÓVIL (sm: y menor): Alturas 100% uniformes (h-7 = 28px), estilo Apple Live Activity */}
            <div className="flex md:hidden items-center justify-between w-full gap-2 h-7">
              {/* Lado izquierdo: Píldora compacta de Estado / Navegación (h-7) */}
              <div className="flex items-center h-7 rounded-full bg-white/[0.04] border border-white/[0.08] px-2 gap-1 shrink-0 backdrop-blur-md">
                {isMultiple ? (
                  <>
                    <button
                      type="button"
                      onClick={handlePrev}
                      aria-label="Anterior"
                      className="p-0.5 text-white/50 active:text-white"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <span className="text-[10px] font-mono font-bold text-white/70 px-0.5 tabular-nums">
                      {currentMatchIndex + 1}/{matchItems.length}
                    </span>
                    <button
                      type="button"
                      onClick={handleNext}
                      aria-label="Siguiente"
                      className="p-0.5 text-white/50 active:text-white"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hasAnyLive ? "bg-red-400" : "bg-emerald-400"}`}></span>
                      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${hasAnyLive ? "bg-red-500" : "bg-emerald-500"}`}></span>
                    </span>
                    <span>{hasAnyLive ? "VIVO" : "HOY"}</span>
                  </span>
                )}
              </div>

              {/* Centro: Cápsula Central Apple Live Activity para Móviles (h-7 uniforme) */}
              <div className="flex-1 flex justify-center min-w-0 h-7">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeItem.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full flex justify-center h-7"
                  >
                    <MobileMatchCapsule item={activeItem} onOpenMatch={handleOpenMatch} />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Lado derecho: Píldora 10% OFF compacta (h-7 uniforme) */}
              <div className="shrink-0 flex items-center h-7">
                <Link
                  href={activeItem.storeTeamId
                    ? `/catalogo?equipo=${encodeURIComponent(activeItem.storeTeamId)}`
                    : `/catalogo?query=${encodeURIComponent(activeItem.storeTeamName)}`}
                  className="inline-flex items-center justify-center h-7 px-2.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-300 font-bold text-[10px] tracking-tight active:scale-95 transition-all shadow-sm gap-1"
                >
                  <span>10% OFF</span>
                  <span className="text-[10px]">👕</span>
                </Link>
              </div>
            </div>

            {/* Puntos de paginación sutiles en móvil si hay múltiples partidos */}
            {isMultiple && (
              <div className="flex md:hidden items-center justify-center gap-1 pt-1.5">
                {matchItems.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentMatchIndex(idx)}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      idx === currentMatchIndex ? "w-3 bg-white" : "w-1 bg-white/20"
                    }`}
                    aria-label={`Ver partido ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL MATCH CENTER */}
      <MatchCenterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        match={selectedMatch}
      />
    </>
  );
}

/**
 * 🖥️ Cápsula para pantallas Desktop / PC:
 * Altura fija h-8 (32px), bordes sutiles sin reborde blanco y nombres completos.
 */
function DesktopMatchCapsule({
  item,
  onOpenMatch,
}: {
  item: {
    id: string;
    match: LiveMatchData;
    homeFullName: string;
    awayFullName: string;
    homeShortName: string;
    awayShortName: string;
    homeAbbr: string;
    awayAbbr: string;
    homeScore: number;
    awayScore: number;
    hasHomeInDb: boolean;
    hasAwayInDb: boolean;
    storeTeamName: string;
    storeTeamId?: string | null;
  };
  onOpenMatch: (match: LiveMatchData) => void;
}) {
  const { match, homeFullName, awayFullName, homeScore, awayScore, hasHomeInDb, hasAwayInDb } = item;
  const isFinished = match.isFinished;
  const isUpcoming = match.isUpcoming;

  return (
    <button
      type="button"
      onClick={() => onOpenMatch(match)}
      className="inline-flex items-center h-8 gap-3 px-3.5 rounded-full border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] transition-all duration-200 backdrop-blur-xl shadow-sm whitespace-nowrap shrink-0 cursor-pointer group"
    >
      {/* Badge Estado Estilo Apple Pill */}
      <span
        className={`h-5 px-2 rounded-full text-[10px] font-bold tracking-tight inline-flex items-center gap-1 shrink-0 ${
          isFinished
            ? "bg-amber-500/15 text-amber-300 border border-amber-500/25"
            : match.isHalftime
            ? "bg-amber-500/15 text-amber-300 border border-amber-500/25"
            : isUpcoming
            ? "bg-blue-500/15 text-blue-300 border border-blue-500/25"
            : "bg-red-500 text-white shadow-[0_2px_8px_rgba(239,68,68,0.4)]"
        }`}
      >
        {isFinished ? (
          <Trophy className="w-2.5 h-2.5" />
        ) : match.isHalftime ? (
          <Clock className="w-2.5 h-2.5 text-amber-300" />
        ) : isUpcoming ? (
          <Sparkles className="w-2.5 h-2.5" />
        ) : (
          <Flame className="w-2.5 h-2.5 fill-white" />
        )}
        <span>{isFinished ? "FINAL" : match.isHalftime ? "MT" : isUpcoming ? "PRÓX" : "VIVO"}</span>
      </span>

      {/* Equipo Local: Escudo + Nombre COMPLETO */}
      <div className="flex items-center gap-2 max-w-[170px] lg:max-w-[210px]">
        {match.homeLogo && (
          <img
            src={match.homeLogo}
            alt=""
            className="w-4 h-4 object-contain rounded-full shrink-0 drop-shadow-sm"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        <span
          title={homeFullName}
          className={`text-xs lg:text-sm font-semibold truncate tracking-tight ${
            hasHomeInDb ? "text-white underline decoration-red-500/80 decoration-2 underline-offset-4" : "text-white/90"
          }`}
        >
          {homeFullName}
        </span>
      </div>

      {/* Marcador Central Tabular Apple */}
      {isUpcoming ? (
        <span className="h-5 px-2 rounded bg-black/40 border border-white/[0.06] text-white/50 text-xs font-medium inline-flex items-center">
          {match.startTime || "vs"}
        </span>
      ) : (
        <span className="h-5 px-2 rounded bg-black/50 border border-white/[0.08] font-mono tabular-nums font-bold text-xs lg:text-sm text-white inline-flex items-center gap-1">
          <span className={isFinished ? "text-amber-400" : "text-white"}>{homeScore}</span>
          <span className="text-white/40 text-xs">:</span>
          <span className={isFinished ? "text-amber-400" : "text-white"}>{awayScore}</span>
        </span>
      )}

      {/* Equipo Visitante: Nombre COMPLETO + Escudo */}
      <div className="flex items-center gap-2 max-w-[170px] lg:max-w-[210px]">
        <span
          title={awayFullName}
          className={`text-xs lg:text-sm font-semibold truncate tracking-tight text-right ${
            hasAwayInDb ? "text-white underline decoration-red-500/80 decoration-2 underline-offset-4" : "text-white/90"
          }`}
        >
          {awayFullName}
        </span>
        {match.awayLogo && (
          <img
            src={match.awayLogo}
            alt=""
            className="w-4 h-4 object-contain rounded-full shrink-0 drop-shadow-sm"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
      </div>

      {/* Minuto de Juego / Tiempo */}
      {!isFinished && !isUpcoming && !match.isHalftime && (match.displayClock || match.minute) && (
        <span className="h-5 px-1.5 rounded-full bg-white/10 text-[10px] text-white/90 font-mono font-bold animate-pulse inline-flex items-center">
          {match.displayClock || `${match.minute}'`}
        </span>
      )}

      {/* Enlace sutil al Match Center */}
      <span className="text-xs text-white/35 group-hover:text-white/80 transition-colors pl-0.5 font-medium">
        Match Center →
      </span>
    </button>
  );
}

/**
 * 📱 Cápsula para pantallas Móviles:
 * Altura fija h-7 (28px), proporciones compactas sin scrolls ni rebordes toscos.
 */
function MobileMatchCapsule({
  item,
  onOpenMatch,
}: {
  item: {
    id: string;
    match: LiveMatchData;
    homeFullName: string;
    awayFullName: string;
    homeShortName: string;
    awayShortName: string;
    homeAbbr: string;
    awayAbbr: string;
    homeScore: number;
    awayScore: number;
    hasHomeInDb: boolean;
    hasAwayInDb: boolean;
    storeTeamName: string;
    storeTeamId?: string | null;
  };
  onOpenMatch: (match: LiveMatchData) => void;
}) {
  const { match, homeAbbr, awayAbbr, homeScore, awayScore, hasHomeInDb, hasAwayInDb } = item;
  const isFinished = match.isFinished;
  const isUpcoming = match.isUpcoming;

  return (
    <button
      type="button"
      onClick={() => onOpenMatch(match)}
      className="inline-flex items-center justify-between h-7 gap-2 px-2.5 rounded-full border border-white/[0.08] bg-white/[0.04] active:bg-white/[0.08] active:scale-[0.98] transition-all backdrop-blur-xl shadow-sm cursor-pointer select-none max-w-full"
    >
      {/* Equipo Local: Escudo + Abreviatura */}
      <div className="flex items-center gap-1 min-w-0 shrink-0">
        {match.homeLogo && (
          <img
            src={match.homeLogo}
            alt=""
            className="w-3.5 h-3.5 object-contain rounded-full shrink-0"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        <span className={`text-[11px] font-bold tracking-tight ${hasHomeInDb ? "text-white underline decoration-red-500/80 decoration-2 underline-offset-2" : "text-white/90"}`}>
          {homeAbbr}
        </span>
      </div>

      {/* Marcador Central Tabular / Reloj */}
      <div className="flex items-center gap-1 shrink-0 px-0.5">
        {isUpcoming ? (
          <span className="text-[10px] text-blue-300 font-mono font-medium px-1">
            {match.startTime || "vs"}
          </span>
        ) : (
          <div className="flex items-center gap-1">
            <span className="px-1 py-0.2 rounded bg-black/50 border border-white/[0.06] font-mono tabular-nums font-bold text-[11px] text-white inline-flex items-center">
              <span className={isFinished ? "text-amber-400" : "text-white"}>{homeScore}</span>
              <span className="text-white/40 mx-0.5">:</span>
              <span className={isFinished ? "text-amber-400" : "text-white"}>{awayScore}</span>
            </span>

            {/* Minuto o FT */}
            {isFinished ? (
              <span className="text-[9px] text-amber-400 font-bold font-mono">FT</span>
            ) : match.isHalftime ? (
              <span className="text-[9px] text-amber-300 font-bold font-mono">MT</span>
            ) : (match.displayClock || match.minute) ? (
              <span className="text-[9px] text-red-400 font-bold font-mono animate-pulse">
                {match.displayClock || `${match.minute}'`}
              </span>
            ) : null}
          </div>
        )}
      </div>

      {/* Equipo Visitante: Abreviatura + Escudo */}
      <div className="flex items-center gap-1 min-w-0 shrink-0">
        <span className={`text-[11px] font-bold tracking-tight ${hasAwayInDb ? "text-white underline decoration-red-500/80 decoration-2 underline-offset-2" : "text-white/90"}`}>
          {awayAbbr}
        </span>
        {match.awayLogo && (
          <img
            src={match.awayLogo}
            alt=""
            className="w-3.5 h-3.5 object-contain rounded-full shrink-0"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
      </div>
    </button>
  );
}


