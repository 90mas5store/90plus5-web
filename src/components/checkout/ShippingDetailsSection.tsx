'use client';

import { useState } from 'react';
import { ChevronDown, AlertCircle, Navigation, MapPin, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { CheckoutFormData, CheckoutFormErrors } from '@/types/checkout';

interface ShippingDetailsSectionProps {
    formData: CheckoutFormData;
    errores: CheckoutFormErrors;
    uniqueDepartments: string[];
    municipalities: string[];
    onDepartmentChange: (department: string) => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onDetectLocation: () => void;
    isOpen: boolean;
    onToggle: () => void;
    onShippingComplete?: () => void;
}

export default function ShippingDetailsSection({
    formData,
    errores,
    uniqueDepartments,
    municipalities,
    onDepartmentChange,
    onChange,
    onBlur,
    onDetectLocation,
    isOpen,
    onToggle,
    onShippingComplete,
}: ShippingDetailsSectionProps) {
    const [isLocating, setIsLocating] = useState(false);

    const handleLocateClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsLocating(true);
        try {
            await onDetectLocation();
        } finally {
            setTimeout(() => setIsLocating(false), 800);
        }
    };

    const isTegucigalpa = formData.departamento === 'Francisco Morazán' && formData.municipio === 'Distrito Central';
    const isComplete = Boolean(formData.departamento && formData.municipio && formData.direccion.trim().length >= 5);

    return (
        <section
            id="section-entrega"
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
                        <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-base font-black uppercase tracking-tight text-white flex items-center gap-2">
                            Lugar de Entrega
                        </h2>
                        {!isOpen && formData.municipio && (
                            <p className="text-xs text-zinc-400 truncate mt-0.5">
                                {formData.municipio}, {formData.departamento}
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
                        {/* GPS Action Bar */}
                        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/5">
                            <span className="text-xs text-zinc-400">
                                {isTegucigalpa ? '🚚 Envío Local Tegucigalpa (Gratis)' : '📦 Envío Nacional Cargo Expreso (CAEX)'}
                            </span>
                            <button
                                onClick={handleLocateClick}
                                type="button"
                                disabled={isLocating}
                                className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer select-none"
                            >
                                <Navigation className={`w-3.5 h-3.5 text-primary ${isLocating ? 'animate-spin' : ''}`} />
                                <span>{isLocating ? 'Detectando...' : 'Detectar con GPS'}</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Departamento */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                                    <span>Departamento *</span>
                                    {errores.departamento && (
                                        <span className="text-red-400 text-xs font-medium flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> Requerido
                                        </span>
                                    )}
                                </label>
                                <div className="relative">
                                    <select
                                        name="departamento"
                                        value={formData.departamento}
                                        onChange={(e) => onDepartmentChange(e.target.value)}
                                        onBlur={onBlur}
                                        className={`w-full px-3.5 py-3 rounded-xl bg-black/40 border text-base sm:text-sm text-white appearance-none cursor-pointer outline-none transition-all ${
                                            errores.departamento
                                                ? 'border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                                                : 'border-white/10 hover:border-white/20 focus:border-white/40 focus:bg-black/60'
                                        }`}
                                    >
                                        <option value="" className="bg-[#121318] text-zinc-400">
                                            Selecciona...
                                        </option>
                                        {uniqueDepartments.map((dep) => (
                                            <option key={dep} value={dep} className="bg-[#121318] text-white">
                                                {dep}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                                </div>
                            </div>

                            {/* Municipio */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                                    <span>Municipio *</span>
                                    {isTegucigalpa && (
                                        <span className="text-emerald-400 text-xs font-bold uppercase">
                                            Envío Gratis
                                        </span>
                                    )}
                                    {errores.municipio && !isTegucigalpa && (
                                        <span className="text-red-400 text-xs font-medium flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> Requerido
                                        </span>
                                    )}
                                </label>
                                <div className="relative">
                                    <select
                                        name="municipio"
                                        value={formData.municipio}
                                        onChange={onChange}
                                        onBlur={onBlur}
                                        disabled={!formData.departamento}
                                        className={`w-full px-3.5 py-3 rounded-xl bg-black/40 border text-base sm:text-sm text-white appearance-none cursor-pointer outline-none transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                            errores.municipio
                                                ? 'border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                                                : 'border-white/10 hover:border-white/20 focus:border-white/40 focus:bg-black/60'
                                        }`}
                                    >
                                        <option value="" className="bg-[#121318] text-zinc-400">
                                            {formData.departamento ? 'Selecciona...' : 'Elige departamento'}
                                        </option>
                                        {formData.departamento &&
                                            municipalities.map((mun) => (
                                                <option key={mun} value={mun} className="bg-[#121318] text-white">
                                                    {mun}
                                                </option>
                                            ))}
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                                </div>
                            </div>

                            {/* Dirección Exacta */}
                            <div className="space-y-1.5 sm:col-span-2">
                                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                                    <span>Dirección Exacta *</span>
                                    {errores.direccion && (
                                        <span className="text-red-400 text-xs font-medium flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> Requerido
                                        </span>
                                    )}
                                </label>
                                <div className="relative">
                                    <textarea
                                        name="direccion"
                                        rows={2}
                                        value={formData.direccion}
                                        onChange={onChange}
                                        onBlur={(e) => {
                                            onBlur(e);
                                            if (onShippingComplete && formData.departamento && formData.municipio && e.target.value.trim().length >= 5) {
                                                onShippingComplete();
                                            }
                                        }}
                                        placeholder="Colonia, calle, número de casa y puntos de referencia..."
                                        className={`w-full px-3.5 py-3 rounded-xl bg-black/40 border text-base sm:text-sm text-white placeholder-zinc-500 outline-none transition-all resize-none ${
                                            errores.direccion
                                                ? 'border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                                                : 'border-white/10 hover:border-white/20 focus:border-white/40 focus:bg-black/60'
                                        }`}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
