'use client';

import React from 'react';
import { Users, ChevronDown, Loader2, Edit, Trash2, Plus, Save, X, Shield, Sparkles } from 'lucide-react';
import { Team, Player } from './types';

interface PlayersTabProps {
    teams: Team[];
    selectedTeamId: string;
    setSelectedTeamId: (id: string) => void;
    players: Player[];
    playersLoading: boolean;
    newPlayer: { name: string; number: string };
    setNewPlayer: React.Dispatch<React.SetStateAction<{ name: string; number: string }>>;
    addingPlayer: boolean;
    editingPlayer: Player | null;
    setEditingPlayer: (p: Player | null) => void;
    editPlayerForm: { name: string; number: string };
    setEditPlayerForm: React.Dispatch<React.SetStateAction<{ name: string; number: string }>>;
    savingPlayer: boolean;
    showInactive: boolean;
    setShowInactive: React.Dispatch<React.SetStateAction<boolean>>;
    isSuperAdmin: boolean;
    onAddPlayer: () => void;
    onSavePlayer: () => void;
    onOpenEditPlayer: (p: Player) => void;
    onOpenDeletePlayer: (id: string) => void;
    onRestorePlayer: (id: string) => void;
}

export default function PlayersTab({
    teams,
    selectedTeamId,
    setSelectedTeamId,
    players,
    playersLoading,
    newPlayer,
    setNewPlayer,
    addingPlayer,
    editingPlayer,
    setEditingPlayer,
    editPlayerForm,
    setEditPlayerForm,
    savingPlayer,
    showInactive,
    setShowInactive,
    isSuperAdmin,
    onAddPlayer,
    onSavePlayer,
    onOpenEditPlayer,
    onOpenDeletePlayer,
    onRestorePlayer,
}: PlayersTabProps) {
    const selectedTeam = teams.find((t) => t.id === selectedTeamId);
    const activePlayers = players.filter((p) => p.active);
    const inactivePlayers = players.filter((p) => !p.active);

    return (
        <div className="space-y-6">
            {/* Selector de equipo con estética Apple */}
            <div className="relative overflow-hidden bg-[#0d0e12]/60 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 shadow-2xl">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Shield className="w-4 h-4 text-primary" />
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                Seleccionar Equipo de la Plantilla
                            </label>
                        </div>
                        <p className="text-xs text-gray-500">
                            Los dorsales y nombres se comparten para todas las camisetas de este club
                        </p>
                    </div>

                    <div className="relative min-w-[280px]">
                        <select
                            value={selectedTeamId}
                            onChange={(e) => {
                                setSelectedTeamId(e.target.value);
                                setNewPlayer({ name: '', number: '' });
                            }}
                            className="w-full bg-[#14151b] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none pr-10 font-bold text-sm cursor-pointer transition-all"
                        >
                            <option value="">— Elige un equipo —</option>
                            {teams.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {!selectedTeamId ? (
                <div className="relative overflow-hidden bg-[#0d0e12]/60 border border-white/[0.08] backdrop-blur-xl rounded-3xl py-20 text-center shadow-2xl">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-white font-bold text-base">Selecciona un equipo arriba</p>
                    <p className="text-gray-400 text-sm mt-1">Podrás gestionar los dorsales oficiales y leyendas</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Lista jugadores */}
                    <div className="lg:col-span-7 space-y-3">
                        <div className="flex items-center justify-between px-1 mb-2">
                            <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-primary" />
                                Plantilla · {selectedTeam?.name}
                            </h2>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-400 bg-white/[0.04] border border-white/[0.06] px-2.5 py-0.5 rounded-full font-bold">
                                    {activePlayers.length} activos
                                </span>
                                {inactivePlayers.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowInactive((v) => !v)}
                                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                            showInactive
                                                ? 'bg-white/10 text-white border-white/20'
                                                : 'text-gray-500 border-white/5 hover:border-white/15'
                                        }`}
                                    >
                                        {showInactive
                                            ? 'Ocultar inactivos'
                                            : `Ver inactivos (${inactivePlayers.length})`}
                                    </button>
                                )}
                            </div>
                        </div>

                        {playersLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            </div>
                        ) : activePlayers.length === 0 ? (
                            <div className="relative overflow-hidden bg-[#0d0e12]/60 border border-white/[0.08] backdrop-blur-xl rounded-2xl py-12 text-center shadow-xl">
                                <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                                <p className="text-white font-bold text-sm">Sin jugadores en plantilla</p>
                                <p className="text-gray-400 text-xs mt-1">Agrega el primero con el formulario lateral</p>
                            </div>
                        ) : (
                            <>
                                {activePlayers.map((player) =>
                                    editingPlayer?.id === player.id ? (
                                        <div
                                            key={player.id}
                                            className="relative overflow-hidden rounded-2xl border border-primary/50 bg-primary/10 p-3 flex items-center gap-2 shadow-lg shadow-primary/10"
                                        >
                                            <input
                                                type="number"
                                                min={0}
                                                max={99}
                                                value={editPlayerForm.number}
                                                onChange={(e) =>
                                                    setEditPlayerForm((f) => ({ ...f, number: e.target.value }))
                                                }
                                                className="w-16 bg-[#14151b] border border-white/10 rounded-xl p-2.5 text-white text-center font-mono text-sm outline-none focus:border-primary font-bold"
                                            />
                                            <input
                                                type="text"
                                                value={editPlayerForm.name}
                                                onChange={(e) =>
                                                    setEditPlayerForm((f) => ({ ...f, name: e.target.value }))
                                                }
                                                onKeyDown={(e) => e.key === 'Enter' && onSavePlayer()}
                                                className="flex-1 bg-[#14151b] border border-white/10 rounded-xl p-2.5 text-white font-medium text-sm outline-none focus:border-primary"
                                            />
                                            <button
                                                type="button"
                                                onClick={onSavePlayer}
                                                disabled={savingPlayer}
                                                className="p-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white transition-all active:scale-[0.98] shadow-md shadow-primary/20 cursor-pointer"
                                            >
                                                {savingPlayer ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Save className="w-4 h-4" />
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingPlayer(null)}
                                                className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            key={player.id}
                                            className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0e12]/60 hover:border-white/20 backdrop-blur-xl p-3.5 flex items-center gap-4 transition-all"
                                        >
                                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                                            <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
                                                <span className="font-black text-sm text-white font-mono">
                                                    {player.number}
                                                </span>
                                            </div>
                                            <span className="flex-1 font-bold text-white tracking-wide text-sm">
                                                {player.name}
                                            </span>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => onOpenEditPlayer(player)}
                                                    className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 active:scale-[0.98] transition-all cursor-pointer"
                                                    title="Editar dorsal"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onOpenDeletePlayer(player.id)}
                                                    disabled={!isSuperAdmin}
                                                    title={
                                                        !isSuperAdmin
                                                            ? 'Solo super admin puede desactivar'
                                                            : 'Desactivar jugador'
                                                    }
                                                    className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                )}

                                {showInactive &&
                                    inactivePlayers.map((player) => (
                                        <div
                                            key={player.id}
                                            className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 flex items-center gap-4 opacity-60 hover:opacity-90 transition-all"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                                <span className="font-black text-sm text-gray-400 font-mono">
                                                    {player.number}
                                                </span>
                                            </div>
                                            <span className="flex-1 font-medium text-gray-400 line-through text-sm">
                                                {player.name}
                                            </span>
                                            <span className="text-[10px] text-gray-500 border border-neutral-700/60 px-2 py-0.5 rounded-full font-bold">
                                                Inactivo
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => onRestorePlayer(player.id)}
                                                title="Restaurar jugador"
                                                className="p-2 rounded-xl text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-[0.98] transition-all cursor-pointer"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                            </>
                        )}
                    </div>

                    {/* Formulario agregar jugador estilo Apple */}
                    <div className="lg:col-span-5">
                        <div className="sticky top-28 relative overflow-hidden bg-[#0d0e12]/60 border border-white/[0.08] backdrop-blur-xl rounded-3xl p-6 space-y-4 shadow-2xl">
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                            <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
                                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                    <Users className="w-4 h-4" />
                                </div>
                                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                                    Agregar Jugador
                                </h2>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-2">
                                        Dorsal
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={99}
                                        value={newPlayer.number}
                                        onChange={(e) =>
                                            setNewPlayer((p) => ({ ...p, number: e.target.value }))
                                        }
                                        onKeyDown={(e) => e.key === 'Enter' && onAddPlayer()}
                                        placeholder="10"
                                        className="w-full bg-[#14151b] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono text-center text-sm font-bold"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-2">
                                        Nombre / Apodo
                                    </label>
                                    <input
                                        type="text"
                                        value={newPlayer.name}
                                        onChange={(e) =>
                                            setNewPlayer((p) => ({ ...p, name: e.target.value }))
                                        }
                                        onKeyDown={(e) => e.key === 'Enter' && onAddPlayer()}
                                        placeholder="Ej. Bellingham o Zidane"
                                        className="w-full bg-[#14151b] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none font-medium text-sm"
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onAddPlayer}
                                disabled={addingPlayer || !newPlayer.name.trim() || !newPlayer.number}
                                className="w-full bg-primary hover:bg-primary-hover disabled:opacity-40 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-primary/20 cursor-pointer text-xs"
                            >
                                {addingPlayer ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Plus className="w-4 h-4" />
                                )}
                                {addingPlayer ? 'Guardando...' : 'Agregar a Plantilla'}
                            </button>

                            <p className="text-[10px] text-gray-500 text-center leading-relaxed">
                                Los jugadores son compartidos en todos los productos y camisetas de este equipo.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
