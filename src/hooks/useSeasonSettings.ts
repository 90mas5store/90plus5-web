'use client';

import { useState, useEffect } from 'react';
import { SITE_CONFIG } from '@/lib/config/site';

export interface SeasonSettingsState {
    season: string;
    seasonShort: string;
    badge: string;
    title: string;
    subtitle: string;
    buttonText: string;
}

const INITIAL_STATE: SeasonSettingsState = {
    season: SITE_CONFIG.currentSeason,
    seasonShort: SITE_CONFIG.currentSeasonShort,
    badge: 'NOVEDADES',
    title: `Equipaciones ${SITE_CONFIG.currentSeason}`,
    subtitle: 'Versión Jugador y Aficionado bajo pedido con personalización oficial.',
    buttonText: 'Explorar Catálogo',
};

// Caché en memoria para evitar fetches repetidos durante navegación SPA
let globalSeasonCache: SeasonSettingsState | null = null;

export function useSeasonSettings() {
    const [settings, setSettings] = useState<SeasonSettingsState>(globalSeasonCache || INITIAL_STATE);

    useEffect(() => {
        if (globalSeasonCache) {
            setSettings(globalSeasonCache);
            return;
        }

        let isMounted = true;
        fetch('/api/season')
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch season');
                return res.json();
            })
            .then((data: Partial<SeasonSettingsState>) => {
                if (!isMounted) return;
                const newSettings: SeasonSettingsState = {
                    season: data.season || INITIAL_STATE.season,
                    seasonShort: data.seasonShort || INITIAL_STATE.seasonShort,
                    badge: data.badge || INITIAL_STATE.badge,
                    title: data.title || INITIAL_STATE.title,
                    subtitle: data.subtitle || INITIAL_STATE.subtitle,
                    buttonText: data.buttonText || INITIAL_STATE.buttonText,
                };
                globalSeasonCache = newSettings;
                setSettings(newSettings);
            })
            .catch(() => {
                // Silencioso, fallback ya cargado
            });

        return () => {
            isMounted = false;
        };
    }, []);

    return settings;
}
