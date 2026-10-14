import React from "react";
import { Sparkles, Link as LinkIcon, ExternalLink } from "lucide-react";
import { SpecialBanner, ICON_OPTIONS } from "./types";

interface SpecialBannerContentSectionProps {
    formData: Partial<SpecialBanner>;
    onTitleChange: (newTitle: string) => void;
    onSlugChange: (newSlug: string) => void;
    onUpdateField: (field: keyof SpecialBanner, value: unknown) => void;
}

export default function SpecialBannerContentSection({
    formData,
    onTitleChange,
    onSlugChange,
    onUpdateField,
}: SpecialBannerContentSectionProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8">
            {/* Text Fields */}
            <div className="md:col-span-7 space-y-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Textos del Banner</h3>

                <div className="space-y-6 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                            <label className="text-xs font-bold text-gray-400 ml-1">TÍTULO PRINCIPAL</label>
                            <input
                                value={formData.title || ""}
                                onChange={e => onTitleChange(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white font-bold text-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-700 uppercase"
                                placeholder="EJ: EL CLÁSICO"
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
                        <label className="text-xs font-bold text-gray-400 ml-1">SUBTÍTULO</label>
                        <input
                            value={formData.subtitle || ""}
                            onChange={e => onUpdateField("subtitle", e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-700"
                            placeholder="Las mejores camisetas de Real Madrid y Barcelona frente a frente."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 ml-1">TEXTO DEL BOTÓN CTA</label>
                        <input
                            value={formData.button_text || ""}
                            onChange={e => onUpdateField("button_text", e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-700"
                            placeholder="Ver Colección El Clásico"
                        />
                    </div>

                    {/* Badges */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 ml-1">BADGE PRINCIPAL</label>
                            <input
                                value={formData.badge_primary_text || ""}
                                onChange={e => onUpdateField("badge_primary_text", e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-primary outline-none transition-all placeholder:text-gray-700"
                                placeholder="Edición Especial"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 ml-1">BADGE SECUNDARIO</label>
                            <input
                                value={formData.badge_secondary_text || ""}
                                onChange={e => onUpdateField("badge_secondary_text", e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-primary outline-none transition-all placeholder:text-gray-700"
                                placeholder="Partidazo LaLiga"
                            />
                        </div>
                    </div>

                    {/* Icon selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 ml-1">ICONO DEL BADGE SECUNDARIO</label>
                        <div className="flex gap-2 flex-wrap">
                            {ICON_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => onUpdateField("badge_secondary_icon", opt.value)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-bold cursor-pointer ${
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

            {/* Link & URL Config */}
            <div className="md:col-span-5 space-y-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Destino y Colección</h3>

                <div className="bg-neutral-900 border border-white/10 p-6 rounded-2xl space-y-6 shadow-xl">
                    {/* Slug field */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-white flex items-center gap-2">
                                <Sparkles size={14} className="text-primary" /> SLUG DE LA COLECCIÓN
                            </label>
                            <span className="text-[10px] text-gray-400 font-mono">/coleccion/[slug]</span>
                        </div>
                        <input
                            value={formData.slug || ""}
                            onChange={e => onSlugChange(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-sm text-white font-mono focus:border-primary/50 outline-none"
                            placeholder="el-clasico"
                        />
                        <p className="text-[10px] text-gray-500">
                            Identificador único de la URL. Si lo dejas vacío, se generará a partir del título.
                        </p>
                    </div>

                    {/* link_url field */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-white flex items-center gap-2">
                            <LinkIcon size={14} className="text-primary" /> URL DE DESTINO AL HACER CLIC
                        </label>
                        <input
                            value={formData.link_url || ""}
                            onChange={e => onUpdateField("link_url", e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-sm text-white font-mono focus:border-primary/50 outline-none"
                            placeholder="/coleccion/el-clasico"
                        />
                        <p className="text-[10px] text-gray-500">
                            Por defecto lleva a la página de la colección especial (`/coleccion/${formData.slug || "..."}`).
                        </p>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <div className="flex justify-between items-center mb-1.5">
                            <p className="text-[10px] text-gray-400 font-medium">Ruta Final:</p>
                            {formData.slug && (
                                <a
                                    href={`/coleccion/${formData.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-primary hover:underline flex items-center gap-1 font-bold"
                                >
                                    Abrir Colección <ExternalLink size={10} />
                                </a>
                            )}
                        </div>
                        <code className="block w-full bg-black/50 p-2.5 rounded-lg text-[11px] text-primary break-all border border-white/5 font-mono">
                            {formData.link_url || (formData.slug ? `/coleccion/${formData.slug}` : "/catalogo")}
                        </code>
                    </div>
                </div>
            </div>
        </div>
    );
}
