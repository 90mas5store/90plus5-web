'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'

const ORDER_STATUSES = [
    { value: 'pending_payment_50', label: 'Pedido recibido' },
    { value: 'deposit_paid', label: 'Anticipo confirmado' },
    { value: 'processing', label: 'En proceso' },
    { value: 'in_transit', label: 'En tránsito' },
    { value: 'ready_for_delivery', label: 'Listo para despachar' },
    { value: 'pending_second_payment', label: 'Pendiente 2do pago' },
    { value: 'shipped_to_costumer', label: 'Enviado al cliente' },
    { value: 'completed', label: 'Completado' },
    { value: 'Cancelled', label: 'Cancelado' },
]

export default function OrderFilters() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [, startTransition] = useTransition()
    const [open, setOpen] = useState(false)

    const currentStatus = searchParams.get('status') || ''
    const currentStart = searchParams.get('startDate') || ''
    const currentEnd = searchParams.get('endDate') || ''
    const hasFilters = !!(currentStatus || currentStart || currentEnd)

    const applyFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        params.delete('page')
        startTransition(() => router.push(`${pathname}?${params.toString()}`))
    }

    const clearFilters = () => {
        const params = new URLSearchParams()
        const q = searchParams.get('q')
        if (q) params.set('q', q)
        startTransition(() => router.push(`${pathname}?${params.toString()}`))
        setOpen(false)
    }

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(v => !v)}
                className={`p-2 border rounded-xl transition-all ${hasFilters
                    ? 'border-primary bg-primary/20 text-primary'
                    : 'border-white/10 hover:bg-white/5 text-gray-400'}`}
                title="Filtros"
            >
                <SlidersHorizontal className="w-5 h-5" />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-12 z-20 w-72 bg-neutral-900 border border-white/10 rounded-2xl p-4 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-white">Filtros</span>
                            {hasFilters && (
                                <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                                    <X className="w-3 h-3" /> Limpiar
                                </button>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Estado</label>
                            <select
                                value={currentStatus}
                                onChange={e => applyFilter('status', e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                            >
                                <option value="">Todos</option>
                                {ORDER_STATUSES.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Desde</label>
                            <input
                                type="date"
                                value={currentStart}
                                onChange={e => applyFilter('startDate', e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Hasta</label>
                            <input
                                type="date"
                                value={currentEnd}
                                onChange={e => applyFilter('endDate', e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                            />
                        </div>

                        <button
                            onClick={() => setOpen(false)}
                            className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold text-white transition-colors"
                        >
                            Aplicar
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
