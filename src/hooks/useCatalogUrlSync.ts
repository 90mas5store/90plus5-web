'use client';

import { useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SortOption, CatalogFilters } from '@/components/catalogo/CatalogFilterPanel';

export function useCatalogUrlSync() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const categoriaParam = searchParams.get('categoria') || searchParams.get('category');
    const queryParam = searchParams.get('query') || searchParams.get('q');
    const ligaParam = searchParams.get('liga') || searchParams.get('league');
    const equipoParam = searchParams.get('equipo') || searchParams.get('team');
    const marcaParam = searchParams.get('marca') || searchParams.get('brand');
    const temporadaParam = searchParams.get('temporada') || searchParams.get('season');
    const generoParam = searchParams.get('genero') || searchParams.get('gender');
    const precioParam = searchParams.get('precio') || searchParams.get('price');
    const ordenParam = (searchParams.get('orden') || searchParams.get('sortBy') || searchParams.get('sort')) as SortOption | null;

    const syncUrlWithFilters = useCallback((
        currentValues: {
            categoria: string | null;
            liga: string | null;
            equipo: string | null;
            marca: string | null;
            filters: CatalogFilters;
            query: string | null;
        },
        overrides?: {
            categoria?: string | null;
            liga?: string | null;
            equipo?: string | null;
            marca?: string | null;
            temporada?: string | null;
            genero?: string | null;
            precio?: string | null;
            orden?: string | null;
            query?: string | null;
        }
    ) => {
        const params = new URLSearchParams();

        const cat = overrides && 'categoria' in overrides ? overrides.categoria : currentValues.categoria;
        const lig = overrides && 'liga' in overrides ? overrides.liga : currentValues.liga;
        const eq = overrides && 'equipo' in overrides ? overrides.equipo : currentValues.equipo;
        const mar = overrides && 'marca' in overrides ? overrides.marca : currentValues.marca;
        const temp = overrides && 'temporada' in overrides ? overrides.temporada : currentValues.filters.season;
        const gen = overrides && 'genero' in overrides ? overrides.genero : currentValues.filters.gender;
        const pr = overrides && 'precio' in overrides ? overrides.precio : currentValues.filters.priceRange;
        const ord = overrides && 'orden' in overrides ? overrides.orden : currentValues.filters.sortBy;
        const q = overrides && 'query' in overrides ? overrides.query : currentValues.query;

        if (q) params.set('query', q);
        if (cat) params.set('categoria', cat);
        if (lig) params.set('liga', lig);
        if (eq) params.set('equipo', eq);
        if (mar) params.set('marca', mar);
        if (temp) params.set('temporada', temp);
        if (gen) params.set('genero', gen);
        if (pr) params.set('precio', pr);
        if (ord && ord !== 'relevance') params.set('orden', ord);

        const newQueryString = params.toString();
        const currentQueryString = searchParams.toString();
        if (newQueryString !== currentQueryString) {
            const newPath = newQueryString ? `/catalogo?${newQueryString}` : '/catalogo';
            router.replace(newPath, { scroll: false });
        }
    }, [router, searchParams]);

    const clearAllFilters = useCallback(() => {
        router.replace('/catalogo', { scroll: false });
    }, [router]);

    return {
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
    };
}
