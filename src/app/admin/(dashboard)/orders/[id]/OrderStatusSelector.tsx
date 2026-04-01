'use client'

import { useState } from 'react'
import { updateOrderStatus, registerPaymentAction } from '@/app/admin/actions'
import { Loader2, ChevronDown, CheckCircle2, X } from 'lucide-react'
import { getStatusColor, getStatusLabel } from '@/components/admin/OrderStatusBadge'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from '@/lib/motion'

const AVAILABLE_STATUSES = [
    'pending_payment_50',
    'deposit_paid',
    'processing',
    'in_transit',
    'ready_for_delivery',
    'pending_second_payment',
    'shipped_to_costumer',
    'completed',
    'Cancelled'
];

export default function OrderStatusSelector({ orderId, currentStatus }: { orderId: string, currentStatus: string }) {
    const [status, setStatus] = useState(currentStatus)
    const [loading, setLoading] = useState(false)
    const [paymentModalData, setPaymentModalData] = useState<{ isOpen: boolean, targetStatus: string } | null>(null)
    const [paymentForm, setPaymentForm] = useState({
        method: 'Transferencia',
        bank: '',
        date: new Date().toISOString().split('T')[0],
        reference: '',
        amount: ''
    })

    const handleStatusChange = async (newStatus: string) => {
        if (newStatus === status) return;

        // If it requires payment confirmation
        if (newStatus === 'deposit_paid' || newStatus === 'shipped_to_costumer') {
            setPaymentModalData({ isOpen: true, targetStatus: newStatus })
            return;
        }

        executeStatusUpdate(newStatus)
    }

    const executeStatusUpdate = async (newStatus: string) => {
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

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentModalData?.targetStatus) return;

        setLoading(true);
        try {
            await registerPaymentAction(orderId, {
                newStatus: paymentModalData.targetStatus,
                payment: {
                    amount: parseFloat(paymentForm.amount),
                    method: paymentForm.method,
                    bank: paymentForm.bank,
                    reference: paymentForm.reference,
                    date: paymentForm.date
                }
            })
            setStatus(paymentModalData.targetStatus)
            setPaymentModalData(null)
            toast.success('Pago registrado y estado actualizado')
        } catch (error) {
            toast.error('Error al procesar el pago')
            console.error(error)
        } finally {
            setLoading(false)
            setPaymentForm({ method: 'Transferencia', bank: '', date: new Date().toISOString().split('T')[0], reference: '', amount: '' })
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
                    {AVAILABLE_STATUSES.map((s, i) => {
                        let activeMatch = status;
                        if (activeMatch === 'shipped_to_hn') activeMatch = 'in_transit';
                        if (activeMatch === 'paid_full') activeMatch = 'completed';
                        
                        const currentIndex = AVAILABLE_STATUSES.indexOf(activeMatch);
                        
                        // No saltar pasos: Solo se permite retroceder, quedarse igual, avanzar máximo 1 o Cancelar
                        let isOptionDisabled = false;
                        if (s !== 'Cancelled' && currentIndex !== -1) {
                            if (i > currentIndex + 1) {
                                isOptionDisabled = true;
                            }
                        }

                        return (
                            <option 
                                key={s} 
                                value={s} 
                                className={`text-black bg-white ${isOptionDisabled ? 'opacity-50 text-gray-500' : ''}`}
                                disabled={isOptionDisabled}
                            >
                                {getStatusLabel(s)} {isOptionDisabled ? '(Bloqueado)' : ''}
                            </option>
                        );
                    })}
                </select>
            </div>
            <p className="mt-2 text-[10px] text-gray-500 text-right">
                Clic para cambiar estado
            </p>

            {/* PAYMENT CAPTURE MODAL */}
            <AnimatePresence>
                {paymentModalData?.isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => !loading && setPaymentModalData(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-neutral-900 border border-white/10 p-6 md:p-8 rounded-2xl md:rounded-[2rem] w-full max-w-md shadow-2xl relative overflow-hidden"
                        >
                            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-6">Registrar Pago</h2>
                            <p className="text-sm text-gray-400 mb-6">Ingresa los detalles financieros para confirmar el pago en sistema.</p>
                            
                            <form onSubmit={handlePaymentSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Método de Pago</label>
                                    <select required value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })} className="w-full mt-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary">
                                        <option value="Transferencia">Transferencia Bancaria</option>
                                        <option value="Efectivo">Efectivo</option>
                                        <option value="Tarjeta">Tarjeta de Crédito/Débito</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Banco / Billetera</label>
                                        <input required type="text" placeholder="Ej. BAC, Ficohsa, Tengo" value={paymentForm.bank} onChange={(e) => setPaymentForm({ ...paymentForm, bank: e.target.value })} className="w-full mt-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Fecha</label>
                                        <input required type="date" value={paymentForm.date} onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })} className="w-full mt-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Referencia</label>
                                        <input required type="text" placeholder="# de recibo/transferencia" value={paymentForm.reference} onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })} className="w-full mt-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Monto (L)</label>
                                    <input required type="number" step="0.01" min="1" placeholder="Ej. 750.00" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} className="w-full mt-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-black text-lg outline-none focus:border-primary" />
                                </div>
                                
                                <div className="flex gap-3 pt-6">
                                    <button type="button" disabled={loading} onClick={() => setPaymentModalData(null)} className="flex-1 px-4 py-3 rounded-xl border border-white/10 font-bold text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-center disabled:opacity-50">
                                        Cancelar
                                    </button>
                                    <button type="submit" disabled={loading} className="flex-1 px-4 py-3 rounded-xl bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-wide flex items-center justify-center gap-2 text-sm shadow-[0_0_20px_rgba(229,9,20,0.3)] transition-all disabled:opacity-50">
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        Confirmar
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

