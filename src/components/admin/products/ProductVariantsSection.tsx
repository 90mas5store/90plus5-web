'use client';

import React, { useState, useMemo } from 'react';
import { DollarSign, Plus, Trash2, Ruler, Sparkles, Filter, ChevronDown, Shirt, Footprints, Baby, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { AdminVariant, AdminSize, AdminProductFormData, CatalogItem } from '@/types/adminProduct';
import QuickCreateSizeModal from './QuickCreateSizeModal';

interface ProductVariantsSectionProps {
    variants: AdminVariant[];
    availableVersions: string[];
    filteredSizes: AdminSize[];
    allSizes?: AdminSize[];
    categories?: CatalogItem[];
    formData: AdminProductFormData;
    onAddVariant: () => void;
    onUpdateVariant: (tempId: string, field: keyof AdminVariant, value: unknown) => void;
    onRemoveVariant: (tempId: string) => void;
    onToggleVariantSize: (tempId: string, sizeId: string) => void;
    onApplyAdultPreset?: () => void;
    onApplySinglePreset?: (version: string, defaultPrice?: number) => void;
    onQuickCreateSize?: (size: AdminSize) => void;
}

const CLOTHING_HIERARCHY: Record<string, number> = {
    '3XS': 1,
    'XXS': 2,
    '2XS': 2,
    'XS': 3,
    'S': 4,
    'M': 5,
    'L': 6,
    'XL': 7,
    '2XL': 8,
    'XXL': 8,
    '3XL': 9,
    'XXXL': 9,
    '4XL': 10,
    'XXXXL': 10,
    '5XL': 11,
};

function sortSizeGroups(
    a: { label: string; sortOrder: number },
    b: { label: string; sortOrder: number }
): number {
    const labelA = a.label.trim();
    const labelB = b.label.trim();

    // 1. Zapatos / Calzado numérico (5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 12, etc.)
    const isNumA = /^(\d{1,2}(\.5)?|\d{2})(\s*(US|EU))?$/i.test(labelA) && !/año/i.test(labelA);
    const isNumB = /^(\d{1,2}(\.5)?|\d{2})(\s*(US|EU))?$/i.test(labelB) && !/año/i.test(labelB);
    if (isNumA && isNumB) {
        const valA = parseFloat(labelA.replace(/[^\d.]/g, ''));
        const valB = parseFloat(labelB.replace(/[^\d.]/g, ''));
        if (!isNaN(valA) && !isNaN(valB)) {
            return valA - valB;
        }
    }

    // 2. Tallas infantiles por edad (2 años, 4 años, 6 años...)
    const isKidA = /año/i.test(labelA);
    const isKidB = /año/i.test(labelB);
    if (isKidA && isKidB) {
        const valA = parseInt(labelA.replace(/[^\d]/g, ''), 10);
        const valB = parseInt(labelB.replace(/[^\d]/g, ''), 10);
        if (!isNaN(valA) && !isNaN(valB)) {
            return valA - valB;
        }
    }

    // 3. Ropa estándar de adulto (XS, S, M, L, XL, 2XL, 3XL, 4XL)
    const upperA = labelA.toUpperCase();
    const upperB = labelB.toUpperCase();
    if (CLOTHING_HIERARCHY[upperA] !== undefined && CLOTHING_HIERARCHY[upperB] !== undefined) {
        return CLOTHING_HIERARCHY[upperA] - CLOTHING_HIERARCHY[upperB];
    }

    // 4. Fallback a sort_order de base de datos
    if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
    }

    // 5. Fallback alfabético natural
    return labelA.localeCompare(labelB, undefined, { numeric: true });
}

export default function ProductVariantsSection({
    variants,
    availableVersions,
    filteredSizes,
    allSizes = [],
    categories = [],
    formData,
    onAddVariant,
    onUpdateVariant,
    onRemoveVariant,
    onToggleVariantSize,
    onApplyAdultPreset,
    onApplySinglePreset,
    onQuickCreateSize,
}: ProductVariantsSectionProps) {
    const [quickSizeModalVariantId, setQuickSizeModalVariantId] = useState<string | null>(null);
    const [variantTabMap, setVariantTabMap] = useState<
        Record<string, 'clothing' | 'shoes'>
    >({});

    const defaultTab = useMemo<'clothing' | 'shoes'>(() => {
        const cat = categories.find((c) => c.id === formData.category_id);
        const catName = cat?.name?.toLowerCase() || '';
        if (/zapato|calzado|tenis|taco/i.test(catName)) return 'shoes';
        return 'clothing';
    }, [formData.category_id, categories]);

    const classifySize = (
        s: AdminSize,
        catList: CatalogItem[]
    ): 'clothing' | 'kids' | 'shoes' => {
        const rawLabel = s.label.trim();
        const isKid = s.gender === 'kid' || /niño|infantil|año/i.test(rawLabel);
        const cat = catList.find((c) => c.id === s.category_id);
        const isShoeCat = /calzado|zapato|tenis|taco/i.test(cat?.name || '');
        const isShoeNum = /^(\d{1,2}(\.5)?|\d{2})(\s*(US|EU))?$/i.test(rawLabel) && !isKid;

        if (isShoeCat || isShoeNum) return 'shoes';
        if (isKid) return 'kids';
        return 'clothing';
    };

    const handleToggleGroup = (
        variantTempId: string,
        groupAllIds: string[],
        canonicalId: string,
        isCurrentlySelected: boolean
    ) => {
        const v = variants.find((item) => item.tempId === variantTempId);
        if (!v) return;
        const next = new Set(v.sizeIds);
        if (isCurrentlySelected) {
            groupAllIds.forEach((id) => next.delete(id));
        } else {
            next.add(canonicalId);
        }
        onUpdateVariant(variantTempId, 'sizeIds', next);
    };

    const handleBatchSelect = (variantTempId: string, targetLabels: string[]) => {
        const v = variants.find((item) => item.tempId === variantTempId);
        if (!v) return;
        const next = new Set(v.sizeIds);
        const pool = allSizes && allSizes.length > 0 ? allSizes : filteredSizes;
        const targetSet = new Set(targetLabels.map((l) => l.toUpperCase()));

        pool.forEach((s) => {
            if (!s.active) return;
            const norm = s.label.trim().toUpperCase();
            if (targetSet.has(norm)) {
                next.add(s.id);
            }
        });
        onUpdateVariant(variantTempId, 'sizeIds', next);
    };

    const handleClearSizes = (variantTempId: string) => {
        onUpdateVariant(variantTempId, 'sizeIds', new Set());
    };
    return (
        <section className="relative overflow-hidden bg-[#0d0e12]/80 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-6 sm:space-y-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            {/* Apple Specular Highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Variantes y Precios</h2>
                        <p className="text-xs text-zinc-400">
                            Administra versiones (Jugador, Fan, Retro) y sus tallas/precios con flexibilidad total.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {onApplyAdultPreset && (
                        <button
                            type="button"
                            onClick={onApplyAdultPreset}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-[0.97] text-emerald-400 border border-emerald-500/30 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                            title="Genera Versión Fan (L 1,200) y Player (L 1,500) con tallas completas"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Preset Adulto Oficial</span>
                        </button>
                    )}
                    {onApplySinglePreset && (
                        <button
                            type="button"
                            onClick={() => onApplySinglePreset('Retro', 1300)}
                            className="bg-amber-500/10 hover:bg-amber-500/20 active:scale-[0.97] text-amber-400 border border-amber-500/30 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                            title="Genera Versión Retro con tallas completas"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Preset Retro</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onAddVariant}
                        className="bg-white/5 hover:bg-white/10 active:scale-[0.97] text-white px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-white/10 transition-all cursor-pointer shadow-sm"
                    >
                        <Plus className="w-3.5 h-3.5" /> Variante Libre
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <AnimatePresence>
                    {variants.map((variant) => (
                        <motion.div
                            key={variant.tempId}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-6 transition-all border shadow-xl ${
                                variant.active ? 'border-white/[0.08] bg-[#14151b]/80 hover:border-white/20' : 'border-red-900/30 bg-red-950/20'
                            }`}
                        >
                            {/* Inner Specular Highlight */}
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

                            <div className="flex flex-col gap-4 sm:gap-6">
                                {/* ROW 1: Header & Actions */}
                                <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                                    {/* Version Selector */}
                                    <div className="w-full sm:flex-1 sm:max-w-sm">
                                        <label className="text-[11px] font-bold uppercase text-zinc-400 mb-2 block">
                                            Nombre Versión
                                        </label>
                                        <select
                                            value={variant.version}
                                            onChange={(e) =>
                                                onUpdateVariant(variant.tempId, 'version', e.target.value)
                                            }
                                            className="w-full bg-[#0d0e12] border border-white/10 hover:border-white/20 focus:border-primary/80 focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 text-sm text-white font-bold transition-all outline-none"
                                        >
                                            {availableVersions.map((ver) => (
                                                <option key={ver} value={ver}>
                                                    {ver}
                                                </option>
                                            ))}
                                            {!availableVersions.includes(variant.version) && (
                                                <option value={variant.version}>{variant.version}</option>
                                            )}
                                        </select>
                                    </div>

                                    {/* Right Actions: Active Toggle & Delete */}
                                    <div className="flex items-center gap-2 pt-0 sm:pt-6">
                                        <div
                                            onClick={() =>
                                                onUpdateVariant(variant.tempId, 'active', !variant.active)
                                            }
                                            className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2 cursor-pointer transition-all select-none active:scale-[0.97]"
                                        >
                                            <span
                                                className={`text-xs font-bold uppercase ${
                                                    variant.active ? 'text-emerald-400' : 'text-zinc-500'
                                                }`}
                                            >
                                                {variant.active ? 'Visible' : 'Oculto'}
                                            </span>
                                            <div
                                                className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                                                    variant.active ? 'bg-emerald-500' : 'bg-white/15'
                                                }`}
                                            >
                                                <div
                                                    className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${
                                                        variant.active ? 'translate-x-4' : 'translate-x-0'
                                                    }`}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => onRemoveVariant(variant.tempId)}
                                            className="p-2.5 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20 cursor-pointer active:scale-[0.97]"
                                            title="Eliminar Variante"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* ROW 2: Pricing Logic */}
                                <div className="bg-[#0d0e12]/60 rounded-2xl p-4 border border-white/5 grid grid-cols-1 md:grid-cols-3 gap-5">
                                    {/* Base Price */}
                                    <div>
                                        <label className="text-[11px] font-bold uppercase text-zinc-400 mb-2 block">
                                            Precio Venta (HNL)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">
                                                L
                                            </span>
                                            <input
                                                type="number"
                                                value={variant.price}
                                                onChange={(e) =>
                                                    onUpdateVariant(
                                                        variant.tempId,
                                                        'price',
                                                        Number(e.target.value)
                                                    )
                                                }
                                                className="w-full bg-[#14151b] border border-white/10 hover:border-white/20 focus:border-primary/80 focus:ring-2 focus:ring-primary/20 rounded-xl pl-9 pr-4 py-3 text-sm text-white font-mono outline-none transition-all"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    {/* Cost (internal) */}
                                    <div>
                                        <label className="text-[11px] font-bold uppercase text-zinc-400 mb-2 block">
                                            Costo Interno (L)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-sm">
                                                L
                                            </span>
                                            <input
                                                type="number"
                                                min={0}
                                                step={0.01}
                                                value={variant.cost}
                                                onChange={(e) =>
                                                    onUpdateVariant(
                                                        variant.tempId,
                                                        'cost',
                                                        Number(e.target.value)
                                                    )
                                                }
                                                className="w-full bg-[#14151b] border border-emerald-500/20 hover:border-emerald-500/40 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl pl-9 pr-4 py-3 text-sm text-emerald-400 outline-none font-mono transition-all"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    {/* Promo Logic */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-[11px] font-bold uppercase text-zinc-400 block">
                                                Oferta / Descuento
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={variant.active_original_price}
                                                    onChange={(e) =>
                                                        onUpdateVariant(
                                                            variant.tempId,
                                                            'active_original_price',
                                                            e.target.checked
                                                        )
                                                    }
                                                    id={`promo-${variant.tempId}`}
                                                    className="accent-yellow-500 w-3.5 h-3.5 rounded cursor-pointer"
                                                />
                                                <label
                                                    htmlFor={`promo-${variant.tempId}`}
                                                    className="text-[10px] font-bold uppercase text-yellow-500/90 cursor-pointer select-none"
                                                >
                                                    Activar
                                                </label>
                                            </div>
                                        </div>

                                        <div className="relative">
                                            {variant.active_original_price ? (
                                                <>
                                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono">
                                                        Antes:
                                                    </span>
                                                    <input
                                                        type="number"
                                                        value={variant.original_price}
                                                        onChange={(e) =>
                                                            onUpdateVariant(
                                                                variant.tempId,
                                                                'original_price',
                                                                Number(e.target.value)
                                                            )
                                                        }
                                                        className="w-full bg-[#14151b] border border-yellow-500/30 hover:border-yellow-500/50 focus:border-yellow-500 rounded-xl pl-16 pr-4 py-3 text-sm text-yellow-500 outline-none font-mono transition-all"
                                                        placeholder="0.00"
                                                    />
                                                </>
                                            ) : (
                                                <div className="w-full py-3 px-4 bg-white/[0.03] border border-dashed border-white/10 rounded-xl text-xs text-zinc-500 italic select-none text-center">
                                                    Precio normal (sin tachado)
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ROW 3: Sizes */}
                                <div className="space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <label className="text-xs font-bold uppercase text-gray-400 flex items-center gap-1.5">
                                            <Ruler className="w-3.5 h-3.5 text-primary" />
                                            <span>Tallas Disponibles ({variant.sizeIds.size} seleccionadas)</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setQuickSizeModalVariantId(variant.tempId)}
                                            className="text-[11px] font-bold text-primary hover:text-primary-light flex items-center gap-1 bg-primary/10 hover:bg-primary/20 border border-primary/20 px-2.5 py-1 rounded-xl transition-all cursor-pointer active:scale-[0.96]"
                                        >
                                            <Plus className="w-3 h-3" /> Crear Talla
                                        </button>
                                    </div>

                                    {/* Selector Ropa / Calzado (Segmented iOS Control) & Acciones Rápidas */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-black/40 border border-white/5 rounded-2xl">
                                        <div className="flex items-center gap-1">
                                            {[
                                                { id: 'clothing' as const, label: '👕 Ropa' },
                                                { id: 'shoes' as const, label: '👟 Calzado' },
                                            ].map((tab) => {
                                                const currentActive =
                                                    variantTabMap[variant.tempId] || defaultTab;
                                                const isActive = currentActive === tab.id;
                                                return (
                                                    <button
                                                        key={tab.id}
                                                        type="button"
                                                        onClick={() =>
                                                            setVariantTabMap((prev) => ({
                                                                ...prev,
                                                                [variant.tempId]: tab.id,
                                                            }))
                                                        }
                                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer shrink-0 active:scale-[0.97] flex items-center gap-1.5 ${
                                                            isActive
                                                                ? 'bg-white text-black shadow-sm font-black'
                                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                        }`}
                                                    >
                                                        <span>{tab.label}</span>
                                                        {tab.id === 'clothing' && (
                                                            <span className="text-[10px] opacity-60 font-normal">
                                                                {formData.gender === 'kid' ? '(Niños)' : '(Adulto)'}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* ⚡ Acciones Rápidas Contextuales según Género Seleccionado Arriba */}
                                        <div className="flex items-center gap-1.5 shrink-0 ml-auto flex-wrap">
                                            {(() => {
                                                const currentTab = variantTabMap[variant.tempId] || defaultTab;
                                                if (currentTab === 'clothing') {
                                                    if (formData.gender === 'kid') {
                                                        return (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleBatchSelect(variant.tempId, [
                                                                            '4 años',
                                                                            '6 años',
                                                                            '8 años',
                                                                            '10 años',
                                                                            '12 años',
                                                                        ])
                                                                    }
                                                                    className="text-[10px] font-bold text-sky-300 hover:text-sky-200 bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1 rounded-lg transition-all border border-sky-500/20 cursor-pointer active:scale-[0.96]"
                                                                >
                                                                    ⚡ 4 - 12a
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleBatchSelect(variant.tempId, [
                                                                            '2 años',
                                                                            '4 años',
                                                                            '6 años',
                                                                            '8 años',
                                                                            '10 años',
                                                                            '12 años',
                                                                            '14 años',
                                                                            '16 años',
                                                                        ])
                                                                    }
                                                                    className="text-[10px] font-bold text-sky-300 hover:text-sky-200 bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1 rounded-lg transition-all border border-sky-500/20 cursor-pointer active:scale-[0.96]"
                                                                >
                                                                    ⚡ Todas (2-16a)
                                                                </button>
                                                            </>
                                                        );
                                                    }
                                                    return (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleBatchSelect(variant.tempId, [
                                                                        'XS',
                                                                        'S',
                                                                        'M',
                                                                        'L',
                                                                        'XL',
                                                                    ])
                                                                }
                                                                className="text-[10px] font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg transition-all border border-white/5 cursor-pointer active:scale-[0.96]"
                                                                title="Selecciona rápidamente XS a XL"
                                                            >
                                                                ⚡ XS - XL
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleBatchSelect(variant.tempId, [
                                                                        'S',
                                                                        'M',
                                                                        'L',
                                                                        'XL',
                                                                        '2XL',
                                                                    ])
                                                                }
                                                                className="text-[10px] font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg transition-all border border-white/5 cursor-pointer active:scale-[0.96]"
                                                                title="Selecciona rápidamente S a 2XL"
                                                            >
                                                                ⚡ S - 2XL
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleBatchSelect(variant.tempId, [
                                                                        'XS',
                                                                        'S',
                                                                        'M',
                                                                        'L',
                                                                        'XL',
                                                                        '2XL',
                                                                        '3XL',
                                                                        '4XL',
                                                                    ])
                                                                }
                                                                className="text-[10px] font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg transition-all border border-white/5 cursor-pointer active:scale-[0.96]"
                                                                title="Selecciona todas las tallas estándar (XS a 4XL)"
                                                            >
                                                                ⚡ Todas (XS-4XL)
                                                            </button>
                                                        </>
                                                    );
                                                }
                                                if (currentTab === 'shoes') {
                                                    return (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleBatchSelect(variant.tempId, [
                                                                        '5',
                                                                        '5.5',
                                                                        '6',
                                                                        '6.5',
                                                                        '7',
                                                                        '7.5',
                                                                        '8',
                                                                        '8.5',
                                                                    ])
                                                                }
                                                                className="text-[10px] font-bold text-pink-300 hover:text-pink-200 bg-pink-500/10 hover:bg-pink-500/20 px-2.5 py-1 rounded-lg transition-all border border-pink-500/20 cursor-pointer active:scale-[0.96]"
                                                                title="Escala 5 a 8.5"
                                                            >
                                                                ⚡ 5 - 8.5
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleBatchSelect(variant.tempId, [
                                                                        '7',
                                                                        '7.5',
                                                                        '8',
                                                                        '8.5',
                                                                        '9',
                                                                        '9.5',
                                                                        '10',
                                                                        '10.5',
                                                                        '11',
                                                                        '12',
                                                                    ])
                                                                }
                                                                className="text-[10px] font-bold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg transition-all border border-amber-500/20 cursor-pointer active:scale-[0.96]"
                                                                title="Escala 7 a 12"
                                                            >
                                                                ⚡ 7 - 12
                                                            </button>
                                                        </>
                                                    );
                                                }
                                                return null;
                                            })()}

                                            {variant.sizeIds.size > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleClearSizes(variant.tempId)}
                                                    className="text-[10px] font-bold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded-lg transition-all border border-red-500/20 cursor-pointer active:scale-[0.96]"
                                                    title="Desmarcar todas las tallas de esta variante"
                                                >
                                                    Desmarcar
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Botones de tallas deduplicados y agrupados */}
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {(() => {
                                            const activeTab =
                                                variantTabMap[variant.tempId] || defaultTab;
                                            const pool =
                                                allSizes && allSizes.length > 0
                                                    ? allSizes
                                                    : filteredSizes;

                                            // Filtrar según Ropa o Calzado y según el género seleccionado arriba
                                            const tabSizes = pool.filter((s) => {
                                                if (s.active === false) return false;
                                                const cat = categories.find((c) => c.id === s.category_id);
                                                const rawLabel = s.label.trim();
                                                const isKid = s.gender === 'kid' || /niño|infantil|año/i.test(rawLabel);
                                                const isShoe =
                                                    /tenis|calzado|zapato|taco/i.test(cat?.name || '') ||
                                                    (/^(\d{1,2}(\.5)?|\d{2})(\s*(US|EU))?$/i.test(rawLabel) && !isKid);

                                                if (activeTab === 'shoes') {
                                                    if (!isShoe) return false;
                                                    if (formData.gender === 'kid') return isKid || s.gender === 'kid';
                                                    if (formData.gender === 'woman') return s.gender === 'woman' || !s.gender;
                                                    if (formData.gender === 'man') return s.gender === 'man' || !s.gender;
                                                    return true;
                                                } else {
                                                    // activeTab === 'clothing'
                                                    if (isShoe) return false;
                                                    if (formData.gender === 'kid') {
                                                        return isKid;
                                                    }
                                                    // Adultos (hombre, mujer o unisex)
                                                    if (isKid) return false;
                                                    if (formData.gender === 'woman') return s.gender === 'woman' || !s.gender;
                                                    if (formData.gender === 'man') return s.gender === 'man' || !s.gender;
                                                    return true;
                                                }
                                            });

                                            // Agrupar por etiqueta única (NUNCA duplicar)
                                            const groupsMap = new Map<
                                                string,
                                                {
                                                    key: string;
                                                    label: string;
                                                    canonicalId: string;
                                                    allIds: string[];
                                                    additionalCost: number;
                                                    sortOrder: number;
                                                    isSelected: boolean;
                                                }
                                            >();

                                            for (const s of tabSizes) {
                                                const rawLabel = s.label.trim();
                                                const groupKey = rawLabel.toUpperCase();

                                                const existing = groupsMap.get(groupKey);
                                                if (!existing) {
                                                    const isDirectlySelected = variant.sizeIds.has(s.id);
                                                    groupsMap.set(groupKey, {
                                                        key: groupKey,
                                                        label: rawLabel,
                                                        canonicalId: s.id,
                                                        allIds: [s.id],
                                                        additionalCost: s.additional_cost || 0,
                                                        sortOrder: s.sort_order ?? 99,
                                                        isSelected: isDirectlySelected,
                                                    });
                                                } else {
                                                    existing.allIds.push(s.id);
                                                    if (variant.sizeIds.has(s.id)) {
                                                        existing.isSelected = true;
                                                    }
                                                    if (
                                                        s.additional_cost &&
                                                        s.additional_cost > existing.additionalCost
                                                    ) {
                                                        existing.additionalCost = s.additional_cost;
                                                    }
                                                }
                                            }

                                            // Resolver variantes con IDs históricos ya seleccionados
                                            for (const [, group] of groupsMap.entries()) {
                                                if (!group.isSelected) {
                                                    for (const sid of variant.sizeIds) {
                                                        const match = pool.find((p) => p.id === sid);
                                                        if (
                                                            match &&
                                                            match.label.trim().toUpperCase() ===
                                                                group.label.toUpperCase()
                                                        ) {
                                                            group.isSelected = true;
                                                            if (!group.allIds.includes(sid)) {
                                                                group.allIds.push(sid);
                                                            }
                                                            break;
                                                        }
                                                    }
                                                }
                                            }

                                            const displayGroups = Array.from(groupsMap.values()).sort(
                                                sortSizeGroups
                                            );

                                            if (displayGroups.length === 0) {
                                                return (
                                                    <div className="w-full py-4 px-3 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-xl">
                                                        <p className="text-xs text-gray-500 italic">
                                                            No hay tallas en la categoría seleccionada ({activeTab === 'clothing' ? 'Ropa' : 'Calzado'}).
                                                        </p>
                                                        <p className="text-[11px] text-gray-600 mt-1">
                                                            Haz clic en "+ Crear Talla" para añadir una nueva medida.
                                                        </p>
                                                    </div>
                                                );
                                            }

                                            return displayGroups.map((group) => {
                                                return (
                                                    <button
                                                        key={group.key}
                                                        type="button"
                                                        onClick={() =>
                                                            handleToggleGroup(
                                                                variant.tempId,
                                                                group.allIds,
                                                                group.canonicalId,
                                                                group.isSelected
                                                            )
                                                        }
                                                        className={`relative min-w-[42px] h-[40px] px-3 rounded-xl text-xs font-bold border transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.96] ${
                                                            group.isSelected
                                                                ? 'bg-white text-black border-white shadow-[0_2px_12px_rgba(255,255,255,0.25)] font-black transform -translate-y-0.5'
                                                                : 'bg-white/[0.03] text-gray-400 border-white/10 hover:border-white/25 hover:text-white'
                                                        }`}
                                                    >
                                                        <span>{group.label}</span>
                                                        {group.additionalCost > 0 && (
                                                            <span
                                                                className={`text-[8px] font-mono font-bold ${
                                                                    group.isSelected
                                                                        ? 'text-amber-700'
                                                                        : 'text-amber-400'
                                                                }`}
                                                            >
                                                                +L{group.additionalCost}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {variants.length === 0 && (
                    <div className="text-center py-12 px-4 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                        <p className="text-gray-300 text-sm font-semibold mb-1">
                            No hay versiones configuradas para este producto
                        </p>
                        <p className="text-xs text-gray-500 mb-4">
                            Agrega al menos una versión (ej: Versión Fan, Versión Jugador o Tallas).
                        </p>
                        <button
                            onClick={onAddVariant}
                            type="button"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary hover:bg-primary-light text-white text-xs font-bold transition-all shadow-md active:scale-[0.96] cursor-pointer"
                        >
                            <Plus className="w-4 h-4" /> Agregar Variante
                        </button>
                    </div>
                )}
            </div>

            {/* Modal de Creación Rápida de Talla */}
            <QuickCreateSizeModal
                isOpen={Boolean(quickSizeModalVariantId)}
                categories={categories}
                defaultGender={formData.gender}
                onClose={() => setQuickSizeModalVariantId(null)}
                onCreated={(newSize) => {
                    if (quickSizeModalVariantId) {
                        onToggleVariantSize(quickSizeModalVariantId, newSize.id);
                    }
                    if (onQuickCreateSize) {
                        onQuickCreateSize(newSize);
                    }
                }}
            />
        </section>
    );
}
