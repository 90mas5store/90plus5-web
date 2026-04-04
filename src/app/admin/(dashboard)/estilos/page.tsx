'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Plus, Edit, Trash2, Save, Loader2, X,
    Scissors, Users, ChevronDown, Ruler
} from 'lucide-react'
import useToastMessage from '@/hooks/useToastMessage'
import { useAdminRole } from '@/hooks/useAdminRole'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

interface Patch {
    id: string
    name: string
    competition_id: string | null
    active: boolean
}

interface Size {
    id: string
    label: string
    sort_order: number | null
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

interface League {
    id: string
    name: string
}

const EMPTY_PATCH = { name: '', competition_id: '', active: true }
const EMPTY_SIZE = { label: '', sort_order: '', active: true }

const TABS = [
    { key: 'parches' as const, label: 'Parches' },
    { key: 'tallas' as const, label: 'Tallas' },
    { key: 'plantillas' as const, label: 'Plantillas' },
]

export default function EstilosPage() {
    const supabaseRef = useRef(createClient())
    const supabase = supabaseRef.current
    const toast = useToastMessage()
    const { isSuperAdmin } = useAdminRole()

    const [activeTab, setActiveTab] = useState<'parches' | 'tallas' | 'plantillas'>('parches')

    // ── Parches ──────────────────────────────────────────
    const [patches, setPatches] = useState<Patch[]>([])
    const [patchesLoading, setPatchesLoading] = useState(true)
    const [patchSaving, setPatchSaving] = useState(false)
    const [editingPatch, setEditingPatch] = useState<Patch | null>(null)
    const [patchForm, setPatchForm] = useState(EMPTY_PATCH)
    const [patchDeleteTarget, setPatchDeleteTarget] = useState<string | null>(null)
    const [leagues, setLeagues] = useState<League[]>([])

    // ── Tallas ────────────────────────────────────────────
    const [sizes, setSizes] = useState<Size[]>([])
    const [sizesLoading, setSizesLoading] = useState(true)
    const [sizeSaving, setSizeSaving] = useState(false)
    const [editingSize, setEditingSize] = useState<Size | null>(null)
    const [sizeForm, setSizeForm] = useState(EMPTY_SIZE)
    const [sizeDeleteTarget, setSizeDeleteTarget] = useState<string | null>(null)

    // ── Plantillas ────────────────────────────────────────
    const [teams, setTeams] = useState<Team[]>([])
    const [selectedTeamId, setSelectedTeamId] = useState('')
    const [players, setPlayers] = useState<Player[]>([])
    const [playersLoading, setPlayersLoading] = useState(false)
    const [newPlayer, setNewPlayer] = useState({ name: '', number: '' })
    const [addingPlayer, setAddingPlayer] = useState(false)
    const [playerDeleteTarget, setPlayerDeleteTarget] = useState<string | null>(null)
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
    const [editPlayerForm, setEditPlayerForm] = useState({ name: '', number: '' })
    const [savingPlayer, setSavingPlayer] = useState(false)
    const [showInactive, setShowInactive] = useState(false)

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

    const fetchLeagues = useCallback(async () => {
        const { data } = await supabase
            .from('leagues')
            .select('id, name')
            .order('name')
        setLeagues(data || [])
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const fetchSizes = useCallback(async () => {
        setSizesLoading(true)
        const { data, error } = await supabase
            .from('sizes')
            .select('*')
            .order('sort_order', { ascending: true, nullsFirst: false })
        if (error) toast.error('Error al cargar tallas')
        else setSizes(data || [])
        setSizesLoading(false)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const fetchTeams = useCallback(async () => {
        const { data } = await supabase
            .from('teams')
            .select('id, name')
            .order('name')
        setTeams(data || [])
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetchPatches()
        fetchLeagues()
        fetchSizes()
        fetchTeams()
    }, [fetchPatches, fetchLeagues, fetchSizes, fetchTeams])

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
        setPatchForm({ name: p.name, competition_id: p.competition_id || '', active: p.active })
    }

    const openNewPatch = () => {
        setEditingPatch(null)
        setPatchForm(EMPTY_PATCH)
    }

    const handleSavePatch = async () => {
        if (!patchForm.name.trim()) { toast.error('El nombre es obligatorio'); return }
        setPatchSaving(true)
        try {
            const payload = {
                name: patchForm.name.trim(),
                active: patchForm.active,
                competition_id: patchForm.competition_id || null,
            }
            if (editingPatch) {
                const { error } = await supabase
                    .from('patches')
                    .update(payload)
                    .eq('id', editingPatch.id)
                if (error) throw error
                toast.success('Parche actualizado')
            } else {
                const { error } = await supabase
                    .from('patches')
                    .insert(payload)
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
            // Primero quitar asociaciones con productos
            await supabase.from('product_patches').delete().eq('patch_id', id)
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

    // ── Sizes CRUD ────────────────────────────────────────
    const openEditSize = (s: Size) => {
        setEditingSize(s)
        setSizeForm({ label: s.label, sort_order: s.sort_order?.toString() ?? '', active: s.active })
    }

    const openNewSize = () => {
        setEditingSize(null)
        setSizeForm(EMPTY_SIZE)
    }

    const handleSaveSize = async () => {
        if (!sizeForm.label.trim()) { toast.error('La etiqueta es obligatoria'); return }
        setSizeSaving(true)
        try {
            const payload = {
                label: sizeForm.label.trim(),
                sort_order: sizeForm.sort_order !== '' ? parseInt(sizeForm.sort_order) : null,
                active: sizeForm.active,
            }
            if (editingSize) {
                const { error } = await supabase
                    .from('sizes')
                    .update(payload)
                    .eq('id', editingSize.id)
                if (error) throw error
                toast.success('Talla actualizada')
            } else {
                const { error } = await supabase
                    .from('sizes')
                    .insert(payload)
                if (error) throw error
                toast.success('Talla creada')
            }
            openNewSize()
            fetchSizes()
        } catch (err: unknown) {
            toast.error(`Error: ${(err as Error).message}`)
        } finally {
            setSizeSaving(false)
        }
    }

    const handleDeleteSize = async (id: string) => {
        try {
            const { error } = await supabase.from('sizes').delete().eq('id', id)
            if (error) throw error
            toast.success('Talla eliminada')
            fetchSizes()
        } catch (err: unknown) {
            toast.error(`Error: ${(err as Error).message}`)
        } finally {
            setSizeDeleteTarget(null)
        }
    }

    // ── Players CRUD ──────────────────────────────────────
    const handleAddPlayer = async () => {
        if (!newPlayer.name.trim() || !newPlayer.number || !selectedTeamId) return
        const num = parseInt(newPlayer.number)
        // Validar número duplicado
        if (players.filter(p => p.active).some(p => p.number === num)) {
            toast.error(`Ya existe un jugador con el dorsal ${num}`)
            return
        }
        setAddingPlayer(true)
        try {
            const { data, error } = await supabase
                .from('players')
                .insert({
                    name: newPlayer.name.trim(),
                    number: num,
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
            setPlayers(prev => prev.map(p => p.id === id ? { ...p, active: false } : p))
            toast.success('Jugador desactivado')
        } catch (err: unknown) {
            toast.error(`Error: ${(err as Error).message}`)
        } finally {
            setPlayerDeleteTarget(null)
        }
    }

    const handleRestorePlayer = async (id: string) => {
        try {
            const { error } = await supabase
                .from('players')
                .update({ active: true })
                .eq('id', id)
            if (error) throw error
            setPlayers(prev => prev.map(p => p.id === id ? { ...p, active: true } : p))
            toast.success('Jugador restaurado')
        } catch (err: unknown) {
            toast.error(`Error: ${(err as Error).message}`)
        }
    }

    const openEditPlayer = (p: Player) => {
        setEditingPlayer(p)
        setEditPlayerForm({ name: p.name, number: String(p.number) })
    }

    const handleSavePlayer = async () => {
        if (!editingPlayer || !editPlayerForm.name.trim() || !editPlayerForm.number) return
        const num = parseInt(editPlayerForm.number)
        if (players.filter(p => p.active && p.id !== editingPlayer.id).some(p => p.number === num)) {
            toast.error(`Ya existe un jugador con el dorsal ${num}`)
            return
        }
        setSavingPlayer(true)
        try {
            const { error } = await supabase
                .from('players')
                .update({ name: editPlayerForm.name.trim(), number: num })
                .eq('id', editingPlayer.id)
            if (error) throw error
            setPlayers(prev =>
                prev.map(p => p.id === editingPlayer.id ? { ...p, name: editPlayerForm.name.trim(), number: num } : p)
                    .sort((a, b) => a.number - b.number)
            )
            setEditingPlayer(null)
            toast.success('Jugador actualizado')
        } catch (err: unknown) {
            toast.error(`Error: ${(err as Error).message}`)
        } finally {
            setSavingPlayer(false)
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
                        <p className="text-gray-500 text-xs">Gestión de parches, tallas y plantillas de jugadores</p>
                    </div>
                </div>

                {/* TABS */}
                <div className="flex gap-1">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-5 py-2.5 rounded-t-xl text-sm font-bold transition-all border-b-2 ${
                                activeTab === tab.key
                                    ? 'text-white border-white'
                                    : 'text-gray-500 border-transparent hover:text-gray-300'
                            }`}
                        >
                            {tab.label}
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
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-white truncate">{p.name}</p>
                                        {p.competition_id && (
                                            <p className="text-[11px] text-gray-500 truncate">
                                                {leagues.find(l => l.id === p.competition_id)?.name ?? 'Liga desconocida'}
                                            </p>
                                        )}
                                    </div>
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

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">
                                    Liga / Competición
                                </label>
                                <div className="relative">
                                    <select
                                        value={patchForm.competition_id}
                                        onChange={e => setPatchForm(p => ({ ...p, competition_id: e.target.value }))}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500/50 outline-none appearance-none pr-10 font-medium"
                                    >
                                        <option value="">— Sin liga asignada —</option>
                                        {leagues.map(l => (
                                            <option key={l.id} value={l.id}>{l.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                </div>
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

            {/* ── TAB: TALLAS ──────────────────────────── */}
            {activeTab === 'tallas' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Lista */}
                    <div className="lg:col-span-7 space-y-3">
                        {sizesLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            </div>
                        ) : sizes.length === 0 ? (
                            <div className="text-center py-16 border-2 border-dashed border-white/5 rounded-3xl">
                                <Ruler className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                                <p className="text-gray-500 font-bold">No hay tallas creadas aún</p>
                                <p className="text-gray-600 text-sm mt-1">Crea la primera usando el formulario</p>
                            </div>
                        ) : (
                            sizes.map(s => (
                                <div
                                    key={s.id}
                                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                                        editingSize?.id === s.id
                                            ? 'border-violet-500/40 bg-violet-500/5'
                                            : 'border-white/5 bg-white/[0.02] hover:border-white/15'
                                    }`}
                                >
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${s.active ? 'bg-green-500 shadow-[0_0_6px_#22c55e]' : 'bg-gray-600'}`} />
                                    <div className="w-12 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                        <span className="font-black text-xs text-white leading-none text-center px-1">{s.label}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-white">{s.label}</p>
                                        {s.sort_order !== null && (
                                            <p className="text-[11px] text-gray-600">Orden: {s.sort_order}</p>
                                        )}
                                    </div>
                                    {!s.active && (
                                        <span className="text-[10px] uppercase font-bold text-gray-600 border border-gray-700 px-2 py-0.5 rounded-full shrink-0">
                                            Inactiva
                                        </span>
                                    )}
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => openEditSize(s)}
                                            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                                            title="Editar"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setSizeDeleteTarget(s.id)}
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

                    {/* Formulario talla */}
                    <div className="lg:col-span-5">
                        <div className="sticky top-28 bg-neutral-900/50 border border-white/5 rounded-3xl p-6 space-y-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-black text-white uppercase tracking-widest">
                                    {editingSize ? 'Editar Talla' : 'Nueva Talla'}
                                </h2>
                                {editingSize && (
                                    <button
                                        onClick={openNewSize}
                                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                        title="Cancelar edición"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">
                                    Etiqueta *
                                </label>
                                <input
                                    type="text"
                                    value={sizeForm.label}
                                    onChange={e => setSizeForm(s => ({ ...s, label: e.target.value }))}
                                    onKeyDown={e => e.key === 'Enter' && handleSaveSize()}
                                    placeholder="Ej. XS, 26, 4 años, 28 MX..."
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500/50 outline-none transition-all font-medium"
                                />
                                <p className="text-[10px] text-gray-600 mt-1.5 ml-1">Ropa (XS-XXL), tenis (24-30), niño (2-14 años), etc.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">
                                    Orden de visualización
                                </label>
                                <input
                                    type="number"
                                    value={sizeForm.sort_order}
                                    onChange={e => setSizeForm(s => ({ ...s, sort_order: e.target.value }))}
                                    placeholder="Ej. 1, 2, 3..."
                                    min={0}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500/50 outline-none font-medium"
                                />
                                <p className="text-[10px] text-gray-600 mt-1.5 ml-1">Número menor aparece primero. Deja vacío para orden automático.</p>
                            </div>

                            <label className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-xl cursor-pointer hover:bg-black/60 transition-colors">
                                <span className="text-sm font-medium text-white flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${sizeForm.active ? 'bg-green-500 shadow-[0_0_6px_#22c55e]' : 'bg-gray-600'}`} />
                                    Talla Activa
                                </span>
                                <input
                                    type="checkbox"
                                    checked={sizeForm.active}
                                    onChange={e => setSizeForm(s => ({ ...s, active: e.target.checked }))}
                                    className="w-4 h-4 accent-violet-500 rounded cursor-pointer"
                                />
                            </label>

                            <button
                                onClick={handleSaveSize}
                                disabled={sizeSaving}
                                className="w-full bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                            >
                                {sizeSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {sizeSaving ? 'Guardando...' : editingSize ? 'Actualizar Talla' : 'Crear Talla'}
                            </button>

                            <p className="text-[10px] text-gray-600 text-center leading-relaxed">
                                Las tallas activas aparecen en los productos que las tengan asignadas
                            </p>
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
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-500">
                                            {players.filter(p => p.active).length} activos
                                        </span>
                                        {players.some(p => !p.active) && (
                                            <button
                                                onClick={() => setShowInactive(v => !v)}
                                                className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all ${showInactive ? 'bg-white/10 text-white border-white/20' : 'text-gray-500 border-white/5 hover:border-white/15'}`}
                                            >
                                                {showInactive ? 'Ocultar inactivos' : `Ver inactivos (${players.filter(p => !p.active).length})`}
                                            </button>
                                        )}
                                    </div>
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
                                    <>
                                    {players.filter(p => p.active).map(player => (
                                        editingPlayer?.id === player.id ? (
                                            <div key={player.id} className="flex items-center gap-2 p-3 rounded-xl border border-violet-500/40 bg-violet-500/5">
                                                <input
                                                    type="number" min={0} max={99}
                                                    value={editPlayerForm.number}
                                                    onChange={e => setEditPlayerForm(f => ({ ...f, number: e.target.value }))}
                                                    className="w-16 bg-black/50 border border-white/10 rounded-lg p-2 text-white text-center font-mono text-sm outline-none focus:border-violet-500/50"
                                                />
                                                <input
                                                    type="text"
                                                    value={editPlayerForm.name}
                                                    onChange={e => setEditPlayerForm(f => ({ ...f, name: e.target.value }))}
                                                    onKeyDown={e => e.key === 'Enter' && handleSavePlayer()}
                                                    className="flex-1 bg-black/50 border border-white/10 rounded-lg p-2 text-white font-medium text-sm outline-none focus:border-violet-500/50"
                                                />
                                                <button onClick={handleSavePlayer} disabled={savingPlayer} className="p-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-all">
                                                    {savingPlayer ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                                </button>
                                                <button onClick={() => setEditingPlayer(null)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
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
                                                    onClick={() => openEditPlayer(player)}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                                                    title="Editar jugador"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setPlayerDeleteTarget(player.id)}
                                                    disabled={!isSuperAdmin}
                                                    title={!isSuperAdmin ? 'Solo super admin puede desactivar' : 'Desactivar jugador'}
                                                    className="p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )
                                    ))}
                                    {showInactive && players.filter(p => !p.active).map(player => (
                                        <div key={player.id} className="flex items-center gap-4 p-3.5 rounded-xl border border-white/5 bg-white/[0.01] opacity-50 hover:opacity-80 transition-all">
                                            <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                                <span className="font-black text-sm text-gray-500">{player.number}</span>
                                            </div>
                                            <span className="flex-1 font-bold text-gray-500 line-through">{player.name}</span>
                                            <span className="text-[10px] text-gray-600 border border-gray-700 px-2 py-0.5 rounded-full">Inactivo</span>
                                            <button
                                                onClick={() => handleRestorePlayer(player.id)}
                                                title="Restaurar jugador"
                                                className="p-2 rounded-lg text-gray-500 hover:text-green-500 hover:bg-green-500/10 transition-all"
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
                message="¿Eliminar este parche? Se quitará de todos los productos que lo tengan asignado."
                confirmLabel="Eliminar"
                onConfirm={() => { if (patchDeleteTarget) handleDeletePatch(patchDeleteTarget) }}
                onCancel={() => setPatchDeleteTarget(null)}
            />

            <ConfirmDialog
                open={sizeDeleteTarget !== null}
                title="Eliminar talla"
                message="¿Eliminar esta talla? Los productos que la tengan asignada la perderán."
                confirmLabel="Eliminar"
                onConfirm={() => { if (sizeDeleteTarget) handleDeleteSize(sizeDeleteTarget) }}
                onCancel={() => setSizeDeleteTarget(null)}
            />

            <ConfirmDialog
                open={playerDeleteTarget !== null}
                title="Desactivar jugador"
                message="¿Desactivar este jugador? Puedes restaurarlo desde la lista de inactivos."
                confirmLabel="Desactivar"
                onConfirm={() => { if (playerDeleteTarget) handleDeletePlayer(playerDeleteTarget) }}
                onCancel={() => setPlayerDeleteTarget(null)}
            />
        </div>
    )
}
