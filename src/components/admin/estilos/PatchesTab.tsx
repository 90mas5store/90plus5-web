'use client';

import React from 'react';
import { Scissors, Edit, Trash2, X, ChevronDown, Save, Loader2, Trophy, Tag, CheckCircle2 } from 'lucide-react';
import { Patch, League, Category, EMPTY_PATCH } from './types';

interface PatchesTabProps {
    patches: Patch[];
    patchesLoading: boolean;
    patchSaving: boolean;
    editingPatch: Patch | null;
    patchForm: typeof EMPTY_PATCH;
    setPatchForm: React.Dispatch<React.SetStateAction<typeof EMPTY_PATCH>>;
    leagues: League[];
    categories: Category[];
    isSuperAdmin: boolean;
    onOpenEditPatch: (p: Patch) => void;
    onOpenNewPatch: () => void;
    onSavePatch: () => void;
    onDeletePatch: (id: string) => void;
}

export default function PatchesTab({
    patches,
    patchesLoading,
    patchSaving,
    editingPatch,
    patchForm,
    setPatchForm,
    leagues,
    categories,
    isSuperAdmin,
    onOpenEditPatch,
    onOpenNewPatch,
    onSavePatch,
    onDeletePatch,
}: PatchesTabProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Lista de Parches */}
            <div className="lg:col-span-7 space-y-3">
                {patchesLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <span className="text-xs text-zinc-500 font-medium">Cargando parches...</span>
                    </div>
                ) : patches.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-white/5 rounded-3xl bg-[#0d0e12]/40">
                        <Scissors className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-400 font-bold">No hay parches configurados aún</p>
                        <p className="text-zinc-500 text-xs mt-1">Crea el primero usando el formulario lateral</p>
                    </div>
                ) : (
                    patches.map((p) => {
                        const leagueObj = leagues.find((l) => l.id === p.competition_id);
                        const categoryObj = categories.find((c) => c.id === p.category_id);

                        return (
                            <div
                                key={p.id}
                                className={`relative group flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                    editingPatch?.id === p.id
                                        ? 'border-primary/50 bg-primary/[0.04] shadow-lg'
                                        : 'border-white/[0.08] bg-[#0d0e12]/60 hover:border-white/20 hover:bg-[#0d0e12]/80'
                                }`}
                            >
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div
                                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                            p.active
                                                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                                : 'bg-zinc-600'
                                        }`}
                                    />
                                    <div className="min-w-0">
                                        <p className="font-bold text-white text-sm sm:text-base truncate">{p.name}</p>
                                        <div className="flex items-center gap-2 flex-wrap mt-1">
                                            {leagueObj ? (
                                                <span className="text-[10px] font-bold text-amber-400/90 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                                    <Trophy className="w-2.5 h-2.5" />
                                                    {leagueObj.name}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-zinc-500">Sin liga específica</span>
                                            )}

                                            {categoryObj ? (
                                                <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                                    <Tag className="w-2.5 h-2.5" />
                                                    {categoryObj.name}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-zinc-500">Todas las categorías</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 ml-3">
                                    {!p.active && (
                                        <span className="text-[10px] uppercase font-bold text-zinc-500 border border-white/10 px-2 py-0.5 rounded-full hidden sm:inline-block">
                                            Inactivo
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => onOpenEditPatch(p)}
                                        className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer active:scale-[0.98]"
                                        title="Editar Parche"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onDeletePatch(p.id)}
                                        disabled={!isSuperAdmin}
                                        title={!isSuperAdmin ? 'Solo Super Admins pueden eliminar' : 'Eliminar Parche'}
                                        className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Formulario lateral estilo Apple */}
            <div className="lg:col-span-5">
                <div className="sticky top-28 bg-[#0d0e12]/70 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 space-y-5 shadow-2xl relative overflow-hidden">
                    {/* Specular Highlight */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div>
                            <h2 className="text-sm font-black text-white uppercase tracking-wider">
                                {editingPatch ? 'Editar Parche' : 'Nuevo Parche'}
                            </h2>
                            <p className="text-xs text-zinc-400 mt-0.5">
                                Vincula a qué liga o torneo corresponde para filtrarlo automáticamente.
                            </p>
                        </div>
                        {editingPatch && (
                            <button
                                type="button"
                                onClick={onOpenNewPatch}
                                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
                                title="Cancelar edición"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Nombre */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">
                            Nombre del Parche *
                        </label>
                        <input
                            type="text"
                            value={patchForm.name}
                            onChange={(e) => setPatchForm((p) => ({ ...p, name: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && onSavePatch()}
                            placeholder="Ej. Parche Champions League, Campeón de Liga..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none text-sm transition-all"
                        />
                    </div>

                    {/* Liga / Competición */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-zinc-400 mb-2 flex items-center gap-1.5">
                            <Trophy className="w-3.5 h-3.5 text-amber-400" />
                            <span>Liga / Competición Vinculada</span>
                        </label>
                        <div className="relative">
                            <select
                                value={patchForm.competition_id}
                                onChange={(e) => setPatchForm((p) => ({ ...p, competition_id: e.target.value }))}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none appearance-none pr-10 text-xs sm:text-sm font-medium"
                            >
                                <option value="">— Parche General / Sin Liga Específica —</option>
                                {leagues.map((l) => (
                                    <option key={l.id} value={l.id}>
                                        {l.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-1.5">
                            Permite que este parche se sugiera automáticamente en camisas que disputen este torneo.
                        </p>
                    </div>

                    {/* Categoría (Deporte) */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-zinc-400 mb-2 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-violet-400" />
                            <span>Categoría de Producto</span>
                        </label>
                        <div className="relative">
                            <select
                                value={patchForm.category_id}
                                onChange={(e) => setPatchForm((p) => ({ ...p, category_id: e.target.value }))}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none appearance-none pr-10 text-xs sm:text-sm font-medium"
                            >
                                <option value="">— Todas las Categorías —</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                        </div>
                    </div>

                    {/* Toggle Activo */}
                    <label className="flex items-center justify-between p-3.5 bg-black/40 border border-white/10 rounded-xl cursor-pointer hover:bg-black/60 transition-colors select-none">
                        <span className="text-xs font-bold text-white flex items-center gap-2">
                            <span
                                className={`w-2.5 h-2.5 rounded-full ${
                                    patchForm.active ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-zinc-600'
                                }`}
                            />
                            Parche Activo en Catálogo
                        </span>
                        <input
                            type="checkbox"
                            checked={patchForm.active}
                            onChange={(e) => setPatchForm((p) => ({ ...p, active: e.target.checked }))}
                            className="w-4 h-4 rounded border-white/20 bg-black/50 text-primary cursor-pointer"
                        />
                    </label>

                    {/* Botón Guardar con Feedback Táctil */}
                    <button
                        type="button"
                        onClick={onSavePatch}
                        disabled={patchSaving}
                        className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_16px_rgba(229,9,20,0.3)] active:scale-[0.98] cursor-pointer text-xs uppercase tracking-wider"
                    >
                        {patchSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>{patchSaving ? 'Guardando...' : editingPatch ? 'Actualizar Parche' : 'Crear Parche'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
