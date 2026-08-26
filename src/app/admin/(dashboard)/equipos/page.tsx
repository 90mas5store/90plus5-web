'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit, Trash2, Search, X, Save, Loader2, Shield, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import useToastMessage from '@/hooks/useToastMessage'
import { useAdminRole } from '@/hooks/useAdminRole'
import ImageUpload from '@/components/admin/ImageUpload'
import { motion, AnimatePresence } from '@/lib/motion'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

const PAGE_SIZE = 20

interface Team {
    id: string
    name: string
    slug: string
    logo_url: string
    country: string
    league_id?: string
    is_national_team: boolean
    active: boolean
    football_data_id?: number | null
    is_matchday_active?: boolean
    // Join
    leagues?: { name: string }
}

const POPULAR_FOOTBALL_DATA_CLUBS = [
    { name: 'Real Madrid (ID: 86)', id: 86 },
    { name: 'FC Barcelona (ID: 81)', id: 81 },
    { name: 'Atlético de Madrid (ID: 78)', id: 78 },
    { name: 'Manchester City (ID: 65)', id: 65 },
    { name: 'Arsenal FC (ID: 57)', id: 57 },
    { name: 'Liverpool FC (ID: 64)', id: 64 },
    { name: 'Manchester United (ID: 66)', id: 66 },
    { name: 'Chelsea FC (ID: 61)', id: 61 },
    { name: 'Bayern München (ID: 5)', id: 5 },
    { name: 'Borussia Dortmund (ID: 4)', id: 4 },
    { name: 'Paris Saint-Germain (ID: 524)', id: 524 },
    { name: 'Juventus (ID: 109)', id: 109 },
    { name: 'Inter Milan (ID: 108)', id: 108 },
    { name: 'AC Milan (ID: 98)', id: 98 },
]

interface League {
    id: string
    name: string
}

export default function TeamsPage() {
    const supabaseRef = useRef(createClient())
    const supabase = supabaseRef.current
    const toast = useToastMessage()
    const { isSuperAdmin } = useAdminRole()

    const [teams, setTeams] = useState<Team[]>([])
    const [leagues, setLeagues] = useState<League[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTeam, setEditingTeam] = useState<Team | null>(null)
    const [saving, setSaving] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        logo_url: '',
        country: '',
        league_id: '',
        is_national_team: false,
        active: true,
        football_data_id: '' as string | number,
        is_matchday_active: false,
    })

    const fetchTeams = useCallback(async (p = page) => {
        setLoading(true)
        const from = (p - 1) * PAGE_SIZE
        const to = from + PAGE_SIZE - 1
        try {
            const { data, error, count } = await supabase
                .from('teams')
                .select(`*, leagues (name)`, { count: 'exact' })
                .is('deleted_at', null)
                .order('name', { ascending: true })
                .range(from, to)

            if (error) throw error
            setTeams(data || [])
            setTotalCount(count ?? 0)
        } catch (error: unknown) {
            console.error('Error fetching teams:', error)
            toast.error('Error al cargar equipos')
        } finally {
            setLoading(false)
        }
    }, [page])

    const handleToggleMatchday = async (team: Team) => {
        const nextState = !team.is_matchday_active;
        try {
            const { error } = await supabase
                .from('teams')
                .update({ is_matchday_active: nextState })
                .eq('id', team.id);
            if (error) {
                if (error.message?.includes('is_matchday_active') || error.code === 'PGRST204') {
                    toast.error('Falta la columna "is_matchday_active" en Supabase. Ejecuta la consulta SQL provista.');
                    return;
                }
                throw error;
            }
            toast.success(nextState ? `🔴 Matchday activado para ${team.name}` : `Matchday desactivado para ${team.name}`);
            setTeams(prev => prev.map(t => t.id === team.id ? { ...t, is_matchday_active: nextState } : t));
        } catch (e: any) {
            toast.error(`Error: ${e.message}`);
        }
    };

    const fetchLeagues = useCallback(async () => {
        const { data } = await supabase.from('leagues').select('id, name').order('name')
        if (data) setLeagues(data)
    }, [])

    useEffect(() => {
        fetchTeams()
        fetchLeagues()
    }, [fetchTeams, fetchLeagues])

    useEffect(() => {
        if (editingTeam) {
            setFormData({
                name: editingTeam.name,
                slug: editingTeam.slug || '',
                logo_url: editingTeam.logo_url || '',
                country: editingTeam.country || '',
                league_id: editingTeam.league_id || '',
                is_national_team: editingTeam.is_national_team,
                active: editingTeam.active,
                football_data_id: editingTeam.football_data_id ?? '',
                is_matchday_active: !!editingTeam.is_matchday_active,
            })
        } else {
            setFormData({
                name: '',
                slug: '',
                logo_url: '',
                country: '',
                league_id: '',
                is_national_team: false,
                active: true,
                football_data_id: '',
                is_matchday_active: false,
            })
        }
    }, [editingTeam, isModalOpen])

    const handleSave = async () => {
        if (!formData.name) {
            toast.error('El nombre del equipo es obligatorio')
            return
        }

        setSaving(true)
        try {
            const fdId = formData.football_data_id === '' ? null : Number(formData.football_data_id)
            const payload = {
                name: formData.name,
                slug: formData.slug,
                logo_url: formData.logo_url,
                country: formData.country,
                league_id: formData.league_id || null,
                is_national_team: formData.is_national_team,
                active: formData.active,
                football_data_id: fdId && !isNaN(fdId) ? fdId : null,
                is_matchday_active: formData.is_matchday_active,
            }

            if (editingTeam) {
                // Update
                const { error } = await supabase
                    .from('teams')
                    .update(payload)
                    .eq('id', editingTeam.id)
                if (error) throw error
                toast.success('Equipo actualizado')
            } else {
                // Create
                const { error } = await supabase
                    .from('teams')
                    .insert(payload)
                if (error) throw error
                toast.success('Equipo creado')
            }

            setIsModalOpen(false)
            setEditingTeam(null)
            fetchTeams()

        } catch (error: unknown) {
            console.error('Error saving team:', error)
            toast.error(`Error: ${(error as Error).message}`)
        } finally {
            setSaving(false)
        }
    }



    const handleDelete = (id: string) => setDeleteTarget(id)

    const executeDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from('teams')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id)

            if (error) throw error
            toast.success('Equipo movido a la papelera')
            setTeams(prev => prev.filter(c => c.id !== id))
        } catch (error: unknown) {
            console.error('Error deleting team:', error)
            toast.error('Error al eliminar')
        }
    }

    const filteredTeams = teams.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-4 md:space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-3 md:gap-6 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2 md:gap-3">
                        <Shield className="w-5 h-5 md:w-8 md:h-8 text-primary" />
                        Equipos
                    </h1>
                    <p className="text-gray-400 mt-1 md:mt-2 text-sm">
                        Gestiona los equipos de fútbol (ej: Real Madrid, Barcelona).
                    </p>
                </div>

                <button
                    onClick={() => {
                        setEditingTeam(null)
                        setIsModalOpen(true)
                    }}
                    className="bg-white text-black px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all shadow-lg shadow-white/5 w-full md:w-auto text-sm md:text-base"
                >
                    <Plus className="w-4 h-4 md:w-5 md:h-5" />
                    Nuevo Equipo
                </button>
            </div>

            {/* Content */}
            <div className="bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden p-6 md:p-8">

                {/* Tools */}
                <div className="mb-4 md:mb-8 flex flex-col md:flex-row gap-3 md:gap-4 justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Buscar equipo..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                                    <th className="py-4 font-bold w-24 text-center whitespace-nowrap">Escudo</th>
                                    <th className="py-4 font-bold min-w-[200px]">Nombre</th>
                                    <th className="py-4 font-bold min-w-[150px]">País</th>
                                    <th className="py-4 font-bold min-w-[150px]">Liga</th>
                                    <th className="py-4 font-bold text-center whitespace-nowrap">Estado</th>
                                    <th className="py-4 font-bold text-right whitespace-nowrap">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredTeams.map((team) => (
                                    <tr key={team.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="py-4 text-center">
                                            {team.logo_url ? (
                                                <div className="w-12 h-12 relative mx-auto rounded bg-white/5 border border-white/10 overflow-hidden">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={team.logo_url}
                                                        alt={team.name}
                                                        className="w-full h-full object-contain p-1"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 mx-auto rounded bg-white/5 flex items-center justify-center text-gray-600 border border-white/10">
                                                    <Shield className="w-5 h-5" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 font-bold text-white text-lg">
                                            {team.name}
                                            {team.is_national_team && (
                                                <span className="ml-2 text-xs font-normal text-blue-400 border border-blue-400/20 bg-blue-400/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                    Selección
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 text-gray-400">
                                            {team.country}
                                        </td>
                                        <td className="py-4 text-gray-400">
                                            {team.leagues?.name || <span className="text-gray-600 italic">Sin liga</span>}
                                        </td>
                                        <td className="py-4 text-center whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${team.active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                                }`}>
                                                {team.active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleToggleMatchday(team)}
                                                    title={team.is_matchday_active ? "Partido en Vivo activo (Clic para desactivar)" : "Activar Partido en Vivo (Matchday)"}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                                        team.is_matchday_active
                                                            ? 'bg-[#E50914] text-white shadow-[0_0_12px_rgba(229,9,20,0.5)] animate-pulse'
                                                            : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                                                    }`}
                                                >
                                                    <span className="w-2 h-2 rounded-full bg-current" />
                                                    <span>{team.is_matchday_active ? '🔴 Matchday' : 'Matchday'}</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingTeam(team)
                                                        setIsModalOpen(true)
                                                    }}
                                                    className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(team.id)}
                                                    disabled={!isSuperAdmin}
                                                    title={!isSuperAdmin ? 'Solo los super admins pueden eliminar' : undefined}
                                                    className="w-11 h-11 flex items-center justify-center hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredTeams.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                No se encontraron equipos.
                            </div>
                        )}
                    </div>
                )}

                {/* Pagination */}
                {totalCount > PAGE_SIZE && (
                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
                        <p className="text-sm text-gray-400">
                            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} de {totalCount}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => p - 1)}
                                disabled={page === 1}
                                className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-gray-300 font-bold">{page} / {Math.ceil(totalCount / PAGE_SIZE)}</span>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={page >= Math.ceil(totalCount / PAGE_SIZE)}
                                className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90dvh]"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                                <h2 className="text-xl font-bold text-white">
                                    {editingTeam ? 'Editar Equipo' : 'Nuevo Equipo'}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-4 sm:p-8 space-y-4 sm:space-y-8 overflow-y-auto">

                                {/* Image Upload */}
                                <div className="flex flex-col items-center">
                                    <label className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-wider">Escudo del Equipo</label>
                                    <div className="w-32">
                                        <ImageUpload
                                            value={formData.logo_url}
                                            onChange={(url) => setFormData(prev => ({ ...prev, logo_url: url }))}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-xs font-bold uppercase text-gray-400 mb-2 block tracking-wider">Estado</label>
                                            <select
                                                value={formData.active ? 'true' : 'false'}
                                                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.value === 'true' }))}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                                            >
                                                <option value="true">Activo</option>
                                                <option value="false">Inactivo</option>
                                            </select>
                                        </div>
                                        <div className="flex items-end pb-3">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.is_national_team}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, is_national_team: e.target.checked }))}
                                                    className="w-5 h-5 rounded border border-white/10 bg-black/50 text-primary focus:ring-primary"
                                                />
                                                <span className="text-sm font-bold text-gray-400 select-none">¿Selección Nacional?</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold uppercase text-gray-400 mb-2 block tracking-wider">Nombre</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                                            placeholder="Ej: REAL MADRID"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold uppercase text-gray-400 mb-2 block tracking-wider">Slug (URL)</label>
                                        <input
                                            type="text"
                                            value={formData.slug}
                                            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none font-mono text-sm"
                                            placeholder="ej: real-madrid"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-xs font-bold uppercase text-gray-400 mb-2 block tracking-wider">País</label>
                                            <input
                                                type="text"
                                                value={formData.country}
                                                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                                                placeholder="Ej: España"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold uppercase text-gray-400 mb-2 block tracking-wider">Liga</label>
                                            <select
                                                value={formData.league_id}
                                                onChange={(e) => setFormData(prev => ({ ...prev, league_id: e.target.value }))}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                                            >
                                                <option value="">-- Seleccionar --</option>
                                                {leagues.map(l => (
                                                    <option key={l.id} value={l.id}>{l.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Matchday Manual Toggle */}
                                    <div className="p-4 rounded-xl bg-[#E50914]/10 border border-[#E50914]/30">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_matchday_active}
                                                onChange={(e) => setFormData(prev => ({ ...prev, is_matchday_active: e.target.checked }))}
                                                className="w-5 h-5 rounded border border-[#E50914] text-[#E50914] focus:ring-[#E50914]"
                                            />
                                            <div>
                                                <span className="text-sm font-bold text-white select-none block">🔴 Activar Partido en Vivo (Matchday Manual)</span>
                                                <span className="text-[11px] text-gray-400 font-normal">Destaca las camisetas del equipo con aviso de partido en curso y promoción especial.</span>
                                            </div>
                                        </label>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold uppercase text-gray-400 mb-1 block tracking-wider">
                                            ID football-data.org
                                            <span className="normal-case text-gray-400 font-normal ml-1">(para marcador EN VIVO automático)</span>
                                        </label>

                                        {/* Dropdown de sugerencias de clubes internacionales populares */}
                                        <select
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    setFormData(prev => ({ ...prev, football_data_id: e.target.value }));
                                                }
                                            }}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-gray-300 focus:border-primary outline-none mb-2"
                                        >
                                            <option value="">-- Seleccionar club europeo popular (opcional) --</option>
                                            {POPULAR_FOOTBALL_DATA_CLUBS.map(club => (
                                                <option key={club.id} value={club.id}>{club.name}</option>
                                            ))}
                                        </select>

                                        <input
                                            type="number"
                                            value={formData.football_data_id}
                                            onChange={(e) => setFormData(prev => ({ ...prev, football_data_id: e.target.value }))}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none font-mono text-sm"
                                            placeholder="Ej: 86 (Real Madrid)"
                                        />
                                        <p className="text-[11px] text-gray-500 mt-1">
                                            Ingresa el ID numérico oficial o selecciona una sugerencia arriba · Dejar vacío si es equipo local/nacional.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-white/10 bg-black/20 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-gray-400 font-bold hover:bg-white/5 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-primary hover:bg-primary/90 text-black px-6 py-2 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Guardar
                                </button>
                            </div>

                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmDialog
                open={deleteTarget !== null}
                title="Eliminar equipo"
                message="¿Seguro que deseas eliminar este equipo? Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
                onConfirm={() => { if (deleteTarget) executeDelete(deleteTarget); setDeleteTarget(null); }}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    )
}
