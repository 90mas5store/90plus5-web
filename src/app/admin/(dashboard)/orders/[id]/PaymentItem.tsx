'use client'

import { ShieldCheck, ImageIcon } from 'lucide-react'

interface Payment {
    id: string
    amount: number
    type: string
    status: string
    method: string
    created_at: string
    notes?: string
    proof_url?: string | null
}

export default function PaymentItem({ payment }: { payment: Payment }) {
    // Styles based on status
    const isPending = payment.status === 'pending';
    const isCompleted = payment.status === 'verified';
    const isFailed = payment.status === 'rejected';

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
                <div className="space-y-2 max-w-[65%]">
                    <div className="flex items-center gap-2">
                        <span className="font-black text-white text-lg tracking-tight capitalize">
                            {payment.type === 'deposit' ? 'Anticipo 50%' : payment.type}
                        </span>
                        {isCompleted && <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />}
                    </div>
                    <div className="text-sm text-gray-400 font-mono">
                        {payment.method} · {new Date(payment.created_at).toLocaleDateString()}
                    </div>
                    {payment.notes && (
                        <div className="text-xs bg-black/40 border border-white/5 rounded-lg p-2 text-gray-400 mt-2 break-words">
                            {payment.notes.split('|').map((note, idx) => (
                                <span key={idx} className="block truncate">{note.trim()}</span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="text-right">
                    <div className={`text-xl font-black ${isFailed ? 'text-red-500 line-through' : 'text-white'}`}>
                        L {payment.amount.toLocaleString("es-HN")}
                    </div>
                    <div className={`
                        text-[10px] font-bold uppercase tracking-widest mt-1
                        ${isCompleted ? 'text-green-500' : isFailed ? 'text-red-500' : 'text-yellow-500'}
                    `}>
                        {isPending ? 'Revisión Pendiente' : isCompleted ? 'Verificado' : 'Rechazado'}
                    </div>
                </div>
            </div>

            {/* COMPROBANTE DE PAGO */}
            {payment.proof_url && (
                <div className="pt-4 border-t border-white/5 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        Comprobante de pago
                    </p>
                    <a
                        href={payment.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative block w-full overflow-hidden rounded-xl border border-white/10 hover:border-primary/40 transition-colors"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={payment.proof_url}
                            alt="Comprobante de pago"
                            className="w-full max-h-48 object-contain bg-black/40 p-2"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="flex items-center gap-2 text-white text-xs font-bold">
                                <ImageIcon className="w-4 h-4" />
                                Ver imagen completa
                            </div>
                        </div>
                    </a>
                </div>
            )}

            {/* STATUS MESSAGE WITHOUT BUTTONS */}
            {isPending && !payment.proof_url && (
                <div className="pt-4 border-t border-white/5">
                    <div className="text-xs text-yellow-500/70 italic text-center">
                        Esperando comprobante o verificación vía el Gestor de Estados
                    </div>
                </div>
            )}
            {isPending && payment.proof_url && (
                <div className="pt-3">
                    <div className="text-xs text-yellow-500/70 italic text-center">
                        Comprobante recibido · Pendiente de verificación
                    </div>
                </div>
            )}
        </div>
    )
}
