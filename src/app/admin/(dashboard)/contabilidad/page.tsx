'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    DollarSign, TrendingUp, TrendingDown, Percent,
    Filter, Calculator, Loader2, CreditCard,
    Building2, Package, ChevronDown, AlertCircle,
} from 'lucide-react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
    quantity: number
    unit_price: number
    product_variants: { cost: number | null } | null
    products: { name: string; teams: { name: string } | null } | null
}

interface Payment {
    amount: number
    method: string | null
    notes: string | null
    status: string
    type: string | null
}

interface AccountingOrder {
    id: string
    created_at: string
    status: string
    total_amount: number
    subtotal: number | null
    customer_name: string
    order_items: OrderItem[]
    payments: Payment[]
}

interface OrderMetrics {
    order: AccountingOrder
    revenue: number
    productRevenue: number
    shippingRevenue: number
    productCost: number
    shippingCost: number
    totalCost: number
    grossProfit: number
    marginPct: number
    verifiedPaid: number
    missingCosts: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SHIPPING_COST = 120

const STATUS_OPTIONS = [
    { value: 'pending_payment_50', label: '1. Pedido recibido', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
    { value: 'deposit_paid', label: '2. Anticipo confirmado', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
    { value: 'processing', label: '3. En proveedor', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    { value: 'in_transit', label: '4. En tránsito', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { value: 'ready_for_delivery', label: '5. Listo despachar', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
    { value: 'pending_second_payment', label: '6. Pend. 2do pago', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
    { value: 'shipped_to_costumer', label: '7. Enviado cliente', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
    { value: 'completed', label: '8. Completado', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
    { value: 'Cancelled', label: 'Cancelado', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
]

const STATUS_LABEL: Record<string, string> = {
    pending_payment_50: 'Pedido recibido',
    deposit_paid: 'Anticipo confirmado',
    processing: 'En proveedor',
    in_transit: 'En tránsito',
    ready_for_delivery: 'Listo despachar',
    pending_second_payment: 'Pend. 2do pago',
    shipped_to_costumer: 'Enviado cliente',
    completed: 'Completado',
    paid_full: 'Completado',
    shipped_to_hn: 'En tránsito',
    Cancelled: 'Cancelado',
}

const VERIFIED = ['verified', 'succeeded', 'completed']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseBankFromNotes(notes: string | null, method: string | null): string {
    if (notes) {
        const match = notes.match(/Banco:\s*([^|]+)/i)
        if (match) return match[1].trim()
    }
    return method || 'Sin especificar'
}

function fmt(n: number) {
    return `L ${Math.round(n).toLocaleString('es-HN')}`
}

function fmtPct(n: number) {
    return `${n.toFixed(1)}%`
}

function computeMetrics(order: AccountingOrder): OrderMetrics {
    const productRevenue = order.subtotal ?? 0
    const revenue = order.total_amount ?? 0
    const shippingRevenue = revenue - productRevenue

    let productCost = 0
    let missingCosts = false
    for (const item of order.order_items || []) {
        const cost = item.product_variants?.cost
        if (cost == null) { missingCosts = true; continue }
        productCost += cost * item.quantity
    }

    const shippingCost = shippingRevenue > 0 ? SHIPPING_COST : 0
    const totalCost = productCost + shippingCost
    const grossProfit = revenue - totalCost
    const marginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0
    const verifiedPaid = (order.payments || [])
        .filter(p => VERIFIED.includes(p.status))
        .reduce((s, p) => s + (p.amount ?? 0), 0)

    return {
        order, revenue, productRevenue, shippingRevenue,
        productCost, shippingCost, totalCost, grossProfit,
        marginPct, verifiedPaid, missingCosts,
    }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ContabilidadPage() {
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['all'])
    const [showStatusFilter, setShowStatusFilter] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [metrics, setMetrics] = useState<OrderMetrics[] | null>(null)

    useEffect(() => {
        const today = new Date()
        const start = new Date()
        start.setMonth(start.getMonth() - 1)
        setEndDate(today.toISOString().split('T')[0])
        setStartDate(start.toISOString().split('T')[0])
    }, [])

    const toggleStatus = (value: string) => {
        if (value === 'all') { setSelectedStatuses(['all']); return }
        let next = selectedStatuses.includes('all') ? [] : [...selectedStatuses]
        next = next.includes(value) ? next.filter(s => s !== value) : [...next, value]
        setSelectedStatuses(next.length === 0 ? ['all'] : next)
    }

    const setPreset = (preset: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all') => {
        const today = new Date()
        const end = today.toISOString().split('T')[0]
        const start = new Date()
        if (preset === 'week') start.setDate(start.getDate() - 7)
        else if (preset === 'month') start.setMonth(start.getMonth() - 1)
        else if (preset === 'quarter') start.setMonth(start.getMonth() - 3)
        else if (preset === 'year') start.setFullYear(start.getFullYear() - 1)
        else if (preset === 'all') start.setFullYear(2024, 0, 1)
        setStartDate(start.toISOString().split('T')[0])
        setEndDate(end)
    }

    const calculate = useCallback(async () => {
        if (!startDate || !endDate) return
        setLoading(true)
        setError(null)
        try {
            const statusParam = selectedStatuses.includes('all') ? 'all' : selectedStatuses.join(',')
            const params = new URLSearchParams({ startDate, endDate, status: statusParam })
            const res = await fetch(`/api/admin/reports/accounting?${params}`)
            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}))
                throw new Error(errBody.error || `HTTP ${res.status}`)
            }
            const data: AccountingOrder[] = await res.json()
            setMetrics(data.map(computeMetrics))
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error desconocido')
        } finally {
            setLoading(false)
        }
    }, [startDate, endDate, selectedStatuses])

    // ─── Aggregates ───────────────────────────────────────────────────────────

    const totals = (metrics ?? []).reduce((acc, m) => ({
        revenue: acc.revenue + m.revenue,
        productRevenue: acc.productRevenue + m.productRevenue,
        shippingRevenue: acc.shippingRevenue + m.shippingRevenue,
        productCost: acc.productCost + m.productCost,
        shippingCost: acc.shippingCost + m.shippingCost,
        totalCost: acc.totalCost + m.totalCost,
        grossProfit: acc.grossProfit + m.grossProfit,
    }), { revenue: 0, productRevenue: 0, shippingRevenue: 0, productCost: 0, shippingCost: 0, totalCost: 0, grossProfit: 0 })

    const overallMargin = totals.revenue > 0 ? (totals.grossProfit / totals.revenue) * 100 : 0
    const ordersWithMissingCosts = (metrics ?? []).filter(m => m.missingCosts).length

    // Pagos verificados agrupados por banco + método
    const paymentBreakdown: Record<string, { amount: number; count: number }> = {}
    for (const m of metrics ?? []) {
        for (const p of m.order.payments || []) {
            if (!VERIFIED.includes(p.status)) continue
            const key = parseBankFromNotes(p.notes, p.method)
            if (!paymentBreakdown[key]) paymentBreakdown[key] = { amount: 0, count: 0 }
            paymentBreakdown[key].amount += p.amount ?? 0
            paymentBreakdown[key].count += 1
        }
    }
    const paymentEntries = Object.entries(paymentBreakdown).sort((a, b) => b[1].amount - a[1].amount)
    const totalVerified = paymentEntries.reduce((s, [, v]) => s + v.amount, 0)

    // Rentabilidad por producto (Top 15)
    const productMap: Record<string, { units: number; revenue: number; cost: number; profit: number }> = {}
    for (const m of metrics ?? []) {
        for (const item of m.order.order_items || []) {
            const team = (item.products?.teams as { name: string } | null)?.name || ''
            const pname = item.products?.name || 'Desconocido'
            const key = team ? `${team} — ${pname}` : pname
            if (!productMap[key]) productMap[key] = { units: 0, revenue: 0, cost: 0, profit: 0 }
            const rev = (item.unit_price ?? 0) * item.quantity
            const cost = (item.product_variants?.cost ?? 0) * item.quantity
            productMap[key].units += item.quantity
            productMap[key].revenue += rev
            productMap[key].cost += cost
            productMap[key].profit += rev - cost
        }
    }
    const productEntries = Object.entries(productMap)
        .map(([name, v]) => ({ name, ...v, margin: v.revenue > 0 ? (v.profit / v.revenue) * 100 : 0 }))
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 15)

    const hasData = metrics !== null

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="max-w-6xl mx-auto space-y-5 pb-10">

            {/* HEADER */}
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-primary" />
                    Contabilidad
                </h1>
                <p className="text-gray-400 mt-1 text-sm">
                    Estado de resultados · Costos · Márgenes · Pagos por banco
                </p>
            </div>

            {/* FILTERS */}
            <div className="bg-neutral-900 border border-white/5 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        Período
                    </span>
                    <button
                        onClick={() => setShowStatusFilter(!showStatusFilter)}
                        className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
                    >
                        Filtrar estados
                        <ChevronDown className={`w-3 h-3 transition-transform ${showStatusFilter ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* Presets */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {(['today', 'week', 'month', 'quarter', 'year', 'all'] as const).map((p) => {
                        const labels = { today: 'Hoy', week: 'Semana', month: 'Mes', quarter: 'Trimestre', year: 'Año', all: 'Todo' }
                        return (
                            <button key={p} onClick={() => setPreset(p)}
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors text-gray-300">
                                {labels[p]}
                            </button>
                        )
                    })}
                </div>

                {/* Date inputs */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5">Desde</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-primary outline-none transition-colors" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5">Hasta</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-primary outline-none transition-colors" />
                    </div>
                </div>

                {/* Status filter */}
                {showStatusFilter && (
                    <div className="mb-4">
                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2">Estados a incluir</label>
                        <div className="flex flex-wrap gap-1.5">
                            <button onClick={() => toggleStatus('all')}
                                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${selectedStatuses.includes('all') ? 'bg-white text-black border-white' : 'bg-black/30 text-gray-400 border-white/10 hover:border-white/30'}`}>
                                Todos
                            </button>
                            {STATUS_OPTIONS.map(opt => (
                                <button key={opt.value} onClick={() => toggleStatus(opt.value)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${selectedStatuses.includes(opt.value) ? opt.color + ' border-current' : 'bg-black/30 text-gray-400 border-white/10 hover:border-white/30'}`}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <button onClick={calculate} disabled={loading || !startDate || !endDate}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black font-black rounded-xl hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                    {loading ? 'Calculando...' : 'Calcular'}
                </button>
            </div>

            {/* ERROR */}
            {error && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {/* EMPTY STATE */}
            {!hasData && !loading && (
                <div className="text-center py-20 text-gray-600">
                    <Calculator className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Selecciona un período y haz clic en &quot;Calcular&quot;</p>
                </div>
            )}

            {/* RESULTS */}
            {hasData && (
                <>
                    {/* Missing costs warning */}
                    {ordersWithMissingCosts > 0 && (
                        <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-yellow-400 text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>
                                <strong>{ordersWithMissingCosts} pedido{ordersWithMissingCosts !== 1 ? 's' : ''}</strong> contienen artículos sin costo registrado en la variante — la ganancia de esos artículos se calcula como 100% del precio de venta.
                            </span>
                        </div>
                    )}

                    {/* KPI CARDS */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <KPICard
                            label="Ingresos Totales"
                            value={fmt(totals.revenue)}
                            sub={`${metrics!.length} pedido${metrics!.length !== 1 ? 's' : ''}`}
                            icon={TrendingUp}
                            colorClass="text-green-400"
                            bgClass="bg-green-500/10 border-green-500/20"
                        />
                        <KPICard
                            label="Costos Totales"
                            value={fmt(totals.totalCost)}
                            sub="Productos + envíos"
                            icon={TrendingDown}
                            colorClass="text-red-400"
                            bgClass="bg-red-500/10 border-red-500/20"
                        />
                        <KPICard
                            label="Ganancia Bruta"
                            value={fmt(totals.grossProfit)}
                            sub={totals.grossProfit >= 0 ? 'Resultado positivo' : 'Resultado negativo'}
                            icon={DollarSign}
                            colorClass={totals.grossProfit >= 0 ? 'text-white' : 'text-red-400'}
                            bgClass={totals.grossProfit >= 0 ? 'bg-white/10 border-white/20' : 'bg-red-500/10 border-red-500/20'}
                        />
                        <KPICard
                            label="Margen Bruto"
                            value={fmtPct(overallMargin)}
                            sub={overallMargin >= 30 ? 'Saludable' : overallMargin >= 15 ? 'Aceptable' : 'Revisar precios'}
                            icon={Percent}
                            colorClass={overallMargin >= 30 ? 'text-primary' : overallMargin >= 15 ? 'text-yellow-400' : 'text-orange-400'}
                            bgClass={overallMargin >= 30 ? 'bg-primary/10 border-primary/20' : 'bg-yellow-500/10 border-yellow-500/20'}
                        />
                    </div>

                    {/* ESTADO DE RESULTADOS + DESGLOSE PAGOS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* Estado de resultados */}
                        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
                            <h3 className="font-bold text-white mb-5 flex items-center gap-2 text-sm uppercase tracking-widest">
                                <Package className="w-4 h-4 text-gray-400" />
                                Estado de Resultados
                            </h3>
                            <div className="space-y-2.5">
                                <ResultRow label="Ingresos por productos" value={totals.productRevenue} colorClass="text-green-400" />
                                <ResultRow label="Ingresos por envíos" value={totals.shippingRevenue} colorClass="text-green-300" />
                                <div className="border-t border-white/10 pt-2.5">
                                    <ResultRow label="Total Ingresos" value={totals.revenue} colorClass="text-white" bold />
                                </div>

                                <div className="pt-1">
                                    <ResultRow label="— Costo de productos" value={totals.productCost} negative colorClass="text-red-400" />
                                    <ResultRow label="— Costo de envíos" value={totals.shippingCost} negative colorClass="text-red-300" />
                                </div>
                                <div className="border-t border-white/10 pt-2.5">
                                    <ResultRow label="Total Costos" value={totals.totalCost} negative colorClass="text-red-400" bold />
                                </div>

                                <div className="border-t-2 border-white/20 pt-4 mt-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-black text-white text-lg">Ganancia Bruta</span>
                                        <span className={`font-black text-xl ${totals.grossProfit >= 0 ? 'text-white' : 'text-red-400'}`}>
                                            {fmt(totals.grossProfit)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1.5">
                                        <span className="text-xs text-gray-500">Margen sobre ingresos</span>
                                        <span className={`text-sm font-bold ${overallMargin >= 30 ? 'text-primary' : 'text-yellow-400'}`}>
                                            {fmtPct(overallMargin)}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-xl p-3 mt-2 text-[10px] text-gray-500 space-y-1">
                                    <p>• Costo envío propio: L 120 por pedido con envío cobrado</p>
                                    <p>• Precio envío cobrado: L {totals.shippingRevenue > 0 ? Math.round(totals.shippingRevenue / Math.max(1, (metrics ?? []).filter(m => m.shippingRevenue > 0).length)) : 140} promedio</p>
                                    <p>• No incluye gastos operativos fijos</p>
                                </div>
                            </div>
                        </div>

                        {/* Desglose por banco/método */}
                        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
                            <h3 className="font-bold text-white mb-5 flex items-center gap-2 text-sm uppercase tracking-widest">
                                <CreditCard className="w-4 h-4 text-gray-400" />
                                Cobros Verificados por Banco
                            </h3>

                            {paymentEntries.length === 0 ? (
                                <p className="text-sm text-gray-600 italic py-4">Sin pagos verificados en este período.</p>
                            ) : (
                                <div className="space-y-3">
                                    {paymentEntries.map(([key, val]) => {
                                        const barWidth = totalVerified > 0 ? (val.amount / totalVerified) * 100 : 0
                                        return (
                                            <div key={key}>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                                        <span className="text-sm text-white font-medium">{key}</span>
                                                        <span className="text-[10px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded">
                                                            {val.count} pago{val.count !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-bold text-white ml-2 shrink-0">{fmt(val.amount)}</span>
                                                </div>
                                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${barWidth}%` }} />
                                                </div>
                                            </div>
                                        )
                                    })}

                                    <div className="pt-3 border-t border-white/10 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500 font-bold uppercase">Total cobrado verificado</span>
                                            <span className="text-white font-black">{fmt(totalVerified)}</span>
                                        </div>
                                        {totals.revenue - totalVerified > 1 && (
                                            <div className="flex justify-between items-center text-orange-400">
                                                <span className="text-xs font-bold uppercase">Pendiente de cobro</span>
                                                <span className="font-black text-sm">{fmt(totals.revenue - totalVerified)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RENTABILIDAD POR PRODUCTO */}
                    {productEntries.length > 0 && (
                        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
                            <h3 className="font-bold text-white mb-5 flex items-center gap-2 text-sm uppercase tracking-widest">
                                <TrendingUp className="w-4 h-4 text-gray-400" />
                                Rentabilidad por Producto (Top 15)
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm min-w-[580px]">
                                    <thead>
                                        <tr className="text-[10px] uppercase font-bold text-gray-500 border-b border-white/5">
                                            <th className="text-left pb-3 pr-4">Producto</th>
                                            <th className="text-right pb-3 pr-4">Uds.</th>
                                            <th className="text-right pb-3 pr-4">Ingresos</th>
                                            <th className="text-right pb-3 pr-4">Costo</th>
                                            <th className="text-right pb-3 pr-4">Ganancia</th>
                                            <th className="text-right pb-3">Margen</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {productEntries.map((p) => (
                                            <tr key={p.name} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="py-3 pr-4 text-white font-medium text-xs">{p.name}</td>
                                                <td className="py-3 pr-4 text-right text-gray-400">{p.units}</td>
                                                <td className="py-3 pr-4 text-right text-green-400 font-medium">{fmt(p.revenue)}</td>
                                                <td className="py-3 pr-4 text-right text-red-400 font-medium">{fmt(p.cost)}</td>
                                                <td className={`py-3 pr-4 text-right font-bold ${p.profit >= 0 ? 'text-white' : 'text-red-400'}`}>
                                                    {fmt(p.profit)}
                                                </td>
                                                <td className="py-3 text-right">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${p.margin >= 30 ? 'bg-green-500/20 text-green-400' : p.margin >= 15 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                                        {fmtPct(p.margin)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* DETALLE POR PEDIDO */}
                    <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
                        <h3 className="font-bold text-white mb-5 flex items-center gap-2 text-sm uppercase tracking-widest">
                            <Package className="w-4 h-4 text-gray-400" />
                            Detalle por Pedido ({metrics!.length})
                        </h3>

                        {metrics!.length === 0 ? (
                            <p className="text-sm text-gray-600 italic text-center py-6">No hay pedidos en este período.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm min-w-[820px]">
                                    <thead>
                                        <tr className="text-[10px] uppercase font-bold text-gray-500 border-b border-white/5">
                                            <th className="text-left pb-3 pr-3">Pedido</th>
                                            <th className="text-left pb-3 pr-3">Cliente</th>
                                            <th className="text-left pb-3 pr-3">Estado</th>
                                            <th className="text-right pb-3 pr-3">Ingreso</th>
                                            <th className="text-right pb-3 pr-3">Costo Prod.</th>
                                            <th className="text-right pb-3 pr-3">Costo Env.</th>
                                            <th className="text-right pb-3 pr-3">Ganancia</th>
                                            <th className="text-right pb-3 pr-3">Margen</th>
                                            <th className="text-right pb-3 pr-3">Cobrado</th>
                                            <th className="text-left pb-3">Banco / Método</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {metrics!.map((m) => {
                                            const verifiedPays = (m.order.payments || []).filter(p => VERIFIED.includes(p.status))
                                            const banks = [...new Set(verifiedPays.map(p => parseBankFromNotes(p.notes, p.method)))].join(', ')
                                            const isFullyPaid = m.verifiedPaid >= m.revenue - 1
                                            return (
                                                <tr key={m.order.id} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="py-3 pr-3">
                                                        <Link href={`/admin/orders/${m.order.id}`}
                                                            className="font-mono text-[11px] text-gray-400 group-hover:text-primary transition-colors">
                                                            #{m.order.id.slice(0, 8).toUpperCase()}
                                                        </Link>
                                                        <div className="text-[10px] text-gray-600 mt-0.5">
                                                            {new Date(m.order.created_at).toLocaleDateString('es-HN')}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 pr-3 text-white text-xs max-w-[110px] truncate">
                                                        {m.order.customer_name}
                                                    </td>
                                                    <td className="py-3 pr-3">
                                                        <span className="text-[10px] text-gray-500">
                                                            {STATUS_LABEL[m.order.status] || m.order.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 pr-3 text-right text-green-400 font-medium text-xs">{fmt(m.revenue)}</td>
                                                    <td className="py-3 pr-3 text-right text-red-400 text-xs">{fmt(m.productCost)}</td>
                                                    <td className="py-3 pr-3 text-right text-red-400/70 text-xs">
                                                        {m.shippingCost > 0 ? fmt(m.shippingCost) : <span className="text-gray-700">—</span>}
                                                    </td>
                                                    <td className={`py-3 pr-3 text-right font-bold text-xs ${m.grossProfit >= 0 ? 'text-white' : 'text-red-400'}`}>
                                                        {fmt(m.grossProfit)}
                                                    </td>
                                                    <td className="py-3 pr-3 text-right">
                                                        <span className={`text-[11px] font-bold ${m.marginPct >= 30 ? 'text-green-400' : m.marginPct >= 15 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                            {fmtPct(m.marginPct)}
                                                        </span>
                                                    </td>
                                                    <td className={`py-3 pr-3 text-right text-xs font-bold ${isFullyPaid ? 'text-green-400' : m.verifiedPaid > 0 ? 'text-orange-400' : 'text-gray-600'}`}>
                                                        {m.verifiedPaid > 0 ? fmt(m.verifiedPaid) : '—'}
                                                    </td>
                                                    <td className="py-3 text-xs text-gray-400 max-w-[120px] truncate">
                                                        {banks || <span className="text-gray-700">—</span>}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KPICard({ label, value, sub, icon: Icon, colorClass, bgClass }: {
    label: string
    value: string
    sub: string
    icon: React.ElementType
    colorClass: string
    bgClass: string
}) {
    return (
        <div className={`rounded-2xl border p-4 md:p-5 ${bgClass}`}>
            <div className="flex items-start justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 leading-tight pr-2">{label}</span>
                <Icon className={`w-4 h-4 shrink-0 ${colorClass}`} />
            </div>
            <div className={`text-xl md:text-2xl font-black ${colorClass}`}>{value}</div>
            <div className="text-[10px] text-gray-600 mt-1">{sub}</div>
        </div>
    )
}

function ResultRow({ label, value, negative, colorClass, bold }: {
    label: string
    value: number
    negative?: boolean
    colorClass: string
    bold?: boolean
}) {
    const display = negative ? `— ${fmt(value)}` : fmt(value)
    return (
        <div className={`flex items-center justify-between ${bold ? 'text-base' : 'text-sm'}`}>
            <span className={bold ? 'font-bold text-white' : 'text-gray-400'}>{label}</span>
            <span className={`${bold ? 'font-black' : 'font-medium'} ${colorClass}`}>{display}</span>
        </div>
    )
}
