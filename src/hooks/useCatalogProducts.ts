'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Product, Config, Category } from '@/lib/types';
import { getCatalogPaginated } from '@/lib/api';
import { CatalogFilters } from '@/components/catalogo/CatalogFilterPanel';
import { ToastHook } from '@/types/checkout';
import { ExtendedLeague } from './useCatalogMetadata';

const PRODUCTS_PER_PAGE = 24;

function extractSeasonYear(season: string): number {
    const match = season.match(/^(\d{4})/);
    return match ? parseInt(match[1], 10) : 0;
}

interface UseCatalogProductsProps {
    initialProducts?: Product[];
    initialTotal?: number;
    topSellerIds?: string[];
    queryParam: string | null;
    selectedCategoryObj: Category | null | undefined;
    selectedLeagueObj: ExtendedLeague | null | undefined;
    equipoSeleccionado: string | null;
    marcaSeleccionada: string | null;
    catalogFilters: CatalogFilters;
    config: Config | null;
    categoriaParam: string | null;
    ligaParam: string | null;
    toast: ToastHook;
}

export function useCatalogProducts({
    initialProducts = [],
    initialTotal = 0,
    topSellerIds = [],
    queryParam,
    selectedCategoryObj,
    selectedLeagueObj,
    equipoSeleccionado,
    marcaSeleccionada,
    catalogFilters,
    config,
    categoriaParam,
    ligaParam,
    toast,
}: UseCatalogProductsProps) {
    const [productos, setProductos] = useState<Product[]>(initialProducts);
    const [totalProducts, setTotalProducts] = useState(initialTotal);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(!initialProducts.length);
    const [loadingMore, setLoadingMore] = useState(false);

    const contentRef = useRef<HTMLDivElement>(null);
    const shouldScrollOnFilter = useRef(false);

    const [knownSeasons, setKnownSeasons] = useState<string[]>([]);

    useEffect(() => {
        if (initialProducts && initialProducts.length > 0) {
            const set = new Set<string>();
            initialProducts.forEach((p) => {
                if (p.season) set.add(p.season);
            });
            setKnownSeasons(Array.from(set));
        }
    }, [initialProducts]);

    useEffect(() => {
        if (productos.length > 0) {
            setKnownSeasons((prev) => {
                const set = new Set(prev);
                productos.forEach((p) => {
                    if (p.season) set.add(p.season);
                });
                return Array.from(set);
            });
        }
    }, [productos]);

    const availableSeasons = useMemo(() => {
        const seasons = new Set<string>(knownSeasons);
        productos.forEach((p) => {
            if (p.season) seasons.add(p.season);
        });
        return Array.from(seasons).sort((a, b) => extractSeasonYear(b) - extractSeasonYear(a));
    }, [knownSeasons, productos]);

    const fetchProducts = useCallback(
        async (pageNum: number, isAppend: boolean) => {
            if (!config && (categoriaParam || ligaParam)) return;

            if (config && categoriaParam && !selectedCategoryObj) {
                setProductos([]);
                setTotalProducts(0);
                setLoading(false);
                return;
            }

            try {
                if (!isAppend) setLoading(true);
                else setLoadingMore(true);

                let priceMin: number | undefined;
                let priceMax: number | undefined;
                if (catalogFilters.priceRange) {
                    const [min, max] = catalogFilters.priceRange.split('-').map(Number);
                    priceMin = min;
                    priceMax = max;
                }

                const { data, count } = await getCatalogPaginated({
                    page: pageNum,
                    limit: PRODUCTS_PER_PAGE,
                    query: queryParam || '',
                    categoryId: selectedCategoryObj?.id,
                    leagueId: selectedLeagueObj?.id,
                    teamId: equipoSeleccionado ?? undefined,
                    brandId: marcaSeleccionada ?? undefined,
                    gender: catalogFilters.gender ?? undefined,
                    season: catalogFilters.season ?? undefined,
                    sortBy: catalogFilters.sortBy,
                    priceMin,
                    priceMax,
                    topSellerIds,
                });

                if (isAppend) {
                    setProductos((prev) => [...prev, ...data]);
                } else {
                    setProductos(data);
                    if (shouldScrollOnFilter.current && contentRef.current) {
                        const yOffset = -85;
                        const element = contentRef.current;
                        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                        window.scrollTo({ top: y, behavior: 'smooth' });
                        shouldScrollOnFilter.current = false;
                    }
                }

                setTotalProducts(count);
            } catch (error) {
                console.error('Error cargando productos paginados:', error);
                toast.error('Error al cargar productos.');
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        },
        [
            queryParam,
            selectedCategoryObj,
            selectedLeagueObj,
            equipoSeleccionado,
            marcaSeleccionada,
            catalogFilters,
            toast,
            config,
            categoriaParam,
            ligaParam,
            topSellerIds,
        ]
    );

    useEffect(() => {
        setPage(1);
        fetchProducts(1, false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        queryParam,
        selectedCategoryObj,
        selectedLeagueObj,
        equipoSeleccionado,
        marcaSeleccionada,
        catalogFilters,
    ]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchProducts(nextPage, true);
    };

    return {
        productos,
        totalProducts,
        loading,
        loadingMore,
        contentRef,
        shouldScrollOnFilter,
        availableSeasons,
        handleLoadMore,
        setProductos,
    };
}
