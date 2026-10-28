'use client';

import { User, Mail, Phone, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CheckoutFormData, CheckoutFormErrors } from '@/types/checkout';

interface PersonalInfoSectionProps {
    formData: CheckoutFormData;
    errores: CheckoutFormErrors;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export default function PersonalInfoSection({
    formData,
    errores,
    onChange,
    onBlur,
}: PersonalInfoSectionProps) {
    const isComplete = Boolean(
        formData.nombre.trim() &&
        formData.correo.includes('@') &&
        formData.telefono.replace(/\D/g, '').length >= 8
    );

    return (
        <section
            id="section-contacto"
            className="relative bg-[#0d0e12]/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl scroll-mt-24 transition-all"
        >
            {/* Specular top highlight */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                        <User className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-black uppercase tracking-tight text-white">
                        Información de Contacto
                    </h2>
                </div>

                {isComplete && (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Listo
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nombre Completo */}
                <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                        <span>Nombre Completo *</span>
                        {errores.nombre && (
                            <span className="text-red-400 text-xs font-medium flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Requerido
                            </span>
                        )}
                    </label>
                    <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                        <input
                            type="text"
                            name="nombre"
                            autoComplete="name"
                            value={formData.nombre}
                            onChange={onChange}
                            onBlur={onBlur}
                            placeholder="Ej. Juan Pérez"
                            className={`w-full pl-11 pr-3.5 py-3 rounded-xl bg-black/40 border text-base sm:text-sm text-white placeholder-zinc-500 outline-none transition-all ${
                                errores.nombre
                                    ? 'border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                                    : 'border-white/10 hover:border-white/20 focus:border-white/40 focus:bg-black/60'
                            }`}
                        />
                    </div>
                </div>

                {/* WhatsApp / Teléfono */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                        <span>WhatsApp / Teléfono *</span>
                        {errores.telefono && (
                            <span className="text-red-400 text-xs font-medium flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> 8 dígitos requeridos
                            </span>
                        )}
                    </label>
                    <div className="relative flex items-center">
                        <div className="absolute left-3 z-10 flex items-center gap-1.5 text-xs font-bold text-zinc-300 pointer-events-none select-none">
                            <span>🇭🇳</span>
                            <span>+504</span>
                        </div>
                        <input
                            type="tel"
                            name="telefono"
                            autoComplete="tel"
                            inputMode="numeric"
                            value={formData.telefono}
                            onChange={onChange}
                            onBlur={onBlur}
                            placeholder="9999-9999"
                            maxLength={9}
                            className={`w-full pl-20 pr-3.5 py-3 rounded-xl bg-black/40 border text-base sm:text-sm text-white font-mono placeholder-zinc-500 outline-none transition-all ${
                                errores.telefono
                                    ? 'border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                                    : 'border-white/10 hover:border-white/20 focus:border-white/40 focus:bg-black/60'
                            }`}
                        />
                    </div>
                </div>

                {/* Correo Electrónico */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                        <span>Correo Electrónico *</span>
                        {errores.correo && (
                            <span className="text-red-400 text-xs font-medium flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Correo inválido
                            </span>
                        )}
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                        <input
                            type="email"
                            name="correo"
                            autoComplete="email"
                            inputMode="email"
                            value={formData.correo}
                            onChange={onChange}
                            onBlur={onBlur}
                            placeholder="juan@ejemplo.com"
                            className={`w-full pl-11 pr-3.5 py-3 rounded-xl bg-black/40 border text-base sm:text-sm text-white placeholder-zinc-500 outline-none transition-all ${
                                errores.correo
                                    ? 'border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                                    : 'border-white/10 hover:border-white/20 focus:border-white/40 focus:bg-black/60'
                            }`}
                        />
                    </div>
                </div>

                {/* Honeypot invisible */}
                <div className="hidden absolute opacity-0 -z-50 h-0 w-0 overflow-hidden">
                    <label htmlFor="description">Business Address</label>
                    <input
                        type="text"
                        id="description"
                        name="description"
                        value={formData.description || ''}
                        onChange={onChange}
                        tabIndex={-1}
                        autoComplete="off"
                    />
                </div>
            </div>
        </section>
    );
}
