'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Hash, Percent, Calendar, Sparkles } from 'lucide-react';
import { CatalogItem, DiscountFormData } from './types';
import { generateRandomCode } from './useDiscountsManager';

interface DiscountFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingId: string | null;
    form: DiscountFormData;
    setForm: React.Dispatch<React.SetStateAction<DiscountFormData>>;
    categories: CatalogItem[];
    leagues: CatalogItem[];
    teams: CatalogItem[];
    saving: boolean;
    onSave: () => Promise<void>;
}

export function DiscountFormModal({
    isOpen,
    onClose,
    editingId,
    form,
    setForm,
    categories,
    leagues,
    teams,
    saving,
    onSave,
}: DiscountFormModalProps) {
    const toggleMultiSelect = (list: string[], id: string, key: 'category_ids' | 'league_ids' | 'team_ids') => {
        const next = list.includes(id) ? list.filter((i) => i !== id) : [...list, id];
        setForm((prev) => ({ ...prev, [key]: next }));
    };

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
                        className="bg-[#0a0c10]/95 backdrop-blur-2xl border border-white/[0.1] rounded-2xl sm:rounded-3xl w-full max-w-xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90dvh] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent"
                    >
                        {/* Modal Header */}
                        <div className="p-5 sm:p-6 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
                            <div>
                                <h2 className="text-lg font-black text-white uppercase tracking-tight">
                                    {editingId ? 'Editar Código' : 'Nuevo Código de Descuento'}
                                </h2>
                                <p className="text-xs text-neutral-400 mt-0.5">
                                    Define el porcentaje de descuento, alcance en el catálogo y vigencia.
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
                            {/* Código */}
                            <div>
                                <label className="text-[11px] font-bold uppercase text-neutral-400 mb-1.5 flex items-center gap-1.5 tracking-wider">
                                    <Hash className="w-3.5 h-3.5 text-primary" />
                                    <span>Código Promocional *</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={form.code}
                                        onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                                        placeholder="Ej. 90PLUS5VIP"
                                        className="flex-1 bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono font-black tracking-widest placeholder:text-neutral-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setForm((p) => ({ ...p, code: generateRandomCode() }))}
                                        className="bg-white/5 hover:bg-white/10 active:scale-[0.98] text-neutral-300 hover:text-white border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                                    >
                                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                        <span>Generar</span>
                                    </button>
                                </div>
                            </div>

                            {/* Descripción y % */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="text-[11px] font-bold uppercase text-neutral-400 mb-1.5 block tracking-wider">
                                        Descripción interna
                                    </label>
                                    <input
                                        type="text"
                                        value={form.description}
                                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                        placeholder="Ej. Campaña de clientes frecuentes"
                                        className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-neutral-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold uppercase text-neutral-400 mb-1.5 flex items-center gap-1 tracking-wider">
                                        <Percent className="w-3 h-3 text-emerald-400" />
                                        <span>Descuento (%) *</span>
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        step={0.01}
                                        value={form.discount_pct}
                                        onChange={(e) => setForm((p) => ({ ...p, discount_pct: Number(e.target.value) }))}
                                        className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono font-bold outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Alcance: Categorías */}
                            {categories.length > 0 && (
                                <div>
                                    <label className="text-[11px] font-bold uppercase text-neutral-400 mb-2 block tracking-wider">
                                        Categorías aplicables <span className="text-neutral-500 font-normal normal-case">(vacío = todas)</span>
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {categories.map((c) => {
                                            const active = form.category_ids.includes(c.id);
                                            return (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onClick={() => toggleMultiSelect(form.category_ids, c.id, 'category_ids')}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer active:scale-[0.98] ${
                                                        active
                                                            ? 'bg-white text-black border-white shadow-xs'
                                                            : 'bg-white/5 border-white/[0.08] text-neutral-400 hover:text-white hover:bg-white/10'
                                                    }`}
                                                >
                                                    {c.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Alcance: Ligas */}
                            {leagues.length > 0 && (
                                <div>
                                    <label className="text-[11px] font-bold uppercase text-neutral-400 mb-2 block tracking-wider">
                                        Ligas aplicables <span className="text-neutral-500 font-normal normal-case">(vacío = todas)</span>
                                    </label>
                                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                                        {leagues.map((l) => {
                                            const active = form.league_ids.includes(l.id);
                                            return (
                                                <button
                                                    key={l.id}
                                                    type="button"
                                                    onClick={() => toggleMultiSelect(form.league_ids, l.id, 'league_ids')}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer active:scale-[0.98] ${
                                                        active
                                                            ? 'bg-white text-black border-white shadow-xs'
                                                            : 'bg-white/5 border-white/[0.08] text-neutral-400 hover:text-white hover:bg-white/10'
                                                    }`}
                                                >
                                                    {l.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Alcance: Equipos */}
                            {teams.length > 0 && (
                                <div>
                                    <label className="text-[11px] font-bold uppercase text-neutral-400 mb-2 block tracking-wider">
                                        Equipos aplicables <span className="text-neutral-500 font-normal normal-case">(vacío = todos)</span>
                                    </label>
                                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                                        {teams.map((t) => {
                                            const active = form.team_ids.includes(t.id);
                                            return (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => toggleMultiSelect(form.team_ids, t.id, 'team_ids')}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer active:scale-[0.98] ${
                                                        active
                                                            ? 'bg-white text-black border-white shadow-xs'
                                                            : 'bg-white/5 border-white/[0.08] text-neutral-400 hover:text-white hover:bg-white/10'
                                                    }`}
                                                >
                                                    {t.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Límites y Expiración */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-bold uppercase text-neutral-400 mb-1.5 block tracking-wider">
                                        Máximo de usos <span className="text-neutral-500 font-normal normal-case">(opcional)</span>
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={form.max_uses}
                                        onChange={(e) => setForm((p) => ({ ...p, max_uses: e.target.value }))}
                                        placeholder="Ilimitado"
                                        className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono placeholder:text-neutral-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold uppercase text-neutral-400 mb-1.5 flex items-center gap-1 tracking-wider">
                                        <Calendar className="w-3 h-3 text-neutral-400" />
                                        <span>Expiración</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={form.expires_at}
                                        onChange={(e) => setForm((p) => ({ ...p, expires_at: e.target.value }))}
                                        className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Estado Activo */}
                            <label className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] cursor-pointer hover:bg-white/[0.05] transition-colors select-none">
                                <div>
                                    <span className="text-xs sm:text-sm font-bold text-white block">Estado del Cupón</span>
                                    <span className="text-[11px] text-neutral-400">Habilitar uso inmediato en checkout</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={form.active}
                                    onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
                                    className="w-4 h-4 rounded border-white/20 bg-black/50 text-white focus:ring-0 cursor-pointer"
                                />
                            </label>
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
                                <span>{saving ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Crear Código'}</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

