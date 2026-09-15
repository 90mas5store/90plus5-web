'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
    Search,
    ArrowRight,
    Clock,
    TrendingUp,
    Sparkles,
    Shirt,
    X,
    Trophy,
    Shield,
} from 'lucide-react';
import ProductImage from '@/components/ProductImage';
import TeamLogo from '@/components/TeamLogo';
import SearchHighlight from '@/components/search/SearchHighlight';
import QuickCrestBar from '@/components/search/QuickCrestBar';
import { FOOTBALL_ALIASES } from '@/constants/footballAliases';
import { SearchResult, QuickClub } from '@/types/search';

const normalize = (s: string) =>
    (s || '')
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');

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
}: SearchResultsDropdownProps) {
    const [activeFilter, setActiveFilter] = useState<'all' | 'products' | 'categories' | 'leagues'>('all');

    const hasQuery = value.trim().length >= 2;
    const hasResults = results.length > 0;
    const hasRecent = recentSearches.length > 0;
    const hasTrending = trendingSuggestions.length > 0;

    const clubPool = useMemo(() => (allClubs && allClubs.length > 0 ? allClubs : topClubs), [allClubs, topClubs]);

    // Detect if search term or alias matches ANY club in the catalog for the Club Hero Card
    const matchedClub = useMemo(() => {
        if (!hasQuery) return null;
        const q = normalize(value.trim());

        // 1. Direct match with club name (e.g. "liverpool", "arsenal", "motagua", "chelsea", "milan")
        const direct = clubPool.find((c) => {
            const cNorm = normalize(c.name);
            return cNorm.includes(q) || q.includes(cNorm);
        });
        if (direct) return direct;

        // 2. Alias match (e.g. "merengues", "vini", "bellingham", "albos", "culés", "cr7", "messi")
        const matchingAlias = FOOTBALL_ALIASES.find((a) => {
            const aNorm = normalize(a.alias);
            return aNorm === q || aNorm.includes(q) || q.includes(aNorm);
        });

        if (matchingAlias) {
            const targetNorm = normalize(matchingAlias.targetTeam);
            const aliasClub = clubPool.find((c) => {
                const cNorm = normalize(c.name);
                return cNorm.includes(targetNorm) || targetNorm.includes(cNorm);
            });
            if (aliasClub) return aliasClub;
            return {
                name: matchingAlias.targetTeam,
                query: matchingAlias.targetTeam,
            };
        }

        // 3. Match from products in results
        const firstProductWithClub = results.find((r) => r.type === 'product' && r.title);
        if (firstProductWithClub) {
            const prodNorm = normalize(firstProductWithClub.title);
            const prodClub = clubPool.find((c) => {
                const cNorm = normalize(c.name);
                return cNorm.includes(prodNorm) || prodNorm.includes(cNorm);
            });
            if (prodClub) return prodClub;
        }

        return null;
    }, [hasQuery, value, clubPool, results]);

    // Counts for filter pills
    const productCount = useMemo(() => results.filter((r) => r.type === 'product').length, [results]);
    const categoryCount = useMemo(() => results.filter((r) => r.type === 'category').length, [results]);
    const leagueCount = useMemo(() => results.filter((r) => r.type === 'league').length, [results]);

    // Filtered results based on selected tab
    const filteredResults = useMemo(() => {
        if (activeFilter === 'products') return results.filter((r) => r.type === 'product');
        if (activeFilter === 'categories') return results.filter((r) => r.type === 'category');
        if (activeFilter === 'leagues') return results.filter((r) => r.type === 'league');
        return results;
    }, [results, activeFilter]);

    return (
        <div
            ref={resultsRef}
            onMouseDown={(e) => e.stopPropagation()}
            className="h-[calc(100dvh-4rem-env(safe-area-inset-top,0px))] md:h-auto md:max-h-[min(65vh,540px)] overflow-y-auto overscroll-contain divide-y divide-white/5 scrollbar-thin select-none pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-0"
        >
            {/* ─── Descubrimiento Inicial (Sin Query) ─── */}
            {!hasQuery && (
                <QuickCrestBar topClubs={topClubs} onSelectQuery={onSelectTerm} />
            )}

            {/* ─── Tabs de Filtro Rápido (Cuando hay Query y Resultados) ─── */}
            {hasQuery && hasResults && (
                <div
                    className="px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-white/[0.02]"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <button
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveFilter('all');
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                            activeFilter === 'all'
                                ? 'bg-primary text-white shadow-[0_0_12px_rgba(229,9,20,0.5)] scale-[1.02]'
                                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        Todos ({results.length})
                    </button>
                    {productCount > 0 && (
                        <button
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setActiveFilter('products');
                            }}
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
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setActiveFilter('leagues');
                            }}
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
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setActiveFilter('categories');
                            }}
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
            )}

            {/* ─── Club Hero Card (Si coincide con un club popular) ─── */}
            {hasQuery && matchedClub && (
                <div
                    className="p-3 bg-gradient-to-r from-red-950/30 via-neutral-900/60 to-transparent border-b border-white/5"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onSelectTerm(matchedClub.name, `/catalogo?query=${encodeURIComponent(matchedClub.name)}`);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-primary/40 cursor-pointer transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0 p-1.5 group-hover:scale-105 transition-transform">
                                {matchedClub.logoUrl ? (
                                    <TeamLogo src={matchedClub.logoUrl} alt={matchedClub.name} size={30} />
                                ) : (
                                    <Shield className="w-5 h-5 text-primary" />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-black uppercase text-white tracking-wide">
                                        {matchedClub.name}
                                    </span>
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-primary/20 text-primary border border-primary/30 uppercase">
                                        Club Oficial
                                    </span>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                    {matchedClub.count
                                        ? `Explorar ${matchedClub.count} ${matchedClub.count === 1 ? 'modelo' : 'modelos'} disponibles de ${matchedClub.name}`
                                        : `Explorar todas las camisetas y ediciones de ${matchedClub.name}`}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                            <span>Ver todo</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Resultados Filtrados ─── */}
            {hasQuery && hasResults && (
                <>
                    {/* Categorías y Ligas */}
                    {filteredResults.some((r) => r.type === 'category' || r.type === 'league') && (
                        <div className="px-3 pt-3 pb-1">
                            <span className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                                Categorías y Ligas
                            </span>
                            <div className="mt-2 space-y-1">
                                {filteredResults
                                    .filter((r) => r.type === 'category' || r.type === 'league')
                                    .map((item) => {
                                        const globalIdx = results.indexOf(item);
                                        const isActive = activeIndex === globalIdx;
                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                data-search-item
                                                onMouseDown={(e) => e.stopPropagation()}
                                                onClick={() => onNavigateResult(item)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group cursor-pointer ${
                                                    isActive
                                                        ? 'bg-primary/15 ring-1 ring-primary/30'
                                                        : 'hover:bg-white/5'
                                                }`}
                                            >
                                                <div
                                                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                                        item.type === 'category'
                                                            ? 'bg-primary/10 border border-primary/20'
                                                            : 'bg-blue-500/10 border border-blue-500/20'
                                                    }`}
                                                >
                                                    {item.image ? (
                                                        <Image
                                                            src={item.image}
                                                            alt=""
                                                            width={20}
                                                            height={20}
                                                            className="object-contain brightness-0 invert opacity-85"
                                                        />
                                                    ) : item.type === 'league' ? (
                                                        <Trophy className="w-4 h-4 text-amber-400" />
                                                    ) : (
                                                        <Sparkles className="w-4 h-4 text-primary" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-white truncate">
                                                        <SearchHighlight text={item.title} query={value} />
                                                    </p>
                                                    <p className="text-[11px] text-gray-400 uppercase tracking-wider">
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

                    {/* Camisetas y Productos */}
                    {filteredResults.some((r) => r.type === 'product') && (
                        <div className="px-3 pt-3 pb-1">
                            <span className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                                Camisetas y Productos ({filteredResults.filter((r) => r.type === 'product').length})
                            </span>
                            <div className="mt-2 space-y-1">
                                {filteredResults
                                    .filter((r) => r.type === 'product')
                                    .map((item) => {
                                        const globalIdx = results.indexOf(item);
                                        const isActive = activeIndex === globalIdx;
                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                data-search-item
                                                onMouseDown={(e) => e.stopPropagation()}
                                                onClick={() => onNavigateResult(item)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group cursor-pointer ${
                                                    isActive
                                                        ? 'bg-primary/15 ring-1 ring-primary/30 shadow-[0_4px_16px_rgba(229,9,20,0.1)]'
                                                        : 'hover:bg-white/5'
                                                }`}
                                            >
                                                <div className="w-11 h-14 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-neutral-900 flex items-center justify-center p-0.5">
                                                    <ProductImage
                                                        src={item.image || ''}
                                                        alt={item.title}
                                                        width={44}
                                                        height={56}
                                                        className="w-full h-full object-cover rounded-md group-hover:scale-105 transition-transform duration-300"
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
                                                    <p className="text-[11px] text-gray-400 truncate uppercase tracking-wider mt-0.5">
                                                        <SearchHighlight
                                                            text={item.subtitle || ''}
                                                            query={value}
                                                        />
                                                    </p>
                                                </div>
                                                {item.price != null && (
                                                    <div className="shrink-0 text-right">
                                                        <span className="text-sm font-black text-white group-hover:text-primary transition-colors">
                                                            L {item.price.toLocaleString('es-HN')}
                                                        </span>
                                                        <span className="block text-[10px] text-emerald-400 font-semibold">
                                                            Disponible
                                                        </span>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                            </div>
                        </div>
                    )}

                    {/* Botón Acción Rápida: Ver todos los resultados */}
                    <div className="p-2.5 mt-1 border-t border-white/5 bg-white/[0.01]">
                        <button
                            type="button"
                            data-search-item
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={onSubmitSearch}
                            className={`w-full py-2.5 px-4 flex items-center justify-between text-xs font-bold rounded-xl transition-all uppercase tracking-[0.12em] cursor-pointer ${
                                activeIndex === results.length
                                    ? 'bg-primary text-white shadow-[0_0_16px_rgba(229,9,20,0.4)]'
                                    : 'bg-white/5 hover:bg-primary/20 text-gray-300 hover:text-white border border-white/10 hover:border-primary/40'
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

            {/* ─── Sin Resultados (Inteligente y Amigable) ─── */}
            {hasQuery && !hasResults && (
                <div className="px-5 py-8 text-center space-y-4" onMouseDown={(e) => e.stopPropagation()}>
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-500">
                        <Shirt className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-300 font-medium">
                            No encontramos resultados exactos para{' '}
                            <span className="text-white font-bold">&quot;{value}&quot;</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                            Probá buscando por apodo (ej. <em>Merengues</em>, <em>Albos</em>, <em>Culés</em>), jugador (<em>Vini</em>, <em>Messi</em>) o liga.
                        </p>
                    </div>

                    {/* Sugerencias de rescate */}
                    {topClubs.length > 0 && (
                        <div className="pt-2 border-t border-white/5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-2">
                                Quizás te interese ver:
                            </span>
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                                {topClubs.slice(0, 5).map((club) => (
                                    <button
                                        key={club.name}
                                        type="button"
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            onSelectTerm(club.query);
                                        }}
                                        className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white transition-all cursor-pointer"
                                    >
                                        {club.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ─── Estado Inicial (Recientes + Populares) ─── */}
            {!hasQuery && (
                <div className="py-2" onMouseDown={(e) => e.stopPropagation()}>
                    {/* Búsquedas recientes */}
                    {hasRecent && (
                        <div className="px-3 pt-2 pb-1">
                            <div className="flex items-center justify-between px-2 mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-primary" />
                                    Búsquedas Recientes
                                </span>
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onClearRecent();
                                    }}
                                    className="text-[10px] text-gray-500 hover:text-red-400 transition-colors uppercase tracking-wider cursor-pointer"
                                >
                                    Borrar historial
                                </button>
                            </div>
                            <div className="space-y-0.5">
                                {recentSearches.map((term) => (
                                    <div
                                        key={term}
                                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 group transition-colors cursor-pointer"
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={() => onSelectTerm(term)}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0 group-hover:text-primary transition-colors" />
                                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors truncate">
                                                {term}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {onRemoveRecent && (
                                                <button
                                                    type="button"
                                                    title={`Eliminar "${term}"`}
                                                    aria-label={`Eliminar "${term}" de recientes`}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onRemoveRecent(term);
                                                    }}
                                                    className="p-1 text-gray-600 hover:text-gray-300 rounded hover:bg-white/10 transition-colors cursor-pointer"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Populares Dinámicos */}
                    {hasTrending && (
                        <div className="px-3 pt-3 pb-2">
                            <span className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 flex items-center gap-1.5">
                                <TrendingUp className="w-3 h-3 text-amber-400" />
                                Tendencias Más Buscadas
                            </span>
                            <div className="mt-2 flex flex-wrap gap-1.5 px-1">
                                {trendingSuggestions.map((term) => (
                                    <button
                                        key={term}
                                        type="button"
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            onSelectTerm(term);
                                        }}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 hover:text-white hover:bg-white/10 hover:border-primary/40 transition-all cursor-pointer group"
                                    >
                                        <span className="text-amber-400 group-hover:scale-110 transition-transform">🔥</span>
                                        <span>{term}</span>
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
