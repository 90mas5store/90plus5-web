'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, TriangleAlert, X, Loader2 } from 'lucide-react'
import { deleteOrderAction } from '@/app/admin/actions'

interface DeleteOrderButtonProps {
    orderId: string
    orderRef: string // ej: "A1B2C3D4"
}

export default function DeleteOrderButton({ orderId, orderRef }: DeleteOrderButtonProps) {
    const router = useRouter()
    const [modalOpen, setModalOpen] = useState(false)
    const [confirmText, setConfirmText] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    const CONFIRM_WORD = 'ELIMINAR'
    const isConfirmed = confirmText === CONFIRM_WORD

    // Focus el input al abrir el modal
    useEffect(() => {
        if (modalOpen) {
            setConfirmText('')
            setError('')
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [modalOpen])

    // Cerrar con Escape
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setModalOpen(false)
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [])

    const handleDelete = async () => {
        if (!isConfirmed || loading) return
        setLoading(true)
        setError('')

        const result = await deleteOrderAction(orderId)

        if (result.success) {
            router.push('/admin/orders')
            router.refresh()
        } else {
            setError(result.error || 'Ocurrió un error inesperado.')
            setLoading(false)
        }
    }

    return (
        <>
            {/* ── Botón de apertura ── */}
            <button
                id="delete-order-btn"
                onClick={() => setModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                           bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40
                           text-red-400 hover:text-red-300 font-bold text-sm transition-all duration-200
                           group"
            >
                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Eliminar pedido definitivamente
            </button>

            {/* ── Modal de confirmación ── */}
            {modalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

                    {/* Card */}
                    <div className="relative w-full max-w-md bg-neutral-900 border border-red-500/30 rounded-2xl shadow-2xl shadow-red-500/10 p-6 animate-in fade-in zoom-in-95 duration-200">

                        {/* Cerrar */}
                        <button
                            onClick={() => setModalOpen(false)}
                            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Icono */}
                        <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mb-5 mx-auto">
                            <TriangleAlert className="w-7 h-7 text-red-400" />
                        </div>

                        {/* Título */}
                        <h2 className="text-xl font-black text-white text-center mb-1">
                            ¿Eliminar pedido?
                        </h2>
                        <p className="text-gray-400 text-sm text-center mb-6">
                            El pedido{' '}
                            <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                                #{orderRef}
                            </span>{' '}
                            y todos sus datos (pagos, notas, historial) serán borrados{' '}
                            <strong className="text-red-400">permanentemente</strong>.
                            Esta acción no se puede deshacer.
                        </p>

                        {/* Campo de confirmación */}
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                Escribe{' '}
                                <span className="font-mono text-red-400">{CONFIRM_WORD}</span>{' '}
                                para confirmar
                            </label>
                            <input
                                ref={inputRef}
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleDelete() }}
                                placeholder={CONFIRM_WORD}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3
                                           text-white font-mono placeholder:text-gray-600
                                           focus:outline-none focus:border-red-500/50
                                           transition-colors"
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Acciones */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setModalOpen(false)}
                                disabled={loading}
                                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300
                                           font-bold text-sm transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={!isConfirmed || loading}
                                className="flex-1 py-3 rounded-xl font-black text-sm transition-all duration-200
                                           flex items-center justify-center gap-2
                                           bg-red-600 hover:bg-red-500 text-white
                                           disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-red-600"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Eliminando...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Eliminar
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
