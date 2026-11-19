export interface SearchAliasRule {
    id: string;
    targetTeam: string;
    aliases: string[];
    active: boolean;
}

export interface SearchSynonymRule {
    id: string;
    targetTerm: string;
    synonyms: string[];
    active: boolean;
}

export interface QuickSearchChipConfig {
    id: string;
    label: string;
    query: string;
    href: string;
    active: boolean;
}

export interface SearchSettingsConfig {
    aliases: SearchAliasRule[];
    synonyms: SearchSynonymRule[];
    quickChips: QuickSearchChipConfig[];
}

export const SEARCH_SETTINGS_KEY = 'search_settings';

/**
 * Configuración inicial por defecto (usada únicamente si aún no se ha guardado
 * configuración personalizada en `store_settings` desde /admin/catalogo).
 */
export const DEFAULT_SEARCH_SETTINGS: SearchSettingsConfig = {
    aliases: [
        { id: 'real-madrid', targetTeam: 'Real Madrid', aliases: ['merengues', 'blancos'], active: true },
        { id: 'barcelona', targetTeam: 'Barcelona', aliases: ['culers', 'cules', 'blaugrana', 'barza', 'barca'], active: true },
        { id: 'manchester-city', targetTeam: 'Manchester City', aliases: ['citizens', 'city'], active: true },
        { id: 'manchester-united', targetTeam: 'Manchester United', aliases: ['red devils', 'man u', 'united'], active: true },
        { id: 'arsenal', targetTeam: 'Arsenal', aliases: ['gunners'], active: true },
        { id: 'liverpool', targetTeam: 'Liverpool', aliases: ['reds'], active: true },
        { id: 'chelsea', targetTeam: 'Chelsea', aliases: ['blues'], active: true },
        { id: 'bayern-munich', targetTeam: 'Bayern Múnich', aliases: ['bavaro', 'bavaros', 'bayern'], active: true },
        { id: 'psg', targetTeam: 'PSG', aliases: ['paris saint germain', 'paris'], active: true },
        { id: 'olimpia', targetTeam: 'Olimpia', aliases: ['albos', 'leones', 'rey de copas'], active: true },
        { id: 'motagua', targetTeam: 'Motagua', aliases: ['ciclon', 'aguilas'], active: true },
        { id: 'america', targetTeam: 'América', aliases: ['aguilas', 'azulcremas'], active: true },
        { id: 'real-espana', targetTeam: 'Real España', aliases: ['aurinegros', 'maquina'], active: true },
        { id: 'marathon', targetTeam: 'Marathón', aliases: ['monstruo', 'verdolagas'], active: true },
        { id: 'al-nassr', targetTeam: 'Al Nassr', aliases: ['cr7'], active: true },
        { id: 'inter-miami', targetTeam: 'Inter Miami', aliases: ['garzas'], active: true },
    ],
    synonyms: [
        { id: 'syn-femenina', targetTerm: 'femenina', synonyms: ['dama', 'chica', 'women', 'ladies'], active: true },
        { id: 'syn-visitante', targetTerm: 'visitante', synonyms: ['away', 'visita'], active: true },
        { id: 'syn-local', targetTerm: 'local', synonyms: ['home'], active: true },
        { id: 'syn-ninos', targetTerm: 'ninos', synonyms: ['infantil', 'kids', 'junior'], active: true },
    ],
    quickChips: [
        { id: 'top-sellers', label: '🔥 Más Vendidas', query: 'más vendidas', href: '/catalogo?orden=top_sellers', active: true },
        { id: 'retro', label: '⏪ Edición Retro', query: 'retro', href: '/catalogo?categoria=retro', active: true },
        { id: 'champions', label: '🏆 Champions League', query: 'champions', href: '/catalogo?liga=champions-league', active: true },
        { id: 'manga-larga', label: '⚡ Manga Larga', query: 'manga larga', href: '/catalogo?query=manga%20larga', active: true },
        { id: 'ninos', label: '👶 Niños', query: 'niños', href: '/catalogo?categoria=ninos', active: true },
    ],
};
