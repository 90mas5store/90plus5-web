'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Tag, Plus, ToggleLeft, ToggleRight, Loader2,
    X, Save, RefreshCw, ExternalLink, Percent,
    Calendar, Hash, AlertCircle, ChevronDown
} from 'lucide-react'
import useToastMessage from '@/hooks/useToastMessage'
import {
    createDiscountCode,
    updateDiscountCode,
    toggleDiscountCode,
    deleteDiscountCode,
} from '@/app/admin/discount-actions'

interface DiscountCode {
    id: string
    code: string
    description: string | null
    discount_pct: number
    category_ids: string[]
    league_ids: string[]
    team_ids: string[]
    max_uses: number | null
    used_count: number
    expires_at: string | null
    active: boolean
    created_by: string
    created_at: string
}

interface UsageRow {
    id: string
    code_id: string
    order_id: string
    customer_email: string
    discount_amount: number
    created_at: string
    discount_codes: { code: string; discount_pct: number } | null
}

interface CatalogItem { id: string; name: string }

function generateCode(length = 8) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)]
    }
    return result
}

const emptyForm = {
    code: '',
    description: '',
    discount_pct: 10,
    category_ids: [] as string[],
    league_ids: [] as string[],
    team_ids: [] as string[],
    max_uses: '' as string | number,
    expires_at: '',
    active: true,
}

export default function DescuentosPage() {
    const supabaseRef = useRef(createClient())
    const supabase = supabaseRef.current
    const toast = useToastMessage() as { success: (m: string) => void; error: (m: string) => void; info: (m: string) => void }

    const [tab, setTab] = useState<'codes' | 'audit'>('codes')
    const [codes, setCodes] = useState<DiscountCode[]>([])
    const [usage, setUsage] = useState<UsageRow[]>([])
    const [loading, setLoading] = useState(true)
    const [toggling, setToggling] = useState<string | null>(null)

    // Catalogs
    const [categories, setCategories] = useState<CatalogItem[]>([])
    const [leagues, setLeagues] = useState<CatalogItem[]>([])
    const [teams, setTeams] = useState<CatalogItem[]>([])

    // Modal
    const [modalOpen, setModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState({ ...emptyForm })
    const [saving, setSaving] = useState(false)

    // Audit filter
    const [auditFilter, setAuditFilter] = useState('')

    const fetchData = async () => {
        setLoading(true)
        const [codesRes, usageRes] = await Promise.all([
            supabase
                .from('discount_codes')
                .select('*')
                .order('created_at', { ascending: false }),
            supabase
                .from('discount_code_usage')
                .select('*, discount_codes(code, discount_pct)')
                .order('created_at', { ascending: false })
                .limit(200),
        ])
        setCodes(codesRes.data ?? [])
        setUsage(usageRes.data ?? [])
        setLoading(false)
    }

    const fetchCatalogs = async () => {
        const [catRes, leagRes, teamRes] = await Promise.all([
            supabase.from('categories').select('id, name').is('deleted_at', null).eq('active', true).order('name'),
            supabase.from('leagues').select('id, name').is('deleted_at', null).eq('active', true).order('name'),
            supabase.from('teams').select('id, name').is('deleted_at', null).eq('active', true).order('name'),
        ])
        setCategories(catRes.data ?? [])
        setLeagues(leagRes.data ?? [])
        setTeams(teamRes.data ?? [])
    }

    useEffect(() => {
        fetchData()
        fetchCatalogs()
    }, [])

    const openNew = () => {
        setEditingId(null)
        setForm({ ...emptyForm })
        setModalOpen(true)
    }

    const openEdit = (dc: DiscountCode) => {
        setEditingId(dc.id)
        setForm({
            code: dc.code,
            description: dc.description ?? '',
            discount_pct: dc.discount_pct,
            category_ids: dc.category_ids ?? [],
            league_ids: dc.league_ids ?? [],
            team_ids: dc.team_ids ?? [],
            max_uses: dc.max_uses ?? '',
            expires_at: dc.expires_at ? dc.expires_at.slice(0, 16) : '',
            active: dc.active,
        })
        setModalOpen(true)
    }

    const handleSave = async () => {
        if (!form.code.trim()) { toast.error('El código es requerido'); return }
        if (form.discount_pct <= 0 || form.discount_pct > 100) { toast.error('El % debe estar entre 1 y 100'); return }

        setSaving(true)
        try {
            const payload = {
                code: form.code,
                description: form.description || undefined,
                discount_pct: Number(form.discount_pct),
                category_ids: form.category_ids,
                league_ids: form.league_ids,
                team_ids: form.team_ids,
                max_uses: form.max_uses !== '' ? Number(form.max_uses) : null,
                expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
                active: form.active,
            }
            if (editingId) {
                await updateDiscountCode(editingId, payload)
            } else {
                await createDiscountCode(payload)
            }
            toast.success(editingId ? 'Código actualizado' : 'Código creado')
            setModalOpen(false)
            fetchData()
        } catch (err: unknown) {
            toast.error((err as Error).message || 'Error al guardar')
        } finally {
            setSaving(false)
        }
    }

    const handleToggle = async (id: string, current: boolean) => {
        setToggling(id)
        try {
            await toggleDiscountCode(id, !current)
            setCodes(prev => prev.map(c => c.id === id ? { ...c, active: !current } : c))
        } catch {
            toast.error('Error al cambiar estado')
        } finally {
            setToggling(null)
        }
    }

    const handleDelete = async (id: string, code: string) => {
        if (!confirm(`¿Eliminar el código "${code}"? Esta acción no se puede deshacer.`)) return
        try {
            await deleteDiscountCode(id)
            toast.success('Código eliminado')
            fetchData()
        } catch {
            toast.error('Error al eliminar')
        }
    }

    const toggleMultiSelect = (list: string[], id: string, setter: (v: string[]) => void) => {
        if (list.includes(id)) {
            setter(list.filter(i => i !== id))
        } else {
            setter([...list, id])
        }
    }

    const filteredUsage = auditFilter
        ? usage.filter(u => u.discount_codes?.code === auditFilter || u.customer_email.includes(auditFilter))
        : usage

    const buildScopeLabel = (dc: DiscountCode) => {
        const parts: string[] = []
        if (dc.category_ids?.length) parts.push(`${dc.category_ids.length} cat.`)
        if (dc.league_ids?.length) parts.push(`${dc.league_ids.length} liga(s)`)
        if (dc.team_ids?.length) parts.push(`${dc.team_ids.length} equipo(s)`)
        return parts.length ? parts.join(' · ') : 'Todos'
    }

    const formatDate = (d: string | null) => {
        if (!d) return '—'
        return new Date(d).toLocaleDateString('es-HN', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    const uniqueCodes = [...new Set(usage.map(u => u.discount_codes?.code).filter(Boolean))] as string[]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                        <Tag className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Descuentos</h1>
                        <p className="text-xs text-gray-500 font-medium">Códigos de descuento porcentual</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all border border-white/5"
                        title="Recargar"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={openNew}
                        className="flex items-center gap-2 bg-white text-black font-black text-sm px-4 py-2 rounded-xl hover:bg-gray-100 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo código
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
                {(['codes', 'audit'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-6 py-3 text-sm font-bold uppercase tracking-widest transition-all border-b-2 ${tab === t
                            ? 'border-white text-white'
                            : 'border-transparent text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        {t === 'codes' ? 'Códigos' : 'Auditoría'}
                    </button>
                ))}
            </div>

            {/* Tab: Códigos */}
            {tab === 'codes' && (
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                    ) : codes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                            <Tag className="w-10 h-10 mb-3 opacity-30" />
                            <p className="font-bold text-sm">No hay códigos de descuento</p>
                            <button onClick={openNew} className="mt-4 text-xs text-white underline">Crear el primero</button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Código</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden md:table-cell">Descripción</th>
                                        <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">%</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden lg:table-cell">Alcance</th>
                                        <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Usos</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden md:table-cell">Expira</th>
                                        <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Estado</th>
                                        <th className="px-4 py-3" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {codes.map((dc) => (
                                        <tr key={dc.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-3">
                                                <span className="font-black text-white tracking-widest text-xs bg-white/10 px-2 py-1 rounded-lg">
                                                    {dc.code}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell max-w-[180px] truncate">
                                                {dc.description || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="font-black text-green-400 text-sm">{dc.discount_pct}%</span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                                                {buildScopeLabel(dc)}
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-300 text-xs font-bold">
                                                {dc.used_count}{dc.max_uses ? `/${dc.max_uses}` : ''}
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">
                                                {formatDate(dc.expires_at)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleToggle(dc.id, dc.active)}
                                                    disabled={toggling === dc.id}
                                                    className="transition-all"
                                                >
                                                    {toggling === dc.id ? (
                                                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                                    ) : dc.active ? (
                                                        <ToggleRight className="w-6 h-6 text-green-400" />
                                                    ) : (
                                                        <ToggleLeft className="w-6 h-6 text-gray-600" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openEdit(dc)}
                                                        className="text-xs font-bold text-gray-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-all"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(dc.id, dc.code)}
                                                        className="text-xs font-bold text-red-500/60 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/5 transition-all"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Auditoría */}
            {tab === 'audit' && (
                <div className="space-y-4">
                    {/* Filter */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 max-w-xs">
                            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                            <select
                                value={auditFilter}
                                onChange={e => setAuditFilter(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-medium outline-none appearance-none"
                            >
                                <option value="">Todos los códigos</option>
                                {uniqueCodes.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">{filteredUsage.length} registros</span>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                            </div>
                        ) : filteredUsage.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                                <AlertCircle className="w-8 h-8 mb-2 opacity-30" />
                                <p className="font-bold text-sm">Sin registros de uso</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pedido</th>
                                            <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Cliente</th>
                                            <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Código</th>
                                            <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">%</th>
                                            <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Desc.</th>
                                            <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden md:table-cell">Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsage.map(u => (
                                            <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                                <td className="px-4 py-3">
                                                    <a
                                                        href={`/admin/orders/${u.order_id}`}
                                                        className="text-xs font-black text-primary hover:underline flex items-center gap-1"
                                                    >
                                                        {u.order_id.slice(0, 8).toUpperCase()}
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </td>
                                                <td className="px-4 py-3 text-gray-300 text-xs font-medium">{u.customer_email}</td>
                                                <td className="px-4 py-3">
                                                    <span className="font-black text-xs bg-white/10 px-2 py-0.5 rounded-lg text-white tracking-widest">
                                                        {u.discount_codes?.code ?? '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center text-green-400 font-black text-xs">
                                                    {u.discount_codes?.discount_pct ?? '—'}%
                                                </td>
                                                <td className="px-4 py-3 text-right text-white font-black text-xs">
                                                    L{u.discount_amount.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">
                                                    {formatDate(u.created_at)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL */}
            {modalOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
                        onClick={() => setModalOpen(false)}
                    />
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <div className="bg-[#111] border border-white/10 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90dvh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/10">
                                <h2 className="text-lg font-black text-white">
                                    {editingId ? 'Editar Código' : 'Nuevo Código de Descuento'}
                                </h2>
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-5">
                                {/* Código */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                        <Hash className="w-3 h-3" /> Código *
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            value={form.code}
                                            onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                                            placeholder="Ej. VERANO25"
                                            className="flex-1 px-4 py-3 rounded-2xl bg-black/40 border border-white/10 focus:border-white/30 outline-none text-white font-black tracking-widest"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setForm(p => ({ ...p, code: generateCode() }))}
                                            className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-xs font-bold"
                                        >
                                            Generar
                                        </button>
                                    </div>
                                </div>

                                {/* Descripción */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Descripción</label>
                                    <input
                                        value={form.description}
                                        onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                        placeholder="Ej. Promoción de verano"
                                        className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 focus:border-white/30 outline-none text-white font-medium"
                                    />
                                </div>

                                {/* % Descuento */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                        <Percent className="w-3 h-3" /> % de Descuento *
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        step={0.01}
                                        value={form.discount_pct}
                                        onChange={e => setForm(p => ({ ...p, discount_pct: Number(e.target.value) }))}
                                        className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 focus:border-white/30 outline-none text-white font-black"
                                    />
                                </div>

                                {/* Alcance: Categorías */}
                                {categories.length > 0 && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                            Categorías <span className="text-gray-600">(vacío = todas)</span>
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {categories.map(c => (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onClick={() => toggleMultiSelect(
                                                        form.category_ids, c.id,
                                                        v => setForm(p => ({ ...p, category_ids: v }))
                                                    )}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${form.category_ids.includes(c.id)
                                                        ? 'bg-primary/20 border-primary/40 text-white'
                                                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                                                        }`}
                                                >
                                                    {c.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Alcance: Ligas */}
                                {leagues.length > 0 && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                            Ligas <span className="text-gray-600">(vacío = todas)</span>
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {leagues.map(l => (
                                                <button
                                                    key={l.id}
                                                    type="button"
                                                    onClick={() => toggleMultiSelect(
                                                        form.league_ids, l.id,
                                                        v => setForm(p => ({ ...p, league_ids: v }))
                                                    )}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${form.league_ids.includes(l.id)
                                                        ? 'bg-primary/20 border-primary/40 text-white'
                                                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                                                        }`}
                                                >
                                                    {l.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Alcance: Equipos */}
                                {teams.length > 0 && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                            Equipos <span className="text-gray-600">(vacío = todos)</span>
                                        </label>
                                        <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto custom-scrollbar">
                                            {teams.map(t => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => toggleMultiSelect(
                                                        form.team_ids, t.id,
                                                        v => setForm(p => ({ ...p, team_ids: v }))
                                                    )}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${form.team_ids.includes(t.id)
                                                        ? 'bg-primary/20 border-primary/40 text-white'
                                                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                                                        }`}
                                                >
                                                    {t.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Máximo usos */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                        Máximo de usos <span className="text-gray-600">(vacío = ilimitado)</span>
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={form.max_uses}
                                        onChange={e => setForm(p => ({ ...p, max_uses: e.target.value }))}
                                        placeholder="Sin límite"
                                        className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 focus:border-white/30 outline-none text-white font-medium"
                                    />
                                </div>

                                {/* Fecha de expiración */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> Expira <span className="text-gray-600">(vacío = sin límite)</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={form.expires_at}
                                        onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 focus:border-white/30 outline-none text-white font-medium"
                                    />
                                </div>

                                {/* Activo */}
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <span className="text-sm font-bold text-white">Código activo</span>
                                    <button
                                        type="button"
                                        onClick={() => setForm(p => ({ ...p, active: !p.active }))}
                                        className="transition-all"
                                    >
                                        {form.active
                                            ? <ToggleRight className="w-7 h-7 text-green-400" />
                                            : <ToggleLeft className="w-7 h-7 text-gray-600" />
                                        }
                                    </button>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="px-5 py-3 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black text-sm font-black hover:bg-gray-100 transition-all disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {editingId ? 'Guardar cambios' : 'Crear código'}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
