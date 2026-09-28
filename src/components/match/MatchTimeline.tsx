"use client";

import React, { memo } from "react";
import Link from "next/link";
import { Activity } from "lucide-react";
import type { MatchEventDetail } from "@/hooks/useLiveMatches";
import { formatMatchMinute, getEventVisual } from "./matchUtils";

interface MatchTimelineProps {
  events: MatchEventDetail[];
  isLive: boolean;
  homeName: string;
  awayName: string;
  homeColor: string;
  awayColor: string;
}

function MatchTimelineComponent({
  events,
  isLive,
  homeName,
  awayName,
  homeColor,
  awayColor,
}: MatchTimelineProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] p-3.5 sm:p-6 shadow-xl">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <span className="text-[11px] font-bold uppercase text-gray-300 tracking-wider flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          Incidencias & Cronología
        </span>
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600/15 text-red-400 border border-red-500/25 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            En directo
          </span>
        ) : (
          <span className="text-[10px] text-gray-400 font-mono font-medium">
            {events.length} incidencias
          </span>
        )}
      </div>

      {events.length === 0 ? (
        <div className="py-8 text-center text-xs text-gray-400 italic">
          No hay goles ni incidencias disciplinarias registradas todavía.
        </div>
      ) : (
        <div className="relative py-2 sm:py-3">
          {/* Eje Vertical Central */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent -translate-x-1/2 pointer-events-none" />

          <div className="space-y-2.5 sm:space-y-4">
            {events.map((evt: MatchEventDetail) => {
              const isHome = evt.isHome;
              const minuteDisplay = formatMatchMinute(evt.minute);
              const { icon, label } = getEventVisual(evt);
              const playerTitle = evt.jersey ? `${evt.jersey}. ${evt.playerName}` : evt.playerName;

              return (
                <div
                  key={evt.id}
                  className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 sm:gap-4 group"
                >
                  {/* INCIDENCIA LOCAL (IZQUIERDA) */}
                  <div className="flex justify-end items-center min-w-0">
                    {isHome ? (
                      <div
                        className={`flex items-center gap-1.5 sm:gap-2 text-right bg-gradient-to-l ${
                          evt.disallowed ? "from-red-950/20 via-white/[0.03]" : "from-white/[0.06]"
                        } to-transparent border-r-2 pr-2 sm:pr-3 py-1 sm:py-1.5 pl-1.5 sm:pl-2 rounded-l-xl transition-all group-hover:from-white/[0.1] max-w-full`}
                        style={{ borderRightColor: evt.type === "disallowed-goal" ? "#EF4444" : homeColor }}
                      >
                        <div className="flex flex-col min-w-0">
                          <span
                            className={`text-[11px] sm:text-sm font-bold truncate ${
                              evt.disallowed && evt.type === "goal"
                                ? "text-gray-400 line-through decoration-red-500/70"
                                : "text-white"
                            }`}
                          >
                            {playerTitle}
                          </span>
                          <span
                            className={`text-[9px] sm:text-[10px] font-medium leading-tight ${
                              evt.type === "disallowed-goal"
                                ? "text-red-400 font-bold"
                                : evt.disallowed
                                ? "text-amber-400/90 font-semibold"
                                : "text-gray-400"
                            }`}
                          >
                            {label}
                          </span>
                          {(evt.type === "goal" || evt.type === "penalty-goal") && !evt.disallowed && (
                            <Link
                              href={`/catalogo?query=${encodeURIComponent(homeName)}`}
                              className="inline-flex items-center gap-0.5 text-[8px] sm:text-[9px] text-amber-400/90 hover:text-amber-300 font-bold underline decoration-amber-500/40 hover:decoration-amber-400 mt-0.5 active:scale-95"
                            >
                              <span>👕 Camiseta 10% OFF</span>
                            </Link>
                          )}
                        </div>
                        <span className="text-sm sm:text-lg shrink-0 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                          {icon}
                        </span>
                      </div>
                    ) : (
                      <div />
                    )}
                  </div>

                  {/* MINUTO */}
                  <div className="z-10 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-neutral-900/90 border border-white/20 text-[10px] sm:text-xs font-mono font-bold text-white shadow-md tracking-tight shrink-0 text-center min-w-[2.2rem] sm:min-w-[3.4rem]">
                    {minuteDisplay}
                  </div>

                  {/* INCIDENCIA VISITANTE (DERECHA) */}
                  <div className="flex justify-start items-center min-w-0">
                    {!isHome ? (
                      <div
                        className={`flex items-center gap-1.5 sm:gap-2 text-left bg-gradient-to-r ${
                          evt.disallowed ? "from-red-950/20 via-white/[0.03]" : "from-white/[0.06]"
                        } to-transparent border-l-2 pl-2 sm:pl-3 py-1 sm:py-1.5 pr-1.5 sm:pr-2 rounded-r-xl transition-all group-hover:to-white/[0.1] max-w-full`}
                        style={{ borderLeftColor: evt.type === "disallowed-goal" ? "#EF4444" : awayColor }}
                      >
                        <span className="text-sm sm:text-lg shrink-0 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                          {icon}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span
                            className={`text-[11px] sm:text-sm font-bold truncate ${
                              evt.disallowed && evt.type === "goal"
                                ? "text-gray-400 line-through decoration-red-500/70"
                                : "text-white"
                            }`}
                          >
                            {playerTitle}
                          </span>
                          <span
                            className={`text-[9px] sm:text-[10px] font-medium leading-tight ${
                              evt.type === "disallowed-goal"
                                ? "text-red-400 font-bold"
                                : evt.disallowed
                                ? "text-amber-400/90 font-semibold"
                                : "text-gray-400"
                            }`}
                          >
                            {label}
                          </span>
                          {(evt.type === "goal" || evt.type === "penalty-goal") && !evt.disallowed && (
                            <Link
                              href={`/catalogo?query=${encodeURIComponent(awayName)}`}
                              className="inline-flex items-center gap-0.5 text-[8px] sm:text-[9px] text-amber-400/90 hover:text-amber-300 font-bold underline decoration-amber-500/40 hover:decoration-amber-400 mt-0.5 active:scale-95"
                            >
                              <span>👕 Camiseta 10% OFF</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export const MatchTimeline = memo(MatchTimelineComponent);
