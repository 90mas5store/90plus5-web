'use client';

import { useState, useEffect, useCallback } from 'react';

const RECENT_KEY = '90plus5_recent_searches';
const MAX_RECENT = 6;

// Evita duplicar el mismo evento de búsqueda si se dispara primero en vivo (sin resultados) y luego con Enter
let lastTrackedSearch: { term: string; hasResults: boolean; timestamp: number } | null = null;

export function trackSearchAnalytics(term: string, resultsCount?: number) {
    if (typeof window === 'undefined' || !term.trim()) return;
    const cleanTerm = term.trim();
    const normalizedTerm = cleanTerm.toLowerCase();
    const hasResults = typeof resultsCount === 'number' ? resultsCount > 0 : true;
    const now = Date.now();

    if (
        lastTrackedSearch &&
        lastTrackedSearch.term === normalizedTerm &&
        lastTrackedSearch.hasResults === hasResults &&
        now - lastTrackedSearch.timestamp < 10000
    ) {
        return;
    }

    const win = window as unknown as { trackEvent?: (type: string, data: Record<string, unknown>) => void };
    if (win.trackEvent) {
        lastTrackedSearch = { term: normalizedTerm, hasResults, timestamp: now };
        win.trackEvent('search', {
            searchTerm: cleanTerm,
            resultsCount: typeof resultsCount === 'number' ? resultsCount : hasResults ? 1 : 0,
            has_results: hasResults,
        });
    }
}

function getStoredSearches(): string[] {
    if (typeof window === 'undefined') return [];
    try {
        return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    } catch {
        return [];
    }
}

export function useRecentSearches() {
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    useEffect(() => {
        setRecentSearches(getStoredSearches());
    }, []);

    const saveSearch = useCallback((term: string, resultsCount?: number) => {
        if (typeof window === 'undefined' || !term.trim()) return;
        const cleanTerm = term.trim();
        const current = getStoredSearches().filter(
            (s) => s.toLowerCase() !== cleanTerm.toLowerCase()
        );
        const updated = [cleanTerm, ...current].slice(0, MAX_RECENT);
        try {
            localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
            setRecentSearches(updated);
        } catch {
            // ignore localStorage quota errors
        }

        trackSearchAnalytics(cleanTerm, resultsCount);
    }, []);

    const removeSearch = useCallback((term: string) => {
        if (typeof window === 'undefined') return;
        const cleanTerm = term.trim().toLowerCase();
        const current = getStoredSearches().filter(
            (s) => s.toLowerCase() !== cleanTerm
        );
        try {
            localStorage.setItem(RECENT_KEY, JSON.stringify(current));
            setRecentSearches(current);
        } catch {
            // ignore
        }
    }, []);

    const clearSearches = useCallback(() => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.removeItem(RECENT_KEY);
            setRecentSearches([]);
        } catch {
            // ignore
        }
    }, []);

    return {
        recentSearches,
        saveSearch,
        removeSearch,
        clearSearches,
    };
}
