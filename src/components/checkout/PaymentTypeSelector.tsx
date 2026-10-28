'use client';

import { motion } from '@/lib/motion';

interface PaymentTypeSelectorProps {
    paymentType: 'deposit' | 'full';
    onChange: (type: 'deposit' | 'full') => void;
    depositAmount: number;
    fullAmount: number;
    className?: string;
}

export default function PaymentTypeSelector({
    paymentType,
    onChange,
    depositAmount,
    fullAmount,
    className = '',
}: PaymentTypeSelectorProps) {
    const formattedDeposit = depositAmount.toLocaleString('es-HN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    const formattedFull = fullAmount.toLocaleString('es-HN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return (
        <div className={`space-y-3 ${className}`}>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
                Monto a abonar hoy:
            </label>

            {/* Apple Segmented Control */}
            <div className="relative p-1 rounded-xl bg-black/50 border border-white/10 grid grid-cols-2 gap-1.5">
                {/* 50% Anticipo Option */}
                <button
                    type="button"
                    onClick={() => onChange('deposit')}
                    className={`relative z-10 py-3 px-3 rounded-lg text-center transition-all cursor-pointer select-none active:scale-[0.98] ${
                        paymentType === 'deposit' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                    {paymentType === 'deposit' && (
                        <motion.div
                            layoutId="paymentTypePill"
                            className="absolute inset-0 bg-white/15 border border-white/20 rounded-lg shadow-sm -z-10"
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        />
                    )}
                    <div className="text-xs font-bold uppercase tracking-wider">Anticipo (50%)</div>
                    <div className="text-base font-black font-mono mt-0.5">L {formattedDeposit}</div>
                </button>

                {/* 100% Pago Total Option */}
                <button
                    type="button"
                    onClick={() => onChange('full')}
                    className={`relative z-10 py-3 px-3 rounded-lg text-center transition-all cursor-pointer select-none active:scale-[0.98] ${
                        paymentType === 'full' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                    {paymentType === 'full' && (
                        <motion.div
                            layoutId="paymentTypePill"
                            className="absolute inset-0 bg-white/15 border border-white/20 rounded-lg shadow-sm -z-10"
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        />
                    )}
                    <div className="text-xs font-bold uppercase tracking-wider">Total (100%)</div>
                    <div className="text-base font-black font-mono mt-0.5">L {formattedFull}</div>
                </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
                {paymentType === 'deposit'
                    ? 'Pagas el 50% hoy para iniciar la preparación de tu orden y el 50% restante cuando tu pedido esté listo para entrega.'
                    : 'Pagas el valor total de tu orden hoy y queda 100% cancelada sin pagos pendientes.'}
            </p>
        </div>
    );
}
