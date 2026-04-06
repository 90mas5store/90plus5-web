'use client';
import { useState, useEffect } from 'react';

export interface LiveMatchData {
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    minute: number | null;
    isHome: boolean; // true = nuestro equipo es local
}

const POLL_INTERVAL = 2 * 60 * 1000; // 2 min

export function useLiveMatches(): Record<string, LiveMatchData> {
    const [matches, setMatches] = useState<Record<string, LiveMatchData>>({});

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;

        async function fetchMatches() {
            try {
                const res = await fetch('/api/live-matches');
                if (res.ok) {
                    const data = await res.json();
                    setMatches(data);
                }
            } catch { /* silent */ }
            timer = setTimeout(fetchMatches, POLL_INTERVAL);
        }

        fetchMatches();
        return () => clearTimeout(timer);
    }, []);

    return matches;
}
