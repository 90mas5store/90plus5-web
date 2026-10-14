import React from "react";
import { Scissors, Edit, Trash2, X, ChevronDown, Save, Loader2 } from "lucide-react";
import { Patch, League, Category, EMPTY_PATCH } from "./types";

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
            {/* Lista */}
            <div className="lg:col-span-7 space-y-3">
                {patchesLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : patches.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-white/5 rounded-3xl">
                        <Scissors className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                        <p className="text-gray-500 font-bold">No hay parches creados aún</p>
                        <p className="text-gray-600 text-sm mt-1">Crea el primero usando el formulario</p>
                    </div>
                ) : (
                    patches.map(p => (
                        <div
                            key={p.id}
                            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                                editingPatch?.id === p.id
                                    ? "border-violet-500/40 bg-violet-500/5"
                                    : "border-white/5 bg-white/[0.02] hover:border-white/15"
                            }`}
                        >
                            <div className={`w-2 h-2 rounded-full shrink-0 ${p.active ? "bg-green-500 shadow-[0_0_6px_#22c55e]" : "bg-gray-600"}`} />
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-white truncate">{p.name}</p>
                                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                    {p.competition_id && (
                                        <span className="text-[10px] text-gray-500 truncate">
                                            {leagues.find(l => l.id === p.competition_id)?.name ?? "Liga desconocida"}
                                        </span>
                                    )}
                                    {p.category_id && (
                                        <span className="text-[10px] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded-full font-bold">
                                            {categories.find(c => c.id === p.category_id)?.name ?? "Categoría"}
                                        </span>
                                    )}
                                    {!p.category_id && (
                                        <span className="text-[10px] text-gray-600">Todas las categorías</span>
                                    )}
                                </div>
                            </div>
                            {!p.active && (
                                <span className="text-[10px] uppercase font-bold text-gray-600 border border-gray-700 px-2 py-0.5 rounded-full shrink-0">
                                    Inactivo
                                </span>
                            )}
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => onOpenEditPatch(p)}
                                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                                    title="Editar"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDeletePatch(p.id)}
                                    disabled={!isSuperAdmin}
                                    title={!isSuperAdmin ? "Solo super admin puede eliminar" : "Eliminar"}
                                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Formulario parche */}
            <div className="lg:col-span-5">
                <div className="sticky top-28 bg-neutral-900/50 border border-white/5 rounded-3xl p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-white uppercase tracking-widest">
                            {editingPatch ? "Editar Parche" : "Nuevo Parche"}
                        </h2>
                        {editingPatch && (
                            <button
                                type="button"
                                onClick={onOpenNewPatch}
                                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
                                title="Cancelar edición"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">
                            Nombre del Parche *
                        </label>
                        <input
                            type="text"
                            value={patchForm.name}
                            onChange={e => setPatchForm(p => ({ ...p, name: e.target.value }))}
                            onKeyDown={e => e.key === "Enter" && onSavePatch()}
                            placeholder="Ej. Parche Champions, Liga MX..."
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500/50 outline-none transition-all font-medium"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">
                            Categoría (deporte)
                        </label>
                        <div className="relative">
                            <select
                                value={patchForm.category_id}
                                onChange={e => setPatchForm(p => ({ ...p, category_id: e.target.value }))}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500/50 outline-none appearance-none pr-10 font-medium"
                            >
                                <option value="">— Todas las categorías —</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        </div>
                        <p className="text-[10px] text-gray-600 mt-1.5 ml-1">Ej. "Fútbol" para que solo aparezca en camisas de fútbol</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">
                            Liga / Competición
                        </label>
                        <div className="relative">
                            <select
                                value={patchForm.competition_id}
                                onChange={e => setPatchForm(p => ({ ...p, competition_id: e.target.value }))}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500/50 outline-none appearance-none pr-10 font-medium"
                            >
                                <option value="">— Sin liga asignada —</option>
                                {leagues.map(l => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        </div>
                    </div>

                    <label className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-xl cursor-pointer hover:bg-black/60 transition-colors">
                        <span className="text-sm font-medium text-white flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${patchForm.active ? "bg-green-500 shadow-[0_0_6px_#22c55e]" : "bg-gray-600"}`} />
                            Parche Activo
                        </span>
                        <input
                            type="checkbox"
                            checked={patchForm.active}
                            onChange={e => setPatchForm(p => ({ ...p, active: e.target.checked }))}
                            className="w-4 h-4 accent-violet-500 rounded cursor-pointer"
                        />
                    </label>

                    <button
                        type="button"
                        onClick={onSavePatch}
                        disabled={patchSaving}
                        className="w-full bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                        {patchSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {patchSaving ? "Guardando..." : editingPatch ? "Actualizar Parche" : "Crear Parche"}
                    </button>
                </div>
            </div>
        </div>
    );
}
