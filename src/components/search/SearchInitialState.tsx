import React from 'react';
import { Clock, TrendingUp, X, ArrowRight } from 'lucide-react';

interface SearchInitialStateProps {
    recentSearches: string[];
    trendingSuggestions: string[];
    onSelectTerm: (term: string) => void;
    onClearRecent: () => void;
    onRemoveRecent?: (term: string) => void;
}

export default function SearchInitialState({
    recentSearches,
    trendingSuggestions,
    onSelectTerm,
    onClearRecent,
    onRemoveRecent,
}: SearchInitialStateProps) {
    const hasRecent = recentSearches.length > 0;
    const hasTrending = trendingSuggestions.length > 0;

    if (!hasRecent && !hasTrending) return null;

    return (
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
    );
}
