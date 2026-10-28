'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from '@/lib/motion';
import {
    CreditCard,
    Building2,
    ExternalLink,
    DollarSign,
    Lock,
    Copy,
    Check,
    ChevronDown,
    CheckCircle2,
} from 'lucide-react';
import { PaymentMethodConfig, BankAccountRecord } from '@/lib/config/banks';
import PaymentTypeSelector from './PaymentTypeSelector';

interface PaymentMethodSectionProps {
    metodoPago: string;
    setMetodoPago: (value: string) => void;
    paymentMethods: PaymentMethodConfig[];
    bankAccounts: BankAccountRecord[];
    paymentType?: 'deposit' | 'full';
    setPaymentType?: (type: 'deposit' | 'full') => void;
    depositAmount?: number;
    fullAmount?: number;
    isOpen: boolean;
    onToggle: () => void;
}

export default function PaymentMethodSection({
    metodoPago,
    setMetodoPago,
    paymentMethods,
    bankAccounts,
    paymentType = 'deposit',
    setPaymentType,
    depositAmount = 0,
    fullAmount = 0,
    isOpen,
    onToggle,
}: PaymentMethodSectionProps) {
    const [copiedAccountId, setCopiedAccountId] = useState<string | null>(null);

    const handleCopyNumber = (accountNumber: string, id: string) => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(accountNumber);
            setCopiedAccountId(id);
            setTimeout(() => setCopiedAccountId(null), 2000);
        }
    };

    const selectedMethod = paymentMethods.find((m) => (m.code || m.id) === metodoPago);
    const isCard = metodoPago === 'tarjeta' || selectedMethod?.type === 'tarjeta';
    const isComplete = Boolean(metodoPago);

    return (
        <section
            id="section-pago"
            className="relative bg-[#0d0e12]/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-xl scroll-mt-24 transition-all overflow-hidden"
        >
            {/* Specular top highlight */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            {/* Clickable Header for Collapsible accordion */}
            <div
                onClick={onToggle}
                className="flex items-center justify-between p-5 sm:p-6 cursor-pointer select-none group hover:bg-white/[0.02] transition-colors"
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
                        <CreditCard className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-base font-black uppercase tracking-tight text-white flex items-center gap-2">
                            Método de Pago
                        </h2>
                        {!isOpen && selectedMethod && (
                            <p className="text-xs text-zinc-400 truncate mt-0.5">
                                {selectedMethod.name} {isCard && (paymentType === 'full' ? '· Pago Total' : '· Anticipo 50%')}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {isComplete && !isOpen && (
                        <span className="hidden sm:flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Listo
                        </span>
                    )}

                    <div
                        className={`w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-white transition-transform duration-300 ${
                            isOpen ? 'rotate-180' : ''
                        }`}
                    >
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* Collapsible Content */}
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                        className="overflow-hidden px-5 sm:px-6 pb-6 pt-1 border-t border-white/5"
                    >
                        {/* Opciones de pago */}
                        <div className="space-y-3 pt-3">
                            {paymentMethods
                                .filter((opt) => opt.active !== false && (opt.type as string) !== 'paypal' && opt.code !== 'paypal')
                                .map((opt) => {
                                    const optCode = opt.code || opt.id;
                                    const isSelected = metodoPago === optCode;
                                    const isDisabled = opt.is_coming_soon;

                                    let IconComponent = CreditCard;
                                    if (opt.type === 'transferencia') IconComponent = Building2;
                                    if (opt.type === 'link_pago') IconComponent = ExternalLink;
                                    if (opt.type === 'efectivo') IconComponent = DollarSign;

                                    const isCardOption = opt.type === 'tarjeta' || optCode === 'tarjeta';

                                    return (
                                        <div
                                            key={opt.id || optCode}
                                            onClick={() => !isDisabled && setMetodoPago(optCode)}
                                            className={`group relative p-4 rounded-xl border transition-all cursor-pointer select-none active:scale-[0.99] ${
                                                isSelected
                                                    ? 'border-white/30 bg-white/[0.07] shadow-sm'
                                                    : 'border-white/[0.08] bg-black/30 hover:border-white/15 hover:bg-black/50'
                                            } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    <div
                                                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                                            isSelected ? 'bg-white text-black' : 'bg-white/5 text-zinc-400'
                                                        }`}
                                                    >
                                                        <IconComponent className="w-5 h-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-sm sm:text-base text-white">
                                                                {opt.name}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
                                                            {opt.description}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Radio circle */}
                                                <div
                                                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                                        isSelected ? 'border-primary bg-primary' : 'border-white/20'
                                                    }`}
                                                >
                                                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>

                        {/* Contenido dinámico según método */}
                        <AnimatePresence mode="wait">
                            {/* 💳 Tarjeta PixelPay */}
                            {isCard && (
                                <motion.div
                                    key="card-info"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="mt-5 pt-5 border-t border-white/10 space-y-4 overflow-hidden"
                                >
                                    {setPaymentType && depositAmount > 0 && fullAmount > 0 && (
                                        <PaymentTypeSelector
                                            paymentType={paymentType}
                                            onChange={setPaymentType}
                                            depositAmount={depositAmount}
                                            fullAmount={fullAmount}
                                        />
                                    )}

                                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs text-zinc-300">
                                        <span className="flex items-center gap-2">
                                            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                                            Cobro seguro con PixelPay (Visa & Mastercard)
                                        </span>
                                        <span className="text-xs text-zinc-400 uppercase font-mono font-bold">3D Secure</span>
                                    </div>
                                </motion.div>
                            )}

                            {/* 🏦 Transferencias */}
                            {metodoPago === 'transferencia' && (
                                <motion.div
                                    key="bank-info"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="mt-5 pt-5 border-t border-white/10 space-y-3.5 overflow-hidden"
                                >
                                    <p className="text-xs text-zinc-300">
                                        Transfiere el 50% de anticipo a cualquiera de nuestras cuentas oficiales:
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {bankAccounts
                                            .filter((b) => b.activo)
                                            .map((bank) => {
                                                const isCopied = copiedAccountId === bank.id;
                                                return (
                                                    <div
                                                        key={bank.id}
                                                        className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                {bank.logo && (
                                                                    <div className="relative w-5 h-5 shrink-0 rounded overflow-hidden">
                                                                        <Image
                                                                            src={bank.logo}
                                                                            alt={bank.banco}
                                                                            fill
                                                                            sizes="20px"
                                                                            className="object-contain"
                                                                        />
                                                                    </div>
                                                                )}
                                                                <span className="font-bold text-sm text-white uppercase">
                                                                    {bank.banco}
                                                                </span>
                                                            </div>
                                                            <span className="text-xs text-zinc-400 uppercase font-medium">{bank.tipo}</span>
                                                        </div>

                                                        <div className="flex items-center justify-between bg-black/60 rounded-lg px-3 py-2">
                                                            <span className="text-sm font-mono font-bold text-primary select-all">
                                                                {bank.numero}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCopyNumber(bank.numero, bank.id)}
                                                                className="text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
                                                            >
                                                                {isCopied ? (
                                                                    <>
                                                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                                        <span className="text-emerald-400">Listo</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Copy className="w-3.5 h-3.5" />
                                                                        <span>Copiar</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>

                                                        <div className="text-xs text-zinc-400 truncate">
                                                            Titular: {bank.titular}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
