'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import useToastMessage from '@/hooks/useToastMessage'
import { useAdminRole } from '@/hooks/useAdminRole'
import { setProductTrending, syncFeaturedOrderAction } from '@/app/admin/actions'

export type ProductView = {
    id: string
    name: string
    slug: string
    price: number
    image: string
    team?: { name: string }
    brand?: { name: string } | null
    league?: { name: string; id: string }
    category?: { name: string; id: string }
    active: boolean
    featured?: boolean
    sort_order?: number
    season?: string | null
    gender?: string | null
    trending_until?: string | null
}

export type CatalogItem = { id: string; name: string }

export type FilterStatus = 'all' | 'active' | 'inactive' | 'featured'

export function useAdminProducts() {
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
    const [filterGender, setFilterGender] = useState('all')
    const [filterSeason, setFilterSeason] = useState('all')
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
    const [showFiltersModal, setShowFiltersModal] = useState(false)
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
                    slug,
                    image_url,
                    active,
                    featured,
                    sort_order,
                    category_id,
                    league_id,
                    brand_id,
                    season,
                    gender,
                    trending_until,
                    teams (name),
                    brands (name),
                    product_variants (price, active)
                `)
                .is('deleted_at', null)
                .order('created_at', { ascending: false })

            if (error) throw error

            // 3. Cruzar datos
            const mapped: ProductView[] = (data || []).map((p: any) => {
                // Calcular precio base (mínimo de variantes activas)
                const variants = p.product_variants || []
                const activeVariants = variants.filter((v: any) => v.active !== false)
                const priceList = activeVariants.length > 0 ? activeVariants : variants
                const price = priceList.length > 0
                    ? Math.min(...priceList.map((v: any) => v.price || 0))
                    : 0

                const brandObj = Array.isArray(p.brands) ? p.brands[0] : p.brands
                return {
                    id: p.id,
                    name: p.name || 'Sin nombre',
                    slug: p.slug || '',
                    price: price,
                    image: p.image_url || null,
                    team: p.teams,
                    brand: brandObj ? { name: brandObj.name } : null,
                    league: { id: p.league_id || '', name: leaguesMap.get(p.league_id) || 'General' },
                    category: { id: p.category_id || '', name: categoriesMap.get(p.category_id) || 'Sin categoría' },
                    active: p.active !== false,
                    featured: p.featured ?? false,
                    sort_order: p.sort_order ?? 0,
                    season: p.season || null,
                    gender: p.gender || null,
                    trending_until: p.trending_until || null,
                }
            })
            setProducts(mapped)

        } catch (error: unknown) {
            console.error('Error cargando catálogo:', error)
            toast.error(`Error: ${(error as Error).message}`)
        } finally {
            setLoading(false)
        }
    }, [supabase, toast])

    // Cargar productos al montar
    useEffect(() => {
        fetchProducts()
    }, [fetchProducts])

    // Lista única de temporadas disponibles dinámicamente
    const allSeasons = useMemo(() => Array.from(
        new Set(products.map(p => p.season).filter(Boolean))
    ).sort() as string[], [products])

    const activeFiltersCount = (filterStatus !== 'all' ? 1 : 0) +
        (filterCategory !== 'all' ? 1 : 0) +
        (filterLeague !== 'all' ? 1 : 0) +
        (filterGender !== 'all' ? 1 : 0) +
        (filterSeason !== 'all' ? 1 : 0)

    const handleClearFilters = () => {
        setFilterStatus('all')
        setFilterCategory('all')
        setFilterLeague('all')
        setFilterGender('all')
        setFilterSeason('all')
        setSearch('')
    }

    const handleDelete = (id: string) => setDeleteTarget(id)

    const executeDelete = async (id: string) => {
        if (!id) return
        try {
            const { error } = await supabase.from('products').update({ deleted_at: new Date().toISOString() }).eq('id', id)
            if (error) throw error
            await syncFeaturedOrderAction({ targetProductId: id, isFeatured: false })
            setProducts(prev => prev.filter(p => p.id !== id))
            toast.success('Producto movido a la papelera')
        } catch (err: unknown) {
            toast.error(`Error al eliminar: ${(err as Error).message}`)
        } finally {
            setDeleteTarget(null)
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
            const until = hours ? new Date(Date.now() + hours * 3600000).toISOString() : null
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, trending_until: until } : p))
            toast.success(hours ? `Modo EN VIVO activado por ${hours}h` : 'Modo EN VIVO desactivado')
        } catch (err: unknown) {
            toast.error(`Error: ${(err as Error).message}`)
        } finally {
            setTrendingProduct(null)
        }
    }

    const handleDuplicate = async (product: ProductView) => {
        setDuplicating(product.id)
        try {
            const { data: fullProduct, error: fetchErr } = await supabase
                .from('products')
                .select('*, product_variants(*), product_audience(*), product_patches(*), product_players(*)')
                .eq('id', product.id)
                .single()
            if (fetchErr || !fullProduct) throw fetchErr || new Error('No se encontró el producto')

            const newSlug = `${fullProduct.slug || 'producto'}-copia-${Date.now().toString().slice(-4)}`
            const { data: newProd, error: insertErr } = await supabase
                .from('products')
                .insert({
                    name: `${fullProduct.name} (Copia)`,
                    slug: newSlug,
                    description: fullProduct.description,
                    team_id: fullProduct.team_id,
                    brand_id: fullProduct.brand_id,
                    league_id: fullProduct.league_id,
                    category_id: fullProduct.category_id,
                    season: fullProduct.season,
                    gender: fullProduct.gender,
                    image_url: fullProduct.image_url,
                    gallery_urls: fullProduct.gallery_urls,
                    size_guide_type: fullProduct.size_guide_type,
                    active: false,
                })
                .select('id')
                .single()
            if (insertErr || !newProd) throw insertErr

            if (fullProduct.product_variants?.length) {
                const variantsToInsert = fullProduct.product_variants.map((v: any) => ({
                    product_id: newProd.id, version: v.version, price: v.price, cost_price: v.cost_price, size_list: v.size_list, active: v.active,
                }))
                await supabase.from('product_variants').insert(variantsToInsert)
            }

            if (fullProduct.product_audience?.length) {
                const audienceToInsert = fullProduct.product_audience.map((a: any) => ({
                    product_id: newProd.id, target: a.target,
                }))
                await supabase.from('product_audience').insert(audienceToInsert)
            }

            if (fullProduct.product_patches?.length) {
                const patchesToInsert = fullProduct.product_patches.map((p: any) => ({
                    product_id: newProd.id, patch_id: p.patch_id,
                }))
                await supabase.from('product_patches').insert(patchesToInsert)
            }

            if (fullProduct.product_players?.length) {
                const playersToInsert = fullProduct.product_players.map((pp: any) => ({
                    product_id: newProd.id,
                    player_id: pp.player_id,
                    sort_order: pp.sort_order ?? 0,
                }))
                await supabase.from('product_players').insert(playersToInsert)
            }

            toast.success('Producto duplicado exitosamente (creado como inactivo)')
            fetchProducts()
        } catch (err: unknown) {
            toast.error(`Error al duplicar: ${(err as Error).message}`)
        } finally {
            setDuplicating(null)
        }
    }

    // Filtrado y Orden
    const filteredProducts = useMemo(() => {
        const list = products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                (p.team?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (p.brand?.name || '').toLowerCase().includes(search.toLowerCase())
            const matchesCategory = filterCategory === 'all' || p.category?.id === filterCategory
            const matchesLeague = filterLeague === 'all' || p.league?.id === filterLeague
            const matchesStatus =
                filterStatus === 'all' ||
                (filterStatus === 'active' && p.active) ||
                (filterStatus === 'inactive' && !p.active) ||
                (filterStatus === 'featured' && p.featured)
            const matchesGender = filterGender === 'all' || p.gender === filterGender
            const matchesSeason = filterSeason === 'all' || p.season === filterSeason

            return matchesSearch && matchesCategory && matchesLeague && matchesStatus && matchesGender && matchesSeason
        })

        if (filterStatus === 'featured') {
            return [...list].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        }
        return list
    }, [products, search, filterCategory, filterLeague, filterStatus, filterGender, filterSeason])

    return {
        products,
        filteredProducts,
        loading,
        viewMode,
        setViewMode,
        search,
        setSearch,
        filterCategory,
        setFilterCategory,
        filterLeague,
        setFilterLeague,
        filterGender,
        setFilterGender,
        filterSeason,
        setFilterSeason,
        filterStatus,
        setFilterStatus,
        showFiltersModal,
        setShowFiltersModal,
        allCategories,
        allLeagues,
        allSeasons,
        activeFiltersCount,
        handleClearFilters,
        deleteTarget,
        setDeleteTarget,
        executeDelete,
        handleDelete,
        handleToggleActive,
        handleTrending,
        handleDuplicate,
        duplicating,
        trendingProduct,
        isSuperAdmin,
    }
}
