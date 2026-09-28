"use client";

import React, { memo } from "react";
import { Award } from "lucide-react";
import type { StandingRow } from "@/app/api/standings/route";
import { translateTeamNameToSpanish } from "@/lib/teamNames";

export interface StandingGroupData {
  groupName?: string;
  groups?: { name: string; standings: StandingRow[] }[];
  standings: StandingRow[];
}

interface MatchStandingsProps {
  leagueSlug?: string;
  leagueData?: StandingGroupData;
  loading: boolean;
  homeName: string;
  awayName: string;
  selectedGroupIndex: number;
  onSelectGroupIndex: (index: number) => void;
}

function MatchStandingsComponent({
  leagueSlug,
  leagueData,
  loading,
  homeName,
  awayName,
  selectedGroupIndex,
  onSelectGroupIndex,
}: MatchStandingsProps) {
  const currentGroups = leagueData?.groups || [];
  const activeGroup = currentGroups[selectedGroupIndex];
  const rawRows = activeGroup?.standings || leagueData?.standings || [];

  const currentStandings = [...rawRows].sort((a, b) => {
    if (a.rank > 0 && b.rank > 0 && a.rank !== b.rank) {
      return a.rank - b.rank;
    }
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    const diffA = parseInt(a.pointDifferential, 10) || 0;
    const diffB = parseInt(b.pointDifferential, 10) || 0;
    return diffB - diffA;
  });

  return (
    <div className="rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] p-4 sm:p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">
            {leagueData?.groupName || "Tabla de Posiciones"}
          </h4>
        </div>
        {leagueSlug && (
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
            {leagueSlug.toUpperCase()}
          </span>
        )}
      </div>

      {/* Selector de Grupos/Conferencias */}
      {currentGroups.length > 1 && (
        <div className="flex flex-wrap gap-1.5 p-1 bg-white/[0.04] rounded-2xl border border-white/10">
          {currentGroups.map((grp, idx) => (
            <button
              key={grp.name || idx}
              type="button"
              onClick={() => onSelectGroupIndex(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                selectedGroupIndex === idx
                  ? "bg-white/20 text-white font-bold shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {grp.name}
            </button>
          ))}
        </div>
      )}

      {/* Tabla fluida */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-400 font-medium">Cargando clasificación...</span>
        </div>
      ) : currentStandings.length === 0 ? (
        <div className="py-12 text-center text-xs text-gray-400 italic">
          No hay datos de clasificación disponibles para esta competición.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 text-[10px] text-gray-400 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-2.5 px-2 text-center w-8">#</th>
                <th className="py-2.5 px-3">Club</th>
                <th className="py-2.5 px-2 text-center">PJ</th>
                <th className="py-2.5 px-2 text-center">DG</th>
                <th className="py-2.5 px-2 text-center font-bold text-white">PTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {currentStandings.map((row) => {
                const translatedRowTeamName = translateTeamNameToSpanish(row.teamName);
                const isMatchTeam =
                  translatedRowTeamName.toLowerCase().includes(homeName.toLowerCase()) ||
                  homeName.toLowerCase().includes(translatedRowTeamName.toLowerCase()) ||
                  translatedRowTeamName.toLowerCase().includes(awayName.toLowerCase()) ||
                  awayName.toLowerCase().includes(translatedRowTeamName.toLowerCase());

                return (
                  <tr
                    key={row.teamName}
                    className={`transition-colors ${
                      isMatchTeam
                        ? "bg-white/[0.08] font-bold text-white"
                        : "hover:bg-white/[0.03] text-gray-300"
                    }`}
                  >
                    <td className="py-2.5 px-2 text-center font-mono text-xs tabular-nums">
                      {row.rank > 0 ? (
                        <span
                          className={`inline-block w-5 h-5 leading-5 rounded-full text-[10px] ${
                            row.rank <= 4
                              ? "bg-blue-500/20 text-blue-300 font-bold border border-blue-400/30"
                              : row.rank <= 8
                              ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30"
                              : "text-gray-400"
                          }`}
                        >
                          {row.rank}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-2.5 px-3 flex items-center gap-2">
                      {row.logo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.logo}
                          alt={translatedRowTeamName}
                          className="w-4 h-4 object-contain shrink-0"
                        />
                      )}
                      <span className="truncate max-w-[140px] sm:max-w-[170px] text-xs font-medium">
                        {translatedRowTeamName}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-gray-400 tabular-nums">
                      {row.gamesPlayed}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-gray-400 tabular-nums">
                      {row.pointDifferential}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-white tabular-nums">
                      {row.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export const MatchStandings = memo(MatchStandingsComponent);
