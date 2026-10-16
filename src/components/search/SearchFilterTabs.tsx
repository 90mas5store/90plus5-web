import React from 'react';

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
        onSelectFilter(filter);
    };

    return (
        <div
            className="px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-white/[0.02]"
            onMouseDown={(e) => e.stopPropagation()}
        >
            <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => handleFilterClick(e, 'all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeFilter === 'all'
                        ? 'bg-primary text-white shadow-[0_0_12px_rgba(229,9,20,0.5)] scale-[1.02]'
                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
            >
                Todos ({totalCount})
            </button>
            {playerCount > 0 && (
                <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => handleFilterClick(e, 'players')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        activeFilter === 'players'
                            ? 'bg-primary text-white shadow-[0_0_12px_rgba(229,9,20,0.5)] scale-[1.02]'
                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
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
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        activeFilter === 'products'
                            ? 'bg-primary text-white shadow-[0_0_12px_rgba(229,9,20,0.5)] scale-[1.02]'
                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
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
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        activeFilter === 'leagues'
                            ? 'bg-primary text-white shadow-[0_0_12px_rgba(229,9,20,0.5)] scale-[1.02]'
                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
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
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        activeFilter === 'categories'
                            ? 'bg-primary text-white shadow-[0_0_12px_rgba(229,9,20,0.5)] scale-[1.02]'
                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                >
                    ⚡ Colecciones ({categoryCount})
                </button>
            )}
        </div>
    );
}
