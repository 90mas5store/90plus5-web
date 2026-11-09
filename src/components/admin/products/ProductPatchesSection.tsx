'use client';

import React, { useMemo, useRef } from 'react';
import { ShieldPlus, Trophy, Sparkles, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { AdminPatch, CatalogItem } from '@/types/adminProduct';

interface ProductPatchesSectionProps {
    filteredPatches: AdminPatch[];
    productPatches: Set<string>;
    categoryId: string;
    onTogglePatch: (patchId: string) => void;
    leagues?: CatalogItem[];
    selectedLeagues?: Set<string>;
}

export default function ProductPatchesSection({
    filteredPatches,
    productPatches,
    categoryId,
    onTogglePatch,
    leagues = [],
    selectedLeagues = new Set(),
}: ProductPatchesSectionProps) {
    const leaguePatchesRef = useRef<HTMLDivElement>(null);
    const otherPatchesRef = useRef<HTMLDivElement>(null);

    const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
        if (!ref.current) return;
        const offset = direction === 'left' ? -240 : 240;
        ref.current.scrollBy({ left: offset, behavior: 'smooth' });
    };

    // Parches organizados por Competición vinculada
    const { leaguePatches, otherPatches } = useMemo(() => {
        const lp: { patch: AdminPatch; leagueName: string }[] = [];
        const op: AdminPatch[] = [];

        filteredPatches.forEach((p) => {
            if (p.competition_id && selectedLeagues.has(p.competition_id)) {
                const league = leagues.find((l) => l.id === p.competition_id);
                lp.push({ patch: p, leagueName: league?.name || 'Torneo' });
            } else {
                op.push(p);
            }
        });

        return { leaguePatches: lp, otherPatches: op };
    }, [filteredPatches, selectedLeagues, leagues]);

    return (
        <div className="relative bg-[#0d0e12]/80 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-3xl p-5 sm:p-6 space-y-4 overflow-hidden">
            {/* Top specular highlight - Apple Design System */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <ShieldPlus className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xs font-black text-white uppercase tracking-wider truncate">
                                Parches Disponibles
                            </h2>
                            {productPatches.size > 0 && (
                                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 rounded-full shrink-0">
                                    {productPatches.size}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 🏆 Parches de las Ligas / Torneos Seleccionados de esta Camiseta */}
            {leaguePatches.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Trophy className="w-3 h-3" /> Torneos de esta Camisa
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => scrollContainer(leaguePatchesRef, 'left')}
                                className="w-6 h-6 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all active:scale-[0.92] cursor-pointer"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => scrollContainer(leaguePatchesRef, 'right')}
                                className="w-6 h-6 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all active:scale-[0.92] cursor-pointer"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    <div
                        ref={leaguePatchesRef}
                        className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none custom-scrollbar snap-x select-none"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {leaguePatches.map(({ patch, leagueName }) => {
                            const isSelected = productPatches.has(patch.id);
                            return (
                                <button
                                    key={patch.id}
                                    type="button"
                                    onClick={() => onTogglePatch(patch.id)}
                                    className={`px-3 py-2 rounded-2xl text-xs font-bold border transition-all duration-150 shrink-0 flex items-center gap-2 cursor-pointer active:scale-[0.96] snap-start ${
                                        isSelected
                                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 font-extrabold shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                                            : 'bg-[#14151b] border-white/10 hover:border-amber-400/25 text-gray-300 hover:text-white'
                                    }`}
                                >
                                    <div className="flex flex-col text-left">
                                        <span className="whitespace-nowrap">{patch.name}</span>
                                        <span className="text-[9px] opacity-60 font-normal">({leagueName})</span>
                                    </div>
                                    <div
                                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                            isSelected
                                                ? 'bg-amber-500 border-amber-500 text-black shadow-[0_0_6px_rgba(245,158,11,0.5)]'
                                                : 'border-white/20 bg-white/[0.03]'
                                        }`}
                                    >
                                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ✨ Otros Parches & Conmemorativos */}
            {otherPatches.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-purple-400" /> Otros Parches
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => scrollContainer(otherPatchesRef, 'left')}
                                className="w-6 h-6 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all active:scale-[0.92] cursor-pointer"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => scrollContainer(otherPatchesRef, 'right')}
                                className="w-6 h-6 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all active:scale-[0.92] cursor-pointer"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    <div
                        ref={otherPatchesRef}
                        className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none custom-scrollbar snap-x select-none"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {otherPatches.map((patch) => {
                            const isSelected = productPatches.has(patch.id);
                            return (
                                <button
                                    key={patch.id}
                                    type="button"
                                    onClick={() => onTogglePatch(patch.id)}
                                    className={`px-3 py-2 rounded-2xl text-xs font-bold border transition-all duration-150 shrink-0 flex items-center gap-2 cursor-pointer active:scale-[0.96] snap-start ${
                                        isSelected
                                            ? 'bg-purple-500/20 border-purple-500/50 text-purple-200 font-extrabold shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                                            : 'bg-[#14151b] border-white/10 hover:border-white/20 text-gray-300 hover:text-white'
                                    }`}
                                >
                                    <span className="whitespace-nowrap">{patch.name}</span>
                                    <div
                                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                            isSelected
                                                ? 'bg-purple-500 border-purple-500 text-white shadow-[0_0_6px_rgba(168,85,247,0.5)]'
                                                : 'border-white/20 bg-white/[0.03]'
                                        }`}
                                    >
                                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {filteredPatches.length === 0 && (
                <p className="text-xs text-gray-500 py-2 italic text-center">
                    {!categoryId
                        ? 'No hay parches disponibles en el catálogo.'
                        : 'Sin parches para esta categoría.'}
                </p>
            )}

            <p className="text-[10px] text-gray-500 font-medium">
                Desliza horizontalmente para seleccionar o desmarcar parches.
            </p>
        </div>
    );
}
