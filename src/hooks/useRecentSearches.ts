'use client';

import { useState, useEffect, useCallback } from 'react';

const RECENT_KEY = '90plus5_recent_searches';
const MAX_RECENT = 6;

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

    const saveSearch = useCallback((term: string) => {
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

        if (
            typeof window !== 'undefined' &&
            (window as unknown as { trackEvent?: (type: string, data: Record<string, unknown>) => void }).trackEvent
        ) {
            (window as unknown as { trackEvent: (type: string, data: Record<string, unknown>) => void }).trackEvent('search', {
                searchTerm: cleanTerm,
            });
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
        clearSearches,
    };
}
