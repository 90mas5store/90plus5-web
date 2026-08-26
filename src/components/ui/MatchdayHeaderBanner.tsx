"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Flame } from "lucide-react";
import { useLiveMatches } from "@/hooks/useLiveMatches";

export default function MatchdayHeaderBanner() {
  const liveMatches = useLiveMatches();
  const activeEntries = Object.entries(liveMatches);

  if (activeEntries.length === 0) return null;

  // Tomamos el primer partido en vivo activo
  const [, match] = activeEntries[0];

  const teamPlaying = match.isHome ? match.homeTeam : match.awayTeam;
  const opponent = match.isHome ? match.awayTeam : match.homeTeam;
  const teamScore = match.isHome ? match.homeScore : match.awayScore;
  const opponentScore = match.isHome ? match.awayScore : match.homeScore;

  const catalogHref = `/catalogo?query=${encodeURIComponent(teamPlaying)}`;

  return (
    <div className="relative z-30 w-full bg-gradient-to-r from-red-950 via-neutral-900 to-red-950 border-b border-[#E50914]/40 py-2.5 px-4 shadow-[0_4px_20px_rgba(229,9,20,0.3)] animate-in fade-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        {/* LADO IZQUIERDO: BADGE Y PARTIDO */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E50914] text-white text-[11px] font-black uppercase tracking-wider animate-pulse shadow-[0_0_12px_rgba(229,9,20,0.6)]">
            <Flame className="w-3.5 h-3.5 fill-white" />
            MATCHDAY EN VIVO
          </span>

          <div className="text-xs md:text-sm font-bold text-white flex items-center gap-2">
            {match.isManual ? (
              <span>
                ¡<strong>{teamPlaying}</strong> está jugando en vivo ahora mismo!
              </span>
            ) : (
              <span>
                <strong className="text-red-400">{teamPlaying}</strong> {teamScore} - {opponentScore}{" "}
                <span className="text-gray-300 font-normal">({opponent})</span>
                {match.minute && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-white/10 text-[11px] text-gray-300">
                    {match.minute}&apos;
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* LADO DERECHO: CÓDIGO PROMOCIONAL Y LLAMADO A LA ACCIÓN */}
        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex text-xs font-semibold text-gray-300 items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Usa el cupón <code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-300 font-mono font-bold">MATCHDAY</code> para 10% OFF
          </span>

          <Link
            href={catalogHref}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white text-black hover:bg-gray-100 font-black text-xs uppercase tracking-wider transition-all hover:scale-105 shadow-md"
          >
            <span>Ver Camisetas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
