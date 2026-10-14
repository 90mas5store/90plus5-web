import React from "react";
import { Search, ExternalLink, Trash2 } from "lucide-react";
import { LeagueDefinition, CategoryFilter } from "./types";

interface TorneosListSectionProps {
    trackedLeagues: LeagueDefinition[];
    filteredActiveLeagues: LeagueDefinition[];
    activeCount: number;
    disabledLeagues: string[];
    customLeagues: LeagueDefinition[];
    categoryFilter: CategoryFilter;
    setCategoryFilter: (cat: CategoryFilter) => void;
    listSearch: string;
    setListSearch: (s: string) => void;
    onToggleLeague: (slug: string) => void;
    onDeleteCustom: (slug: string) => void;
}

const CATEGORY_TABS: CategoryFilter[] = [
    "Todos",
    "Copas Nacionales",
    "Ligas Principales",
    "Torneos Continentales",
    "Selecciones & FIFA",
    "Personalizados",
];

export default function TorneosListSection({
    trackedLeagues,
    filteredActiveLeagues,
    activeCount,
    disabledLeagues,
    customLeagues,
    categoryFilter,
    setCategoryFilter,
    listSearch,
    setListSearch,
    onToggleLeague,
    onDeleteCustom,
}: TorneosListSectionProps) {
    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white tracking-tight">
                        Torneos en Seguimiento ({trackedLeagues.length})
                    </h2>
                    <span className="text-xs text-gray-500">
                        ({activeCount} activos, {disabledLeagues.length} pausados)
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Categorías */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                        {CATEGORY_TABS.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                    categoryFilter === cat
                                        ? "bg-white text-black shadow-sm"
                                        : "bg-white/5 text-gray-400 hover:text-white border border-white/5"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Buscador dentro de la lista */}
                    <div className="relative w-48 hidden sm:block">
                        <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={listSearch}
                            onChange={(e) => setListSearch(e.target.value)}
                            placeholder="Filtrar lista..."
                            className="w-full bg-black/60 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:border-primary outline-none transition-all placeholder:text-gray-600"
                        />
                    </div>
                </div>
            </div>

            {/* Grid de Torneos */}
            {filteredActiveLeagues.length === 0 ? (
                <div className="bg-neutral-900/40 border border-white/10 rounded-2xl p-10 text-center text-gray-500">
                    No se encontraron torneos en esta categoría.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredActiveLeagues.map((league) => {
                        const isDisabled = disabledLeagues.includes(league.slug);
                        const isCustom = customLeagues.some((c) => c.slug === league.slug);

                        return (
                            <div
                                key={league.slug}
                                className={`relative p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
                                    isDisabled
                                        ? "bg-neutral-950/40 border-white/5 opacity-55"
                                        : "bg-neutral-900/70 border-white/10 hover:border-white/20 shadow-md"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">{league.flag || "🏆"}</span>
                                            <span className="text-sm font-bold text-white leading-snug line-clamp-1">
                                                {league.name}
                                            </span>
                                            {isCustom && (
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                    Custom
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                            <code className="text-gray-400 bg-white/5 px-1.5 py-0.5 rounded font-mono text-[10px]">
                                                {league.slug}
                                            </code>
                                            {league.country && <span>• {league.country}</span>}
                                        </div>
                                    </div>

                                    {/* Switch On/Off */}
                                    <button
                                        type="button"
                                        onClick={() => onToggleLeague(league.slug)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                            !isDisabled ? "bg-[#E50914]" : "bg-neutral-700"
                                        }`}
                                        role="switch"
                                        aria-checked={!isDisabled}
                                        title={!isDisabled ? "Pausar monitoreo" : "Activar monitoreo"}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                !isDisabled ? "translate-x-5" : "translate-x-0"
                                            }`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                                    <span className="text-gray-500">{league.category}</span>

                                    <div className="flex items-center gap-2">
                                        <a
                                            href={`https://site.api.espn.com/apis/site/v2/sports/soccer/${league.slug}/scoreboard`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-gray-500 hover:text-white transition-colors flex items-center gap-1"
                                            title="Ver JSON de ESPN"
                                        >
                                            <span>ESPN API</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </a>

                                        {isCustom && (
                                            <button
                                                type="button"
                                                onClick={() => onDeleteCustom(league.slug)}
                                                className="text-red-400 hover:text-red-300 transition-colors p-1 cursor-pointer"
                                                title="Eliminar torneo personalizado"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
