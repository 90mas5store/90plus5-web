'use client';

import { Filter, X, RotateCcw } from 'lucide-react';
import { CatalogFilters } from './CatalogFilterPanel';
import { PRICE_LABEL_MAP, SORT_LABEL_MAP } from '@/constants/catalogo';

interface ActiveFilterChipsProps {
    queryParam: string | null;
    categoryName?: string | null | undefined;
    leagueName: string | null | undefined;
    teamName: string | null | undefined;
    brandName: string | null | undefined;
    filters: CatalogFilters;
    onRemoveQuery: () => void;
    onRemoveCategory?: () => void;
    onRemoveLeague: () => void;
    onRemoveTeam: () => void;
    onRemoveBrand: () => void;
    onRemoveSeason: () => void;
    onRemoveGender: () => void;
    onRemovePrice: () => void;
    onRemoveSort: () => void;
    onClearAll: () => void;
}

export default function ActiveFilterChips({
    queryParam,
    categoryName,
    leagueName,
    teamName,
    brandName,
    filters,
    onRemoveQuery,
    onRemoveCategory,
    onRemoveLeague,
    onRemoveTeam,
    onRemoveBrand,
    onRemoveSeason,
    onRemoveGender,
    onRemovePrice,
    onRemoveSort,
    onClearAll,
}: ActiveFilterChipsProps) {
    const isUuid = (val: string | null | undefined) =>
        Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

    const displayTeamName = isUuid(teamName) ? null : teamName;
    const displayBrandName = isUuid(brandName) ? null : brandName;

    const hasActiveFilters = Boolean(
        queryParam ||
        leagueName ||
        displayTeamName ||
        displayBrandName ||
        filters.season ||
        filters.gender ||
        filters.priceRange ||
        (filters.sortBy && filters.sortBy !== 'relevance')
    );

    if (!hasActiveFilters) return null;

    const chipClass =
        'shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.10] border border-white/15 text-white/90 text-[11px] sm:text-xs font-medium backdrop-blur-md transition-all active:scale-95 select-none shadow-sm';
    const closeBtnClass =
        'w-3.5 h-3.5 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-white/60 hover:text-white cursor-pointer';

    return (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 mt-2 mb-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 px-1 -mx-1">
                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-white/40 shrink-0">
                    <Filter className="w-3 h-3 text-red-500" />
                    <span className="hidden sm:inline">Activos:</span>
                </div>

                {queryParam && (
                    <span className={chipClass}>
                        <span className="truncate max-w-[120px] sm:max-w-none">&quot;{queryParam}&quot;</span>
                        <button onClick={onRemoveQuery} className={closeBtnClass} title="Eliminar búsqueda">
                            <X className="w-2.5 h-2.5" />
                        </button>
                    </span>
                )}

                {leagueName && (
                    <span className={chipClass}>
                        <span>{leagueName}</span>
                        <button onClick={onRemoveLeague} className={closeBtnClass} title="Eliminar filtro liga">
                            <X className="w-2.5 h-2.5" />
                        </button>
                    </span>
                )}

                {displayTeamName && (
                    <span className={chipClass}>
                        <span>{displayTeamName}</span>
                        <button onClick={onRemoveTeam} className={closeBtnClass} title="Eliminar filtro equipo">
                            <X className="w-2.5 h-2.5" />
                        </button>
                    </span>
                )}

                {displayBrandName && (
                    <span className={chipClass}>
                        <span>{displayBrandName}</span>
                        <button onClick={onRemoveBrand} className={closeBtnClass} title="Eliminar filtro marca">
                            <X className="w-2.5 h-2.5" />
                        </button>
                    </span>
                )}

                {filters.season && (
                    <span className={chipClass}>
                        <span>Temporada: {filters.season}</span>
                        <button onClick={onRemoveSeason} className={closeBtnClass} title="Eliminar filtro temporada">
                            <X className="w-2.5 h-2.5" />
                        </button>
                    </span>
                )}

                {filters.gender && (
                    <span className={chipClass}>
                        <span>
                            {filters.gender === 'man' ? 'Hombre' : filters.gender === 'woman' ? 'Mujer' : 'Niños'}
                        </span>
                        <button onClick={onRemoveGender} className={closeBtnClass} title="Eliminar filtro género">
                            <X className="w-2.5 h-2.5" />
                        </button>
                    </span>
                )}

                {filters.priceRange && (
                    <span className={chipClass}>
                        <span>{PRICE_LABEL_MAP[filters.priceRange] || filters.priceRange}</span>
                        <button onClick={onRemovePrice} className={closeBtnClass} title="Eliminar filtro precio">
                            <X className="w-2.5 h-2.5" />
                        </button>
                    </span>
                )}

                {filters.sortBy !== 'relevance' && (
                    <span className={chipClass}>
                        <span>{SORT_LABEL_MAP[filters.sortBy] || filters.sortBy}</span>
                        <button onClick={onRemoveSort} className={closeBtnClass} title="Eliminar orden">
                            <X className="w-2.5 h-2.5" />
                        </button>
                    </span>
                )}

                <button
                    onClick={onClearAll}
                    className="shrink-0 text-[11px] font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer ml-auto"
                >
                    <RotateCcw className="w-2.5 h-2.5" /> Limpiar
                </button>
            </div>
        </div>
    );
}
