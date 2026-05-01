'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit, Trash2, Search, X, Save, Loader2, Trophy, Tag, ChevronLeft, ChevronRight, Monitor, Smartphone } from 'lucide-react'
import Image from 'next/image'
import useToastMessage from '@/hooks/useToastMessage'
import { useAdminRole } from '@/hooks/useAdminRole'
import { clearProductCache } from '@/lib/api'
import { revalidateConfig } from '@/app/admin/actions'
import ImageUpload from '@/components/admin/ImageUpload'
import { motion, AnimatePresence } from '@/lib/motion'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import FocalPointPicker from '@/components/admin/FocalPointPicker'

const PAGE_SIZE = 20

interface League {
    id: string
    name: string
    slug: string
    image_url: string
    category_id?: string
    active: boolean
    sort_order: number
    season: string
    hero_image_position_desktop?: string
    hero_image_position_mobile?: string
    // Joined data
    categories?: { name: string }
}

interface Category {
    id: string
    name: string
}

export default function LeaguesPage() {
    const supabaseRef = useRef(createClient())
    const supabase = supabaseRef.current
    const toast = useToastMessage()
    const { isSuperAdmin } = useAdminRole()

    const [leagues, setLeagues] = useState<League[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingLeague, setEditingLeague] = useState<League | null>(null)
    const [saving, setSaving] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        image_url: '',
        category_id: '',
        active: true,
        sort_order: 0,
        season: '',
        hero_image_position_desktop: '50% 40%',
        hero_image_position_mobile: '50% 50%'
    })

    const fetchLeagues = useCallback(async (p = page) => {
        setLoading(true)
        const from = (p - 1) * PAGE_SIZE
        const to = from + PAGE_SIZE - 1
        try {
            const { data, error, count } = await supabase
                .from('leagues')
                .select(`*, categories (name)`, { count: 'exact' })
                .is('deleted_at', null)
                .order('sort_order', { ascending: true })
                .range(from, to)

            if (error) throw error
            setLeagues(data || [])
            setTotalCount(count ?? 0)
        } catch (error: unknown) {
            console.error('Error fetching leagues:', error)
            toast.error('Error al cargar ligas')
        } finally {
            setLoading(false)
        }
    }, [page])

    const fetchCategories = useCallback(async () => {
        const { data } = await supabase.from('categories').select('id, name').order('name')
        if (data) setCategories(data)
    }, [])

    useEffect(() => {
        fetchLeagues()
        fetchCategories()
    }, [fetchLeagues, fetchCategories])

    useEffect(() => {
        if (editingLeague) {
            setFormData({
                name: editingLeague.name,
                slug: editingLeague.slug,
                image_url: editingLeague.image_url || '',
                category_id: editingLeague.category_id || '',
                active: editingLeague.active,
                sort_order: editingLeague.sort_order || 0,
                season: editingLeague.season || '',
                hero_image_position_desktop: editingLeague.hero_image_position_desktop || '50% 40%',
                hero_image_position_mobile: editingLeague.hero_image_position_mobile || '50% 50%'
            })
        } else {
            setFormData({
                name: '',
                slug: '',
                image_url: '',
                category_id: '',
                active: true,
                sort_order: leagues.length + 1,
                season: '',
                hero_image_position_desktop: '50% 40%',
                hero_image_position_mobile: '50% 50%'
            })
        }
    }, [editingLeague, isModalOpen, leagues.length])

    const handleSave = async () => {
        if (!formData.name || !formData.slug) {
            toast.error('Nombre y Slug son requeridos')
            return
        }

        setSaving(true)
        try {
            const payload = {
                name: formData.name,
                slug: formData.slug,
                image_url: formData.image_url,
                category_id: formData.category_id || null,
                active: formData.active,
                sort_order: formData.sort_order,
                season: formData.season,
                hero_image_position_desktop: formData.hero_image_position_desktop,
                hero_image_position_mobile: formData.hero_image_position_mobile
            }

            if (editingLeague) {
                // Update
                const { error } = await supabase
                    .from('leagues')
                    .update(payload)
                    .eq('id', editingLeague.id)
                if (error) throw error
                toast.success('Liga actualizada')
            } else {
                // Create
                const { error } = await supabase
                    .from('leagues')
                    .insert(payload)
                if (error) throw error
                toast.success('Liga creada')
            }

            setIsModalOpen(false)
            setEditingLeague(null)
            fetchLeagues()
            clearProductCache('config')
            await revalidateConfig()

        } catch (error: unknown) {
            console.error('Error saving league:', error)
            toast.error(`Error: ${(error as Error).message}`)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = (id: string) => setDeleteTarget(id)

    const executeDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from('leagues')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id)

            if (error) throw error
            toast.success('Liga movida a la papelera')
            setLeagues(prev => prev.filter(c => c.id !== id))
            clearProductCache('config')
            await revalidateConfig()
        } catch (error: unknown) {
            console.error('Error deleting league:', error)
            toast.error('Error al eliminar')
        }
    }

    // Auto-generate slug
    const handleNameChange = (val: string) => {
        setFormData(prev => ({
            ...prev,
            name: val,
            slug: !editingLeague ? val.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') : prev.slug
        }))
    }

    const filteredLeagues = leagues.filter(l =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.slug.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-4 md:space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-3 md:gap-6 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2 md:gap-3">
                        <Trophy className="w-5 h-5 md:w-8 md:h-8 text-primary" />
                        Ligas
                    </h1>
                    <p className="text-gray-400 mt-1 md:mt-2 text-sm">
                        Gestiona las ligas y competiciones (ej: La Liga, Premier League).
                    </p>
                </div>

                <button
                    onClick={() => {
                        setEditingLeague(null)
                        setIsModalOpen(true)
                    }}
                    className="bg-white text-black px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all shadow-lg shadow-white/5 w-full md:w-auto text-sm md:text-base"
                >
                    <Plus className="w-4 h-4 md:w-5 md:h-5" />
                    Nueva Liga
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
                            placeholder="Buscar liga..."
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
                                    <th className="py-4 font-bold w-20 text-center whitespace-nowrap">Orden</th>
                                    <th className="py-4 font-bold w-24 text-center whitespace-nowrap">Logo</th>
                                    <th className="py-4 font-bold min-w-[200px]">Nombre</th>
                                    <th className="py-4 font-bold min-w-[150px]">Slug</th>
                                    <th className="py-4 font-bold min-w-[150px]">Categoría</th>
                                    <th className="py-4 font-bold text-center whitespace-nowrap">Estado</th>
                                    <th className="py-4 font-bold text-right whitespace-nowrap">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredLeagues.map((league) => (
                                    <tr key={league.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="py-4 text-center font-mono text-gray-500 whitespace-nowrap">
                                            {league.sort_order}
                                        </td>
                                        <td className="py-4 text-center">
                                            {league.image_url ? (
                                                <div className="w-12 h-12 relative mx-auto rounded bg-white/5 border border-white/10 overflow-hidden">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={league.image_url}
                                                        alt={league.name}
                                                        className="w-full h-full object-contain p-1"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 mx-auto rounded bg-white/5 flex items-center justify-center text-gray-600 border border-white/10">
                                                    <Trophy className="w-5 h-5" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 font-bold text-white text-lg">
                                            {league.name}
                                            {league.season && (
                                                <span className="ml-2 text-xs font-normal text-gray-500 border border-white/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                    {league.season}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 text-gray-400 font-mono text-sm max-w-[150px] truncate">
                                            {league.slug}
                                        </td>
                                        <td className="py-4">
                                            {league.categories ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-300 whitespace-nowrap">
                                                    <Tag className="w-3 h-3" /> {league.categories.name}
                                                </span>
                                            ) : (
                                                <span className="text-gray-600 text-xs italic">Sin categoría</span>
                                            )}
                                        </td>
                                        <td className="py-4 text-center whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${league.active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                                }`}>
                                                {league.active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingLeague(league)
                                                        setIsModalOpen(true)
                                                    }}
                                                    className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(league.id)}
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

                        {filteredLeagues.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                No se encontraron ligas.
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
                                    {editingLeague ? 'Editar Liga' : 'Nueva Liga'}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-4 sm:p-8 space-y-4 sm:space-y-8 overflow-y-auto">

                                {/* Image Upload */}
                                <div className="flex flex-col items-center">
                                    <label className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-wider">Logo de la Liga</label>
                                    <div className="w-32">
                                        <ImageUpload
                                            value={formData.image_url}
                                            onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-xs font-bold uppercase text-gray-400 mb-2 block tracking-wider">Orden</label>
                                            <input
                                                type="number"
                                                value={formData.sort_order}
                                                onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                                            />
                                        </div>
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
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold uppercase text-gray-400 mb-2 block tracking-wider">Nombre</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => handleNameChange(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                                            placeholder="Ej: La Liga"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold uppercase text-gray-400 mb-2 block tracking-wider">Temporada/Año (Opcional)</label>
                                        <input
                                            type="text"
                                            value={formData.season}
                                            onChange={(e) => setFormData(prev => ({ ...prev, season: e.target.value }))}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                                            placeholder="Ej: 2024-2025"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold uppercase text-gray-400 mb-2 block tracking-wider">Slug (URL)</label>
                                        <input
                                            type="text"
                                            value={formData.slug}
                                            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none font-mono text-sm"
                                            placeholder="ej: la-liga"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold uppercase text-gray-400 mb-2 block tracking-wider">Categoría Asociada</label>
                                        <select
                                            value={formData.category_id}
                                            onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none appearance-none"
                                        >
                                            <option value="">-- Seleccionar Categoría --</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Punto focal del hero */}
                                <div className="rounded-2xl border border-white/10 overflow-hidden">
                                    <div className="px-4 py-3 bg-white/[0.03] flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Punto Focal — Hero Banner</span>
                                    </div>
                                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Monitor size={13} className="text-gray-500" />
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Desktop</span>
                                            </div>
                                            <FocalPointPicker
                                                label="Desktop"
                                                imageUrl={formData.slug ? `/heroes/${formData.slug}.jpg` : undefined}
                                                value={formData.hero_image_position_desktop}
                                                onChange={v => setFormData(prev => ({ ...prev, hero_image_position_desktop: v }))}
                                                aspectRatio="16/5"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Smartphone size={13} className="text-gray-500" />
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mobile</span>
                                            </div>
                                            <FocalPointPicker
                                                label="Mobile"
                                                imageUrl={formData.slug ? `/heroes/${formData.slug}.jpg` : undefined}
                                                value={formData.hero_image_position_mobile}
                                                onChange={v => setFormData(prev => ({ ...prev, hero_image_position_mobile: v }))}
                                                aspectRatio="4/3"
                                            />
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

            <ConfirmDialog
                open={deleteTarget !== null}
                title="Eliminar liga"
                message="¿Seguro que deseas eliminar esta liga? Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
                onConfirm={() => { if (deleteTarget) executeDelete(deleteTarget); setDeleteTarget(null); }}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    )
}
