"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Plus, Trash2, Edit, Save, X, Image as ImageIcon,
    Link as LinkIcon, Monitor, Smartphone, Eye,
    MoreVertical, CheckCircle, AlertCircle, ArrowUp, ArrowDown, Search, Film, Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";
import ImageUpload from "@/components/admin/ImageUpload";
import MediaUpload from "@/components/admin/MediaUpload";
import Image from "next/image";
import { clearProductCache } from "@/lib/api";
import { logAdminAction } from "@/lib/logger";

interface Banner {
    id: string;
    title: string;
    description: string;
    image_url: string;
    video_url?: string;
    link_url: string;
    button_text: string;
    active: boolean;
    show_on_home: boolean;
    sort_order: number;
}

export default function BannersPage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBannerId, setSelectedBannerId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<Banner>>({});

    // Data for Selectors
    const [categories, setCategories] = useState<{ id: string, name: string, slug: string }[]>([]);
    const [leagues, setLeagues] = useState<{ id: string, name: string, slug: string }[]>([]);
    const [linkType, setLinkType] = useState<'catalog' | 'custom'>('catalog');
    const [selectedCatalogFilter, setSelectedCatalogFilter] = useState<'all' | 'category' | 'league'>('all');
    const [selectedSlug, setSelectedSlug] = useState('');

    const supabase = createClient();

    // === DATA FETCHING ===
    useEffect(() => {
        fetchBanners();
        fetchMetadata();
    }, []);

    const fetchMetadata = async () => {
        const [catRes, leagueRes] = await Promise.all([
            supabase.from("categories").select("id, name, slug"),
            supabase.from("leagues").select("id, name, slug")
        ]);
        setCategories(catRes.data || []);
        setLeagues(leagueRes.data || []);
    };

    const fetchBanners = async () => {
        try {
            const { data, error } = await supabase
                .from("banners")
                .select("*")
                .order("sort_order", { ascending: true });
            if (error) throw error;
            setBanners(data || []);
        } catch (error) {
            toast.error("Error al cargar banners");
        } finally {
            setLoading(false);
        }
    };

    // === LOGIC ===
    const handleSelectBanner = (banner: Banner) => {
        setIsCreating(false);
        setSelectedBannerId(banner.id);
        setFormData(banner);

        // Parse Link logic
        if (banner.link_url && banner.link_url.startsWith('/catalogo')) {
            setLinkType('catalog');
            if (banner.link_url.includes('categoria=')) {
                setSelectedCatalogFilter('category');
                setSelectedSlug(banner.link_url.split('categoria=')[1]);
            } else if (banner.link_url.includes('liga=')) {
                setSelectedCatalogFilter('league');
                setSelectedSlug(banner.link_url.split('liga=')[1]);
            } else {
                setSelectedCatalogFilter('all');
                setSelectedSlug('');
            }
        } else {
            setLinkType('custom');
            setSelectedCatalogFilter('all');
            setSelectedSlug('');
        }
    };

    const handleCreateNew = () => {
        setIsCreating(true);
        setSelectedBannerId(null);
        // Default Values
        setFormData({
            title: "",
            description: "",
            active: true,
            show_on_home: true,
            sort_order: (banners.length > 0 ? Math.max(...banners.map(b => b.sort_order)) : 0) + 10,
            button_text: "Ver Colección",
            link_url: "/catalogo"
        });
        setLinkType('catalog');
        setSelectedCatalogFilter('all');
    };

    // Update link_url when selectors change
    useEffect(() => {
        if (!selectedBannerId && !isCreating) return;

        if (linkType === 'custom') {
            // User edits manually field, do nothing here unless we want to reset
        } else {
            let url = '/catalogo';
            if (selectedCatalogFilter === 'category' && selectedSlug) url += `?categoria=${selectedSlug}`;
            if (selectedCatalogFilter === 'league' && selectedSlug) url += `?liga=${selectedSlug}`;

            setFormData(prev => ({ ...prev, link_url: url }));
        }
    }, [linkType, selectedCatalogFilter, selectedSlug, selectedBannerId, isCreating]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Validación: Al menos uno de los dos medios debe existir
        if (!formData.image_url && !formData.video_url) {
            return toast.error("Debes subir una Imagen o un Video");
        }

        const payload = { ...formData }; // Clone to avoid side effects

        try {
            if (selectedBannerId) {
                const { error } = await supabase.from("banners").update(payload).eq("id", selectedBannerId);
                if (error) throw error;
                toast.success("Actualizado correctamente");
                logAdminAction('UPDATE_BANNER', { id: selectedBannerId, title: payload.title });
            } else {
                // Create
                const { error } = await supabase.from("banners").insert([{ ...payload, active: true }]);
                if (error) throw error;
                toast.success("Creado correctamente");
                logAdminAction('CREATE_BANNER', { title: payload.title });
                setIsCreating(false);
            }

            fetchBanners();
            clearProductCache('config');
        } catch (error) {
            toast.error("Error al guardar");
        }
    };

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!confirm("¿Borrar permanentemente?")) return;

        const bannerToDelete = banners.find(b => b.id === id);

        try {
            await supabase.from("banners").delete().eq("id", id);
            toast.success("Eliminado");

            logAdminAction('DELETE_BANNER', {
                id,
                title: bannerToDelete?.title || 'Unknown',
                image: bannerToDelete?.image_url
            }, 'warning');

            setBanners(prev => prev.filter(b => b.id !== id));
            if (selectedBannerId === id) {
                setSelectedBannerId(null);
                setIsCreating(false);
            }
            clearProductCache('config');
        } catch (e) { toast.error("Error al eliminar"); }
    };

    const handleToggleActive = async (banner: Banner, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            // Optimistic update
            const newStatus = !banner.active;
            setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, active: newStatus } : b));

            if (selectedBannerId === banner.id) {
                setFormData(prev => ({ ...prev, active: newStatus }));
            }

            await supabase.from("banners").update({ active: newStatus }).eq("id", banner.id);
            clearProductCache('config');
        } catch (e) {
            toast.error("Error update");
            fetchBanners(); // Revert
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 animate-in fade-in duration-500 h-[calc(100vh-140px)]">

            {/* === LISTA LATERAL (Master) === */}
            <div className="w-full md:w-80 flex flex-col bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex-shrink-0">
                {/* Header Lista */}
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div>
                        <h2 className="text-base font-bold text-white tracking-wide">Banners</h2>
                        <p className="text-xs text-gray-500 font-medium">{banners.length} elementos</p>
                    </div>
                    <button
                        onClick={handleCreateNew}
                        className="w-8 h-8 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-all shadow-lg shadow-white/10"
                        title="Nuevo Banner"
                    >
                        <Plus size={18} />
                    </button>
                </div>

                {/* Lista Scrollable */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {loading ? (
                        <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-gray-600" /></div>
                    ) : banners.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-xs flex flex-col items-center">
                            <ImageIcon size={24} className="mb-2 opacity-30" />
                            Sin banners. Crea uno nuevo.
                        </div>
                    ) : (
                        banners.map(banner => (
                            <div
                                key={banner.id}
                                onClick={() => handleSelectBanner(banner)}
                                className={`
                                group relative flex items-center gap-3 p-2 pr-3 rounded-xl cursor-pointer transition-all duration-300 border
                                ${selectedBannerId === banner.id
                                        ? 'bg-white/10 border-white/20 shadow-inner'
                                        : 'bg-transparent border-transparent hover:bg-white/5'
                                    }
                            `}
                            >
                                {/* Thumbnail */}
                                <div className="w-14 h-10 relative rounded-lg overflow-hidden bg-black shrink-0 border border-white/10 shadow-sm">
                                    {banner.image_url ? (
                                        <Image src={banner.image_url} fill alt="" className="object-cover" sizes="56px" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-neutral-800"><ImageIcon size={12} className="text-gray-600" /></div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className={`text-xs font-bold truncate ${selectedBannerId === banner.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                        {banner.title || <span className="italic opacity-50">Sin título</span>}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border ${banner.active
                                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                            : 'bg-gray-700/30 text-gray-500 border-gray-600/30'
                                            }`}>
                                            {banner.active ? 'ACTIVO' : 'INACTIVO'}
                                        </div>
                                        {banner.show_on_home && <span className="text-[9px] text-blue-400 font-bold" title="Visible en Home">HOME</span>}
                                        <span className="ml-auto text-[9px] text-gray-600 font-mono">#{banner.sort_order}</span>
                                    </div>
                                </div>

                                {/* Actions Quick */}
                                <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 rounded-lg p-1 flex gap-1 backdrop-blur-sm border border-white/10 shadow-xl">
                                    <button
                                        onClick={(e) => handleDelete(banner.id, e)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded transition"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>


            {/* === PANEL DE DETALLE (Main) === */}
            <div className="flex-1 bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative h-full">

                {(!selectedBannerId && !isCreating) ? (
                    // EMPTY STATE
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-4">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/5 shadow-inner">
                            <Monitor size={40} className="opacity-20" />
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-medium text-gray-300">Selecciona un banner</p>
                            <p className="text-sm">Edita sus detalles visuales y de enlace.</p>
                        </div>
                    </div>
                ) : (
                    // EDIT FORM
                    <form onSubmit={handleSubmit} className="flex flex-col h-full">

                        {/* --- HEADER FORMULARIO (CONTROLES AQUI) --- */}
                        <div className="px-8 py-5 border-b border-white/5 bg-[#161616] flex flex-wrap gap-4 justify-between items-center shrink-0 z-10">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-3">
                                    {isCreating ? "Crear Nuevo Banner" : "Editar Banner"}
                                    <span className="text-[10px] font-mono font-normal text-gray-500 bg-black/30 px-2 py-0.5 rounded border border-white/5">
                                        {formData.id ? formData.id.slice(0, 8) : 'NEW'}
                                    </span>
                                </h2>
                            </div>

                            {/* GLOBAL CONTROLS */}
                            <div className="flex items-center gap-4 bg-black/20 p-1.5 rounded-xl border border-white/5">

                                {/* Switch ACTIVO */}
                                <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all select-none border border-transparent ${formData.active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'hover:bg-white/5 text-gray-500'}`}>
                                    <input
                                        type="checkbox"
                                        checked={formData.active || false}
                                        onChange={e => setFormData({ ...formData, active: e.target.checked })}
                                        className="sr-only"
                                    />
                                    <div className={`w-2 h-2 rounded-full ${formData.active ? 'bg-green-500 shadow-[0_0_5px_currentColor]' : 'bg-gray-600'}`} />
                                    <span className="text-xs font-bold uppercase tracking-wider">{formData.active ? 'Sistema Activo' : 'Sistema Inactivo'}</span>
                                </label>

                                <div className="w-px h-4 bg-white/10" />

                                {/* Switch HOME */}
                                <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all select-none border border-transparent ${formData.show_on_home ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'hover:bg-white/5 text-gray-500'}`}>
                                    <input
                                        type="checkbox"
                                        checked={formData.show_on_home || false}
                                        onChange={e => setFormData({ ...formData, show_on_home: e.target.checked })}
                                        className="sr-only"
                                    />
                                    <Monitor size={14} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Visible en Home</span>
                                </label>
                            </div>

                            <button type="submit" className="bg-primary hover:bg-white hover:text-black text-black px-6 py-2.5 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95">
                                <Save size={18} /> Guardar
                            </button>
                        </div>

                        {/* --- BODY FORMULARIO --- */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                            <div className="max-w-5xl mx-auto space-y-10">

                                {/* 1. SECCIÓN MEDIA (Wide) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                    {/* Imagen Principal */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <label className="text-sm font-bold text-gray-200 flex items-center gap-2">
                                                <ImageIcon size={16} className="text-primary" /> Imagen / Poster
                                            </label>
                                            <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded">Recomendado</span>
                                        </div>

                                        <div className="aspect-video w-full">
                                            <MediaUpload
                                                type="image"
                                                value={formData.image_url || ""}
                                                onChange={(url) => setFormData({ ...formData, image_url: url })}
                                                onRemove={() => setFormData({ ...formData, image_url: "" })}
                                                className="bg-neutral-900/50 hover:bg-neutral-900 border-dashed border-white/20 hover:border-white/40 shadow-inner"
                                            />
                                        </div>
                                    </div>

                                    {/* Video Loop */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <label className="text-sm font-bold text-gray-200 flex items-center gap-2">
                                                <Film size={16} className="text-purple-400" /> Video Loop (Opcional)
                                            </label>
                                            <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded">Desktop Only</span>
                                        </div>
                                        <div className="aspect-video w-full">
                                            <MediaUpload
                                                type="video"
                                                value={formData.video_url || ""}
                                                onChange={(url) => setFormData({ ...formData, video_url: url })}
                                                onRemove={() => setFormData({ ...formData, video_url: "" })}
                                                className="bg-neutral-900/50 hover:bg-neutral-900 border-dashed border-white/20 hover:border-white/40 shadow-inner"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-white/5" />

                                {/* 2. CONTENIDO & CONFIGURACIÓN */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                                    {/* Columna Izquierda: Textos (8/12) */}
                                    <div className="md:col-span-7 space-y-6">
                                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Contenido del Banner</h3>

                                        <div className="space-y-6 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                                            <div className="flex gap-4">
                                                <div className="flex-1 space-y-2">
                                                    <label className="text-xs font-bold text-gray-400 ml-1">TÍTULO PRINCIPAL</label>
                                                    <input
                                                        value={formData.title || ""}
                                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white font-bold text-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-700"
                                                        placeholder="EJ: NUEVA COLECCIÓN 2026"
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
                                                <label className="text-xs font-bold text-gray-400 ml-1">SUBTÍTULO / DESCRIPCIÓN</label>
                                                <textarea
                                                    value={formData.description || ""}
                                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm min-h-[100px] resize-y focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-700"
                                                    placeholder="Escribe una descripción inspiradora corta..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Columna Derecha: Link y Resumen (4/12) */}
                                    <div className="md:col-span-5 space-y-6">
                                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Configuración de Destino</h3>

                                        <div className="bg-neutral-900 border border-white/10 p-6 rounded-2xl space-y-6 shadow-xl">
                                            <div className="space-y-3">
                                                <label className="text-xs font-bold text-white flex items-center gap-2">
                                                    <LinkIcon size={14} className="text-primary" /> TIPO DE ENLACE
                                                </label>
                                                <div className="flex bg-black p-1 rounded-lg border border-white/10">
                                                    <button
                                                        type="button"
                                                        onClick={() => setLinkType('catalog')}
                                                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${linkType === 'catalog' ? 'bg-white text-black shadow' : 'text-gray-500 hover:text-white'}`}
                                                    >
                                                        Catálogo
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setLinkType('custom')}
                                                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${linkType === 'custom' ? 'bg-white text-black shadow' : 'text-gray-500 hover:text-white'}`}
                                                    >
                                                        Manual URL
                                                    </button>
                                                </div>
                                            </div>

                                            {linkType === 'catalog' ? (
                                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                                    <div>
                                                        <label className="text-[10px] text-gray-500 font-bold mb-1 block uppercase">Filtrar Por</label>
                                                        <select
                                                            value={selectedCatalogFilter}
                                                            onChange={e => { setSelectedCatalogFilter(e.target.value as any); setSelectedSlug(''); }}
                                                            className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-primary/50"
                                                        >
                                                            <option value="all">Todo el Catálogo</option>
                                                            <option value="category">Categoría</option>
                                                            <option value="league">Liga</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] text-gray-500 font-bold mb-1 block uppercase">Seleccionar {selectedCatalogFilter === 'league' ? 'Liga' : 'Categoría'}</label>
                                                        <select
                                                            value={selectedSlug}
                                                            onChange={e => setSelectedSlug(e.target.value)}
                                                            disabled={selectedCatalogFilter === 'all'}
                                                            className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <option value="">-- General --</option>
                                                            {selectedCatalogFilter === 'category' && categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                                                            {selectedCatalogFilter === 'league' && leagues.map(l => <option key={l.id} value={l.slug}>{l.name}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="animate-in fade-in slide-in-from-top-2">
                                                    <label className="text-[10px] text-gray-500 font-bold mb-1 block uppercase">URL Completa</label>
                                                    <input
                                                        value={formData.link_url || ""}
                                                        onChange={e => setFormData({ ...formData, link_url: e.target.value })}
                                                        className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-sm text-white font-mono focus:border-primary/50 outline-none"
                                                        placeholder="https://..."
                                                    />
                                                </div>
                                            )}

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
        </div>
    );
}
