'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit, Trash2, Search, X, Save, Loader2, Tag, ArrowUpDown } from 'lucide-react'
import Image from 'next/image'
import useToastMessage from '@/hooks/useToastMessage'
import ImageUpload from '@/components/admin/ImageUpload'
import { motion, AnimatePresence } from 'framer-motion'

interface Category {
    id: string
    name: string
    slug: string
    icon_url?: string
    active: boolean
    order_index: number
}

export default function CategoriesPage() {
    const supabase = createClient()
    const toast = useToastMessage()

    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [saving, setSaving] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        icon_url: '',
        active: true,
        order_index: 0
    })

    useEffect(() => {
        fetchCategories()
    }, [])

    useEffect(() => {
        if (editingCategory) {
            setFormData({
                name: editingCategory.name,
                slug: editingCategory.slug,
                icon_url: editingCategory.icon_url || '',
                active: editingCategory.active,
                order_index: editingCategory.order_index || 0
            })
        } else {
            setFormData({
                name: '',
                slug: '',
                icon_url: '',
                active: true,
                order_index: categories.length + 1
            })
        }
    }, [editingCategory, isModalOpen])

    const fetchCategories = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('order_index', { ascending: true })

            if (error) throw error
            setCategories(data || [])
        } catch (error: any) {
            console.error('Error fetching categories:', error)
            toast.error('Error al cargar categorías')
        } finally {
            setLoading(false)
        }
    }

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
                icon_url: formData.icon_url,
                active: formData.active,
                order_index: formData.order_index
            }

            if (editingCategory) {
                // Update
                const { error } = await supabase
                    .from('categories')
                    .update(payload)
                    .eq('id', editingCategory.id)
                if (error) throw error
                toast.success('Categoría actualizada')
            } else {
                // Create
                const { error } = await supabase
                    .from('categories')
                    .insert(payload)
                if (error) throw error
                toast.success('Categoría creada')
            }

            setIsModalOpen(false)
            setEditingCategory(null)
            fetchCategories()

        } catch (error: any) {
            console.error('Error saving category:', error)
            toast.error(`Error: ${error.message}`)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar esta categoría?')) return

        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id)

            if (error) throw error
            toast.success('Categoría eliminada')
            setCategories(prev => prev.filter(c => c.id !== id))
        } catch (error: any) {
            console.error('Error deleting category:', error)
            toast.error('Error al eliminar')
        }
    }

    // Auto-generate slug
    const handleNameChange = (val: string) => {
        setFormData(prev => ({
            ...prev,
            name: val,
            slug: !editingCategory ? val.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') : prev.slug
        }))
    }

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.slug.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Tag className="w-8 h-8 text-primary" />
                        Categorías
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Gestiona las categorías principales de la tienda.
                    </p>
                </div>

                <button
                    onClick={() => {
                        setEditingCategory(null)
                        setIsModalOpen(true)
                    }}
                    className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-200 transition-all shadow-lg shadow-white/5"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Categoría
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
                            placeholder="Buscar categoría..."
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
                                    <th className="py-4 font-bold w-24 text-center whitespace-nowrap">Icono</th>
                                    <th className="py-4 font-bold min-w-[200px]">Nombre</th>
                                    <th className="py-4 font-bold min-w-[150px]">Slug</th>
                                    <th className="py-4 font-bold text-center whitespace-nowrap">Estado</th>
                                    <th className="py-4 font-bold text-right whitespace-nowrap">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredCategories.map((cat) => (
                                    <tr key={cat.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="py-4 text-center font-mono text-gray-500 whitespace-nowrap">
                                            {cat.order_index}
                                        </td>
                                        <td className="py-4 text-center">
                                            {cat.icon_url ? (
                                                <div className="w-10 h-10 relative mx-auto rounded bg-white/5 border border-white/10 overflow-hidden">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={cat.icon_url}
                                                        alt={cat.name}
                                                        className="w-full h-full object-contain p-1"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 mx-auto rounded bg-white/5 flex items-center justify-center text-gray-600 border border-white/10">
                                                    <Tag className="w-5 h-5" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 font-bold text-white text-lg">
                                            {cat.name}
                                        </td>
                                        <td className="py-4 text-gray-400 font-mono text-sm max-w-[150px] truncate">
                                            {cat.slug}
                                        </td>
                                        <td className="py-4 text-center whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cat.active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                                }`}>
                                                {cat.active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingCategory(cat)
                                                        setIsModalOpen(true)
                                                    }}
                                                    className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cat.id)}
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

                        {filteredCategories.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                No se encontraron categorías.
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
                                    {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-8 space-y-8 overflow-y-auto">

                                {/* Image Upload */}
                                <div className="flex flex-col items-center">
                                    <label className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-wider">Icono / Imagen</label>
                                    <div className="w-32">
                                        <ImageUpload
                                            value={formData.icon_url}
                                            onChange={(url) => setFormData(prev => ({ ...prev, icon_url: url }))}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-xs font-bold uppercase text-gray-400 mb-2 block tracking-wider">Orden</label>
                                            <input
                                                type="number"
                                                value={formData.order_index}
                                                onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
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
                                            placeholder="Ej: Camisetas"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold uppercase text-gray-400 mb-2 block tracking-wider">Slug (URL)</label>
                                        <input
                                            type="text"
                                            value={formData.slug}
                                            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none font-mono text-sm"
                                            placeholder="ej: camisetas"
                                        />
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
