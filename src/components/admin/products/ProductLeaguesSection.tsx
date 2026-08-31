'use client';

import React from 'react';
import { CheckCircle, ShieldPlus } from 'lucide-react';
import { CatalogItem } from '@/types/adminProduct';

interface ProductLeaguesSectionProps {
    leagues: CatalogItem[];
    selectedLeagues: Set<string>;
    onToggleLeague: (leagueId: string) => void;
}

export default function ProductLeaguesSection({
    leagues,
    selectedLeagues,
    onToggleLeague,
}: ProductLeaguesSectionProps) {
    return (
        <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6 space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <ShieldPlus className="w-4 h-4 text-primary" /> Ligas / Competiciones
            </h2>

            <div className="bg-black/50 border border-white/10 rounded-xl p-3 max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                {leagues.map((l) => {
                    const isSelected = selectedLeagues.has(l.id);
                    return (
                        <div
                            key={l.id}
                            onClick={() => onToggleLeague(l.id)}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                isSelected
                                    ? 'bg-primary/10 border border-primary/30'
                                    : 'hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            <div
                                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                    isSelected ? 'bg-primary border-primary' : 'border-white/30'
                                }`}
                            >
                                {isSelected && <CheckCircle className="w-3 h-3 text-black" />}
                            </div>
                            <span
                                className={`text-sm ${
                                    isSelected ? 'text-primary font-bold' : 'text-gray-400'
                                }`}
                            >
                                {l.name}
                            </span>
                        </div>
                    );
                })}
            </div>
            <p className="text-[10px] text-gray-600 mt-1 ml-1">
                * Selecciona todas las que apliquen (Ej: LaLiga + Champions League)
            </p>
        </div>
    );
}
