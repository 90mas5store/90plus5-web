"use client";

import React, { memo } from "react";
import { Trophy, Flame, Sparkles, MapPin, Share2, Shield } from "lucide-react";
import type { LiveMatchData } from "@/hooks/useLiveMatches";

interface MatchScoreboardProps {
  match: LiveMatchData;
  homeName: string;
  awayName: string;
  homeColor: string;
  awayColor: string;
  isHomeWhite: boolean;
  isAwayWhite: boolean;
  onShareWhatsApp: () => void;
}

function MatchScoreboardComponent({
  match,
  homeName,
  awayName,
  homeColor,
  awayColor,
  isHomeWhite,
  isAwayWhite,
  onShareWhatsApp,
}: MatchScoreboardProps) {
  const isLive = !match.isFinished && !match.isUpcoming;
  const homeLogo = match.homeLogo;
  const awayLogo = match.awayLogo;
  const homeScore = match.homeScore;
  const awayScore = match.awayScore;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] p-4 sm:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
      {/* Light-catching hairline (reflejo de luz en el borde superior, §12 Apple Design) */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      {/* Píldora de Torneo, Sede y Botón Compartir (En Desktop) */}
      <div className="hidden sm:flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/10 text-xs font-bold uppercase tracking-wider text-gray-200 shadow-sm">
            {match.isFinished ? (
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
            ) : match.isUpcoming ? (
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            ) : (
              <Flame className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
            )}
            <span>{match.leagueName || "MATCHDAY"}</span>
          </span>

          {match.venueName && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5 text-[10px] text-gray-400 font-medium tracking-normal">
              <MapPin className="w-3 h-3 text-gray-500" />
              <span>
                {match.venueName}
                {match.venueCity ? `, ${match.venueCity}` : ""}
              </span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onShareWhatsApp}
          className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-95 text-emerald-300 border border-emerald-500/25 backdrop-blur-md text-xs font-semibold transition-all cursor-pointer shadow-sm ml-auto"
          title="Compartir resultado en WhatsApp"
        >
          <Share2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Compartir en WhatsApp</span>
        </button>
      </div>

      {/* Marcador Principal con Escudos */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-6 py-1">
        {/* EQUIPO LOCAL (IZQUIERDA) */}
        <div className="flex flex-col items-center text-center gap-1.5 sm:gap-2">
          <div
            className="relative w-14 h-14 sm:w-20 sm:h-20 lg:w-22 lg:h-22 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 flex items-center justify-center border border-white/15 shadow-xl transition-transform duration-200 active:scale-95 hover:scale-105"
            style={{
              backgroundColor: isHomeWhite ? "rgba(255, 255, 255, 0.12)" : `${homeColor}18`,
              boxShadow: isHomeWhite
                ? "0 10px 30px rgba(255, 255, 255, 0.2)"
                : `0 10px 30px ${homeColor}30`,
            }}
          >
            {!homeLogo ? (
              <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={homeLogo}
                alt={homeName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
              />
            )}
          </div>
          <span className="text-xs sm:text-base font-bold text-white tracking-tight line-clamp-2 max-w-[100px] sm:max-w-none text-center">
            {homeName}
          </span>
        </div>

        {/* MARCADOR DIGITAL (CENTRO) */}
        <div className="flex flex-col items-center justify-center px-1 sm:px-2">
          {match.isUpcoming ? (
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl sm:text-5xl lg:text-6xl font-black text-blue-400 font-mono tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                VS
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/20 text-[10px] sm:text-xs font-semibold whitespace-nowrap">
                {match.startTime || "Próximamente"}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-2 sm:gap-4 text-3xl sm:text-5xl lg:text-6xl font-black font-mono tracking-tighter tabular-nums text-white drop-shadow-[0_8px_20px_rgba(0,0,0,0.7)]">
                <span className={match.isFinished ? "text-amber-400" : "text-white"}>
                  {homeScore}
                </span>
                <span className="text-gray-500 font-light opacity-60">:</span>
                <span className={match.isFinished ? "text-amber-400" : "text-white"}>
                  {awayScore}
                </span>
              </div>

              {match.isHalftime ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] sm:text-xs font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  ENTRETIEMPO
                </span>
              ) : isLive && (match.displayClock || match.minute) ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:py-1 rounded-full bg-red-600/15 text-red-400 border border-red-500/30 text-[10px] sm:text-xs font-mono font-black shadow-[0_0_12px_rgba(239,68,68,0.25)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  {match.displayClock || `${match.minute}'`} EN VIVO
                </span>
              ) : (
                <span className="px-3 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-xs text-gray-300 font-bold uppercase tracking-wider">
                  {match.isFinished ? "Finalizado" : "En Juego"}
                </span>
              )}
            </div>
          )}
        </div>

        {/* EQUIPO VISITANTE (DERECHA) */}
        <div className="flex flex-col items-center text-center gap-1.5 sm:gap-2">
          <div
            className="relative w-14 h-14 sm:w-20 sm:h-20 lg:w-22 lg:h-22 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 flex items-center justify-center border border-white/15 shadow-xl transition-transform duration-200 active:scale-95 hover:scale-105"
            style={{
              backgroundColor: isAwayWhite ? "rgba(255, 255, 255, 0.12)" : `${awayColor}18`,
              boxShadow: isAwayWhite
                ? "0 10px 30px rgba(255, 255, 255, 0.2)"
                : `0 10px 30px ${awayColor}30`,
            }}
          >
            {!awayLogo ? (
              <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={awayLogo}
                alt={awayName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
              />
            )}
          </div>
          <span className="text-xs sm:text-base font-bold text-white tracking-tight line-clamp-2 max-w-[100px] sm:max-w-none text-center">
            {awayName}
          </span>
        </div>
      </div>
    </div>
  );
}

export const MatchScoreboard = memo(MatchScoreboardComponent);
