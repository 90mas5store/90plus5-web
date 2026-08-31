'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Config, Product } from '@/lib/types';

import CatalogFilterPanel, {
    CatalogFilters,
    DEFAULT_FILTERS,
} from '@/components/catalogo/CatalogFilterPanel';
import ActiveFilterChips from '@/components/catalogo/ActiveFilterChips';
import BrandFilterChips from '@/components/catalogo/BrandFilterChips';
import ProductGridSection from '@/components/catalogo/ProductGridSection';
import CategoryCarouselSection from '@/components/catalogo/CategoryCarouselSection';

import useToastMessage from '@/hooks/useToastMessage';
import { useLiveMatches } from '@/hooks/useLiveMatches';
import { usePrefetch, useProductPrefetch } from '@/hooks/usePrefetch';
import { usePrefersReducedMotion } from '@/hooks/useOptimization';
import { useCatalogUrlSync } from '@/hooks/useCatalogUrlSync';
import { useCatalogMetadata, normalizeText } from '@/hooks/useCatalogMetadata';
import { useCatalogProducts } from '@/hooks/useCatalogProducts';

const EquipoFilter = dynamic(() => import('@/components/catalogo/EquipoFilter'), {
    ssr: false,
});

const CatalogHeroContainer = dynamic(() => import('@/components/catalogo/CatalogHeroContainer'), {
    ssr: true,
    loading: () => <div className="h-[35dvh] md:h-[55dvh] w-full bg-neutral-900 animate-pulse mb-4" />,
});

interface CatalogoContentProps {
    initialConfig?: Config | null;
    initialProducts?: Product[];
    initialTotal?: number;
    topSellerIds?: string[];
}

export default function CatalogoContent({
    initialConfig = null,
    initialProducts = [],
    initialTotal = 0,
    topSellerIds = [],
}: CatalogoContentProps) {
    const {
        router,
        searchParams,
        categoriaParam,
        queryParam,
        ligaParam,
        equipoParam,
        marcaParam,
        temporadaParam,
        generoParam,
        precioParam,
        ordenParam,
        syncUrlWithFilters,
        clearAllFilters,
    } = useCatalogUrlSync();

    const liveMatches = useLiveMatches();
    const prefersReducedMotion = usePrefersReducedMotion();
    const toast = useToastMessage();

    // 1️⃣ Metadata: Ligas, Categorías, Equipos, Marcas y Carrusel
    const {
        config,
        ligas,
        ligaSeleccionada,
        setLigaSeleccionada,
        categoriaSeleccionada,
        setCategoriaSeleccionada,
        teams,
        categoryBrands,
        selectedCategoryObj,
        selectedLeagueObj,
        showGenderFilter,
        adjacentCategories,
        currentCarrusel,
    } = useCatalogMetadata({
        initialConfig,
        categoriaParam,
        ligaParam,
    });

    // 2️⃣ Estados locales de filtros
    const [equipoSeleccionado, setEquipoSeleccionado] = useState<string | null>(equipoParam || null);
    const [marcaSeleccionada, setMarcaSeleccionada] = useState<string | null>(marcaParam || null);
    const [catalogFilters, setCatalogFilters] = useState<CatalogFilters>({
        gender: generoParam || null,
        priceRange: precioParam || null,
        season: temporadaParam || null,
        sortBy: ordenParam || 'relevance',
    });

    // 3️⃣ Productos, Paginación y Fetching
    const {
        productos,
        totalProducts,
        loading,
        loadingMore,
        contentRef,
        shouldScrollOnFilter,
        availableSeasons,
        handleLoadMore,
    } = useCatalogProducts({
        initialProducts,
        initialTotal,
        topSellerIds,
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
    });

    // 🔄 Sincronización con búsqueda del header
    const prevQueryRef = useRef(queryParam);
    useEffect(() => {
        if (queryParam !== prevQueryRef.current) {
            prevQueryRef.current = queryParam;
            if (queryParam) {
                setLigaSeleccionada(null);
                setEquipoSeleccionado(null);
                setMarcaSeleccionada(null);
                setCatalogFilters(DEFAULT_FILTERS);

                const params = new URLSearchParams(searchParams.toString());
                if (params.has('liga')) {
                    params.delete('liga');
                    router.replace(`/catalogo?${params.toString()}`, { scroll: false });
                }
            }
        }
    }, [queryParam, searchParams, router, setLigaSeleccionada]);

    // 🔗 Helper para sincronizar estado con URL
    const handleSync = useCallback(
        (overrides?: Parameters<typeof syncUrlWithFilters>[1]) => {
            syncUrlWithFilters(
                {
                    categoria: categoriaSeleccionada,
                    liga: selectedLeagueObj?.slug || ligaSeleccionada,
                    equipo: equipoSeleccionado,
                    marca: marcaSeleccionada,
                    filters: catalogFilters,
                    query: queryParam,
                },
                overrides
            );
        },
        [
            syncUrlWithFilters,
            categoriaSeleccionada,
            selectedLeagueObj?.slug,
            ligaSeleccionada,
            equipoSeleccionado,
            marcaSeleccionada,
            catalogFilters,
            queryParam,
        ]
    );

    const handleSelectLeague = useCallback((leagueName: string) => {
        const nuevaLiga = ligaSeleccionada === leagueName ? null : leagueName;
        setLigaSeleccionada(nuevaLiga);
        if (nuevaLiga) {
            shouldScrollOnFilter.current = true;
        }
        const lObj = ligas.find((l) => normalizeText(l.nombre) === normalizeText(nuevaLiga));
        handleSync({ liga: lObj?.slug || nuevaLiga || null, equipo: null, marca: null });
    }, [ligaSeleccionada, setLigaSeleccionada, shouldScrollOnFilter, ligas, handleSync]);

    const handleSelectBrand = useCallback((brandName: string) => {
        const brand = categoryBrands.find((b) => b.name === brandName);
        const brandId = brand?.id ?? null;
        const newBrand = marcaSeleccionada === brandId ? null : brandId;
        setMarcaSeleccionada(newBrand);
        setEquipoSeleccionado(null);
        shouldScrollOnFilter.current = false;
        handleSync({ marca: newBrand, equipo: null });
    }, [categoryBrands, marcaSeleccionada, shouldScrollOnFilter, handleSync]);

    const handleClearAll = useCallback(() => {
        setLigaSeleccionada(null);
        setEquipoSeleccionado(null);
        setMarcaSeleccionada(null);
        setCatalogFilters(DEFAULT_FILTERS);
        clearAllFilters();
    }, [setLigaSeleccionada, clearAllFilters]);

    // 🚀 Prefetch
    usePrefetch();
    useProductPrefetch(productos.slice(0, 4));

    return (
        <main className="min-h-dvh bg-black text-white pb-24 relative overflow-hidden">
            {/* SEO: h1 semántico */}
            <h1 className="sr-only">
                {selectedCategoryObj?.nombre || ligaSeleccionada
                    ? `Camisetas de Fútbol — ${selectedCategoryObj?.nombre || ligaSeleccionada}`
                    : 'Catálogo de Camisetas de Fútbol en Honduras'}
            </h1>

            {/* HERO */}
            <CatalogHeroContainer
                categorySlug={categoriaSeleccionada}
                leagueSlug={ligaParam}
                categoryName={selectedCategoryObj?.nombre || ligaSeleccionada || undefined}
                adjacentCategories={adjacentCategories}
                prefersReducedMotion={prefersReducedMotion}
                imagePositionDesktop={
                    selectedCategoryObj?.hero_image_position_desktop ||
                    selectedLeagueObj?.hero_image_position_desktop
                }
                imagePositionMobile={
                    selectedCategoryObj?.hero_image_position_mobile ||
                    selectedLeagueObj?.hero_image_position_mobile
                }
            />

            {/* FILTROS AVANZADOS */}
            <div ref={contentRef} />
            <CatalogFilterPanel
                showGender={showGenderFilter}
                filters={catalogFilters}
                availableSeasons={availableSeasons}
                onFiltersChange={(newFilters) => {
                    setCatalogFilters(newFilters);
                    shouldScrollOnFilter.current = false;
                    handleSync({
                        temporada: newFilters.season,
                        genero: newFilters.gender,
                        precio: newFilters.priceRange,
                        orden: newFilters.sortBy,
                    });
                }}
            />

            {/* CARRUSEL DE LIGAS / MARCAS Y TÍTULO MÓVIL */}
            <CategoryCarouselSection
                currentCarrusel={currentCarrusel}
                selectedCategoryObj={selectedCategoryObj}
                ligaSeleccionada={ligaSeleccionada}
                marcaSeleccionada={marcaSeleccionada}
                categoryBrands={categoryBrands}
                onSelectLeague={handleSelectLeague}
                onSelectBrand={handleSelectBrand}
            />

            {/* FILTRO DE EQUIPOS */}
            {teams.length >= 2 && (
                <EquipoFilter
                    teams={teams}
                    selected={equipoSeleccionado}
                    onSelect={(id) => {
                        const newEq = equipoSeleccionado === id ? null : id;
                        setEquipoSeleccionado(newEq);
                        setMarcaSeleccionada(null);
                        shouldScrollOnFilter.current = false;
                        handleSync({ equipo: newEq, marca: null });
                    }}
                    leagueName={ligaSeleccionada ?? undefined}
                />
            )}

            {/* FILTRO DE MARCAS (Píldoras) */}
            {!ligaSeleccionada && currentCarrusel?.type !== 'brand' && (
                <BrandFilterChips
                    brands={categoryBrands}
                    selectedBrandId={marcaSeleccionada}
                    onSelectBrand={(newBrand) => {
                        setMarcaSeleccionada(newBrand);
                        setEquipoSeleccionado(null);
                        handleSync({ marca: newBrand, equipo: null });
                    }}
                />
            )}

            {/* BARRA DE FILTROS ACTIVOS (1-CLIC) */}
            <ActiveFilterChips
                queryParam={queryParam}
                categoryName={selectedCategoryObj?.nombre}
                leagueName={selectedLeagueObj?.nombre}
                teamName={teams.find((t) => t.id === equipoSeleccionado)?.name || equipoSeleccionado}
                brandName={categoryBrands.find((b) => b.id === marcaSeleccionada)?.name || marcaSeleccionada}
                filters={catalogFilters}
                onRemoveQuery={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete('query');
                    params.delete('q');
                    router.replace(params.toString() ? `/catalogo?${params.toString()}` : '/catalogo', { scroll: false });
                }}
                onRemoveCategory={() => {
                    setCategoriaSeleccionada(null);
                    handleSync({ categoria: null });
                }}
                onRemoveLeague={() => {
                    setLigaSeleccionada(null);
                    handleSync({ liga: null });
                }}
                onRemoveTeam={() => {
                    setEquipoSeleccionado(null);
                    handleSync({ equipo: null });
                }}
                onRemoveBrand={() => {
                    setMarcaSeleccionada(null);
                    handleSync({ marca: null });
                }}
                onRemoveSeason={() => {
                    const newF = { ...catalogFilters, season: null };
                    setCatalogFilters(newF);
                    handleSync({ temporada: null });
                }}
                onRemoveGender={() => {
                    const newF = { ...catalogFilters, gender: null };
                    setCatalogFilters(newF);
                    handleSync({ genero: null });
                }}
                onRemovePrice={() => {
                    const newF = { ...catalogFilters, priceRange: null };
                    setCatalogFilters(newF);
                    handleSync({ precio: null });
                }}
                onRemoveSort={() => {
                    const newF = { ...catalogFilters, sortBy: 'relevance' as const };
                    setCatalogFilters(newF);
                    handleSync({ orden: 'relevance' });
                }}
                onClearAll={handleClearAll}
            />

            {/* GRID DE PRODUCTOS */}
            <ProductGridSection
                loading={loading}
                loadingMore={loadingMore}
                productos={productos}
                totalProducts={totalProducts}
                topSellerIds={topSellerIds}
                liveMatches={liveMatches}
                onPersonalizar={() => toast.loading('Abriendo personalización...')}
                onClearFilters={handleClearAll}
                onLoadMore={handleLoadMore}
            />
        </main>
    );
}
