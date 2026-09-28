"use client";

import React, { memo } from "react";
import type { LiveMatchData } from "@/hooks/useLiveMatches";

interface MatchStatsProps {
  stats?: LiveMatchData["stats"];
  homeName: string;
  awayName: string;
  homeColor: string;
  awayColor: string;
  isHomeWhite: boolean;
  isAwayWhite: boolean;
}

function MatchStatsComponent({
  stats,
  homeName,
  awayName,
  homeColor,
  awayColor,
  isHomeWhite,
  isAwayWhite,
}: MatchStatsProps) {
  if (!stats) return null;

  const rawHomePoss = parseInt(stats.possession?.home || "50", 10) || 50;
  const rawAwayPoss = parseInt(stats.possession?.away || "50", 10) || 50;
  const totalPoss = rawHomePoss + rawAwayPoss || 100;
  const homePossPct = Math.round((rawHomePoss / totalPoss) * 100);
  const awayPossPct = 100 - homePossPct;

  return (
    <div className="space-y-4">
      {/* POSESIÓN DE BALÓN */}
      {stats.possession && (
        <div className="rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] p-4 sm:p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full border border-white/20"
                style={{
                  backgroundColor: homeColor,
                  boxShadow: isHomeWhite
                    ? "0 0 10px rgba(255, 255, 255, 0.7)"
                    : `0 0 10px ${homeColor}`,
                }}
              />
              <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white">
                {rawHomePoss}%
              </span>
              <span className="text-xs text-gray-300 font-semibold hidden sm:inline">
                {homeName}
              </span>
            </div>

            <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">
              Posesión
            </span>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-300 font-semibold hidden sm:inline">
                {awayName}
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white">
                {rawAwayPoss}%
              </span>
              <span
                className="w-3 h-3 rounded-full border border-white/20"
                style={{
                  backgroundColor: awayColor,
                  boxShadow: isAwayWhite
                    ? "0 0 10px rgba(255, 255, 255, 0.7)"
                    : `0 0 10px ${awayColor}`,
                }}
              />
            </div>
          </div>

          {/* Barra de Posesión Bicolor */}
          <div className="w-full h-3 bg-neutral-900 rounded-full overflow-hidden flex p-0.5 border border-white/10 shadow-inner">
            <div
              className="h-full rounded-l-full transition-all duration-700"
              style={{
                width: `${homePossPct}%`,
                backgroundColor: homeColor,
                boxShadow: isHomeWhite ? "0 0 12px rgba(255, 255, 255, 0.6)" : undefined,
              }}
            />
            <div
              className="h-full rounded-r-full transition-all duration-700"
              style={{
                width: `${awayPossPct}%`,
                backgroundColor: awayColor,
                boxShadow: isAwayWhite ? "0 0 12px rgba(255, 255, 255, 0.6)" : undefined,
              }}
            />
          </div>
        </div>
      )}

      {/* MÉTRICAS DE ATAQUE */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.shotsOnTarget && (
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.08] rounded-2xl p-3 text-center flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
              Tiros a Puerta
            </span>
            <div className="flex items-center justify-center gap-2 mt-1 text-lg font-mono font-black tabular-nums">
              <span style={{ color: homeColor }}>{stats.shotsOnTarget.home}</span>
              <span className="text-gray-600 text-xs">-</span>
              <span style={{ color: awayColor }}>{stats.shotsOnTarget.away}</span>
            </div>
          </div>
        )}

        {stats.totalShots && (
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.08] rounded-2xl p-3 text-center flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
              Tiros Totales
            </span>
            <div className="flex items-center justify-center gap-2 mt-1 text-lg font-mono font-black tabular-nums">
              <span style={{ color: homeColor }}>{stats.totalShots.home}</span>
              <span className="text-gray-600 text-xs">-</span>
              <span style={{ color: awayColor }}>{stats.totalShots.away}</span>
            </div>
          </div>
        )}

        {stats.corners && (
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.08] rounded-2xl p-3 text-center flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
              Córners
            </span>
            <div className="flex items-center justify-center gap-2 mt-1 text-lg font-mono font-black tabular-nums">
              <span style={{ color: homeColor }}>{stats.corners.home}</span>
              <span className="text-gray-600 text-xs">-</span>
              <span style={{ color: awayColor }}>{stats.corners.away}</span>
            </div>
          </div>
        )}

        {stats.fouls && (
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.08] rounded-2xl p-3 text-center flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
              Faltas
            </span>
            <div className="flex items-center justify-center gap-2 mt-1 text-lg font-mono font-black tabular-nums">
              <span style={{ color: homeColor }}>{stats.fouls.home}</span>
              <span className="text-gray-600 text-xs">-</span>
              <span style={{ color: awayColor }}>{stats.fouls.away}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const MatchStats = memo(MatchStatsComponent);
