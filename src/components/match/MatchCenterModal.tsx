"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X, Flame, Trophy, Sparkles, MapPin, Shirt, ArrowRight, Shield, Activity, Award, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "@/lib/motion";
import type { LiveMatchData, MatchEventDetail } from "@/hooks/useLiveMatches";
import type { StandingRow } from "@/app/api/standings/route";
import { resolveMatchColors } from "@/lib/teamColors";

interface MatchCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: LiveMatchData | null;
}

// Limpiar y formatear el minuto de juego de forma precisa (ej. "90+7'") sin apóstrofes dobles ni espacios
function formatMatchMinute(rawMinute?: string | null): string {
  if (!rawMinute) return "•";
  const clean = rawMinute.replace(/['"´`\s]+/g, '').trim();
  return clean ? `${clean}'` : "•";
}

function formatGroupName(name?: string | null): string {
  if (!name) return '';
  if (name === 'Eastern Conference') return 'Conferencia Este';
  if (name === 'Western Conference') return 'Conferencia Oeste';
  if (name === 'League Phase') return 'Fase de Liga';
  return name;
}

function getResolvedLeagueSlug(match: LiveMatchData | null): string {
  if (!match) return 'mex.1';
  if (match.leagueSlug && match.leagueSlug.trim()) return match.leagueSlug;
  const name = (match.leagueName || '').toLowerCase();
  if (name.includes('liga mx') || name.includes('mexic') || name.includes('apertura') || name.includes('clausura')) return 'mex.1';
  if (name.includes('la liga') || name.includes('laliga') || name.includes('españ') || name.includes('spain')) return 'esp.1';
  if (name.includes('premier') || name.includes('england') || name.includes('inglaterra')) return 'eng.1';
  if (name.includes('serie a') || name.includes('ital')) return 'ita.1';
  if (name.includes('bundesliga') || name.includes('aleman')) return 'ger.1';
  if (name.includes('ligue 1') || name.includes('francia')) return 'fra.1';
  if (name.includes('mls') || name.includes('major league')) return 'usa.1';
  if (name.includes('honduras') || name.includes('liga nacional')) return 'hon.1';
  if (name.includes('champions') || name.includes('ucl')) return 'uefa.champions';

  const combined = `${match.homeTeam || ''} ${match.awayTeam || ''}`.toLowerCase();
  if (combined.includes('america') || combined.includes('cruz azul') || combined.includes('chivas') || combined.includes('tigres') || combined.includes('monterrey') || combined.includes('toluca') || combined.includes('pumas') || combined.includes('atlas')) return 'mex.1';
  if (combined.includes('real madrid') || combined.includes('barcelona') || combined.includes('atletico') || combined.includes('sevilla') || combined.includes('betis')) return 'esp.1';
  if (combined.includes('arsenal') || combined.includes('city') || combined.includes('liverpool') || combined.includes('chelsea') || combined.includes('united') || combined.includes('tottenham')) return 'eng.1';
  if (combined.includes('olimpia') || combined.includes('motagua') || combined.includes('marathon') || combined.includes('real españa') || combined.includes('espana')) return 'hon.1';
  if (combined.includes('inter miami') || combined.includes('lafc') || combined.includes('galaxy') || combined.includes('nashville')) return 'usa.1';

  return 'mex.1';
}

function getEventVisual(evt: MatchEventDetail): { icon: string; label: string } {
  switch (evt.type) {
    case 'goal':
      return { icon: '⚽', label: evt.text || 'Gol' };
    case 'penalty-goal':
      return { icon: '🎯', label: 'Gol de Penal' };
    case 'penalty-miss':
      return { icon: '❌', label: 'Penal Fallado' };
    case 'own-goal':
      return { icon: '⚽', label: 'Autogol' };
    case 'disallowed-goal':
      return { icon: '🚫', label: 'Gol Anulado (VAR)' };
    case 'var':
      return { icon: '📺', label: evt.text || 'Revisión VAR' };
    case 'red-card':
      return { icon: '🟥', label: 'Tarjeta Roja' };
    case 'yellow-card':
      return { icon: '🟨', label: 'Tarjeta Amarilla' };
    default:
      return { icon: '⚽', label: evt.text || 'Incidencia' };
  }
}

interface StandingGroupData {
  groupName?: string;
  groups?: { name: string; standings: StandingRow[] }[];
  standings: StandingRow[];
}

export default function MatchCenterModal({ isOpen, onClose, match: initialMatch }: MatchCenterModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'match' | 'standings'>('match');
  const [currentMatch, setCurrentMatch] = useState<LiveMatchData | null>(initialMatch);
  const [standingsByLeague, setStandingsByLeague] = useState<Record<string, StandingGroupData>>({});
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [loadingStandings, setLoadingStandings] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sincronizar partido inicial
  useEffect(() => {
    setCurrentMatch(initialMatch);
  }, [initialMatch]);

  // Cerrar con Escape
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

  // 1. ACTUALIZACIÓN EN TIEMPO REAL: mientras el modal esté abierto, refrescar datos cada 10s
  useEffect(() => {
    if (!isOpen || !initialMatch) return;

    let isMounted = true;
    const updateLiveMatch = async () => {
      try {
        const res = await fetch('/api/live-matches', { cache: 'no-store' });
        if (!res.ok || !isMounted) return;
        const data = await res.json();
        const updated = Object.values(data as Record<string, LiveMatchData>).find(
          (m) =>
            m.homeTeam.toLowerCase() === initialMatch.homeTeam.toLowerCase() &&
            m.awayTeam.toLowerCase() === initialMatch.awayTeam.toLowerCase()
        );
        if (updated && isMounted) {
          setCurrentMatch(updated);
        }
      } catch {
        // fallo silencioso de red
      }
    };

    const interval = setInterval(updateLiveMatch, 10_000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, initialMatch]);

  // 2. CARGA EN SEGUNDO PLANO DE LA TABLA: en cuanto abre el modal, pre-cargar la liga y conferencia correctas
  const activeMatch = currentMatch || initialMatch;
  const currentLeagueSlug = getResolvedLeagueSlug(activeMatch);
  const teamSearchParam = activeMatch?.homeTeam || activeMatch?.awayTeam || '';
  const teamCacheKey = `${currentLeagueSlug}:${teamSearchParam}`;

  useEffect(() => {
    if (!isOpen || !currentLeagueSlug) return;

    // Si ya está en caché local para esta liga y equipo, no re-consultar
    if (standingsByLeague[teamCacheKey]) return;

    setLoadingStandings(true);
    fetch(`/api/standings?league=${encodeURIComponent(currentLeagueSlug)}&team=${encodeURIComponent(teamSearchParam)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.standings && Array.isArray(data.standings)) {
          const parsedGroups: { name: string; standings: StandingRow[] }[] = Array.isArray(data.groups)
            ? data.groups.map((g: any) => ({
                name: g.name,
                standings: [...(g.standings || [])].sort((a: StandingRow, b: StandingRow) =>
                  a.rank > 0 && b.rank > 0 && a.rank !== b.rank ? a.rank - b.rank : b.points - a.points
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

  const portalTarget = typeof document !== 'undefined' ? document.body : null;
  if (!isOpen || !activeMatch || !mounted || !portalTarget) return null;

  // ORDEN ESTRICTO: LOCAL A LA IZQUIERDA, VISITA A LA DERECHA
  const homeName = activeMatch.homeShortTeam || activeMatch.homeTeam;
  const awayName = activeMatch.awayShortTeam || activeMatch.awayTeam;
  const homeLogo = activeMatch.homeLogo;
  const awayLogo = activeMatch.awayLogo;
  const homeScore = activeMatch.homeScore;
  const awayScore = activeMatch.awayScore;

  // Colores auténticos y resolución de choques: Real Madrid y Olimpia mantienen su blanco puro #FFFFFF
  const { homeColor, awayColor, isHomeWhite, isAwayWhite } = resolveMatchColors({
    homeColor: activeMatch.homeColor,
    awayColor: activeMatch.awayColor,
    homeAltColor: activeMatch.homeAltColor,
    awayAltColor: activeMatch.awayAltColor,
    homeTeamName: activeMatch.homeTeam,
    awayTeamName: activeMatch.awayTeam,
  });

  const isLive = !activeMatch.isFinished && !activeMatch.isUpcoming;

  // Posesión
  const rawHomePoss = parseInt(activeMatch.stats?.possession?.home || "50", 10) || 50;
  const rawAwayPoss = parseInt(activeMatch.stats?.possession?.away || "50", 10) || 50;
  const totalPoss = rawHomePoss + rawAwayPoss || 100;
  const homePossPct = Math.round((rawHomePoss / totalPoss) * 100);
  const awayPossPct = 100 - homePossPct;

  // 3. CRONOLOGÍA INVERSA: lo más reciente ARRIBA
  const rawEvents = activeMatch.events || [];
  const events = [...rawEvents].reverse();

  // Filtrado de camisetas disponibles en catálogo
  const hasHomeInDb = Boolean(activeMatch.hasHomeTeamInDb || activeMatch.homeTeamId);
  const hasAwayInDb = Boolean(activeMatch.hasAwayTeamInDb || activeMatch.awayTeamId);

  // Tabla correspondiente a la liga y conferencia del partido actual (ORDEN 100% GARANTIZADO)
  const leagueData = currentLeagueSlug ? standingsByLeague[teamCacheKey] : undefined;
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

  const handleShareWhatsApp = () => {
    if (!activeMatch) return;
    const timeStatus = activeMatch.isFinished
      ? 'Finalizado'
      : activeMatch.isHalftime
      ? 'Entretiempo'
      : activeMatch.isUpcoming
      ? `Inicia ${activeMatch.startTime || 'hoy'}`
      : activeMatch.displayClock || `${activeMatch.minute || ''}' EN VIVO`;

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://90mas5.com';
    const storeUrl = `${origin}/catalogo?match=${encodeURIComponent(homeName)}`;

    const text = `🔥 ¡Sigue el partido en vivo en 90+5 Store!
⚽ *${homeName} ${homeScore} - ${awayScore} ${awayName}* (${timeStatus})
🏆 ${activeMatch.leagueName || 'Matchday'}

👕 Mira las camisetas oficiales con 10% OFF usando el código *MATCHDAY* aquí:
👉 ${storeUrl}`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const scoreboardNode = (
    <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
      {/* Píldora de Torneo, Sede y Botón Compartir (En Desktop) */}
      <div className="hidden sm:flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/[0.08] border border-white/15 text-xs font-black uppercase tracking-wider text-gray-200 shadow-sm">
            {activeMatch.isFinished ? (
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
            ) : activeMatch.isUpcoming ? (
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            ) : (
              <Flame className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
            )}
            <span>{activeMatch.leagueName || "MATCHDAY"}</span>
          </span>

          {activeMatch.venueName && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/[0.04] border border-white/5 text-[10px] text-gray-400 font-medium">
              <MapPin className="w-3 h-3 text-gray-500" />
              <span>{activeMatch.venueName}{activeMatch.venueCity ? `, ${activeMatch.venueCity}` : ''}</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleShareWhatsApp}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all hover:scale-105 cursor-pointer shadow-sm ml-auto"
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
            className="relative w-14 h-14 sm:w-20 sm:h-20 lg:w-22 lg:h-22 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 flex items-center justify-center border border-white/15 shadow-2xl transition-transform duration-300 hover:scale-105"
            style={{
              backgroundColor: isHomeWhite ? "rgba(255, 255, 255, 0.12)" : `${homeColor}18`,
              boxShadow: isHomeWhite
                ? "0 10px 35px rgba(255, 255, 255, 0.25)"
                : `0 12px 35px ${homeColor}35`,
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
                className="w-full h-full object-contain filter drop-shadow-[0_6px_15px_rgba(0,0,0,0.7)]"
              />
            )}
          </div>
          <span className="text-xs sm:text-base font-black text-white tracking-tight line-clamp-2 max-w-[100px] sm:max-w-none text-center">
            {homeName}
          </span>
        </div>

        {/* MARCADOR DIGITAL (CENTRO) */}
        <div className="flex flex-col items-center justify-center px-1 sm:px-2">
          {activeMatch.isUpcoming ? (
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl sm:text-5xl lg:text-6xl font-black text-blue-400 font-mono tracking-widest drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]">
                VS
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] sm:text-xs font-bold whitespace-nowrap">
                {activeMatch.startTime || "Próximamente"}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-2 sm:gap-4 text-3xl sm:text-5xl lg:text-6xl font-black font-mono tracking-tight text-white drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]">
                <span className={activeMatch.isFinished ? "text-amber-400" : "text-white"}>
                  {homeScore}
                </span>
                <span className="text-gray-600 font-extralight opacity-50">:</span>
                <span className={activeMatch.isFinished ? "text-amber-400" : "text-white"}>
                  {awayScore}
                </span>
              </div>

              {activeMatch.isHalftime ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] sm:text-xs font-mono font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400" />
                  ENTRETIEMPO
                </span>
              ) : isLive && (activeMatch.displayClock || activeMatch.minute) ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/40 text-[10px] sm:text-xs font-mono font-black animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 animate-ping" />
                  {activeMatch.displayClock || `${activeMatch.minute}'`} EN VIVO
                </span>
              ) : (
                <span className="px-3 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-xs text-gray-300 font-bold uppercase tracking-widest">
                  {activeMatch.isFinished ? "Finalizado" : "En Juego"}
                </span>
              )}
            </div>
          )}
        </div>

        {/* EQUIPO VISITANTE (DERECHA) */}
        <div className="flex flex-col items-center text-center gap-1.5 sm:gap-2">
          <div
            className="relative w-14 h-14 sm:w-20 sm:h-20 lg:w-22 lg:h-22 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 flex items-center justify-center border border-white/15 shadow-2xl transition-transform duration-300 hover:scale-105"
            style={{
              backgroundColor: isAwayWhite ? "rgba(255, 255, 255, 0.12)" : `${awayColor}18`,
              boxShadow: isAwayWhite
                ? "0 10px 35px rgba(255, 255, 255, 0.25)"
                : `0 12px 35px ${awayColor}35`,
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
                className="w-full h-full object-contain filter drop-shadow-[0_6px_15px_rgba(0,0,0,0.7)]"
              />
            )}
          </div>
          <span className="text-xs sm:text-base font-black text-white tracking-tight line-clamp-2 max-w-[100px] sm:max-w-none text-center">
            {awayName}
          </span>
        </div>
      </div>
    </div>
  );

  const commercialNode = (
    <div>
      {(hasHomeInDb || hasAwayInDb) ? (
        <div className="bg-gradient-to-b from-white/[0.05] to-white/[0.01] border border-white/10 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(229,9,20,0.3)]">
              <Shirt className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h5 className="text-xs sm:text-sm font-black text-white">
                Camisetas Oficiales del Partido
              </h5>
              <p className="text-[10px] text-gray-400">
                Personalización de dorsal disponible · Envíos a toda Honduras
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch gap-2.5 pt-0.5">
            {hasHomeInDb && (
              <Link
                href={activeMatch.homeTeamId
                  ? `/catalogo?equipo=${encodeURIComponent(activeMatch.homeTeamId)}`
                  : `/catalogo?query=${encodeURIComponent(homeName)}`}
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-[#E50914] hover:bg-red-700 text-white text-xs font-black flex items-center justify-center gap-2 transition-all hover:scale-105 shadow-[0_0_20px_rgba(229,9,20,0.4)] cursor-pointer"
              >
                <span>Camiseta {homeName}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            {hasAwayInDb && (
              <Link
                href={activeMatch.awayTeamId
                  ? `/catalogo?equipo=${encodeURIComponent(activeMatch.awayTeamId)}`
                  : `/catalogo?query=${encodeURIComponent(awayName)}`}
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-black flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer"
              >
                <span>Camiseta {awayName}</span>
                <ArrowRight className="w-4 h-4 text-gray-300" />
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-3xl p-4 sm:p-5 shadow-xl flex items-center justify-between gap-4">
          <span className="text-xs text-gray-400">
            Descubre miles de camisetas de las mejores ligas del mundo
          </span>
          <Link
            href="/catalogo"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#E50914] hover:bg-red-700 text-white text-xs font-black flex items-center gap-2 transition-all hover:scale-105 cursor-pointer shrink-0"
          >
            <span>Ver Catálogo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden">
        {/* Backdrop de Estadio */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/90 backdrop-blur-2xl transition-opacity"
        />

        {/* Modal Principal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 30 }}
          transition={{ type: "spring", damping: 28, stiffness: 350 }}
          className="relative w-full max-w-2xl lg:max-w-6xl xl:max-w-7xl bg-[#07070a] border-t sm:border border-white/20 rounded-t-[2rem] sm:rounded-[2.5rem] shadow-[0_30px_120px_rgba(0,0,0,0.98)] overflow-hidden z-10 text-white my-0 sm:my-auto max-h-[94vh] sm:max-h-[92vh] flex flex-col transition-all duration-300"
        >
          {/* Resplandor con Colores Reales de los Clubes */}
          <div
            className="absolute -top-32 -left-32 w-[28rem] h-[28rem] lg:w-[36rem] lg:h-[36rem] rounded-full blur-[140px] pointer-events-none transition-colors duration-1000"
            style={{
              backgroundColor: homeColor,
              opacity: isHomeWhite ? 0.22 : 0.35,
            }}
          />
          <div
            className="absolute -top-32 -right-32 w-[28rem] h-[28rem] lg:w-[36rem] lg:h-[36rem] rounded-full blur-[140px] pointer-events-none transition-colors duration-1000"
            style={{
              backgroundColor: awayColor,
              opacity: isAwayWhite ? 0.22 : 0.35,
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.06)_0%,_transparent_75%)] pointer-events-none" />

          {/* BARRA SUPERIOR MÓVIL (LIMPIA, SIN COLISIONES DE BOTONES) */}
          <div className="sm:hidden flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-white/10 shrink-0 bg-white/[0.03]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-200 truncate max-w-[160px]">
                {activeMatch.leagueName || "MATCHDAY"}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold active:scale-95 transition-transform"
                title="Compartir en WhatsApp"
              >
                <Share2 className="w-3 h-3 text-emerald-400" />
                <span>Compartir</span>
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white active:scale-90 transition-all cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* BOTÓN CERRAR EN DESKTOP (FLOTANTE ARRIBA A LA DERECHA) */}
          <button
            onClick={onClose}
            className="hidden sm:flex absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 items-center justify-center text-gray-300 hover:text-white transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-lg"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* ──────── CUERPO DEL MODAL CON UN SOLO DESPLAZAMIENTO FLUIDO ──────── */}
          <div className="flex-1 overflow-y-auto px-3.5 sm:px-6 md:px-8 pt-4 sm:pt-6 pb-8 scrollbar-thin scrollbar-thumb-white/20 overscroll-contain">
            {/* SCOREBOARD EN MÓVIL (< lg) */}
            <div className="block lg:hidden mb-4">
              {scoreboardNode}
            </div>

            {/* SWITCHER DE PESTAÑAS EN MÓVIL (< lg) */}
            {currentLeagueSlug && (
              <div className="flex lg:hidden justify-center mb-4 shrink-0 px-1">
                <div className="grid grid-cols-2 p-1 bg-black/60 border border-white/10 rounded-2xl gap-1 w-full max-w-sm">
                  <button
                    onClick={() => setActiveTab('match')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer ${
                      activeTab === 'match'
                        ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5 shrink-0" />
                    <span>En Vivo & Stats</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('standings')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer ${
                      activeTab === 'standings'
                        ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Award className="w-3.5 h-3.5 shrink-0" />
                    <span>Clasificación</span>
                  </button>
                </div>
              </div>
            )}

            {/* ──────── GRID DE 2 COLUMNAS (PC) / CONTENIDO SEGÚN PESTAÑA (MÓVIL) ──────── */}
            <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">

              {/* ────── COLUMNA IZQUIERDA (7 COLS EN PC): MARCADOR, CRONOLOGÍA & ESTADÍSTICAS ────── */}
              <div className={`lg:col-span-7 space-y-5 sm:space-y-6 ${activeTab === 'match' ? 'block' : 'hidden lg:block'}`}>
                {/* MARCADOR EN PC (PARTE SUPERIOR IZQUIERDA) */}
                <div className="hidden lg:block">
                  {scoreboardNode}
                </div>

                {/* CRONOLOGÍA */}
                <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-3xl p-3.5 sm:p-6 relative overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <span className="text-[11px] font-black uppercase text-gray-300 tracking-wider flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                      Incidencias & Cronología
                    </span>
                    {isLive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-black uppercase tracking-wider">
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
                    <div className="py-8 text-center text-xs text-gray-500 italic">
                      No hay goles ni incidencias disciplinarias registradas todavía.
                    </div>
                  ) : (
                    <div className="relative py-2 sm:py-3">
                      {/* Eje Vertical Central */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent -translate-x-1/2 pointer-events-none" />

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
                                    className="flex items-center gap-1.5 sm:gap-2 text-right bg-gradient-to-l from-white/[0.08] to-transparent border-r-2 pr-2 sm:pr-3 py-1 sm:py-1.5 pl-1.5 sm:pl-2 rounded-l-xl transition-all group-hover:from-white/[0.12] max-w-full"
                                    style={{ borderRightColor: homeColor }}
                                  >
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[11px] sm:text-sm font-black text-white truncate">
                                        {playerTitle}
                                      </span>
                                      <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium leading-tight">
                                        {label}
                                      </span>
                                      {(evt.type === 'goal' || evt.type === 'penalty-goal') && (
                                        <Link
                                          href={`/catalogo?query=${encodeURIComponent(homeName)}`}
                                          className="inline-flex items-center gap-0.5 text-[8px] sm:text-[9px] text-amber-400/90 hover:text-amber-300 font-bold underline decoration-amber-500/40 hover:decoration-amber-400 mt-0.5"
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

                              {/* MINUTO CON PLENO PROTAGONISMO */}
                              <div className="z-10 px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-neutral-900/90 border border-white/25 text-[10px] sm:text-xs font-mono font-black text-white shadow-[0_0_15px_rgba(0,0,0,0.8)] tracking-tight shrink-0 text-center min-w-[2.2rem] sm:min-w-[3.4rem]">
                                {minuteDisplay}
                              </div>

                              {/* INCIDENCIA VISITANTE (DERECHA) */}
                              <div className="flex justify-start items-center min-w-0">
                                {!isHome ? (
                                  <div
                                    className="flex items-center gap-1.5 sm:gap-2 text-left bg-gradient-to-r from-white/[0.08] to-transparent border-l-2 pl-2 sm:pl-3 py-1 sm:py-1.5 pr-1.5 sm:pr-2 rounded-r-xl transition-all group-hover:to-white/[0.12] max-w-full"
                                    style={{ borderLeftColor: awayColor }}
                                  >
                                    <span className="text-sm sm:text-lg shrink-0 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                                      {icon}
                                    </span>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[11px] sm:text-sm font-black text-white truncate">
                                        {playerTitle}
                                      </span>
                                      <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium leading-tight">
                                        {label}
                                      </span>
                                      {(evt.type === 'goal' || evt.type === 'penalty-goal') && (
                                        <Link
                                          href={`/catalogo?query=${encodeURIComponent(awayName)}`}
                                          className="inline-flex items-center gap-0.5 text-[8px] sm:text-[9px] text-amber-400/90 hover:text-amber-300 font-bold underline decoration-amber-500/40 hover:decoration-amber-400 mt-0.5"
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

                {/* POSESIÓN DE BALÓN */}
                {activeMatch.stats?.possession && (
                  <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-3xl p-4 sm:p-5 space-y-3 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full border border-white/30"
                          style={{
                            backgroundColor: homeColor,
                            boxShadow: isHomeWhite ? "0 0 10px rgba(255, 255, 255, 0.8)" : `0 0 10px ${homeColor}`,
                          }}
                        />
                        <span className="text-xl sm:text-2xl font-black font-mono text-white">
                          {rawHomePoss}%
                        </span>
                        <span className="text-xs text-gray-300 font-bold hidden sm:inline">{homeName}</span>
                      </div>

                      <span className="text-xs uppercase tracking-widest text-gray-400 font-black">
                        Posesión
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-300 font-bold hidden sm:inline">{awayName}</span>
                        <span className="text-xl sm:text-2xl font-black font-mono text-white">
                          {rawAwayPoss}%
                        </span>
                        <span
                          className="w-3 h-3 rounded-full border border-white/30"
                          style={{
                            backgroundColor: awayColor,
                            boxShadow: isAwayWhite ? "0 0 10px rgba(255, 255, 255, 0.8)" : `0 0 10px ${awayColor}`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Barra de Posesión Bicolor */}
                    <div className="w-full h-3.5 bg-neutral-900 rounded-full overflow-hidden flex p-0.5 border border-white/15 shadow-inner">
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
                {activeMatch.stats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {activeMatch.stats.shotsOnTarget && (
                      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 text-center flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-black tracking-wider text-gray-400">
                          Tiros a Puerta
                        </span>
                        <div className="flex items-center justify-center gap-2 mt-1 text-lg font-mono font-black">
                          <span style={{ color: homeColor }}>{activeMatch.stats.shotsOnTarget.home}</span>
                          <span className="text-gray-600 text-xs">-</span>
                          <span style={{ color: awayColor }}>{activeMatch.stats.shotsOnTarget.away}</span>
                        </div>
                      </div>
                    )}

                    {activeMatch.stats.totalShots && (
                      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 text-center flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-black tracking-wider text-gray-400">
                          Tiros Totales
                        </span>
                        <div className="flex items-center justify-center gap-2 mt-1 text-lg font-mono font-black">
                          <span style={{ color: homeColor }}>{activeMatch.stats.totalShots.home}</span>
                          <span className="text-gray-600 text-xs">-</span>
                          <span style={{ color: awayColor }}>{activeMatch.stats.totalShots.away}</span>
                        </div>
                      </div>
                    )}

                    {activeMatch.stats.corners && (
                      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 text-center flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-black tracking-wider text-gray-400">
                          Córners
                        </span>
                        <div className="flex items-center justify-center gap-2 mt-1 text-lg font-mono font-black">
                          <span style={{ color: homeColor }}>{activeMatch.stats.corners.home}</span>
                          <span className="text-gray-600 text-xs">-</span>
                          <span style={{ color: awayColor }}>{activeMatch.stats.corners.away}</span>
                        </div>
                      </div>
                    )}

                    {activeMatch.stats.fouls && (
                      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 text-center flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-black tracking-wider text-gray-400">
                          Faltas
                        </span>
                        <div className="flex items-center justify-center gap-2 mt-1 text-lg font-mono font-black">
                          <span style={{ color: homeColor }}>{activeMatch.stats.fouls.home}</span>
                          <span className="text-gray-600 text-xs">-</span>
                          <span style={{ color: awayColor }}>{activeMatch.stats.fouls.away}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* BANNER COMERCIAL EN MÓVIL (CUANDO ESTÁ EN LA PESTAÑA DEL PARTIDO) */}
                <div className="block lg:hidden pt-2">
                  {commercialNode}
                </div>
              </div>

              {/* ────── COLUMNA DERECHA (5 COLS EN PC): TABLA DE CLASIFICACIÓN & CAMISETAS ────── */}
              <div className={`lg:col-span-5 space-y-6 ${activeTab === 'standings' ? 'block' : 'hidden lg:block'}`}>
                {/* TABLA DE POSICIONES (DESDE ARRIBA) */}
                <div className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs sm:text-sm font-black text-white tracking-wide">
                        {leagueData?.groupName || "Tabla de Posiciones"}
                      </h4>
                    </div>
                    {currentLeagueSlug && (
                      <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                        {currentLeagueSlug.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Selector de Grupos/Conferencias (ej: Conferencia Este / Oeste en MLS, Grupos UCL) */}
                  {currentGroups.length > 1 && (
                    <div className="flex flex-wrap gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/10">
                      {currentGroups.map((grp, idx) => (
                        <button
                          key={grp.name || idx}
                          onClick={() => setSelectedGroupIndex(idx)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            selectedGroupIndex === idx
                              ? "bg-red-600 text-white shadow-md shadow-red-600/30 font-black"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          {grp.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Tabla fluida sin scroll interno anidado */}
                  {loadingStandings ? (
                    <div className="py-16 flex flex-col items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-gray-400 font-medium">Cargando clasificación...</span>
                    </div>
                  ) : currentStandings.length === 0 ? (
                    <div className="py-12 text-center text-xs text-gray-500 italic">
                      No hay datos de clasificación disponibles para esta competición.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-white/15 text-[10px] text-gray-400 uppercase font-black">
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
                            const isMatchTeam =
                              row.teamName.toLowerCase().includes(homeName.toLowerCase()) ||
                              homeName.toLowerCase().includes(row.teamName.toLowerCase()) ||
                              row.teamName.toLowerCase().includes(awayName.toLowerCase()) ||
                              awayName.toLowerCase().includes(row.teamName.toLowerCase());

                            return (
                              <tr
                                key={row.teamName}
                                className={`transition-colors ${
                                  isMatchTeam
                                    ? "bg-red-600/15 font-bold text-white"
                                    : "hover:bg-white/[0.03] text-gray-300"
                                }`}
                              >
                                <td className="py-2.5 px-2 text-center font-mono text-xs">
                                  {row.rank > 0 ? (
                                    <span
                                      className={`inline-block w-5 h-5 leading-5 rounded-full text-[10px] ${
                                        row.rank <= 4
                                          ? "bg-blue-600/30 text-blue-400 font-black border border-blue-500/30"
                                          : row.rank <= 8
                                          ? "bg-amber-600/30 text-amber-400 font-bold border border-amber-500/30"
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
                                      alt={row.teamName}
                                      className="w-4 h-4 object-contain shrink-0"
                                    />
                                  )}
                                  <span className="truncate max-w-[140px] sm:max-w-[170px] text-xs">
                                    {row.teamName}
                                  </span>
                                </td>
                                <td className="py-2.5 px-2 text-center font-mono text-gray-400">
                                  {row.gamesPlayed}
                                </td>
                                <td className="py-2.5 px-2 text-center font-mono text-gray-400">
                                  {row.pointDifferential}
                                </td>
                                <td className="py-2.5 px-2 text-center font-mono font-black text-white">
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

                {/* BANNER COMERCIAL EN PC (DEBAJO DE LA TABLA DE CLASIFICACIÓN EN LA DERECHA) */}
                <div className="hidden lg:block">
                  {commercialNode}
                </div>

                {/* BANNER COMERCIAL EN MÓVIL (CUANDO ESTÁ EN LA PESTAÑA DE CLASIFICACIÓN) */}
                <div className="block lg:hidden pt-2">
                  {commercialNode}
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
