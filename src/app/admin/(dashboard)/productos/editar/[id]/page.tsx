'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    Save, ArrowLeft, Loader2, Image as ImageIcon,
    Trash2, Plus, AlertCircle, CheckCircle
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import useToastMessage from '@/hooks/useToastMessage'

export default function EditProductPage() {
    const { id } = useParams()
    const router = useRouter()
    const supabase = createClient()
    const toast = useToastMessage()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Catálogos
    const [teams, setTeams] = useState<any[]>([])
    const [leagues, setLeagues] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])

    // Estado del Formulario
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        slug: '',
        image_url: '',
        team_id: '',
        league_id: '',
        category_id: '',
        active: true,
        featured: false
    })

    // Variantes
    const [variants, setVariants] = useState<any[]>([])

    // Cargar datos al inicio
    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Cargar catálogos
                const [teamsRes, leaguesRes, catsRes] = await Promise.all([
                    supabase.from('teams').select('id, name').order('name'),
                    supabase.from('leagues').select('id, name').order('name'),
                    supabase.from('categories').select('id, name').order('name')
                ])

                setTeams(teamsRes.data || [])
                setLeagues(leaguesRes.data || [])
                setCategories(catsRes.data || [])

                // 2. Cargar Producto
                const { data: product, error } = await supabase
                    .from('products')
                    .select(`
                        *,
                        product_variants (*)
                    `)
                    .eq('id', id)
                    .single()

                if (error) throw error

                setFormData({
                    name: product.name || '',
                    description: product.description || '',
                    slug: product.slug || '',
                    image_url: product.image_url || '',
                    team_id: product.team_id || '',
                    league_id: product.league_id || '',
                    category_id: product.category_id || '',
                    active: product.active ?? true,
                    featured: product.featured ?? false
                })

                setVariants(product.product_variants || [])

            } catch (error: any) {
                console.error('Error cargando producto:', error)
                toast.error('Error al cargar datos del producto')
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [id])

    // Manejar cambios en inputs
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }))
    }

    // Guardar cambios
    const handleSave = async () => {
        if (!formData.name || !formData.slug) {
            toast.error('Nombre y Slug son obligatorios')
            return
        }

        setSaving(true)
        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                slug: formData.slug,
                image_url: formData.image_url,
                team_id: formData.team_id || null,
                league_id: formData.league_id || null,
                category_id: formData.category_id || null,
                active: formData.active,
                featured: formData.featured
            }

            console.log('📤 Intentando actualizar producto:', id)
            console.log('📦 Payload:', payload)

            // 1. Actualizar Producto y pedir el registro actualizado
            // Quitamos .single() para evitar el error si RLS bloquea la actualización
            const { data: updatedData, error: prodError } = await supabase
                .from('products')
                .update(payload)
                .eq('id', id)
                .select()

            if (prodError) throw prodError

            // Verificar si realmente se actualizó algo
            if (!updatedData || updatedData.length === 0) {
                console.error('⚠️ La actualización retornó 0 filas. Posible bloqueo de RLS.')
                throw new Error('No se pudo actualizar. Es probable que falten permisos (Policies) para EDITAR en la tabla "products".')
            }

            console.log('✅ Actualización confirmada en BD:', updatedData[0])

            toast.success('Producto actualizado correctamente')
            router.refresh()
            // Pequeño delay para asegurar propagación
            setTimeout(() => {
                router.push('/admin/productos')
            }, 500)

        } catch (error: any) {
            console.error('❌ Error al guardar:', error)
            toast.error(`Error: ${error.message}`)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    )

    return (
        <div className="max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/productos" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-white">Editar Producto</h1>
                        <p className="text-gray-400 text-sm">ID: {id}</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-primary hover:bg-primary/90 text-black px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Guardar Cambios
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* COLUMNA IZQUIERDA: Info Principal */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Tarjeta: Información Básica */}
                    <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 space-y-4">
                        <h2 className="text-lg font-bold text-white mb-4">Información del Producto</h2>

                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Nombre del Producto</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none transition-colors font-medium text-lg"
                                placeholder="Ej: Camiseta Local Real Madrid 2024"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Descripción</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none transition-colors"
                                placeholder="Detalles de la camiseta..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Slug (URL amigable)</label>
                                <input
                                    type="text"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleChange}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-gray-300 focus:border-primary outline-none transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tarjeta: Variantes (Lista Preliminar) */}
                    <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-white">Variantes y Precios</h2>
                            <span className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded">
                                {variants.length} variantes
                            </span>
                        </div>

                        <div className="space-y-3">
                            {variants.map((variant) => (
                                <div key={variant.id} className="flex items-center justify-between bg-black/30 p-4 rounded-xl border border-white/5">
                                    <div>
                                        <p className="font-bold text-white mb-1">
                                            Versión: <span className="text-primary">{variant.version}</span>
                                        </p>
                                        <p className="text-xs text-gray-500 font-mono">ID: {variant.id.slice(0, 8)}...</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-white">L {variant.price}</p>
                                        <span className={`text-xs ${variant.active ? 'text-green-500' : 'text-red-500'}`}>
                                            {variant.active ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {variants.length === 0 && (
                                <p className="text-gray-500 text-center py-4">No hay variantes registradas.</p>
                            )}
                        </div>
                        <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-3 items-start">
                            <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-yellow-200/80">
                                Para editar precios o agregar variantes, por favor usa la gestión avanzada (próximamente en esta pantalla).
                            </p>
                        </div>
                    </div>
                </div>

                {/* COLUMNA DERECHA: Configuración */}
                <div className="space-y-6">

                    {/* Estado */}
                    <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 space-y-4">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Visibilidad</h2>

                        <label className="flex items-center justify-between p-3 bg-black/30 rounded-xl cursor-pointer hover:bg-black/50 transition-colors">
                            <span className="font-medium text-white">Producto Activo</span>
                            <input
                                type="checkbox"
                                name="active"
                                checked={formData.active}
                                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                                className="w-5 h-5 accent-primary rounded cursor-pointer"
                            />
                        </label>

                        <label className="flex items-center justify-between p-3 bg-black/30 rounded-xl cursor-pointer hover:bg-black/50 transition-colors">
                            <span className="font-medium text-white">Destacado (Home)</span>
                            <input
                                type="checkbox"
                                name="featured"
                                checked={formData.featured}
                                onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                                className="w-5 h-5 accent-yellow-500 rounded cursor-pointer"
                            />
                        </label>
                    </div>

                    {/* Clasificación */}
                    <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 space-y-4">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Clasificación</h2>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">Equipo</label>
                            <select
                                name="team_id"
                                value={formData.team_id}
                                onChange={handleChange}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                            >
                                <option value="">Seleccionar Equipo</option>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">Liga / Competición</label>
                            <select
                                name="league_id"
                                value={formData.league_id}
                                onChange={handleChange}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                            >
                                <option value="">Seleccionar Liga</option>
                                {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">Categoría</label>
                            <select
                                name="category_id"
                                value={formData.category_id}
                                onChange={handleChange}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                            >
                                <option value="">Seleccionar Categoría</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Imagen */}
                    <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Imagen Principal</h2>

                        <div className="aspect-[4/5] relative bg-black/50 rounded-xl overflow-hidden border-2 border-dashed border-white/10 mb-4 group">
                            {formData.image_url ? (
                                <Image
                                    src={formData.image_url}
                                    alt="Preview"
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                                    <span className="text-xs">Sin imagen</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">URL de la Imagen</label>
                            <input
                                type="text"
                                name="image_url"
                                value={formData.image_url}
                                onChange={handleChange}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-gray-300 focus:border-primary outline-none"
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
