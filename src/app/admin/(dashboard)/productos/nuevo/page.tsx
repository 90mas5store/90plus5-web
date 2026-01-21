'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { clearProductCache } from '@/lib/api'
import {
    Save, ArrowLeft, Loader2, Image as ImageIcon,
    Trash2, Plus, AlertCircle, CheckCircle, Tag, Ruler,
    DollarSign, Percent, ShieldPlus, Users, UserPlus, X
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import useToastMessage from '@/hooks/useToastMessage'
import { motion, AnimatePresence } from 'framer-motion'
import ImageUpload from '@/components/admin/ImageUpload'

interface Size {
    id: string
    label: string
}

interface Patch {
    id: string
    name: string
}

interface Variant {
    // id?: string // New variants won't have DB ID yet
    tempId: string // Internal UI ID
    version: string
    price: number
    active: boolean
    original_price: number
    active_original_price: boolean
    sizeIds: Set<string>
}

interface Player {
    id: string
    name: string
    number: number
    active: boolean
}

export default function CreateProductPage() {
    const router = useRouter()
    const supabase = createClient()
    const toast = useToastMessage()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Catálogos
    const [teams, setTeams] = useState<any[]>([])
    const [leagues, setLeagues] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [allSizes, setAllSizes] = useState<Size[]>([])
    const [allPatches, setAllPatches] = useState<Patch[]>([])
    const [availableVersions, setAvailableVersions] = useState<string[]>(['Versión Jugador', 'Versión Fan'])

    // Estado del Formulario Principal
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        slug: '',
        image_url: '',
        team_id: '',
        league_id: '',
        category_id: '',
        active: true,
        featured: false,
        sort_order: 0
    })

    // Gestión Avanzada
    const [variants, setVariants] = useState<Variant[]>([])
    const [productPatches, setProductPatches] = useState<Set<string>>(new Set<string>())
    const [selectedLeagues, setSelectedLeagues] = useState<Set<string>>(new Set<string>())
    const [variantToDelete, setVariantToDelete] = useState<string | null>(null)

    // Players Management
    const [teamPlayers, setTeamPlayers] = useState<Player[]>([])
    const [newPlayer, setNewPlayer] = useState({ name: '', number: '' })
    const [addingPlayer, setAddingPlayer] = useState(false)

    // Initial Load
    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Cargar catálogos
                const [teamsRes, leaguesRes, catsRes, sizesRes, patchesRes] = await Promise.all([
                    supabase.from('teams').select('id, name').order('name'),
                    supabase.from('leagues').select('id, name').order('name'),
                    supabase.from('categories').select('id, name').order('name'),
                    supabase.from('sizes').select('id, label, sort_order').eq('active', true).order('sort_order'),
                    supabase.from('patches').select('id, name').eq('active', true).order('name')
                ])

                setTeams(teamsRes.data || [])
                setLeagues(leaguesRes.data || [])
                setCategories(catsRes.data || [])
                setAllSizes(sizesRes.data || [])
                setAllPatches(patchesRes.data || [])

                // 2.0 Cargar Versiones Existentes (para el dropdown) - Opcional, pero útil para sugerencias
                const { data: allVariants } = await supabase
                    .from('product_variants')
                    .select('version')

                if (allVariants) {
                    const unique: string[] = Array.from(new Set<string>((allVariants as any[]).map((v) => String(v.version)))).sort()
                    if (unique.length > 0) setAvailableVersions(unique)
                }

                // Default variants suggestion (optional)
                const defaultVariant: Variant = {
                    tempId: `default_${Date.now()}`,
                    version: 'Versión Fan',
                    price: 1200,
                    active: true,
                    original_price: 0,
                    active_original_price: false,
                    sizeIds: new Set(sizesRes.data?.map((s: any) => s.id) || [])
                }
                setVariants([defaultVariant])

            } catch (error: any) {
                console.error('Error cargando catálogos:', error)
                toast.error('Error al cargar datos iniciales')
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [])


    // Handlers Generales
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }))
    }

    // --- Variants Handlers ---
    const addVariant = () => {
        const newVariant: Variant = {
            tempId: `new_${Date.now()}`,
            version: 'Versión Jugador', // Default fallback
            price: 1400,
            active: true,
            original_price: 0,
            active_original_price: false,
            sizeIds: new Set(allSizes.map(s => s.id)) // Pre-select all sizes for convenience? Or empty? Better pre-select common sizes or empty. Let's do all.
        }
        setVariants([...variants, newVariant])
    }

    const removeVariant = (tempId: string) => {
        setVariantToDelete(tempId) // UI consistency
    }

    const handleConfirmDelete = () => {
        if (variantToDelete) {
            setVariants(prev => prev.filter(v => v.tempId !== variantToDelete))
            setVariantToDelete(null)
            toast.success('Variante eliminada')
        }
    }

    const updateVariant = (tempId: string, field: keyof Variant, value: any) => {
        setVariants(variants.map(v => v.tempId === tempId ? { ...v, [field]: value } : v))
    }

    const toggleVariantSize = (tempId: string, sizeId: string) => {
        setVariants(variants.map(v => {
            if (v.tempId !== tempId) return v
            const newSizes = new Set(v.sizeIds)
            if (newSizes.has(sizeId)) newSizes.delete(sizeId)
            else newSizes.add(sizeId)
            return { ...v, sizeIds: newSizes }
        }))
    }

    // --- Patches Handlers ---
    const toggleProductPatch = (patchId: string) => {
        setProductPatches(prev => {
            const next = new Set(prev)
            if (next.has(patchId)) next.delete(patchId)
            else next.add(patchId)
            return next
        })
    }

    // --- Players Handlers ---
    useEffect(() => {
        if (!formData.team_id) {
            setTeamPlayers([])
            return
        }

        const fetchPlayers = async () => {
            const { data } = await supabase
                .from('players')
                .select('*')
                .eq('team_id', formData.team_id)
                .is('active', true)
                .order('number', { ascending: true })

            if (data) setTeamPlayers(data)
        }

        fetchPlayers()
    }, [formData.team_id, supabase])

    const handleAddPlayer = async () => {
        if (!newPlayer.name || !newPlayer.number || !formData.team_id) return

        setAddingPlayer(true)
        try {
            const { data, error } = await supabase
                .from('players')
                .insert({
                    name: newPlayer.name,
                    number: parseInt(newPlayer.number),
                    team_id: formData.team_id,
                    active: true
                })
                .select()
                .single()

            if (error) throw error

            setTeamPlayers(prev => [...prev, data].sort((a, b) => a.number - b.number))
            setNewPlayer({ name: '', number: '' })
            toast.success('Jugador agregado al equipo')
        } catch (error: any) {
            console.error('Error adding player:', error)
            toast.error('Error al agregar jugador')
        } finally {
            setAddingPlayer(false)
        }
    }

    const handleDeletePlayer = async (playerId: string) => {
        if (!confirm('¿Eliminar jugador de la lista del equipo?')) return

        try {
            const { error } = await supabase
                .from('players')
                .update({ active: false }) // Soft delete
                .eq('id', playerId)

            if (error) throw error

            setTeamPlayers(prev => prev.filter(p => p.id !== playerId))
            toast.success('Jugador eliminado')
        } catch (error: any) {
            console.error('Error deleting player:', error)
            toast.error('Error al eliminar jugador')
        }
    }

    // --- SAVE LOGIC ---
    const handleSave = async () => {
        if (!formData.name || !formData.slug) {
            toast.error('Nombre y Slug son obligatorios')
            return
        }

        setSaving(true)
        try {
            // 1. Insert Product Basic Info
            const { data: newProd, error: prodError } = await supabase
                .from('products')
                .insert({
                    name: formData.name,
                    description: formData.description,
                    slug: formData.slug,
                    image_url: formData.image_url,
                    team_id: formData.team_id || null,
                    league_id: selectedLeagues.size > 0 ? Array.from(selectedLeagues)[0] : (formData.league_id || null),
                    category_id: formData.category_id || null,
                    active: formData.active,
                    featured: formData.featured,
                    sort_order: formData.sort_order
                })
                .select('id')
                .single()

            if (prodError) throw prodError
            const createdId = newProd.id

            // 2. Insert Product Patches
            if (productPatches.size > 0) {
                const patchesPayload = Array.from(productPatches).map(pid => ({
                    product_id: createdId,
                    patch_id: pid
                }))
                const { error: patchError } = await supabase.from('product_patches').insert(patchesPayload)
                if (patchError) throw patchError
            }

            // 2.1 Insert Product Leagues (Multi-League)
            if (selectedLeagues.size > 0) {
                const leaguesPayload = Array.from(selectedLeagues).map(lid => ({
                    product_id: createdId,
                    league_id: lid
                }))
                const { error: leagueError } = await supabase.from('product_leagues').insert(leaguesPayload)
                if (leagueError) throw leagueError
            }

            // 3. Insert Variants & Sizes
            for (const v of variants) {
                // Insert Variant
                const { data: newV, error: inError } = await supabase
                    .from('product_variants')
                    .insert({
                        product_id: createdId,
                        version: v.version,
                        price: v.price,
                        active: v.active,
                        original_price: v.original_price,
                        active_original_price: v.active_original_price
                    })
                    .select('id')
                    .single()

                if (inError) throw inError
                const variantId = newV.id

                // Insert Variant Sizes
                if (v.sizeIds.size > 0) {
                    const sizesPayload = Array.from(v.sizeIds).map(sid => ({
                        variant_id: variantId,
                        size_id: sid,
                        active: true
                    }))
                    const { error: szError } = await supabase.from('variant_sizes').insert(sizesPayload)
                    if (szError) throw szError
                }
            }

            clearProductCache()
            toast.success('Producto creado exitosamente')
            router.push('/admin/productos')

        } catch (error: any) {
            console.error('❌ Error al crear:', error)
            toast.error(`Error: ${error.message}`)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-neutral-950">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    )

    return (
        <div className="max-w-6xl mx-auto pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">

            {/* --- DELETE CONFIRMATION MODAL --- */}
            <AnimatePresence>
                {variantToDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setVariantToDelete(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#111] border border-white/10 p-6 rounded-2xl max-w-sm w-full shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-900" />

                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                                    <Trash2 className="w-6 h-6 text-red-500" />
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-white">¿Eliminar Variante?</h3>
                                    <p className="text-gray-400 text-sm mt-2">
                                        Eliminarás esta variante de la lista de creación.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 w-full pt-2">
                                    <button
                                        onClick={() => setVariantToDelete(null)}
                                        className="py-3 rounded-xl border border-white/10 font-bold text-sm text-gray-400 hover:bg-white/5 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleConfirmDelete}
                                        className="py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors shadow-lg shadow-red-900/20"
                                    >
                                        Sí, Eliminar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HEADER */}
            <div className="sticky top-0 z-30 bg-neutral-950/80 backdrop-blur-xl border-b border-white/5 pb-4 mb-8 pt-6 -mx-4 px-4 md:mx-0 md:px-0 md:pt-8 md:pb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/productos" className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Nuevo Producto</h1>
                            <p className="text-gray-400 text-xs font-mono opacity-60">Crear un nuevo ítem en el catálogo</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-primary hover:bg-primary/90 text-black px-8 py-3 rounded-xl font-black text-sm uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transform hover:-translate-y-1 active:translate-y-0"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {saving ? 'Creando...' : 'Crear Producto'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

                {/* COLUMNA IZQUIERDA: Info Principal */}
                <div className="lg:col-span-8 space-y-8">

                    {/* 1. INFORMACIÓN BÁSICA */}
                    <section className="bg-neutral-900/50 border border-white/5 rounded-3xl p-8 md:p-10 space-y-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <Tag className="w-5 h-5 text-blue-500" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Información Básica</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">Nombre del Producto</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium text-lg placeholder:text-gray-700"
                                    placeholder="Ej: Camiseta Local Real Madrid 2024"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">Descripción</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-700 resize-none"
                                    placeholder="Detalles de la camiseta, materiales, historia..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">Slug (URL)</label>
                                <div className="flex bg-black/50 border border-white/10 rounded-xl overflow-hidden focus-within:border-primary transition-colors">
                                    <span className="bg-white/5 px-4 py-3 text-gray-500 text-sm border-r border-white/10 flex items-center">/producto/</span>
                                    <input
                                        type="text"
                                        name="slug"
                                        value={formData.slug}
                                        onChange={handleChange}
                                        className="flex-1 bg-transparent p-3 text-sm text-white outline-none font-mono"
                                        placeholder="camiseta-local-madrid-24"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 1.5. JUGADORES (DORSALES) */}
                    {formData.team_id && (
                        <section className="bg-neutral-900/50 border border-white/5 rounded-3xl p-8 md:p-10 space-y-8">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                    <Users className="w-5 h-5 text-purple-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Plantilla del Equipo</h2>
                                    <p className="text-gray-500 text-xs">Administra los dorsales disponibles para este equipo.</p>
                                </div>
                            </div>

                            <div className="bg-black/30 rounded-xl border border-white/5 overflow-hidden">
                                {/* Lista de Jugadores */}
                                {teamPlayers.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-4 max-h-60 overflow-y-auto custom-scrollbar">
                                        {teamPlayers.map(player => (
                                            <div key={player.id} className="flex items-center justify-between bg-white/5 hover:bg-white/10 p-2 pl-3 rounded-lg group transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-black text-purple-400 w-6 text-right">{player.number}</span>
                                                    <span className="text-sm font-bold text-gray-300 truncate max-w-[100px]">{player.name}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleDeletePlayer(player.id)}
                                                    className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-gray-500 text-xs italic">
                                        No hay jugadores registrados para este equipo.
                                    </div>
                                )}

                                {/* Agregar Jugador Form */}
                                <div className="p-4 bg-white/[0.02] border-t border-white/5 flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="#"
                                        className="w-16 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-center font-bold text-white focus:border-purple-500 outline-none"
                                        value={newPlayer.number}
                                        onChange={e => setNewPlayer(prev => ({ ...prev, number: e.target.value }))}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Nombre del Jugador"
                                        className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-white focus:border-purple-500 outline-none"
                                        value={newPlayer.name}
                                        onChange={e => setNewPlayer(prev => ({ ...prev, name: e.target.value }))}
                                        onKeyDown={e => e.key === 'Enter' && handleAddPlayer()}
                                    />
                                    <button
                                        onClick={handleAddPlayer}
                                        disabled={!newPlayer.name || !newPlayer.number || addingPlayer}
                                        className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {addingPlayer ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 2. VARIANTES Y PRECIOS (GESTIÓN AVANZADA) */}
                    <section className="bg-neutral-900/50 border border-white/5 rounded-3xl p-8 md:p-10 space-y-8 relative overflow-hidden">
                        {/* Decorative blob */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                    <DollarSign className="w-5 h-5 text-green-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Variantes y Precios</h2>
                                    <p className="text-gray-500 text-xs">Administra versiones (Jugador, Fan) y sus tallas/precios.</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={addVariant}
                                className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-white/10 transition-all"
                            >
                                <Plus className="w-4 h-4" /> Agregar Variante
                            </button>
                        </div>

                        <div className="space-y-4">
                            <AnimatePresence>
                                {variants.map((variant, index) => (
                                    <motion.div
                                        key={variant.tempId}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className={`bg-[#0A0A0A] border ${variant.active ? 'border-white/10' : 'border-red-900/30 bg-red-950/10'} rounded-3xl p-8 transition-all hover:border-white/20`}
                                    >
                                        <div className="flex flex-col gap-6">
                                            {/* ROW 1: Header & Actions */}
                                            <div className="flex items-start justify-between gap-4">
                                                {/* Version Selector */}
                                                <div className="flex-1 max-w-sm">
                                                    <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">
                                                        Nombre Versión
                                                    </label>
                                                    <select
                                                        value={variant.version}
                                                        onChange={(e) => updateVariant(variant.tempId, 'version', e.target.value)}
                                                        className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none font-bold transition-all hover:bg-neutral-800"
                                                    >
                                                        {availableVersions.map(ver => (
                                                            <option key={ver} value={ver}>{ver}</option>
                                                        ))}
                                                        {!availableVersions.includes(variant.version) && (
                                                            <option value={variant.version}>{variant.version}</option>
                                                        )}
                                                    </select>
                                                </div>

                                                {/* Right Actions: Active Toggle & Delete */}
                                                <div className="flex items-center gap-2 pt-6">
                                                    <div
                                                        onClick={() => updateVariant(variant.tempId, 'active', !variant.active)}
                                                        className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl px-4 py-2 cursor-pointer transition-all group"
                                                    >
                                                        <span className={`text-xs font-bold uppercase ${variant.active ? 'text-green-500' : 'text-gray-500'}`}>
                                                            {variant.active ? 'Visible' : 'Oculto'}
                                                        </span>
                                                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${variant.active ? 'bg-green-500' : 'bg-gray-700'}`}>
                                                            <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${variant.active ? 'translate-x-4' : 'translate-x-0'}`} />
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => removeVariant(variant.tempId)}
                                                        className="p-3 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
                                                        title="Eliminar Variante"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* ROW 2: Pricing Logic */}
                                            <div className="bg-black/20 rounded-xl p-4 border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Base Price */}
                                                <div>
                                                    <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">
                                                        Precio (HNL)
                                                    </label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">L</span>
                                                        <input
                                                            type="number"
                                                            value={variant.price}
                                                            onChange={(e) => updateVariant(variant.tempId, 'price', Number(e.target.value))}
                                                            className="w-full bg-neutral-900 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:border-primary outline-none font-mono"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Promo Logic */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="text-xs font-bold uppercase text-gray-500 block">
                                                            Oferta / Descuento
                                                        </label>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={variant.active_original_price}
                                                                onChange={(e) => updateVariant(variant.tempId, 'active_original_price', e.target.checked)}
                                                                id={`promo-${variant.tempId}`}
                                                                className="accent-yellow-500 w-3.5 h-3.5 rounded cursor-pointer"
                                                            />
                                                            <label htmlFor={`promo-${variant.tempId}`} className="text-[10px] font-bold uppercase text-yellow-500/80 cursor-pointer select-none">
                                                                Activar
                                                            </label>
                                                        </div>
                                                    </div>

                                                    <div className="relative">
                                                        {variant.active_original_price ? (
                                                            <>
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-mono">Antes:</span>
                                                                <input
                                                                    type="number"
                                                                    value={variant.original_price}
                                                                    onChange={(e) => updateVariant(variant.tempId, 'original_price', Number(e.target.value))}
                                                                    className="w-full bg-neutral-900 border border-yellow-500/30 rounded-xl pl-14 pr-4 py-3 text-sm text-yellow-500 focus:border-yellow-500 outline-none font-mono"
                                                                    placeholder="0.00"
                                                                />
                                                            </>
                                                        ) : (
                                                            <div className="w-full py-3 px-4 bg-white/5 border border-dashed border-white/10 rounded-xl text-xs text-gray-600 italic select-none text-center">
                                                                Precio normal (sin tachado)
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ROW 3: Sizes */}
                                            <div>
                                                <label className="text-xs font-bold uppercase text-gray-500 mb-3 flex items-center gap-2">
                                                    <Ruler className="w-3 h-3" /> Tallas Disponibles
                                                </label>
                                                <div className="flex flex-wrap gap-2">
                                                    {allSizes.map(size => {
                                                        const isSelected = variant.sizeIds.has(size.id)
                                                        return (
                                                            <button
                                                                key={size.id}
                                                                type="button"
                                                                onClick={() => toggleVariantSize(variant.tempId, size.id)}
                                                                className={`
                                                                    min-w-[40px] h-[40px] px-3 rounded-lg text-xs font-bold border transition-all duration-200
                                                                    ${isSelected
                                                                        ? 'bg-white text-black border-white shadow-[0_2px_10px_rgba(255,255,255,0.2)] transform -translate-y-0.5'
                                                                        : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30 hover:text-gray-300'
                                                                    }
                                                                `}
                                                            >
                                                                {size.label}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {variants.length === 0 && (
                                <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                                    <p className="text-gray-500 mb-2">Este producto no tiene variantes configuradas.</p>
                                    <button onClick={addVariant} type="button" className="text-primary text-sm font-bold hover:underline">
                                        + Agregar mi primera variante
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* COLUMNA DERECHA: Configuración Lateral */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Estado Global */}
                    <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6 space-y-4">
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Visibilidad Global</h2>

                        <label className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl cursor-pointer hover:bg-black/60 transition-colors group">
                            <span className="font-medium text-white flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${formData.active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></span>
                                Producto Activo
                            </span>
                            <input
                                type="checkbox"
                                name="active"
                                checked={formData.active}
                                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                                className="w-5 h-5 accent-primary rounded cursor-pointer"
                            />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl cursor-pointer hover:bg-black/60 transition-colors">
                            <span className="font-medium text-white flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${formData.featured ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]' : 'bg-gray-700'}`}></span>
                                Destacado (Home)
                            </span>
                            <input
                                type="checkbox"
                                name="featured"
                                checked={formData.featured}
                                onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                                className="w-5 h-5 accent-yellow-500 rounded cursor-pointer"
                            />
                        </label>

                        {/* Orden para Destacados */}
                        {formData.featured && (
                            <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">Orden / Prioridad</label>
                                <input
                                    type="number"
                                    name="sort_order"
                                    value={formData.sort_order}
                                    onChange={handleChange}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-yellow-500 outline-none transition-all font-mono"
                                    placeholder="0"
                                />
                            </div>
                        )}
                    </div>

                    {/* Clasificación */}
                    <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6 space-y-4">
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Clasificación</h2>

                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">Equipo</label>
                            <select
                                name="team_id"
                                value={formData.team_id}
                                onChange={handleChange}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none transition-colors appearance-none"
                            >
                                <option value="">Seleccionar Equipo</option>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">Ligas / Competiciones</label>
                            <div className="bg-black/50 border border-white/10 rounded-xl p-3 max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                                {leagues.map(l => {
                                    const isSelected = selectedLeagues.has(l.id)
                                    return (
                                        <div
                                            key={l.id}
                                            onClick={() => setSelectedLeagues(prev => {
                                                const next = new Set(prev)
                                                if (next.has(l.id)) next.delete(l.id)
                                                else next.add(l.id)
                                                return next
                                            })}
                                            className={`
                                                flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors
                                                ${isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-white/5 border border-transparent'}
                                            `}
                                        >
                                            <div className={`
                                                w-4 h-4 rounded border flex items-center justify-center transition-colors
                                                ${isSelected ? 'bg-primary border-primary' : 'border-white/30'}
                                            `}>
                                                {isSelected && <CheckCircle className="w-3 h-3 text-black" />}
                                            </div>
                                            <span className={`text-sm ${isSelected ? 'text-primary font-bold' : 'text-gray-400'}`}>
                                                {l.name}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                            <p className="text-[10px] text-gray-600 mt-1 ml-1">* Selecciona todas las que apliquen (Ej: LaLiga + Champions)</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2 ml-1">Categoría</label>
                            <select
                                name="category_id"
                                value={formData.category_id}
                                onChange={handleChange}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none transition-colors appearance-none"
                            >
                                <option value="">Seleccionar Categoría</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Imagen Principal */}
                    <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6">
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Imagen Principal</h2>

                        <ImageUpload
                            value={formData.image_url}
                            onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                        />
                    </div>

                    {/* Parches (Gestión Avanzada) */}
                    <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6 space-y-4">
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            Parches Disponibles
                        </h2>

                        {/* Selector de Parches - Solo selección */}
                        <div className="flex flex-wrap gap-2">
                            {allPatches.map(patch => {
                                const isSelected = productPatches.has(patch.id)
                                return (
                                    <button
                                        key={patch.id}
                                        type="button"
                                        onClick={() => toggleProductPatch(patch.id)}
                                        className={`
                                            px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 tracking-wide
                                            ${isSelected
                                                ? 'bg-primary/20 text-primary border-primary'
                                                : 'bg-black/30 text-gray-500 border-white/10 hover:border-white/30 hover:text-gray-300'
                                            }
                                        `}
                                    >
                                        {patch.name}
                                    </button>
                                )
                            })}
                            {allPatches.length === 0 && <span className="text-xs text-gray-600">No hay parches en el catálogo.</span>}
                        </div>
                    </div>
                </div>
            </div >
        </div >
    )
}
