'use client';
import { useState, useEffect } from 'react';

export interface LiveMatchData {
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    minute: number | null;
    isHome: boolean; // true = nuestro equipo es local
    isManual?: boolean;
    leagueName?: string | null;
    isFinished?: boolean;
    isUpcoming?: boolean;
    startTime?: string | null;
    homeLogo?: string | null;
    awayLogo?: string | null;
    hasHomeTeamInDb?: boolean;
    hasAwayTeamInDb?: boolean;
}

const POLL_INTERVAL = 15 * 1000; // 15 segundos (actualización en tiempo real para cliente)

export function useLiveMatchesData(): { matches: Record<string, LiveMatchData>; isLoaded: boolean } {
    const [matches, setMatches] = useState<Record<string, LiveMatchData>>({});
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;

        async function fetchMatches() {
            try {
                const res = await fetch('/api/live-matches', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    setMatches(data);
                }
            } catch { /* silent */ } finally {
                setIsLoaded(true);
            }
            timer = setTimeout(fetchMatches, POLL_INTERVAL);
        }

        fetchMatches();
        return () => clearTimeout(timer);
    }, []);

    return { matches, isLoaded };
}

export function useLiveMatches(): Record<string, LiveMatchData> {
    const { matches } = useLiveMatchesData();
    return matches;
}
