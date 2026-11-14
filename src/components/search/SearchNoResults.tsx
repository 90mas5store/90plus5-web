import React, { useEffect } from 'react';
import { Shirt } from 'lucide-react';
import { QuickClub } from '@/types/search';
import { trackSearchAnalytics } from '@/hooks/useRecentSearches';

interface SearchNoResultsProps {
    value: string;
    topClubs: QuickClub[];
    onSelectTerm: (term: string) => void;
}

export default function SearchNoResults({
    value,
    topClubs,
    onSelectTerm,
}: SearchNoResultsProps) {
    // Registrar automáticamente búsquedas en vivo que no arrojan resultados tras una pausa de escritura (1.2s)
    useEffect(() => {
        const clean = value.trim();
        if (clean.length < 3) return;
        const timer = setTimeout(() => {
            trackSearchAnalytics(clean, 0);
        }, 1200);
        return () => clearTimeout(timer);
    }, [value]);

    return (
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
    );
}
