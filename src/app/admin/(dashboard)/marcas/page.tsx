'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit, Trash2, Search, X, Save, Loader2, Tag, ChevronLeft, ChevronRight } from 'lucide-react'
import useToastMessage from '@/hooks/useToastMessage'
import ImageUpload from '@/components/admin/ImageUpload'
import { motion, AnimatePresence } from '@/lib/motion'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

const PAGE_SIZE = 20

interface Brand {
    id: string
    name: string
    slug: string
    logo_url: string | null
    active: boolean
    sort_order: number
}

export default function BrandsPage() {
    const supabaseRef = useRef(createClient())
    const supabase = supabaseRef.current
    const toast = useToastMessage()

    const [brands, setBrands] = useState<Brand[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
    const [saving, setSaving] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        logo_url: '',
        active: true,
        sort_order: 0,
    })

    const fetchBrands = useCallback(async (p = page) => {
        setLoading(true)
        const from = (p - 1) * PAGE_SIZE
        const to = from + PAGE_SIZE - 1
        try {
            const { data, error, count } = await supabase
                .from('brands')
                .select('*', { count: 'exact' })
                .is('deleted_at', null)
                .order('sort_order', { ascending: true })
                .order('name', { ascending: true })
                .range(from, to)

            if (error) throw error
            setBrands(data || [])
            setTotalCount(count ?? 0)
        } catch (error: unknown) {
            console.error('Error fetching brands:', error)
            toast.error('Error al cargar marcas')
        } finally {
            setLoading(false)
        }
    }, [page])

    useEffect(() => {
        fetchBrands()
    }, [fetchBrands])

    useEffect(() => {
        if (editingBrand) {
            setFormData({
                name: editingBrand.name,
                slug: editingBrand.slug || '',
                logo_url: editingBrand.logo_url || '',
                active: editingBrand.active,
                sort_order: editingBrand.sort_order ?? 0,
            })
        } else {
            setFormData({ name: '', slug: '', logo_url: '', active: true, sort_order: 0 })
        }
    }, [editingBrand, isModalOpen])

    const generateSlug = (name: string) =>
        name.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const handleSave = async () => {
        if (!formData.name) {
            toast.error('El nombre de la marca es obligatorio')
            return
        }

        const slug = formData.slug || generateSlug(formData.name)

        setSaving(true)
        try {
            const payload = {
                name: formData.name.trim(),
                slug,
                logo_url: formData.logo_url || null,
                active: formData.active,
                sort_order: formData.sort_order,
            }

            if (editingBrand) {
                const { error } = await supabase
                    .from('brands')
                    .update(payload)
                    .eq('id', editingBrand.id)
                if (error) throw error
                toast.success('Marca actualizada')
            } else {
                const { error } = await supabase
                    .from('brands')
                    .insert(payload)
                if (error) throw error
                toast.success('Marca creada')
            }

            setIsModalOpen(false)
            setEditingBrand(null)
            fetchBrands()
        } catch (error: unknown) {
            console.error('Error saving brand:', error)
            toast.error(`Error: ${(error as Error).message}`)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = (id: string) => setDeleteTarget(id)

    const executeDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from('brands')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id)

            if (error) throw error
            toast.success('Marca movida a la papelera')
            setBrands(prev => prev.filter(b => b.id !== id))
        } catch (error: unknown) {
            console.error('Error deleting brand:', error)
            toast.error('Error al eliminar')
        }
    }

    const filteredBrands = brands.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase())
    )

    const totalPages = Math.ceil(totalCount / PAGE_SIZE)

    return (
        <div className="space-y-4 md:space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-3 md:gap-6 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2 md:gap-3">
                        <Tag className="w-5 h-5 md:w-8 md:h-8 text-primary" />
                        Marcas
                    </h1>
                    <p className="text-gray-400 mt-1 md:mt-2 text-sm">
                        Gestiona las marcas de productos (ej: Nike, Adidas, New Balance).
                    </p>
                </div>

                <button
                    onClick={() => {
                        setEditingBrand(null)
                        setIsModalOpen(true)
                    }}
                    className="bg-white text-black px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all shadow-lg shadow-white/5 w-full md:w-auto text-sm md:text-base"
                >
                    <Plus className="w-4 h-4 md:w-5 md:h-5" />
                    Nueva Marca
                </button>
            </div>

            {/* Content */}
            <div className="bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden p-6 md:p-8">
                {/* Search */}
                <div className="mb-4 md:mb-8 flex flex-col md:flex-row gap-3 md:gap-4 justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Buscar marca..."
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
                                    <th className="py-4 font-bold w-24 text-center whitespace-nowrap">Logo</th>
                                    <th className="py-4 font-bold min-w-[200px]">Nombre</th>
                                    <th className="py-4 font-bold min-w-[150px]">Slug</th>
                                    <th className="py-4 font-bold text-center whitespace-nowrap">Orden</th>
                                    <th className="py-4 font-bold text-center whitespace-nowrap">Estado</th>
                                    <th className="py-4 font-bold text-right whitespace-nowrap">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredBrands.map((brand) => (
                                    <tr key={brand.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="py-4 text-center">
                                            {brand.logo_url ? (
                                                <div className="w-12 h-12 relative mx-auto rounded bg-white/5 border border-white/10 overflow-hidden">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={brand.logo_url}
                                                        alt={brand.name}
                                                        className="w-full h-full object-contain p-1"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 mx-auto rounded bg-white/5 flex items-center justify-center text-gray-600 border border-white/10">
                                                    <Tag className="w-5 h-5" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 font-bold text-white text-lg">
                                            {brand.name}
                                        </td>
                                        <td className="py-4 text-gray-400 text-sm font-mono">
                                            {brand.slug}
                                        </td>
                                        <td className="py-4 text-center text-gray-400">
                                            {brand.sort_order}
                                        </td>
                                        <td className="py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${brand.active
                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                }`}>
                                                {brand.active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => {
                                                        setEditingBrand(brand)
                                                        setIsModalOpen(true)
                                                    }}
                                                    className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl transition-all"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-4 h-4 text-gray-400" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(brand.id)}
                                                    className="bg-white/5 hover:bg-red-500/10 p-2.5 rounded-xl transition-all"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredBrands.length === 0 && !loading && (
                            <div className="text-center py-16 text-gray-500">
                                <Tag className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                <p>No se encontraron marcas</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
                        <p className="text-sm text-gray-400">
                            {totalCount} marca{totalCount !== 1 ? 's' : ''}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setPage(p => Math.max(1, p - 1)); fetchBrands(page - 1); }}
                                disabled={page <= 1}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-3 py-2 text-sm text-gray-400">
                                {page} / {totalPages}
                            </span>
                            <button
                                onClick={() => { setPage(p => Math.min(totalPages, p + 1)); fetchBrands(page + 1); }}
                                disabled={page >= totalPages}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-all"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Create/Edit */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => { setIsModalOpen(false); setEditingBrand(null); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-neutral-900 border border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">
                                    {editingBrand ? 'Editar Marca' : 'Nueva Marca'}
                                </h2>
                                <button
                                    onClick={() => { setIsModalOpen(false); setEditingBrand(null); }}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-all"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-5">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Nombre *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => {
                                            const name = e.target.value
                                            setFormData(prev => ({
                                                ...prev,
                                                name,
                                                slug: prev.slug || generateSlug(name),
                                            }))
                                        }}
                                        placeholder="Nike"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-primary outline-none transition-all"
                                    />
                                </div>

                                {/* Slug */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Slug</label>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                        placeholder="nike"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-primary outline-none transition-all font-mono text-sm"
                                    />
                                </div>

                                {/* Logo */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Logo</label>
                                    <ImageUpload
                                        value={formData.logo_url}
                                        onChange={(url) => setFormData(prev => ({ ...prev, logo_url: url }))}
                                    />
                                </div>

                                {/* Sort Order */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Orden de aparición</label>
                                    <input
                                        type="number"
                                        value={formData.sort_order}
                                        onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-primary outline-none transition-all"
                                    />
                                </div>

                                {/* Active */}
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.active}
                                        onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                                        className="w-5 h-5 rounded border-white/20 bg-black/50 text-primary focus:ring-primary"
                                    />
                                    <span className="text-gray-300 font-medium">Activo</span>
                                </label>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => { setIsModalOpen(false); setEditingBrand(null); }}
                                    className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition-all font-bold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    {editingBrand ? 'Guardar' : 'Crear'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                open={deleteTarget !== null}
                title="Eliminar marca"
                message="¿Estás seguro de que deseas eliminar esta marca? Se moverá a la papelera."
                confirmLabel="Eliminar"
                onConfirm={() => {
                    if (deleteTarget) executeDelete(deleteTarget)
                    setDeleteTarget(null)
                }}
                onCancel={() => setDeleteTarget(null)}
                danger
            />
        </div>
    )
}
