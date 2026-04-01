'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Plus, Edit, Trash2, Save, Loader2, X,
    Scissors, Users, ChevronDown
} from 'lucide-react'
import useToastMessage from '@/hooks/useToastMessage'
import { useAdminRole } from '@/hooks/useAdminRole'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

interface Patch {
    id: string
    name: string
    active: boolean
}

interface Team {
    id: string
    name: string
}

interface Player {
    id: string
    team_id: string
    name: string
    number: number
    active: boolean
}

const EMPTY_PATCH = { name: '', active: true }

export default function EstilosPage() {
    const supabaseRef = useRef(createClient())
    const supabase = supabaseRef.current
    const toast = useToastMessage()
    const { isSuperAdmin } = useAdminRole()

    const [activeTab, setActiveTab] = useState<'parches' | 'plantillas'>('parches')

    // ── Parches ──────────────────────────────────────────
    const [patches, setPatches] = useState<Patch[]>([])
    const [patchesLoading, setPatchesLoading] = useState(true)
    const [patchSaving, setPatchSaving] = useState(false)
    const [editingPatch, setEditingPatch] = useState<Patch | null>(null)
    const [patchForm, setPatchForm] = useState(EMPTY_PATCH)
    const [patchDeleteTarget, setPatchDeleteTarget] = useState<string | null>(null)

    // ── Plantillas ────────────────────────────────────────
    const [teams, setTeams] = useState<Team[]>([])
    const [selectedTeamId, setSelectedTeamId] = useState('')
    const [players, setPlayers] = useState<Player[]>([])
    const [playersLoading, setPlayersLoading] = useState(false)
    const [newPlayer, setNewPlayer] = useState({ name: '', number: '' })
    const [addingPlayer, setAddingPlayer] = useState(false)
    const [playerDeleteTarget, setPlayerDeleteTarget] = useState<string | null>(null)

    // ── Carga inicial ─────────────────────────────────────
    const fetchPatches = useCallback(async () => {
        setPatchesLoading(true)
        const { data, error } = await supabase
            .from('patches')
            .select('*')
            .order('name')
        if (error) toast.error('Error al cargar parches')
        else setPatches(data || [])
        setPatchesLoading(false)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const fetchTeams = useCallback(async () => {
        const { data } = await supabase
            .from('teams')
            .select('id, name')
            .order('name')
        setTeams(data || [])
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { fetchPatches(); fetchTeams() }, [fetchPatches, fetchTeams])

    // Jugadores al cambiar equipo
    useEffect(() => {
        if (!selectedTeamId) { setPlayers([]); return }
        setPlayersLoading(true)
        supabase
            .from('players')
            .select('*')
            .eq('team_id', selectedTeamId)
            .order('number', { ascending: true })
            .then(({ data }) => {
                setPlayers(data || [])
                setPlayersLoading(false)
            })
    }, [selectedTeamId]) // eslint-disable-line react-hooks/exhaustive-deps

    // ── Patches CRUD ──────────────────────────────────────
    const openEditPatch = (p: Patch) => {
        setEditingPatch(p)
        setPatchForm({ name: p.name, active: p.active })
    }

    const openNewPatch = () => {
        setEditingPatch(null)
        setPatchForm(EMPTY_PATCH)
    }

    const handleSavePatch = async () => {
        if (!patchForm.name.trim()) { toast.error('El nombre es obligatorio'); return }
        setPatchSaving(true)
        try {
            if (editingPatch) {
                const { error } = await supabase
                    .from('patches')
                    .update({ name: patchForm.name, active: patchForm.active })
                    .eq('id', editingPatch.id)
                if (error) throw error
                toast.success('Parche actualizado')
            } else {
                const { error } = await supabase
                    .from('patches')
                    .insert({ name: patchForm.name, active: patchForm.active })
                if (error) throw error
                toast.success('Parche creado')
            }
            openNewPatch()
            fetchPatches()
        } catch (err: unknown) {
            toast.error(`Error: ${(err as Error).message}`)
        } finally {
            setPatchSaving(false)
        }
    }

    const handleDeletePatch = async (id: string) => {
        try {
            const { error } = await supabase.from('patches').delete().eq('id', id)
            if (error) throw error
            toast.success('Parche eliminado')
            fetchPatches()
        } catch (err: unknown) {
            toast.error(`Error: ${(err as Error).message}`)
        } finally {
            setPatchDeleteTarget(null)
        }
    }

    // ── Players CRUD ──────────────────────────────────────
    const handleAddPlayer = async () => {
        if (!newPlayer.name.trim() || !newPlayer.number || !selectedTeamId) return
        setAddingPlayer(true)
        try {
            const { data, error } = await supabase
                .from('players')
                .insert({
                    name: newPlayer.name.trim(),
                    number: parseInt(newPlayer.number),
                    team_id: selectedTeamId,
                    active: true,
                })
                .select()
                .single()
            if (error) throw error
            setPlayers(prev => [...prev, data].sort((a, b) => a.number - b.number))
            setNewPlayer({ name: '', number: '' })
            toast.success('Jugador agregado')
        } catch (err: unknown) {
            toast.error(`Error: ${(err as Error).message}`)
        } finally {
            setAddingPlayer(false)
        }
    }

    const handleDeletePlayer = async (id: string) => {
        try {
            const { error } = await supabase
                .from('players')
                .update({ active: false })
                .eq('id', id)
            if (error) throw error
            setPlayers(prev => prev.filter(p => p.id !== id))
            toast.success('Jugador eliminado')
        } catch (err: unknown) {
            toast.error(`Error: ${(err as Error).message}`)
        } finally {
            setPlayerDeleteTarget(null)
        }
    }

    return (
        <div className="max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* HEADER */}
            <div className="sticky top-0 z-30 bg-neutral-950/80 backdrop-blur-xl border-b border-white/5 pb-0 mb-8 pt-6 -mx-4 px-4 md:mx-0 md:px-0 md:pt-8">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                        <Scissors className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Personalización</h1>
                        <p className="text-gray-500 text-xs">Gestión de parches y plantillas de jugadores por equipo</p>
                    </div>
                </div>

                {/* TABS */}
                <div className="flex gap-1">
                    {(['parches', 'plantillas'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2.5 rounded-t-xl text-sm font-bold transition-all border-b-2 ${
                                activeTab === tab
                                    ? 'text-white border-white'
                                    : 'text-gray-500 border-transparent hover:text-gray-300'
                            }`}
                        >
                            {tab === 'parches' ? 'Parches' : 'Plantillas'}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── TAB: PARCHES ─────────────────────────── */}
            {activeTab === 'parches' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Lista */}
                    <div className="lg:col-span-7 space-y-3">
                        {patchesLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            </div>
                        ) : patches.length === 0 ? (
                            <div className="text-center py-16 border-2 border-dashed border-white/5 rounded-3xl">
                                <Scissors className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                                <p className="text-gray-500 font-bold">No hay parches creados aún</p>
                                <p className="text-gray-600 text-sm mt-1">Crea el primero usando el formulario</p>
                            </div>
                        ) : (
                            patches.map(p => (
                                <div
                                    key={p.id}
                                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                                        editingPatch?.id === p.id
                                            ? 'border-violet-500/40 bg-violet-500/5'
                                            : 'border-white/5 bg-white/[0.02] hover:border-white/15'
                                    }`}
                                >
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${p.active ? 'bg-green-500 shadow-[0_0_6px_#22c55e]' : 'bg-gray-600'}`} />
                                    <p className="flex-1 font-bold text-white truncate">{p.name}</p>
                                    {!p.active && (
                                        <span className="text-[10px] uppercase font-bold text-gray-600 border border-gray-700 px-2 py-0.5 rounded-full shrink-0">
                                            Inactivo
                                        </span>
                                    )}
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => openEditPatch(p)}
                                            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                                            title="Editar"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setPatchDeleteTarget(p.id)}
                                            disabled={!isSuperAdmin}
                                            title={!isSuperAdmin ? 'Solo super admin puede eliminar' : 'Eliminar'}
                                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Formulario parche */}
                    <div className="lg:col-span-5">
                        <div className="sticky top-28 bg-neutral-900/50 border border-white/5 rounded-3xl p-6 space-y-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-black text-white uppercase tracking-widest">
                                    {editingPatch ? 'Editar Parche' : 'Nuevo Parche'}
                                </h2>
                                {editingPatch && (
                                    <button
                                        onClick={openNewPatch}
                                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                        title="Cancelar edición"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">
                                    Nombre del Parche *
                                </label>
                                <input
                                    type="text"
                                    value={patchForm.name}
                                    onChange={e => setPatchForm(p => ({ ...p, name: e.target.value }))}
                                    onKeyDown={e => e.key === 'Enter' && handleSavePatch()}
                                    placeholder="Ej. Parche Champions, Liga MX..."
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500/50 outline-none transition-all font-medium"
                                />
                            </div>

                            <label className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-xl cursor-pointer hover:bg-black/60 transition-colors">
                                <span className="text-sm font-medium text-white flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${patchForm.active ? 'bg-green-500 shadow-[0_0_6px_#22c55e]' : 'bg-gray-600'}`} />
                                    Parche Activo
                                </span>
                                <input
                                    type="checkbox"
                                    checked={patchForm.active}
                                    onChange={e => setPatchForm(p => ({ ...p, active: e.target.checked }))}
                                    className="w-4 h-4 accent-violet-500 rounded cursor-pointer"
                                />
                            </label>

                            <button
                                onClick={handleSavePatch}
                                disabled={patchSaving}
                                className="w-full bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                            >
                                {patchSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {patchSaving ? 'Guardando...' : editingPatch ? 'Actualizar Parche' : 'Crear Parche'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB: PLANTILLAS ──────────────────────── */}
            {activeTab === 'plantillas' && (
                <div className="space-y-6">

                    {/* Selector de equipo */}
                    <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-5">
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-3">
                            Seleccionar Equipo
                        </label>
                        <div className="relative">
                            <select
                                value={selectedTeamId}
                                onChange={e => { setSelectedTeamId(e.target.value); setNewPlayer({ name: '', number: '' }) }}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500/50 outline-none appearance-none pr-10 font-medium"
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
                                        Plantilla · {teams.find(t => t.id === selectedTeamId)?.name}
                                    </h2>
                                    <span className="text-xs text-gray-500">
                                        {players.filter(p => p.active).length} jugadores activos
                                    </span>
                                </div>

                                {playersLoading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                    </div>
                                ) : players.filter(p => p.active).length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl">
                                        <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                                        <p className="text-gray-500 font-bold text-sm">Sin jugadores</p>
                                        <p className="text-gray-600 text-xs mt-1">Agrega el primero con el formulario</p>
                                    </div>
                                ) : (
                                    players.filter(p => p.active).map(player => (
                                        <div
                                            key={player.id}
                                            className="flex items-center gap-4 p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/15 transition-all"
                                        >
                                            <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                                <span className="font-black text-sm text-white">{player.number}</span>
                                            </div>
                                            <span className="flex-1 font-bold text-white">{player.name}</span>
                                            <button
                                                onClick={() => setPlayerDeleteTarget(player.id)}
                                                disabled={!isSuperAdmin}
                                                title={!isSuperAdmin ? 'Solo super admin puede eliminar' : 'Eliminar jugador'}
                                                className="p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))
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
                                                onKeyDown={e => e.key === 'Enter' && handleAddPlayer()}
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
                                                onKeyDown={e => e.key === 'Enter' && handleAddPlayer()}
                                                placeholder="Nombre del jugador"
                                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500/50 outline-none font-medium"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleAddPlayer}
                                        disabled={addingPlayer || !newPlayer.name.trim() || !newPlayer.number}
                                        className="w-full bg-violet-500 hover:bg-violet-600 disabled:opacity-40 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                                    >
                                        {addingPlayer
                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                            : <Plus className="w-4 h-4" />
                                        }
                                        {addingPlayer ? 'Guardando...' : 'Agregar Jugador'}
                                    </button>

                                    <p className="text-[10px] text-gray-600 text-center leading-relaxed">
                                        Los jugadores son compartidos en todos los productos de este equipo
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <ConfirmDialog
                open={patchDeleteTarget !== null}
                title="Eliminar parche"
                message="¿Eliminar este parche? Los productos que lo tengan asignado perderán este parche."
                confirmLabel="Eliminar"
                onConfirm={() => { if (patchDeleteTarget) handleDeletePatch(patchDeleteTarget) }}
                onCancel={() => setPatchDeleteTarget(null)}
            />

            <ConfirmDialog
                open={playerDeleteTarget !== null}
                title="Eliminar jugador"
                message="¿Eliminar este jugador de la plantilla? Esta acción es reversible desde la base de datos."
                confirmLabel="Eliminar"
                onConfirm={() => { if (playerDeleteTarget) handleDeletePlayer(playerDeleteTarget) }}
                onCancel={() => setPlayerDeleteTarget(null)}
            />
        </div>
    )
}
