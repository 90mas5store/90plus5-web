import { createAdminClient } from '@/lib/supabase/admin';
import { SITE_CONFIG } from '@/lib/config/site';

export interface SeasonSettings {
    season: string;
    seasonShort: string;
    badge: string;
    title: string;
    subtitle: string;
    buttonText: string;
}

export const DEFAULT_SEASON_SETTINGS: SeasonSettings = {
    season: SITE_CONFIG.currentSeason,
    seasonShort: SITE_CONFIG.currentSeasonShort,
    badge: 'NOVEDADES',
    title: `Equipaciones ${SITE_CONFIG.currentSeason}`,
    subtitle: 'Versión Jugador y Aficionado bajo pedido con personalización oficial.',
    buttonText: 'Explorar Catálogo',
};

interface CacheEntry {
    data: SeasonSettings;
    timestamp: number;
}

let memoryCache: CacheEntry | null = null;
const CACHE_TTL_MS = 60 * 1000; // 1 minuto en memoria

export async function getSeasonSettings(): Promise<SeasonSettings> {
    const now = Date.now();
    if (memoryCache && now - memoryCache.timestamp < CACHE_TTL_MS) {
        return memoryCache.data;
    }

    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('store_settings')
            .select('*')
            .eq('key', 'current_season')
            .maybeSingle();

        if (error || !data?.value) {
            return DEFAULT_SEASON_SETTINGS;
        }

        const val = data.value as Record<string, unknown>;
        const season = typeof val.season === 'string' && val.season.trim() ? val.season.trim() : DEFAULT_SEASON_SETTINGS.season;
        const seasonShort = typeof val.seasonShort === 'string' && val.seasonShort.trim()
            ? val.seasonShort.trim()
            : season.replace(/^20(\d{2})[\/\-_](\d{2})$/, '$1/$2');

        const settings: SeasonSettings = {
            season,
            seasonShort,
            badge: typeof val.badge === 'string' && val.badge.trim() ? val.badge.trim() : DEFAULT_SEASON_SETTINGS.badge,
            title: typeof val.title === 'string' && val.title.trim() ? val.title.trim() : `Equipaciones ${season}`,
            subtitle: typeof val.subtitle === 'string' && val.subtitle.trim() ? val.subtitle.trim() : DEFAULT_SEASON_SETTINGS.subtitle,
            buttonText: typeof val.buttonText === 'string' && val.buttonText.trim() ? val.buttonText.trim() : DEFAULT_SEASON_SETTINGS.buttonText,
        };

        memoryCache = { data: settings, timestamp: now };
        return settings;
    } catch (err) {
        console.error('[getSeasonSettings] Error fetching settings:', err);
        return DEFAULT_SEASON_SETTINGS;
    }
}

export function invalidateSeasonSettingsCache() {
    memoryCache = null;
}
