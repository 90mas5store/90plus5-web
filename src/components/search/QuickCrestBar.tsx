'use client';

import React from 'react';
import TeamLogo from '@/components/TeamLogo';
import { QuickClub } from '@/types/search';
import { QUICK_SEARCH_CHIPS, QuickSearchChip } from '@/constants/footballAliases';

interface QuickCrestBarProps {
    topClubs: QuickClub[];
    onSelectQuery: (term: string, href?: string) => void;
}

export default function QuickCrestBar({ topClubs, onSelectQuery }: QuickCrestBarProps) {
    if (topClubs.length === 0 && QUICK_SEARCH_CHIPS.length === 0) return null;

    return (
        <div className="pt-2 pb-3 px-3 border-b border-white/5 space-y-3">
            {/* Top Clubs Crests (1-Tap Search) */}
            {topClubs.length > 0 && (
                <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 block mb-2 px-1">
                        Clubes Populares
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
                        {topClubs.map((club) => (
                            <button
                                key={club.name}
                                onClick={() => onSelectQuery(club.query)}
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/30 transition-all shrink-0 group active:scale-95 cursor-pointer"
                                title={`Ver camisetas de ${club.name}`}
                            >
                                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                    <TeamLogo src={club.logoUrl} alt={club.name} size={20} />
                                </div>
                                <span className="text-xs font-semibold text-gray-300 group-hover:text-white transition-colors whitespace-nowrap">
                                    {club.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                {QUICK_SEARCH_CHIPS.map((chip: QuickSearchChip) => (
                    <button
                        key={chip.label}
                        onClick={() => onSelectQuery(chip.query, chip.href)}
                        className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/20 text-[11px] font-bold text-gray-400 hover:text-white transition-all shrink-0 active:scale-95 cursor-pointer"
                    >
                        {chip.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
