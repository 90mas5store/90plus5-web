"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, ArrowRight, Flame, Trophy } from "lucide-react";
import { useLiveMatches, LiveMatchData } from "@/hooks/useLiveMatches";

export default function MatchdayHeaderBanner() {
  const pathname = usePathname();
  const liveMatches = useLiveMatches();
  const rawEntries = Object.entries(liveMatches);

  // Deduplicar partidos por enfrentamiento único (para no repetir FC Barcelona vs Real Madrid)
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

  const activeEntries = Array.from(uniqueMatchMap.values());

  if (pathname === '/' || activeEntries.length === 0) return null;

  const matchItems = activeEntries.map(([id, match]) => {
    const teamPlaying = match.isHome ? match.homeTeam : match.awayTeam;
    const opponent = match.isHome ? match.awayTeam : match.homeTeam;
    const teamScore = match.isHome ? match.homeScore : match.awayScore;
    const opponentScore = match.isHome ? match.awayScore : match.homeScore;
    return { id, match, teamPlaying, opponent, teamScore, opponentScore };
  });

  const isMultiple = matchItems.length > 1;

  // Duplicar elementos para un loop continuo sin saltos visuales
  const loopList = isMultiple
    ? [...matchItems, ...matchItems, ...matchItems, ...matchItems]
    : matchItems;

  return (
    <div className="relative z-30 w-full bg-black/95 backdrop-blur-xl border-b border-[#E50914]/40 overflow-hidden shadow-[0_8px_30px_rgba(229,9,20,0.35)] whitespace-nowrap">
      {!isMultiple ? (
        /* MODO 1 SOLO PARTIDO: DISEÑO DESTACADO EN UNA SOLA FILA */
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-1.5 flex flex-row items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <MatchPill item={matchItems[0]} />

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden md:inline-flex text-xs font-semibold text-gray-300 items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Cupón{" "}
              <code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-300 font-mono font-bold">
                MATCHDAY
              </code>{" "}
              para 10% OFF
            </span>
            <Link
              href={`/catalogo?query=${encodeURIComponent(
                matchItems[0].teamPlaying
              )}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#E50914] hover:bg-red-700 text-white font-black text-[10px] sm:text-xs uppercase tracking-wider transition-all hover:scale-105 shadow-md whitespace-nowrap"
            >
              <span>Ver Camisetas</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        /* MODO MULTIPLES PARTIDOS: TICKER EN LOOP INFINITO */
        <div className="relative flex items-center py-1.5 group">
          {/* Título fijo en el extremo izquierdo */}
          <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center px-3 sm:px-4 bg-gradient-to-r from-black via-black/95 to-transparent pr-6">
            <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 rounded-full bg-[#E50914] text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-[0_0_15px_rgba(229,9,20,0.8)] animate-pulse whitespace-nowrap">
              <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-white" />
              MATCHDAY ({matchItems.length})
            </span>
          </div>

          {/* Track Infinito de Partidos */}
          <div className="animate-marquee pl-40 sm:pl-52 space-x-4 sm:space-x-6 flex items-center whitespace-nowrap">
            {loopList.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="shrink-0 flex items-center gap-2 sm:gap-3">
                <MatchPill item={item} />
                <span className="text-gray-700 font-bold">•</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MatchPill({
  item,
}: {
  item: {
    id: string;
    match: LiveMatchData;
    teamPlaying: string;
    opponent: string;
    teamScore: number;
    opponentScore: number;
  };
}) {
  const { match, teamPlaying, opponent, teamScore, opponentScore } = item;
  const catalogHref = `/catalogo?query=${encodeURIComponent(teamPlaying)}`;

  return (
    <Link
      href={catalogHref}
      className={`inline-flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-3.5 py-1 rounded-full border transition-all hover:scale-105 whitespace-nowrap shrink-0 ${
        match.isFinished
          ? "bg-amber-950/60 border-amber-500/40 text-amber-100 hover:border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
          : "bg-red-950/60 border-red-500/40 text-white hover:border-red-500 shadow-[0_0_10px_rgba(229,9,20,0.25)]"
      }`}
    >
      {/* Badge Torneo */}
      <span
        className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wide flex items-center gap-1 shrink-0 ${
          match.isFinished ? "bg-amber-600 text-white" : "bg-[#E50914] text-white"
        }`}
      >
        {match.isFinished ? (
          <Trophy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
        ) : (
          <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white fill-white" />
        )}
        {match.isFinished
          ? "FINAL"
          : match.leagueName
          ? match.leagueName.toUpperCase()
          : "EN VIVO"}
      </span>

      {/* Detalle Partido */}
      <span className="text-[11px] sm:text-xs font-bold whitespace-nowrap">
        <strong className={match.isFinished ? "text-amber-300" : "text-red-400"}>
          {teamPlaying}
        </strong>{" "}
        {teamScore} - {opponentScore}{" "}
        {opponent && opponent !== 'Rival' && (
          <span className="font-normal text-gray-300">({opponent})</span>
        )}
      </span>

      {/* Minuto o Finalizado */}
      {match.isFinished ? (
        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-[9px] sm:text-[10px] text-amber-300 font-bold shrink-0">
          Finalizado
        </span>
      ) : (
        match.minute && (
          <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] sm:text-[10px] text-gray-300 font-bold animate-pulse shrink-0">
            {match.minute}&apos;
          </span>
        )
      )}

      <ArrowRight className="w-3 h-3 text-gray-400 hover:text-white transition-colors shrink-0" />
    </Link>
  );
}
