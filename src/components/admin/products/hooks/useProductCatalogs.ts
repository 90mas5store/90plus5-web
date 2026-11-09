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
        const matches = allSizes.filter((s) => {
            if (s.active === false) return false;
            const categoryMatch = !s.category_id || !categoryId || s.category_id === categoryId;
            const genderMatch = !s.gender || !gender || s.gender === gender;
            return categoryMatch && genderMatch;
        });

        // Deduplicar por etiqueta limpia
        const seen = new Set<string>();
        const deduped = matches.filter((s) => {
            const key = s.label.trim().toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        return deduped.sort((a, b) => {
            const isKidA = /año/i.test(a.label);
            const isKidB = /año/i.test(b.label);
            if (isKidA && isKidB) {
                return parseInt(a.label.replace(/[^\d]/g, ''), 10) - parseInt(b.label.replace(/[^\d]/g, ''), 10);
            }
            const numA = parseFloat(a.label.replace(/[^\d.]/g, ''));
            const numB = parseFloat(b.label.replace(/[^\d.]/g, ''));
            if (!isNaN(numA) && !isNaN(numB) && !isKidA && !isKidB) {
                return numA - numB;
            }
            return (a.sort_order ?? 99) - (b.sort_order ?? 99);
        });
    }, [allSizes, categoryId, gender]);

    const filteredPatches = useMemo(() => {
        return allPatches.filter(
            (p) => !p.category_id || !categoryId || p.category_id === categoryId
        );
    }, [allPatches, categoryId]);

    const addTeam = (newTeam: CatalogItem) => {
        setTeams((prev) => {
            if (prev.some((t) => t.id === newTeam.id)) return prev;
            return [...prev, newTeam].sort((a, b) => a.name.localeCompare(b.name));
        });
    };

    const addBrand = (newBrand: CatalogItem) => {
        setBrands((prev) => {
            if (prev.some((b) => b.id === newBrand.id)) return prev;
            return [...prev, newBrand].sort((a, b) => a.name.localeCompare(b.name));
        });
    };

    const addSize = (newSize: AdminSize) => {
        setAllSizes((prev) => {
            if (prev.some((s) => s.id === newSize.id)) return prev;
            return [...prev, newSize].sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99));
        });
    };

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
        addTeam,
        addBrand,
        addSize,
    };
}
