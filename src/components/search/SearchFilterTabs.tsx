import React from 'react';
import { triggerHaptic } from '@/components/header/haptics';

export type SearchFilterType = 'all' | 'players' | 'products' | 'categories' | 'leagues';

interface SearchFilterTabsProps {
    activeFilter: SearchFilterType;
    totalCount: number;
    playerCount: number;
    productCount: number;
    leagueCount: number;
    categoryCount: number;
    onSelectFilter: (filter: SearchFilterType) => void;
}

export default function SearchFilterTabs({
    activeFilter,
    totalCount,
    playerCount,
    productCount,
    leagueCount,
    categoryCount,
    onSelectFilter,
}: SearchFilterTabsProps) {
    const handleFilterClick = (e: React.MouseEvent, filter: SearchFilterType) => {
        e.preventDefault();
        e.stopPropagation();
        triggerHaptic(8);
        onSelectFilter(filter);
    };

    return (
        <div
            className="px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-white/[0.015] border-b border-white/[0.05]"
            onMouseDown={(e) => e.stopPropagation()}
        >
            <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => handleFilterClick(e, 'all')}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    activeFilter === 'all'
                        ? 'bg-white/15 text-white border border-white/25 shadow-sm active:scale-95'
                        : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/5 active:scale-95'
                }`}
            >
                Todos ({totalCount})
            </button>
            {playerCount > 0 && (
                <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => handleFilterClick(e, 'players')}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                        activeFilter === 'players'
                            ? 'bg-purple-500/20 text-purple-200 border border-purple-500/35 shadow-sm active:scale-95'
                            : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/5 active:scale-95'
                    }`}
                >
                    ⚽ Jugadores ({playerCount})
                </button>
            )}
            {productCount > 0 && (
                <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => handleFilterClick(e, 'products')}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                        activeFilter === 'products'
                            ? 'bg-primary/20 text-red-200 border border-primary/35 shadow-sm active:scale-95'
                            : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/5 active:scale-95'
                    }`}
                >
                    👕 Camisetas ({productCount})
                </button>
            )}
            {leagueCount > 0 && (
                <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => handleFilterClick(e, 'leagues')}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                        activeFilter === 'leagues'
                            ? 'bg-amber-500/20 text-amber-200 border border-amber-500/35 shadow-sm active:scale-95'
                            : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/5 active:scale-95'
                    }`}
                >
                    🏆 Ligas ({leagueCount})
                </button>
            )}
            {categoryCount > 0 && (
                <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => handleFilterClick(e, 'categories')}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                        activeFilter === 'categories'
                            ? 'bg-blue-500/20 text-blue-200 border border-blue-500/35 shadow-sm active:scale-95'
                            : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/5 active:scale-95'
                    }`}
                >
                    ⚡ Colecciones ({categoryCount})
                </button>
            )}
        </div>
    );
}
