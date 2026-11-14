'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Trophy, Tag } from 'lucide-react';
import LogoUpload from '@/components/admin/LogoUpload';
import { Team, League, Brand, TeamFormData } from './types';

interface TeamFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingTeam: Team | null;
    formData: TeamFormData;
    setFormData: React.Dispatch<React.SetStateAction<TeamFormData>>;
    leagues: League[];
    brands: Brand[];
    saving: boolean;
    onSave: () => Promise<void>;
}

export function TeamFormModal({
    isOpen,
    onClose,
    editingTeam,
    formData,
    setFormData,
    leagues,
    brands,
    saving,
    onSave,
}: TeamFormModalProps) {
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
                                    {editingTeam ? 'Editar Equipo' : 'Nuevo Equipo'}
                                </h2>
                                <p className="text-xs text-neutral-400 mt-0.5">
                                    Vincula su liga base y marca técnica para optimizar la creación de productos.
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
                            {/* Escudo Oficial Optimizado */}
                            <LogoUpload
                                value={formData.logo_url}
                                onChange={(url) => setFormData((prev) => ({ ...prev, logo_url: url }))}
                                folder="teams"
                                label="Escudo Oficial del Equipo"
                                description="PNG transparente con el escudo oficial del club o selección"
                            />

                            <div className="space-y-4">
                                {/* Nombre */}
                                <div>
                                    <label className="text-[11px] font-bold uppercase text-neutral-400 mb-1.5 block tracking-wider">
                                        Nombre del Club / Selección *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                        className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-neutral-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                                        placeholder="Ej: Real Madrid"
                                    />
                                </div>

                                {/* Slug URL */}
                                <div>
                                    <label className="text-[11px] font-bold uppercase text-neutral-400 mb-1.5 block tracking-wider">
                                        Slug URL
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                                        className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-neutral-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all font-mono"
                                        placeholder="ej: real-madrid"
                                    />
                                </div>

                                {/* Liga Base & Marca Técnica Oficial */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[11px] font-bold uppercase text-neutral-400 mb-1.5 block tracking-wider flex items-center gap-1.5">
                                            <Trophy className="w-3.5 h-3.5 text-amber-400" />
                                            <span>Liga Base</span>
                                        </label>
                                        <select
                                            value={formData.league_id}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, league_id: e.target.value }))}
                                            className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                                        >
                                            <option value="">-- Seleccionar Liga --</option>
                                            {leagues.map((l) => (
                                                <option key={l.id} value={l.id}>
                                                    {l.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-bold uppercase text-neutral-400 mb-1.5 block tracking-wider flex items-center gap-1.5">
                                            <Tag className="w-3.5 h-3.5 text-emerald-400" />
                                            <span>Marca Oficial / Patrocinador</span>
                                        </label>
                                        <select
                                            value={formData.brand_id}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, brand_id: e.target.value }))}
                                            className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                                        >
                                            <option value="">-- Sin Marca Habitual --</option>
                                            {brands.map((b) => (
                                                <option key={b.id} value={b.id}>
                                                    {b.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* País & Tipo */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[11px] font-bold uppercase text-neutral-400 mb-1.5 block tracking-wider">
                                            País de Origen
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.country}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                                            className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-neutral-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                                            placeholder="Ej: España"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-bold uppercase text-neutral-400 mb-1.5 block tracking-wider">
                                            Estado
                                        </label>
                                        <select
                                            value={formData.active ? 'true' : 'false'}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.value === 'true' }))}
                                            className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                                        >
                                            <option value="true">Activo en Catálogo</option>
                                            <option value="false">Inactivo / Oculto</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Toggle Selección Nacional */}
                                <div className="pt-2">
                                    <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] cursor-pointer hover:bg-white/[0.05] transition-colors select-none">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_national_team}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, is_national_team: e.target.checked }))}
                                            className="w-4 h-4 rounded border-white/20 bg-black/50 text-white focus:ring-0 cursor-pointer"
                                        />
                                        <div>
                                            <span className="text-xs sm:text-sm font-bold text-white block">
                                                ¿Es una Selección Nacional?
                                            </span>
                                            <span className="text-[11px] text-neutral-400">
                                                Marca si el equipo representa a un país para filtros internacionales.
                                            </span>
                                        </div>
                                    </label>
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
                                <span>{saving ? 'Guardando...' : 'Guardar Equipo'}</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

