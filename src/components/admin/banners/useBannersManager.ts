import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { clearProductCache } from "@/lib/api";
import { logAdminAction } from "@/lib/logger";
import { revalidateBannersAction } from "@/app/admin/actions";
import { Banner, CatalogFilterOption } from "./types";

export function useBannersManager() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBannerId, setSelectedBannerId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<Banner>>({});

    // Data for Selectors
    const [categories, setCategories] = useState<CatalogFilterOption[]>([]);
    const [leagues, setLeagues] = useState<CatalogFilterOption[]>([]);
    const [linkType, setLinkType] = useState<"catalog" | "custom">("catalog");
    const [selectedCatalogFilter, setSelectedCatalogFilter] = useState<"all" | "category" | "league">("all");
    const [selectedSlug, setSelectedSlug] = useState("");

    const [previewOpen, setPreviewOpen] = useState(true);
    const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;

    // === DATA FETCHING ===
    const fetchMetadata = useCallback(async () => {
        const [catRes, leagueRes] = await Promise.all([
            supabase.from("categories").select("id, name, slug"),
            supabase.from("leagues").select("id, name, slug"),
        ]);
        setCategories(catRes.data || []);
        setLeagues(leagueRes.data || []);
    }, [supabase]);

    const fetchBanners = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from("banners")
                .select("*")
                .order("sort_order", { ascending: true });
            if (error) throw error;
            setBanners(data || []);
        } catch {
            toast.error("Error al cargar banners");
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchBanners();
        fetchMetadata();
    }, [fetchBanners, fetchMetadata]);

    // === ACTIONS ===
    const handleSelectBanner = (banner: Banner) => {
        setIsCreating(false);
        setSelectedBannerId(banner.id);
        setFormData(banner);

        // Parse Link logic
        if (banner.link_url && banner.link_url.startsWith("/catalogo")) {
            setLinkType("catalog");
            if (banner.link_url.includes("categoria=")) {
                setSelectedCatalogFilter("category");
                setSelectedSlug(banner.link_url.split("categoria=")[1] || "");
            } else if (banner.link_url.includes("liga=")) {
                setSelectedCatalogFilter("league");
                setSelectedSlug(banner.link_url.split("liga=")[1] || "");
            } else {
                setSelectedCatalogFilter("all");
                setSelectedSlug("");
            }
        } else {
            setLinkType("custom");
            setSelectedCatalogFilter("all");
            setSelectedSlug("");
        }
    };

    const handleCreateNew = () => {
        setIsCreating(true);
        setSelectedBannerId(null);
        setFormData({
            title: "",
            description: "",
            active: true,
            show_on_home: true,
            sort_order: (banners.length > 0 ? Math.max(...banners.map(b => b.sort_order)) : 0) + 10,
            button_text: "Ver Colección",
            show_button: false,
            link_url: "/catalogo",
            image_position_desktop: "center center",
            image_position_mobile: "center center",
        });
        setLinkType("catalog");
        setSelectedCatalogFilter("all");
        setSelectedSlug("");
    };

    // Update link_url when catalog filters change
    useEffect(() => {
        if (!selectedBannerId && !isCreating) return;

        if (linkType === "custom") {
            // Editado manualmente
        } else {
            let url = "/catalogo";
            if (selectedCatalogFilter === "category" && selectedSlug) url += `?categoria=${selectedSlug}`;
            if (selectedCatalogFilter === "league" && selectedSlug) url += `?liga=${selectedSlug}`;

            setFormData(prev => ({ ...prev, link_url: url }));
        }
    }, [linkType, selectedCatalogFilter, selectedSlug, selectedBannerId, isCreating]);

    const updateField = (field: keyof Banner, value: unknown) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.image_url && !formData.video_url) {
            return toast.error("Debes subir una Imagen o un Video");
        }

        setSaving(true);
        const payload = { ...formData };

        try {
            if (selectedBannerId) {
                const { error } = await supabase.from("banners").update(payload).eq("id", selectedBannerId);
                if (error) throw error;
                toast.success("Actualizado correctamente");
                logAdminAction("UPDATE_BANNER", { id: selectedBannerId, title: payload.title });
            } else {
                const { error } = await supabase.from("banners").insert([{ ...payload, active: true }]);
                if (error) throw error;
                toast.success("Creado correctamente");
                logAdminAction("CREATE_BANNER", { title: payload.title });
                setIsCreating(false);
            }

            fetchBanners();
            clearProductCache("config");
            await revalidateBannersAction().catch(() => {});
        } catch {
            toast.error("Error al guardar");
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
            await supabase.from("banners").delete().eq("id", id);
            toast.success("Eliminado");

            logAdminAction("DELETE_BANNER", {
                id,
                title: bannerToDelete?.title || "Unknown",
                image: bannerToDelete?.image_url,
            }, "warning");

            setBanners(prev => prev.filter(b => b.id !== id));
            if (selectedBannerId === id) {
                setSelectedBannerId(null);
                setIsCreating(false);
            }
            clearProductCache("config");
            await revalidateBannersAction().catch(() => {});
        } catch {
            toast.error("Error al eliminar");
        }
    };

    const handleToggleActive = async (banner: Banner, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            const newStatus = !banner.active;
            setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, active: newStatus } : b));

            if (selectedBannerId === banner.id) {
                setFormData(prev => ({ ...prev, active: newStatus }));
            }

            await supabase.from("banners").update({ active: newStatus }).eq("id", banner.id);
            clearProductCache("config");
            await revalidateBannersAction().catch(() => {});
        } catch {
            toast.error("Error update");
            fetchBanners();
        }
    };

    return {
        // State
        banners,
        loading,
        selectedBannerId,
        deleteTarget,
        setDeleteTarget,
        isCreating,
        saving,
        formData,
        setFormData,
        categories,
        leagues,
        linkType,
        setLinkType,
        selectedCatalogFilter,
        setSelectedCatalogFilter,
        selectedSlug,
        setSelectedSlug,
        previewOpen,
        setPreviewOpen,
        previewMode,
        setPreviewMode,

        // Actions
        handleSelectBanner,
        handleCreateNew,
        updateField,
        handleSubmit,
        handleDelete,
        executeDelete,
        handleToggleActive,
    };
}
