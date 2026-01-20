'use client'

import { useState } from 'react'
import { updateOrderStatus } from '@/app/admin/actions'
import { Loader2, ChevronDown } from 'lucide-react'
import { getStatusColor, getStatusLabel } from '@/components/admin/OrderStatusBadge'
import toast from 'react-hot-toast'

const AVAILABLE_STATUSES = [
    'pending_payment_50',
    'deposit_paid',
    'ready_for_delivery',
    'paid_full',
    'Cancelled'
];

export default function OrderStatusSelector({ orderId, currentStatus }: { orderId: string, currentStatus: string }) {
    const [status, setStatus] = useState(currentStatus)
    const [loading, setLoading] = useState(false)

    const handleStatusChange = async (newStatus: string) => {
        if (newStatus === status) return;

        // Removed confirm for smoother UX on mobile
        // const confirm = window.confirm(...);
        // if (!confirm) return;

        setLoading(true);
        try {
            await updateOrderStatus(orderId, newStatus)
            setStatus(newStatus)
            toast.success('Estado actualizado correctamente')
        } catch (error) {
            toast.error('Error al actualizar estado')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative inline-block text-left w-full md:w-64">
            {/* Background Container matching status color */}
            <div className={`relative flex items-center justify-between p-3 rounded-xl border transition-colors ${getStatusColor(status)}`}>

                {loading ? (
                    <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs font-bold uppercase">Actualizando...</span>
                    </div>
                ) : (
                    <span className="font-black text-xs uppercase tracking-wide">
                        {getStatusLabel(status)}
                    </span>
                )}

                <ChevronDown className="w-4 h-4 opacity-70" />

                {/* Invisible Select Overlay */}
                <select
                    value={status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={loading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                >
                    {AVAILABLE_STATUSES.map((s) => (
                        <option key={s} value={s} className="text-black bg-white">
                            {getStatusLabel(s)}
                        </option>
                    ))}
                </select>
            </div>
            <p className="mt-2 text-[10px] text-gray-500 text-right">
                Clic para cambiar estado
            </p>
        </div>
    )
}
