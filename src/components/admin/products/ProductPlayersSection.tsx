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
        <section className="relative bg-[#0d0e12]/80 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-3xl p-6 sm:p-8 space-y-6 overflow-hidden">
            {/* Top specular highlight - Apple Design System */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0">
                        <Users className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-black text-white tracking-tight">
                                Jugadores de esta Camisa
                            </h2>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25">
                                {selectedCount} de {activeTeamPlayers.length}
                            </span>
                        </div>
                        <p className="text-gray-400 text-xs mt-0.5">
                            Selecciona qué jugadores aparecen en la personalización y búsqueda de esta prenda.
                        </p>
                    </div>
                </div>

                {activeTeamPlayers.length > 0 && (
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={onSelectAll}
                            className="text-xs font-bold text-purple-300 hover:text-white px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 active:scale-[0.97] transition-all cursor-pointer"
                        >
                            Todos
                        </button>
                        <button
                            type="button"
                            onClick={onDeselectAll}
                            className="text-xs font-bold text-gray-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 active:scale-[0.97] transition-all cursor-pointer"
                        >
                            Ninguno
                        </button>
                    </div>
                )}
            </div>

            {/* Grid de Jugadores Disponibles */}
            {activeTeamPlayers.length === 0 ? (
                <div className="py-6 px-4 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
                    <p className="text-xs text-gray-500 italic">
                        No hay jugadores registrados para el equipo seleccionado. Puedes agregarlos abajo.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
                    {activeTeamPlayers.map((player) => {
                        const isSelected = selectedPlayerIds.has(player.id);
                        return (
                            <button
                                key={player.id}
                                type="button"
                                onClick={() => onTogglePlayer(player.id)}
                                className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all duration-150 active:scale-[0.97] cursor-pointer ${
                                    isSelected
                                        ? 'bg-purple-500/15 border-purple-500/40 text-white shadow-sm'
                                        : 'bg-[#14151b] border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                                }`}
                            >
                                <div className="min-w-0 pr-1">
                                    <p className="text-xs font-bold truncate leading-tight">
                                        {player.name}
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-mono font-bold mt-0.5">
                                        #{player.number || '0'}
                                    </p>
                                </div>
                                <div
                                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                        isSelected
                                            ? 'bg-purple-500 border-purple-500 text-white shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                                            : 'border-white/20 bg-white/[0.03]'
                                    }`}
                                >
                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Quick Add Player */}
            <div className="pt-4 border-t border-white/[0.08]">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-purple-400" />
                    Añadir Jugador al Equipo
                </h3>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                        type="text"
                        placeholder="Nombre (ej: VINICIUS JR.)"
                        value={newPlayer.name}
                        onChange={(e) =>
                            setNewPlayer((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className="flex-1 bg-[#14151b] border border-white/10 hover:border-white/20 focus:border-purple-500/80 focus:ring-2 focus:ring-purple-500/20 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 transition-all uppercase outline-none"
                    />
                    <input
                        type="text"
                        placeholder="Dorsal (ej: 7)"
                        value={newPlayer.number}
                        onChange={(e) =>
                            setNewPlayer((prev) => ({ ...prev, number: e.target.value }))
                        }
                        className="w-full sm:w-28 bg-[#14151b] border border-white/10 hover:border-white/20 focus:border-purple-500/80 focus:ring-2 focus:ring-purple-500/20 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 transition-all font-mono outline-none"
                    />
                    <button
                        type="button"
                        onClick={onAddPlayer}
                        disabled={addingPlayer || !newPlayer.name.trim()}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.97] cursor-pointer disabled:cursor-not-allowed shrink-0"
                    >
                        {addingPlayer ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <UserPlus className="w-3.5 h-3.5" />
                        )}
                        <span>Guardar</span>
                    </button>
                </div>
            </div>
        </section>
    );
}
