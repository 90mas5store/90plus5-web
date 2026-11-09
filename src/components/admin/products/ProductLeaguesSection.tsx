'use client';

import React, { useRef } from 'react';
import { Check, ShieldPlus, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { CatalogItem } from '@/types/adminProduct';

interface ProductLeaguesSectionProps {
    leagues: CatalogItem[];
    selectedLeagues: Set<string>;
    onToggleLeague: (leagueId: string) => void;
    primaryLeagueId?: string | null;
}

export default function ProductLeaguesSection({
    leagues,
    selectedLeagues,
    onToggleLeague,
    primaryLeagueId = null,
}: ProductLeaguesSectionProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return;
        const offset = direction === 'left' ? -260 : 260;
        scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    };

    // Ordenar: primero la liga primaria del equipo, luego seleccionadas, luego el resto alfabético
    const sortedLeagues = [...leagues].sort((a, b) => {
        const aIsPrimary = a.id === primaryLeagueId ? 1 : 0;
        const bIsPrimary = b.id === primaryLeagueId ? 1 : 0;
        if (aIsPrimary !== bIsPrimary) return bIsPrimary - aIsPrimary;

        const aSelected = selectedLeagues.has(a.id) ? 1 : 0;
        const bSelected = selectedLeagues.has(b.id) ? 1 : 0;
        if (aSelected !== bSelected) return bSelected - aSelected;

        return a.name.localeCompare(b.name);
    });

    return (
        <div className="relative bg-[#0d0e12]/80 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-3xl p-5 sm:p-6 space-y-3.5 overflow-hidden">
            {/* Top specular highlight - Apple Design System */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <ShieldPlus className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xs font-black text-white uppercase tracking-wider truncate">
                                Ligas / Competiciones
                            </h2>
                            {selectedLeagues.size > 0 && (
                                <span className="text-[10px] font-bold text-primary bg-primary/15 border border-primary/25 px-2 py-0.5 rounded-full shrink-0">
                                    {selectedLeagues.size}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Controles de deslizamiento */}
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        type="button"
                        onClick={() => scroll('left')}
                        className="w-7 h-7 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all active:scale-[0.92] cursor-pointer"
                        title="Deslizar a la izquierda"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => scroll('right')}
                        className="w-7 h-7 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all active:scale-[0.92] cursor-pointer"
                        title="Deslizar a la derecha"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Slider Horizontal Compacto de Chips de Ligas */}
            <div
                ref={scrollContainerRef}
                className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none custom-scrollbar snap-x select-none"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {sortedLeagues.length === 0 ? (
                    <p className="text-xs text-gray-500 py-2 italic">
                        No hay ligas registradas en el sistema.
                    </p>
                ) : (
                    sortedLeagues.map((l) => {
                        const isSelected = selectedLeagues.has(l.id);
                        const isPrimary = l.id === primaryLeagueId;

                        return (
                            <button
                                key={l.id}
                                type="button"
                                onClick={() => onToggleLeague(l.id)}
                                className={`px-3 py-2 rounded-2xl text-xs font-bold border transition-all duration-150 shrink-0 flex items-center gap-2 cursor-pointer active:scale-[0.96] snap-start ${
                                    isSelected
                                        ? 'bg-primary/20 border-primary text-white font-extrabold shadow-[0_0_12px_rgba(229,9,20,0.3)]'
                                        : 'bg-[#14151b] border-white/10 hover:border-white/20 text-gray-300 hover:text-white'
                                }`}
                            >
                                {isPrimary && (
                                    <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                                )}
                                <span className="whitespace-nowrap">{l.name}</span>
                                <div
                                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                        isSelected
                                            ? 'bg-primary border-primary text-white shadow-[0_0_6px_rgba(229,9,20,0.5)]'
                                            : 'border-white/20 bg-white/[0.03]'
                                    }`}
                                >
                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            <p className="text-[10px] text-gray-500 font-medium flex items-center justify-between">
                <span>Desliza horizontalmente para seleccionar más torneos.</span>
                {primaryLeagueId && <span className="text-amber-400/90 text-[10px]">⭐ Liga asignada al equipo</span>}
            </p>
        </div>
    );
}
