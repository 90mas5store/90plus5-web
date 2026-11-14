'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';
import LogoUpload from '@/components/admin/LogoUpload';
import { Brand, BrandFormData } from './types';

interface BrandFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingBrand: Brand | null;
    formData: BrandFormData;
    setFormData: React.Dispatch<React.SetStateAction<BrandFormData>>;
    saving: boolean;
    onNameChange: (val: string) => void;
    onSave: () => Promise<void>;
}

export function BrandFormModal({
    isOpen,
    onClose,
    editingBrand,
    formData,
    setFormData,
    saving,
    onNameChange,
    onSave,
}: BrandFormModalProps) {
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
                        className="bg-[#0a0c10]/95 backdrop-blur-2xl border border-white/[0.1] rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90dvh] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent"
                    >
                        {/* Modal Header */}
                        <div className="p-5 sm:p-6 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
                            <div>
                                <h2 className="text-lg font-black text-white uppercase tracking-tight">
                                    {editingBrand ? 'Editar Marca' : 'Nueva Marca'}
                                </h2>
                                <p className="text-xs text-neutral-400 mt-0.5">
                                    Configura el proveedor técnico y su logotipo oficial.
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
                        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
                            {/* Logo Oficial */}
                            <LogoUpload
                                value={formData.logo_url}
                                onChange={(url) => setFormData((prev) => ({ ...prev, logo_url: url }))}
                                folder="brands"
                                label="Logo de la Marca"
                                description="PNG o SVG transparente del logotipo de la marca técnica"
                            />

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[11px] font-bold uppercase text-neutral-400 mb-1.5 block tracking-wider">
                                        Nombre de la Marca *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => onNameChange(e.target.value)}
                                        className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-neutral-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                                        placeholder="Ej: Nike, Adidas, Puma"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold uppercase text-neutral-400 mb-1.5 block tracking-wider">
                                        Slug (URL)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                                        className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-neutral-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all font-mono"
                                        placeholder="ej: nike"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[11px] font-bold uppercase text-neutral-400 mb-1.5 block tracking-wider">
                                            Orden
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.sort_order}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    sort_order: parseInt(e.target.value) || 0,
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
                                            <option value="true">Activo</option>
                                            <option value="false">Inactivo</option>
                                        </select>
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
                                <span>{saving ? 'Guardando...' : 'Guardar Marca'}</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

