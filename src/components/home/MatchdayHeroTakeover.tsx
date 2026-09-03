"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Flame, Trophy, Sparkles, ArrowRight, Shield } from "lucide-react";
import { useLiveMatches, LiveMatchData } from "@/hooks/useLiveMatches";
import { motion, AnimatePresence } from "@/lib/motion";

function TeamLogo({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  if (!src || error) {
    return <Shield className="w-8 h-8 sm:w-12 sm:h-12 text-gray-500" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
      className={className || "w-full h-full object-contain filter drop-shadow-[0_5px_15px_rgba(255,255,255,0.25)] group-hover:scale-110 transition-transform duration-300"}
    />
  );
}

export default function MatchdayHeroTakeover() {
  const liveMatches = useLiveMatches();
  const rawEntries = Object.entries(liveMatches);

  // Deduplicar partidos por enfrentamiento único y ordenar por prioridad: EN VIVO > FINALIZADO > PRÓXIMO
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

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (activeEntries.length === 0) return;
    if (currentIndex >= activeEntries.length) {
      setCurrentIndex(0);
    }
  }, [activeEntries.length, currentIndex]);

  useEffect(() => {
    if (activeEntries.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeEntries.length);
    }, 8000);

    return () => clearInterval(timer);
  }, [activeEntries.length, isPaused]);

  if (activeEntries.length === 0) return null;

  const matchItems = activeEntries.map(([id, match]) => {
    const teamPlaying = match.isHome ? match.homeTeam : match.awayTeam;
    const opponent = match.isHome ? match.awayTeam : match.homeTeam;
    const teamPlayingShort = match.isHome ? (match.homeShortTeam || match.homeTeam) : (match.awayShortTeam || match.awayTeam);
    const opponentShort = match.isHome ? (match.awayShortTeam || match.awayTeam) : (match.homeShortTeam || match.homeTeam);
    const teamPlayingDbName = match.isHome ? (match.homeTeamDbName || teamPlayingShort) : (match.awayTeamDbName || opponentShort);
    const opponentDbName = match.isHome ? (match.awayTeamDbName || opponentShort) : (match.homeTeamDbName || teamPlayingShort);
    const teamScore = match.isHome ? match.homeScore : match.awayScore;
    const opponentScore = match.isHome ? match.awayScore : match.homeScore;
    const homeLogo = match.homeLogo;
    const awayLogo = match.awayLogo;

    const teamPlayingId = match.isHome ? (match.homeTeamId || id) : match.awayTeamId;
    const opponentId = match.isHome ? match.awayTeamId : (match.homeTeamId || id);

    return {
      id,
      match,
      teamPlaying,
      opponent,
      teamPlayingShort,
      opponentShort,
      teamPlayingDbName,
      opponentDbName,
      teamScore,
      opponentScore,
      homeLogo,
      awayLogo,
      teamPlayingId,
      opponentId,
    };
  });

  const activeItem = matchItems[currentIndex] || matchItems[0];
  const { match, teamPlaying, opponent, teamScore, opponentScore } = activeItem;

  const activeHomeLogo = match.isHome ? activeItem.homeLogo : activeItem.awayLogo;
  const activeAwayLogo = match.isHome ? activeItem.awayLogo : activeItem.homeLogo;

  const hasTeamPlayingInDb = match.isHome ? match.hasHomeTeamInDb !== false : match.hasAwayTeamInDb !== false;
  const hasOpponentInDb = match.isHome ? !!match.hasAwayTeamInDb : !!match.hasHomeTeamInDb;

  return (
    <div
      className="relative w-full overflow-hidden bg-gradient-to-b from-black via-neutral-950 to-black text-white pt-24 sm:pt-28 md:pt-32 pb-8 sm:pb-10 md:pb-12 border-b border-[#E50914]/30 shadow-[0_15px_50px_rgba(229,9,20,0.25)]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Fondo Ambiance de Estadio */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950/30 via-black to-black opacity-80 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-3 sm:px-6">
        
        {/* ──────── 1. BARRA SUPERIOR DE MINIATURAS (TOUCH-SCROLLABLE EN MÓVIL) ──────── */}
        {matchItems.length > 1 && (
          <div className="mb-3 sm:mb-4 flex items-center justify-start md:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none touch-pan-x">
            <span className="text-[11px] sm:text-xs font-black uppercase text-red-500 tracking-wider flex items-center gap-1 shrink-0 mr-1">
              <Flame className="w-3.5 h-3.5 fill-red-500" />
              {matchItems.some(i => !i.match.isFinished && !i.match.isUpcoming)
                ? "En Vivo:"
                : matchItems.some(i => i.match.isFinished)
                ? "Jornada:"
                : "Próximos:"}
            </span>

            {matchItems.map((item, idx) => {
              const isActive = idx === currentIndex;
              const isUpc = item.match.isUpcoming;
              const isFin = item.match.isFinished;

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`shrink-0 transition-all duration-300 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border cursor-pointer ${
                    isActive
                      ? isUpc
                        ? "bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.8)] scale-105"
                        : isFin
                        ? "bg-amber-600 text-white border-amber-400 shadow-[0_0_15px_rgba(217,119,6,0.8)] scale-105"
                        : "bg-[#E50914] text-white border-red-500 shadow-[0_0_15px_rgba(229,9,20,0.8)] scale-105"
                      : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="whitespace-nowrap">
                    {item.teamPlaying} <span className="opacity-70 font-normal">vs</span> {item.opponent}
                  </span>
                  {isUpc ? (
                    <span className="bg-black/50 px-2 py-0.5 rounded-full text-[10px] text-blue-300 font-bold">
                      {item.match.startTime || "Próximo"}
                    </span>
                  ) : (
                    <span className="bg-black/50 px-2 py-0.5 rounded-full text-[11px] text-amber-300 font-mono font-bold">
                      {item.teamScore} - {item.opponentScore}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ──────── 2. ESCENARIO PRINCIPAL (HERO TAKEOVER RESPONSIVE) ──────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35 }}
            className="bg-neutral-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
          >
            {/* BADGE CABECERA (TORNEO & ESTADO) */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 sm:mb-5">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider ${
                match.isFinished
                  ? "bg-amber-500/20 border border-amber-500/40 text-amber-400"
                  : match.isUpcoming
                  ? "bg-blue-500/20 border border-blue-500/40 text-blue-400"
                  : "bg-[#E50914]/20 border border-[#E50914]/40 text-red-400"
              }`}>
                {match.isFinished ? (
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                ) : match.isUpcoming ? (
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <Flame className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
                )}
                <span>
                  {match.leagueName ? match.leagueName.toUpperCase() : "MATCHDAY"}
                  {match.isFinished
                    ? " · RESULTADO FINAL"
                    : match.isUpcoming
                    ? " · PRÓXIMO ENCUENTRO"
                    : " · EN VIVO"}
                </span>
              </span>

              {!match.isFinished && !match.isUpcoming && match.minute && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-gray-300 text-[10px] sm:text-xs font-bold font-mono animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  MINUTO {match.minute}&apos;
                </span>
              )}
            </div>

            {/* MARCADOR PRINCIPAL CON ESCUDOS */}
            <div className="grid grid-cols-3 items-center justify-items-center gap-2 sm:gap-4 my-2 sm:my-3">
              
              {/* EQUIPO LOCAL / NUESTRO EQUIPO */}
              <div className="flex flex-col items-center text-center gap-2 sm:gap-3 w-full">
                <div className="w-14 h-14 sm:w-24 sm:h-24 md:w-28 md:h-28 relative flex items-center justify-center bg-white/5 rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-white/10 shadow-lg group">
                  <TeamLogo src={activeHomeLogo} alt={teamPlaying} />
                </div>
                <h2 className="text-xs sm:text-lg md:text-2xl font-black text-white tracking-tight line-clamp-2">
                  <span className="hidden sm:inline">{teamPlaying}</span>
                  <span className="inline sm:hidden">{activeItem.teamPlayingShort}</span>
                </h2>
              </div>

              {/* MARCADOR GLOBAL / VERSUS */}
              <div className="flex flex-col items-center justify-center text-center">
                {match.isUpcoming ? (
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-3xl sm:text-5xl md:text-6xl font-black text-blue-400 font-mono tracking-wider">
                      VS
                    </span>
                    <span className="mt-1 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] sm:text-xs md:text-sm font-bold tracking-wide">
                      {match.startTime || "Próximo Partido"}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 sm:gap-4 md:gap-6 text-2xl sm:text-5xl md:text-7xl font-black text-white font-mono tracking-tighter">
                      <span className={match.isFinished ? "text-amber-400" : "text-red-500"}>
                        {teamScore}
                      </span>
                      <span className="text-gray-600 font-light">-</span>
                      <span className="text-gray-300">{opponentScore}</span>
                    </div>
                    <span className="mt-1 text-[10px] sm:text-xs md:text-sm text-gray-400 font-semibold uppercase tracking-widest whitespace-nowrap">
                      {match.isFinished ? "Partido Finalizado" : "En Vivo"}
                    </span>
                  </>
                )}
              </div>

              {/* RIVAL */}
              <div className="flex flex-col items-center text-center gap-2 sm:gap-3 w-full">
                <div className="w-14 h-14 sm:w-24 sm:h-24 md:w-28 md:h-28 relative flex items-center justify-center bg-white/5 rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-white/10 shadow-lg group">
                  <TeamLogo src={activeAwayLogo} alt={opponent} />
                </div>
                <h2 className="text-xs sm:text-lg md:text-2xl font-black text-gray-300 tracking-tight line-clamp-2">
                  <span className="hidden sm:inline">{opponent}</span>
                  <span className="inline sm:hidden">{activeItem.opponentShort}</span>
                </h2>
              </div>

            </div>

            {/* ──────── 3. OFERTA Y BOTONES DE COMPRA RESPONSIVE PARA EQUIPOS EN BD ──────── */}
            <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-white/10 flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300 text-center lg:text-left">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Aprovecha el descuento Matchday: Usa el código{" "}
                  <code className="bg-amber-500/20 text-amber-300 font-mono font-bold px-2 py-0.5 rounded border border-amber-500/30">
                    MATCHDAY
                  </code>{" "}
                  para <strong>10% OFF</strong>
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
                {hasTeamPlayingInDb && (
                  <Link
                    href={activeItem.teamPlayingId
                      ? `/catalogo?equipo=${encodeURIComponent(activeItem.teamPlayingId)}`
                      : `/catalogo?query=${encodeURIComponent(teamPlaying)}`}
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.trackEvent) {
                        window.trackEvent('matchday_click', { team: teamPlaying, role: 'team_playing', match: match.leagueName });
                      }
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#E50914] hover:bg-red-700 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all hover:scale-105 shadow-[0_0_20px_rgba(229,9,20,0.5)] active:scale-95"
                  >
                    <span>Camisetas {activeItem.teamPlayingDbName || activeItem.teamPlayingShort || teamPlaying}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}

                {hasOpponentInDb && opponent && opponent !== 'Rival' && (
                  <Link
                    href={activeItem.opponentId
                      ? `/catalogo?equipo=${encodeURIComponent(activeItem.opponentId)}`
                      : `/catalogo?query=${encodeURIComponent(opponent)}`}
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.trackEvent) {
                        window.trackEvent('matchday_click', { team: opponent, role: 'opponent', match: match.leagueName });
                      }
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                  >
                    <span>Camisetas {activeItem.opponentDbName || activeItem.opponentShort || opponent}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </Link>
                )}

                {!hasTeamPlayingInDb && !hasOpponentInDb && (
                  <Link
                    href="/catalogo"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#E50914] hover:bg-red-700 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all hover:scale-105 shadow-[0_0_20px_rgba(229,9,20,0.5)] active:scale-95"
                  >
                    <span>Ver Catálogo</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* BARRA DE PROGRESO DE ROTACIÓN (8 SEGUNDOS) */}
        {matchItems.length > 1 && (
          <div className="mt-3 sm:mt-4 w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              key={activeItem.id}
              className={`h-full ${isPaused ? "bg-gray-500" : "bg-[#E50914]"} transition-all duration-300`}
              style={{
                width: "100%",
                animation: isPaused ? "none" : "progress 8s linear infinite",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
