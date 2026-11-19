import { createAdminClient } from '@/lib/supabase/admin';
import {
    DEFAULT_SEARCH_SETTINGS,
    SEARCH_SETTINGS_KEY,
    SearchSettingsConfig,
    SearchAliasRule,
    SearchSynonymRule,
    QuickSearchChipConfig,
} from './searchSettingsTypes';

export * from './searchSettingsTypes';

interface CacheEntry {
    data: SearchSettingsConfig;
    timestamp: number;
}

let memoryCache: CacheEntry | null = null;
const CACHE_TTL_MS = 60 * 1000;

function sanitizeAliases(raw: unknown): SearchAliasRule[] {
    if (!Array.isArray(raw)) return DEFAULT_SEARCH_SETTINGS.aliases;

    const cleaned: SearchAliasRule[] = [];
    for (let i = 0; i < raw.length; i++) {
        const item = raw[i] as Partial<SearchAliasRule> | null;
        if (!item || typeof item.targetTeam !== 'string' || !item.targetTeam.trim()) continue;

        const aliasList = Array.isArray(item.aliases)
            ? Array.from(
                  new Set(
                      item.aliases
                          .map((a) => (typeof a === 'string' ? a.trim() : ''))
                          .filter((a) => a.length >= 2)
                  )
              )
            : [];

        cleaned.push({
            id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `alias-${i}`,
            targetTeam: item.targetTeam.trim(),
            aliases: aliasList,
            active: typeof item.active === 'boolean' ? item.active : true,
        });
    }

    return cleaned;
}

function sanitizeSynonyms(raw: unknown): SearchSynonymRule[] {
    if (!Array.isArray(raw)) return DEFAULT_SEARCH_SETTINGS.synonyms;

    const cleaned: SearchSynonymRule[] = [];
    for (let i = 0; i < raw.length; i++) {
        const item = raw[i] as Partial<SearchSynonymRule> | null;
        if (!item || typeof item.targetTerm !== 'string' || !item.targetTerm.trim()) continue;

        const synList = Array.isArray(item.synonyms)
            ? Array.from(
                  new Set(
                      item.synonyms
                          .map((s) => (typeof s === 'string' ? s.trim() : ''))
                          .filter((s) => s.length >= 2)
                  )
              )
            : [];

        cleaned.push({
            id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `syn-${i}`,
            targetTerm: item.targetTerm.trim(),
            synonyms: synList,
            active: typeof item.active === 'boolean' ? item.active : true,
        });
    }

    return cleaned;
}

function sanitizeQuickChips(raw: unknown): QuickSearchChipConfig[] {
    if (!Array.isArray(raw)) return DEFAULT_SEARCH_SETTINGS.quickChips;

    const cleaned: QuickSearchChipConfig[] = [];
    for (let i = 0; i < raw.length; i++) {
        const item = raw[i] as Partial<QuickSearchChipConfig> | null;
        if (!item || typeof item.label !== 'string' || !item.label.trim()) continue;
        if (typeof item.query !== 'string' || !item.query.trim()) continue;

        const safeHref =
            typeof item.href === 'string' && item.href.trim().startsWith('/')
                ? item.href.trim()
                : `/catalogo?query=${encodeURIComponent(item.query.trim())}`;

        cleaned.push({
            id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `chip-${i}`,
            label: item.label.trim(),
            query: item.query.trim(),
            href: safeHref,
            active: typeof item.active === 'boolean' ? item.active : true,
        });
    }

    return cleaned;
}

/**
 * Obtiene la configuración de alias, sinónimos y chips del buscador desde `store_settings`
 */
export async function getSearchSettings(): Promise<SearchSettingsConfig> {
    const now = Date.now();
    if (memoryCache && now - memoryCache.timestamp < CACHE_TTL_MS) {
        return memoryCache.data;
    }

    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('store_settings')
            .select('value')
            .eq('key', SEARCH_SETTINGS_KEY)
            .maybeSingle();

        if (error || !data?.value || typeof data.value !== 'object') {
            return DEFAULT_SEARCH_SETTINGS;
        }

        const val = data.value as Partial<SearchSettingsConfig>;
        const settings: SearchSettingsConfig = {
            aliases: Array.isArray(val.aliases) ? sanitizeAliases(val.aliases) : DEFAULT_SEARCH_SETTINGS.aliases,
            synonyms: Array.isArray(val.synonyms) ? sanitizeSynonyms(val.synonyms) : DEFAULT_SEARCH_SETTINGS.synonyms,
            quickChips: Array.isArray(val.quickChips)
                ? sanitizeQuickChips(val.quickChips)
                : DEFAULT_SEARCH_SETTINGS.quickChips,
        };

        memoryCache = { data: settings, timestamp: now };
        return settings;
    } catch (err) {
        console.error('[getSearchSettings] Error fetching search settings:', err);
        return DEFAULT_SEARCH_SETTINGS;
    }
}

export function invalidateSearchSettingsCache() {
    memoryCache = null;
}
