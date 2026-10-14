import React from "react";
import { Users, ChevronDown, Loader2, Edit, Trash2, Plus, Save, X } from "lucide-react";
import { Team, Player } from "./types";

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
    const selectedTeam = teams.find(t => t.id === selectedTeamId);
    const activePlayers = players.filter(p => p.active);
    const inactivePlayers = players.filter(p => !p.active);

    return (
        <div className="space-y-6">
            {/* Selector de equipo */}
            <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-5">
                <label className="block text-xs font-bold uppercase text-gray-500 mb-3">
                    Seleccionar Equipo
                </label>
                <div className="relative">
                    <select
                        value={selectedTeamId}
                        onChange={e => {
                            setSelectedTeamId(e.target.value);
                            setNewPlayer({ name: "", number: "" });
                        }}
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500/50 outline-none appearance-none pr-10 font-medium cursor-pointer"
                    >
                        <option value="">— Elige un equipo —</option>
                        {teams.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
            </div>

            {!selectedTeamId ? (
                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                    <Users className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500 font-bold">Selecciona un equipo para ver su plantilla</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Lista jugadores */}
                    <div className="lg:col-span-7 space-y-2">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">
                                Plantilla · {selectedTeam?.name}
                            </h2>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500">
                                    {activePlayers.length} activos
                                </span>
                                {inactivePlayers.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowInactive(v => !v)}
                                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                            showInactive
                                                ? "bg-white/10 text-white border-white/20"
                                                : "text-gray-500 border-white/5 hover:border-white/15"
                                        }`}
                                    >
                                        {showInactive
                                            ? "Ocultar inactivos"
                                            : `Ver inactivos (${inactivePlayers.length})`}
                                    </button>
                                )}
                            </div>
                        </div>

                        {playersLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                            </div>
                        ) : activePlayers.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl">
                                <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                                <p className="text-gray-500 font-bold text-sm">Sin jugadores</p>
                                <p className="text-gray-600 text-xs mt-1">Agrega el primero con el formulario</p>
                            </div>
                        ) : (
                            <>
                                {activePlayers.map(player => (
                                    editingPlayer?.id === player.id ? (
                                        <div key={player.id} className="flex items-center gap-2 p-3 rounded-xl border border-violet-500/40 bg-violet-500/5">
                                            <input
                                                type="number"
                                                min={0}
                                                max={99}
                                                value={editPlayerForm.number}
                                                onChange={e => setEditPlayerForm(f => ({ ...f, number: e.target.value }))}
                                                className="w-16 bg-black/50 border border-white/10 rounded-lg p-2 text-white text-center font-mono text-sm outline-none focus:border-violet-500/50"
                                            />
                                            <input
                                                type="text"
                                                value={editPlayerForm.name}
                                                onChange={e => setEditPlayerForm(f => ({ ...f, name: e.target.value }))}
                                                onKeyDown={e => e.key === "Enter" && onSavePlayer()}
                                                className="flex-1 bg-black/50 border border-white/10 rounded-lg p-2 text-white font-medium text-sm outline-none focus:border-violet-500/50"
                                            />
                                            <button
                                                type="button"
                                                onClick={onSavePlayer}
                                                disabled={savingPlayer}
                                                className="p-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-all cursor-pointer"
                                            >
                                                {savingPlayer ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingPlayer(null)}
                                                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            key={player.id}
                                            className="flex items-center gap-4 p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/15 transition-all"
                                        >
                                            <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                                <span className="font-black text-sm text-white">{player.number}</span>
                                            </div>
                                            <span className="flex-1 font-bold text-white">{player.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => onOpenEditPlayer(player)}
                                                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                                                title="Editar jugador"
                                            >
                                                <Edit className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onOpenDeletePlayer(player.id)}
                                                disabled={!isSuperAdmin}
                                                title={!isSuperAdmin ? "Solo super admin puede desactivar" : "Desactivar jugador"}
                                                className="p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )
                                ))}

                                {showInactive && inactivePlayers.map(player => (
                                    <div
                                        key={player.id}
                                        className="flex items-center gap-4 p-3.5 rounded-xl border border-white/5 bg-white/[0.01] opacity-50 hover:opacity-80 transition-all"
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                            <span className="font-black text-sm text-gray-500">{player.number}</span>
                                        </div>
                                        <span className="flex-1 font-bold text-gray-500 line-through">{player.name}</span>
                                        <span className="text-[10px] text-gray-600 border border-gray-700 px-2 py-0.5 rounded-full">
                                            Inactivo
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => onRestorePlayer(player.id)}
                                            title="Restaurar jugador"
                                            className="p-2 rounded-lg text-gray-500 hover:text-green-500 hover:bg-green-500/10 transition-all cursor-pointer"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    {/* Formulario agregar jugador */}
                    <div className="lg:col-span-5">
                        <div className="sticky top-28 bg-neutral-900/50 border border-white/5 rounded-3xl p-6 space-y-4">
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">
                                Agregar Jugador
                            </h2>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">
                                        Dorsal
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={99}
                                        value={newPlayer.number}
                                        onChange={e => setNewPlayer(p => ({ ...p, number: e.target.value }))}
                                        onKeyDown={e => e.key === "Enter" && onAddPlayer()}
                                        placeholder="10"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500/50 outline-none font-mono text-center"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">
                                        Nombre
                                    </label>
                                    <input
                                        type="text"
                                        value={newPlayer.name}
                                        onChange={e => setNewPlayer(p => ({ ...p, name: e.target.value }))}
                                        onKeyDown={e => e.key === "Enter" && onAddPlayer()}
                                        placeholder="Nombre del jugador"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500/50 outline-none font-medium"
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onAddPlayer}
                                disabled={addingPlayer || !newPlayer.name.trim() || !newPlayer.number}
                                className="w-full bg-violet-500 hover:bg-violet-600 disabled:opacity-40 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                                {addingPlayer ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                {addingPlayer ? "Guardando..." : "Agregar Jugador"}
                            </button>

                            <p className="text-[10px] text-gray-600 text-center leading-relaxed">
                                Los jugadores son compartidos en todos los productos de este equipo
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
