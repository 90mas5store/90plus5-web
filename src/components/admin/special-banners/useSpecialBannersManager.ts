import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { clearProductCache } from "@/lib/api";
import { logAdminAction } from "@/lib/logger";
import { revalidateBannersAction } from "@/app/admin/actions";
import { SelectedCollectionProduct } from "@/components/admin/SpecialBannerProductSelector";
import { SpecialBanner, generateSlug } from "./types";

interface QueryRow {
    product_id: string;
    sort_order: number;
    products: {
        id?: string;
        name?: string;
        image_url?: string;
        team_id?: string;
        teams?: { name: string } | { name: string }[];
        product_variants?: { price: number; active: boolean }[];
    };
}

export function useSpecialBannersManager() {
    const [banners, setBanners] = useState<SpecialBanner[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBannerId, setSelectedBannerId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState<Partial<SpecialBanner>>({});
    const [previewOpen, setPreviewOpen] = useState(true);
    const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
    const [saving, setSaving] = useState(false);

    // Colección de prendas seleccionadas
    const [collectionProducts, setCollectionProducts] = useState<SelectedCollectionProduct[]>([]);
    const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(false);

    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;

    // === DATA FETCHING ===
    const fetchBanners = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from("special_banners")
                .select("*")
                .order("sort_order", { ascending: true });
            if (error) throw error;
            setBanners(data || []);
        } catch {
            toast.error("Error al cargar banners especiales");
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchBanners();
    }, [fetchBanners]);

    // Cargar productos asignados a un banner específico
    const fetchBannerProducts = useCallback(async (bannerId: string) => {
        setLoadingProducts(true);
        try {
            const { data, error } = await supabase
                .from("special_banner_products")
                .select(`
                    product_id,
                    sort_order,
                    products (
                        id,
                        name,
                        image_url,
                        team_id,
                        teams (
                            name
                        ),
                        product_variants (
                            price,
                            active
                        )
                    )
                `)
                .eq("banner_id", bannerId)
                .order("sort_order", { ascending: true });

            if (error) {
                setCollectionProducts([]);
                return;
            }

            const mapped: SelectedCollectionProduct[] = (data || []).map((row: unknown) => {
                const r = row as QueryRow;
                const p = r.products;
                const team = Array.isArray(p?.teams) ? p?.teams[0] : p?.teams;
                const variants = p?.product_variants || [];
                const activePrices = variants.filter(v => v.active).map(v => v.price);
                const minPrice = activePrices.length > 0 ? Math.min(...activePrices) : 0;
                return {
                    id: p?.id || r.product_id,
                    name: p?.name || "Producto",
                    image_url: p?.image_url || "",
                    team_name: team?.name,
                    team_id: p?.team_id,
                    price: minPrice,
                };
            });

            setCollectionProducts(mapped);
        } catch {
            setCollectionProducts([]);
        } finally {
            setLoadingProducts(false);
        }
    }, [supabase]);

    // === ACTIONS ===
    const handleSelectBanner = (banner: SpecialBanner) => {
        setIsCreating(false);
        setSelectedBannerId(banner.id);
        setFormData(banner);
        fetchBannerProducts(banner.id);
    };

    const handleCreateNew = () => {
        setIsCreating(true);
        setSelectedBannerId(null);
        setCollectionProducts([]);
        setFormData({
            title: "",
            subtitle: "",
            slug: "",
            link_url: "",
            background_image_url: "",
            background_video_url: "",
            logo_url: "",
            decoration_image_url: "",
            badge_primary_text: "",
            badge_secondary_text: "",
            badge_secondary_icon: "globe",
            button_text: "Ver Colección",
            active: true,
            sort_order: (banners.length > 0 ? Math.max(...banners.map(b => b.sort_order)) : 0) + 10,
            image_position_desktop: "50% 50%",
            image_position_mobile: "50% 50%",
        });
    };

    const handleDuplicate = async (banner: SpecialBanner, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setIsCreating(true);
        setSelectedBannerId(null);
        const newTitle = `${banner.title} (copia)`;
        const newSlug = `${banner.slug || generateSlug(banner.title)}-copia`;
        setFormData({
            ...banner,
            id: undefined,
            title: newTitle,
            slug: newSlug,
            link_url: `/coleccion/${newSlug}`,
            active: false,
            sort_order: (banners.length > 0 ? Math.max(...banners.map(b => b.sort_order)) : 0) + 10,
        });
        await fetchBannerProducts(banner.id);
        toast.success("Banner duplicado. Edita y guarda.");
    };

    const handleTitleChange = (newTitle: string) => {
        const autoSlug = generateSlug(newTitle);
        setFormData(prev => {
            const shouldUpdateSlug = isCreating || !prev.slug;
            const updatedSlug = shouldUpdateSlug ? autoSlug : prev.slug;
            const shouldUpdateLink = shouldUpdateSlug && (!prev.link_url || prev.link_url.startsWith("/coleccion/"));
            return {
                ...prev,
                title: newTitle,
                slug: updatedSlug,
                link_url: shouldUpdateLink && updatedSlug ? `/coleccion/${updatedSlug}` : prev.link_url,
            };
        });
    };

    const handleSlugChange = (newSlug: string) => {
        const cleanSlug = generateSlug(newSlug);
        setFormData(prev => ({
            ...prev,
            slug: cleanSlug,
            link_url: prev.link_url?.startsWith("/coleccion/") || !prev.link_url
                ? `/coleccion/${cleanSlug}`
                : prev.link_url,
        }));
    };

    const updateField = (field: keyof SpecialBanner, value: unknown) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title?.trim()) {
            return toast.error("El título es obligatorio");
        }

        setSaving(true);
        const payload = { ...formData };
        if (!selectedBannerId) delete payload.id;

        if (!payload.slug?.trim()) {
            payload.slug = generateSlug(payload.title);
        }

        if ((!payload.link_url || payload.link_url === "/catalogo") && payload.slug) {
            payload.link_url = `/coleccion/${payload.slug}`;
        }

        try {
            let currentId = selectedBannerId;

            if (selectedBannerId) {
                const { error } = await supabase
                    .from("special_banners")
                    .update(payload)
                    .eq("id", selectedBannerId);
                if (error) throw error;
                toast.success("Banner actualizado correctamente");
                logAdminAction("UPDATE_SPECIAL_BANNER", { id: selectedBannerId, title: payload.title });
            } else {
                const { data: inserted, error } = await supabase
                    .from("special_banners")
                    .insert([{ ...payload, active: payload.active ?? true }])
                    .select("id")
                    .single();
                if (error) throw error;
                currentId = inserted.id;
                setSelectedBannerId(currentId);
                setIsCreating(false);
                toast.success("Banner y colección creados correctamente");
                logAdminAction("CREATE_SPECIAL_BANNER", { title: payload.title });
            }

            // Sincronizar productos en special_banner_products
            if (currentId) {
                try {
                    await supabase
                        .from("special_banner_products")
                        .delete()
                        .eq("banner_id", currentId);

                    if (collectionProducts.length > 0) {
                        const rows = collectionProducts.map((p, idx) => ({
                            banner_id: currentId,
                            product_id: p.id,
                            sort_order: idx + 1,
                        }));
                        const { error: relErr } = await supabase
                            .from("special_banner_products")
                            .insert(rows);

                        if (relErr) {
                            console.warn("Aviso al guardar productos en la colección:", relErr);
                        }
                    }
                } catch (prodErr) {
                    console.error("Error sincronizando productos de la colección:", prodErr);
                }
            }

            fetchBanners();
            clearProductCache("config");
            await revalidateBannersAction().catch(() => {});
        } catch (err: unknown) {
            const error = err as { message?: string };
            toast.error(error?.message || "Error al guardar banner");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setDeleteTarget(id);
    };

    const executeDelete = async (id: string) => {
        const bannerToDelete = banners.find(b => b.id === id);
        try {
            await supabase.from("special_banners").delete().eq("id", id);
            toast.success("Eliminado");
            logAdminAction("DELETE_SPECIAL_BANNER", {
                id,
                title: bannerToDelete?.title || "Unknown",
            }, "warning");
            setBanners(prev => prev.filter(b => b.id !== id));
            if (selectedBannerId === id) {
                setSelectedBannerId(null);
                setIsCreating(false);
                setCollectionProducts([]);
            }
            clearProductCache("config");
            await revalidateBannersAction().catch(() => {});
        } catch {
            toast.error("Error al eliminar");
        }
    };

    const handleToggleActive = async (banner: SpecialBanner, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            const newStatus = !banner.active;
            setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, active: newStatus } : b));
            if (selectedBannerId === banner.id) {
                setFormData(prev => ({ ...prev, active: newStatus }));
            }
            await supabase.from("special_banners").update({ active: newStatus }).eq("id", banner.id);
            clearProductCache("config");
            await revalidateBannersAction().catch(() => {});
        } catch {
            toast.error("Error al actualizar");
            fetchBanners();
        }
    };

    const moveProductInCollection = (index: number, direction: "up" | "down") => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= collectionProducts.length) return;
        setCollectionProducts(prev => {
            const copy = [...prev];
            const temp = copy[targetIndex];
            copy[targetIndex] = copy[index];
            copy[index] = temp;
            return copy;
        });
    };

    const removeProductFromCollection = (id: string) => {
        setCollectionProducts(prev => prev.filter(p => p.id !== id));
    };

    return {
        // State
        banners,
        loading,
        selectedBannerId,
        deleteTarget,
        setDeleteTarget,
        isCreating,
        formData,
        setFormData,
        previewOpen,
        setPreviewOpen,
        previewMode,
        setPreviewMode,
        saving,
        collectionProducts,
        setCollectionProducts,
        isProductSelectorOpen,
        setIsProductSelectorOpen,
        loadingProducts,

        // Handlers
        handleSelectBanner,
        handleCreateNew,
        handleDuplicate,
        handleTitleChange,
        handleSlugChange,
        updateField,
        handleSubmit,
        handleDelete,
        executeDelete,
        handleToggleActive,
        moveProductInCollection,
        removeProductFromCollection,
    };
}
