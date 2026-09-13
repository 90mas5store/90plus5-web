"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, ArrowRight, Flame, Trophy, Radio, Clock } from "lucide-react";
import { useLiveMatches, LiveMatchData, LiveGoalAlert } from "@/hooks/useLiveMatches";
import MatchCenterModal from "@/components/match/MatchCenterModal";

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
    const scoreA = (!matchA.isFinished && !matchA.isUpcoming) ? 3 : matchA.isFinished ? 2 : 1;
    const scoreB = (!matchB.isFinished && !matchB.isUpcoming) ? 3 : matchB.isFinished ? 2 : 1;
    return scoreB - scoreA;
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
    const homeAbbr = match.homeAbbr || match.homeShortTeam?.slice(0, 3).toUpperCase() || match.homeTeam.slice(0, 3).toUpperCase();
    const awayAbbr = match.awayAbbr || match.awayShortTeam?.slice(0, 3).toUpperCase() || match.awayTeam.slice(0, 3).toUpperCase();
    const homeScore = match.homeScore;
    const awayScore = match.awayScore;

    const hasHomeInDb = Boolean(match.hasHomeTeamInDb || match.homeTeamId);
    const hasAwayInDb = Boolean(match.hasAwayTeamInDb || match.awayTeamId);

    const storeTeamName = hasHomeInDb ? match.homeTeam : hasAwayInDb ? match.awayTeam : match.homeTeam;
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
      <div className="relative z-30 w-full bg-[#09090b]/95 backdrop-blur-xl border-b border-[#E50914]/40 overflow-hidden shadow-[0_8px_30px_rgba(229,9,20,0.35)] whitespace-nowrap">
        {currentGoal ? (
          /* TAKEOVER DE GOL EN VIVO: ADAPTATIVO EN MÓVIL Y ESCRITORIO (SIN CORTES) */
          <div className="w-full bg-gradient-to-r from-red-950/95 via-neutral-950 to-amber-950/95 border-y border-amber-500/50 py-2 px-3 sm:px-6 shadow-[0_0_30px_rgba(245,158,11,0.35)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 animate-in fade-in duration-300">
            {/* Info Gol */}
            <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-red-600 text-white font-black uppercase text-[10px] sm:text-xs tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse shrink-0">
                  <span>⚽ ¡GOL!</span>
                  {goalQueue.length > 1 && (
                    <span className="bg-black/50 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-normal">
                      1/{goalQueue.length}
                    </span>
                  )}
                </span>

                <div className="flex items-center gap-1.5 font-black text-white text-xs sm:text-sm truncate">
                  <span className="text-amber-400 font-bold drop-shadow-[0_0_10px_rgba(245,158,11,0.4)] truncate">
                    {currentGoal.scoringTeam}
                  </span>
                  {currentGoal.scoringPlayer && (
                    <span className="text-gray-300 font-medium text-[11px] sm:text-xs truncate">
                      · {currentGoal.jersey ? `${currentGoal.jersey}. ` : ''}{currentGoal.scoringPlayer}
                      {currentGoal.minute ? ` (${currentGoal.minute})` : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Marcador actual en el Takeover */}
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/80 border border-white/20 font-mono font-black text-white text-[11px] sm:text-sm shrink-0">
                <span>{currentGoal.homeTeam.slice(0, 3).toUpperCase()}</span>
                <span className="text-amber-400 mx-1">{currentGoal.homeScore}:{currentGoal.awayScore}</span>
                <span>{currentGoal.awayTeam.slice(0, 3).toUpperCase()}</span>
              </div>
            </div>

            {/* Acciones de Gol (Siempre visibles sin requerir swipe en móvil) */}
            <div className="flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleOpenMatch(currentGoal.matchData)}
                className="flex-1 sm:flex-none text-center px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95"
              >
                Match Center →
              </button>

              <Link
                href={`/catalogo?query=${encodeURIComponent(currentGoal.scoringTeam)}`}
                className="flex-1 sm:flex-none text-center inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 cursor-pointer active:scale-95"
              >
                <span>Camiseta 10% OFF</span>
                <ArrowRight className="w-3 h-3" />
              </Link>

              <button
                type="button"
                onClick={() => setGoalQueue(prev => prev.slice(1))}
                className="p-1 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer text-xs ml-0.5"
                title="Siguiente / Cerrar"
              >
                ✕
              </button>
            </div>
          </div>
        ) : !isMultiple ? (
          /* MODO 1 SOLO PARTIDO */
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-row items-center justify-between gap-3 overflow-x-auto scrollbar-none">
            <MatchCapsule item={matchItems[0]} onOpenMatch={handleOpenMatch} />

            <div className="flex items-center gap-3 shrink-0">
              <span className="hidden md:inline-flex text-xs font-semibold text-gray-300 items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Cupón <code className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">MATCHDAY</code>: 10% OFF</span>
              </span>

              {(matchItems[0].hasHomeInDb || matchItems[0].hasAwayInDb) && (
                <Link
                  href={matchItems[0].storeTeamId
                    ? `/catalogo?equipo=${encodeURIComponent(matchItems[0].storeTeamId)}`
                    : `/catalogo?query=${encodeURIComponent(matchItems[0].storeTeamName)}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E50914] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider transition-all hover:scale-105 shadow-md shadow-red-600/30 whitespace-nowrap cursor-pointer"
                >
                  <span>Ver Camiseta Oficial</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* MODO TICKER DE MÚLTIPLES PARTIDOS */
          <div className="relative flex items-center py-2 group">
            {/* Título fijo en el extremo izquierdo (Compacto en móvil) */}
            <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center px-2.5 sm:px-5 bg-gradient-to-r from-[#09090b] via-[#09090b]/95 to-transparent pr-4 sm:pr-6">
              <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#E50914] text-white text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(229,9,20,0.8)] animate-pulse whitespace-nowrap">
                <Radio className="w-3 h-3" />
                <span className="hidden sm:inline">JORNADA EN VIVO</span>
                <span className="inline sm:hidden">EN VIVO</span>
              </span>
            </div>

            {/* Track Marquee de Partidos */}
            <div className="animate-marquee pl-28 sm:pl-56 space-x-3 sm:space-x-6 flex items-center whitespace-nowrap">
              {loopList.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="shrink-0 flex items-center gap-3">
                  <MatchCapsule item={item} onOpenMatch={handleOpenMatch} />
                  <span className="text-gray-700 font-bold">•</span>
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
      className={`inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 rounded-2xl border transition-all hover:scale-105 whitespace-nowrap shrink-0 cursor-pointer shadow-md ${
        isFinished
          ? "bg-amber-950/40 border-amber-500/40 text-amber-100 hover:border-amber-400"
          : isUpcoming
          ? "bg-blue-950/40 border-blue-500/40 text-blue-100 hover:border-blue-400"
          : "bg-red-950/40 border-red-500/40 text-white hover:border-red-500 hover:shadow-[0_0_15px_rgba(229,9,20,0.3)]"
      }`}
    >
      {/* Badge Estado */}
      <span
        className={`px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0 ${
          isFinished
            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
            : match.isHalftime
            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
            : isUpcoming
            ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
            : "bg-red-600 text-white shadow-sm"
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
        <span>{isFinished ? "FINAL" : match.isHalftime ? "ENTRETIEMPO" : isUpcoming ? "PRÓXIMO" : "EN VIVO"}</span>
      </span>

      {/* Enfrentamiento: LOCAL vs VISITA */}
      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black">
        <span className={hasHomeInDb ? "text-white underline decoration-red-500 decoration-2 underline-offset-4" : "text-gray-300"}>
          {homeAbbr}
        </span>

        {isUpcoming ? (
          <span className="text-gray-500 font-normal px-1">vs</span>
        ) : (
          <span className="px-1.5 py-0.5 rounded-lg bg-black/60 border border-white/10 font-mono font-black text-white">
            <span className={isFinished ? "text-amber-400" : "text-white"}>{homeScore}</span>
            <span className="text-gray-500 mx-1">:</span>
            <span className={isFinished ? "text-amber-400" : "text-white"}>{awayScore}</span>
          </span>
        )}

        <span className={hasAwayInDb ? "text-white underline decoration-red-500 decoration-2 underline-offset-4" : "text-gray-300"}>
          {awayAbbr}
        </span>
      </div>

      {/* Minuto o Horario */}
      {isFinished ? (
        <span className="text-[10px] text-amber-400/90 font-mono font-bold">FT</span>
      ) : isUpcoming ? (
        <span className="text-[10px] text-blue-300 font-mono font-bold">{match.startTime || "Hoy"}</span>
      ) : !match.isHalftime && (match.displayClock || match.minute) ? (
        <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-gray-200 font-mono font-black animate-pulse">
          {match.displayClock || `${match.minute}'`}
        </span>
      ) : null}

      <span className="text-[10px] text-gray-400 group-hover:text-white transition-colors ml-0.5">
        Ver Match Center →
      </span>
    </button>
  );
}
