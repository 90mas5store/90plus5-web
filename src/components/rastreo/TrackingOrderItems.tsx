"use client";

import { Shirt, Sparkles, Package } from "lucide-react";
import ProductImage from "@/components/ProductImage";
import type { TrackingOrderItem } from "./TrackingTypes";

interface TrackingOrderItemsProps {
    items: TrackingOrderItem[];
}

export default function TrackingOrderItems({ items }: TrackingOrderItemsProps) {
    return (
        <div className="rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/[0.08] p-5 sm:p-6 backdrop-blur-xl relative overflow-hidden">
            {/* Hairline superior */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <Package className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                            Prendas del Pedido
                        </h3>
                        <p className="text-[11px] text-white/50">
                            {items.length} {items.length === 1 ? "artículo" : "artículos"} en este envío
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {items.map((item, idx) => (
                    <div
                        key={idx}
                        className="flex items-center gap-3.5 sm:gap-4 p-3 sm:p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] transition-all group"
                    >
                        {/* Miniatura de la camiseta */}
                        <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-black/60 border border-white/10 overflow-hidden relative shrink-0 p-1">
                            <ProductImage
                                src={item.image}
                                alt={item.product || "Camiseta deportiva"}
                                width={72}
                                height={72}
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                        </div>

                        {/* Información del artículo */}
                        <div className="flex-1 min-w-0">
                            {item.team && (
                                <span className="block text-[11px] font-bold text-primary uppercase tracking-wider truncate">
                                    {item.team}
                                </span>
                            )}
                            <h4 className="text-xs sm:text-sm font-black text-white truncate leading-snug">
                                {item.product || "Camiseta Oficial"}
                            </h4>

                            {/* Versión, Talla y Dorsal */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                {item.version && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-[10px] font-bold text-white/80 uppercase">
                                        <Shirt className="w-2.5 h-2.5 text-white/50" />
                                        {item.version}
                                    </span>
                                )}

                                {item.size && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.08] border border-white/15 text-[10px] font-bold text-white uppercase tracking-wider font-mono">
                                        Talla {item.size}
                                    </span>
                                )}

                                {item.personalization && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary">
                                        <Sparkles className="w-2.5 h-2.5 text-primary" />
                                        {item.personalization}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Cantidad */}
                        <div className="shrink-0 text-right pr-1">
                            <span className="text-xs font-mono font-bold text-white/60 bg-white/[0.05] px-2 py-1 rounded-lg border border-white/5">
                                x{item.quantity || 1}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
