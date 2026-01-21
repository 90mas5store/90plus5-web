'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit, Trash2, Search, X, Save, Loader2, Shield } from 'lucide-react'
import Image from 'next/image'
import useToastMessage from '@/hooks/useToastMessage'
import ImageUpload from '@/components/admin/ImageUpload'
import { motion, AnimatePresence } from 'framer-motion'

interface Team {
    id: string
    name: string
    slug: string
    logo_url: string
    country: string
    league_id?: string
    is_national_team: boolean
    active: boolean
    // Join
    leagues?: { name: string }
}

interface League {
    id: string
    name: string
}

export default function TeamsPage() {
    const supabase = createClient()
    const toast = useToastMessage()

    const [teams, setTeams] = useState<Team[]>([])
    const [leagues, setLeagues] = useState<League[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTeam, setEditingTeam] = useState<Team | null>(null)
    const [saving, setSaving] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        logo_url: '',
        country: '',
        league_id: '',
        is_national_team: false,
        active: true
    })

    useEffect(() => {
        fetchTeams()
        fetchLeagues()
    }, [])

    useEffect(() => {
        if (editingTeam) {
            setFormData({
                name: editingTeam.name,
                slug: editingTeam.slug || '',
                logo_url: editingTeam.logo_url || '',
                country: editingTeam.country || '',
                league_id: editingTeam.league_id || '',
                is_national_team: editingTeam.is_national_team,
                active: editingTeam.active
            })
        } else {
            setFormData({
                name: '',
                slug: '',
                logo_url: '',
                country: '',
                league_id: '',
                is_national_team: false,
                active: true
            })
        }
    }, [editingTeam, isModalOpen])

    const fetchTeams = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('teams')
                .select(`
                    *,
                    leagues (name)
                `)
                .order('name', { ascending: true })

            if (error) throw error
            setTeams(data || [])
        } catch (error: any) {
            console.error('Error fetching teams:', error)
            toast.error('Error al cargar equipos')
        } finally {
            setLoading(false)
        }
    }

    const fetchLeagues = async () => {
        const { data } = await supabase.from('leagues').select('id, name').order('name')
        if (data) setLeagues(data)
    }

    const handleSave = async () => {
        if (!formData.name) {
            toast.error('El nombre del equipo es obligatorio')
            return
        }

        setSaving(true)
        try {
            const payload = {
                name: formData.name,
                slug: formData.slug,
                logo_url: formData.logo_url,
                country: formData.country,
                league_id: formData.league_id || null,
                is_national_team: formData.is_national_team,
                active: formData.active
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

        } catch (error: any) {
            console.error('Error saving team:', error)
            toast.error(`Error: ${error.message}`)
        } finally {
            setSaving(false)
        }
    }



    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar este equipo?')) return

        try {
            const { error } = await supabase
                .from('teams')
                .delete()
                .eq('id', id)

            if (error) throw error
            toast.success('Equipo eliminado')
            setTeams(prev => prev.filter(c => c.id !== id))
        } catch (error: any) {
            console.error('Error deleting team:', error)
            toast.error('Error al eliminar')
        }
    }

    const filteredTeams = teams.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Shield className="w-8 h-8 text-primary" />
                        Equipos
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Gestiona los equipos de fútbol (ej: Real Madrid, Barcelona).
                    </p>
                </div>

                <button
                    onClick={() => {
                        setEditingTeam(null)
                        setIsModalOpen(true)
                    }}
                    className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-200 transition-all shadow-lg shadow-white/5"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Equipo
                </button>
            </div>

            {/* Content */}
            <div className="bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden p-6 md:p-8">

                {/* Tools */}
                <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between">
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
                                                    onClick={() => {
                                                        setEditingTeam(team)
                                                        setIsModalOpen(true)
                                                    }}
                                                    className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(team.id)}
                                                    className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
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
                            className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
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
                            <div className="p-8 space-y-8 overflow-y-auto">

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
        </div>
    )
}
