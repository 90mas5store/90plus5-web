import React from "react";
import { Link as LinkIcon } from "lucide-react";
import { Banner, CatalogFilterOption } from "./types";

interface BannerContentSectionProps {
    formData: Partial<Banner>;
    onUpdateField: (field: keyof Banner, value: unknown) => void;
    linkType: "catalog" | "custom";
    setLinkType: (type: "catalog" | "custom") => void;
    selectedCatalogFilter: "all" | "category" | "league";
    setSelectedCatalogFilter: (filter: "all" | "category" | "league") => void;
    selectedSlug: string;
    setSelectedSlug: (slug: string) => void;
    categories: CatalogFilterOption[];
    leagues: CatalogFilterOption[];
}

export default function BannerContentSection({
    formData,
    onUpdateField,
    linkType,
    setLinkType,
    selectedCatalogFilter,
    setSelectedCatalogFilter,
    selectedSlug,
    setSelectedSlug,
    categories,
    leagues,
}: BannerContentSectionProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8">
            {/* Columna Izquierda: Textos */}
            <div className="md:col-span-7 space-y-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Contenido del Banner</h3>

                <div className="space-y-6 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                            <label className="text-xs font-bold text-gray-400 ml-1">TÍTULO PRINCIPAL</label>
                            <input
                                value={formData.title || ""}
                                onChange={e => onUpdateField("title", e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white font-bold text-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-700"
                                placeholder="EJ: NUEVA COLECCIÓN 2026"
                            />
                        </div>
                        <div className="w-24 space-y-2">
                            <label className="text-xs font-bold text-gray-400 ml-1">ORDEN</label>
                            <input
                                type="number"
                                value={formData.sort_order || 0}
                                onChange={e => onUpdateField("sort_order", parseInt(e.target.value) || 0)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white font-bold text-lg text-center font-mono focus:border-white/30 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 ml-1">SUBTÍTULO / DESCRIPCIÓN</label>
                        <textarea
                            value={formData.description || ""}
                            onChange={e => onUpdateField("description", e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm min-h-[100px] resize-y focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-700"
                            placeholder="Escribe una descripción inspiradora corta..."
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-400 ml-1">TEXTO DEL BOTÓN CTA</label>
                            <button
                                type="button"
                                onClick={() => onUpdateField("show_button", !formData.show_button)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all border text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                                    formData.show_button
                                        ? "bg-primary/10 text-primary border-primary/20"
                                        : "text-gray-600 border-white/10 hover:bg-white/5"
                                }`}
                            >
                                <div className={`w-2 h-2 rounded-full transition-colors ${formData.show_button ? "bg-primary" : "bg-gray-600"}`} />
                                {formData.show_button ? "Visible" : "Oculto"}
                            </button>
                        </div>
                        <input
                            value={formData.button_text || ""}
                            onChange={e => onUpdateField("button_text", e.target.value)}
                            className={`w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-700 ${
                                !formData.show_button ? "opacity-40" : ""
                            }`}
                            placeholder="Ver Colección"
                        />
                    </div>
                </div>
            </div>

            {/* Columna Derecha: Configuración de Destino */}
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
                                onClick={() => setLinkType("catalog")}
                                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                                    linkType === "catalog" ? "bg-white text-black shadow" : "text-gray-500 hover:text-white"
                                }`}
                            >
                                Catálogo
                            </button>
                            <button
                                type="button"
                                onClick={() => setLinkType("custom")}
                                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                                    linkType === "custom" ? "bg-white text-black shadow" : "text-gray-500 hover:text-white"
                                }`}
                            >
                                Manual URL
                            </button>
                        </div>
                    </div>

                    {linkType === "catalog" ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div>
                                <label className="text-[10px] text-gray-500 font-bold mb-1 block uppercase">Filtrar Por</label>
                                <select
                                    value={selectedCatalogFilter}
                                    onChange={e => {
                                        setSelectedCatalogFilter(e.target.value as "all" | "category" | "league");
                                        setSelectedSlug("");
                                    }}
                                    className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-primary/50"
                                >
                                    <option value="all">Todo el Catálogo</option>
                                    <option value="category">Categoría</option>
                                    <option value="league">Liga</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] text-gray-500 font-bold mb-1 block uppercase">
                                    Seleccionar {selectedCatalogFilter === "league" ? "Liga" : "Categoría"}
                                </label>
                                <select
                                    value={selectedSlug}
                                    onChange={e => setSelectedSlug(e.target.value)}
                                    disabled={selectedCatalogFilter === "all"}
                                    className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">-- General --</option>
                                    {selectedCatalogFilter === "category" &&
                                        categories.map(c => (
                                            <option key={c.id} value={c.slug}>
                                                {c.name}
                                            </option>
                                        ))}
                                    {selectedCatalogFilter === "league" &&
                                        leagues.map(l => (
                                            <option key={l.id} value={l.slug}>
                                                {l.name}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="text-[10px] text-gray-500 font-bold mb-1 block uppercase">URL Completa</label>
                            <input
                                value={formData.link_url || ""}
                                onChange={e => onUpdateField("link_url", e.target.value)}
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
    );
}
