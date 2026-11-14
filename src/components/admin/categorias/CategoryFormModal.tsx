'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Monitor, Smartphone } from 'lucide-react';
import ImageUpload from '@/components/admin/ImageUpload';
import FocalPointPicker from '@/components/admin/FocalPointPicker';
import { Category, CategoryFormData } from './types';

interface CategoryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingCategory: Category | null;
    formData: CategoryFormData;
    setFormData: React.Dispatch<React.SetStateAction<CategoryFormData>>;
    saving: boolean;
    onNameChange: (val: string) => void;
    onSave: () => Promise<void>;
}

export function CategoryFormModal({
    isOpen,
    onClose,
    editingCategory,
    formData,
    setFormData,
    saving,
    onNameChange,
    onSave,
}: CategoryFormModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="absolute inset-0" onClick={onClose} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                        className="bg-[#0a0c10]/95 backdrop-blur-2xl border border-white/[0.1] rounded-2xl sm:rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90dvh] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent"
                    >
                        {/* Modal Header */}
                        <div className="p-5 sm:p-6 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
                            <div>
                                <h2 className="text-lg font-black text-white uppercase tracking-tight">
                                    {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                                </h2>
                                <p className="text-xs text-neutral-400 mt-0.5">
                                    Configura los metadatos de categoría y el encuadre focal de imagen.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
                            {/* Icon Upload */}
                            <div className="flex flex-col items-center">
                                <label className="text-[11px] font-bold uppercase text-neutral-400 mb-2.5 tracking-wider">
                                    Icono o Imagen de Categoría
                                </label>
                                <div className="w-32">
                                    <ImageUpload
                                        value={formData.icon_url}
                                        onChange={(url) => setFormData((prev) => ({ ...prev, icon_url: url }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[11px] font-bold uppercase text-neutral-400 mb-1.5 block tracking-wider">
                                            Orden
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.order_index}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    order_index: parseInt(e.target.value) || 0,
                                                }))
                                            }
                                            className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold uppercase text-neutral-400 mb-1.5 block tracking-wider">
                                            Estado
                                        </label>
                                        <select
                                            value={formData.active ? 'true' : 'false'}
                                            onChange={(e) =>
                                                setFormData((prev) => ({ ...prev, active: e.target.value === 'true' }))
                                            }
                                            className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                                        >
                                            <option value="true">Activo en Catálogo</option>
                                            <option value="false">Inactivo / Oculto</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold uppercase text-neutral-400 mb-1.5 block tracking-wider">
                                        Nombre de la Categoría *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => onNameChange(e.target.value)}
                                        className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-neutral-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                                        placeholder="Ej: Camisetas, Retro, Pantalones"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold uppercase text-neutral-400 mb-1.5 block tracking-wider">
                                        Slug (URL) *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                                        className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-neutral-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all font-mono"
                                        placeholder="ej: camisetas"
                                    />
                                </div>
                            </div>

                            {/* Punto focal del hero */}
                            <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-black/20">
                                <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06] flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider">
                                        Punto Focal — Hero Banner
                                    </span>
                                </div>
                                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <Monitor className="w-3.5 h-3.5 text-neutral-400" />
                                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                                                Desktop (16:5)
                                            </span>
                                        </div>
                                        <FocalPointPicker
                                            label="Desktop"
                                            imageUrl={formData.slug ? `/heroes/${formData.slug}.jpg` : undefined}
                                            value={formData.hero_image_position_desktop}
                                            onChange={(v) =>
                                                setFormData((prev) => ({ ...prev, hero_image_position_desktop: v }))
                                            }
                                            aspectRatio="16/5"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <Smartphone className="w-3.5 h-3.5 text-neutral-400" />
                                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                                                Mobile (4:3)
                                            </span>
                                        </div>
                                        <FocalPointPicker
                                            label="Mobile"
                                            imageUrl={formData.slug ? `/heroes/${formData.slug}.jpg` : undefined}
                                            value={formData.hero_image_position_mobile}
                                            onChange={(v) =>
                                                setFormData((prev) => ({ ...prev, hero_image_position_mobile: v }))
                                            }
                                            aspectRatio="4/3"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-black/40 flex justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-white/5 hover:bg-white/10 active:scale-[0.98] text-neutral-300 hover:text-white border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs sm:text-sm transition-all cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={onSave}
                                disabled={saving}
                                className="bg-white text-black font-extrabold hover:bg-neutral-200 active:scale-[0.98] rounded-xl px-4 py-2 text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                <span>{saving ? 'Guardando...' : 'Guardar Categoría'}</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

