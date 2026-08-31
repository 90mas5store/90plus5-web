'use client';

import React from 'react';
import { Users, X, UserPlus, Loader2 } from 'lucide-react';
import { AdminPlayer } from '@/types/adminProduct';

interface ProductPlayersSectionProps {
    teamPlayers: AdminPlayer[];
    newPlayer: { name: string; number: string };
    setNewPlayer: React.Dispatch<React.SetStateAction<{ name: string; number: string }>>;
    addingPlayer: boolean;
    onAddPlayer: () => void;
    onDeletePlayer: (playerId: string) => void;
}

export default function ProductPlayersSection({
    teamPlayers,
    newPlayer,
    setNewPlayer,
    addingPlayer,
    onAddPlayer,
    onDeletePlayer,
}: ProductPlayersSectionProps) {
    return (
        <section className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6 sm:p-8 md:p-10 space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0">
                    <Users className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Plantilla del Equipo</h2>
                    <p className="text-gray-500 text-xs">
                        Administra los dorsales disponibles para este equipo.
                    </p>
                </div>
            </div>

            <div className="bg-black/30 rounded-xl border border-white/5 overflow-hidden">
                {/* Lista de Jugadores */}
                {teamPlayers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-4 max-h-60 overflow-y-auto custom-scrollbar">
                        {teamPlayers.map((player) => (
                            <div
                                key={player.id}
                                className="flex items-center justify-between bg-white/5 hover:bg-white/10 p-2 pl-3 rounded-lg group transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="font-black text-purple-400 w-6 text-right">
                                        {player.number}
                                    </span>
                                    <span className="text-sm font-bold text-gray-300 truncate max-w-[120px]">
                                        {player.name}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onDeletePlayer(player.id)}
                                    className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 cursor-pointer"
                                    title="Eliminar Jugador"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500 text-xs italic">
                        No hay jugadores registrados para este equipo.
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
                        placeholder="Nombre del Jugador"
                        className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-white focus:border-purple-500 outline-none"
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
                        className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {addingPlayer ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <UserPlus className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>
        </section>
    );
}
