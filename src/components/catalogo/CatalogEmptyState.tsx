"use client";

import { Shirt, RotateCcw, MessageCircle } from "lucide-react";

interface CatalogEmptyStateProps {
    onClearFilters: () => void;
}

export default function CatalogEmptyState({ onClearFilters }: CatalogEmptyStateProps) {
    const whatsappMessage = encodeURIComponent("¡Hola 90+5 Store! No encontré un modelo en el catálogo online, ¿me podrían confirmar si lo tienen disponible para traer bajo pedido?");
    const whatsappUrl = `https://wa.me/50499000000?text=${whatsappMessage}`;

    return (
        <div className="text-center py-16 sm:py-24 px-4 max-w-xl mx-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/50 mb-6 shadow-xl shadow-black/50">
                <Shirt className="w-8 h-8 sm:w-10 sm:h-10 text-primary/70" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
                No encontramos prendas con estos filtros
            </h3>

            <p className="text-white/60 text-xs sm:text-sm font-medium mb-8 leading-relaxed">
                Prueba relajando los filtros de precio, temporada o liga. También podemos traer cualquier camiseta oficial que busques bajo pedido directamente a Honduras.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                    onClick={onClearFilters}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider backdrop-blur-md transition-all active:scale-95 cursor-pointer border border-white/10"
                >
                    <RotateCcw className="w-4 h-4" />
                    <span>Limpiar filtros</span>
                </button>

                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-950/40"
                >
                    <MessageCircle className="w-4 h-4" />
                    <span>Preguntar por WhatsApp</span>
                </a>
            </div>
        </div>
    );
}
