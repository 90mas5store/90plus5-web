'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchProductCatalogs } from '../productAdminService';
import { CatalogItem, AdminSize, AdminPatch } from '@/types/adminProduct';

export function useProductCatalogs(categoryId?: string, gender?: string) {
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;

    const [loadingCatalogs, setLoadingCatalogs] = useState(true);
    const [teams, setTeams] = useState<CatalogItem[]>([]);
    const [leagues, setLeagues] = useState<CatalogItem[]>([]);
    const [categories, setCategories] = useState<CatalogItem[]>([]);
    const [brands, setBrands] = useState<CatalogItem[]>([]);
    const [allSizes, setAllSizes] = useState<AdminSize[]>([]);
    const [allPatches, setAllPatches] = useState<AdminPatch[]>([]);
    const [availableVersions, setAvailableVersions] = useState<string[]>(['Fan', 'Player', 'Estandar']);
    const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);

    useEffect(() => {
        let mounted = true;
        async function load() {
            try {
                const data = await fetchProductCatalogs(supabase);
                if (!mounted) return;
                setTeams(data.teams);
                setLeagues(data.leagues);
                setCategories(data.categories);
                setBrands(data.brands);
                setAllSizes(data.allSizes);
                setAllPatches(data.allPatches);
                setAvailableVersions(data.availableVersions);
                setFeaturedProducts(data.featuredProducts);
            } catch (err) {
                console.error('Error cargando catálogos de producto:', err);
            } finally {
                if (mounted) setLoadingCatalogs(false);
            }
        }
        load();
        return () => {
            mounted = false;
        };
    }, [supabase]);

    const filteredSizes = useMemo(() => {
        return allSizes.filter(
            (s) =>
                (!s.category_id || !categoryId || s.category_id === categoryId) &&
                (!s.gender || !gender || s.gender === gender)
        );
    }, [allSizes, categoryId, gender]);

    const filteredPatches = useMemo(() => {
        return allPatches.filter(
            (p) => !p.category_id || !categoryId || p.category_id === categoryId
        );
    }, [allPatches, categoryId]);

    return {
        loadingCatalogs,
        teams,
        leagues,
        categories,
        brands,
        allSizes,
        allPatches,
        availableVersions,
        featuredProducts,
        filteredSizes,
        filteredPatches,
    };
}
