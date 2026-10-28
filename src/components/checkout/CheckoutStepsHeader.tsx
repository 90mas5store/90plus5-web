'use client';

import { motion } from '@/lib/motion';
import { Check } from 'lucide-react';

interface CheckoutStepsHeaderProps {
    currentStep: number;
    step1Complete: boolean;
    step2Complete: boolean;
    step3Complete: boolean;
    onStepClick?: (stepNumber: number) => void;
}

export default function CheckoutStepsHeader({
    currentStep,
    step1Complete,
    step2Complete,
    step3Complete,
    onStepClick,
}: CheckoutStepsHeaderProps) {
    const steps = [
        { num: 1, label: 'Contacto', isComplete: step1Complete, sectionId: 'section-contacto' },
        { num: 2, label: 'Entrega', isComplete: step2Complete, sectionId: 'section-entrega' },
        { num: 3, label: 'Pago', isComplete: step3Complete, sectionId: 'section-pago' },
    ];

    const handleScrollTo = (sectionId: string, stepNum: number) => {
        if (onStepClick) onStepClick(stepNum);
        const el = document.getElementById(sectionId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="w-full mb-8">
            <div className="flex items-center justify-between max-w-xl mx-auto px-2 relative">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-[1px] bg-white/10 -z-0" />

                {steps.map((step) => {
                    const isActive = currentStep === step.num;
                    return (
                        <button
                            key={step.num}
                            type="button"
                            onClick={() => handleScrollTo(step.sectionId, step.num)}
                            className="relative z-10 flex flex-col items-center gap-1.5 group cursor-pointer select-none active:scale-95 transition-transform"
                        >
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                    step.isComplete
                                        ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                        : isActive
                                        ? 'bg-primary text-white ring-4 ring-primary/20 shadow-[0_0_15px_rgba(229,9,20,0.4)]'
                                        : 'bg-[#121318] text-zinc-500 border border-white/10 group-hover:border-white/20'
                                }`}
                            >
                                {step.isComplete ? (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', damping: 20, stiffness: 350 }}
                                    >
                                        <Check className="w-4 h-4 stroke-[3]" />
                                    </motion.div>
                                ) : (
                                    <span>{step.num}</span>
                                )}
                            </div>

                            <span
                                className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
                                    isActive ? 'text-white' : step.isComplete ? 'text-emerald-400' : 'text-zinc-500'
                                }`}
                            >
                                {step.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
