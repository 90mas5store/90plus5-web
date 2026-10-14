import React from "react";
import { Sparkles, Search, Shield, Trophy, CheckCircle2, Plus, HelpCircle } from "lucide-react";
import { LeagueDefinition, TeamDiscoveryMapping } from "./types";

interface TorneosDiscoverySectionProps {
    discoveryQuery: string;
    setDiscoveryQuery: (q: string) => void;
    matchedTeams: TeamDiscoveryMapping[];
    matchedSuggestedLeagues: LeagueDefinition[];
    suggestedLeagues: LeagueDefinition[];
    activeSlugsSet: Set<string>;
    allTrackedSlugsSet: Set<string>;
    onToggleLeague: (slug: string) => void;
    onAddSuggestedLeague: (league: LeagueDefinition) => void;
    onOpenManualWithQuery: (q: string) => void;
}

const POPULAR_SEARCH_TERMS = [
    "Boca Juniors",
    "Copa Argentina",
    "Colombia",
    "Flamengo",
    "Arabia Saudita",
    "Eredivisie",
    "Copa del Rey",
];

export default function TorneosDiscoverySection({
    discoveryQuery,
    setDiscoveryQuery,
    matchedTeams,
    matchedSuggestedLeagues,
    suggestedLeagues,
    activeSlugsSet,
    allTrackedSlugsSet,
    onToggleLeague,
    onAddSuggestedLeague,
    onOpenManualWithQuery,
}: TorneosDiscoverySectionProps) {
    const normalizedQuery = discoveryQuery.trim().toLowerCase();

    return (
        <div className="bg-gradient-to-br from-[#121318] via-neutral-900/90 to-black border border-white/15 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-3xl space-y-4">
                <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-2xl bg-red-500/15 text-red-400 border border-red-500/25">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                            Buscador Inteligente de Torneos y Equipos
                        </h2>
                        <p className="text-xs text-gray-400">
                            Escribe el nombre de un <strong>club</strong> (ej. <em>Boca, Racing, Flamengo</em>) o de un <strong>país/liga</strong> (ej. <em>Colombia, Copa Argentina, Arabia</em>). El sistema encuentra el torneo oficial automáticamente.
                        </p>
                    </div>
                </div>

                {/* Input de Búsqueda Predictiva */}
                <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={discoveryQuery}
                        onChange={(e) => setDiscoveryQuery(e.target.value)}
                        placeholder="Buscar por equipo, país o torneo (ej. Boca, Colombia, Copa Argentina, Real Madrid, Al Nassr)..."
                        className="w-full bg-black/70 border border-white/20 focus:border-red-500/80 rounded-2xl pl-12 pr-4 py-3.5 text-sm sm:text-base text-white outline-none transition-all placeholder:text-gray-500 shadow-inner"
                    />
                    {discoveryQuery && (
                        <button
                            type="button"
                            onClick={() => setDiscoveryQuery("")}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-xs text-gray-400 hover:text-white bg-white/10 cursor-pointer"
                        >
                            Limpiar
                        </button>
                    )}
                </div>

                {/* Sugerencias Rápidas Populares */}
                {!discoveryQuery && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-xs text-gray-500 font-medium">Búsquedas populares:</span>
                        {POPULAR_SEARCH_TERMS.map((term) => (
                            <button
                                key={term}
                                type="button"
                                onClick={() => setDiscoveryQuery(term)}
                                className="px-2.5 py-1 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 text-xs text-gray-300 font-medium transition-all cursor-pointer"
                            >
                                {term}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── RESULTADOS DINÁMICOS DE DESCUBRIMIENTO ── */}
            {discoveryQuery && (
                <div className="relative z-10 mt-6 pt-6 border-t border-white/10 space-y-6 animate-fadeIn">
                    {/* 1. SECCIÓN: EQUIPOS DETECTADOS */}
                    {matchedTeams.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                                <Shield className="w-3.5 h-3.5 text-red-400" />
                                <span>Equipos encontrados ({matchedTeams.length})</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {matchedTeams.map((team) => (
                                    <div
                                        key={team.name}
                                        className="p-4 rounded-2xl bg-neutral-900/90 border border-white/15 space-y-3 shadow-lg"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-2xl">{team.flag}</span>
                                                <div>
                                                    <h3 className="text-sm font-black text-white">{team.name}</h3>
                                                    <span className="text-[11px] text-gray-400">{team.country}</span>
                                                </div>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-gray-300">
                                                {team.leagueSlugs.length} torneos
                                            </span>
                                        </div>

                                        {/* Lista de torneos en los que juega el equipo */}
                                        <div className="space-y-1.5 pt-2 border-t border-white/5">
                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                                                Torneos donde compite:
                                            </span>
                                            {team.leagueSlugs.map((slug) => {
                                                const def = suggestedLeagues.find((s) => s.slug === slug);
                                                const isAlreadyActive = activeSlugsSet.has(slug);
                                                const isTracked = allTrackedSlugsSet.has(slug);

                                                return (
                                                    <div
                                                        key={slug}
                                                        className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/5 text-xs"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-base">{def?.flag || "🏆"}</span>
                                                            <span className="text-white font-medium">{def?.name || slug}</span>
                                                            <code className="text-[10px] text-gray-500 font-mono">({slug})</code>
                                                        </div>

                                                        {isAlreadyActive ? (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                                <span>Activo</span>
                                                            </span>
                                                        ) : isTracked ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => onToggleLeague(slug)}
                                                                className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[11px] hover:bg-amber-500/30 transition-all cursor-pointer"
                                                            >
                                                                Reactivar
                                                            </button>
                                                        ) : def ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => onAddSuggestedLeague(def)}
                                                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                                <span>Añadir</span>
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 2. SECCIÓN: TORNEOS O PAÍSES DETECTADOS */}
                    {matchedSuggestedLeagues.length > 0 && (
                        <div className="space-y-3">
                            {(normalizedQuery.includes("catar") || normalizedQuery.includes("qatar")) && (
                                <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2.5">
                                    <span className="text-base">ℹ️</span>
                                    <div>
                                        <strong className="text-white block font-bold mb-0.5">Nota sobre el fútbol de Catar:</strong>
                                        ESPN no cuenta con endpoint oficial para la liga local de Catar (<em>Qatar Stars League</em>). No obstante, los clubes y la selección de Catar compiten en los torneos continentales oficiales de ESPN mostrados abajo (<em>AFC Champions League, Arabian Gulf Cup y Copa Asiática AFC</em>).
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                                <span>Torneos sugeridos ({matchedSuggestedLeagues.length})</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {matchedSuggestedLeagues.map((league) => {
                                    const isAlreadyActive = activeSlugsSet.has(league.slug);
                                    const isTracked = allTrackedSlugsSet.has(league.slug);

                                    return (
                                        <div
                                            key={league.slug}
                                            className="p-3.5 rounded-2xl bg-neutral-900/90 border border-white/10 flex flex-col justify-between gap-3 shadow-md"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">{league.flag || "🏆"}</span>
                                                    <span className="text-sm font-bold text-white line-clamp-1">{league.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                                    <code className="text-gray-400 bg-white/5 px-1.5 py-0.5 rounded font-mono text-[10px]">
                                                        {league.slug}
                                                    </code>
                                                    {league.country && <span>• {league.country}</span>}
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                                                <span className="text-[10px] text-gray-500">{league.category}</span>

                                                {isAlreadyActive ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        <span>En seguimiento</span>
                                                    </span>
                                                ) : isTracked ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => onToggleLeague(league.slug)}
                                                        className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs hover:bg-amber-500/30 transition-all cursor-pointer"
                                                    >
                                                        Reactivar
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => onAddSuggestedLeague(league)}
                                                        className="px-3 py-1.5 rounded-xl bg-[#E50914] hover:bg-red-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                        <span>Añadir a Matchday</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Sin coincidencias en el diccionario predictivo */}
                    {matchedTeams.length === 0 && matchedSuggestedLeagues.length === 0 && (
                        <div className="p-6 rounded-2xl bg-neutral-900/50 border border-white/10 text-center space-y-3">
                            <HelpCircle className="w-8 h-8 text-gray-500 mx-auto" />
                            <p className="text-sm text-gray-300">
                                No se encontró un torneo o equipo predefinido para <strong>&ldquo;{discoveryQuery}&rdquo;</strong>.
                            </p>
                            <p className="text-xs text-gray-500 max-w-md mx-auto">
                                Si conoces el código de ESPN, puedes probarlo y añadirlo mediante el modo manual a continuación.
                            </p>
                            <button
                                type="button"
                                onClick={() => onOpenManualWithQuery(discoveryQuery)}
                                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all cursor-pointer"
                            >
                                Abrir formulario manual con &ldquo;{discoveryQuery}&rdquo;
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
