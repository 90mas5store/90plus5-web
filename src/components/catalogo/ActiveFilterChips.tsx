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

    // Solo mostrar barra de filtros activos si hay filtros secundarios reales aplicados (búsqueda, género, precio, temporada).
    // La liga y el club ya son visiblemente activos en el Hero y en el riel de navegación superior.
    const hasActiveFilters = Boolean(
        queryParam ||
        filters.season ||
        filters.gender ||
        filters.priceRange
    );

    if (!hasActiveFilters) return null;

    const chipClass =
        'shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white/90 text-xs font-semibold backdrop-blur-md transition-all active:scale-95 select-none shadow-sm';
    const closeBtnClass =
        'w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white/70 hover:text-white cursor-pointer ml-0.5';

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-3 mb-2">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-white/40 shrink-0 mr-1">
                    <Filter className="w-3 h-3 text-primary" />
                    <span>Filtros activos:</span>
                </div>

                {queryParam && (
                    <span className={chipClass}>
                        <span className="truncate max-w-[130px] sm:max-w-none">&quot;{queryParam}&quot;</span>
                        <button onClick={onRemoveQuery} className={closeBtnClass} title="Eliminar búsqueda">
                            <X className="w-2.5 h-2.5" />
                        </button>
                    </span>
                )}

                {categoryName && onRemoveCategory && (
                    <span className={chipClass}>
                        <span>{categoryName}</span>
                        <button onClick={onRemoveCategory} className={closeBtnClass} title="Eliminar categoría">
                            <X className="w-2.5 h-2.5" />
                        </button>
                    </span>
                )}

                {leagueName && (
                    <span className={chipClass}>
                        <span>{leagueName}</span>
                        <button onClick={onRemoveLeague} className={closeBtnClass} title="Eliminar liga">
                            <X className="w-2.5 h-2.5" />
                        </button>
                    </span>
                )}

                {displayTeamName && (
                    <span className={chipClass}>
                        <span>{displayTeamName}</span>
                        <button onClick={onRemoveTeam} className={closeBtnClass} title="Eliminar equipo">
                            <X className="w-2.5 h-2.5" />
                        </button>
                    </span>
                )}

                {displayBrandName && (
                    <span className={chipClass}>
                        <span>{displayBrandName}</span>
                        <button onClick={onRemoveBrand} className={closeBtnClass} title="Eliminar marca">
                            <X className="w-2.5 h-2.5" />
                        </button>
                    </span>
                )}

                {filters.season && (
                    <span className={chipClass}>
                        <span>{filters.season}</span>
                        <button onClick={onRemoveSeason} className={closeBtnClass} title="Eliminar temporada">
                            <X className="w-2.5 h-2.5" />
                        </button>
                    </span>
                )}

                {filters.gender && (
                    <span className={chipClass}>
                        <span>
                            {filters.gender === 'man' ? 'Hombre' : filters.gender === 'woman' ? 'Mujer' : 'Niños'}
                        </span>
                        <button onClick={onRemoveGender} className={closeBtnClass} title="Eliminar género">
                            <X className="w-2.5 h-2.5" />
                        </button>
                    </span>
                )}

                {filters.priceRange && (
                    <span className={chipClass}>
                        <span>{PRICE_LABEL_MAP[filters.priceRange] || filters.priceRange}</span>
                        <button onClick={onRemovePrice} className={closeBtnClass} title="Eliminar precio">
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
                    className="shrink-0 text-xs font-bold text-primary-light hover:text-white flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-all cursor-pointer ml-auto active:scale-95"
                >
                    <RotateCcw className="w-3 h-3" />
                    <span>Limpiar todo</span>
                </button>
            </div>
        </div>
    );
}
