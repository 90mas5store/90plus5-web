'use client';

import React from 'react';
import { Bookmark, Plus } from 'lucide-react';

interface BrandsHeaderProps {
    totalCount: number;
    onNewBrand: () => void;
}

export default function BrandsHeader({ totalCount, onNewBrand }: BrandsHeaderProps) {
    return (
        <div className="p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                    <Bookmark className="w-5 h-5" />
                </span>
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                            Marcas Oficiales
                        </h1>
                        <span className="text-[10px] sm:text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-neutral-300">
                            {totalCount} marcas
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                        Administra los proveedores técnicos y marcas patrocinadoras de las equipaciones.
                    </p>
                </div>
            </div>

            <button
                type="button"
                onClick={onNewBrand}
                className="bg-white text-black font-extrabold px-4 py-2.5 rounded-xl hover:bg-neutral-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs sm:text-sm shadow-sm shrink-0 cursor-pointer"
            >
                <Plus className="w-4 h-4" />
                <span>Nueva Marca</span>
            </button>
        </div>
    );
}

