"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
    Search, X, Check, ArrowUp, ArrowDown,
    Trash2, Shirt, Sparkles, Filter, Loader2, Layers
} from "lucide-react";
import { motion, AnimatePresence } from "@/lib/motion";

export interface SelectedCollectionProduct {
    id: string;
    name: string;
    image_url: string;
    team_name?: string;
    price?: number;
    team_id?: string;
}

interface SpecialBannerProductSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    selectedProducts: SelectedCollectionProduct[];
    onChange: (products: SelectedCollectionProduct[]) => void;
    bannerTitle?: string;
}

interface RawProductData {
    id: string;
    name: string;
    image_url: string;
    team_id?: string;
    teams?: { name: string } | { name: string }[];
    product_variants?: { price: number; active: boolean }[];
}

interface TeamOption {
    id: string;
    name: string;
}

export default function SpecialBannerProductSelector({
    isOpen,
    onClose,
    selectedProducts,
    onChange,
    bannerTitle
}: SpecialBannerProductSelectorProps) {
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;

    const [loading, setLoading] = useState(false);
    const [teams, setTeams] = useState<TeamOption[]>([]);
    const [products, setProducts] = useState<SelectedCollectionProduct[]>([]);
    const [search, setSearch] = useState("");
    const [selectedTeamId, setSelectedTeamId] = useState<string>("all");
    const [activeTab, setActiveTab] = useState<"catalog" | "selected">("catalog");

    // Copia local para editar dentro del modal antes de confirmar si fuera necesario
    const [currentSelected, setCurrentSelected] = useState<SelectedCollectionProduct[]>(selectedProducts);

    useEffect(() => {
        if (isOpen) {
            setCurrentSelected(selectedProducts);
            loadTeams();
            loadProducts();
        }
    }, [isOpen, selectedProducts]);

    // Cargar equipos para filtro rápido
    const loadTeams = async () => {
        try {
            const { data } = await supabase
                .from("teams")
                .select("id, name")
                .eq("active", true)
                .order("name", { ascending: true });
            setTeams(data || []);
        } catch (e) {
            console.error("Error al cargar equipos:", e);
        }
    };

    // Cargar productos de la base de datos
    const loadProducts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("products")
                .select(`
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
                `)
                .eq("active", true)
                .order("name", { ascending: true })
                .limit(400);

            if (error) throw error;

            const mapped: SelectedCollectionProduct[] = (data || []).map((p: unknown) => {
                const item = p as RawProductData;
                const team = Array.isArray(item.teams) ? item.teams[0] : item.teams;
                const variants = item.product_variants || [];
                const activePrices = variants.filter(v => v.active).map(v => v.price);
                const minPrice = activePrices.length > 0 ? Math.min(...activePrices) : 0;

                return {
                    id: item.id,
                    name: item.name,
                    image_url: item.image_url,
                    team_name: team?.name || undefined,
                    team_id: item.team_id,
                    price: minPrice,
                };
            });

            setProducts(mapped);
        } catch (e) {
            console.error("Error al cargar productos para colección:", e);
        } finally {
            setLoading(false);
        }
    };

    // Filtrar catálogo disponible
    const filteredCatalog = useMemo(() => {
        let list = products;

        if (selectedTeamId !== "all") {
            list = list.filter(p => p.team_id === selectedTeamId);
        }

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p =>
                p.name.toLowerCase().includes(q) ||
                (p.team_name && p.team_name.toLowerCase().includes(q))
            );
        }

        return list;
    }, [products, selectedTeamId, search]);

    // IDs seleccionados actualmente
    const selectedIdsSet = useMemo(() => {
        return new Set(currentSelected.map(p => p.id));
    }, [currentSelected]);

    // Toggle selección
    const handleToggleProduct = (product: SelectedCollectionProduct) => {
        if (selectedIdsSet.has(product.id)) {
            setCurrentSelected(prev => prev.filter(p => p.id !== product.id));
        } else {
            setCurrentSelected(prev => [...prev, product]);
        }
    };

    // Reordenar hacia arriba
    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        setCurrentSelected(prev => {
            const copy = [...prev];
            const temp = copy[index - 1];
            copy[index - 1] = copy[index];
            copy[index] = temp;
            return copy;
        });
    };

    // Reordenar hacia abajo
    const handleMoveDown = (index: number) => {
        if (index === currentSelected.length - 1) return;
        setCurrentSelected(prev => {
            const copy = [...prev];
            const temp = copy[index + 1];
            copy[index + 1] = copy[index];
            copy[index] = temp;
            return copy;
        });
    };

    // Remover
    const handleRemove = (productId: string) => {
        setCurrentSelected(prev => prev.filter(p => p.id !== productId));
    };

    // Confirmar cambios
    const handleSaveAndClose = () => {
        onChange(currentSelected);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-[#121316] border border-white/10 rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-white/10 bg-[#18191d] flex items-center justify-between shrink-0">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                                <Sparkles size={16} />
                            </span>
                            <h2 className="text-lg font-black uppercase text-white tracking-wide">
                                Elegir Camisetas de la Colección
                            </h2>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            {bannerTitle ? `Banner: "${bannerTitle}"` : "Selecciona las prendas exactas que formarán esta colección"}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
                            <span className="text-xs text-gray-400 font-medium">Seleccionados:</span>
                            <span className="text-xs font-black text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                                {currentSelected.length}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Tabs móvil para alternar entre Catálogo y Seleccionados */}
                <div className="md:hidden flex border-b border-white/10 bg-black/40">
                    <button
                        type="button"
                        onClick={() => setActiveTab("catalog")}
                        className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition ${
                            activeTab === "catalog"
                                ? "border-primary text-primary bg-white/5"
                                : "border-transparent text-gray-400"
                        }`}
                    >
                        Catálogo Disponible
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("selected")}
                        className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition flex items-center justify-center gap-1.5 ${
                            activeTab === "selected"
                                ? "border-primary text-primary bg-white/5"
                                : "border-transparent text-gray-400"
                        }`}
                    >
                        Seleccionados ({currentSelected.length})
                    </button>
                </div>

                {/* Main Body */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Panel Izquierdo: Catálogo y Filtros */}
                    <div className={`flex-1 flex flex-col border-r border-white/10 ${activeTab === "selected" ? "hidden md:flex" : "flex"}`}>
                        {/* Filtros */}
                        <div className="p-4 border-b border-white/5 bg-black/20 flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Buscar por nombre de camiseta..."
                                    className="w-full pl-9 pr-4 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-primary"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                    >
                                        <X size={13} />
                                    </button>
                                )}
                            </div>

                            <div className="sm:w-56 shrink-0">
                                <select
                                    value={selectedTeamId}
                                    onChange={e => setSelectedTeamId(e.target.value)}
                                    className="w-full py-2 px-3 bg-black/50 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-primary cursor-pointer"
                                >
                                    <option value="all">⚡ Todos los equipos</option>
                                    {teams.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Lista de Productos del Catálogo */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {loading ? (
                                <div className="py-20 flex flex-col items-center justify-center text-gray-500 gap-3">
                                    <Loader2 size={24} className="animate-spin text-primary" />
                                    <span className="text-xs">Cargando productos del catálogo...</span>
                                </div>
                            ) : filteredCatalog.length === 0 ? (
                                <div className="py-20 text-center text-gray-500">
                                    <Shirt size={32} className="mx-auto mb-2 opacity-30" />
                                    <p className="text-xs">No se encontraron productos con los filtros aplicados</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {filteredCatalog.map(p => {
                                        const isSelected = selectedIdsSet.has(p.id);
                                        return (
                                            <div
                                                key={p.id}
                                                onClick={() => handleToggleProduct(p)}
                                                className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex gap-3 items-center group ${
                                                    isSelected
                                                        ? "bg-primary/10 border-primary text-white shadow-[0_0_15px_rgba(229,9,20,0.15)]"
                                                        : "bg-white/[0.02] border-white/5 hover:border-white/20 text-gray-300"
                                                }`}
                                            >
                                                {/* Thumbnail */}
                                                <div className="w-12 h-14 relative bg-black/50 rounded-xl overflow-hidden shrink-0 border border-white/5">
                                                    {p.image_url ? (
                                                        <Image
                                                            src={p.image_url}
                                                            alt={p.name}
                                                            fill
                                                            className="object-cover"
                                                            sizes="48px"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                            <Shirt size={14} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold truncate group-hover:text-white leading-tight">
                                                        {p.name}
                                                    </p>
                                                    {p.team_name && (
                                                        <p className="text-[10px] text-gray-400 truncate mt-0.5 font-medium">
                                                            {p.team_name}
                                                        </p>
                                                    )}
                                                    {p.price ? (
                                                        <p className="text-[10px] font-mono font-bold text-primary mt-1">
                                                            L {p.price.toLocaleString("es-HN")}
                                                        </p>
                                                    ) : null}
                                                </div>

                                                {/* Check indicator */}
                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                                                    isSelected
                                                        ? "bg-primary text-black border-primary"
                                                        : "border-white/10 text-transparent group-hover:border-white/30"
                                                }`}>
                                                    <Check size={13} strokeWidth={3} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Panel Derecho: Bandeja de Seleccionados (Colección Especial) */}
                    <div className={`w-full md:w-80 lg:w-96 flex flex-col bg-[#0e0f12] shrink-0 ${activeTab === "catalog" ? "hidden md:flex" : "flex"}`}>
                        <div className="px-4 py-3.5 border-b border-white/10 bg-black/30 flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                                <Layers size={14} className="text-primary" /> En la Colección ({currentSelected.length})
                            </span>
                            {currentSelected.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setCurrentSelected([])}
                                    className="text-[10px] font-bold text-red-400 hover:text-red-300 transition"
                                >
                                    Vaciar
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-2">
                            {currentSelected.length === 0 ? (
                                <div className="py-20 text-center text-gray-500 px-4">
                                    <Sparkles size={28} className="mx-auto mb-2 opacity-30 text-primary" />
                                    <p className="text-xs font-medium text-gray-400">Aún no has seleccionado productos</p>
                                    <p className="text-[11px] text-gray-600 mt-1">
                                        Filtra por equipo (ej. Real Madrid o Barcelona) y marca las camisetas que quieras incluir.
                                    </p>
                                </div>
                            ) : (
                                currentSelected.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3 group hover:border-white/20 transition"
                                    >
                                        <span className="text-[11px] font-mono font-bold text-gray-500 w-4 text-center">
                                            #{index + 1}
                                        </span>

                                        <div className="w-10 h-12 relative bg-black rounded-lg overflow-hidden shrink-0 border border-white/10">
                                            {item.image_url ? (
                                                <Image
                                                    src={item.image_url}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="40px"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                    <Shirt size={12} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-white truncate leading-tight">
                                                {item.name}
                                            </p>
                                            <p className="text-[10px] text-gray-400 truncate">
                                                {item.team_name || "Equipo"}
                                            </p>
                                        </div>

                                        {/* Reordenar y Quitar */}
                                        <div className="flex items-center gap-1">
                                            <div className="flex flex-col">
                                                <button
                                                    type="button"
                                                    onClick={() => handleMoveUp(index)}
                                                    disabled={index === 0}
                                                    className="p-1 text-gray-400 hover:text-white disabled:opacity-20 transition"
                                                    title="Mover arriba"
                                                >
                                                    <ArrowUp size={12} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleMoveDown(index)}
                                                    disabled={index === currentSelected.length - 1}
                                                    className="p-1 text-gray-400 hover:text-white disabled:opacity-20 transition"
                                                    title="Mover abajo"
                                                >
                                                    <ArrowDown size={12} />
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleRemove(item.id)}
                                                className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition"
                                                title="Remover de la colección"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/10 bg-[#18191d] flex items-center justify-between shrink-0">
                    <span className="text-xs text-gray-400">
                        {currentSelected.length} {currentSelected.length === 1 ? "prenda seleccionada" : "prendas seleccionadas"} en total
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveAndClose}
                            className="px-6 py-2 bg-primary hover:brightness-110 text-black font-black uppercase tracking-wider text-xs rounded-xl transition shadow-lg shadow-primary/20"
                        >
                            Guardar Selección
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
