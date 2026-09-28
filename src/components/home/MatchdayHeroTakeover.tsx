"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Flame, Trophy, Sparkles, ArrowRight, Shield, BarChart3, Radio, Shirt, Clock } from "lucide-react";
import { useLiveMatches, LiveMatchData } from "@/hooks/useLiveMatches";
import { motion, AnimatePresence } from "@/lib/motion";
import MatchCenterModal from "@/components/match/MatchCenterModal";

import { resolveMatchColors } from "@/lib/teamColors";
import { translateTeamNameToSpanish, translateTeamShortName } from "@/lib/teamNames";

function TeamShield({ src, alt, color, isWhite }: { src?: string | null; alt: string; color: string; isWhite?: boolean }) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  if (!src || error) {
    return <Shield className="w-12 h-12 text-gray-500" />;
  }

  return (
    <div
      className="relative w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-[1.6rem] sm:rounded-[2.2rem] p-3 sm:p-4 flex items-center justify-center border border-white/15 shadow-2xl transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xl overflow-hidden"
      style={{
        backgroundColor: isWhite ? "rgba(255, 255, 255, 0.12)" : `${color}18`,
        boxShadow: isWhite ? "0 12px 35px rgba(255, 255, 255, 0.2)" : `0 12px 35px ${color}30`,
      }}
    >
      {/* Specular hairline superior */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

      <Image
        src={src}
        alt={alt}
        width={112}
        height={112}
        onError={() => setError(true)}
        className="w-full h-full object-contain filter drop-shadow-[0_6px_16px_rgba(0,0,0,0.7)]"
      />
    </div>
  );
}

export default function MatchdayHeroTakeover() {
  const liveMatches = useLiveMatches();
  const [selectedMatch, setSelectedMatch] = useState<LiveMatchData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (activeEntries.length === 0) return;
    if (currentIndex >= activeEntries.length) {
      setCurrentIndex(0);
    }
  }, [activeEntries.length, currentIndex]);

  useEffect(() => {
    if (activeEntries.length <= 1 || isPaused || isModalOpen) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeEntries.length);
    }, 8500);

    return () => clearInterval(timer);
  }, [activeEntries.length, isPaused, isModalOpen]);

  if (activeEntries.length === 0) return null;

  // ORDEN ESTRICTO: LOCAL A LA IZQUIERDA, VISITA A LA DERECHA
  const matchItems = activeEntries.map(([id, match]) => {
    const homeName = translateTeamNameToSpanish(match.homeTeam);
    const awayName = translateTeamNameToSpanish(match.awayTeam);
    const homeShort = translateTeamShortName(homeName, match.homeShortTeam);
    const awayShort = translateTeamShortName(awayName, match.awayShortTeam);
    const homeScore = match.homeScore;
    const awayScore = match.awayScore;
    const homeLogo = match.homeLogo;
    const awayLogo = match.awayLogo;

    // Resolución cromática inteligente
    const { homeColor, awayColor, isHomeWhite, isAwayWhite } = resolveMatchColors({
      homeColor: match.homeColor,
      awayColor: match.awayColor,
      homeAltColor: match.homeAltColor,
      awayAltColor: match.awayAltColor,
      homeTeamName: match.homeTeam,
      awayTeamName: match.awayTeam,
    });

    const hasHomeInDb = Boolean(match.hasHomeTeamInDb || match.homeTeamId);
    const hasAwayInDb = Boolean(match.hasAwayTeamInDb || match.awayTeamId);

    return {
      id,
      match,
      homeName,
      awayName,
      homeShort,
      awayShort,
      homeScore,
      awayScore,
      homeLogo,
      awayLogo,
      homeColor,
      awayColor,
      isHomeWhite,
      isAwayWhite,
      hasHomeInDb,
      hasAwayInDb,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
    };
  });

  const activeItem = matchItems[currentIndex] || matchItems[0];
  const { match, homeName, awayName, homeShort, awayShort, homeScore, awayScore, homeLogo, awayLogo, homeColor, awayColor, isHomeWhite, isAwayWhite } = activeItem;

  const goals = match.events?.filter((e) => e.type === "goal") || [];

  const handleOpenMatchCenter = () => {
    setIsPaused(true);
    setSelectedMatch(match);
    setIsModalOpen(true);
  };

  return (
    <>
      <section
        className="relative w-full overflow-hidden bg-black text-white pt-[68px] md:pt-[76px] pb-6 sm:pb-8 border-b border-white/[0.08] shadow-[0_20px_70px_rgba(0,0,0,0.8)]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => { if (!isModalOpen) setIsPaused(false); }}
        onTouchStart={() => setIsPaused(true)}
      >
        {/* Atmósfera Estadio con Luces Dinámicas */}
        <div
          className="absolute -top-24 -left-24 w-[32rem] h-[32rem] rounded-full blur-[130px] pointer-events-none transition-colors duration-1000 transform-gpu"
          style={{
            backgroundColor: homeColor,
            opacity: isHomeWhite ? 0.2 : 0.3,
          }}
        />
        <div
          className="absolute -top-24 -right-24 w-[32rem] h-[32rem] rounded-full blur-[130px] pointer-events-none transition-colors duration-1000 transform-gpu"
          style={{
            backgroundColor: awayColor,
            opacity: isAwayWhite ? 0.2 : 0.3,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.06)_0%,_transparent_75%)] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">

          {/* ──────── 1. SELECTOR FLOTANTE DE PARTIDOS CON RESORTES APPLE ──────── */}
          {matchItems.length > 1 && (
            <div className="w-full mb-3 sm:mb-4 pt-0.5">
              <div
                className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-2 pt-0.5 px-0.5 sm:px-1 scrollbar-hide no-scrollbar scrollbar-none touch-pan-x justify-start select-none [&::-webkit-scrollbar]:!hidden [&::-webkit-scrollbar]:!w-0 [&::-webkit-scrollbar]:!h-0"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                <div className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full bg-red-600/15 border border-red-500/25 text-red-400 text-xs font-bold uppercase tracking-wider shadow-sm">
                  <Radio className="w-3.5 h-3.5 animate-pulse text-red-500" />
                  <span>Jornada:</span>
                </div>

                {matchItems.map((item, idx) => {
                  const isActive = idx === currentIndex;
                  const isUpc = item.match.isUpcoming;
                  const isFin = item.match.isFinished;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`relative shrink-0 transition-all duration-200 px-3.5 py-2 min-h-[44px] rounded-full text-xs font-bold flex items-center gap-2.5 cursor-pointer active:scale-95 ${
                        isActive
                          ? "text-white shadow-lg"
                          : "text-white/60 hover:text-white hover:bg-white/[0.06]"
                      }`}
                    >
                      {/* Píldora activa deslizante con resortes Apple */}
                      {isActive && (
                        <motion.div
                          layoutId="heroActiveMatchPill"
                          className="absolute inset-0 rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-[0_2px_12px_rgba(255,255,255,0.15)]"
                          transition={{ type: "spring", damping: 25, stiffness: 350 }}
                        />
                      )}

                      {/* Mini Escudos / Nombres */}
                      <div className="relative z-10 flex items-center gap-1.5">
                        {item.homeLogo && (
                          <div className="w-4 h-4 relative shrink-0">
                            <Image src={item.homeLogo} alt="" width={16} height={16} className="w-full h-full object-contain" />
                          </div>
                        )}
                        <span className="font-bold text-white">{item.homeShort}</span>
                      </div>

                      {/* Marcador o Horario */}
                      {isUpc ? (
                        <span className="relative z-10 bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold">
                          {item.match.startTime || "Próximo"}
                        </span>
                      ) : (
                        <span className="relative z-10 bg-black/60 backdrop-blur-sm border border-white/15 px-2 py-0.5 rounded-full text-xs text-amber-300 font-mono font-black tabular-nums shadow-inner">
                          {item.homeScore} - {item.awayScore}
                        </span>
                      )}

                      <div className="relative z-10 flex items-center gap-1.5">
                        <span className="font-bold text-white">{item.awayShort}</span>
                        {item.awayLogo && (
                          <div className="w-4 h-4 relative shrink-0">
                            <Image src={item.awayLogo} alt="" width={16} height={16} className="w-full h-full object-contain" />
                          </div>
                        )}
                      </div>

                      {/* Minuto si está en vivo o entretiempo */}
                      {!isFin && !isUpc && (
                        item.match.isHalftime ? (
                          <span className="relative z-10 text-[10px] font-mono font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded-full">
                            ET
                          </span>
                        ) : (item.match.displayClock || item.match.minute) ? (
                          <span className="relative z-10 text-[10px] font-mono font-bold text-red-400 bg-red-600/20 px-1.5 py-0.5 rounded-full animate-pulse">
                            {item.match.displayClock || `${item.match.minute}'`}
                          </span>
                        ) : null
                      )}
                      {isFin && (
                        <span className="relative z-10 text-[10px] font-mono font-bold text-amber-400/90">
                          FT
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ──────── 2. ESCENARIO CENTRAL DE CONFRONTACIÓN APPLE STYLE ──────── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -15 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="relative bg-[#0c0d12]/85 backdrop-blur-3xl border border-white/[0.12] rounded-[2.2rem] sm:rounded-[2.8rem] p-4 sm:p-6 md:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.85)] overflow-hidden"
            >
              {/* Specular hairline en borde superior (§12 Apple Design) */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

              {/* Encabezado: Torneo & Minuto */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-5">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-md border ${
                    match.isFinished
                      ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                      : match.isHalftime
                      ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                      : match.isUpcoming
                      ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
                      : "bg-red-600/15 border-red-500/30 text-red-400"
                  }`}>
                    {match.isFinished ? (
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    ) : match.isHalftime ? (
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                    ) : match.isUpcoming ? (
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    ) : (
                      <Flame className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
                    )}
                    <span>
                      {match.leagueName || "MATCHDAY"}
                      {match.isFinished ? " · FINAL" : match.isHalftime ? " · ENTRETIEMPO" : match.isUpcoming ? " · PRÓXIMO" : " · EN VIVO"}
                    </span>
                  </span>

                  {!match.isHalftime && !match.isFinished && !match.isUpcoming && (match.displayClock || match.minute) && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-[10px] sm:text-xs font-mono font-bold animate-pulse border border-white/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      MINUTO {match.displayClock || `${match.minute}'`}
                    </span>
                  )}
                </div>

                {/* Cupón Matchday */}
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/70">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Código <code className="bg-amber-500/15 text-amber-300 font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/30">MATCHDAY</code>: 10% OFF</span>
                </div>
              </div>

              {/* Confrontación de Equipos y Marcador Gigante */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center justify-items-center gap-3 sm:gap-6 my-2 sm:my-4">
                {/* EQUIPO LOCAL */}
                <div className="flex flex-col items-center text-center gap-2.5 w-full">
                  <TeamShield src={homeLogo} alt={homeName} color={homeColor} isWhite={isHomeWhite} />
                  <h2 className="text-base sm:text-2xl md:text-3xl font-black text-white tracking-tight line-clamp-1 drop-shadow-md">
                    <span className="hidden sm:inline">{homeName}</span>
                    <span className="inline sm:hidden">{homeShort}</span>
                  </h2>
                </div>

                {/* CENTRO: MARCADOR DIGITAL */}
                <div className="flex flex-col items-center justify-center text-center px-2">
                  {match.isUpcoming ? (
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl sm:text-6xl md:text-7xl font-black text-blue-400 font-mono tracking-tighter tabular-nums drop-shadow-[0_0_25px_rgba(59,130,246,0.4)]">
                        VS
                      </span>
                      <span className="px-3.5 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-400/25 text-xs font-semibold">
                        {match.startTime || "Hoy"}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-3 sm:gap-6 text-5xl sm:text-7xl md:text-8xl font-black font-mono tracking-tighter tabular-nums text-white drop-shadow-[0_8px_30px_rgba(0,0,0,0.9)]">
                        <span className={match.isFinished ? "text-amber-400" : "text-white"}>
                          {homeScore}
                        </span>
                        <span className="text-gray-500 font-light opacity-50">:</span>
                        <span className={match.isFinished ? "text-amber-400" : "text-white"}>
                          {awayScore}
                        </span>
                      </div>

                      {/* Resumen de Goleadores */}
                      {goals.length > 0 && (
                        <div className="hidden sm:flex flex-wrap items-center justify-center gap-1.5 max-w-xs">
                          {goals.slice(0, 3).map((g) => (
                            <span
                              key={g.id}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] text-white/90 font-medium"
                            >
                              <span>⚽ {g.minute}</span>
                              <span className="font-bold text-white">{g.playerName}</span>
                            </span>
                          ))}
                          {goals.length > 3 && (
                            <span className="text-[10px] text-gray-400 font-bold">+{goals.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* EQUIPO VISITANTE */}
                <div className="flex flex-col items-center text-center gap-2.5 w-full">
                  <TeamShield src={awayLogo} alt={awayName} color={awayColor} isWhite={isAwayWhite} />
                  <h2 className="text-base sm:text-2xl md:text-3xl font-black text-white tracking-tight line-clamp-1 drop-shadow-md">
                    <span className="hidden sm:inline">{awayName}</span>
                    <span className="inline sm:hidden">{awayShort}</span>
                  </h2>
                </div>
              </div>

              {/* ──────── 3. BOTONES DE ACCIÓN APPLE STYLE ──────── */}
              <div className="mt-6 pt-5 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-white/60 text-center sm:text-left font-medium">
                  Ponete la camiseta y viví la emoción del partido con los colores oficiales.
                </p>

                <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                  {/* CAMISETAS DISPONIBLES EN TIENDA */}
                  {(activeItem.hasHomeInDb || activeItem.hasAwayInDb) && (
                    <div className={`grid ${activeItem.hasHomeInDb && activeItem.hasAwayInDb ? 'grid-cols-2' : 'grid-cols-1'} gap-2 sm:flex sm:items-center sm:gap-3`}>
                      {activeItem.hasHomeInDb && (
                        <Link
                          href={activeItem.homeTeamId
                            ? `/catalogo?equipo=${encodeURIComponent(activeItem.homeTeamId)}`
                            : `/catalogo?query=${encodeURIComponent(homeName)}`}
                          className="px-4 sm:px-5 py-2.5 sm:py-3 min-h-[44px] rounded-2xl bg-[#E50914] hover:bg-red-700 active:scale-[0.97] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_4px_20px_rgba(229,9,20,0.4)] flex items-center justify-center gap-2 cursor-pointer text-center"
                        >
                          <Shirt className="w-4 h-4 shrink-0" />
                          <span className="truncate">Camiseta {homeShort}</span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
                        </Link>
                      )}

                      {activeItem.hasAwayInDb && (
                        <Link
                          href={activeItem.awayTeamId
                            ? `/catalogo?equipo=${encodeURIComponent(activeItem.awayTeamId)}`
                            : `/catalogo?query=${encodeURIComponent(awayName)}`}
                          className="px-4 sm:px-5 py-2.5 sm:py-3 min-h-[44px] rounded-2xl bg-white/10 hover:bg-white/15 active:scale-[0.97] border border-white/15 text-white font-bold text-xs uppercase tracking-wider transition-all backdrop-blur-md flex items-center justify-center gap-2 cursor-pointer text-center"
                        >
                          <Shirt className="w-4 h-4 text-gray-300 shrink-0" />
                          <span className="truncate">Camiseta {awayShort}</span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Fallback si ninguno está en BD */}
                  {!activeItem.hasHomeInDb && !activeItem.hasAwayInDb && (
                    <Link
                      href="/catalogo"
                      className="px-5 py-2.5 sm:py-3 min-h-[44px] rounded-2xl bg-[#E50914] hover:bg-red-700 active:scale-[0.97] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_4px_20px_rgba(229,9,20,0.4)] flex items-center justify-center gap-2"
                    >
                      <span>Mirá el Catálogo</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}

                  {/* BOTÓN MATCH CENTER */}
                  <button
                    onClick={handleOpenMatchCenter}
                    className="px-5 py-2.5 sm:py-3 min-h-[44px] rounded-2xl bg-white/[0.08] hover:bg-white/15 active:scale-[0.97] border border-white/15 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg backdrop-blur-md"
                  >
                    <BarChart3 className="w-4 h-4 text-red-500 shrink-0" />
                    <span>Match Center</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* BARRA DE PROGRESO DE ROTACIÓN */}
          {matchItems.length > 1 && (
            <div className="mt-4 w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                key={activeItem.id}
                className={`h-full ${isPaused ? "bg-gray-500" : "bg-[#E50914]"} transition-all duration-300`}
                style={{
                  width: "100%",
                  animation: isPaused ? "none" : "progress 8.5s linear infinite",
                }}
              />
            </div>
          )}
        </div>
      </section>

      {/* MODAL MATCH CENTER CON FÍSICA DE RESORTES APPLE */}
      <MatchCenterModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIsPaused(false);
        }}
        match={selectedMatch}
      />
    </>
  );
}
