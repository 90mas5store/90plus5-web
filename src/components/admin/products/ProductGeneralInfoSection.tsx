'use client';

import React from 'react';
import { Tag, Sparkles, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
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
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Orden de Visualización
                    </label>
                    <input
                        type="number"
                        name="sort_order"
                        value={formData.sort_order}
                        onChange={onChange}
                        className="w-full bg-neutral-800/60 border border-neutral-700/60 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
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
                <div className="md:col-span-2 flex flex-wrap gap-6 pt-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            name="active"
                            checked={formData.active}
                            onChange={onChange}
                            className="w-4 h-4 rounded border-neutral-700 text-primary focus:ring-primary bg-neutral-800"
                        />
                        <span className="text-sm font-semibold text-white">Producto Activo (Visible en tienda)</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            name="featured"
                            checked={formData.featured}
                            onChange={onChange}
                            className="w-4 h-4 rounded border-neutral-700 text-primary focus:ring-primary bg-neutral-800"
                        />
                        <span className="text-sm font-semibold text-white">Destacado (Home / Populares)</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            name="allows_customization"
                            checked={formData.allows_customization}
                            onChange={onChange}
                            className="w-4 h-4 rounded border-neutral-700 text-primary focus:ring-primary bg-neutral-800"
                        />
                        <span className="text-sm font-semibold text-white">Permite Personalización de Dorsal</span>
                    </label>
                </div>
            </div>
        </div>
    );
}
