import React from "react";
import { Ruler, Edit, Trash2, X, ChevronDown, Save, Loader2 } from "lucide-react";
import { Size, Category, GENDER_LABELS, EMPTY_SIZE } from "./types";

interface SizesTabProps {
    sizes: Size[];
    sizesLoading: boolean;
    sizeSaving: boolean;
    editingSize: Size | null;
    sizeForm: typeof EMPTY_SIZE;
    setSizeForm: React.Dispatch<React.SetStateAction<typeof EMPTY_SIZE>>;
    categories: Category[];
    isSuperAdmin: boolean;
    onOpenEditSize: (s: Size) => void;
    onOpenNewSize: () => void;
    onSaveSize: () => void;
    onOpenDeleteSize: (id: string) => void;
}

export default function SizesTab({
    sizes,
    sizesLoading,
    sizeSaving,
    editingSize,
    sizeForm,
    setSizeForm,
    categories,
    isSuperAdmin,
    onOpenEditSize,
    onOpenNewSize,
    onSaveSize,
    onOpenDeleteSize,
}: SizesTabProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Lista */}
            <div className="lg:col-span-7 space-y-3">
                {sizesLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : sizes.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-white/5 rounded-3xl">
                        <Ruler className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                        <p className="text-gray-500 font-bold">No hay tallas creadas aún</p>
                        <p className="text-gray-600 text-sm mt-1">Crea la primera usando el formulario</p>
                    </div>
                ) : (
                    sizes.map(s => (
                        <div
                            key={s.id}
                            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                                editingSize?.id === s.id
                                    ? "border-violet-500/40 bg-violet-500/5"
                                    : "border-white/5 bg-white/[0.02] hover:border-white/15"
                            }`}
                        >
                            <div className={`w-2 h-2 rounded-full shrink-0 ${s.active ? "bg-green-500 shadow-[0_0_6px_#22c55e]" : "bg-gray-600"}`} />
                            <div className="w-12 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                <span className="font-black text-xs text-white leading-none text-center px-1">{s.label}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-white">{s.label}</p>
                                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                    {s.category_id && (
                                        <span className="text-[10px] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded-full font-bold">
                                            {categories.find(c => c.id === s.category_id)?.name ?? "Cat."}
                                        </span>
                                    )}
                                    {s.gender && (
                                        <span className="text-[10px] text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded-full font-bold">
                                            {GENDER_LABELS[s.gender] ?? s.gender}
                                        </span>
                                    )}
                                    {!s.category_id && !s.gender && (
                                        <span className="text-[10px] text-gray-600">Universal</span>
                                    )}
                                    {s.sort_order !== null && (
                                        <span className="text-[10px] text-gray-600">Orden: {s.sort_order}</span>
                                    )}
                                    {s.additional_cost > 0 && (
                                        <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-bold">
                                            +L {s.additional_cost}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {!s.active && (
                                <span className="text-[10px] uppercase font-bold text-gray-600 border border-gray-700 px-2 py-0.5 rounded-full shrink-0">
                                    Inactiva
                                </span>
                            )}
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => onOpenEditSize(s)}
                                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                                    title="Editar"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onOpenDeleteSize(s.id)}
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

            {/* Formulario talla */}
            <div className="lg:col-span-5">
                <div className="sticky top-28 bg-neutral-900/50 border border-white/5 rounded-3xl p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-white uppercase tracking-widest">
                            {editingSize ? "Editar Talla" : "Nueva Talla"}
                        </h2>
                        {editingSize && (
                            <button
                                type="button"
                                onClick={onOpenNewSize}
                                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
                                title="Cancelar edición"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">
                            Etiqueta *
                        </label>
                        <input
                            type="text"
                            value={sizeForm.label}
                            onChange={e => setSizeForm(s => ({ ...s, label: e.target.value }))}
                            onKeyDown={e => e.key === "Enter" && onSaveSize()}
                            placeholder="Ej. XS, 26, 4 años, 28 MX..."
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500/50 outline-none transition-all font-medium"
                        />
                        <p className="text-[10px] text-gray-600 mt-1.5 ml-1">Ropa (XS-XXL), tenis (24-30), niño (2-14 años), etc.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">
                                Categoría
                            </label>
                            <div className="relative">
                                <select
                                    value={sizeForm.category_id}
                                    onChange={e => setSizeForm(s => ({ ...s, category_id: e.target.value }))}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500/50 outline-none appearance-none pr-8 font-medium text-sm"
                                >
                                    <option value="">— Universal —</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">
                                Género
                            </label>
                            <div className="relative">
                                <select
                                    value={sizeForm.gender}
                                    onChange={e => setSizeForm(s => ({ ...s, gender: e.target.value }))}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500/50 outline-none appearance-none pr-8 font-medium text-sm"
                                >
                                    <option value="">— Todos —</option>
                                    <option value="man">Hombre</option>
                                    <option value="woman">Mujer</option>
                                    <option value="kid">Niño</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-600 -mt-2 ml-1">Sin selección = aplica a todos los productos</p>

                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">
                            Orden de visualización
                        </label>
                        <input
                            type="number"
                            value={sizeForm.sort_order}
                            onChange={e => setSizeForm(s => ({ ...s, sort_order: e.target.value }))}
                            placeholder="Ej. 1, 2, 3..."
                            min={0}
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500/50 outline-none font-medium"
                        />
                        <p className="text-[10px] text-gray-600 mt-1.5 ml-1">Número menor aparece primero. Deja vacío para orden automático.</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">
                            Costo Adicional (L)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 font-bold text-sm">+L</span>
                            <input
                                type="number"
                                value={sizeForm.additional_cost}
                                onChange={e => setSizeForm(s => ({ ...s, additional_cost: e.target.value }))}
                                placeholder="0"
                                min={0}
                                step={0.01}
                                className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 p-3 text-white focus:border-amber-500/50 outline-none font-medium"
                            />
                        </div>
                        <p className="text-[10px] text-gray-600 mt-1.5 ml-1">Ej: L 100 extra para tallas 3XL, 4XL. Dejar en 0 si no aplica.</p>
                    </div>

                    <label className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-xl cursor-pointer hover:bg-black/60 transition-colors">
                        <span className="text-sm font-medium text-white flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${sizeForm.active ? "bg-green-500 shadow-[0_0_6px_#22c55e]" : "bg-gray-600"}`} />
                            Talla Activa
                        </span>
                        <input
                            type="checkbox"
                            checked={sizeForm.active}
                            onChange={e => setSizeForm(s => ({ ...s, active: e.target.checked }))}
                            className="w-4 h-4 accent-violet-500 rounded cursor-pointer"
                        />
                    </label>

                    <button
                        type="button"
                        onClick={onSaveSize}
                        disabled={sizeSaving}
                        className="w-full bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                        {sizeSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {sizeSaving ? "Guardando..." : editingSize ? "Actualizar Talla" : "Crear Talla"}
                    </button>

                    <p className="text-[10px] text-gray-600 text-center leading-relaxed">
                        Las tallas activas aparecen en los productos que las tengan asignadas
                    </p>
                </div>
            </div>
        </div>
    );
}
