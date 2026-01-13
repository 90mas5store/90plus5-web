'use client'

import { useState, useEffect } from 'react'
import { FileSpreadsheet, Download, Calendar, Loader2, FileText, Filter } from 'lucide-react'
import * as XLSX from 'xlsx'
import useToastMessage from '@/hooks/useToastMessage'
import { createClient } from '@/lib/supabase/client'

export default function ReportesPage() {
    const toast = useToastMessage()
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    // Estado múltiple: array de strings
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['all'])
    const [loading, setLoading] = useState(false)

    // Opciones de estado
    const statusOptions = [
        { value: 'pending_payment_50', label: 'Pendiente Anticipo', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
        { value: 'deposit_paid', label: 'Anticipo Pagado', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
        { value: 'in_production', label: 'En Producción', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
        { value: 'ready_to_ship', label: 'Listo para Enviar', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
        { value: 'shipped', label: 'Enviado', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
        { value: 'delivered', label: 'Entregado', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
        { value: 'cancelled', label: 'Cancelado', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
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
                return (order.order_items || []).map((item: any) => {
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

            // 3. Generar Excel/CSV con SheetJS (xlsx)
            console.log('📊 Generando hoja de cálculo...')
            const worksheet = XLSX.utils.json_to_sheet(rows)

            // Ajustar anchos de columna automáticamente
            const colWidths = Object.keys(rows[0] || {}).map(key => ({
                wch: Math.max(key.length, ...rows.map(r => String(r[key as keyof typeof r]).length)) + 2
            }))
            worksheet['!cols'] = colWidths

            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos")

            const filename = `pedidos_${startDate}_${endDate}`

            if (format === 'excel') {
                // Generar buffer binario
                const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
                // Crear Blob
                const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

                // Descargar manual
                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `${filename}.xlsx`
                document.body.appendChild(link)
                link.click()
                setTimeout(() => {
                    document.body.removeChild(link)
                    window.URL.revokeObjectURL(url)
                }, 100)
            } else {
                // CSV
                const csvOutput = XLSX.utils.sheet_to_csv(worksheet)
                const blob = new Blob(['\uFEFF' + csvOutput], { type: 'text/csv;charset=utf-8' })

                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `${filename}.csv`
                document.body.appendChild(link)
                link.click()
                setTimeout(() => {
                    document.body.removeChild(link)
                    window.URL.revokeObjectURL(url)
                }, 100)
            }

            console.log('✅ Descarga iniciada')
            toast.success('Reporte descargado correctamente')

        } catch (err: any) {
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
            <div className="mb-8">
                <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-primary" />
                    Reportes de Pedidos
                </h1>
                <p className="text-gray-400 mt-2">
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
        </div>
    )
}

function formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
        'pending_payment_50': 'Pendiente Anticipo',
        'deposit_paid': 'Anticipo Pagado',
        'in_production': 'En Producción',
        'ready_to_ship': 'Listo para Enviar',
        'shipped': 'Enviado',
        'delivered': 'Entregado',
        'cancelled': 'Cancelado'
    }
    return statusMap[status] || status
}
