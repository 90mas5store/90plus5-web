'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Search, Plus, Filter, Shirt, LayoutGrid, List as ListIcon,
    MoreHorizontal, Edit, Trash2, Tag, Trophy, ArrowUpDown, Loader2
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import useToastMessage from '@/hooks/useToastMessage'

// Tipos adaptados para la vista
type ProductView = {
    id: string
    name: string
    price: number
    image: string
    team?: { name: string }
    league?: { name: string }
    category?: { name: string }
    active: boolean
}

export default function ProductsPage() {
    const supabase = createClient()
    const toast = useToastMessage()

    // Estados
    const [products, setProducts] = useState<ProductView[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [search, setSearch] = useState('')
    const [filterCategory, setFilterCategory] = useState('all')

    // Cargar productos
    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        setLoading(true)

        try {
            // 1. Cargar catálogos auxiliares (para evitar fallos de relación FK)
            const [leaguesRes, categoriesRes] = await Promise.all([
                supabase.from('leagues').select('id, name'),
                supabase.from('categories').select('id, name')
            ])

            // Crear mapas para acceso rápido (ID -> Nombre)
            const leaguesMap = new Map(leaguesRes.data?.map((l: any) => [l.id, l.name]) || [])
            const categoriesMap = new Map(categoriesRes.data?.map((c: any) => [c.id, c.name]) || [])

            // 2. Cargar Productos con relaciones seguras
            const { data, error } = await supabase
                .from('products')
                .select(`
                    id, 
                    name, 
                    image_url,
                    active,
                    category_id,
                    league_id,
                    teams (name),
                    product_variants (price, active)
                `)
                .is('deleted_at', null)
                .order('created_at', { ascending: false })

            if (error) throw error

            // 3. Cruzar datos
            const mapped = data.map((p: any) => {
                // Calcular precio base (mínimo de variantes activas)
                const variants = p.product_variants || []
                const activeVariants = variants.filter((v: any) => v.active !== false)
                // Si hay variantes activas usamos su mínimo, sino el de cualquiera, sino 0
                const priceList = activeVariants.length > 0 ? activeVariants : variants
                const price = priceList.length > 0
                    ? Math.min(...priceList.map((v: any) => v.price || 0))
                    : 0

                return {
                    id: p.id,
                    name: p.name || 'Sin nombre',
                    price: price,
                    image: p.image_url || null,
                    team: p.teams, // Supabase ya devuelve el objeto { name: '...' } o null
                    league: { name: leaguesMap.get(p.league_id) || 'General' },
                    category: { name: categoriesMap.get(p.category_id) || 'Sin categoría' },
                    active: p.active !== false
                }
            })
            setProducts(mapped)

        } catch (error: any) {
            console.error('Error cargando catálogo:', error)
            toast.error(`Error: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Mover a la papelera? Podrás recuperarlo después.')) return

        try {
            const { error } = await supabase
                .from('products')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id)

            if (error) throw error

            toast.success('Producto movido a la papelera')
            setProducts(products.filter(p => p.id !== id))
        } catch (error: any) {
            toast.error('Error al eliminar')
            console.error(error)
        }
    }

    // Filtrado
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.team?.name.toLowerCase().includes(search.toLowerCase())
        // Aquí podrías agregar más filtros de categoría si tuvieras los IDs
        return matchesSearch
    })

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* HEADER & ACCIONES */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Shirt className="w-8 h-8 text-primary" />
                        Catálogo de Productos
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Gestiona tu inventario, precios y existencias.
                    </p>
                </div>

                <Link
                    href="/admin/productos/nuevo"
                    className="group bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-200 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-white/5"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    Nuevo Producto
                </Link>
            </div>

            {/* BARRA DE HERRAMIENTAS */}
            <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-4 z-10 shadow-2xl">

                {/* Buscador */}
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, equipo..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                    />
                </div>

                {/* Controles de Vista */}
                <div className="flex items-center gap-2 bg-black/30 p-1 rounded-xl border border-white/5">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <ListIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* CONTENIDO PRINCIPAL */}
            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-gray-500 font-medium">Cargando catálogo...</p>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4 rounded-3xl border border-dashed border-white/10 bg-white/5 mx-auto max-w-2xl">
                    <Shirt className="w-16 h-16 text-gray-600" />
                    <div className="text-center">
                        <p className="text-xl font-bold text-white">No se encontraron productos</p>
                        <p className="text-gray-500">Intenta con otra búsqueda o crea uno nuevo.</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* VISTA GRID */}
                    {viewMode === 'grid' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredProducts.map(product => (
                                <div key={product.id} className="group relative bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 flex flex-col">
                                    {/* Imagen */}
                                    <div className="aspect-[4/5] relative bg-white/5 overflow-hidden">
                                        {/* Badge Categoria */}
                                        <div className="absolute top-3 left-3 z-10">
                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/60 backdrop-blur-md text-white border border-white/10 flex items-center gap-1.5">
                                                {getStatusIcon(product)}
                                                {product.category?.name || 'General'}
                                            </span>
                                        </div>

                                        {/* Menú Flotante (Solo aparece en hover) */}
                                        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 flex flex-col gap-2">
                                            <Link href={`/admin/productos/editar/${product.id}`} className="p-2.5 bg-white text-black rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform">
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                        </div>

                                        <Image
                                            src={product.image || '/placeholder.png'}
                                            alt={product.name}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                        />

                                        {/* Gradiente Overlay */}
                                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                                    </div>

                                    {/* Info */}
                                    <div className="p-5 flex-1 flex flex-col relative">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-primary tracking-wider uppercase">
                                                    {product.team?.name || 'Sin equipo'}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-white mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                                                {product.name}
                                            </h3>
                                            <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                                                <Trophy className="w-3 h-3" /> {product.league?.name || 'Liga Desconocida'}
                                            </div>
                                        </div>

                                        <div className="flex items-end justify-between border-t border-white/10 pt-4 mt-2">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-0.5">Precio Base</p>
                                                <p className="text-xl font-black text-white">L {product.price}</p>
                                            </div>
                                            <div className={`w-2 h-2 rounded-full ${product.active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* VISTA LISTA */}
                    {viewMode === 'list' && (
                        <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-white/5 text-xs uppercase tracking-wider text-gray-400">
                                            <th className="p-4 font-bold">Producto</th>
                                            <th className="p-4 font-bold">Categoría / Liga</th>
                                            <th className="p-4 font-bold">Equipo</th>
                                            <th className="p-4 font-bold text-right">Precio</th>
                                            <th className="p-4 font-bold text-center">Estado</th>
                                            <th className="p-4 font-bold text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredProducts.map(product => (
                                            <tr key={product.id} className="group hover:bg-white/[0.02] transition-colors">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-white/5 border border-white/10">
                                                            <Image
                                                                src={product.image || '/placeholder.png'}
                                                                alt={product.name}
                                                                fill
                                                                className="object-cover group-hover:scale-110 transition-transform"
                                                            />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white group-hover:text-primary transition-colors">{product.name}</p>
                                                            <p className="text-xs text-gray-500">ID: {product.id.slice(0, 8)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="flex items-center gap-2 text-sm text-gray-300">
                                                            <Tag className="w-3 h-3 text-gray-500" /> {product.category?.name || 'N/A'}
                                                        </span>
                                                        <span className="flex items-center gap-2 text-xs text-gray-500">
                                                            <Trophy className="w-3 h-3" /> {product.league?.name || 'N/A'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-white border border-white/10">
                                                        {product.team?.name || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right font-mono text-white">
                                                    L {product.price}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className={`inline-block w-2 h-2 rounded-full ${product.active ? 'bg-green-500' : 'bg-red-500'}`} />
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                        <Link href={`/admin/productos/editar/${product.id}`} className="p-2 bg-white/5 hover:bg-white text-white hover:text-black rounded-lg transition-colors">
                                                            <Edit className="w-4 h-4" />
                                                        </Link>
                                                        <button
                                                            className="p-2 bg-white/5 hover:bg-red-500/20 text-white hover:text-red-500 rounded-lg transition-colors"
                                                            onClick={() => handleDelete(product.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

// Helper para iconos
function getStatusIcon(product: any) {
    // Lógica simple de ejemplo
    if (product.price > 1000) return <Tag className="w-3 h-3 text-yellow-500" />
    return <Shirt className="w-3 h-3 text-gray-400" />
}
