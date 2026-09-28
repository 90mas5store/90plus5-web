"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Activity, Award, Share2 } from "lucide-react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import type { LiveMatchData } from "@/hooks/useLiveMatches";
import type { StandingRow } from "@/app/api/standings/route";
import { resolveMatchColors } from "@/lib/teamColors";
import { translateTeamNameToSpanish } from "@/lib/teamNames";

import { getResolvedLeagueSlug, projectMomentum } from "./matchUtils";
import { MatchScoreboard } from "./MatchScoreboard";
import { MatchTimeline } from "./MatchTimeline";
import { MatchStats } from "./MatchStats";
import { MatchStandings, type StandingGroupData } from "./MatchStandings";
import { MatchCommercialBanner } from "./MatchCommercialBanner";

interface MatchCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: LiveMatchData | null;
}

export default function MatchCenterModal({
  isOpen,
  onClose,
  match: initialMatch,
}: MatchCenterModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"match" | "standings">("match");
  const [currentMatch, setCurrentMatch] = useState<LiveMatchData | null>(initialMatch);
  const [standingsByLeague, setStandingsByLeague] = useState<Record<string, StandingGroupData>>({});
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [loadingStandings, setLoadingStandings] = useState(false);

  const dragControls = useDragControls();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sincronizar partido inicial al cambiar de prop
  useEffect(() => {
    setCurrentMatch(initialMatch);
  }, [initialMatch]);

  // Cerrar con Escape y bloquear scroll del body
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Actualización en tiempo real cada 10s (restringido a cambios reales)
  useEffect(() => {
    if (!isOpen || !initialMatch) return;

    let isSubscribed = true;
    const updateLiveMatch = async () => {
      try {
        const res = await fetch("/api/live-matches", { cache: "no-store" });
        if (!res.ok || !isSubscribed) return;
        const data = await res.json();
        const updated = Object.values(data as Record<string, LiveMatchData>).find(
          (m) =>
            m.homeTeam.toLowerCase() === initialMatch.homeTeam.toLowerCase() &&
            m.awayTeam.toLowerCase() === initialMatch.awayTeam.toLowerCase()
        );
        if (updated && isSubscribed) {
          setCurrentMatch((prev) => {
            if (!prev) return updated;
            const scoreChanged =
              prev.homeScore !== updated.homeScore || prev.awayScore !== updated.awayScore;
            const clockChanged =
              prev.displayClock !== updated.displayClock || prev.minute !== updated.minute;
            const statusChanged =
              prev.isFinished !== updated.isFinished || prev.isHalftime !== updated.isHalftime;
            const eventsChanged = (prev.events?.length || 0) !== (updated.events?.length || 0);

            if (scoreChanged || clockChanged || statusChanged || eventsChanged) {
              return updated;
            }
            return prev;
          });
        }
      } catch {
        // Fallo silencioso de red
      }
    };

    const interval = setInterval(updateLiveMatch, 10_000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [isOpen, initialMatch]);

  // Partido activo (enriquecido con polling o inicial)
  const activeMatch = currentMatch || initialMatch;
  const currentLeagueSlug = getResolvedLeagueSlug(activeMatch);
  const teamSearchParam = activeMatch?.homeTeam || activeMatch?.awayTeam || "";
  const teamCacheKey = `${currentLeagueSlug}:${teamSearchParam}`;

  // Carga de clasificación
  useEffect(() => {
    if (!isOpen || !currentLeagueSlug) return;
    if (standingsByLeague[teamCacheKey]) return;

    setLoadingStandings(true);
    fetch(
      `/api/standings?league=${encodeURIComponent(currentLeagueSlug)}&team=${encodeURIComponent(
        teamSearchParam
      )}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.standings && Array.isArray(data.standings)) {
          const parsedGroups: { name: string; standings: StandingRow[] }[] = Array.isArray(
            data.groups
          )
            ? data.groups.map((g: any) => ({
                name: g.name,
                standings: [...(g.standings || [])].sort((a: StandingRow, b: StandingRow) =>
                  a.rank > 0 && b.rank > 0 && a.rank !== b.rank
                    ? a.rank - b.rank
                    : b.points - a.points
                ),
              }))
            : [];

          const parsedStandings = [...data.standings].sort((a: StandingRow, b: StandingRow) =>
            a.rank > 0 && b.rank > 0 && a.rank !== b.rank ? a.rank - b.rank : b.points - a.points
          );

          setStandingsByLeague((prev) => ({
            ...prev,
            [teamCacheKey]: {
              groupName: data.groupName,
              groups: parsedGroups,
              standings: parsedStandings,
            },
          }));
          setSelectedGroupIndex(0);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingStandings(false));
  }, [isOpen, currentLeagueSlug, teamSearchParam, teamCacheKey, standingsByLeague]);

  const homeName = useMemo(
    () => (activeMatch ? translateTeamNameToSpanish(activeMatch.homeShortTeam || activeMatch.homeTeam) : ""),
    [activeMatch]
  );
  const awayName = useMemo(
    () => (activeMatch ? translateTeamNameToSpanish(activeMatch.awayShortTeam || activeMatch.awayTeam) : ""),
    [activeMatch]
  );

  const colors = useMemo(() => {
    if (!activeMatch) return { homeColor: "#EF4444", awayColor: "#3B82F6", isHomeWhite: false, isAwayWhite: false };
    return resolveMatchColors({
      homeColor: activeMatch.homeColor,
      awayColor: activeMatch.awayColor,
      homeAltColor: activeMatch.homeAltColor,
      awayAltColor: activeMatch.awayAltColor,
      homeTeamName: activeMatch.homeTeam,
      awayTeamName: activeMatch.awayTeam,
    });
  }, [activeMatch]);

  const isLive = Boolean(activeMatch && !activeMatch.isFinished && !activeMatch.isUpcoming);

  const events = useMemo(() => {
    if (!activeMatch?.events) return [];
    return [...activeMatch.events].reverse();
  }, [activeMatch?.events]);

  const hasHomeInDb = Boolean(activeMatch?.hasHomeTeamInDb || activeMatch?.homeTeamId);
  const hasAwayInDb = Boolean(activeMatch?.hasAwayTeamInDb || activeMatch?.awayTeamId);

  const leagueData = currentLeagueSlug ? standingsByLeague[teamCacheKey] : undefined;

  const handleShareWhatsApp = useCallback(() => {
    if (!activeMatch) return;
    const timeStatus = activeMatch.isFinished
      ? "Finalizado"
      : activeMatch.isHalftime
      ? "Entretiempo"
      : activeMatch.isUpcoming
      ? `Inicia ${activeMatch.startTime || "hoy"}`
      : activeMatch.displayClock || `${activeMatch.minute || ""}' EN VIVO`;

    const origin = typeof window !== "undefined" ? window.location.origin : "https://90mas5.com";
    const storeUrl = `${origin}/catalogo?match=${encodeURIComponent(homeName)}`;

    const text = `🔥 ¡Sigue el partido en vivo en 90+5 Store!
⚽ *${homeName} ${activeMatch.homeScore} - ${activeMatch.awayScore} ${awayName}* (${timeStatus})
🏆 ${activeMatch.leagueName || "Matchday"}

👕 Mira las camisetas oficiales con 10% OFF usando el código *MATCHDAY* aquí:
👉 ${storeUrl}`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  }, [activeMatch, homeName, awayName]);

  const portalTarget = typeof document !== "undefined" ? document.body : null;
  if (!isOpen || !activeMatch || !mounted || !portalTarget) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden">
        {/* Scrim / Fondo translúcido con desenfoque de profundidad (Apple Materials §12) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        />

        {/* Modal Principal con Física de Resortes y Drag to Dismiss (§4, §5, §6 Apple Design) */}
        <motion.div
          drag="y"
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.05, bottom: 0.75 }}
          onDragEnd={(_, info) => {
            const projectedY = info.offset.y + projectMomentum(info.velocity.y);
            if (projectedY > 160 || info.offset.y > 100 || info.velocity.y > 450) {
              onClose();
            }
          }}
          initial={{ opacity: 0, scale: 0.96, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 40 }}
          transition={{
            type: "spring",
            damping: 30,
            stiffness: 340,
            mass: 0.8,
          }}
          className="relative w-full max-w-2xl lg:max-w-6xl xl:max-w-7xl bg-[#0b0c10]/85 backdrop-blur-3xl border-t sm:border border-white/[0.12] rounded-t-[2.2rem] sm:rounded-[2.5rem] shadow-[0_32px_96px_rgba(0,0,0,0.92)] overflow-hidden z-10 text-white my-0 sm:my-auto max-h-[94vh] sm:max-h-[92vh] flex flex-col will-change-transform"
        >
          {/* Hairline luminoso superior (Apple glass specular highlight) */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none z-20" />

          {/* Resplandor ambiental de los clubes (Aceleración GPU + blur adaptable) */}
          <div
            className="absolute -top-24 -left-24 w-72 h-72 sm:w-[28rem] sm:h-[28rem] lg:w-[36rem] lg:h-[36rem] rounded-full blur-[70px] sm:blur-[110px] pointer-events-none transform-gpu will-change-transform opacity-30"
            style={{
              backgroundColor: colors.homeColor,
              transform: "translate3d(0, 0, 0)",
            }}
          />
          <div
            className="absolute -top-24 -right-24 w-72 h-72 sm:w-[28rem] sm:h-[28rem] lg:w-[36rem] lg:h-[36rem] rounded-full blur-[70px] sm:blur-[110px] pointer-events-none transform-gpu will-change-transform opacity-30"
            style={{
              backgroundColor: colors.awayColor,
              transform: "translate3d(0, 0, 0)",
            }}
          />

          {/* Indicador de arrastre Apple (Grab Handle Pill) */}
          <div
            className="w-full flex flex-col items-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing touch-none select-none z-30 shrink-0 group"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <div className="w-10 h-1.5 rounded-full bg-white/25 group-hover:bg-white/40 group-active:bg-white/60 transition-colors shadow-sm" />
          </div>

          {/* Barra superior móvil con botón compartir y cerrar */}
          <div
            className="sm:hidden flex items-center justify-between px-4 pb-2.5 pt-1 border-b border-white/[0.08] shrink-0 bg-white/[0.02] touch-none select-none"
            onPointerDown={(e) => {
              const target = e.target as HTMLElement;
              if (
                target.tagName !== "BUTTON" &&
                !target.closest("button") &&
                target.tagName !== "A" &&
                !target.closest("a")
              ) {
                dragControls.start(e);
              }
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-200 truncate max-w-[160px]">
                {activeMatch.leagueName || "MATCHDAY"}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-[10px] font-semibold active:scale-95 transition-transform"
                title="Compartir en WhatsApp"
              >
                <Share2 className="w-3 h-3 text-emerald-400" />
                <span>Compartir</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/10 active:scale-90 border border-white/15 flex items-center justify-center text-white/80 active:text-white transition-all cursor-pointer backdrop-blur-md"
                aria-label="Cerrar modal"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Botón cerrar en Desktop (Frosted glass circle) */}
          <button
            type="button"
            onClick={onClose}
            className="hidden sm:flex absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 border border-white/15 items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer shadow-lg backdrop-blur-md"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Cuerpo con scroll fluido */}
          <div className="flex-1 overflow-y-auto px-3.5 sm:px-6 md:px-8 pt-3 sm:pt-4 pb-8 scrollbar-thin scrollbar-thumb-white/20 overscroll-contain">
            {/* Scoreboard en móvil (< lg) */}
            <div className="block lg:hidden mb-4">
              <MatchScoreboard
                match={activeMatch}
                homeName={homeName}
                awayName={awayName}
                homeColor={colors.homeColor}
                awayColor={colors.awayColor}
                isHomeWhite={colors.isHomeWhite}
                isAwayWhite={colors.isAwayWhite}
                onShareWhatsApp={handleShareWhatsApp}
              />
            </div>

            {/* Apple Segmented Control (Pestañas en móvil) */}
            {currentLeagueSlug && (
              <div className="flex lg:hidden justify-center mb-4 shrink-0 px-1">
                <div className="relative grid grid-cols-2 p-1 bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-full w-full max-w-sm">
                  <button
                    type="button"
                    onClick={() => setActiveTab("match")}
                    className="relative z-10 flex items-center justify-center gap-1.5 py-2 text-xs transition-colors cursor-pointer select-none active:scale-[0.98]"
                  >
                    {activeTab === "match" && (
                      <motion.div
                        layoutId="appleSegmentedPill"
                        className="absolute inset-0 rounded-full bg-white/15 backdrop-blur-md border border-white/20 shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                        transition={{ type: "spring", damping: 26, stiffness: 360 }}
                      />
                    )}
                    <Activity
                      className={`w-3.5 h-3.5 z-10 ${
                        activeTab === "match" ? "text-white" : "text-gray-400"
                      }`}
                    />
                    <span
                      className={`z-10 text-xs font-bold tracking-tight ${
                        activeTab === "match" ? "text-white" : "text-gray-400"
                      }`}
                    >
                      En Vivo & Stats
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("standings")}
                    className="relative z-10 flex items-center justify-center gap-1.5 py-2 text-xs transition-colors cursor-pointer select-none active:scale-[0.98]"
                  >
                    {activeTab === "standings" && (
                      <motion.div
                        layoutId="appleSegmentedPill"
                        className="absolute inset-0 rounded-full bg-white/15 backdrop-blur-md border border-white/20 shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                        transition={{ type: "spring", damping: 26, stiffness: 360 }}
                      />
                    )}
                    <Award
                      className={`w-3.5 h-3.5 z-10 ${
                        activeTab === "standings" ? "text-white" : "text-gray-400"
                      }`}
                    />
                    <span
                      className={`z-10 text-xs font-bold tracking-tight ${
                        activeTab === "standings" ? "text-white" : "text-gray-400"
                      }`}
                    >
                      Clasificación
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Grid principal de 2 columnas en Desktop / Tabs en móvil */}
            <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
              {/* Columna Izquierda (7 cols): Marcador, Cronología & Estadísticas */}
              <div
                className={`lg:col-span-7 space-y-5 sm:space-y-6 ${
                  activeTab === "match" ? "block" : "hidden lg:block"
                }`}
              >
                {/* Marcador en Desktop */}
                <div className="hidden lg:block">
                  <MatchScoreboard
                    match={activeMatch}
                    homeName={homeName}
                    awayName={awayName}
                    homeColor={colors.homeColor}
                    awayColor={colors.awayColor}
                    isHomeWhite={colors.isHomeWhite}
                    isAwayWhite={colors.isAwayWhite}
                    onShareWhatsApp={handleShareWhatsApp}
                  />
                </div>

                {/* Cronología */}
                <MatchTimeline
                  events={events}
                  isLive={isLive}
                  homeName={homeName}
                  awayName={awayName}
                  homeColor={colors.homeColor}
                  awayColor={colors.awayColor}
                />

                {/* Estadísticas de juego y posesión */}
                <MatchStats
                  stats={activeMatch.stats}
                  homeName={homeName}
                  awayName={awayName}
                  homeColor={colors.homeColor}
                  awayColor={colors.awayColor}
                  isHomeWhite={colors.isHomeWhite}
                  isAwayWhite={colors.isAwayWhite}
                />

                {/* Banner Comercial en móvil (pestaña 'match') */}
                <div className="block lg:hidden pt-2">
                  <MatchCommercialBanner
                    match={activeMatch}
                    homeName={homeName}
                    awayName={awayName}
                    hasHomeInDb={hasHomeInDb}
                    hasAwayInDb={hasAwayInDb}
                    onClose={onClose}
                  />
                </div>
              </div>

              {/* Columna Derecha (5 cols): Clasificación & Camisetas */}
              <div
                className={`lg:col-span-5 space-y-6 ${
                  activeTab === "standings" ? "block" : "hidden lg:block"
                }`}
              >
                {/* Tabla de Posiciones */}
                <MatchStandings
                  leagueSlug={currentLeagueSlug}
                  leagueData={leagueData}
                  loading={loadingStandings}
                  homeName={homeName}
                  awayName={awayName}
                  selectedGroupIndex={selectedGroupIndex}
                  onSelectGroupIndex={setSelectedGroupIndex}
                />

                {/* Banner Comercial en Desktop */}
                <div className="hidden lg:block">
                  <MatchCommercialBanner
                    match={activeMatch}
                    homeName={homeName}
                    awayName={awayName}
                    hasHomeInDb={hasHomeInDb}
                    hasAwayInDb={hasAwayInDb}
                    onClose={onClose}
                  />
                </div>

                {/* Banner Comercial en móvil (pestaña 'standings') */}
                <div className="block lg:hidden pt-2">
                  <MatchCommercialBanner
                    match={activeMatch}
                    homeName={homeName}
                    awayName={awayName}
                    hasHomeInDb={hasHomeInDb}
                    hasAwayInDb={hasAwayInDb}
                    onClose={onClose}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    portalTarget
  );
}
