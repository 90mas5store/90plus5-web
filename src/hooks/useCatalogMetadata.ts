'use client';

import { useState, useEffect, useMemo } from 'react';
import { Config, Brand } from '@/lib/types';
import {
    getConfig,
    getTeamsByLeague,
    getTeamsByCategory,
    getBrandsByCategory,
} from '@/lib/api';
import { GENDER_CATEGORY_SLUGS, FALLBACK_PLACEHOLDER_IMAGE } from '@/constants/catalogo';

export interface ExtendedLeague {
    nombre: string;
    imagen: string | null;
    id: string | null;
    category_id?: string | null;
    slug?: string;
    hero_image_position_desktop?: string;
    hero_image_position_mobile?: string;
}

export function normalizeText(s: string | null | undefined): string {
    return (s || '')
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');
}

interface UseCatalogMetadataProps {
    initialConfig?: Config | null;
    categoriaParam: string | null;
    ligaParam: string | null;
}

export function useCatalogMetadata({
    initialConfig = null,
    categoriaParam,
    ligaParam,
}: UseCatalogMetadataProps) {
    const [config, setConfig] = useState<Config | null>(initialConfig);
    const [ligas, setLigas] = useState<ExtendedLeague[]>(initialConfig?.ligas || []);
    const [ligaSeleccionada, setLigaSeleccionada] = useState<string | null>(null);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(categoriaParam || null);
    const [teams, setTeams] = useState<{ id: string; name: string; logo_url: string | null }[]>([]);
    const [categoryBrands, setCategoryBrands] = useState<Brand[]>([]);

    // Carga inicial de configuración si no vino precargada
    useEffect(() => {
        if (initialConfig) return;
        let isMounted = true;
        getConfig()
            .then((cfg) => {
                if (!isMounted) return;
                setConfig(cfg || { categorias: [], ligas: [], marcas: [] });
                if (cfg?.ligas?.length) {
                    setLigas(cfg.ligas);
                }
            })
            .catch((err) => console.error('Error cargando configuración:', err));

        return () => {
            isMounted = false;
        };
    }, [initialConfig]);

    // Sincronización de URL con Estados
    useEffect(() => {
        setCategoriaSeleccionada(categoriaParam || null);

        if (ligaParam && ligas.length > 0) {
            const foundLeague = ligas.find(
                (l) => (l.slug && l.slug === ligaParam) || normalizeText(l.nombre) === normalizeText(ligaParam)
            );
            setLigaSeleccionada(foundLeague ? foundLeague.nombre : null);
        } else {
            setLigaSeleccionada(null);
        }
    }, [categoriaParam, ligaParam, ligas]);

    // Objetos memoizados
    const selectedCategoryObj = useMemo(() => {
        if (!config?.categorias) return null;
        return config.categorias.find((c) => c.slug === categoriaSeleccionada);
    }, [config, categoriaSeleccionada]);

    const selectedLeagueObj = useMemo(() => {
        if (!ligaSeleccionada) return null;
        const lObj = ligas.find((l) => normalizeText(l.nombre) === normalizeText(ligaSeleccionada));
        if (!lObj && ligaParam && normalizeText(ligaParam) === normalizeText(ligaSeleccionada)) {
            return { id: null, nombre: ligaParam, imagen: null, slug: ligaParam } as ExtendedLeague;
        }
        return lObj;
    }, [ligas, ligaSeleccionada, ligaParam]);

    // Equipos y marcas según liga o categoría
    useEffect(() => {
        let isMounted = true;
        if (selectedLeagueObj?.id) {
            setCategoryBrands([]);
            getTeamsByLeague(selectedLeagueObj.id).then((t) => {
                if (isMounted) setTeams(t);
            });
        } else if (selectedCategoryObj?.id) {
            getTeamsByCategory(selectedCategoryObj.id).then((t) => {
                if (isMounted) setTeams(t);
            });
            getBrandsByCategory(selectedCategoryObj.id).then((b) => {
                if (isMounted) setCategoryBrands(b);
            });
        } else {
            setTeams([]);
            setCategoryBrands([]);
        }
        return () => {
            isMounted = false;
        };
    }, [selectedLeagueObj?.id, selectedCategoryObj?.id]);

    const showGenderFilter = useMemo(() => {
        if (!categoriaSeleccionada) return true;
        const slug = categoriaSeleccionada.toLowerCase();
        return GENDER_CATEGORY_SLUGS.some((gc) => slug.includes(gc));
    }, [categoriaSeleccionada]);

    const adjacentCategories = useMemo(() => {
        if (!config?.categorias) return [];
        return config.categorias.map((c) => c.slug).slice(0, 4);
    }, [config]);

    // Carrusel dinámico de ligas vs marcas
    const currentCarrusel = useMemo(() => {
        let ligasDisponibles = ligas;
        if (selectedCategoryObj && selectedCategoryObj.id) {
            ligasDisponibles = ligas.filter((l) => l.category_id === selectedCategoryObj.id);
        }

        if (ligasDisponibles.length > 0) {
            return {
                type: 'liga' as const,
                title: null,
                items: ligasDisponibles.map((l) => ({
                    nombre: l.nombre,
                    imagen: l.imagen || FALLBACK_PLACEHOLDER_IMAGE,
                })),
            };
        }

        if (categoryBrands.length > 0) {
            return {
                type: 'brand' as const,
                title: null,
                items: categoryBrands.map((b) => ({
                    nombre: b.name,
                    imagen: b.logo_url || FALLBACK_PLACEHOLDER_IMAGE,
                    id: b.id,
                })),
            };
        }

        return null;
    }, [selectedCategoryObj, ligas, categoryBrands]);

    return {
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
    };
}
