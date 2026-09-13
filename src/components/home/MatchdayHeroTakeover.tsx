"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Flame, Trophy, Sparkles, ArrowRight, Shield, BarChart3, Radio, Shirt, Clock } from "lucide-react";
import { useLiveMatches, LiveMatchData } from "@/hooks/useLiveMatches";
import { motion, AnimatePresence } from "@/lib/motion";
import MatchCenterModal from "@/components/match/MatchCenterModal";

import { resolveMatchColors } from "@/lib/teamColors";

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
      className="relative w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-3xl p-3 sm:p-4 flex items-center justify-center border border-white/15 shadow-2xl transition-all duration-500 hover:scale-110"
      style={{
        backgroundColor: isWhite ? "rgba(255, 255, 255, 0.12)" : `${color}18`,
        boxShadow: isWhite ? "0 15px 40px rgba(255, 255, 255, 0.3)" : `0 15px 40px ${color}35`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setError(true)}
        className="w-full h-full object-contain filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.8)]"
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
    }, 8500);

    return () => clearInterval(timer);
  }, [activeEntries.length, isPaused]);

  if (activeEntries.length === 0) return null;

  // ORDEN ESTRICTO: LOCAL A LA IZQUIERDA, VISITA A LA DERECHA
  const matchItems = activeEntries.map(([id, match]) => {
    const homeName = match.homeTeam;
    const awayName = match.awayTeam;
    const homeShort = match.homeShortTeam || match.homeTeam;
    const awayShort = match.awayShortTeam || match.awayTeam;
    const homeScore = match.homeScore;
    const awayScore = match.awayScore;
    const homeLogo = match.homeLogo;
    const awayLogo = match.awayLogo;

    // Resolución cromática inteligente: respeta blanco (#FFFFFF) y evita choques de color
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
    setSelectedMatch(match);
    setIsModalOpen(true);
  };

  return (
    <>
      <section
        className="relative w-full overflow-hidden bg-black text-white pt-[68px] md:pt-[76px] pb-6 sm:pb-8 border-b border-[#E50914]/30 shadow-[0_20px_70px_rgba(229,9,20,0.25)]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Atmósfera Estadio con Luces Dinámicas */}
        <div
          className="absolute -top-24 -left-24 w-[32rem] h-[32rem] rounded-full blur-[130px] pointer-events-none transition-colors duration-1000"
          style={{
            backgroundColor: homeColor,
            opacity: isHomeWhite ? 0.25 : 0.35,
          }}
        />
        <div
          className="absolute -top-24 -right-24 w-[32rem] h-[32rem] rounded-full blur-[130px] pointer-events-none transition-colors duration-1000"
          style={{
            backgroundColor: awayColor,
            opacity: isAwayWhite ? 0.25 : 0.35,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.06)_0%,_transparent_75%)] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">

          {/* ──────── 1. SELECTOR FLOTANTE DE PARTIDOS (VISIBLE Y NUNCA RECORTADO) ──────── */}
          {matchItems.length > 1 && (
            <div className="w-full mb-3 sm:mb-4 pt-0.5">
              <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-2 pt-0.5 px-0.5 sm:px-1 scrollbar-none sm:scrollbar-thin sm:scrollbar-thumb-white/20 touch-pan-x justify-start">
                <div className="flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-2xl bg-red-600/15 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-wider shadow-sm">
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
                      className={`shrink-0 transition-all duration-300 px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-3 border cursor-pointer ${
                        isActive
                          ? "bg-white/20 text-white border-white/50 shadow-[0_0_25px_rgba(255,255,255,0.25)] ring-1 ring-white/30"
                          : "bg-neutral-900/80 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {/* Mini Escudos / Nombres */}
                      <div className="flex items-center gap-1.5">
                        {item.homeLogo && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.homeLogo} alt="" className="w-4 h-4 object-contain shrink-0" />
                        )}
                        <span className="font-black text-white">{item.homeShort}</span>
                      </div>

                      {/* Marcador o Horario */}
                      {isUpc ? (
                        <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold">
                          {item.match.startTime || "Próximo"}
                        </span>
                      ) : (
                        <span className="bg-black/70 border border-white/15 px-2 py-0.5 rounded-lg text-xs text-amber-300 font-mono font-black shadow-inner">
                          {item.homeScore} - {item.awayScore}
                        </span>
                      )}

                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-white">{item.awayShort}</span>
                        {item.awayLogo && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.awayLogo} alt="" className="w-4 h-4 object-contain shrink-0" />
                        )}
                      </div>

                      {/* Minuto si está en vivo o entretiempo */}
                      {!isFin && !isUpc && (
                        item.match.isHalftime ? (
                          <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded-md">
                            ET
                          </span>
                        ) : (item.match.displayClock || item.match.minute) ? (
                          <span className="text-[10px] font-mono font-bold text-red-400 bg-red-600/20 px-1.5 py-0.5 rounded-md animate-pulse">
                            {item.match.displayClock || `${item.match.minute}'`}
                          </span>
                        ) : null
                      )}
                      {isFin && (
                        <span className="text-[10px] font-mono font-bold text-amber-400/90">
                          FT
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ──────── 2. ESCENARIO CENTRAL DE CONFRONTACIÓN ──────── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="relative bg-gradient-to-b from-neutral-900/90 via-neutral-950/90 to-black/95 backdrop-blur-3xl border border-white/15 rounded-[2.5rem] p-4 sm:p-6 md:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              {/* Resplandor superior sutil */}
              <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

              {/* Encabezado: Torneo & Minuto */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-5">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider ${
                    match.isFinished
                      ? "bg-amber-500/20 border border-amber-500/40 text-amber-400"
                      : match.isHalftime
                      ? "bg-amber-500/20 border border-amber-500/40 text-amber-400"
                      : match.isUpcoming
                      ? "bg-blue-500/20 border border-blue-500/40 text-blue-400"
                      : "bg-red-600/20 border border-red-500/40 text-red-400"
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
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-gray-200 text-[10px] sm:text-xs font-mono font-black animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      MINUTO {match.displayClock || `${match.minute}'`}
                    </span>
                  )}
                </div>

                {/* Cupón Matchday */}
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Código <code className="bg-amber-500/20 text-amber-300 font-mono font-black px-2 py-0.5 rounded border border-amber-500/30">MATCHDAY</code>: 10% OFF</span>
                </div>
              </div>

              {/* Confrontación de Equipos y Marcador Gigante */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center justify-items-center gap-3 sm:gap-6 my-2 sm:my-4">
                {/* EQUIPO LOCAL */}
                <div className="flex flex-col items-center text-center gap-3 w-full">
                  <TeamShield src={homeLogo} alt={homeName} color={homeColor} isWhite={isHomeWhite} />
                  <h3 className="text-base sm:text-2xl md:text-3xl font-black text-white tracking-tight line-clamp-1">
                    <span className="hidden sm:inline">{homeName}</span>
                    <span className="inline sm:hidden">{homeShort}</span>
                  </h3>
                </div>

                {/* CENTRO: MARCADOR DIGITAL */}
                <div className="flex flex-col items-center justify-center text-center px-2">
                  {match.isUpcoming ? (
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl sm:text-6xl md:text-7xl font-black text-blue-400 font-mono tracking-widest drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                        VS
                      </span>
                      <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold">
                        {match.startTime || "Hoy"}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-3 sm:gap-6 text-5xl sm:text-7xl md:text-8xl font-black font-mono tracking-tighter text-white drop-shadow-[0_10px_35px_rgba(0,0,0,0.9)]">
                        <span className={match.isFinished ? "text-amber-400" : "text-white"}>
                          {homeScore}
                        </span>
                        <span className="text-gray-600 font-extralight opacity-50">:</span>
                        <span className={match.isFinished ? "text-amber-400" : "text-white"}>
                          {awayScore}
                        </span>
                      </div>

                      {/* Resumen de Goleadores (Solo en tablet/desktop para no saturar móviles) */}
                      {goals.length > 0 && (
                        <div className="hidden sm:flex flex-wrap items-center justify-center gap-1.5 max-w-xs">
                          {goals.slice(0, 3).map((g) => (
                            <span
                              key={g.id}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-[10px] text-gray-200 font-semibold"
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
                <div className="flex flex-col items-center text-center gap-3 w-full">
                  <TeamShield src={awayLogo} alt={awayName} color={awayColor} isWhite={isAwayWhite} />
                  <h3 className="text-base sm:text-2xl md:text-3xl font-black text-white tracking-tight line-clamp-1">
                    <span className="hidden sm:inline">{awayName}</span>
                    <span className="inline sm:hidden">{awayShort}</span>
                  </h3>
                </div>
              </div>

              {/* ──────── 3. BOTONES DE ACCIÓN: SOLO EQUIPOS EN TIENDA ──────── */}
              <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-gray-400 text-center sm:text-left">
                  Vive la emoción del partido vistiendo los colores oficiales.
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
                          className="px-3.5 sm:px-5 py-3 rounded-2xl bg-[#E50914] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider transition-all hover:scale-105 shadow-[0_0_25px_rgba(229,9,20,0.5)] active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-center"
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
                          className="px-3.5 sm:px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-center"
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
                      className="px-5 py-3 rounded-2xl bg-[#E50914] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider transition-all hover:scale-105 shadow-[0_0_25px_rgba(229,9,20,0.5)] active:scale-95 flex items-center justify-center gap-2"
                    >
                      <span>Ver Catálogo</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}

                  {/* BOTÓN MATCH CENTER (SIEMPRE DISPONIBLE) */}
                  <button
                    onClick={handleOpenMatchCenter}
                    className="px-5 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-white/20 text-white font-black text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
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

      {/* MODAL MATCH CENTER */}
      <MatchCenterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        match={selectedMatch}
      />
    </>
  );
}
