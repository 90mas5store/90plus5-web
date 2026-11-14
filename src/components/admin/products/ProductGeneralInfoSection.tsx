'use client';

import React from 'react';
import {
    Tag,
    Sparkles,
    AlertCircle,
    CheckCircle,
    Loader2,
    ArrowUpDown,
    Info,
    Plus,
    ChevronDown,
    Shield,
    Layers,
    Calendar,
    User,
    FileText,
} from 'lucide-react';
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
    suggestedBrandName?: string | null;
    onApplySeasonMove?: (cleanName: string, season: string) => void;
    onOpenNewTeam?: () => void;
    onOpenNewBrand?: () => void;
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
    suggestedBrandName,
    onApplySeasonMove,
    onOpenNewTeam,
    onOpenNewBrand,
}: ProductGeneralInfoSectionProps) {
    // 🧠 Detección amigable de años en el título (Regla: no hardcodear temporadas en títulos)
    const seasonMatch = formData.name.match(/\b(19\d\d|20\d\d)(\s*[/-\s]\s*\d{2,4})?\b/);

    const handleCleanSeasonFromTitle = () => {
        if (!seasonMatch) return;
        const detected = seasonMatch[0].trim();
        const cleanName = formData.name.replace(seasonMatch[0], '').replace(/\s{2,}/g, ' ').trim();
        if (onApplySeasonMove) {
            onApplySeasonMove(cleanName, detected);
        }
    };

    const handleToggleBoolean = (fieldName: 'active' | 'featured' | 'allows_customization') => {
        const syntheticEvent = {
            target: {
                name: fieldName,
                type: 'checkbox',
                checked: !formData[fieldName],
                value: !formData[fieldName],
            },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
    };

    return (
        <section className="relative overflow-hidden bg-[#0d0e12]/80 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            {/* Apple Specular Highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            {/* Header de la sección */}
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-primary shadow-sm">
                        <Tag className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                            Información General
                        </h2>
                        <p className="text-xs text-zinc-400">
                            Datos maestros del producto, club, marca técnica y configuración SEO.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre */}
                <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                        Nombre del Producto *
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={onChange}
                        required
                        placeholder="Ej. Camiseta Titular Real Madrid"
                        className="w-full bg-[#14151b] border border-white/10 hover:border-white/20 focus:border-primary/80 focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 py-3.5 text-white placeholder-zinc-500 font-medium transition-all text-sm outline-none shadow-inner"
                    />
                    {seasonMatch && onApplySeasonMove && (
                        <div className="mt-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
                            <span className="text-amber-300">
                                💡 Detectamos <strong className="font-mono bg-amber-500/20 px-1.5 py-0.5 rounded-md">{seasonMatch[0]}</strong> en el título. Los años se gestionan en el campo Temporada para mantener el título perenne.
                            </span>
                            <button
                                type="button"
                                onClick={handleCleanSeasonFromTitle}
                                className="shrink-0 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 px-3 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer active:scale-[0.97]"
                            >
                                Mover a Temporada
                            </button>
                        </div>
                    )}
                </div>

                {/* Slug */}
                <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                            Slug (URL del producto) *
                        </label>
                        <button
                            type="button"
                            onClick={() => setIsAutoSlug(!isAutoSlug)}
                            className={`text-[11px] flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer active:scale-[0.97] ${
                                isAutoSlug
                                    ? 'bg-primary/15 text-primary border border-primary/30 shadow-sm'
                                    : 'bg-white/5 text-zinc-400 border border-white/10 hover:text-white'
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
                            placeholder="ej. camiseta-titular-real-madrid"
                            className={`w-full bg-[#14151b] border rounded-2xl px-4 py-3.5 text-white placeholder-zinc-500 focus:border-primary/80 focus:ring-2 focus:ring-primary/20 outline-none transition-all pr-10 font-mono text-xs sm:text-sm ${
                                slugIsUnique === false
                                    ? 'border-red-500/80'
                                    : slugIsUnique === true
                                    ? 'border-emerald-500/80'
                                    : 'border-white/10 hover:border-white/20'
                            }`}
                        />
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                            {slugChecking && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />}
                            {!slugChecking && slugIsUnique === true && (
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                            )}
                            {!slugChecking && slugIsUnique === false && (
                                <AlertCircle className="w-4 h-4 text-red-400" />
                            )}
                        </div>
                    </div>
                    {slugIsUnique === false && (
                        <p className="text-xs text-red-400 mt-1.5 font-medium">Este slug ya existe. Se modificará automáticamente al guardar.</p>
                    )}
                </div>

                {/* Equipo */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Shield className="w-3 h-3 text-primary" />
                            <span>Equipo</span>
                        </label>
                        {onOpenNewTeam && (
                            <button
                                type="button"
                                onClick={onOpenNewTeam}
                                className="text-[11px] text-primary hover:text-primary-light font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-[0.97]"
                            >
                                <Plus className="w-3 h-3" /> Nuevo Equipo
                            </button>
                        )}
                    </div>
                    <div className="relative">
                        <select
                            name="team_id"
                            value={formData.team_id}
                            onChange={onChange}
                            className="w-full bg-[#14151b] border border-white/10 hover:border-white/20 focus:border-primary/80 focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 py-3.5 text-white font-medium transition-all text-sm outline-none appearance-none pr-10 cursor-pointer"
                        >
                            <option value="">Selecciona un equipo (opcional)...</option>
                            {teams.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    </div>
                </div>

                {/* Marca */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                                Marca Técnica
                            </label>
                            {suggestedBrandName && (
                                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                    Sugerida: {suggestedBrandName}
                                </span>
                            )}
                        </div>
                        {onOpenNewBrand && (
                            <button
                                type="button"
                                onClick={onOpenNewBrand}
                                className="text-[11px] text-primary hover:text-primary-light font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-[0.97]"
                            >
                                <Plus className="w-3 h-3" /> Nueva Marca
                            </button>
                        )}
                    </div>
                    <div className="relative">
                        <select
                            name="brand_id"
                            value={formData.brand_id}
                            onChange={onChange}
                            className="w-full bg-[#14151b] border border-white/10 hover:border-white/20 focus:border-primary/80 focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 py-3.5 text-white font-medium transition-all text-sm outline-none appearance-none pr-10 cursor-pointer"
                        >
                            <option value="">Selecciona una marca (opcional)...</option>
                            {brands.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    </div>
                </div>

                {/* Categoría */}
                <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Layers className="w-3 h-3 text-zinc-400" />
                        <span>Categoría Principal *</span>
                    </label>
                    <div className="relative">
                        <select
                            name="category_id"
                            value={formData.category_id}
                            onChange={onChange}
                            className="w-full bg-[#14151b] border border-white/10 hover:border-white/20 focus:border-primary/80 focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 py-3.5 text-white font-medium transition-all text-sm outline-none appearance-none pr-10 cursor-pointer"
                        >
                            <option value="">Selecciona una categoría...</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    </div>
                </div>

                {/* Temporada */}
                <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-zinc-400" />
                        <span>Temporada / Año</span>
                    </label>
                    <input
                        type="text"
                        name="season"
                        value={formData.season}
                        onChange={onChange}
                        placeholder="Ej. Temporada Actual o Edición Retro"
                        className="w-full bg-[#14151b] border border-white/10 hover:border-white/20 focus:border-primary/80 focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 py-3.5 text-white placeholder-zinc-500 font-medium transition-all text-sm outline-none shadow-inner"
                    />
                </div>

                {/* Género */}
                <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <User className="w-3 h-3 text-zinc-400" />
                        <span>Público / Género del Producto</span>
                    </label>
                    <div className="relative">
                        <select
                            name="gender"
                            value={formData.gender}
                            onChange={onChange}
                            className="w-full bg-[#14151b] border border-white/10 hover:border-white/20 focus:border-primary/80 focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 py-3.5 text-white font-medium transition-all text-sm outline-none appearance-none pr-10 cursor-pointer"
                        >
                            <option value="">Unisex / Adulto General</option>
                            <option value="man">Hombre / Masculino</option>
                            <option value="woman">Mujer / Femenino</option>
                            <option value="kid">Niños / Infantil</option>
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    </div>
                </div>

                {/* Orden de clasificación */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                            Posición en Destacados (Home)
                        </label>
                        {formData.featured && (
                            <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
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
                        className={`w-full border rounded-2xl px-4 py-3.5 text-white placeholder-zinc-500 focus:border-primary/80 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-mono ${
                            !formData.featured
                                ? 'bg-[#101116] border-white/5 text-zinc-600 cursor-not-allowed opacity-50'
                                : 'bg-[#14151b] border-white/10 hover:border-white/20'
                        }`}
                    />
                    {formData.featured ? (
                        <div className="mt-2.5 text-xs space-y-1">
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
                                        <p className="text-zinc-300 flex items-start gap-1.5">
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
                        <p className="text-[11px] text-zinc-500 mt-1.5">
                            Solo aplica si el producto está marcado como <strong>Destacado</strong>.
                        </p>
                    )}
                </div>

                {/* Descripción */}
                <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FileText className="w-3 h-3 text-zinc-400" />
                        <span>Descripción</span>
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={onChange}
                        rows={3}
                        placeholder="Detalles sobre el diseño, tela, parches y características..."
                        className="w-full bg-[#14151b] border border-white/10 hover:border-white/20 focus:border-primary/80 focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 py-3.5 text-white placeholder-zinc-500 font-medium transition-all text-sm outline-none resize-y shadow-inner"
                    />
                </div>

                {/* iOS Style Spring Toggles */}
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                    {/* Toggle: Activo */}
                    <button
                        type="button"
                        role="switch"
                        aria-checked={formData.active}
                        onClick={() => handleToggleBoolean('active')}
                        className={`p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer select-none active:scale-[0.98] ${
                            formData.active
                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                : 'bg-[#14151b] border-white/10 hover:border-white/20'
                        }`}
                    >
                        <div className="text-left">
                            <span className="text-sm font-bold text-white block">Activo</span>
                            <span className="text-[11px] text-zinc-400">Visible en la tienda</span>
                        </div>
                        <div
                            className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
                                formData.active ? 'bg-emerald-500 justify-end' : 'bg-white/10 justify-start'
                            }`}
                        >
                            <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200" />
                        </div>
                    </button>

                    {/* Toggle: Destacado */}
                    <button
                        type="button"
                        role="switch"
                        aria-checked={formData.featured}
                        onClick={() => handleToggleBoolean('featured')}
                        className={`p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer select-none active:scale-[0.98] ${
                            formData.featured
                                ? 'bg-amber-500/10 border-amber-500/30'
                                : 'bg-[#14151b] border-white/10 hover:border-white/20'
                        }`}
                    >
                        <div className="text-left">
                            <span className="text-sm font-bold text-white block">Destacado</span>
                            <span className="text-[11px] text-zinc-400">En carrusel Home</span>
                        </div>
                        <div
                            className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
                                formData.featured ? 'bg-amber-500 justify-end' : 'bg-white/10 justify-start'
                            }`}
                        >
                            <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200" />
                        </div>
                    </button>

                    {/* Toggle: Personalizable */}
                    <button
                        type="button"
                        role="switch"
                        aria-checked={formData.allows_customization}
                        onClick={() => handleToggleBoolean('allows_customization')}
                        className={`p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer select-none active:scale-[0.98] ${
                            formData.allows_customization
                                ? 'bg-primary/10 border-primary/30'
                                : 'bg-[#14151b] border-white/10 hover:border-white/20'
                        }`}
                    >
                        <div className="text-left">
                            <span className="text-sm font-bold text-white block">Personalizable</span>
                            <span className="text-[11px] text-zinc-400">Dorsal y nombre</span>
                        </div>
                        <div
                            className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
                                formData.allows_customization ? 'bg-primary justify-end' : 'bg-white/10 justify-start'
                            }`}
                        >
                            <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200" />
                        </div>
                    </button>
                </div>
            </div>
        </section>
    );
}
