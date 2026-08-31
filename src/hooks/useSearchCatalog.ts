'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { getCatalog, getConfig } from '@/lib/api';
import { Product, Category, League } from '@/lib/types';
import { SearchResult, QuickClub } from '@/types/search';
import { FOOTBALL_ALIASES } from '@/constants/footballAliases';
import { useLiveMatches } from '@/hooks/useLiveMatches';

const normalize = (s: string) =>
    (s || '')
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');

export function useSearchCatalog(value: string, enableLiveResults: boolean = true) {
    const [catalog, setCatalog] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [leagues, setLeagues] = useState<League[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const loadedRef = useRef(false);

    const liveMatches = useLiveMatches();

    // Lazy load catalog and metadata
    const loadCatalogData = useCallback(() => {
        if (loadedRef.current || !enableLiveResults) return;
        loadedRef.current = true;
        setIsLoading(true);

        Promise.all([
            getCatalog().catch(() => []),
            getConfig().catch(() => null),
        ])
            .then(([catData, cfgData]) => {
                setCatalog(catData || []);
                if (cfgData) {
                    setCategories(cfgData.categorias || []);
                    setLeagues(cfgData.ligas || []);
                }
                setIsLoaded(true);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [enableLiveResults]);

    // Preload on idle
    useEffect(() => {
        if (!enableLiveResults) return;
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            const handle = (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(
                () => {
                    loadCatalogData();
                },
                { timeout: 3000 }
            );
            return () => {
                if ('cancelIdleCallback' in window) {
                    (window as unknown as { cancelIdleCallback: (h: number) => void }).cancelIdleCallback(handle);
                }
            };
        } else {
            const timer = setTimeout(loadCatalogData, 1500);
            return () => clearTimeout(timer);
        }
    }, [enableLiveResults, loadCatalogData]);

    // Dynamic Trending suggestions
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

    // Top Clubs for quick crest bar
    const topClubs = useMemo((): QuickClub[] => {
        if (catalog.length === 0) return [];
        const clubMap = new Map<string, { count: number; logoUrl?: string }>();
        catalog.forEach((p) => {
            if (p.equipo && p.equipo !== 'Sin equipo') {
                const prev = clubMap.get(p.equipo) || { count: 0, logoUrl: p.logoEquipo };
                clubMap.set(p.equipo, { count: prev.count + 1, logoUrl: p.logoEquipo || prev.logoUrl });
            }
        });

        return Array.from(clubMap.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 8)
            .map(([name, data]) => ({
                name,
                logoUrl: data.logoUrl,
                query: name,
            }));
    }, [catalog]);

    // Intelligent Search Matching with Aliases, Categories, Leagues & Live Matches
    const results = useMemo((): SearchResult[] => {
        if (!value || value.trim().length < 2 || !enableLiveResults) return [];
        const q = normalize(value.trim());
        const items: SearchResult[] = [];

        // Check if query matches any football alias (e.g. "merengues", "vini" -> target: "Real Madrid")
        const matchingAliases = FOOTBALL_ALIASES.filter(
            (a) => normalize(a.alias).startsWith(q) || q.startsWith(normalize(a.alias))
        );
        const targetTeamFromAlias = matchingAliases.length > 0 ? matchingAliases[0].targetTeam : null;

        const matchesQuery = (text: string | null | undefined) => {
            if (!text) return false;
            const normalized = normalize(text);
            if (normalized.startsWith(q) || normalized.includes(q)) return true;
            const words = normalized.split(/\s+/);
            return words.some((word) => word.startsWith(q));
        };

        const isFeaturedSearch =
            q === 'featured' ||
            q.includes('mas vendid') ||
            q.includes('más vendid') ||
            q.includes('populares') ||
            q.includes('destacad') ||
            q.includes('top seller') ||
            q.includes('top');

        const isRetroSearch =
            q.includes('retro') ||
            q.includes('vintage') ||
            q.includes('clasic') ||
            q.includes('clasico');

        // 1. Categories Matching
        const matchingCategories = categories.filter(
            (c) => matchesQuery(c.nombre) || matchesQuery(c.slug) || (isRetroSearch && normalize(c.slug).includes('retro'))
        );
        const matchingCategoryIds = new Set(matchingCategories.map((c) => c.id));

        matchingCategories.slice(0, 2).forEach((c) => {
            items.push({
                type: 'category',
                id: `cat-${c.id}`,
                title: c.nombre,
                subtitle: 'Categoría',
                image: c.icon_url,
                href: `/catalogo?categoria=${encodeURIComponent(c.slug)}`,
            });
        });

        // 2. Leagues Matching
        const matchingLeagues = leagues.filter(
            (l) => matchesQuery(l.nombre) || matchesQuery(l.slug)
        );
        const matchingLeagueIds = new Set(matchingLeagues.map((l) => l.id));

        matchingLeagues.slice(0, 2).forEach((l) => {
            items.push({
                type: 'league',
                id: `league-${l.id}`,
                title: l.nombre,
                subtitle: 'Liga',
                image: l.imagen,
                href: `/catalogo?liga=${encodeURIComponent(l.slug)}`,
            });
        });

        // 3. Products Matching (Enhanced with categories, leagues, aliases & special chips)
        catalog
            .filter((p) => {
                // Caso: Búsqueda de Más Vendidas / Destacados
                if (isFeaturedSearch && p.destacado) return true;

                // Caso: Búsqueda Retro (por categoría o por temporada antigua)
                if (isRetroSearch) {
                    if (p.category_id && matchingCategoryIds.has(p.category_id)) return true;
                    if (
                        p.season &&
                        (p.season.startsWith('19') ||
                            p.season.startsWith('200') ||
                            p.season.startsWith('201') ||
                            normalize(p.season).includes('retro'))
                    ) {
                        return true;
                    }
                    if (matchesQuery(p.modelo) || matchesQuery(p.equipo)) return true;
                }

                // Match por Categoría o Liga vinculada
                if (p.category_id && matchingCategoryIds.has(p.category_id)) return true;
                if (p.league_id && matchingLeagueIds.has(p.league_id)) return true;
                if (p.league_ids && p.league_ids.some((lid) => matchingLeagueIds.has(lid))) return true;

                // Match por Equipo o Modelo
                if (matchesQuery(p.equipo) || matchesQuery(p.modelo)) return true;

                // Match por Alias Futbolístico (ej: "merengues", "vini" -> Real Madrid)
                if (
                    targetTeamFromAlias &&
                    normalize(p.equipo).includes(normalize(targetTeamFromAlias))
                ) {
                    return true;
                }

                // Match por Marca o Temporada
                if (p.brand_name && matchesQuery(p.brand_name)) return true;
                if (p.season && matchesQuery(p.season)) return true;

                return false;
            })
            .slice(0, 6)
            .forEach((p) => {
                // Live Match Info
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
                        liveMinute = teamLive.minute ? `${teamLive.minute}'` : undefined;
                    }
                }

                items.push({
                    type: 'product',
                    id: p.id,
                    title: p.equipo,
                    subtitle: p.modelo,
                    image: p.imagen,
                    price: p.precio,
                    href: `/producto/${p.slug || p.id}`,
                    isLive,
                    isUpcoming,
                    isFinished,
                    liveScore,
                    liveMinute,
                });
            });

        return items;
    }, [value, catalog, categories, leagues, enableLiveResults, liveMatches]);

    return {
        catalog,
        categories,
        leagues,
        results,
        trendingSuggestions,
        topClubs,
        isLoaded,
        isLoading,
        loadCatalogData,
    };
}
