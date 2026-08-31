'use client';

import React from 'react';
import { DollarSign, Plus, Trash2, Ruler } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { AdminVariant, AdminSize, AdminProductFormData } from '@/types/adminProduct';

interface ProductVariantsSectionProps {
    variants: AdminVariant[];
    availableVersions: string[];
    filteredSizes: AdminSize[];
    formData: AdminProductFormData;
    onAddVariant: () => void;
    onUpdateVariant: (tempId: string, field: keyof AdminVariant, value: unknown) => void;
    onRemoveVariant: (tempId: string) => void;
    onToggleVariantSize: (tempId: string, sizeId: string) => void;
}

export default function ProductVariantsSection({
    variants,
    availableVersions,
    filteredSizes,
    formData,
    onAddVariant,
    onUpdateVariant,
    onRemoveVariant,
    onToggleVariantSize,
}: ProductVariantsSectionProps) {
    return (
        <section className="bg-neutral-900/50 border border-white/5 rounded-3xl p-4 sm:p-6 md:p-10 space-y-6 sm:space-y-8 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 shrink-0">
                        <DollarSign className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-white">Variantes y Precios</h2>
                        <p className="text-gray-500 text-[10px] sm:text-xs">
                            Administra versiones (Jugador, Fan) y sus tallas/precios.
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onAddVariant}
                    className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-white/10 transition-all shrink-0 cursor-pointer"
                >
                    <Plus className="w-4 h-4" /> Agregar Variante
                </button>
            </div>

            <div className="space-y-4">
                <AnimatePresence>
                    {variants.map((variant) => (
                        <motion.div
                            key={variant.tempId}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`bg-[#0A0A0A] border ${
                                variant.active ? 'border-white/10' : 'border-red-900/30 bg-red-950/10'
                            } rounded-2xl sm:rounded-3xl p-4 sm:p-6 transition-all hover:border-white/20`}
                        >
                            <div className="flex flex-col gap-4 sm:gap-6">
                                {/* ROW 1: Header & Actions */}
                                <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                                    {/* Version Selector */}
                                    <div className="w-full sm:flex-1 sm:max-w-sm">
                                        <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">
                                            Nombre Versión
                                        </label>
                                        <select
                                            value={variant.version}
                                            onChange={(e) =>
                                                onUpdateVariant(variant.tempId, 'version', e.target.value)
                                            }
                                            className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none font-bold transition-all hover:bg-neutral-800"
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
                                            className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl px-4 py-2 cursor-pointer transition-all group"
                                        >
                                            <span
                                                className={`text-xs font-bold uppercase ${
                                                    variant.active ? 'text-green-500' : 'text-gray-500'
                                                }`}
                                            >
                                                {variant.active ? 'Visible' : 'Oculto'}
                                            </span>
                                            <div
                                                className={`w-8 h-4 rounded-full p-0.5 transition-colors ${
                                                    variant.active ? 'bg-green-500' : 'bg-gray-700'
                                                }`}
                                            >
                                                <div
                                                    className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${
                                                        variant.active ? 'translate-x-4' : 'translate-x-0'
                                                    }`}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => onRemoveVariant(variant.tempId)}
                                            className="p-3 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20 cursor-pointer"
                                            title="Eliminar Variante"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* ROW 2: Pricing Logic */}
                                <div className="bg-black/20 rounded-xl p-4 border border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Base Price */}
                                    <div>
                                        <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">
                                            Precio (HNL)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
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
                                                className="w-full bg-neutral-900 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:border-primary outline-none font-mono"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    {/* Cost (internal) */}
                                    <div>
                                        <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">
                                            Costo (L)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 font-bold text-sm">
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
                                                className="w-full bg-neutral-900 border border-green-500/20 rounded-xl pl-8 pr-4 py-3 text-sm text-green-400 focus:border-green-500/50 outline-none font-mono"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    {/* Promo Logic */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-bold uppercase text-gray-500 block">
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
                                                    className="text-[10px] font-bold uppercase text-yellow-500/80 cursor-pointer select-none"
                                                >
                                                    Activar
                                                </label>
                                            </div>
                                        </div>

                                        <div className="relative">
                                            {variant.active_original_price ? (
                                                <>
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-mono">
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
                                                        className="w-full bg-neutral-900 border border-yellow-500/30 rounded-xl pl-14 pr-4 py-3 text-sm text-yellow-500 focus:border-yellow-500 outline-none font-mono"
                                                        placeholder="0.00"
                                                    />
                                                </>
                                            ) : (
                                                <div className="w-full py-3 px-4 bg-white/5 border border-dashed border-white/10 rounded-xl text-xs text-gray-600 italic select-none text-center">
                                                    Precio normal (sin tachado)
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ROW 3: Sizes */}
                                <div>
                                    <label className="text-xs font-bold uppercase text-gray-500 mb-3 flex items-center gap-2">
                                        <Ruler className="w-3 h-3" /> Tallas Disponibles
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {filteredSizes.map((size) => {
                                            const isSelected = variant.sizeIds.has(size.id);
                                            return (
                                                <button
                                                    key={size.id}
                                                    type="button"
                                                    onClick={() => onToggleVariantSize(variant.tempId, size.id)}
                                                    className={`min-w-[40px] h-[40px] px-3 rounded-lg text-xs font-bold border transition-all duration-200 cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-white text-black border-white shadow-[0_2px_10px_rgba(255,255,255,0.2)] transform -translate-y-0.5'
                                                            : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30 hover:text-gray-300'
                                                    }`}
                                                >
                                                    {size.label}
                                                </button>
                                            );
                                        })}
                                        {filteredSizes.length === 0 && (
                                            <span className="text-xs text-gray-600 italic">
                                                {!formData.category_id && !formData.gender
                                                    ? 'No hay tallas activas en el catálogo.'
                                                    : 'Sin tallas para la categoría/género seleccionado. Configúralas en Personalización.'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {variants.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                        <p className="text-gray-500 mb-2">Este producto no tiene variantes configuradas.</p>
                        <button
                            onClick={onAddVariant}
                            type="button"
                            className="text-primary text-sm font-bold hover:underline cursor-pointer"
                        >
                            + Agregar mi primera variante
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
