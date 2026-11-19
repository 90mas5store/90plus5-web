'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, ArrowRight, Sparkles, MessageCircle, Info } from 'lucide-react';
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
import { SearchExecutionMeta } from '@/lib/search/searchEngine';
import { QuickSearchChipConfig } from '@/lib/search/searchSettingsTypes';
import { trackSearchAnalytics } from '@/hooks/useRecentSearches';
import { BUSINESS_LOGIC } from '@/lib/constants';

interface SearchResultsDropdownProps {
    value: string;
    results: SearchResult[];
    totalProductMatches?: number;
    matchedClub?: QuickClub | null;
    searchMeta?: SearchExecutionMeta;
    quickChips?: QuickSearchChipConfig[];
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
    totalProductMatches,
    matchedClub: engineMatchedClub,
    searchMeta,
    quickChips,
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
    const [filterState, setFilterState] = useState<{ query: string; filter: SearchFilterType }>({
        query: value,
        filter: 'all',
    });
    // Reinicia automáticamente la pestaña activa cuando cambia la consulta sin setState en efecto
    const activeFilter: SearchFilterType = filterState.query === value ? filterState.filter : 'all';
    const setActiveFilter = (filter: SearchFilterType) => setFilterState({ query: value, filter });

    // Registrar señal de demanda insatisfecha en analíticas cuando la búsqueda fue rescatada con coincidencia parcial
    useEffect(() => {
        const clean = value.trim();
        if (clean.length < 3 || !searchMeta || searchMeta.matchQuality !== 'partial') return;
        const timer = setTimeout(() => {
            trackSearchAnalytics(clean, totalProductMatches ?? results.length, {
                exactMatch: false,
                unmatchedTokens: searchMeta.unmatchedCatalogTokens,
            });
        }, 1200);
        return () => clearTimeout(timer);
    }, [value, searchMeta, totalProductMatches, results.length]);

    const hasQuery = value.trim().length >= 2;
    const hasResults = results.length > 0;

    // Priorizar el club detectado por el motor unificado; fallback al hook legacy solo si hay resultados
    const fallbackMatchedClub = useMatchedClub(value, results, topClubs, allClubs);
    const matchedClub = hasResults ? (engineMatchedClub ?? fallbackMatchedClub) : null;

    // Counts for filter pills
    const playerCount = useMemo(() => results.filter((r) => r.type === 'player').length, [results]);
    const displayedProductCount = useMemo(() => results.filter((r) => r.type === 'product').length, [results]);
    const realProductCount = totalProductMatches && totalProductMatches > displayedProductCount
        ? totalProductMatches
        : displayedProductCount;
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

    const isPartialMatch = hasQuery && hasResults && searchMeta?.matchQuality === 'partial';
    const hasCorrections = hasQuery && hasResults && (searchMeta?.correctedTerms?.length ?? 0) > 0;

    const cleanQuery = value.trim();
    const partialWhatsappUrl = `https://wa.me/${BUSINESS_LOGIC.CONTACT.WHATSAPP_NUMBER}?text=${encodeURIComponent(
        `¡Hola 90+5 Store! Busqué "${cleanQuery}" en la tienda online y no vi esa variante exacta. ¿Me confirman si la pueden traer bajo pedido?`
    )}`;

    return (
        <div
            ref={resultsRef}
            onMouseDown={(e) => e.stopPropagation()}
            className="h-full md:h-auto md:max-h-[min(65vh,540px)] overflow-y-auto overscroll-contain divide-y divide-white/5 scrollbar-thin select-none pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-0"
        >
            {/* ─── Descubrimiento Inicial (Sin Query) ─── */}
            {!hasQuery && (
                <QuickCrestBar
                    topClubs={topClubs}
                    quickChips={quickChips}
                    onSelectQuery={onSelectTerm}
                />
            )}

            {/* ─── Aviso Transparente de Coincidencia Parcial (Zero-Dead-End UX) ─── */}
            {isPartialMatch && (
                <div className="px-3.5 py-2.5 bg-amber-500/[0.06] border-b border-amber-500/15 space-y-2">
                    <div className="flex items-start gap-2 text-xs text-amber-200/90 leading-snug">
                        <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>
                            Sin coincidencia exacta para{' '}
                            <strong className="text-white">&quot;{cleanQuery}&quot;</strong>
                            {searchMeta?.unmatchedCatalogTokens && searchMeta.unmatchedCatalogTokens.length > 0 && (
                                <span className="text-amber-200/75">
                                    {' '}
                                    (sin resultados combinados con &quot;{searchMeta.unmatchedCatalogTokens.join(' ')}&quot;)
                                </span>
                            )}
                            . Mostrando modelos relacionados:
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pl-5">
                        {searchMeta?.suggestedAlternative && (
                            <button
                                type="button"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onSelectTerm(
                                        searchMeta.suggestedAlternative!.query,
                                        searchMeta.suggestedAlternative!.href
                                    );
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-[11px] font-bold text-white transition-all cursor-pointer active:scale-95"
                            >
                                <span>{searchMeta.suggestedAlternative.label}</span>
                                <ArrowRight className="w-3 h-3 text-primary" />
                            </button>
                        )}
                        <a
                            href={partialWhatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onMouseDown={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-[11px] font-bold text-emerald-300 transition-all"
                        >
                            <MessageCircle className="w-3 h-3" />
                            <span>Pedir bajo encargo</span>
                        </a>
                    </div>
                </div>
            )}

            {/* ─── Píldora Sutil de Corrección Ortográfica / Unión de Palabras ─── */}
            {!isPartialMatch && hasCorrections && searchMeta?.correctedTerms && (
                <div className="px-3.5 py-2 bg-white/[0.02] flex items-center gap-1.5 text-[11px] text-gray-400">
                    <Sparkles className="w-3 h-3 text-primary shrink-0" />
                    <span>
                        Mostrando resultados para{' '}
                        <strong className="text-white">
                            {searchMeta.correctedTerms.map((c) => c.to).join(', ')}
                        </strong>
                    </span>
                </div>
            )}

            {/* ─── Tabs de Filtro Rápido (Cuando hay Query y Resultados) ─── */}
            {hasQuery && hasResults && (
                <SearchFilterTabs
                    activeFilter={activeFilter}
                    totalCount={playerCount + realProductCount + leagueCount + categoryCount}
                    playerCount={playerCount}
                    productCount={realProductCount}
                    leagueCount={leagueCount}
                    categoryCount={categoryCount}
                    onSelectFilter={setActiveFilter}
                />
            )}

            {/* ─── Club Hero Card (Solo cuando hay resultados válidos) ─── */}
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
                                Camisetas y Productos ({realProductCount})
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
                            <span className="flex items-center gap-2 truncate">
                                <Search className="w-3.5 h-3.5 text-primary shrink-0" />
                                <span className="truncate">
                                    {realProductCount > 0
                                        ? `Ver ${realProductCount} ${realProductCount === 1 ? 'resultado' : 'resultados'} para "${cleanQuery}"`
                                        : `Ver todos los resultados para "${cleanQuery}"`}
                                </span>
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
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
