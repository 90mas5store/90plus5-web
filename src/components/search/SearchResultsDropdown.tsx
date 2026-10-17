'use client';

import React, { useState, useMemo } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import QuickCrestBar from '@/components/search/QuickCrestBar';
import { useMatchedClub } from '@/components/search/useMatchedClub';
import SearchFilterTabs, { SearchFilterType } from '@/components/search/SearchFilterTabs';
import SearchClubHero from '@/components/search/SearchClubHero';
import PlayerResultItem from '@/components/search/items/PlayerResultItem';
import CategoryResultItem from '@/components/search/items/CategoryResultItem';
import ProductResultItem from '@/components/search/items/ProductResultItem';
import SearchNoResults from '@/components/search/SearchNoResults';
import SearchInitialState from '@/components/search/SearchInitialState';
import { SearchResult, QuickClub } from '@/types/search';

interface SearchResultsDropdownProps {
    value: string;
    results: SearchResult[];
    activeIndex: number;
    recentSearches: string[];
    trendingSuggestions: string[];
    topClubs: QuickClub[];
    allClubs?: QuickClub[];
    resultsRef: React.RefObject<HTMLDivElement | null>;
    onNavigateResult: (item: SearchResult) => void;
    onSubmitSearch: (e: React.FormEvent) => void;
    onSelectTerm: (term: string, href?: string) => void;
    onClearRecent: () => void;
    onRemoveRecent?: (term: string) => void;
    isLoading?: boolean;
}

export default function SearchResultsDropdown({
    value,
    results,
    activeIndex,
    recentSearches,
    trendingSuggestions,
    topClubs,
    allClubs = [],
    resultsRef,
    onNavigateResult,
    onSubmitSearch,
    onSelectTerm,
    onClearRecent,
    onRemoveRecent,
    isLoading = false,
}: SearchResultsDropdownProps) {
    const [activeFilter, setActiveFilter] = useState<SearchFilterType>('all');

    const hasQuery = value.trim().length >= 2;
    const hasResults = results.length > 0;

    // Detect matched club for Hero Card
    const matchedClub = useMatchedClub(value, results, topClubs, allClubs);

    // Counts for filter pills
    const playerCount = useMemo(() => results.filter((r) => r.type === 'player').length, [results]);
    const productCount = useMemo(() => results.filter((r) => r.type === 'product').length, [results]);
    const categoryCount = useMemo(() => results.filter((r) => r.type === 'category').length, [results]);
    const leagueCount = useMemo(() => results.filter((r) => r.type === 'league').length, [results]);

    // Filtered results based on selected tab
    const filteredResults = useMemo(() => {
        if (activeFilter === 'players') return results.filter((r) => r.type === 'player');
        if (activeFilter === 'products') return results.filter((r) => r.type === 'product');
        if (activeFilter === 'categories') return results.filter((r) => r.type === 'category');
        if (activeFilter === 'leagues') return results.filter((r) => r.type === 'league');
        return results;
    }, [results, activeFilter]);

    const playerResults = useMemo(() => filteredResults.filter((r) => r.type === 'player'), [filteredResults]);
    const taxonomyResults = useMemo(
        () => filteredResults.filter((r) => r.type === 'category' || r.type === 'league'),
        [filteredResults]
    );
    const productResults = useMemo(() => filteredResults.filter((r) => r.type === 'product'), [filteredResults]);

    return (
        <div
            ref={resultsRef}
            onMouseDown={(e) => e.stopPropagation()}
            className="h-full md:h-auto md:max-h-[min(65vh,540px)] overflow-y-auto overscroll-contain divide-y divide-white/5 scrollbar-thin select-none pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-0"
        >
            {/* ─── Descubrimiento Inicial (Sin Query) ─── */}
            {!hasQuery && (
                <QuickCrestBar topClubs={topClubs} onSelectQuery={onSelectTerm} />
            )}

            {/* ─── Tabs de Filtro Rápido (Cuando hay Query y Resultados) ─── */}
            {hasQuery && hasResults && (
                <SearchFilterTabs
                    activeFilter={activeFilter}
                    totalCount={results.length}
                    playerCount={playerCount}
                    productCount={productCount}
                    leagueCount={leagueCount}
                    categoryCount={categoryCount}
                    onSelectFilter={setActiveFilter}
                />
            )}

            {/* ─── Club Hero Card (Si coincide con un club popular) ─── */}
            {hasQuery && matchedClub && (
                <SearchClubHero matchedClub={matchedClub} onSelectClub={onSelectTerm} />
            )}

            {/* ─── Resultados Filtrados ─── */}
            {hasQuery && hasResults && (
                <>
                    {/* Jugadores */}
                    {playerResults.length > 0 && (
                        <div className="px-3 pt-3 pb-1">
                            <span className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                                Jugadores
                            </span>
                            <div className="mt-2 space-y-1">
                                {playerResults.map((item) => {
                                    const globalIdx = results.indexOf(item);
                                    return (
                                        <PlayerResultItem
                                            key={item.id}
                                            item={item}
                                            isActive={activeIndex === globalIdx}
                                            query={value}
                                            onSelect={() => onNavigateResult(item)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Categorías y Ligas */}
                    {taxonomyResults.length > 0 && (
                        <div className="px-3 pt-3 pb-1">
                            <span className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                                Categorías y Ligas
                            </span>
                            <div className="mt-2 space-y-1">
                                {taxonomyResults.map((item) => {
                                    const globalIdx = results.indexOf(item);
                                    return (
                                        <CategoryResultItem
                                            key={item.id}
                                            item={item}
                                            isActive={activeIndex === globalIdx}
                                            query={value}
                                            onSelect={() => onNavigateResult(item)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Camisetas y Productos */}
                    {productResults.length > 0 && (
                        <div className="px-3 pt-3 pb-1">
                            <span className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                                Camisetas y Productos ({productResults.length})
                            </span>
                            <div className="mt-2 space-y-1">
                                {productResults.map((item) => {
                                    const globalIdx = results.indexOf(item);
                                    return (
                                        <ProductResultItem
                                            key={item.id}
                                            item={item}
                                            isActive={activeIndex === globalIdx}
                                            query={value}
                                            onSelect={() => onNavigateResult(item)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Botón Acción Rápida: Ver todos los resultados */}
                    <div className="p-3 mt-1 border-t border-white/[0.06] bg-white/[0.01]">
                        <button
                            type="button"
                            data-search-item
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={onSubmitSearch}
                            className={`w-full py-2.5 px-4 flex items-center justify-between text-xs font-semibold rounded-xl transition-all uppercase tracking-[0.1em] cursor-pointer active:scale-[0.985] ${
                                activeIndex === results.length
                                    ? 'bg-primary text-white shadow-[0_0_16px_rgba(229,9,20,0.4)]'
                                    : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/80 hover:text-white border border-white/10 hover:border-white/20'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <Search className="w-3.5 h-3.5 text-primary" />
                                Ver todos los resultados para &quot;{value}&quot;
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-primary" />
                        </button>
                    </div>
                </>
            )}

            {/* ─── Skeleton Loading (Cuando está cargando datos de búsqueda) ─── */}
            {hasQuery && !hasResults && isLoading && (
                <div className="p-4 space-y-3" onMouseDown={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                        <span>Buscando camisetas y jugadores...</span>
                    </div>
                    <div className="space-y-2 pt-1">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] animate-pulse">
                                <div className="w-10 h-10 rounded-xl bg-white/10 shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="h-3.5 bg-white/10 rounded w-1/2" />
                                    <div className="h-2.5 bg-white/5 rounded w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Sin Resultados (Inteligente y Amigable) ─── */}
            {hasQuery && !hasResults && !isLoading && (
                <SearchNoResults
                    value={value}
                    topClubs={topClubs}
                    onSelectTerm={onSelectTerm}
                />
            )}

            {/* ─── Estado Inicial (Recientes + Populares) ─── */}
            {!hasQuery && (
                <SearchInitialState
                    recentSearches={recentSearches}
                    trendingSuggestions={trendingSuggestions}
                    onSelectTerm={onSelectTerm}
                    onClearRecent={onClearRecent}
                    onRemoveRecent={onRemoveRecent}
                />
            )}
        </div>
    );
}
