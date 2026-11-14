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
                className={`p-2 sm:p-2.5 rounded-xl border transition-all active:scale-[0.98] cursor-pointer ${
                    hasFilters
                        ? 'border-white/30 bg-white/15 text-white'
                        : 'border-white/[0.08] bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white'
                }`}
                title="Filtros"
            >
                <SlidersHorizontal className="w-4 h-4" />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-12 z-50 w-[calc(100vw-2rem)] max-w-xs sm:w-72 bg-[#0a0c10]/95 backdrop-blur-2xl border border-white/[0.12] rounded-2xl p-4 shadow-2xl space-y-4 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
                        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Filtros Avanzados</span>
                            {hasFilters && (
                                <button onClick={clearFilters} className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer">
                                    <X className="w-3 h-3" /> Limpiar
                                </button>
                            )}
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Estado</label>
                            <select
                                value={currentStatus}
                                onChange={e => applyFilter('status', e.target.value)}
                                className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-white/30"
                            >
                                <option value="">Todos los estados</option>
                                {ORDER_STATUSES.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Desde</label>
                            <input
                                type="date"
                                value={currentStart}
                                onChange={e => applyFilter('startDate', e.target.value)}
                                className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-white/30"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Hasta</label>
                            <input
                                type="date"
                                value={currentEnd}
                                onChange={e => applyFilter('endDate', e.target.value)}
                                className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-white/30"
                            />
                        </div>

                        <button
                            onClick={() => setOpen(false)}
                            className="w-full py-2 bg-white text-black font-extrabold hover:bg-neutral-200 active:scale-[0.98] rounded-xl text-xs transition-all cursor-pointer shadow-sm"
                        >
                            Aplicar Filtros
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
