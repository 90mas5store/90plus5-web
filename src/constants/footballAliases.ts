import { DEFAULT_SEARCH_SETTINGS } from '@/lib/search/searchSettingsTypes';

export interface FootballAlias {
    alias: string;
    targetTeam: string;
    tags?: string[];
}

export interface QuickSearchChip {
    label: string;
    query: string;
    href: string;
}

/**
 * Fallback plano derivado de DEFAULT_SEARCH_SETTINGS (para compatibilidad legacy).
 * La fuente principal de verdad se administra en /admin/catalogo?tab=busqueda (store_settings).
 */
export const FOOTBALL_ALIASES: FootballAlias[] = DEFAULT_SEARCH_SETTINGS.aliases.flatMap((rule) =>
    rule.aliases.map((alias) => ({
        alias,
        targetTeam: rule.targetTeam,
    }))
);

export const QUICK_SEARCH_CHIPS: QuickSearchChip[] = DEFAULT_SEARCH_SETTINGS.quickChips.map(
    ({ label, query, href }) => ({ label, query, href })
);

