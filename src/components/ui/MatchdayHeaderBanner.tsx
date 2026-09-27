"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, ArrowRight, Flame, Trophy, Radio, Clock } from "lucide-react";
import { useLiveMatches, LiveMatchData, LiveGoalAlert } from "@/hooks/useLiveMatches";
import MatchCenterModal from "@/components/match/MatchCenterModal";
import { translateTeamNameToSpanish, translateTeamAbbr } from "@/lib/teamNames";

export default function MatchdayHeaderBanner() {
  const pathname = usePathname();
  const liveMatches = useLiveMatches();
  const [selectedMatch, setSelectedMatch] = useState<LiveMatchData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalQueue, setGoalQueue] = useState<LiveGoalAlert[]>([]);

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

  // ORDEN ESTRICTO: LOCAL A LA IZQUIERDA, VISITA A LA DERECHA
  const matchItems = activeEntries.map(([id, match]) => {
    const homeName = translateTeamNameToSpanish(match.homeTeam);
    const awayName = translateTeamNameToSpanish(match.awayTeam);
    const homeAbbr = match.homeAbbr ? translateTeamAbbr(homeName, match.homeAbbr) : translateTeamAbbr(homeName, match.homeShortTeam);
    const awayAbbr = match.awayAbbr ? translateTeamAbbr(awayName, match.awayAbbr) : translateTeamAbbr(awayName, match.awayShortTeam);
    const homeScore = match.homeScore;
    const awayScore = match.awayScore;

    const hasHomeInDb = Boolean(match.hasHomeTeamInDb || match.homeTeamId);
    const hasAwayInDb = Boolean(match.hasAwayTeamInDb || match.awayTeamId);

    const storeTeamName = hasHomeInDb ? homeName : hasAwayInDb ? awayName : homeName;
    const storeTeamId = hasHomeInDb ? (match.homeTeamId || id) : hasAwayInDb ? match.awayTeamId : null;

    return {
      id,
      match,
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

  const loopList = isMultiple
    ? [...matchItems, ...matchItems, ...matchItems, ...matchItems]
    : matchItems;

  const handleOpenMatch = (match: LiveMatchData) => {
    setSelectedMatch(match);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="relative z-30 w-full bg-[#09090b]/80 backdrop-blur-2xl border-b border-white/[0.08] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.4)] whitespace-nowrap">
        {currentGoal ? (
          /* TAKEOVER DE GOL EN VIVO: Apple Live Alert Banner (§12 Materials & Depth) */
          <div className="w-full bg-gradient-to-r from-red-950/70 via-[#0c0d12]/95 to-amber-950/70 backdrop-blur-3xl border-y border-amber-500/30 py-2.5 px-4 sm:px-6 shadow-[0_12px_40px_rgba(0,0,0,0.7)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
            {/* Info Gol */}
            <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-4 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-red-600 text-white font-bold text-[10px] sm:text-xs tracking-tight shadow-[0_2px_10px_rgba(239,68,68,0.5)] border-t border-white/30 shrink-0">
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

            {/* Acciones de Gol — Cápsulas Apple con respuesta táctil inmediata */}
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
        ) : !isMultiple ? (
          /* MODO 1 SOLO PARTIDO */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-row items-center justify-between gap-3 overflow-x-auto scrollbar-none">
            <MatchCapsule item={matchItems[0]} onOpenMatch={handleOpenMatch} />

            <div className="flex items-center gap-3 shrink-0">
              <span className="hidden md:inline-flex text-xs font-medium text-white/70 items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Cupón <code className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">MATCHDAY</code>: 10% OFF</span>
              </span>

              {(matchItems[0].hasHomeInDb || matchItems[0].hasAwayInDb) && (
                <Link
                  href={matchItems[0].storeTeamId
                    ? `/catalogo?equipo=${encodeURIComponent(matchItems[0].storeTeamId)}`
                    : `/catalogo?query=${encodeURIComponent(matchItems[0].storeTeamName)}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs tracking-tight shadow-[0_4px_16px_rgba(229,9,20,0.4)] border-t border-white/25 active:scale-95 whitespace-nowrap cursor-pointer transition-all"
                >
                  <span>Ver Camiseta</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* MODO TICKER DE MÚLTIPLES PARTIDOS: Apple Live Activities */
          <div className="relative flex items-center py-2 group">
            {/* Título fijo en el extremo izquierdo estilo Dynamic Island */}
            <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center px-3 sm:px-5 bg-gradient-to-r from-[#09090b] via-[#09090b]/90 to-transparent pr-5 sm:pr-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08] border border-white/15 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold tracking-tight shadow-sm whitespace-nowrap">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="hidden sm:inline">Jornada en Vivo</span>
                <span className="inline sm:hidden">En Vivo</span>
              </span>
            </div>

            {/* Track Marquee de Partidos */}
            <div className="animate-marquee pl-32 sm:pl-56 space-x-3 sm:space-x-5 flex items-center whitespace-nowrap">
              {loopList.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="shrink-0 flex items-center gap-3">
                  <MatchCapsule item={item} onOpenMatch={handleOpenMatch} />
                  <span className="text-white/20 font-bold">•</span>
                </div>
              ))}
            </div>
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

function MatchCapsule({
  item,
  onOpenMatch,
}: {
  item: {
    id: string;
    match: LiveMatchData;
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
      className="inline-flex items-center gap-2.5 px-3 sm:px-3.5 py-1 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.09] hover:border-white/20 active:scale-96 transition-all duration-200 backdrop-blur-md shadow-sm whitespace-nowrap shrink-0 cursor-pointer select-none"
    >
      {/* Badge Estado Estilo Apple Pill */}
      <span
        className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-tight flex items-center gap-1 shrink-0 ${
          isFinished
            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            : match.isHalftime
            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            : isUpcoming
            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
            : "bg-[#E50914] text-white shadow-[0_2px_8px_rgba(229,9,20,0.5)]"
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

      {/* Enfrentamiento: LOCAL vs VISITA */}
      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold tracking-tight">
        <span className={hasHomeInDb ? "text-white underline decoration-red-500/80 decoration-2 underline-offset-4" : "text-white/80"}>
          {homeAbbr}
        </span>

        {isUpcoming ? (
          <span className="text-white/40 font-normal px-0.5 text-xs">vs</span>
        ) : (
          <span className="px-1.5 py-0.5 rounded-full bg-black/60 border border-white/10 font-mono tabular-nums font-bold text-white text-xs">
            <span className={isFinished ? "text-amber-400" : "text-white"}>{homeScore}</span>
            <span className="text-white/40 mx-0.5">:</span>
            <span className={isFinished ? "text-amber-400" : "text-white"}>{awayScore}</span>
          </span>
        )}

        <span className={hasAwayInDb ? "text-white underline decoration-red-500/80 decoration-2 underline-offset-4" : "text-white/80"}>
          {awayAbbr}
        </span>
      </div>

      {/* Minuto o Horario */}
      {isFinished ? (
        <span className="text-[10px] text-amber-400/90 font-mono font-bold">FT</span>
      ) : isUpcoming ? (
        <span className="text-[10px] text-blue-300 font-mono font-medium">{match.startTime || "Hoy"}</span>
      ) : !match.isHalftime && (match.displayClock || match.minute) ? (
        <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px] text-white/90 font-mono font-bold animate-pulse">
          {match.displayClock || `${match.minute}'`}
        </span>
      ) : null}

      <span className="text-[10px] text-white/40 group-hover:text-white/80 transition-colors ml-0.5 font-medium">
        Match Center →
      </span>
    </button>
  );
}
