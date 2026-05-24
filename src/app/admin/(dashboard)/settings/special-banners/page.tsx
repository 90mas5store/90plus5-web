"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Plus, Trash2, Save, Image as ImageIcon,
    Link as LinkIcon, Monitor, Smartphone, Eye,
    Loader2, ChevronDown, Film, Copy,
    Globe, Trophy, Star, Flame, ArrowRight
} from "lucide-react";
import { toast } from "react-hot-toast";
import MediaUpload from "@/components/admin/MediaUpload";
import Image from "next/image";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { clearProductCache } from "@/lib/api";
import { logAdminAction } from "@/lib/logger";
import { revalidateBannersAction } from "@/app/admin/actions";

interface SpecialBanner {
    id: string;
    title: string;
    subtitle: string;
    link_url: string;
    background_image_url: string;
    background_video_url: string;
    logo_url: string;
    decoration_image_url: string;
    badge_primary_text: string;
    badge_secondary_text: string;
    badge_secondary_icon: string;
    button_text: string;
    active: boolean;
    sort_order: number;
}

const ICON_OPTIONS = [
    { value: "globe", label: "Globe", Icon: Globe },
    { value: "trophy", label: "Trophy", Icon: Trophy },
    { value: "star", label: "Star", Icon: Star },
    { value: "flame", label: "Flame", Icon: Flame },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    globe: Globe,
    trophy: Trophy,
    star: Star,
    flame: Flame,
};

export default function SpecialBannersPage() {
    const [banners, setBanners] = useState<SpecialBanner[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBannerId, setSelectedBannerId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState<Partial<SpecialBanner>>({});
    const [previewOpen, setPreviewOpen] = useState(true);
    const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
    const [saving, setSaving] = useState(false);

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
    }, []);

    useEffect(() => {
        fetchBanners();
    }, [fetchBanners]);

    // === LOGIC ===
    const handleSelectBanner = (banner: SpecialBanner) => {
        setIsCreating(false);
        setSelectedBannerId(banner.id);
        setFormData(banner);
    };

    const handleCreateNew = () => {
        setIsCreating(true);
        setSelectedBannerId(null);
        setFormData({
            title: "",
            subtitle: "",
            link_url: "/catalogo",
            background_image_url: "",
            background_video_url: "",
            logo_url: "",
            decoration_image_url: "",
            badge_primary_text: "",
            badge_secondary_text: "",
            badge_secondary_icon: "globe",
            button_text: "Ver Coleccion",
            active: true,
            sort_order: (banners.length > 0 ? Math.max(...banners.map(b => b.sort_order)) : 0) + 10,
        });
    };

    const handleDuplicate = (banner: SpecialBanner, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setIsCreating(true);
        setSelectedBannerId(null);
        setFormData({
            ...banner,
            id: undefined,
            title: `${banner.title} (copia)`,
            active: false,
            sort_order: (banners.length > 0 ? Math.max(...banners.map(b => b.sort_order)) : 0) + 10,
        });
        toast.success("Banner duplicado. Edita y guarda.");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title?.trim()) {
            return toast.error("El titulo es obligatorio");
        }

        setSaving(true);
        const payload = { ...formData };
        // Remove id from payload for create
        const payloadId = payload.id;
        if (!selectedBannerId) delete payload.id;

        try {
            if (selectedBannerId) {
                const { error } = await supabase
                    .from("special_banners")
                    .update(payload)
                    .eq("id", selectedBannerId);
                if (error) throw error;
                toast.success("Actualizado correctamente");
                logAdminAction("UPDATE_SPECIAL_BANNER", { id: selectedBannerId, title: payload.title });
            } else {
                const { error } = await supabase
                    .from("special_banners")
                    .insert([{ ...payload, active: payload.active ?? true }]);
                if (error) throw error;
                toast.success("Creado correctamente");
                logAdminAction("CREATE_SPECIAL_BANNER", { title: payload.title });
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

    const IconPreview = ICON_MAP[formData.badge_secondary_icon || "globe"] || Globe;

    return (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 animate-in fade-in duration-500 h-auto md:h-[calc(100dvh-140px)]">

            {/* === LISTA LATERAL (Master) === */}
            <div className="w-full md:w-80 flex flex-col bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex-shrink-0">
                {/* Header */}
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div>
                        <h2 className="text-base font-bold text-white tracking-wide">Banners Especiales</h2>
                        <p className="text-xs text-gray-500 font-medium">{banners.length} elementos</p>
                    </div>
                    <button
                        onClick={handleCreateNew}
                        className="w-8 h-8 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-all shadow-lg shadow-white/10"
                        title="Nuevo Banner Especial"
                    >
                        <Plus size={18} />
                    </button>
                </div>

                {/* Lista */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {loading ? (
                        <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-gray-600" /></div>
                    ) : banners.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-xs flex flex-col items-center">
                            <ImageIcon size={24} className="mb-2 opacity-30" />
                            Sin banners especiales. Crea uno nuevo.
                        </div>
                    ) : (
                        banners.map(banner => (
                            <div
                                key={banner.id}
                                onClick={() => handleSelectBanner(banner)}
                                className={`
                                    group relative flex items-center gap-3 p-2 pr-3 rounded-xl cursor-pointer transition-all duration-300 border
                                    ${selectedBannerId === banner.id
                                        ? "bg-white/10 border-white/20 shadow-inner"
                                        : "bg-transparent border-transparent hover:bg-white/5"
                                    }
                                `}
                            >
                                {/* Thumbnail */}
                                <div className="w-14 h-10 relative rounded-lg overflow-hidden bg-black shrink-0 border border-white/10 shadow-sm">
                                    {banner.background_image_url ? (
                                        <Image src={banner.background_image_url} fill alt="" className="object-cover" sizes="56px" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-neutral-800"><ImageIcon size={12} className="text-gray-600" /></div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className={`text-xs font-bold truncate ${selectedBannerId === banner.id ? "text-white" : "text-gray-400 group-hover:text-gray-200"}`}>
                                        {banner.title || <span className="italic opacity-50">Sin titulo</span>}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <button
                                            onClick={(e) => handleToggleActive(banner, e)}
                                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border cursor-pointer transition-colors ${banner.active
                                                ? "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20"
                                                : "bg-gray-700/30 text-gray-500 border-gray-600/30 hover:bg-gray-700/50"
                                            }`}
                                        >
                                            {banner.active ? "ACTIVO" : "INACTIVO"}
                                        </button>
                                        <span className="ml-auto text-[9px] text-gray-600 font-mono">#{banner.sort_order}</span>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 rounded-lg p-1 flex gap-1 backdrop-blur-sm border border-white/10 shadow-xl">
                                    <button
                                        onClick={(e) => handleDuplicate(banner, e)}
                                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition"
                                        title="Duplicar"
                                    >
                                        <Copy size={13} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(banner.id, e)}
                                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded transition"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* === PANEL DE DETALLE === */}
            <div className="flex-1 bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative h-full">
                {(!selectedBannerId && !isCreating) ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-4">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/5 shadow-inner">
                            <Monitor size={40} className="opacity-20" />
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-medium text-gray-300">Selecciona un banner</p>
                            <p className="text-sm">Edita su contenido, medios y configuracion.</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col h-full">
                        {/* Header */}
                        <div className="px-4 md:px-8 py-4 md:py-5 border-b border-white/5 bg-[#161616] flex flex-wrap gap-3 md:gap-4 justify-between items-center shrink-0 z-10">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-3">
                                    {isCreating ? "Crear Banner Especial" : "Editar Banner Especial"}
                                    <span className="text-[10px] font-mono font-normal text-gray-500 bg-black/30 px-2 py-0.5 rounded border border-white/5">
                                        {formData.id ? formData.id.slice(0, 8) : "NEW"}
                                    </span>
                                </h2>
                            </div>

                            <div className="flex items-center gap-4 bg-black/20 p-1.5 rounded-xl border border-white/5">
                                <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all select-none border border-transparent ${formData.active ? "bg-green-500/10 text-green-400 border-green-500/20" : "hover:bg-white/5 text-gray-500"}`}>
                                    <input
                                        type="checkbox"
                                        checked={formData.active || false}
                                        onChange={e => setFormData({ ...formData, active: e.target.checked })}
                                        className="sr-only"
                                    />
                                    <div className={`w-2 h-2 rounded-full ${formData.active ? "bg-green-500 shadow-[0_0_5px_currentColor]" : "bg-gray-600"}`} />
                                    <span className="text-xs font-bold uppercase tracking-wider">{formData.active ? "Activo" : "Inactivo"}</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-primary hover:bg-white hover:text-black text-black px-6 py-2.5 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Guardar
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
                            <div className="max-w-5xl mx-auto space-y-6 md:space-y-10">

                                {/* 1. MEDIA */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Medios de Fondo</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-start">
                                        {/* Background Image */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-end">
                                                <label className="text-sm font-bold text-gray-200 flex items-center gap-2">
                                                    <ImageIcon size={16} className="text-primary" /> Imagen de Fondo
                                                </label>
                                                <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded">Poster / Fallback</span>
                                            </div>
                                            <div className="aspect-video w-full">
                                                <MediaUpload
                                                    type="image"
                                                    value={formData.background_image_url || ""}
                                                    onChange={(url) => setFormData({ ...formData, background_image_url: url })}
                                                    onRemove={() => setFormData({ ...formData, background_image_url: "" })}
                                                    className="bg-neutral-900/50 hover:bg-neutral-900 border-dashed border-white/20 hover:border-white/40 shadow-inner"
                                                />
                                            </div>
                                        </div>

                                        {/* Background Video */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-end">
                                                <label className="text-sm font-bold text-gray-200 flex items-center gap-2">
                                                    <Film size={16} className="text-purple-400" /> Video Loop (Opcional)
                                                </label>
                                                <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded">Desktop</span>
                                            </div>
                                            <div className="aspect-video w-full">
                                                <MediaUpload
                                                    type="video"
                                                    value={formData.background_video_url || ""}
                                                    onChange={(url) => setFormData({ ...formData, background_video_url: url })}
                                                    onRemove={() => setFormData({ ...formData, background_video_url: "" })}
                                                    className="bg-neutral-900/50 hover:bg-neutral-900 border-dashed border-white/20 hover:border-white/40 shadow-inner"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. BRANDING: Logo + Decoration */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Branding</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-start">
                                        {/* Logo */}
                                        <div className="space-y-3">
                                            <label className="text-sm font-bold text-gray-200 flex items-center gap-2">
                                                <ImageIcon size={16} className="text-yellow-400" /> Logo del Evento
                                            </label>
                                            <p className="text-[10px] text-gray-500">Aparece a la izquierda del titulo. Ej: escudo del mundial.</p>
                                            <div className="aspect-square w-full max-w-[200px]">
                                                <MediaUpload
                                                    type="image"
                                                    value={formData.logo_url || ""}
                                                    onChange={(url) => setFormData({ ...formData, logo_url: url })}
                                                    onRemove={() => setFormData({ ...formData, logo_url: "" })}
                                                    className="bg-neutral-900/50 hover:bg-neutral-900 border-dashed border-white/20 hover:border-white/40 shadow-inner"
                                                />
                                            </div>
                                        </div>

                                        {/* Decoration */}
                                        <div className="space-y-3">
                                            <label className="text-sm font-bold text-gray-200 flex items-center gap-2">
                                                <ImageIcon size={16} className="text-blue-400" /> Imagen Decorativa
                                            </label>
                                            <p className="text-[10px] text-gray-500">Flotante a la derecha. Ej: trofeo, balon, escudo grande.</p>
                                            <div className="aspect-square w-full max-w-[200px]">
                                                <MediaUpload
                                                    type="image"
                                                    value={formData.decoration_image_url || ""}
                                                    onChange={(url) => setFormData({ ...formData, decoration_image_url: url })}
                                                    onRemove={() => setFormData({ ...formData, decoration_image_url: "" })}
                                                    className="bg-neutral-900/50 hover:bg-neutral-900 border-dashed border-white/20 hover:border-white/40 shadow-inner"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* LIVE PREVIEW */}
                                <div className="rounded-2xl border border-white/10 overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => setPreviewOpen(p => !p)}
                                        className="w-full flex items-center justify-between px-5 py-3 bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                                    >
                                        <span className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-widest">
                                            <Eye size={14} className="text-primary" /> Vista Previa
                                        </span>
                                        <div className="flex items-center gap-3">
                                            {previewOpen && (
                                                <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/10" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewMode("desktop")}
                                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${previewMode === "desktop" ? "bg-white text-black" : "text-gray-500 hover:text-white"}`}
                                                    >
                                                        <Monitor size={11} /> Desktop
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewMode("mobile")}
                                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${previewMode === "mobile" ? "bg-white text-black" : "text-gray-500 hover:text-white"}`}
                                                    >
                                                        <Smartphone size={11} /> Mobile
                                                    </button>
                                                </div>
                                            )}
                                            <ChevronDown size={14} className={`text-gray-500 transition-transform ${previewOpen ? "rotate-180" : ""}`} />
                                        </div>
                                    </button>

                                    {previewOpen && (
                                        <div className="p-4 bg-black/20">
                                            <div className={`mx-auto transition-all duration-300 ${previewMode === "mobile" ? "max-w-[390px]" : "w-full"}`}>
                                                {/* Simulated Banner Preview */}
                                                <div className="relative rounded-2xl overflow-hidden bg-black/90 border border-white/10 min-h-[180px] md:min-h-[220px]">
                                                    {/* Background */}
                                                    <div className="absolute inset-0 bg-neutral-900">
                                                        {formData.background_image_url ? (
                                                            <img
                                                                src={formData.background_image_url}
                                                                alt=""
                                                                className="w-full h-full object-cover opacity-60 brightness-75"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900" />
                                                        )}
                                                        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
                                                    </div>

                                                    {/* Content */}
                                                    <div className="relative px-5 md:px-10 py-6 md:py-8 flex items-center justify-between z-10">
                                                        <div className="flex flex-col gap-2 max-w-[70%]">
                                                            {/* Badges */}
                                                            {(formData.badge_primary_text || formData.badge_secondary_text) && (
                                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                                    {formData.badge_primary_text && (
                                                                        <span className="px-2 py-[2px] bg-white text-black text-[7px] md:text-[9px] font-black uppercase tracking-widest rounded-full border border-white">
                                                                            {formData.badge_primary_text}
                                                                        </span>
                                                                    )}
                                                                    {formData.badge_secondary_text && (
                                                                        <div className="flex items-center gap-1 bg-black/40 text-[#FFD700] border border-[#FFD700]/30 px-2 py-0.5 rounded-full">
                                                                            <IconPreview className="w-2.5 h-2.5 fill-current" />
                                                                            <span className="text-[7px] md:text-[9px] font-bold tracking-wider uppercase">{formData.badge_secondary_text}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Title with logo */}
                                                            <div className="flex items-center gap-2 md:gap-4">
                                                                {formData.logo_url && (
                                                                    <div className="relative h-8 w-6 md:h-14 md:w-12 flex-shrink-0">
                                                                        <img src={formData.logo_url} alt="" className="w-full h-full object-contain" />
                                                                    </div>
                                                                )}
                                                                <h3 className={`font-black uppercase text-white tracking-tighter leading-none ${previewMode === "mobile" ? "text-2xl" : "text-4xl md:text-5xl"}`}>
                                                                    {formData.title || "TITULO"}
                                                                </h3>
                                                            </div>

                                                            {/* Subtitle */}
                                                            {formData.subtitle && (
                                                                <p className={`text-gray-300 font-medium mt-1 ${previewMode === "mobile" ? "text-[10px]" : "text-sm"}`}>
                                                                    {formData.subtitle}
                                                                </p>
                                                            )}

                                                            {/* CTA */}
                                                            {formData.button_text && previewMode === "mobile" && (
                                                                <div className="mt-2">
                                                                    <span className="inline-flex items-center gap-1.5 bg-white text-black px-4 py-1.5 rounded-full font-bold uppercase text-[8px] tracking-widest">
                                                                        {formData.button_text}
                                                                        <ArrowRight className="w-2.5 h-2.5" />
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Decoration */}
                                                        {formData.decoration_image_url && (
                                                            <div className={`absolute right-2 bottom-0 pointer-events-none ${previewMode === "mobile" ? "w-16 h-16 opacity-40" : "w-32 h-32 md:w-48 md:h-48"}`}>
                                                                <img src={formData.decoration_image_url} alt="" className="w-full h-full object-contain" />
                                                            </div>
                                                        )}

                                                        {/* Desktop CTA */}
                                                        {formData.button_text && previewMode === "desktop" && (
                                                            <div className="flex-shrink-0 z-20">
                                                                <span className="inline-flex items-center gap-2 bg-white text-black px-5 py-2 rounded-full font-bold uppercase text-[10px] tracking-widest">
                                                                    {formData.button_text}
                                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Destination */}
                                                    <div className="absolute bottom-1.5 right-2 z-20">
                                                        <span className="text-[8px] font-mono bg-black/60 text-gray-400 px-1.5 py-0.5 rounded border border-white/10">
                                                            {formData.link_url || "/catalogo"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <hr className="border-white/5" />

                                {/* 3. CONTENT */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8">
                                    {/* Left: Text Fields */}
                                    <div className="md:col-span-7 space-y-6">
                                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Contenido</h3>

                                        <div className="space-y-6 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                                            <div className="flex gap-4">
                                                <div className="flex-1 space-y-2">
                                                    <label className="text-xs font-bold text-gray-400 ml-1">TITULO PRINCIPAL</label>
                                                    <input
                                                        value={formData.title || ""}
                                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white font-bold text-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-700 uppercase"
                                                        placeholder="EJ: MUNDIAL 2026"
                                                    />
                                                </div>
                                                <div className="w-24 space-y-2">
                                                    <label className="text-xs font-bold text-gray-400 ml-1">ORDEN</label>
                                                    <input
                                                        type="number"
                                                        value={formData.sort_order || 0}
                                                        onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white font-bold text-lg text-center font-mono focus:border-white/30 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 ml-1">SUBTITULO</label>
                                                <input
                                                    value={formData.subtitle || ""}
                                                    onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-700"
                                                    placeholder="Todas las selecciones, en un solo lugar."
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 ml-1">TEXTO DEL BOTON CTA</label>
                                                <input
                                                    value={formData.button_text || ""}
                                                    onChange={e => setFormData({ ...formData, button_text: e.target.value })}
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-700"
                                                    placeholder="Explorar Coleccion"
                                                />
                                            </div>

                                            {/* Badges */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-400 ml-1">BADGE PRINCIPAL</label>
                                                    <input
                                                        value={formData.badge_primary_text || ""}
                                                        onChange={e => setFormData({ ...formData, badge_primary_text: e.target.value })}
                                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-primary outline-none transition-all placeholder:text-gray-700"
                                                        placeholder="Coleccion Oficial"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-400 ml-1">BADGE SECUNDARIO</label>
                                                    <input
                                                        value={formData.badge_secondary_text || ""}
                                                        onChange={e => setFormData({ ...formData, badge_secondary_text: e.target.value })}
                                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-primary outline-none transition-all placeholder:text-gray-700"
                                                        placeholder="Todas las Selecciones"
                                                    />
                                                </div>
                                            </div>

                                            {/* Icon selector */}
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 ml-1">ICONO DEL BADGE SECUNDARIO</label>
                                                <div className="flex gap-2">
                                                    {ICON_OPTIONS.map(opt => (
                                                        <button
                                                            key={opt.value}
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, badge_secondary_icon: opt.value })}
                                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-bold ${
                                                                formData.badge_secondary_icon === opt.value
                                                                    ? "bg-white/10 border-white/30 text-white"
                                                                    : "border-white/10 text-gray-500 hover:text-white hover:bg-white/5"
                                                            }`}
                                                        >
                                                            <opt.Icon className="w-4 h-4" />
                                                            <span className="text-xs">{opt.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Link Config */}
                                    <div className="md:col-span-5 space-y-6">
                                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Destino</h3>

                                        <div className="bg-neutral-900 border border-white/10 p-6 rounded-2xl space-y-6 shadow-xl">
                                            <div className="space-y-3">
                                                <label className="text-xs font-bold text-white flex items-center gap-2">
                                                    <LinkIcon size={14} className="text-primary" /> URL DE DESTINO
                                                </label>
                                                <input
                                                    value={formData.link_url || ""}
                                                    onChange={e => setFormData({ ...formData, link_url: e.target.value })}
                                                    className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-sm text-white font-mono focus:border-primary/50 outline-none"
                                                    placeholder="/catalogo?categoria=Mundial2026"
                                                />
                                                <p className="text-[10px] text-gray-500">
                                                    Puede ser una ruta interna (/catalogo?...) o una URL completa.
                                                </p>
                                            </div>

                                            <div className="pt-4 border-t border-white/5">
                                                <p className="text-[10px] text-gray-500 mb-1">Destino Final:</p>
                                                <code className="block w-full bg-black/50 p-2 rounded text-[10px] text-primary break-all border border-white/5 font-mono">
                                                    {formData.link_url || "/catalogo"}
                                                </code>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </form>
                )}
            </div>

            <ConfirmDialog
                open={deleteTarget !== null}
                title="Eliminar banner especial"
                message="Borrar permanentemente este banner especial? Esta accion no se puede deshacer."
                confirmLabel="Eliminar"
                onConfirm={() => { if (deleteTarget) executeDelete(deleteTarget); setDeleteTarget(null); }}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
