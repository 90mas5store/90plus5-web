'use client';

import { Filter, X, RotateCcw } from 'lucide-react';
import { CatalogFilters } from './CatalogFilterPanel';
import { PRICE_LABEL_MAP, SORT_LABEL_MAP } from '@/constants/catalogo';

interface ActiveFilterChipsProps {
    queryParam: string | null;
    categoryName: string | null | undefined;
    leagueName: string | null | undefined;
    teamName: string | null | undefined;
    brandName: string | null | undefined;
    filters: CatalogFilters;
    onRemoveQuery: () => void;
    onRemoveCategory: () => void;
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
        categoryName ||
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
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/40 text-white text-xs font-medium shadow-[0_0_10px_rgba(229,9,20,0.15)] animate-in fade-in zoom-in-95 duration-200';
    const closeBtnClass =
        'w-4 h-4 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-white/70 hover:text-white cursor-pointer';

    return (
        <div className="max-w-7xl mx-auto px-4 mt-6 mb-2">
            <div className="flex flex-wrap items-center gap-2 p-3.5 rounded-2xl bg-neutral-900/80 border border-white/10 backdrop-blur-xl">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 mr-2 shrink-0">
                    <Filter className="w-3.5 h-3.5 text-primary" />
                    <span>Filtros activos:</span>
                </div>

                {queryParam && (
                    <span className={chipClass}>
                        <span>Búsqueda: &quot;{queryParam}&quot;</span>
                        <button onClick={onRemoveQuery} className={closeBtnClass} title="Eliminar búsqueda">
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                )}

                {categoryName && (
                    <span className={chipClass}>
                        <span>Categoría: {categoryName}</span>
                        <button onClick={onRemoveCategory} className={closeBtnClass} title="Eliminar filtro categoría">
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                )}

                {leagueName && (
                    <span className={chipClass}>
                        <span>Liga: {leagueName}</span>
                        <button onClick={onRemoveLeague} className={closeBtnClass} title="Eliminar filtro liga">
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                )}

                {displayTeamName && (
                    <span className={chipClass}>
                        <span>Equipo: {displayTeamName}</span>
                        <button onClick={onRemoveTeam} className={closeBtnClass} title="Eliminar filtro equipo">
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                )}

                {displayBrandName && (
                    <span className={chipClass}>
                        <span>Marca: {displayBrandName}</span>
                        <button onClick={onRemoveBrand} className={closeBtnClass} title="Eliminar filtro marca">
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                )}

                {filters.season && (
                    <span className={chipClass}>
                        <span>Temporada: {filters.season}</span>
                        <button onClick={onRemoveSeason} className={closeBtnClass} title="Eliminar filtro temporada">
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                )}

                {filters.gender && (
                    <span className={chipClass}>
                        <span>
                            Género: {filters.gender === 'man' ? 'Hombre' : filters.gender === 'woman' ? 'Mujer' : 'Niños'}
                        </span>
                        <button onClick={onRemoveGender} className={closeBtnClass} title="Eliminar filtro género">
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                )}

                {filters.priceRange && (
                    <span className={chipClass}>
                        <span>Precio: {PRICE_LABEL_MAP[filters.priceRange] || filters.priceRange}</span>
                        <button onClick={onRemovePrice} className={closeBtnClass} title="Eliminar filtro precio">
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                )}

                {filters.sortBy !== 'relevance' && (
                    <span className={chipClass}>
                        <span>Orden: {SORT_LABEL_MAP[filters.sortBy] || filters.sortBy}</span>
                        <button onClick={onRemoveSort} className={closeBtnClass} title="Eliminar orden">
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                )}

                <button
                    onClick={onClearAll}
                    className="ml-auto text-xs font-bold text-primary hover:underline flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-primary/10 transition-colors cursor-pointer"
                >
                    <RotateCcw className="w-3 h-3" /> Limpiar todos
                </button>
            </div>
        </div>
    );
}
