import React from "react";
import Image from "next/image";
import { Sparkles, Shirt, Layers, Plus, ArrowUp, ArrowDown, X, Loader2 } from "lucide-react";
import { SelectedCollectionProduct } from "@/components/admin/SpecialBannerProductSelector";

interface SpecialBannerCollectionSectionProps {
    products: SelectedCollectionProduct[];
    loading: boolean;
    onOpenSelector: () => void;
    onMoveProduct: (index: number, direction: "up" | "down") => void;
    onRemoveProduct: (id: string) => void;
}

export default function SpecialBannerCollectionSection({
    products,
    loading,
    onOpenSelector,
    onMoveProduct,
    onRemoveProduct,
}: SpecialBannerCollectionSectionProps) {
    return (
        <div className="bg-gradient-to-b from-primary/10 via-black/40 to-black/60 border border-primary/30 rounded-3xl p-5 md:p-7 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-10 text-primary">
                <Sparkles size={120} />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                    <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest">
                        <Sparkles size={15} /> Colección Especial de Camisetas
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mt-1">
                        Prendas Asignadas a esta Campaña
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-xl">
                        Elige exactamente qué camisetas y artículos se mostrarán cuando el cliente haga clic en este banner (ej. camisetas seleccionadas del Barcelona y Real Madrid para El Clásico).
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onOpenSelector}
                    className="px-5 py-3 bg-white hover:bg-primary text-black font-black uppercase tracking-wider text-xs rounded-2xl transition flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-white/10 hover:shadow-primary/20 cursor-pointer"
                >
                    <Shirt size={16} />
                    {products.length > 0
                        ? `Gestionar Productos (${products.length})`
                        : "+ Elegir Camisetas"}
                </button>
            </div>

            {/* Lista horizontal de productos seleccionados */}
            <div className="mt-5">
                {loading ? (
                    <div className="py-8 flex items-center justify-center gap-2 text-xs text-gray-400">
                        <Loader2 size={16} className="animate-spin text-primary" /> Cargando prendas seleccionadas...
                    </div>
                ) : products.length === 0 ? (
                    <div className="py-8 text-center bg-black/40 rounded-2xl border border-dashed border-white/10 p-6">
                        <Layers size={32} className="mx-auto mb-2 text-gray-600" />
                        <p className="text-sm font-bold text-gray-300">Aún no has agregado productos a esta colección</p>
                        <p className="text-xs text-gray-500 mt-1 mb-4">
                            Haz clic en el botón de arriba para buscar camisetas por equipo y seleccionarlas a tu gusto.
                        </p>
                        <button
                            type="button"
                            onClick={onOpenSelector}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer"
                        >
                            <Plus size={14} /> Seleccionar Camisetas Ahora
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>{products.length} productos en orden de aparición:</span>
                            <span className="text-[11px] text-gray-500">Usa las flechas para reordenar</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {products.map((p, idx) => (
                                <div
                                    key={p.id}
                                    className="flex items-center gap-3 p-2.5 bg-black/60 border border-white/10 rounded-2xl hover:border-white/20 transition group"
                                >
                                    <span className="text-[10px] font-mono font-black text-gray-500 w-5 text-center">
                                        #{idx + 1}
                                    </span>

                                    <div className="w-10 h-12 relative bg-neutral-900 rounded-lg overflow-hidden shrink-0 border border-white/5">
                                        {p.image_url ? (
                                            <Image src={p.image_url} alt={p.name} fill className="object-cover" sizes="40px" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                <Shirt size={14} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-white truncate leading-tight">
                                            {p.name}
                                        </p>
                                        <p className="text-[10px] text-gray-400 truncate">
                                            {p.team_name || "Equipo"}
                                        </p>
                                        {p.price ? (
                                            <p className="text-[10px] font-mono text-primary font-bold">
                                                L {p.price.toLocaleString("es-HN")}
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <div className="flex flex-col">
                                            <button
                                                type="button"
                                                onClick={() => onMoveProduct(idx, "up")}
                                                disabled={idx === 0}
                                                className="p-1 text-gray-500 hover:text-white disabled:opacity-20 cursor-pointer"
                                                title="Mover arriba"
                                            >
                                                <ArrowUp size={11} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onMoveProduct(idx, "down")}
                                                disabled={idx === products.length - 1}
                                                className="p-1 text-gray-500 hover:text-white disabled:opacity-20 cursor-pointer"
                                                title="Mover abajo"
                                            >
                                                <ArrowDown size={11} />
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => onRemoveProduct(p.id)}
                                            className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-white/5 cursor-pointer"
                                            title="Quitar"
                                        >
                                            <X size={13} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
