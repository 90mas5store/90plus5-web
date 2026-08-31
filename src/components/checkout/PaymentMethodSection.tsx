'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from '@/lib/motion';
import {
    CreditCard,
    Building2,
    CheckCircle2,
    AlertCircle,
    ExternalLink,
    DollarSign,
} from 'lucide-react';
import { PaymentMethodConfig, BankAccountRecord } from '@/lib/config/banks';

interface PaymentMethodSectionProps {
    metodoPago: string;
    setMetodoPago: (value: string) => void;
    paymentMethods: PaymentMethodConfig[];
    bankAccounts: BankAccountRecord[];
}

export default function PaymentMethodSection({
    metodoPago,
    setMetodoPago,
    paymentMethods,
    bankAccounts,
}: PaymentMethodSectionProps) {
    return (
        <section className="bg-white/5 backdrop-blur-md sm:backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                    <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight">Método de Pago</h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {paymentMethods
                    .filter((opt) => opt.active !== false)
                    .map((opt) => {
                    const optCode = opt.code || opt.id;
                    const isDisabled = opt.is_coming_soon;
                    const isPaypal = opt.type === 'paypal' || optCode === 'paypal';

                    let IconComponent = CreditCard;
                    if (opt.type === 'transferencia') IconComponent = Building2;
                    if (opt.type === 'link_pago') IconComponent = ExternalLink;
                    if (opt.type === 'efectivo') IconComponent = DollarSign;

                    return (
                        <label
                            key={opt.id || optCode}
                            className={`group relative flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                                metodoPago === optCode
                                    ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(229,9,20,0.15)]'
                                    : 'border-white/5 bg-black/40 hover:border-white/20'
                            } ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                            <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                                    metodoPago === optCode
                                        ? 'bg-primary text-white'
                                        : isPaypal
                                        ? 'bg-[#003087]/20 text-[#0079C1] border border-[#0079C1]/30 group-hover:bg-[#003087]/30'
                                        : 'bg-white/5 text-gray-500 group-hover:text-white'
                                }`}
                            >
                                {isPaypal ? (
                                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.82.875 4.965-.039.194-.086.39-.14.586-.882 4.417-3.834 6.721-8.528 6.721H9.278l-1.39 8.813a.642.642 0 0 1-.633.542zM8.88 12.182h1.666c3.275 0 5.28-1.571 5.943-4.893.037-.184.07-.367.098-.549.324-1.62-.02-2.73-.895-3.328-.737-.503-1.921-.692-3.64-.692H6.942L4.99 17.587h2.478l1.412-5.405z" />
                                    </svg>
                                ) : (
                                    <IconComponent className="w-6 h-6" />
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-black uppercase tracking-tight text-sm">{opt.name}</span>
                                    {opt.is_coming_soon && (
                                        <span className="text-[8px] bg-white/10 px-2 py-0.5 rounded-full text-gray-400 font-bold tracking-widest uppercase">
                                            PRÓXIMAMENTE
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 font-medium">{opt.description}</p>
                            </div>
                            <input
                                type="radio"
                                name="metodoPago"
                                value={optCode}
                                checked={metodoPago === optCode}
                                onChange={(e) => !isDisabled && setMetodoPago(e.target.value)}
                                className="hidden"
                                disabled={isDisabled}
                            />
                            {metodoPago === optCode && (
                                <motion.div layoutId="check" className="absolute right-6">
                                    <CheckCircle2 className="w-6 h-6 text-primary" />
                                </motion.div>
                            )}
                        </label>
                    );
                })}
            </div>

            <AnimatePresence>
                {metodoPago === 'transferencia' && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-6 p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4"
                    >
                        <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-primary" />
                            <h3 className="text-sm font-black uppercase tracking-tight text-white">
                                Cuentas Bancarias para Transferencia
                            </h3>
                        </div>
                        <p className="text-xs text-gray-400">
                            Puedes realizar la transferencia del anticipo del 50% (o total) a cualquiera de nuestras cuentas oficiales:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {bankAccounts
                                .filter((b) => b.activo)
                                .map((bank) => (
                                    <div key={bank.id} className="p-3.5 bg-black/50 border border-white/10 rounded-xl space-y-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {bank.logo && (
                                                <div className="relative w-5 h-5 shrink-0 rounded overflow-hidden">
                                                    <Image src={bank.logo} alt={bank.banco} fill className="object-contain" />
                                                </div>
                                            )}
                                            <span className="font-black text-xs text-white uppercase">{bank.banco}</span>
                                        </div>
                                        <div className="text-[11px] font-mono font-bold text-primary tracking-wider">{bank.numero}</div>
                                        <div className="text-[10px] text-gray-400 font-medium truncate">{bank.titular}</div>
                                        <div className="text-[9px] text-gray-500 uppercase">{bank.tipo}</div>
                                    </div>
                                ))}
                        </div>
                    </motion.div>
                )}

                {paymentMethods.find((m) => (m.code || m.id) === metodoPago)?.is_coming_soon && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-6 p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-3"
                    >
                        <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-white uppercase tracking-tight">Función no disponible</p>
                            <p className="text-xs text-gray-400 mt-1">
                                Estamos trabajando para integrar esta opción de pago. Por favor selecciona otro método por ahora.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
