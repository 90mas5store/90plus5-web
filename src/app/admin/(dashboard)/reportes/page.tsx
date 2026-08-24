'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    FileSpreadsheet, Download, Loader2, FileText, Filter,
    TrendingUp, BarChart2, Share2, Crown, Gift, Users,
    Award, Copy, Mail, RefreshCw
} from 'lucide-react'
import useToastMessage from '@/hooks/useToastMessage'
import { createDiscountCode, sendVipCouponEmail } from '@/app/admin/discount-actions'

interface TopBuyer {
    email: string
    name: string
    phone: string
    totalSpent: number
    totalOrders: number
    totalJerseys: number
    avgOrderValue: number
    lastOrderDate: string
    freeJerseysEarned: number
    jerseysUntilNext: number
    loyaltyTier: 'VIP_LEGEND' | 'LOYAL_FAN' | 'STARTER_FAN'
}

export default function ReportesPage() {
    const toast = useToastMessage()

    // ─── Estados Exportación de Pedidos ───────────────────────────────────────
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['all'])
    const [loading, setLoading] = useState(false)

    // ─── Estados Productos & Presumes ─────────────────────────────────────────
    const [bestSellers, setBestSellers] = useState<{ name: string; team_name: string | null; season: string | null; units: number; revenue: number }[]>([])
    const [loadingBest, setLoadingBest] = useState(false)
    const [shareStats, setShareStats] = useState<{ product_name: string; team_name: string | null; season: string | null; count: number }[]>([])
    const [loadingShares, setLoadingShares] = useState(false)

    // ─── Estados CRM Fidelización VIP ─────────────────────────────────────────
    const [topBuyers, setTopBuyers] = useState<TopBuyer[]>([])
    const [loadingBuyers, setLoadingBuyers] = useState(false)
    const [buyerFilter, setBuyerFilter] = useState('')
    const [creatingCouponFor, setCreatingCouponFor] = useState<string | null>(null)
    const [sendingEmailFor, setSendingEmailFor] = useState<string | null>(null)
    const [lastCreatedCoupon, setLastCreatedCoupon] = useState<{ email: string; code: string; customerName: string; totalJerseys: number } | null>(null)

    // ─── Opciones de estado ───────────────────────────────────────────────────
    const statusOptions = [
        { value: 'pending_payment_50', label: '1. Pedido recibido', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
        { value: 'deposit_paid', label: '2. Anticipo confirmado', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
        { value: 'processing', label: '3. Pedido realizado al proveedor', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
        { value: 'in_transit', label: '4. Producto en tránsito', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
        { value: 'ready_for_delivery', label: '5. Producto listo para despachar', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
        { value: 'pending_second_payment', label: '6. Pendiente segundo pago', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
        { value: 'shipped_to_costumer', label: '7. Producto enviado al cliente', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
        { value: 'completed', label: '8. Producto recibido por el cliente', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
        { value: 'Cancelled', label: 'Cancelado', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
    ]

    // ─── Carga Inicial Automática ─────────────────────────────────────────────
    const loadTopBuyers = useCallback(async () => {
        setLoadingBuyers(true)
        try {
            const res = await fetch('/api/admin/reports/top-buyers')
            if (!res.ok) throw new Error('Error al cargar compradores')
            const data: TopBuyer[] = await res.json()
            setTopBuyers(data)
        } catch {
            console.error('Error al analizar compradores')
        } finally {
            setLoadingBuyers(false)
        }
    }, [])

    const loadBestSellersWithDates = useCallback(async (start: string, end: string, statuses: string[]) => {
        if (!start || !end) return
        setLoadingBest(true)
        try {
            const statusParam = statuses.includes('all') ? 'all' : statuses.join(',')
            const params = new URLSearchParams({ startDate: start, endDate: end, status: statusParam })
            const res = await fetch(`/api/admin/reports/best-sellers?${params}`)
            if (!res.ok) throw new Error('Error al obtener datos')
            const sorted = await res.json()
            setBestSellers(sorted)
        } catch {
            console.error('Error al calcular más vendidos')
        } finally {
            setLoadingBest(false)
        }
    }, [])

    const loadShareStatsWithDates = useCallback(async (start: string, end: string) => {
        if (!start || !end) return
        setLoadingShares(true)
        try {
            const params = new URLSearchParams({ startDate: start, endDate: end })
            const res = await fetch(`/api/admin/reports/shares?${params}`)
            if (!res.ok) throw new Error('Error al cargar presumes')
            const data = await res.json()

            const map = new Map<string, { product_name: string; team_name: string | null; season: string | null; count: number }>()
            for (const row of (data || [])) {
                const key = `${row.team_name || ''}::${row.product_name}::${row.season || ''}`
                const existing = map.get(key) || { product_name: row.product_name, team_name: row.team_name, season: row.season, count: 0 }
                existing.count++
                map.set(key, existing)
            }
            const sorted = Array.from(map.values())
                .sort((a, b) => b.count - a.count)
                .slice(0, 15)
            setShareStats(sorted)
        } catch {
            console.error('Error al cargar presumes')
        } finally {
            setLoadingShares(false)
        }
    }, [])

    useEffect(() => {
        const today = new Date()
        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        const endStr = today.toISOString().split('T')[0]
        const startStr = lastMonth.toISOString().split('T')[0]

        setEndDate(endStr)
        setStartDate(startStr)

        // Carga automática inicial de los 3 reportes
        loadTopBuyers()
        loadBestSellersWithDates(startStr, endStr, ['all'])
        loadShareStatsWithDates(startStr, endStr)
    }, [loadTopBuyers, loadBestSellersWithDates, loadShareStatsWithDates])

    const toggleStatus = (value: string) => {
        if (value === 'all') { setSelectedStatuses(['all']); return }
        let newStatuses = selectedStatuses.includes('all') ? [] : [...selectedStatuses]
        newStatuses = newStatuses.includes(value) ? newStatuses.filter(s => s !== value) : [...newStatuses, value]
        setSelectedStatuses(newStatuses.length === 0 ? ['all'] : newStatuses)
    }

    const setPreset = (preset: 'today' | 'week' | 'month' | 'all') => {
        const today = new Date()
        const end = today.toISOString().split('T')[0]
        let start = new Date()
        if (preset === 'today') start = today
        if (preset === 'week') start.setDate(start.getDate() - 7)
        if (preset === 'month') start.setMonth(start.getMonth() - 1)
        if (preset === 'all') start = new Date('2024-01-01')
        const startStr = start.toISOString().split('T')[0]
        setStartDate(startStr)
        setEndDate(end)

        loadBestSellersWithDates(startStr, end, selectedStatuses)
        loadShareStatsWithDates(startStr, end)
    }

    // ─── 1. Exportación de Pedidos para Proveedores ───────────────────────────
    const generateAndDownload = async (format: 'csv' | 'excel') => {
        if (!startDate || !endDate) {
            toast.error('Por favor selecciona ambas fechas')
            return
        }
        setLoading(true)
        try {
            const statusParam = selectedStatuses.includes('all') ? 'all' : selectedStatuses.join(',')
            const queryParams = new URLSearchParams({ startDate, endDate, status: statusParam })
            const response = await fetch(`/api/admin/reports/orders?${queryParams}`)
            if (!response.ok) throw new Error('Error al obtener datos')

            const orders = await response.json()
            if (!orders || orders.length === 0) {
                toast.warning('No se encontraron pedidos con estos criterios')
                setLoading(false)
                return
            }

            const rows = orders.flatMap((order: any) => {
                return (((order.order_items as any[]) || [])).map((item: any) => {
                    const getVal = (obj: any, key: string) => {
                        if (!obj) return ''
                        if (Array.isArray(obj)) return obj[0]?.[key] || ''
                        return obj[key] || ''
                    }

                    const personalizacion = item.personalization_type === 'player'
                        ? 'Jugador'
                        : item.personalization_type === 'custom' ? 'Personalizado' : 'Sin personalizar'

                    const playersData = Array.isArray(item.players) ? item.players[0] : item.players

                    const nombreDorsal = item.personalization_type === 'player'
                        ? playersData?.name || ''
                        : item.personalization_type === 'custom' ? item.custom_name || '' : ''

                    const numeroDorsal = item.personalization_type === 'player'
                        ? playersData?.number || ''
                        : item.personalization_type === 'custom' ? item.custom_number || '' : ''

                    return {
                        'ID Pedido': order.id.slice(0, 8).toUpperCase(),
                        'Fecha': new Date(order.created_at).toLocaleDateString('es-HN'),
                        'Cliente': order.customer_name || '',
                        'Email': order.customer_email || '',
                        'Teléfono': order.customer_phone || '',
                        'Estado': formatStatus(order.status),
                        'Equipo': getVal(item.products?.teams, 'name') || getVal(item.products?.brands, 'name') || 'N/A',
                        'Producto': getVal(item.products, 'name') || 'Producto Desconocido',
                        'Temporada': getVal(item.products, 'season') || '',
                        'Equipo/Versión': getVal(item.product_variants, 'version') || 'Estándar',
                        'Talla': getVal(item.sizes, 'label') || 'N/A',
                        'Parches': getVal(item.patches, 'name') || 'Sin parches',
                        'Personalización': personalizacion,
                        'Nombre Dorsal': nombreDorsal,
                        'Número Dorsal': numeroDorsal,
                        'Cantidad': item.quantity,
                        'Precio Unit.': item.unit_price,
                        'Subtotal': item.unit_price * item.quantity
                    }
                })
            })

            const columns = Object.keys(rows[0] || {})
            const filename = `pedidos_${startDate}_${endDate}`

            const triggerDownload = (blob: Blob, name: string) => {
                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = name
                document.body.appendChild(link)
                link.click()
                setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(url) }, 100)
            }

            if (format === 'excel') {
                const ExcelJS = (await import('exceljs')).default
                const workbook = new ExcelJS.Workbook()
                const worksheet = workbook.addWorksheet('Pedidos')
                worksheet.columns = columns.map(key => ({
                    header: key,
                    key,
                    width: Math.max(key.length, ...rows.map(r => String(r[key as keyof typeof r] ?? '').length)) + 2
                }))
                worksheet.addRows(rows)
                const excelBuffer = await workbook.xlsx.writeBuffer()
                const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
                triggerDownload(blob, `${filename}.xlsx`)
            } else {
                const escape = (v: unknown) => {
                    const s = String(v ?? '')
                    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
                }
                const csvLines = [
                    columns.map(escape).join(','),
                    ...rows.map(r => columns.map(c => escape(r[c as keyof typeof r])).join(','))
                ]
                const blob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8' })
                triggerDownload(blob, `${filename}.csv`)
            }
            toast.success('Reporte para proveedor descargado correctamente')
        } catch (err: unknown) {
            console.error('Download error:', err)
            toast.error('Error al generar el reporte')
        } finally {
            setLoading(false)
        }
    }

    // ─── 2. CRM & Fidelidad Compradores (Sin resetear la página) ───────────────
    const handleCreateVipCoupon = async (buyer: TopBuyer) => {
        setCreatingCouponFor(buyer.email)
        try {
            const cleanName = buyer.name.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '') || 'VIP'
            const milestone = Math.max(5, Math.floor(buyer.totalJerseys / 5) * 5)
            const randomCode = Math.floor(1000 + Math.random() * 9000)
            const code = `VIP${milestone}-${cleanName}-${randomCode}`

            await createDiscountCode({
                code: code,
                description: `Cupón Recompensa (${milestone}ª Camisa) para ${buyer.name} (${buyer.email})`,
                discount_pct: 15,
                category_ids: [],
                league_ids: [],
                team_ids: [],
                max_uses: 1,
                active: true
            })

            setLastCreatedCoupon({
                email: buyer.email,
                code,
                customerName: buyer.name,
                totalJerseys: buyer.totalJerseys
            })
            toast.success(`Cupón ${code} generado exitosamente`)
        } catch (err: unknown) {
            toast.error(`Error creando cupón: ${(err as Error).message}`)
        } finally {
            setCreatingCouponFor(null)
        }
    }

    const handleSendVipEmail = async (email: string, name: string, code: string, jerseys: number) => {
        setSendingEmailFor(email)
        try {
            const res = await sendVipCouponEmail({
                customerName: name,
                customerEmail: email,
                couponCode: code,
                discountPct: 15,
                totalJerseys: jerseys,
            })
            if (res.success) {
                toast.success(`¡Correo enviado a ${email}!`)
            } else {
                toast.error(`No se pudo enviar el correo: ${res.error}`)
            }
        } catch (err: unknown) {
            toast.error(`Error enviando correo: ${(err as Error).message}`)
        } finally {
            setSendingEmailFor(null)
        }
    }

    const handleDirectRowSendEmail = async (buyer: TopBuyer) => {
        setSendingEmailFor(buyer.email)
        try {
            let code = lastCreatedCoupon?.email === buyer.email ? lastCreatedCoupon.code : null

            // Si aún no se ha generado un código en esta sesión para el comprador, creamos uno automáticamente
            if (!code) {
                const cleanName = buyer.name.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '') || 'VIP'
                const milestone = Math.max(5, Math.floor(buyer.totalJerseys / 5) * 5)
                const randomCode = Math.floor(1000 + Math.random() * 9000)
                code = `VIP${milestone}-${cleanName}-${randomCode}`

                await createDiscountCode({
                    code: code,
                    description: `Cupón Recompensa (${milestone}ª Camisa) para ${buyer.name} (${buyer.email})`,
                    discount_pct: 15,
                    category_ids: [],
                    league_ids: [],
                    team_ids: [],
                    max_uses: 1,
                    active: true
                })

                setLastCreatedCoupon({
                    email: buyer.email,
                    code,
                    customerName: buyer.name,
                    totalJerseys: buyer.totalJerseys
                })
            }

            const res = await sendVipCouponEmail({
                customerName: buyer.name,
                customerEmail: buyer.email,
                couponCode: code,
                discountPct: 15,
                totalJerseys: buyer.totalJerseys,
            })

            if (res.success) {
                toast.success(`¡Correo con cupón ${code} enviado a ${buyer.email}!`)
            } else {
                toast.error(`No se pudo enviar el correo: ${res.error}`)
            }
        } catch (err: unknown) {
            toast.error(`Error: ${(err as Error).message}`)
        } finally {
            setSendingEmailFor(null)
        }
    }

    const filteredBuyers = topBuyers.filter(b =>
        b.name.toLowerCase().includes(buyerFilter.toLowerCase()) ||
        b.email.toLowerCase().includes(buyerFilter.toLowerCase())
    )

    const vipCount = topBuyers.filter(b => b.loyaltyTier === 'VIP_LEGEND').length
    const loyalCount = topBuyers.filter(b => b.loyaltyTier === 'LOYAL_FAN').length

    return (
        <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 pb-28">
            {/* HEADER */}
            <div>
                <h1 className="text-xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2 md:gap-3">
                    <FileSpreadsheet className="w-5 h-5 md:w-8 md:h-8 text-primary" />
                    Reportes de Pedidos y CRM
                </h1>
                <p className="text-gray-400 mt-1 md:mt-2 text-xs md:text-sm">
                    Exporta pedidos para proveedores, analiza productos más vendidos y gestiona el programa de fidelización VIP.
                </p>
            </div>

            {/* 📦 1. EXPORTACIÓN DE PEDIDOS PARA PROVEEDORES */}
            <div className="bg-neutral-900 border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-8 space-y-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2 uppercase tracking-tight">
                        <Filter className="w-5 h-5 text-primary" />
                        Exportar Pedidos para Proveedor
                    </h2>
                </div>

                {/* PRESETS DE FECHA */}
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Períodos Rápidos</label>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => setPreset('today')} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors text-gray-300">Hoy</button>
                        <button onClick={() => setPreset('week')} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors text-gray-300">Últimos 7 días</button>
                        <button onClick={() => setPreset('month')} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors text-gray-300">Último mes</button>
                        <button onClick={() => setPreset('all')} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors text-gray-300">Todo el historial</button>
                    </div>
                </div>

                {/* FECHAS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Fecha Inicio</label>
                        <input type="date" value={startDate} onChange={(e) => {
                            setStartDate(e.target.value)
                            loadBestSellersWithDates(e.target.value, endDate, selectedStatuses)
                            loadShareStatsWithDates(e.target.value, endDate)
                        }} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-xs sm:text-sm focus:border-primary outline-none" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Fecha Fin</label>
                        <input type="date" value={endDate} onChange={(e) => {
                            setEndDate(e.target.value)
                            loadBestSellersWithDates(startDate, e.target.value, selectedStatuses)
                            loadShareStatsWithDates(startDate, e.target.value)
                        }} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-xs sm:text-sm focus:border-primary outline-none" />
                    </div>
                </div>

                {/* FILTRO MÚLTIPLE DE ESTADOS */}
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Estados a Incluir</label>
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            onClick={() => toggleStatus('all')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${selectedStatuses.includes('all') ? 'bg-white text-black border-white' : 'bg-black/30 text-gray-400 border-white/10 hover:border-white/30'}`}
                        >
                            Todos los estados
                        </button>
                        {statusOptions.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => toggleStatus(opt.value)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${selectedStatuses.includes(opt.value) ? opt.color + ' border-current' : 'bg-black/30 text-gray-400 border-white/10 hover:border-white/30'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* BOTONES DE DESCARGA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                        onClick={() => generateAndDownload('excel')}
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black p-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-xs sm:text-sm shadow-lg shadow-emerald-900/30"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Descargar Excel (.xlsx) para Proveedor
                    </button>
                    <button
                        onClick={() => generateAndDownload('csv')}
                        disabled={loading}
                        className="w-full bg-white/10 hover:bg-white/20 text-white font-black p-3.5 rounded-xl flex items-center justify-center gap-2 transition-all border border-white/10 disabled:opacity-50 text-xs sm:text-sm"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        Descargar CSV (.csv)
                    </button>
                </div>
            </div>

            {/* 👑 2. SECCIÓN TOP COMPRADORES & PROGRAMA DE FIDELIDAD VIP */}
            <div className="bg-neutral-900 border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
                    <div>
                        <h2 className="text-base md:text-lg font-black text-white uppercase tracking-tight flex items-center gap-2.5">
                            <Crown className="w-5 h-5 text-yellow-500" />
                            Top Compradores & Programa Fidelidad (Camisas Acumuladas)
                        </h2>
                        <p className="text-xs text-gray-400 mt-1">
                            Rastrea compras acumuladas (cada 5 camisas = 1 recompensa VIP) y notifica por WhatsApp o Correo.
                        </p>
                    </div>

                    <button
                        onClick={loadTopBuyers}
                        disabled={loadingBuyers}
                        className="px-3.5 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shrink-0"
                        title="Refrescar compradores"
                    >
                        {loadingBuyers ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        Refrescar CRM
                    </button>
                </div>

                {topBuyers.length > 0 && (
                    <>
                        {/* TARJETAS RESUMEN DE FIDELIDAD */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-500">Clientes VIP (5+ Camisas)</span>
                                    <Crown className="w-4 h-4 text-yellow-400" />
                                </div>
                                <div className="text-2xl font-black text-yellow-400">{vipCount}</div>
                                <p className="text-[10px] text-gray-400 mt-1">Han alcanzado la 5ª camisa o más</p>
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Aficionados Fieles (3-4)</span>
                                    <Award className="w-4 h-4 text-blue-400" />
                                </div>
                                <div className="text-2xl font-black text-blue-400">{loyalCount}</div>
                                <p className="text-[10px] text-gray-400 mt-1">Próximos a alcanzar su recompensa VIP</p>
                            </div>

                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Recompensas Ganadas</span>
                                    <Gift className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div className="text-2xl font-black text-emerald-400">
                                    {topBuyers.reduce((sum, b) => sum + b.freeJerseysEarned, 0)}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">Total cupones ganados acumulados</p>
                            </div>
                        </div>

                        {/* BUSCADOR Y LISTADO */}
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Buscar por nombre o correo electrónico..."
                                value={buyerFilter}
                                onChange={e => setBuyerFilter(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-gray-600 outline-none focus:border-yellow-500/50 transition-colors"
                            />

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs sm:text-sm min-w-[800px]">
                                    <thead>
                                        <tr className="text-[10px] uppercase font-bold text-gray-500 border-b border-white/5">
                                            <th className="text-left pb-3 pr-3">Comprador</th>
                                            <th className="text-center pb-3 pr-3">Camisas</th>
                                            <th className="text-right pb-3 pr-3">Total Invertido</th>
                                            <th className="text-center pb-3 pr-3">Nivel Fidelidad</th>
                                            <th className="text-center pb-3 pr-3">Progreso Recompensa</th>
                                            <th className="text-right pb-3">Acciones Fidelidad</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredBuyers.map((b) => {
                                            const isVip = b.loyaltyTier === 'VIP_LEGEND'
                                            const isLoyal = b.loyaltyTier === 'LOYAL_FAN'
                                            const cleanPhone = b.phone.replace(/\D/g, '')
                                            const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('504') ? cleanPhone : `504${cleanPhone}`}`

                                            return (
                                                <tr key={b.email} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="py-3 pr-3">
                                                        <p className="font-bold text-white text-xs sm:text-sm">{b.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-mono">{b.email}</p>
                                                    </td>
                                                    <td className="py-3 pr-3 text-center font-black text-white">
                                                        <span className="bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
                                                            {b.totalJerseys} 👕
                                                        </span>
                                                    </td>
                                                    <td className="py-3 pr-3 text-right font-bold text-green-400">
                                                        L {b.totalSpent.toLocaleString('es-HN')}
                                                    </td>
                                                    <td className="py-3 pr-3 text-center">
                                                        {isVip ? (
                                                            <span className="inline-flex items-center gap-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                                                                <Crown className="w-3 h-3" /> VIP Leyenda
                                                            </span>
                                                        ) : isLoyal ? (
                                                            <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                                                                <Award className="w-3 h-3" /> Fiel
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] text-gray-500 uppercase font-bold">Aficionado</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 pr-3 text-center">
                                                        {b.freeJerseysEarned > 0 ? (
                                                            <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 block">
                                                                🎁 ¡{b.freeJerseysEarned} Recompensa{b.freeJerseysEarned > 1 ? 's' : ''}!
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs italic">
                                                                Falta {b.jerseysUntilNext} para 5ª camisa
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {b.phone && (
                                                                <a
                                                                    href={whatsappUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-1.5 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-black rounded-lg transition-all"
                                                                    title="Contactar vía WhatsApp"
                                                                >
                                                                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                                                </a>
                                                            )}

                                                            <button
                                                                onClick={() => handleDirectRowSendEmail(b)}
                                                                disabled={sendingEmailFor === b.email}
                                                                className="p-1.5 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-lg transition-all disabled:opacity-50"
                                                                title="Enviar cupón por Correo Electrónico"
                                                            >
                                                                {sendingEmailFor === b.email ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                                                            </button>

                                                            <button
                                                                onClick={() => handleCreateVipCoupon(b)}
                                                                disabled={creatingCouponFor === b.email}
                                                                className="px-2 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all disabled:opacity-50"
                                                                title="Generar cupón promocional VIP acumulativo"
                                                            >
                                                                {creatingCouponFor === b.email ? <Loader2 className="w-3 h-3 animate-spin" /> : <Gift className="w-3 h-3" />}
                                                                Generar Cupón
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* MODAL NOTIFICACIÓN DE CUPÓN CREADO CON OPCIÓN DE ENVIAR POR EMAIL */}
                {lastCreatedCoupon && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                            <Gift className="w-5 h-5 text-yellow-400 shrink-0" />
                            <div>
                                <p className="font-bold text-yellow-400">¡Cupón Promocional Creado Exitosamente!</p>
                                <p className="text-gray-300">Código asignado a <span className="text-white font-mono">{lastCreatedCoupon.customerName}</span> (<span className="text-gray-400">{lastCreatedCoupon.email}</span>): <strong className="text-white font-mono bg-black/60 px-2 py-0.5 rounded">{lastCreatedCoupon.code}</strong> (15% OFF)</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(lastCreatedCoupon.code)
                                    toast.success('Código copiado al portapapeles')
                                }}
                                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-colors flex items-center gap-1"
                            >
                                <Copy className="w-3.5 h-3.5" /> Copiar
                            </button>

                            <button
                                onClick={() => handleSendVipEmail(lastCreatedCoupon.email, lastCreatedCoupon.customerName, lastCreatedCoupon.code, lastCreatedCoupon.totalJerseys)}
                                disabled={sendingEmailFor === lastCreatedCoupon.email}
                                className="px-3 py-1.5 bg-yellow-500 text-black font-black rounded-lg hover:bg-yellow-400 transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                                {sendingEmailFor === lastCreatedCoupon.email ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                                Enviar por Correo
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 📈 3. PRODUCTOS MÁS VENDIDOS */}
            <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Productos Más Vendidos
                    </h2>
                    <button
                        onClick={() => loadBestSellersWithDates(startDate, endDate, selectedStatuses)}
                        disabled={loadingBest}
                        className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-50"
                    >
                        {loadingBest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        Refrescar
                    </button>
                </div>

                {bestSellers.length === 0 ? (
                    <p className="text-sm text-gray-600 italic text-center py-6">
                        No hay datos en el rango seleccionado.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {bestSellers.map((item, idx) => {
                            const maxRevenue = bestSellers[0]?.revenue || 1
                            const barWidth = Math.round((item.revenue / maxRevenue) * 100)
                            return (
                                <div key={`${item.team_name}-${item.name}-${item.season}-${idx}`} className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-gray-600 w-5 text-right shrink-0">{idx + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <div className="min-w-0 flex items-center gap-2 flex-wrap">
                                                {item.team_name && (
                                                    <span className="text-xs font-bold text-primary tracking-wider uppercase shrink-0">
                                                        {item.team_name}
                                                    </span>
                                                )}
                                                <span className="text-sm text-white font-medium truncate">{item.name}</span>
                                                {item.season && (
                                                    <span className="text-[10px] font-bold text-gray-300 bg-white/10 px-1.5 py-0.5 rounded-full border border-white/10 shrink-0">
                                                        {item.season}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0 ml-2">
                                                <span className="text-xs text-gray-500">{item.units} uds.</span>
                                                <span className="text-xs font-bold text-white">L {item.revenue.toLocaleString('es-HN')}</span>
                                            </div>
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all"
                                                style={{ width: `${barWidth}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* 📸 4. PRESUMES DE KIT */}
            <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-gray-400" />
                        Presumes de Kit
                    </h2>
                    <button
                        onClick={() => loadShareStatsWithDates(startDate, endDate)}
                        disabled={loadingShares}
                        className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-50"
                    >
                        {loadingShares ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        Refrescar
                    </button>
                </div>

                {shareStats.length === 0 ? (
                    <p className="text-sm text-gray-600 italic text-center py-6">
                        No hay presumes registrados en este rango de fechas.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {shareStats.map((item, idx) => {
                            const maxCount = shareStats[0]?.count || 1
                            const barWidth = Math.round((item.count / maxCount) * 100)
                            return (
                                <div key={`${item.team_name}-${item.product_name}-${item.season}-${idx}`} className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-gray-600 w-5 text-right shrink-0">{idx + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <div className="min-w-0 flex items-center gap-2 flex-wrap">
                                                {item.team_name && (
                                                    <span className="text-xs font-bold text-primary tracking-wider uppercase shrink-0">
                                                        {item.team_name}
                                                    </span>
                                                )}
                                                <span className="text-sm text-white font-medium truncate">{item.product_name}</span>
                                                {item.season && (
                                                    <span className="text-[10px] font-bold text-gray-300 bg-white/10 px-1.5 py-0.5 rounded-full border border-white/10 shrink-0">
                                                        {item.season}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs font-bold text-white shrink-0 ml-2">
                                                {item.count} {item.count === 1 ? 'vez' : 'veces'}
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all"
                                                style={{ width: `${barWidth}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

function formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
        'pending_payment_50': '1. Pedido recibido',
        'deposit_paid': '2. Anticipo confirmado',
        'processing': '3. Pedido realizado al proveedor',
        'in_transit': '4. Producto en tránsito',
        'ready_for_delivery': '5. Producto listo para despachar',
        'pending_second_payment': '6. Pendiente segundo pago',
        'shipped_to_costumer': '7. Producto enviado al cliente',
        'completed': '8. Producto recibido por el cliente',
        'paid_full': '8. Producto recibido por el cliente',
        'shipped_to_hn': '4. Producto en tránsito',
        'Cancelled': 'Cancelado'
    }
    return statusMap[status] || status
}
