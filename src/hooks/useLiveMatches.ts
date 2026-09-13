'use client';
import { useState, useEffect, useRef } from 'react';

export type MatchEventType =
  | 'goal'
  | 'penalty-goal'
  | 'penalty-miss'
  | 'own-goal'
  | 'disallowed-goal'
  | 'var'
  | 'yellow-card'
  | 'red-card'
  | 'sub';

export interface MatchEventDetail {
  id: string;
  type: MatchEventType;
  minute: string; // ej: "34'"
  text: string;
  teamId?: string;
  isHome: boolean;
  playerName: string;
  playerShortName?: string;
  jersey?: string;
}

export interface MatchStats {
  possession?: { home: string; away: string }; // ej: { home: "54", away: "46" }
  shotsOnTarget?: { home: string; away: string };
  totalShots?: { home: string; away: string };
  fouls?: { home: string; away: string };
  corners?: { home: string; away: string };
}

export interface LiveMatchData {
  homeTeam: string;              // Nombre completo broadcast (ej. "Club Deportivo Olimpia")
  awayTeam: string;
  homeShortTeam?: string;        // Nombre corto para móvil (ej. "Olimpia")
  awayShortTeam?: string;
  homeAbbr?: string;             // Abreviatura 3 letras (ej. "OLI")
  awayAbbr?: string;             // (ej. "PLA")
  homeTeamDbName?: string | null;// Nombre comercial en BD (ej. "CD Olimpia")
  awayTeamDbName?: string | null;
  homeScore: number;
  awayScore: number;
  minute: number | null;
  displayClock?: string | null;  // Tiempo formateado con añadido (ej. "45+11'", "90+7'", "34'")
  isHalftime?: boolean;          // Indica si el partido está en entretiempo / medio tiempo
  isHome: boolean;
  isManual?: boolean;
  leagueName?: string | null;
  isFinished?: boolean;
  isUpcoming?: boolean;
  startTime?: string | null;
  homeLogo?: string | null;
  awayLogo?: string | null;
  hasHomeTeamInDb?: boolean;
  hasAwayTeamInDb?: boolean;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  // Enriquecimiento con ESPN API:
  homeColor?: string | null;
  awayColor?: string | null;
  homeAltColor?: string | null;
  awayAltColor?: string | null;
  venueName?: string | null;
  venueCity?: string | null;
  leagueSlug?: string | null;
  events?: MatchEventDetail[];
  stats?: MatchStats;
}

// Alineado con el TTL de Redis en el servidor (30s)
const POLL_INTERVAL = 30 * 1000;

// Backoff exponencial en caso de error: 5s, 10s, 20s, 40s, tope 60s
function getBackoffDelay(attempt: number): number {
  return Math.min(5000 * Math.pow(2, attempt), 60_000);
}

export interface LiveGoalAlert {
  id: string;
  scoringTeam: string;
  scoringTeamLogo?: string | null;
  scoringTeamColor?: string | null;
  scoringPlayer?: string;
  jersey?: string;
  minute?: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeLogo?: string | null;
  awayLogo?: string | null;
  matchData: LiveMatchData;
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLETON GLOBAL POLLER & SUBSCRIBERS
// ─────────────────────────────────────────────────────────────────────────────
let globalMatches: Record<string, LiveMatchData> = {};
let globalIsLoaded = false;
let globalError: string | null = null;
let globalTimer: ReturnType<typeof setTimeout> | null = null;
let globalFailCount = 0;
let isPollingActive = false;
const subscribers = new Set<() => void>();
const dispatchedGoalIds = new Set<string>();
let prevGlobalMatches: Record<string, LiveMatchData> | null = null;

function notifySubscribers() {
  subscribers.forEach(cb => {
    try {
      cb();
    } catch {}
  });
}

async function globalFetchMatches() {
  if (typeof document !== 'undefined' && document.hidden) {
    return;
  }

  try {
    const res = await fetch('/api/live-matches', {
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data: Record<string, LiveMatchData> = await res.json();

    // ── Detección de Goles con Deduplicación Absoluta ──
    if (prevGlobalMatches && typeof window !== 'undefined') {
      const prevMap = prevGlobalMatches;
      const seenFixtures = new Set<string>();

      for (const match of Object.values(data)) {
        const fixtureKey = [match.homeTeam, match.awayTeam].map(s => s.toLowerCase().trim()).sort().join(' vs ');
        if (seenFixtures.has(fixtureKey)) continue;
        seenFixtures.add(fixtureKey);

        const prevMatch = Object.values(prevMap).find(
          pm => [pm.homeTeam, pm.awayTeam].map(s => s.toLowerCase().trim()).sort().join(' vs ') === fixtureKey
        );

        if (prevMatch && (!match.isFinished || !prevMatch.isFinished)) {
          const homeScored = match.homeScore > prevMatch.homeScore;
          const awayScored = match.awayScore > prevMatch.awayScore;

          if (homeScored || awayScored) {
            const isHome = homeScored;
            const scoringTeam = isHome ? match.homeTeam : match.awayTeam;
            const scoringTeamLogo = isHome ? match.homeLogo : match.awayLogo;
            const scoringTeamColor = isHome ? match.homeColor : match.awayColor;

            // ID determinista sin Date.now() para deduplicación exacta
            const goalId = `goal-${fixtureKey.replace(/\s+/g, '_')}-H${match.homeScore}-A${match.awayScore}`;

            if (!dispatchedGoalIds.has(goalId)) {
              dispatchedGoalIds.add(goalId);

              const teamGoalEvents = (match.events || []).filter(
                e => (e.type === 'goal' || e.type === 'penalty-goal') && e.isHome === isHome
              );
              const latestGoal = teamGoalEvents[teamGoalEvents.length - 1];

              const goalAlert: LiveGoalAlert = {
                id: goalId,
                scoringTeam,
                scoringTeamLogo,
                scoringTeamColor,
                scoringPlayer: latestGoal?.playerName || (isHome ? match.homeShortTeam : match.awayShortTeam) || scoringTeam,
                jersey: latestGoal?.jersey,
                minute: latestGoal?.minute || match.displayClock || (match.minute ? `${match.minute}'` : undefined),
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
                homeScore: match.homeScore,
                awayScore: match.awayScore,
                homeLogo: match.homeLogo,
                awayLogo: match.awayLogo,
                matchData: match,
              };

              window.dispatchEvent(new CustomEvent('matchday:goal', { detail: goalAlert }));
            }
          }
        }
      }
    }

    prevGlobalMatches = data;
    globalMatches = data;
    globalIsLoaded = true;
    globalError = null;
    globalFailCount = 0;
    notifySubscribers();

    if (typeof document === 'undefined' || !document.hidden) {
      if (globalTimer) clearTimeout(globalTimer);
      globalTimer = setTimeout(globalFetchMatches, POLL_INTERVAL);
    }
  } catch (err: any) {
    const isAbort = err?.name === 'AbortError' || err?.name === 'TimeoutError';
    if (!isAbort) {
      console.warn('[useLiveMatches] fetch error:', err?.message ?? err);
    }

    globalFailCount += 1;
    globalError = err?.message ?? 'Error desconocido';
    globalIsLoaded = true;
    notifySubscribers();

    const delay = getBackoffDelay(globalFailCount - 1);
    if (typeof document === 'undefined' || !document.hidden) {
      if (globalTimer) clearTimeout(globalTimer);
      globalTimer = setTimeout(globalFetchMatches, delay);
    }
  }
}

function startGlobalPolling() {
  if (isPollingActive) return;
  isPollingActive = true;

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (globalTimer) {
          clearTimeout(globalTimer);
          globalTimer = null;
        }
      } else {
        if (globalTimer) clearTimeout(globalTimer);
        globalFetchMatches();
      }
    });
  }

  globalFetchMatches();
}

export function useLiveMatchesData(): {
  matches: Record<string, LiveMatchData>;
  isLoaded: boolean;
  error: string | null;
} {
  const [, setTick] = useState(0);

  useEffect(() => {
    startGlobalPolling();
    const update = () => setTick(t => t + 1);
    subscribers.add(update);
    return () => {
      subscribers.delete(update);
    };
  }, []);

  return {
    matches: globalMatches,
    isLoaded: globalIsLoaded,
    error: globalError,
  };
}

export function useLiveMatches(): Record<string, LiveMatchData> {
  const { matches } = useLiveMatchesData();
  return matches;
}
