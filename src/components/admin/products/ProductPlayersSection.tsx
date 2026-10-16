'use client';

import React from 'react';
import { Users, UserPlus, Loader2, Check } from 'lucide-react';
import { AdminPlayer } from '@/types/adminProduct';

interface ProductPlayersSectionProps {
    teamPlayers: AdminPlayer[];
    selectedPlayerIds: Set<string>;
    onTogglePlayer: (playerId: string) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    newPlayer: { name: string; number: string };
    setNewPlayer: React.Dispatch<React.SetStateAction<{ name: string; number: string }>>;
    addingPlayer: boolean;
    onAddPlayer: () => void;
}

export default function ProductPlayersSection({
    teamPlayers,
    selectedPlayerIds,
    onTogglePlayer,
    onSelectAll,
    onDeselectAll,
    newPlayer,
    setNewPlayer,
    addingPlayer,
    onAddPlayer,
}: ProductPlayersSectionProps) {
    const activeTeamPlayers = teamPlayers.filter((p) => p.active !== false);
    const selectedCount = activeTeamPlayers.filter((p) => selectedPlayerIds.has(p.id)).length;

    return (
        <section className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6 sm:p-8 md:p-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0">
                        <Users className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-white">Jugadores de esta Camisa</h2>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                {selectedCount} de {activeTeamPlayers.length}
                            </span>
                        </div>
                        <p className="text-gray-500 text-xs mt-0.5">
                            Selecciona qué jugadores aparecen en la personalización y en la búsqueda de esta camisa.
                        </p>
                    </div>
                </div>

                {activeTeamPlayers.length > 0 && (
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={onSelectAll}
                            className="text-[11px] font-bold text-purple-400 hover:text-purple-300 px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition-colors cursor-pointer"
                        >
                            Todos
                        </button>
                        <button
                            type="button"
                            onClick={onDeselectAll}
                            className="text-[11px] font-bold text-gray-400 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            Ninguno
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-black/30 rounded-xl border border-white/5 overflow-hidden">
                {/* Lista de Jugadores */}
                {activeTeamPlayers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-4 max-h-72 overflow-y-auto custom-scrollbar">
                        {activeTeamPlayers.map((player) => {
                            const isSelected = selectedPlayerIds.has(player.id);
                            return (
                                <button
                                    key={player.id}
                                    type="button"
                                    onClick={() => onTogglePlayer(player.id)}
                                    className={`flex items-center justify-between p-2 pl-3 rounded-lg border text-left transition-all cursor-pointer ${
                                        isSelected
                                            ? 'bg-purple-600/15 border-purple-500/40 text-white shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                                            : 'bg-white/[0.03] border-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span
                                            className={`font-black w-6 text-right shrink-0 ${
                                                isSelected ? 'text-purple-400' : 'text-gray-500'
                                            }`}
                                        >
                                            {player.number}
                                        </span>
                                        <span className="text-sm font-bold truncate">
                                            {player.name}
                                        </span>
                                    </div>
                                    <div
                                        className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-all ${
                                            isSelected
                                                ? 'bg-purple-600 border-purple-500 text-white'
                                                : 'border-white/20 bg-black/40 text-transparent'
                                        }`}
                                    >
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500 text-xs italic">
                        No hay jugadores registrados en la plantilla de este equipo. Puedes agregar uno abajo.
                    </div>
                )}

                {/* Agregar Jugador Form */}
                <div className="p-4 bg-white/[0.02] border-t border-white/5 flex gap-2">
                    <input
                        type="number"
                        placeholder="#"
                        className="w-16 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-center font-bold text-white focus:border-purple-500 outline-none"
                        value={newPlayer.number}
                        onChange={(e) =>
                            setNewPlayer((prev) => ({ ...prev, number: e.target.value }))
                        }
                    />
                    <input
                        type="text"
                        placeholder="Nombre del Jugador (ej. YAMAL)"
                        className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-white focus:border-purple-500 outline-none uppercase"
                        value={newPlayer.name}
                        onChange={(e) =>
                            setNewPlayer((prev) => ({ ...prev, name: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === 'Enter' && onAddPlayer()}
                    />
                    <button
                        type="button"
                        onClick={onAddPlayer}
                        disabled={!newPlayer.name || !newPlayer.number || addingPlayer}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                    >
                        {addingPlayer ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <UserPlus className="w-4 h-4" />
                                <span className="hidden sm:inline">Agregar</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </section>
    );
}

