'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    getCatalog,
    getConfig,
    getSearchablePlayers,
    getSearchSettingsClient,
    SearchablePlayer,
} from '@/lib/api';
import { Product, Category, League } from '@/lib/types';
import { SearchResult, QuickClub } from '@/types/search';
import { useLiveMatches } from '@/hooks/useLiveMatches';
import { buildPlayerProductHref } from '@/lib/search/playerMatch';
import { buildSearchIndex, searchCatalog, SearchExecutionMeta } from '@/lib/search/searchEngine';
import {
    DEFAULT_SEARCH_SETTINGS,
    QuickSearchChipConfig,
    SearchSettingsConfig,
} from '@/lib/search/searchSettingsTypes';

// Caché a nivel de módulo para que los resultados sigan instantáneos entre montajes de SearchBar
let globalCatalog: Product[] | null = null;
let globalCategories: Category[] | null = null;
let globalLeagues: League[] | null = null;
let globalPlayers: SearchablePlayer[] | null = null;
let globalSearchSettings: SearchSettingsConfig | null = null;
let globalFetchPromise: Promise<void> | null = null;

export function resetSearchCatalogMemoryCache() {
    globalCatalog = null;
    globalCategories = null;
    globalLeagues = null;
    globalPlayers = null;
    globalSearchSettings = null;
    globalFetchPromise = null;
}

const EMPTY_META: SearchExecutionMeta = {
    matchQuality: 'empty',
    matchedTokens: [],
    unmatchedCatalogTokens: [],
    unmatchedUnknownTokens: [],
    correctedTerms: [],
    suggestedAlternative: null,
    anchorTerm: null,
};

export function useSearchCatalog(value: string, enableLiveResults: boolean = true) {
    const [catalog, setCatalog] = useState<Product[]>(() => globalCatalog || []);
    const [categories, setCategories] = useState<Category[]>(() => globalCategories || []);
    const [leagues, setLeagues] = useState<League[]>(() => globalLeagues || []);
    const [players, setPlayers] = useState<SearchablePlayer[]>(() => globalPlayers || []);
    const [searchSettings, setSearchSettings] = useState<SearchSettingsConfig>(
        () => globalSearchSettings || DEFAULT_SEARCH_SETTINGS
    );
    const [isLoaded, setIsLoaded] = useState(() => globalCatalog !== null);
    const [isLoading, setIsLoading] = useState(false);

    const liveMatches = useLiveMatches();

    // Carga perezosa compartida (catálogo + configuración + jugadores + alias administrados en /admin)
    const loadCatalogData = useCallback(() => {
        if (!enableLiveResults) return;

        const syncFromGlobals = () => {
            if (globalCatalog) setCatalog(globalCatalog);
            if (globalCategories) setCategories(globalCategories);
            if (globalLeagues) setLeagues(globalLeagues);
            if (globalPlayers) setPlayers(globalPlayers);
            if (globalSearchSettings) setSearchSettings(globalSearchSettings);
            setIsLoaded(true);
            setIsLoading(false);
        };

        if (globalCatalog && globalPlayers && globalSearchSettings) {
            Promise.resolve().then(syncFromGlobals);
            return;
        }

        if (globalFetchPromise) {
            Promise.resolve().then(() => setIsLoading(true));
            globalFetchPromise.then(syncFromGlobals);
            return;
        }

        const fetchCatalog = typeof getCatalog === 'function' ? getCatalog().catch(() => []) : Promise.resolve([]);
        const fetchConfig = typeof getConfig === 'function' ? getConfig().catch(() => null) : Promise.resolve(null);
        const fetchPlayers =
            typeof getSearchablePlayers === 'function' ? getSearchablePlayers().catch(() => []) : Promise.resolve([]);
        const fetchSettings =
            typeof getSearchSettingsClient === 'function'
                ? getSearchSettingsClient().catch(() => DEFAULT_SEARCH_SETTINGS)
                : Promise.resolve(DEFAULT_SEARCH_SETTINGS);

        Promise.resolve().then(() => setIsLoading(true));
        globalFetchPromise = Promise.all([fetchCatalog, fetchConfig, fetchPlayers, fetchSettings])
            .then(([catData, cfgData, playersData, settingsData]) => {
                globalCatalog = catData || [];
                globalCategories = cfgData?.categorias || [];
                globalLeagues = cfgData?.ligas || [];
                globalPlayers = playersData || [];
                globalSearchSettings = settingsData || DEFAULT_SEARCH_SETTINGS;
                syncFromGlobals();
            })
            .finally(() => {
                setIsLoading(false);
                globalFetchPromise = null;
            });
    }, [enableLiveResults]);

    useEffect(() => {
        if (!enableLiveResults) return;
        loadCatalogData();
    }, [enableLiveResults, loadCatalogData]);

    useEffect(() => {
        if (value && value.trim().length > 0 && !isLoaded) {
            loadCatalogData();
        }
    }, [value, isLoaded, loadCatalogData]);

    // Construir índice unificado una sola vez por carga de catálogo (<2ms para 150-1000 productos)
    const searchIndex = useMemo(
        () =>
            buildSearchIndex({
                products: catalog,
                categories,
                leagues,
                players,
                aliases: searchSettings.aliases,
                synonyms: searchSettings.synonyms,
            }),
        [catalog, categories, leagues, players, searchSettings.aliases, searchSettings.synonyms]
    );

    const quickChips = useMemo<QuickSearchChipConfig[]>(
        () => (searchSettings.quickChips || []).filter((c) => c.active !== false),
        [searchSettings.quickChips]
    );

    const trendingSuggestions = useMemo(() => {
        if (catalog.length === 0) return [];
        const teamCounts = new Map<string, number>();
        catalog.forEach((p) => {
            if (p.equipo) {
                teamCounts.set(p.equipo, (teamCounts.get(p.equipo) || 0) + 1);
            }
        });
        return Array.from(teamCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name]) => name);
    }, [catalog]);

    const allClubs = useMemo((): QuickClub[] => searchIndex.clubs.map((c) => c.item), [searchIndex]);
    const topClubs = useMemo(() => allClubs.slice(0, 10), [allClubs]);

    // Ejecutar motor de búsqueda unificado en tiempo real (<2ms)
    const searchExecution = useMemo(() => {
        if (!value || value.trim().length < 2 || !enableLiveResults) {
            return {
                results: [] as SearchResult[],
                totalProductMatches: 0,
                matchedClub: null as QuickClub | null,
                searchMeta: EMPTY_META,
            };
        }

        const output = searchCatalog(searchIndex, value, {
            productLimit: 6,
            categoryLimit: 2,
            leagueLimit: 2,
            playerLimit: 3,
        });

        const items: SearchResult[] = [];
        const catalogById = new Map<string, Product>();
        catalog.forEach((p) => catalogById.set(p.id, p));

        // 0. Jugadores coincidentes
        output.players.forEach((player) => {
            let representativeTeam = '';
            let representativeLogo: string | undefined;
            for (const pid of player.productIds) {
                const prod = catalogById.get(pid);
                if (prod?.equipo) {
                    representativeTeam = prod.equipo;
                    representativeLogo = prod.logoEquipo;
                    break;
                }
            }

            items.push({
                type: 'player',
                id: `player-${player.id}`,
                title: player.name,
                subtitle: player.number ? `#${player.number} · ${representativeTeam || 'Dorsal'}` : representativeTeam,
                playerName: player.name,
                playerNumber: player.number,
                teamName: representativeTeam,
                teamLogo: representativeLogo,
                productCount: player.productIds.length,
                href: `/catalogo?query=${encodeURIComponent(player.name)}`,
            });
        });

        // 1. Categorías coincidentes
        output.categories.forEach((c) => {
            items.push({
                type: 'category',
                id: `cat-${c.id}`,
                title: c.nombre,
                subtitle: 'Categoría',
                image: c.icon_url,
                href: `/catalogo?categoria=${encodeURIComponent(c.slug)}`,
            });
        });

        // 2. Ligas coincidentes
        output.leagues.forEach((l) => {
            items.push({
                type: 'league',
                id: `league-${l.id}`,
                title: l.nombre,
                subtitle: 'Liga',
                image: l.imagen,
                href: `/catalogo?liga=${encodeURIComponent(l.slug)}`,
            });
        });

        // 3. Productos coincidentes (ordenados por relevancia real)
        output.products.forEach(({ product: p, matchedPlayer }) => {
            const teamLive = p.team_id ? liveMatches[p.team_id] : null;
            let liveScore: string | undefined;
            let liveMinute: string | undefined;
            let isLive = false;
            let isUpcoming = false;
            let isFinished = false;

            if (teamLive) {
                if (teamLive.isUpcoming) {
                    isUpcoming = true;
                    liveScore = `vs ${teamLive.awayTeam}`;
                } else if (teamLive.isFinished) {
                    isFinished = true;
                    liveScore = `Final ${teamLive.homeScore} - ${teamLive.awayScore}`;
                } else {
                    isLive = true;
                    liveScore = `${teamLive.homeScore} - ${teamLive.awayScore}`;
                    liveMinute = teamLive.isHalftime
                        ? 'ET'
                        : teamLive.displayClock || (teamLive.minute ? `${teamLive.minute}'` : undefined);
                }
            }

            const href = matchedPlayer?.number
                ? buildPlayerProductHref(p.slug || p.id, matchedPlayer.number)
                : `/producto/${p.slug || p.id}`;

            const subtitle = matchedPlayer
                ? `${p.modelo} · Dorsal #${matchedPlayer.number} ${matchedPlayer.name}`
                : p.modelo;

            items.push({
                type: 'product',
                id: p.id,
                title: p.equipo,
                subtitle,
                image: p.imagen,
                price: p.precio,
                href,
                isLive,
                isUpcoming,
                isFinished,
                liveScore,
                liveMinute,
            });
        });

        return {
            results: items,
            totalProductMatches: output.totalProducts,
            matchedClub: output.matchedClub,
            searchMeta: output.meta,
        };
    }, [value, enableLiveResults, searchIndex, catalog, liveMatches]);

    return {
        catalog,
        categories,
        leagues,
        results: searchExecution.results,
        totalProductMatches: searchExecution.totalProductMatches,
        matchedClub: searchExecution.matchedClub,
        searchMeta: searchExecution.searchMeta,
        quickChips,
        trendingSuggestions,
        topClubs,
        allClubs,
        isLoaded,
        isLoading,
        loadCatalogData,
    };
}
