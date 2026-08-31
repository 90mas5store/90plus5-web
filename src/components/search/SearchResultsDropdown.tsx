'use client';

import React from 'react';
import Image from 'next/image';
import {
    Search,
    ArrowRight,
    Clock,
    TrendingUp,
    Sparkles,
    Shirt,
} from 'lucide-react';
import ProductImage from '@/components/ProductImage';
import SearchHighlight from '@/components/search/SearchHighlight';
import QuickCrestBar from '@/components/search/QuickCrestBar';
import { SearchResult, QuickClub } from '@/types/search';

interface SearchResultsDropdownProps {
    value: string;
    results: SearchResult[];
    activeIndex: number;
    recentSearches: string[];
    trendingSuggestions: string[];
    topClubs: QuickClub[];
    resultsRef: React.RefObject<HTMLDivElement | null>;
    onNavigateResult: (item: SearchResult) => void;
    onSubmitSearch: (e: React.FormEvent) => void;
    onSelectTerm: (term: string, href?: string) => void;
    onClearRecent: () => void;
}

export default function SearchResultsDropdown({
    value,
    results,
    activeIndex,
    recentSearches,
    trendingSuggestions,
    topClubs,
    resultsRef,
    onNavigateResult,
    onSubmitSearch,
    onSelectTerm,
    onClearRecent,
}: SearchResultsDropdownProps) {
    const hasQuery = value.trim().length >= 2;
    const hasResults = results.length > 0;
    const hasRecent = recentSearches.length > 0;
    const hasTrending = trendingSuggestions.length > 0;

    return (
        <div
            ref={resultsRef}
            className="max-h-[min(65vh,520px)] overflow-y-auto overscroll-contain divide-y divide-white/5 scrollbar-thin"
        >
            {/* 🛡️ Barra de Escudos y Filtros Rápidos (cuando no hay texto o para descubrir) */}
            {!hasQuery && (
                <QuickCrestBar topClubs={topClubs} onSelectQuery={onSelectTerm} />
            )}

            {/* ─── Resultados con Query ─── */}
            {hasQuery && hasResults && (
                <>
                    {/* Categorías y Ligas */}
                    {results.some((r) => r.type === 'category' || r.type === 'league') && (
                        <div className="px-3 pt-3 pb-1">
                            <span className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                                Categorías y Ligas
                            </span>
                            <div className="mt-2 space-y-0.5">
                                {results
                                    .filter((r) => r.type === 'category' || r.type === 'league')
                                    .map((item) => {
                                        const globalIdx = results.indexOf(item);
                                        const isActive = activeIndex === globalIdx;
                                        return (
                                            <button
                                                key={item.id}
                                                data-search-item
                                                onClick={() => onNavigateResult(item)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left group cursor-pointer ${
                                                    isActive
                                                        ? 'bg-primary/10 ring-1 ring-primary/20'
                                                        : 'hover:bg-white/5'
                                                }`}
                                            >
                                                <div
                                                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                                        item.type === 'category'
                                                            ? 'bg-primary/10'
                                                            : 'bg-blue-500/10'
                                                    }`}
                                                >
                                                    {item.image ? (
                                                        <Image
                                                            src={item.image}
                                                            alt=""
                                                            width={20}
                                                            height={20}
                                                            className="object-contain brightness-0 invert opacity-80"
                                                        />
                                                    ) : (
                                                        <Sparkles className="w-4 h-4 text-primary" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-white truncate">
                                                        <SearchHighlight text={item.title} query={value} />
                                                    </p>
                                                    <p className="text-[11px] text-gray-500 uppercase tracking-wider">
                                                        {item.subtitle}
                                                    </p>
                                                </div>
                                                <ArrowRight
                                                    className={`w-4 h-4 shrink-0 transition-all duration-200 ${
                                                        isActive
                                                            ? 'text-primary translate-x-0'
                                                            : 'text-gray-600 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'
                                                    }`}
                                                />
                                            </button>
                                        );
                                    })}
                            </div>
                        </div>
                    )}

                    {/* Productos con Matchday Live Badges */}
                    {results.some((r) => r.type === 'product') && (
                        <div className="px-3 pt-3 pb-1">
                            <span className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                                Camisetas y Productos
                            </span>
                            <div className="mt-2 space-y-1">
                                {results
                                    .filter((r) => r.type === 'product')
                                    .map((item) => {
                                        const globalIdx = results.indexOf(item);
                                        const isActive = activeIndex === globalIdx;
                                        return (
                                            <button
                                                key={item.id}
                                                data-search-item
                                                onClick={() => onNavigateResult(item)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left group cursor-pointer ${
                                                    isActive
                                                        ? 'bg-primary/10 ring-1 ring-primary/20'
                                                        : 'hover:bg-white/5'
                                                }`}
                                            >
                                                <div className="w-10 h-[52px] rounded-lg overflow-hidden shrink-0 border border-white/5 bg-neutral-800">
                                                    <ProductImage
                                                        src={item.image || ''}
                                                        alt={item.title}
                                                        width={40}
                                                        height={52}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-sm font-semibold text-white truncate">
                                                            <SearchHighlight text={item.title} query={value} />
                                                        </p>

                                                        {/* ⚡ Matchday Live Badge */}
                                                        {item.isLive && (
                                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-primary text-white animate-pulse shadow-[0_0_8px_rgba(229,9,20,0.6)]">
                                                                ⚡ EN VIVO {item.liveScore} {item.liveMinute}
                                                            </span>
                                                        )}
                                                        {item.isUpcoming && (
                                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-600/30 text-blue-300 border border-blue-500/30">
                                                                📅 JUEGA HOY
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-gray-500 truncate uppercase tracking-wider mt-0.5">
                                                        <SearchHighlight
                                                            text={item.subtitle || ''}
                                                            query={value}
                                                        />
                                                    </p>
                                                </div>
                                                {item.price != null && (
                                                    <span className="text-sm font-black text-primary shrink-0">
                                                        L {item.price.toLocaleString('es-HN')}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                            </div>
                        </div>
                    )}

                    {/* "Ver todos los resultados" */}
                    <div className="p-2 mt-1 border-t border-white/5">
                        <button
                            data-search-item
                            onClick={onSubmitSearch}
                            className={`w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold rounded-xl transition-colors uppercase tracking-[0.15em] cursor-pointer ${
                                activeIndex === results.length
                                    ? 'bg-primary/10 text-white ring-1 ring-primary/20'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Search className="w-3.5 h-3.5" />
                            Ver todos los resultados para &quot;{value}&quot;
                        </button>
                    </div>
                </>
            )}

            {/* ─── Sin Resultados ─── */}
            {hasQuery && !hasResults && (
                <div className="px-4 py-8 text-center">
                    <Shirt className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">
                        No encontramos resultados para{' '}
                        <span className="text-white font-semibold">&quot;{value}&quot;</span>
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                        Prueba con el apodo del equipo, jugador (ej. <em>Vini</em>, <em>Bellingham</em>) o liga
                    </p>
                </div>
            )}

            {/* ─── Estado Inicial (Recientes + Populares) ─── */}
            {!hasQuery && (
                <div className="py-2">
                    {/* Búsquedas recientes */}
                    {hasRecent && (
                        <div className="px-3 pt-2 pb-1">
                            <div className="flex items-center justify-between px-2 mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" />
                                    Recientes
                                </span>
                                <button
                                    onClick={onClearRecent}
                                    className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors uppercase tracking-wider cursor-pointer"
                                >
                                    Borrar
                                </button>
                            </div>
                            <div className="space-y-0.5">
                                {recentSearches.map((term) => (
                                    <button
                                        key={term}
                                        onClick={() => onSelectTerm(term)}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 text-left group transition-colors cursor-pointer"
                                    >
                                        <Clock className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors truncate">
                                            {term}
                                        </span>
                                        <ArrowRight className="w-3.5 h-3.5 text-gray-700 ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Populares Dinámicos */}
                    {hasTrending && (
                        <div className="px-3 pt-3 pb-2">
                            <span className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 flex items-center gap-1.5">
                                <TrendingUp className="w-3 h-3" />
                                Populares
                            </span>
                            <div className="mt-2 flex flex-wrap gap-1.5 px-1">
                                {trendingSuggestions.map((term) => (
                                    <button
                                        key={term}
                                        onClick={() => onSelectTerm(term)}
                                        className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs text-gray-400 hover:text-white hover:bg-white/10 hover:border-primary/20 transition-all cursor-pointer"
                                    >
                                        {term}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
