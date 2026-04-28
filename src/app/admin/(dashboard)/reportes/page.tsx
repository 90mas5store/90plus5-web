'use client'

import { useState, useEffect } from 'react'
import { FileSpreadsheet, Download, Loader2, FileText, Filter, TrendingUp, BarChart2, Share2 } from 'lucide-react'
import useToastMessage from '@/hooks/useToastMessage'
import { createClient } from '@/lib/supabase/client'

export default function ReportesPage() {
    const toast = useToastMessage()
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    // Estado múltiple: array de strings
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['all'])
    const [loading, setLoading] = useState(false)
    const [bestSellers, setBestSellers] = useState<{ name: string; units: number; revenue: number }[]>([])
    const [loadingBest, setLoadingBest] = useState(false)
    const [shareStats, setShareStats] = useState<{ product_name: string; team_name: string | null; count: number }[]>([])
    const [loadingShares, setLoadingShares] = useState(false)

    // Opciones de estado
    const statusOptions = [
        { value: 'pending_payment_50', label: '1. Pedido recibido', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
        { value: 'deposit_paid', label: '2. Anticipo confirmado', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
        { value: 'processing', label: '3. Pedido realizado al proveedor', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
        { value: 'in_transit', label: '4. Producto en transito', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
        { value: 'ready_for_delivery', label: '5. Producto listo para despachar', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
        { value: 'pending_second_payment', label: '6. Pendiente segundo pago', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
        { value: 'shipped_to_costumer', label: '7. Producto enviado al cliente', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
        { value: 'completed', label: '8. Producto recibido por el cliente', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
        { value: 'Cancelled', label: 'Cancelado', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
    ]

    // Manejar toggle de status
    const toggleStatus = (value: string) => {
        if (value === 'all') {
            setSelectedStatuses(['all'])
            return
        }

        let newStatuses = [...selectedStatuses]

        // Si estaba seleccionado 'all', lo quitamos al seleccionar uno específico
        if (newStatuses.includes('all')) {
            newStatuses = []
        }

        if (newStatuses.includes(value)) {
            newStatuses = newStatuses.filter(s => s !== value)
        } else {
            newStatuses.push(value)
        }

        // Si no queda ninguno, volvemos a 'all'
        if (newStatuses.length === 0) {
            setSelectedStatuses(['all'])
        } else {
            setSelectedStatuses(newStatuses)
        }
    }

    // Establecer fechas por defecto (último mes)
    useEffect(() => {
        const today = new Date()
        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)

        setEndDate(today.toISOString().split('T')[0])
        setStartDate(lastMonth.toISOString().split('T')[0])
    }, [])

    const loadBestSellers = async () => {
        if (!startDate || !endDate) { toast.error('Por favor selecciona ambas fechas'); return }
        setLoadingBest(true)
        try {
            const statusParam = selectedStatuses.includes('all') ? 'all' : selectedStatuses.join(',')
            const params = new URLSearchParams({ startDate, endDate, status: statusParam })
            const res = await fetch(`/api/admin/reports/orders?${params}`)
            if (!res.ok) throw new Error('Error al obtener datos')
            const orders = await res.json()

            const map = new Map<string, { units: number; revenue: number }>()
            for (const order of (orders || [])) {
                for (const item of (order.order_items || [])) {
                    const name = Array.isArray(item.products) ? item.products[0]?.name : item.products?.name
                    if (!name) continue
                    const existing = map.get(name) || { units: 0, revenue: 0 }
                    existing.units += item.quantity || 0
                    existing.revenue += (item.unit_price || 0) * (item.quantity || 0)
                    map.set(name, existing)
                }
            }
            const sorted = Array.from(map.entries())
                .map(([name, v]) => ({ name, ...v }))
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 15)
            setBestSellers(sorted)
            if (sorted.length === 0) toast.warning('No hay datos en este rango')
        } catch {
            toast.error('Error al calcular')
        } finally {
            setLoadingBest(false)
        }
    }

    const loadShareStats = async () => {
        if (!startDate || !endDate) { toast.error('Por favor selecciona ambas fechas'); return }
        setLoadingShares(true)
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('product_share_events')
                .select('product_name, team_name')
                .gte('created_at', startDate)
                .lte('created_at', endDate + 'T23:59:59Z')

            if (error) throw error

            const map = new Map<string, { team_name: string | null; count: number }>()
            for (const row of (data || [])) {
                const existing = map.get(row.product_name) || { team_name: row.team_name, count: 0 }
                existing.count++
                map.set(row.product_name, existing)
            }
            const sorted = Array.from(map.entries())
                .map(([product_name, v]) => ({ product_name, ...v }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 15)
            setShareStats(sorted)
            if (sorted.length === 0) toast.warning('Sin presumes en este rango')
        } catch {
            toast.error('Error al cargar presumes')
        } finally {
            setLoadingShares(false)
        }
    }

    const generateAndDownload = async (format: 'csv' | 'excel') => {
        if (!startDate || !endDate) {
            toast.error('Por favor selecciona ambas fechas')
            return
        }

        setLoading(true)

        try {
            // Construir parámetro status
            const statusParam = selectedStatuses.includes('all') ? 'all' : selectedStatuses.join(',')

            const queryParams = new URLSearchParams({
                startDate,
                endDate,
                status: statusParam
            })

            // 1. Obtener datos crudos del servidor
            const response = await fetch(`/api/admin/reports/orders?${queryParams}`)

            if (!response.ok) {
                throw new Error('Error al obtener datos')
            }

            const orders = await response.json()

            if (!orders || orders.length === 0) {
                toast.warning('No se encontraron pedidos con estos criterios')
                setLoading(false)
                return
            }

            // 2. Procesar datos para formato tabla
            const rows = orders.flatMap((order: any) => {
                return (((order.order_items as any[]) || [])).map((item: any) => {
                    // Helpers para extracción segura
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
                        'Equipo': getVal(item.products?.teams, 'name') || 'N/A',
                        'Producto': getVal(item.products, 'name') || 'Producto Desconocido',
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

            // 3. Generar Excel/CSV
            console.log('📊 Generando hoja de cálculo...')
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
                // CSV puro sin dependencias
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

            console.log('✅ Descarga iniciada')
            toast.success('Reporte descargado correctamente')

        } catch (err: unknown) {
            console.error('Download error:', err)
            toast.error('Error al generar el reporte')
        } finally {
            setLoading(false)
        }
    }

    // Presets de fechas
    const setPreset = (preset: 'today' | 'week' | 'month' | 'all') => {
        const today = new Date()
        const end = today.toISOString().split('T')[0]
        let start = new Date()

        if (preset === 'today') start = today
        if (preset === 'week') start.setDate(start.getDate() - 7)
        if (preset === 'month') start.setMonth(start.getMonth() - 1)
        if (preset === 'all') start = new Date('2024-01-01')

        setStartDate(start.toISOString().split('T')[0])
        setEndDate(end)
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* HEADER */}
            <div className="mb-4 md:mb-8">
                <h1 className="text-xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2 md:gap-3">
                    <FileSpreadsheet className="w-5 h-5 md:w-8 md:h-8 text-primary" />
                    Reportes de Pedidos
                </h1>
                <p className="text-gray-400 mt-1 md:mt-2 text-sm">
                    Genera reportes en Excel o CSV procesados localmente.
                </p>
            </div>

            {/* FILTROS */}
            <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 mb-6">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-400" />
                    Filtros de Reporte
                </h2>

                <div className="flex flex-wrap gap-2 mb-6">
                    {['today', 'week', 'month', 'all'].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPreset(p as any)}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors capitalize"
                        >
                            {p === 'today' ? 'Hoy' : p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : 'Todos'}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Fecha Inicio</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none transition-colors" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Fecha Fin</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none transition-colors" />
                    </div>
                </div>

                {/* SELECTOR DE ESTADO MÚLTIPLE */}
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Estados a incluir</label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => toggleStatus('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${selectedStatuses.includes('all') ? 'bg-white text-black border-white' : 'bg-black/30 text-gray-400 border-white/10 hover:border-white/30'}`}
                        >
                            Todos
                        </button>
                        {statusOptions.map(opt => {
                            const isSelected = selectedStatuses.includes(opt.value)
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => toggleStatus(opt.value)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${isSelected ? opt.color + ' border-current' : 'bg-black/30 text-gray-400 border-white/10 hover:border-white/30'}`}
                                >
                                    {opt.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* ERROR / INFO */}
            <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Download className="w-5 h-5 text-gray-400" />
                    Descargar Reporte
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => generateAndDownload('csv')}
                        disabled={loading}
                        className="flex items-center justify-center gap-3 p-6 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/40 rounded-2xl transition-all group disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-8 h-8 text-green-500 animate-spin" /> : <FileSpreadsheet className="w-8 h-8 text-green-500 group-hover:scale-110 transition-transform" />}
                        <div className="text-left">
                            <p className="font-bold text-white text-lg">Descargar CSV</p>
                            <p className="text-xs text-gray-400">Texto plano</p>
                        </div>
                    </button>

                    <button
                        onClick={() => generateAndDownload('excel')}
                        disabled={loading}
                        className="flex items-center justify-center gap-3 p-6 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 rounded-2xl transition-all group disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-8 h-8 text-blue-500 animate-spin" /> : <FileText className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" />}
                        <div className="text-left">
                            <p className="font-bold text-white text-lg">Descargar Excel</p>
                            <p className="text-xs text-gray-400">Formato .xlsx</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* PRODUCTOS MÁS VENDIDOS */}
            <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-gray-400" />
                        Productos más vendidos
                    </h2>
                    <button
                        onClick={loadBestSellers}
                        disabled={loadingBest}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50"
                    >
                        {loadingBest ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart2 className="w-4 h-4" />}
                        Calcular
                    </button>
                </div>

                {bestSellers.length === 0 ? (
                    <p className="text-sm text-gray-600 italic text-center py-6">
                        Haz clic en "Calcular" para ver los productos más vendidos en el rango de fechas seleccionado.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {bestSellers.map((item, idx) => {
                            const maxRevenue = bestSellers[0]?.revenue || 1
                            const barWidth = Math.round((item.revenue / maxRevenue) * 100)
                            return (
                                <div key={item.name} className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-gray-600 w-5 text-right shrink-0">{idx + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-sm text-white font-medium truncate">{item.name}</span>
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
            {/* PRESUMES DE KIT */}
            <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-gray-400" />
                        Presumes de Kit
                    </h2>
                    <button
                        onClick={loadShareStats}
                        disabled={loadingShares}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50"
                    >
                        {loadingShares ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart2 className="w-4 h-4" />}
                        Calcular
                    </button>
                </div>

                {shareStats.length === 0 ? (
                    <p className="text-sm text-gray-600 italic text-center py-6">
                        Haz clic en &quot;Calcular&quot; para ver qué productos se presumen más en el rango seleccionado.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {shareStats.map((item, idx) => {
                            const maxCount = shareStats[0]?.count || 1
                            const barWidth = Math.round((item.count / maxCount) * 100)
                            return (
                                <div key={item.product_name} className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-gray-600 w-5 text-right shrink-0">{idx + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <div className="min-w-0">
                                                <span className="text-sm text-white font-medium truncate block">{item.product_name}</span>
                                                {item.team_name && (
                                                    <span className="text-xs text-gray-500">{item.team_name}</span>
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
        'in_transit': '4. Producto en transito',
        'ready_for_delivery': '5. Producto listo para despachar',
        'pending_second_payment': '6. Pendiente segundo pago',
        'shipped_to_costumer': '7. Producto enviado al cliente',
        'completed': '8. Producto recibido por el cliente',
        'paid_full': '8. Producto recibido por el cliente',
        'shipped_to_hn': '4. Producto en transito',
        'Cancelled': 'Cancelado'
    }
    return statusMap[status] || status
}
