'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Search, Plus, Shirt, LayoutGrid, List as ListIcon,
    Edit, Trash2, Tag, Trophy, Loader2, Copy, ChevronDown, Zap
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import useToastMessage from '@/hooks/useToastMessage'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { useAdminRole } from '@/hooks/useAdminRole'
import { setProductTrending } from '@/app/admin/actions'

// Tipos adaptados para la vista
type ProductView = {
    id: string
    name: string
    slug: string
    price: number
    image: string
    team?: { name: string }
    league?: { name: string; id: string }
    category?: { name: string; id: string }
    active: boolean
    trending_until?: string | null
}

type CatalogItem = { id: string; name: string }

export default function ProductsPage() {
    const supabaseRef = useRef(createClient())
    const supabase = supabaseRef.current
    const toast = useToastMessage()
    const { isSuperAdmin } = useAdminRole()

    // Estados
    const [products, setProducts] = useState<ProductView[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [search, setSearch] = useState('')
    const [filterCategory, setFilterCategory] = useState('all')
    const [filterLeague, setFilterLeague] = useState('all')
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
    const [duplicating, setDuplicating] = useState<string | null>(null)
    const [trendingProduct, setTrendingProduct] = useState<string | null>(null)
    const [allCategories, setAllCategories] = useState<CatalogItem[]>([])
    const [allLeagues, setAllLeagues] = useState<CatalogItem[]>([])

    const fetchProducts = useCallback(async () => {
        setLoading(true)

        try {
            // 1. Cargar catálogos auxiliares (para evitar fallos de relación FK)
            const [leaguesRes, categoriesRes] = await Promise.all([
                supabase.from('leagues').select('id, name').is('deleted_at', null).order('name'),
                supabase.from('categories').select('id, name').is('deleted_at', null).order('name')
            ])

            setAllLeagues(leaguesRes.data || [])
            setAllCategories(categoriesRes.data || [])

            // Crear mapas para acceso rápido (ID -> Nombre)
            const leaguesMap = new Map(leaguesRes.data?.map((l: { id: string; name: string }) => [l.id, l.name]) || [])
            const categoriesMap = new Map(categoriesRes.data?.map((c: { id: string; name: string }) => [c.id, c.name]) || [])

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
                    trending_until,
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
                    slug: p.slug || '',
                    price: price,
                    image: p.image_url || null,
                    team: p.teams,
                    league: { id: p.league_id || '', name: leaguesMap.get(p.league_id) || 'General' },
                    category: { id: p.category_id || '', name: categoriesMap.get(p.category_id) || 'Sin categoría' },
                    active: p.active !== false,
                    trending_until: p.trending_until ?? null,
                }
            })
            setProducts(mapped)

        } catch (error: unknown) {
            console.error('Error cargando catálogo:', error)
            toast.error(`Error: ${(error as Error).message}`)
        } finally {
            setLoading(false)
        }
    }, [])

    // Cargar productos
    useEffect(() => {
        fetchProducts()
    }, [fetchProducts])

    const handleDelete = (id: string) => setDeleteTarget(id)

    const executeDelete = async (id: string) => {
        // 🚀 Optimistic: quitar de la lista inmediatamente
        const snapshot = products
        setProducts(prev => prev.filter(p => p.id !== id))
        toast.success('Producto movido a la papelera')

        try {
            const { error } = await supabase
                .from('products')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id)

            if (error) throw error
        } catch (error: unknown) {
            // Revertir si el servidor falla
            setProducts(snapshot)
            toast.error('Error al eliminar, el producto fue restaurado')
            console.error(error)
        }
    }

    const handleToggleActive = async (id: string, currentActive: boolean) => {
        // 🚀 Optimistic: cambiar estado en UI antes de llamar al servidor
        setProducts(prev =>
            prev.map(p => p.id === id ? { ...p, active: !currentActive } : p)
        )

        try {
            const { error } = await supabase
                .from('products')
                .update({ active: !currentActive })
                .eq('id', id)

            if (error) throw error

            toast.success(!currentActive ? 'Producto activado' : 'Producto desactivado')
        } catch (error: unknown) {
            // Revertir al estado original
            setProducts(prev =>
                prev.map(p => p.id === id ? { ...p, active: currentActive } : p)
            )
            toast.error('Error al cambiar el estado')
            console.error(error)
        }
    }

    const handleTrending = async (productId: string, hours: number | null) => {
        setTrendingProduct(productId)
        try {
            await setProductTrending(productId, hours)
            const trendingUntil = hours
                ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
                : null
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, trending_until: trendingUntil } : p))
            toast.success(hours ? `⚡ EN VIVO activado por ${hours}h` : 'EN VIVO desactivado')
        } catch (err: unknown) {
            toast.error(`Error: ${(err as Error).message}`)
        } finally {
            setTrendingProduct(null)
        }
    }

    const handleDuplicate = async (product: ProductView) => {
        setDuplicating(product.id)
        try {
            const newSlug = `${product.slug}-copia-${Date.now().toString(36)}`
            const { data: original } = await supabase
                .from('products')
                .select('*')
                .eq('id', product.id)
                .single()
            if (!original) throw new Error('Producto no encontrado')

            const { error } = await supabase
                .from('products')
                .insert({
                    ...original,
                    id: undefined,
                    name: `${original.name} (Copia)`,
                    slug: newSlug,
                    active: false,
                    featured: false,
                    created_at: undefined,
                    deleted_at: null,
                })
            if (error) throw error
            toast.success('Producto duplicado como borrador (inactivo)')
            fetchProducts()
        } catch (err: unknown) {
            toast.error(`Error: ${(err as Error).message}`)
        } finally {
            setDuplicating(null)
        }
    }

    // Filtrado
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.team?.name || '').toLowerCase().includes(search.toLowerCase())
        const matchesCategory = filterCategory === 'all' || p.category?.id === filterCategory
        const matchesLeague = filterLeague === 'all' || p.league?.id === filterLeague
        const matchesStatus =
            filterStatus === 'all' ||
            (filterStatus === 'active' && p.active) ||
            (filterStatus === 'inactive' && !p.active)
        return matchesSearch && matchesCategory && matchesLeague && matchesStatus
    })

    return (
        <div className="space-y-4 md:space-y-8 animate-in fade-in duration-500">
            {/* HEADER & ACCIONES */}
            <div className="flex flex-col md:flex-row gap-3 md:gap-6 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2 md:gap-3">
                        <Shirt className="w-5 h-5 md:w-8 md:h-8 text-primary" />
                        Catálogo de Productos
                    </h1>
                    <p className="text-gray-400 mt-1 md:mt-2 text-sm">
                        Gestiona tu inventario, precios y existencias.
                    </p>
                </div>

                <Link
                    href="/admin/productos/nuevo"
                    className="group bg-white text-black px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-white/5 w-full md:w-auto text-sm md:text-base"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    Nuevo Producto
                </Link>
            </div>

            {/* BARRA DE HERRAMIENTAS */}
            <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col gap-3 sticky top-0 md:top-4 z-10 shadow-2xl">
                <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
                    {/* Buscador */}
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, equipo..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-white focus:border-primary/50 outline-none transition-all text-sm"
                        />
                    </div>

                    {/* Controles de Vista */}
                    <div className="flex items-center gap-2 bg-black/30 p-1 rounded-xl border border-white/5">
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                            <ListIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Filtros */}
                <div className="flex flex-wrap gap-2 items-center">
                    <div className="relative">
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                            className="bg-black/40 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-xs text-white appearance-none outline-none focus:border-primary/50 cursor-pointer">
                            <option value="all">Todos los estados</option>
                            <option value="active">Activos</option>
                            <option value="inactive">Inactivos</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                    </div>
                    <div className="relative">
                        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-xs text-white appearance-none outline-none focus:border-primary/50 cursor-pointer">
                            <option value="all">Todas las categorías</option>
                            {allCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                    </div>
                    <div className="relative">
                        <select value={filterLeague} onChange={e => setFilterLeague(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-xs text-white appearance-none outline-none focus:border-primary/50 cursor-pointer">
                            <option value="all">Todas las ligas</option>
                            {allLeagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                    </div>
                    {(filterStatus !== 'all' || filterCategory !== 'all' || filterLeague !== 'all' || search) && (
                        <button onClick={() => { setFilterStatus('all'); setFilterCategory('all'); setFilterLeague('all'); setSearch('') }}
                            className="text-xs text-gray-500 hover:text-white border border-white/10 rounded-lg px-3 py-2 transition-colors">
                            Limpiar filtros
                        </button>
                    )}
                    <span className="text-xs text-gray-600 ml-auto">{filteredProducts.length} productos</span>
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                            {filteredProducts.map(product => (
                                <div key={product.id} className="group relative bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 flex flex-col">
                                    {/* Imagen */}
                                    <div className="aspect-[4/5] relative bg-white/5 overflow-hidden">
                                        {/* Badge Categoria + EN VIVO */}
                                        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/60 backdrop-blur-md text-white border border-white/10 flex items-center gap-1.5">
                                                {getStatusIcon(product)}
                                                {product.category?.name || 'General'}
                                            </span>
                                            {product.trending_until && new Date(product.trending_until) > new Date() && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white animate-pulse w-fit">
                                                    ⚡ EN VIVO
                                                </span>
                                            )}
                                        </div>

                                        {/* Menú Flotante (Solo aparece en hover) */}
                                        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 flex flex-col gap-2">
                                            <Link href={`/admin/productos/editar/${product.id}`} className="p-2.5 bg-white text-black rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform" title="Editar">
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <button onClick={() => handleDuplicate(product)} disabled={duplicating === product.id} className="p-2.5 bg-black/80 border border-white/20 text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform disabled:opacity-50" title="Duplicar">
                                                {duplicating === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                            {/* Trending toggle */}
                                            {trendingProduct === product.id ? (
                                                <div className="p-2.5 bg-primary/20 rounded-full">
                                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                </div>
                                            ) : product.trending_until && new Date(product.trending_until) > new Date() ? (
                                                <button onClick={() => handleTrending(product.id, null)} className="p-2.5 bg-primary text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform" title="Desactivar EN VIVO">
                                                    <Zap className="w-4 h-4" fill="currentColor" />
                                                </button>
                                            ) : (
                                                <div className="relative group/trending">
                                                    <button className="p-2.5 bg-black/80 border border-white/20 text-gray-400 hover:text-primary hover:border-primary/50 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all" title="Activar EN VIVO">
                                                        <Zap className="w-4 h-4" />
                                                    </button>
                                                    <div className="absolute right-full mr-2 top-0 hidden group-hover/trending:flex flex-col gap-1 bg-neutral-900 border border-white/10 rounded-xl p-2 shadow-2xl">
                                                        {[2, 4, 8].map(h => (
                                                            <button key={h} onClick={() => handleTrending(product.id, h)} className="text-xs text-white hover:text-primary px-3 py-1.5 rounded-lg hover:bg-white/5 whitespace-nowrap transition-colors">
                                                                {h}h
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <Image
                                            src={product.image || '/heroes/default.jpg'}
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

                            {/* MOBILE: Cards */}
                            <div className="md:hidden divide-y divide-white/5">
                                {filteredProducts.map(product => (
                                    <div key={product.id} className="p-3.5 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-14 h-14 relative rounded-lg overflow-hidden bg-white/5 border border-white/10 shrink-0">
                                                <Image
                                                    src={product.image || '/heroes/default.jpg'}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-white truncate text-sm">{product.name}</p>
                                                <p className="text-xs text-primary truncate">{product.team?.name || 'Sin equipo'}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                    <span className="text-[10px] text-gray-500">{product.category?.name || 'N/A'}</span>
                                                    <span className="text-gray-700">·</span>
                                                    <span className="text-[10px] text-gray-500">{product.league?.name || 'N/A'}</span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="font-black text-white text-sm">L {product.price}</p>
                                                <button onClick={() => handleToggleActive(product.id, product.active)} className="flex items-center gap-1 mt-1 ml-auto">
                                                    <div className={`w-2 h-2 rounded-full ${product.active ? 'bg-green-500' : 'bg-red-500'}`} />
                                                    <span className="text-[10px] text-gray-500">{product.active ? 'Activo' : 'Inactivo'}</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                                            <Link href={`/admin/productos/editar/${product.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors text-xs font-bold">
                                                <Edit className="w-3.5 h-3.5" /> Editar
                                            </Link>
                                            <button onClick={() => handleDuplicate(product)} disabled={duplicating === product.id} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/5 hover:bg-blue-500/20 rounded-lg text-gray-400 hover:text-blue-400 transition-colors text-xs font-bold disabled:opacity-30">
                                                {duplicating === product.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />} Copiar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                disabled={!isSuperAdmin}
                                                className="p-2 bg-white/5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30"
                                                title={!isSuperAdmin ? 'Solo los super admins pueden eliminar' : 'Mover a papelera'}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* DESKTOP: Table */}
                            <div className="hidden md:block overflow-x-auto">
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
                                                                src={product.image || '/heroes/default.jpg'}
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
                                                    <button
                                                        onClick={() => handleToggleActive(product.id, product.active)}
                                                        title={product.active ? 'Desactivar' : 'Activar'}
                                                        className="group inline-flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors hover:bg-white/5"
                                                    >
                                                        <div className={`w-2 h-2 rounded-full transition-colors ${product.active ? 'bg-green-500' : 'bg-red-500'}`} />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">
                                                            {product.active ? 'Activo' : 'Inactivo'}
                                                        </span>
                                                    </button>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                        <Link href={`/admin/productos/editar/${product.id}`} title="Editar" className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white text-white hover:text-black rounded-lg transition-colors">
                                                            <Edit className="w-4 h-4" />
                                                        </Link>
                                                        <button onClick={() => handleDuplicate(product)} disabled={duplicating === product.id} title="Duplicar" className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-blue-500/20 text-white hover:text-blue-400 rounded-lg transition-colors disabled:opacity-30">
                                                            {duplicating === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                                                        </button>
                                                        {/* Trending */}
                                                        {trendingProduct === product.id ? (
                                                            <div className="w-9 h-9 flex items-center justify-center">
                                                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                            </div>
                                                        ) : product.trending_until && new Date(product.trending_until) > new Date() ? (
                                                            <button onClick={() => handleTrending(product.id, null)} title="Desactivar EN VIVO" className="w-9 h-9 flex items-center justify-center bg-primary/20 hover:bg-primary text-primary hover:text-white rounded-lg transition-colors">
                                                                <Zap className="w-4 h-4" fill="currentColor" />
                                                            </button>
                                                        ) : (
                                                            <div className="relative group/tl">
                                                                <button title="Activar EN VIVO" className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-primary/20 text-gray-400 hover:text-primary rounded-lg transition-colors">
                                                                    <Zap className="w-4 h-4" />
                                                                </button>
                                                                <div className="absolute bottom-full mb-1 right-0 hidden group-hover/tl:flex flex-row gap-1 bg-neutral-900 border border-white/10 rounded-xl p-1.5 shadow-2xl z-20">
                                                                    {[2, 4, 8].map(h => (
                                                                        <button key={h} onClick={() => handleTrending(product.id, h)} className="text-xs text-white hover:text-primary px-2.5 py-1.5 rounded-lg hover:bg-white/5 whitespace-nowrap transition-colors">
                                                                            {h}h
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <button
                                                            className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-red-500/20 text-white hover:text-red-500 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:text-white"
                                                            onClick={() => handleDelete(product.id)}
                                                            disabled={!isSuperAdmin}
                                                            title={!isSuperAdmin ? 'Solo los super admins pueden eliminar' : 'Mover a papelera'}
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

            <ConfirmDialog
                open={deleteTarget !== null}
                title="Mover a la papelera"
                message="¿Mover este producto a la papelera? Podrás recuperarlo después desde Ajustes → Papelera."
                confirmLabel="Mover"
                onConfirm={() => { if (deleteTarget) executeDelete(deleteTarget); setDeleteTarget(null); }}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    )
}

// Helper para iconos
function getStatusIcon(product: any) {
    // Lógica simple de ejemplo
    if (product.price > 1000) return <Tag className="w-3 h-3 text-yellow-500" />
    return <Shirt className="w-3 h-3 text-gray-400" />
}
