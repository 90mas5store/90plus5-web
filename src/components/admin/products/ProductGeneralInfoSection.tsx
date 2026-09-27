'use client';

import React from 'react';
import { Tag, Sparkles, AlertCircle, CheckCircle, Loader2, ArrowUpDown, Info } from 'lucide-react';
import { AdminProductFormData, CatalogItem } from '@/types/adminProduct';

interface ProductGeneralInfoSectionProps {
    formData: AdminProductFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    teams: CatalogItem[];
    brands: CatalogItem[];
    categories: CatalogItem[];
    isAutoSlug: boolean;
    setIsAutoSlug: (val: boolean) => void;
    slugChecking: boolean;
    slugIsUnique: boolean | null;
    featuredProducts?: {
        id: string;
        name: string;
        sort_order: number;
        team_name?: string;
        teams?: { name: string } | { name: string }[] | null;
    }[];
    currentProductId?: string;
}

export default function ProductGeneralInfoSection({
    formData,
    onChange,
    teams,
    brands,
    categories,
    isAutoSlug,
    setIsAutoSlug,
    slugChecking,
    slugIsUnique,
    featuredProducts = [],
    currentProductId,
}: ProductGeneralInfoSectionProps) {
    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-neutral-800 pb-4">
                <Tag className="w-5 h-5 text-primary" /> Información General
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre */}
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Nombre del Producto *
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={onChange}
                        required
                        placeholder="Ej. Camiseta Titular Real Madrid 24/25"
                        className="w-full bg-neutral-800/60 border border-neutral-700/60 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                </div>

                {/* Slug */}
                <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Slug (URL del producto) *
                        </label>
                        <button
                            type="button"
                            onClick={() => setIsAutoSlug(!isAutoSlug)}
                            className={`text-xs flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                isAutoSlug
                                    ? 'bg-primary/20 text-primary border border-primary/30'
                                    : 'bg-neutral-800 text-gray-400 border border-neutral-700'
                            }`}
                        >
                            <Sparkles className="w-3 h-3" />
                            {isAutoSlug ? 'Auto-generado activo' : 'Manual'}
                        </button>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            name="slug"
                            value={formData.slug}
                            onChange={onChange}
                            required
                            placeholder="ej. camiseta-titular-real-madrid-24-25"
                            className={`w-full bg-neutral-800/60 border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all pr-10 font-mono text-sm ${
                                slugIsUnique === false
                                    ? 'border-red-500'
                                    : slugIsUnique === true
                                    ? 'border-emerald-500'
                                    : 'border-neutral-700/60'
                            }`}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {slugChecking && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                            {!slugChecking && slugIsUnique === true && (
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                            )}
                            {!slugChecking && slugIsUnique === false && (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                        </div>
                    </div>
                    {slugIsUnique === false && (
                        <p className="text-xs text-red-400 mt-1">Este slug ya existe. Se modificará automáticamente al guardar.</p>
                    )}
                </div>

                {/* Equipo */}
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Equipo
                    </label>
                    <select
                        name="team_id"
                        value={formData.team_id}
                        onChange={onChange}
                        className="w-full bg-neutral-800/60 border border-neutral-700/60 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    >
                        <option value="">Selecciona un equipo (opcional)...</option>
                        {teams.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Marca */}
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Marca
                    </label>
                    <select
                        name="brand_id"
                        value={formData.brand_id}
                        onChange={onChange}
                        className="w-full bg-neutral-800/60 border border-neutral-700/60 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    >
                        <option value="">Selecciona una marca (opcional)...</option>
                        {brands.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Categoría */}
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Categoría
                    </label>
                    <select
                        name="category_id"
                        value={formData.category_id}
                        onChange={onChange}
                        className="w-full bg-neutral-800/60 border border-neutral-700/60 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    >
                        <option value="">Selecciona una categoría...</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Temporada */}
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Temporada / Año
                    </label>
                    <input
                        type="text"
                        name="season"
                        value={formData.season}
                        onChange={onChange}
                        placeholder="Ej. 2024/25 o 1998"
                        className="w-full bg-neutral-800/60 border border-neutral-700/60 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                </div>

                {/* Género */}
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Género
                    </label>
                    <select
                        name="gender"
                        value={formData.gender}
                        onChange={onChange}
                        className="w-full bg-neutral-800/60 border border-neutral-700/60 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    >
                        <option value="">Unisex / Todos</option>
                        <option value="man">Hombre / Masculino</option>
                        <option value="woman">Mujer / Femenino</option>
                        <option value="kid">Niños / Infantil</option>
                    </select>
                </div>

                {/* Orden de clasificación */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Posición en Destacados (Home)
                        </label>
                        {formData.featured && (
                            <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                <ArrowUpDown className="w-3 h-3" /> Orden único
                            </span>
                        )}
                    </div>
                    <input
                        type="number"
                        min="0"
                        name="sort_order"
                        value={formData.sort_order}
                        onChange={onChange}
                        disabled={!formData.featured}
                        placeholder="0 para 1er lugar"
                        className={`w-full border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all ${
                            !formData.featured
                                ? 'bg-neutral-900 border-neutral-800 text-gray-500 cursor-not-allowed opacity-60'
                                : 'bg-neutral-800/60 border-neutral-700/60'
                        }`}
                    />
                    {formData.featured ? (
                        <div className="mt-2 text-xs space-y-1">
                            {(() => {
                                const reqOrder = Math.max(0, parseInt(String(formData.sort_order), 10) || 0);
                                const others = featuredProducts.filter((p) => !currentProductId || p.id !== currentProductId);
                                const occupant = others.find((p) => p.sort_order === reqOrder);

                                const occupantTeam = occupant
                                    ? (Array.isArray(occupant.teams)
                                        ? occupant.teams[0]?.name
                                        : occupant.teams?.name) || occupant.team_name
                                    : null;
                                const occupantLabel = occupant
                                    ? occupantTeam
                                        ? `${occupantTeam} - ${occupant.name}`
                                        : occupant.name
                                    : '';

                                return (
                                    <>
                                        <p className="text-gray-300 flex items-start gap-1.5">
                                            <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                            <span>
                                                Puesto <strong>#{reqOrder}</strong> ({reqOrder === 0 ? '1er lugar' : `${reqOrder + 1}º lugar`} en Home).
                                            </span>
                                        </p>
                                        {occupant ? (
                                            <p className="text-amber-400/90 text-[11px] pl-5">
                                                📌 Actualmente ocupado por <strong>"{occupantLabel}"</strong>. Al guardar, este producto tomará el puesto #{reqOrder} y los demás se correrán un número (+1).
                                            </p>
                                        ) : (
                                            <p className="text-emerald-400/90 text-[11px] pl-5">
                                                ✨ Posición libre al final de los destacados.
                                            </p>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    ) : (
                        <p className="text-[11px] text-gray-500 mt-1">
                            Solo aplica si el producto está marcado como <strong>Destacado</strong>.
                        </p>
                    )}
                </div>

                {/* Descripción */}
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Descripción
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={onChange}
                        rows={3}
                        placeholder="Detalles sobre el diseño, tela, parches y características..."
                        className="w-full bg-neutral-800/60 border border-neutral-700/60 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-y"
                    />
                </div>

                {/* Flags / Switches */}
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-850/40 transition-colors">
                        <input
                            type="checkbox"
                            name="active"
                            checked={formData.active}
                            onChange={onChange}
                            className="w-4 h-4 mt-0.5 rounded border-neutral-700 text-primary focus:ring-primary bg-neutral-800"
                        />
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white">Activo</span>
                            <span className="text-[11px] text-gray-400">Visible en la tienda</span>
                        </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-850/40 transition-colors">
                        <input
                            type="checkbox"
                            name="featured"
                            checked={formData.featured}
                            onChange={onChange}
                            className="w-4 h-4 mt-0.5 rounded border-neutral-700 text-primary focus:ring-primary bg-neutral-800"
                        />
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white">Destacado</span>
                            <span className="text-[11px] text-gray-400">En sección Home (orden único)</span>
                        </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-850/40 transition-colors">
                        <input
                            type="checkbox"
                            name="allows_customization"
                            checked={formData.allows_customization}
                            onChange={onChange}
                            className="w-4 h-4 mt-0.5 rounded border-neutral-700 text-primary focus:ring-primary bg-neutral-800"
                        />
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white">Personalizable</span>
                            <span className="text-[11px] text-gray-400">Permite dorsal y nombre</span>
                        </div>
                    </label>
                </div>
            </div>
        </div>
    );
}
