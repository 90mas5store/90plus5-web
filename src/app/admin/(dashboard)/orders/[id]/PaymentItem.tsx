'use client'

import { useState } from 'react'
import { updatePaymentStatus } from '@/app/admin/actions'
import { Check, X, Loader2, AlertCircle, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

interface Payment {
    id: string
    amount: number
    type: string
    status: string
    method: string
    created_at: string
}

export default function PaymentItem({ payment }: { payment: Payment }) {
    const [loading, setLoading] = useState(false)

    const handleVerify = async () => {
        if (!confirm('¿Has verificado que el dinero ingresó a la cuenta? Esto actualizará el estado del pedido automáticamente.')) return;

        setLoading(true)
        try {
            await updatePaymentStatus(payment.id, 'completed')
            toast.success('Pago verificado y estado actualizado')
        } catch (e) {
            toast.error('Error al verificar')
        } finally {
            setLoading(false)
        }
    }

    const handleReject = async () => {
        if (!confirm('¿Marcar pago como fallido o rechazado?')) return;
        setLoading(true)
        try {
            await updatePaymentStatus(payment.id, 'failed')
            toast.error('Pago marcado como fallido')
        } catch (e) {
            toast.error('Error')
        } finally {
            setLoading(false)
        }
    }

    // Styles based on status
    const isPending = payment.status === 'pending';
    const isCompleted = payment.status === 'completed';
    const isFailed = payment.status === 'failed';

    return (
        <div className={`
            relative p-5 rounded-2xl border transition-all duration-300
            ${isCompleted ? 'bg-green-500/5 border-green-500/30' :
                isFailed ? 'bg-red-500/5 border-red-500/30 opacity-60' :
                    'bg-neutral-800/50 border-white/10 hover:border-yellow-500/30'}
        `}>
            {/* Background Pattern for Pending */}
            {isPending && <div className="absolute top-0 right-0 w-2 h-2 m-3 rounded-full bg-yellow-500 animate-pulse shadow-[0_0_8px_#EAB308]" />}

            <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="font-black text-white text-lg tracking-tight capitalize">
                            {payment.type === 'deposit' ? 'Anticipo 50%' : payment.type}
                        </span>
                        {isCompleted && <ShieldCheck className="w-4 h-4 text-green-500" />}
                    </div>
                    <div className="text-sm text-gray-400 font-mono">
                        {payment.method} · {new Date(payment.created_at).toLocaleDateString()}
                    </div>
                </div>

                <div className="text-right">
                    <div className={`text-xl font-black ${isFailed ? 'text-red-500 line-through' : 'text-white'}`}>
                        L {payment.amount.toLocaleString()}
                    </div>
                    <div className={`
                        text-[10px] font-bold uppercase tracking-widest mt-1
                        ${isCompleted ? 'text-green-500' : isFailed ? 'text-red-500' : 'text-yellow-500'}
                    `}>
                        {isPending ? 'Revisión Pendiente' : isCompleted ? 'Verificado' : 'Rechazado'}
                    </div>
                </div>
            </div>

            {/* ACTION BUTTONS */}
            {isPending && (
                <div className="flex gap-2 pt-4 border-t border-white/5">
                    <button
                        onClick={handleVerify}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500 text-white rounded-xl font-bold text-xs uppercase hover:bg-green-400 transition-colors shadow-lg shadow-green-900/20 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Confirmar Ingreso
                    </button>

                    <button
                        onClick={handleReject}
                        disabled={loading}
                        className="w-12 flex items-center justify-center bg-white/5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50"
                        title="Rechazar"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    )
}
