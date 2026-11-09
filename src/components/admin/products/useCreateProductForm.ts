'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import useToastMessage from '@/hooks/useToastMessage';
import { useAdminRole } from '@/hooks/useAdminRole';
import { sanitizeSlugPart } from '@/lib/utils/slug';
import { GalleryImage } from '@/components/admin/ProductGalleryManager';
import { AdminProductFormData, AdminVariant, CatalogItem } from '@/types/adminProduct';
import {
    createProduct,
    fetchTeamBrandSuggestion,
} from './productAdminService';
import { useProductCatalogs } from './hooks/useProductCatalogs';
import { useProductSlug } from './hooks/useProductSlug';
import { useProductVariantsManager } from './hooks/useProductVariantsManager';
import { useProductPlayersManager } from './hooks/useProductPlayersManager';

export function useCreateProductForm() {
    const router = useRouter();
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;
    const toast = useToastMessage();
    const { isSuperAdmin } = useAdminRole();

    const [saving, setSaving] = useState(false);
    const [suggestedBrandName, setSuggestedBrandName] = useState<string | null>(null);

    // Estado del Formulario Principal
    const [formData, setFormData] = useState<AdminProductFormData>({
        name: '',
        description: '',
        slug: '',
        image_url: '',
        team_id: '',
        league_id: '',
        category_id: '',
        brand_id: '',
        gender: '',
        active: true,
        featured: false,
        allows_customization: true,
        sort_order: 0,
        season: '',
    });

    // 1️⃣ Catálogos
    const {
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
    } = useProductCatalogs(formData.category_id, formData.gender);

    // 2️⃣ Gestión de Slugs
    const { isAutoSlug, setIsAutoSlug, slugChecking, slugIsUnique } = useProductSlug({
        formData,
        teams,
        brands,
        categories,
        onSlugGenerated: (slug) => setFormData((prev) => ({ ...prev, slug })),
        initialAutoSlug: true,
    });

    // 3️⃣ Variantes
    const {
        variants,
        setVariants,
        addVariant,
        updateVariant,
        removeVariant,
        toggleVariantSize,
        applyAdultPreset,
        applySinglePreset,
        variantToDelete,
        setVariantToDelete,
    } = useProductVariantsManager(filteredSizes);

    // Inicializar con variante por defecto una vez cargadas las tallas iniciales
    const initializedVariantRef = useRef(false);
    useEffect(() => {
        if (!initializedVariantRef.current && filteredSizes.length > 0) {
            initializedVariantRef.current = true;
            const defaultVariant: AdminVariant = {
                tempId: `default_${Date.now()}`,
                version: 'Fan',
                price: 1200,
                cost: 0,
                active: true,
                original_price: 0,
                active_original_price: false,
                sizeIds: new Set(filteredSizes.map((s) => s.id)),
            };
            setVariants([defaultVariant]);
        }
    }, [filteredSizes, setVariants]);

    // 4️⃣ Jugadores
    const {
        teamPlayers,
        selectedPlayerIds,
        setSelectedPlayerIds,
        newPlayer,
        setNewPlayer,
        addingPlayer,
        togglePlayer,
        selectAllPlayers,
        deselectAllPlayers,
        handleAddPlayer,
    } = useProductPlayersManager(formData.team_id);

    // Parches, Ligas y Galería
    const [productPatches, setProductPatches] = useState<Set<string>>(new Set<string>());
    const [selectedLeagues, setSelectedLeagues] = useState<Set<string>>(new Set<string>());
    const [productImages, setProductImages] = useState<GalleryImage[]>([]);

    // ⚡ Cascada Reactiva Inteligente: Equipo → Liga → Parches → Marca
    const prevTeamIdRef = useRef<string>('');
    useEffect(() => {
        if (!formData.team_id || formData.team_id === prevTeamIdRef.current) return;
        prevTeamIdRef.current = formData.team_id;

        const currentTeam = teams.find((t) => t.id === formData.team_id);
        if (!currentTeam) return;

        // Auto-seleccionar Liga Primaria y sincronizar competiciones seleccionadas si el equipo tiene league_id
        if (currentTeam.league_id) {
            const leagueId = currentTeam.league_id;
            setFormData((prev) => ({
                ...prev,
                league_id: leagueId,
            }));
            setSelectedLeagues(new Set([leagueId]));

            // Auto-seleccionar parches vinculados a la liga del nuevo equipo
            const leaguePatches = allPatches
                .filter((p) => p.competition_id === leagueId)
                .map((p) => p.id);
            setProductPatches(new Set(leaguePatches));
        }

        // Consultar sugerencia de marca habitual del equipo
        async function checkBrandSuggestion() {
            try {
                const suggestedBrandId = await fetchTeamBrandSuggestion(supabase, formData.team_id);
                if (suggestedBrandId) {
                    const brandObj = brands.find((b) => b.id === suggestedBrandId);
                    setSuggestedBrandName(brandObj?.name || null);
                    // Solo auto-asignar si el usuario aún no había escogido una marca específica
                    setFormData((prev) => {
                        if (!prev.brand_id) {
                            return { ...prev, brand_id: suggestedBrandId };
                        }
                        return prev;
                    });
                } else {
                    setSuggestedBrandName(null);
                }
            } catch (err) {
                console.error('Error sugiriendo marca para equipo:', err);
            }
        }

        checkBrandSuggestion();
    }, [formData.team_id, teams, brands, allPatches, supabase]);

    // Handlers
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

        setFormData((prev) => {
            const next = { ...prev, [name]: val };
            if (name === 'slug') {
                setIsAutoSlug(false);
                next.slug = sanitizeSlugPart(String(val));
            }
            return next;
        });
    };

    const toggleProductPatch = (patchId: string) => {
        setProductPatches((prev) => {
            const next = new Set(prev);
            if (next.has(patchId)) next.delete(patchId);
            else next.add(patchId);
            return next;
        });
    };

    const toggleSelectedLeague = (leagueId: string) => {
        setSelectedLeagues((prev) => {
            const next = new Set(prev);
            if (next.has(leagueId)) {
                next.delete(leagueId);
            } else {
                next.add(leagueId);
                // Si agregamos una competición, auto-seleccionar sus parches asociados también
                const compPatches = allPatches
                    .filter((p) => p.competition_id === leagueId)
                    .map((p) => p.id);
                if (compPatches.length > 0) {
                    setProductPatches((cur) => {
                        const nextP = new Set(cur);
                        compPatches.forEach((pid) => nextP.add(pid));
                        return nextP;
                    });
                }
            }
            return next;
        });
    };

    // 💾 Guardar Nuevo Producto
    const handleSave = async () => {
        const rawSlug = formData.slug || formData.name;
        if (!formData.name || !rawSlug) {
            toast.error('El nombre y el slug del producto son obligatorios');
            return;
        }

        setSaving(true);
        try {
            const { slug } = await createProduct(supabase, {
                formData,
                productPatches,
                selectedLeagues,
                productImages,
                selectedPlayerIds,
                teamPlayers,
                variants,
            });
            toast.success('¡Producto creado exitosamente!');
            router.push('/admin/productos');
        } catch (error) {
            console.error('Error al crear producto:', error);
            toast.error(`Error: ${(error as Error).message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleTeamCreated = (newTeam: CatalogItem) => {
        addTeam(newTeam);
        setFormData((prev) => ({
            ...prev,
            team_id: newTeam.id,
            league_id: newTeam.league_id || prev.league_id,
        }));
        if (newTeam.league_id) {
            setSelectedLeagues(new Set([newTeam.league_id]));
            const leaguePatches = allPatches
                .filter((p) => p.competition_id === newTeam.league_id)
                .map((p) => p.id);
            setProductPatches(new Set(leaguePatches));
        }
    };

    const handleBrandCreated = (newBrand: CatalogItem) => {
        addBrand(newBrand);
        setFormData((prev) => ({
            ...prev,
            brand_id: newBrand.id,
        }));
    };

    return {
        loading: loadingCatalogs,
        saving,
        isSuperAdmin,
        teams,
        leagues,
        categories,
        brands,
        allSizes,
        availableVersions,
        featuredProducts,
        filteredSizes,
        filteredPatches,
        addSize,
        formData,
        setFormData,
        handleChange,
        isAutoSlug,
        setIsAutoSlug,
        slugChecking,
        slugIsUnique,
        variants,
        setVariants,
        addVariant,
        updateVariant,
        removeVariant,
        toggleVariantSize,
        applyAdultPreset,
        applySinglePreset,
        variantToDelete,
        setVariantToDelete,
        productPatches,
        toggleProductPatch,
        selectedLeagues,
        toggleSelectedLeague,
        productImages,
        setProductImages,
        teamPlayers,
        selectedPlayerIds,
        togglePlayer,
        selectAllPlayers,
        deselectAllPlayers,
        newPlayer,
        setNewPlayer,
        addingPlayer,
        handleAddPlayer,
        suggestedBrandName,
        handleTeamCreated,
        handleBrandCreated,
        handleSave,
    };
}
