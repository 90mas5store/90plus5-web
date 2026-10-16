'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import useToastMessage from '@/hooks/useToastMessage';
import { useAdminRole } from '@/hooks/useAdminRole';
import { sanitizeSlugPart } from '@/lib/utils/slug';
import { GalleryImage } from '@/components/admin/ProductGalleryManager';
import { AdminProductFormData } from '@/types/adminProduct';
import {
    fetchProductForEdit,
    saveProductChanges,
    deleteProductById,
} from './productAdminService';
import { useProductCatalogs } from './hooks/useProductCatalogs';
import { useProductSlug } from './hooks/useProductSlug';
import { useProductVariantsManager } from './hooks/useProductVariantsManager';
import { useProductPlayersManager } from './hooks/useProductPlayersManager';

export function useEditProductForm(id: string) {
    const router = useRouter();
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;
    const toast = useToastMessage();
    const { isSuperAdmin } = useAdminRole();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [confirmDeleteProduct, setConfirmDeleteProduct] = useState(false);

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
        teams,
        leagues,
        categories,
        brands,
        availableVersions,
        featuredProducts,
        filteredSizes,
        filteredPatches,
    } = useProductCatalogs(formData.category_id, formData.gender);

    // 2️⃣ Gestión de Slugs
    const { isAutoSlug, setIsAutoSlug, slugChecking, slugIsUnique } = useProductSlug({
        productId: id,
        formData,
        teams,
        brands,
        categories,
        onSlugGenerated: (slug) => setFormData((prev) => ({ ...prev, slug })),
        initialAutoSlug: false,
    });

    // 3️⃣ Variantes
    const {
        variants,
        setVariants,
        addVariant,
        updateVariant,
        removeVariant,
        toggleVariantSize,
        variantToDelete,
        setVariantToDelete,
    } = useProductVariantsManager(filteredSizes);

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

    // 📥 Cargar Producto
    useEffect(() => {
        let mounted = true;
        async function load() {
            try {
                const data = await fetchProductForEdit(supabase, id);
                if (!mounted) return;
                setFormData(data.formData);
                setVariants(data.variants);
                setProductImages(data.productImages);
                setProductPatches(data.productPatches);
                setSelectedLeagues(data.selectedLeagues);
                setSelectedPlayerIds(data.selectedPlayerIds);
            } catch (error) {
                console.error('Error cargando producto:', error);
                toast.error('Error al cargar datos del producto');
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => {
            mounted = false;
        };
    }, [id, supabase, setVariants, setSelectedPlayerIds, toast]);

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
            if (next.has(leagueId)) next.delete(leagueId);
            else next.add(leagueId);
            return next;
        });
    };

    // 🗑️ Eliminar Producto Completo
    const handleDeleteProduct = async () => {
        try {
            setSaving(true);
            await deleteProductById(supabase, id, formData.slug);
            toast.success('Producto eliminado exitosamente');
            router.push('/admin/productos');
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            toast.error('Error al eliminar producto');
        } finally {
            setSaving(false);
            setConfirmDeleteProduct(false);
        }
    };

    // 💾 Guardar Cambios
    const handleSave = async () => {
        const rawSlug = formData.slug || formData.name;
        if (!formData.name || !rawSlug) {
            toast.error('Nombre y Slug son obligatorios');
            return;
        }

        setSaving(true);
        try {
            await saveProductChanges(supabase, {
                id,
                formData,
                productPatches,
                selectedLeagues,
                productImages,
                selectedPlayerIds,
                teamPlayers,
                variants,
            });
            toast.success('Producto actualizado exitosamente');
            router.push('/admin/productos');
        } catch (error) {
            console.error('Error al guardar cambios:', error);
            toast.error(`Error: ${(error as Error).message}`);
        } finally {
            setSaving(false);
        }
    };

    return {
        id,
        loading,
        saving,
        isSuperAdmin,
        teams,
        leagues,
        categories,
        brands,
        availableVersions,
        featuredProducts,
        filteredSizes,
        filteredPatches,
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
        confirmDeleteProduct,
        setConfirmDeleteProduct,
        handleDeleteProduct,
        handleSave,
    };
}
