'use client';
import { useState, useEffect, useRef } from 'react';

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
}

// Alineado con el TTL de Redis en el servidor (30s)
const POLL_INTERVAL = 30 * 1000;

// Backoff exponencial en caso de error: 5s, 10s, 20s, 40s, tope 60s
function getBackoffDelay(attempt: number): number {
  return Math.min(5000 * Math.pow(2, attempt), 60_000);
}

export function useLiveMatchesData(): {
  matches: Record<string, LiveMatchData>;
  isLoaded: boolean;
  error: string | null;
} {
  const [matches, setMatches] = useState<Record<string, LiveMatchData>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const failCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    async function fetchMatches() {
      try {
        const res = await fetch('/api/live-matches', {
          cache: 'no-store',
          signal: AbortSignal.timeout(20_000),
        });

        if (!isMountedRef.current) return;

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        setMatches(data);
        setError(null);
        failCountRef.current = 0;

        // Reanudar polling normal tras éxito
        timerRef.current = setTimeout(fetchMatches, POLL_INTERVAL);
      } catch (err: any) {
        if (!isMountedRef.current) return;

        const isAbort = err?.name === 'AbortError' || err?.name === 'TimeoutError';
        if (!isAbort) {
          console.warn('[useLiveMatches] fetch error:', err?.message ?? err);
        }

        setError(err?.message ?? 'Error desconocido');
        failCountRef.current += 1;

        // Backoff exponencial: no saturar el servidor en caso de error persistente
        const delay = getBackoffDelay(failCountRef.current - 1);
        timerRef.current = setTimeout(fetchMatches, delay);
      } finally {
        if (isMountedRef.current) {
          setIsLoaded(true);
        }
      }
    }

    fetchMatches();

    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { matches, isLoaded, error };
}

export function useLiveMatches(): Record<string, LiveMatchData> {
  const { matches } = useLiveMatchesData();
  return matches;
}
