"use client";

import React, { memo } from "react";
import { Activity } from "lucide-react";
import type { MatchEventDetail } from "@/hooks/useLiveMatches";
import { formatMatchMinute } from "./matchUtils";

interface MatchTimelineProps {
  events: MatchEventDetail[];
  isLive: boolean;
  homeName: string;
  awayName: string;
  homeColor: string;
  awayColor: string;
}

interface IncidentTheme {
  icon: string;
  headline: string;
  accentColor: string;
  glowColor: string;
  borderStyle: string;
  bgGradient: string;
  headlineColor: string;
  isDisallowed: boolean;
}

/**
 * Convierte un texto a Capitalizado en cada palabra (Title Case),
 * respetando siglas como VAR y caracteres de apertura (¡, ¿, etc.).
 */
function toTitleCase(str?: string | null): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/(?:^|\s|[-_/(¡¿])\S/g, (char) => char.toUpperCase())
    .replace(/\bVar\b/g, "VAR");
}

function getIncidentTheme(evt: MatchEventDetail): IncidentTheme {
  const isDisallowed = evt.type === "disallowed-goal" || evt.disallowed;

  if (isDisallowed) {
    return {
      icon: "🚫",
      headline: evt.text ? toTitleCase(evt.text) : "Gol Anulado (VAR)",
      accentColor: "#EF4444",
      glowColor: "rgba(239,68,68,0.3)",
      borderStyle: "border-red-500/40 md:hover:border-red-400/60",
      bgGradient: "from-red-950/45 via-[#0c0d14]/95 to-[#08080c]/98",
      headlineColor: "text-red-400",
      isDisallowed: true,
    };
  }
  if (evt.type === "penalty-goal") {
    return {
      icon: "🎯",
      headline: "Gol de Penal",
      accentColor: "#F59E0B",
      glowColor: "rgba(245,158,11,0.3)",
      borderStyle: "border-amber-500/40 md:hover:border-amber-400/60",
      bgGradient: "from-amber-950/45 via-[#0c0d14]/95 to-[#08080c]/98",
      headlineColor: "text-amber-400",
      isDisallowed: false,
    };
  }
  if (evt.type === "penalty-miss") {
    return {
      icon: "❌",
      headline: evt.text ? toTitleCase(evt.text) : "Penal Fallado",
      accentColor: "#F43F5E",
      glowColor: "rgba(244,63,94,0.25)",
      borderStyle: "border-rose-500/40 md:hover:border-rose-400/60",
      bgGradient: "from-rose-950/40 via-[#0c0d14]/95 to-[#08080c]/98",
      headlineColor: "text-rose-400",
      isDisallowed: false,
    };
  }
  if (evt.type === "own-goal") {
    return {
      icon: "⚽",
      headline: "Autogol",
      accentColor: "#60A5FA",
      glowColor: "rgba(96,165,250,0.25)",
      borderStyle: "border-blue-500/40 md:hover:border-blue-400/60",
      bgGradient: "from-blue-950/40 via-[#0c0d14]/95 to-[#08080c]/98",
      headlineColor: "text-blue-400",
      isDisallowed: false,
    };
  }
  if (evt.type === "red-card") {
    return {
      icon: "🟥",
      headline: evt.text ? toTitleCase(evt.text) : "Tarjeta Roja",
      accentColor: "#EF4444",
      glowColor: "rgba(239,68,68,0.35)",
      borderStyle: "border-red-500/50 md:hover:border-red-400/70",
      bgGradient: "from-red-950/50 via-[#0c0d14]/95 to-[#08080c]/98",
      headlineColor: "text-red-400",
      isDisallowed: false,
    };
  }
  if (evt.type === "yellow-card") {
    return {
      icon: "🟨",
      headline: evt.text ? toTitleCase(evt.text) : "Tarjeta Amarilla",
      accentColor: "#FBBF24",
      glowColor: "rgba(251,191,36,0.25)",
      borderStyle: "border-amber-400/40 md:hover:border-amber-300/60",
      bgGradient: "from-amber-950/35 via-[#0c0d14]/95 to-[#08080c]/98",
      headlineColor: "text-amber-300",
      isDisallowed: false,
    };
  }
  if (evt.type === "var") {
    return {
      icon: "📺",
      headline: evt.text ? toTitleCase(evt.text) : "Decisión VAR",
      accentColor: "#38BDF8",
      glowColor: "rgba(56,189,248,0.25)",
      borderStyle: "border-sky-500/40 md:hover:border-sky-400/60",
      bgGradient: "from-sky-950/35 via-[#0c0d14]/95 to-[#08080c]/98",
      headlineColor: "text-sky-400",
      isDisallowed: false,
    };
  }
  // Gol estándar siempre con signo de exclamación ¡Gol!
  return {
    icon: "⚽",
    headline: "¡Gol!",
    accentColor: "#10B981",
    glowColor: "rgba(16,185,129,0.3)",
    borderStyle: "border-emerald-500/40 md:hover:border-emerald-400/60",
    bgGradient: "from-emerald-950/45 via-[#0c0d14]/95 to-[#08080c]/98",
    headlineColor: "text-emerald-400",
    isDisallowed: false,
  };
}

/**
 * ⚽ Tarjeta Épica Compacta de Incidencia Deportiva:
 * - UN SOLO CONTENEDOR: Cero píldoras ni cajas anidadas.
 * - IDENTIDAD DE CLUB: Franja neón con el color del equipo del lado del hilo de tiempo.
 * - COLOR DE ENFOQUE: Iluminación ambiental y borde según la incidencia (gol, tarjeta, etc.).
 * - ALINEACIÓN LOCAL: Texto justificado a la derecha, pegado a la línea de tiempo.
 * - AJUSTE ORGÁNICO: w-fit con max-width para evitar huecos vacíos y desbordamientos en nombres largos.
 * - TIPOGRAFÍA EN TITLE CASE: Sin mayúsculas sostenidas, ¡Gol! con signos.
 */
function EpicIncidentCard({
  evt,
  side,
  theme,
  teamColor,
}: {
  evt: MatchEventDetail;
  side: "left" | "right";
  theme: IncidentTheme;
  teamColor: string;
}) {
  const isLeft = side === "left";
  const cleanJersey = evt.jersey ? String(evt.jersey).replace(/^#/, "").trim() : null;
  const formattedPlayerName = toTitleCase(evt.playerName);

  return (
    <div
      className={`relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r ${theme.bgGradient} border ${theme.borderStyle} py-1.5 px-2.5 sm:py-2 sm:px-3 select-none group shadow-lg w-fit max-w-[190px] sm:max-w-[280px] md:max-w-[320px] shrink-0`}
      style={{
        boxShadow: `0 4px 14px -2px ${theme.glowColor}, 0 2px 8px rgba(0,0,0,0.85)`,
      }}
    >
      {/* 🌟 Hairline de cristal superior (especular) */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      {/* 🏟️ Reflector ambiental radial (sin filter: blur para máximo rendimiento móvil) */}
      <div
        className={`absolute -top-6 ${isLeft ? "-right-6" : "-left-6"} w-24 h-24 rounded-full pointer-events-none opacity-30 md:group-hover:opacity-50 transition-opacity`}
        style={{
          background: `radial-gradient(circle, ${theme.accentColor} 0%, transparent 70%)`,
        }}
      />

      {/* 🔴 Franja Neón con el COLOR DEL EQUIPO del lado del hilo de tiempo */}
      <div
        className={`absolute top-0 bottom-0 ${isLeft ? "right-0" : "left-0"} w-1 sm:w-1.5`}
        style={{
          backgroundColor: teamColor || theme.accentColor,
          boxShadow: `0 0 8px ${teamColor || theme.accentColor}`,
        }}
      />

      {/* ⚽ Contenido directo compacto */}
      <div
        className={`relative z-10 flex items-center gap-2 sm:gap-2.5 ${
          isLeft ? "flex-row pr-1 sm:pr-1.5" : "flex-row pl-1 sm:pl-1.5"
        }`}
      >
        {isLeft ? (
          <>
            {/* Bloque Textual Local: Justificado a la DERECHA para quedar pegado a la línea de tiempo */}
            <div className="flex flex-col min-w-0 text-right items-end justify-center">
              <span
                className={`text-[9px] sm:text-[11px] font-bold tracking-tight leading-none ${theme.headlineColor}`}
              >
                {theme.headline}
              </span>

              <h4
                className={`text-[11px] sm:text-xs md:text-sm font-semibold tracking-tight text-white leading-snug mt-1 flex items-center justify-end flex-wrap gap-1 ${
                  theme.isDisallowed ? "line-through decoration-red-500/80 text-white/40" : ""
                }`}
              >
                {cleanJersey ? (
                  <span className="font-mono text-white/50 font-bold tabular-nums shrink-0">
                    {cleanJersey}
                  </span>
                ) : null}
                <span className="break-words sm:whitespace-nowrap">{formattedPlayerName}</span>
              </h4>
            </div>

            {/* Ícono de Incidencia con caja fija */}
            <div className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 flex items-center justify-center">
              <span className="text-lg sm:text-xl md:text-2xl select-none md:group-hover:scale-110 transition-transform">
                {theme.icon}
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Ícono de Incidencia con caja fija */}
            <div className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 flex items-center justify-center">
              <span className="text-lg sm:text-xl md:text-2xl select-none md:group-hover:scale-110 transition-transform">
                {theme.icon}
              </span>
            </div>

            {/* Bloque Textual Visitante: Justificado a la IZQUIERDA */}
            <div className="flex flex-col min-w-0 text-left items-start justify-center">
              <span
                className={`text-[9px] sm:text-[11px] font-bold tracking-tight leading-none ${theme.headlineColor}`}
              >
                {theme.headline}
              </span>

              <h4
                className={`text-[11px] sm:text-xs md:text-sm font-semibold tracking-tight text-white leading-snug mt-1 flex items-center justify-start flex-wrap gap-1 ${
                  theme.isDisallowed ? "line-through decoration-red-500/80 text-white/40" : ""
                }`}
              >
                {cleanJersey ? (
                  <span className="font-mono text-white/50 font-bold tabular-nums shrink-0">
                    {cleanJersey}
                  </span>
                ) : null}
                <span className="break-words sm:whitespace-nowrap">{formattedPlayerName}</span>
              </h4>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MatchTimelineComponent({
  events,
  isLive,
  homeColor,
  awayColor,
}: MatchTimelineProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#12131a]/70 md:bg-white/[0.03] md:backdrop-blur-xl border border-white/[0.08] p-3.5 sm:p-6 shadow-2xl">
      {/* Cabecera de Incidencias */}
      <div className="flex items-center justify-between mb-3.5 sm:mb-4 pb-2.5 border-b border-white/[0.06]">
        <span className="text-xs font-bold text-white tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-red-500 animate-pulse" />
          <span>Incidencias del Partido</span>
        </span>
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-bold tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            En Vivo
          </span>
        ) : (
          <span className="text-xs text-white/40 font-mono font-medium">
            {events.length} {events.length === 1 ? "incidencia" : "incidencias"}
          </span>
        )}
      </div>

      {events.length === 0 ? (
        <div className="py-8 text-center text-xs text-gray-400 italic">
          No hay goles ni incidencias registradas todavía.
        </div>
      ) : (
        <div className="relative py-2 sm:py-3">
          {/* Eje Vertical Central (Hilo luminoso cronológico) */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent -translate-x-1/2 pointer-events-none" />

          <div className="space-y-3 sm:space-y-4">
            {events.map((evt: MatchEventDetail) => {
              const isHome = evt.isHome;
              const minuteDisplay = formatMatchMinute(evt.minute);
              const theme = getIncidentTheme(evt);
              const teamColor = isHome ? homeColor : awayColor;

              return (
                <div
                  key={evt.id}
                  className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-0 group"
                >
                  {/* LADO LOCAL (IZQUIERDA) */}
                  <div className="flex justify-end items-center min-w-0 pr-0">
                    {isHome ? (
                      <div className="flex items-center justify-end">
                        <EpicIncidentCard
                          evt={evt}
                          side="left"
                          theme={theme}
                          teamColor={teamColor}
                        />
                        {/* ⚡ Conector directo con el color de identidad del club */}
                        <div
                          className="h-0.5 w-2 sm:w-3.5 shrink-0"
                          style={{
                            background: `linear-gradient(to right, ${teamColor || theme.accentColor}, rgba(255,255,255,0.4))`,
                            boxShadow: `0 0 6px ${teamColor || theme.accentColor}`,
                          }}
                        />
                      </div>
                    ) : (
                      <div />
                    )}
                  </div>

                  {/* NODO CENTRAL DEL TIEMPO (MINUTO DE JUEGO) */}
                  <div className="z-10 px-2 py-0.5 sm:py-1 rounded-full bg-[#0c0d14] border border-white/20 text-[10px] sm:text-xs font-mono font-bold text-white shadow-[0_2px_8px_rgba(0,0,0,0.85)] tracking-tight shrink-0 text-center min-w-[2.2rem] sm:min-w-[2.6rem] flex items-center justify-center">
                    {minuteDisplay}
                  </div>

                  {/* LADO VISITANTE (DERECHA) */}
                  <div className="flex justify-start items-center min-w-0 pl-0">
                    {!isHome ? (
                      <div className="flex items-center justify-start">
                        {/* ⚡ Conector directo con el color de identidad del club */}
                        <div
                          className="h-0.5 w-2 sm:w-3.5 shrink-0"
                          style={{
                            background: `linear-gradient(to right, rgba(255,255,255,0.4), ${teamColor || theme.accentColor})`,
                            boxShadow: `0 0 6px ${teamColor || theme.accentColor}`,
                          }}
                        />
                        <EpicIncidentCard
                          evt={evt}
                          side="right"
                          theme={theme}
                          teamColor={teamColor}
                        />
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
