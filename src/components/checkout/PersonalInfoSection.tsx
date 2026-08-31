'use client';

import { User, Mail, Phone } from 'lucide-react';
import { CheckoutFormData, CheckoutFormErrors } from '@/types/checkout';
import { BUSINESS_LOGIC } from '@/lib/constants';

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
    return (
        <section className="bg-white/5 backdrop-blur-md sm:backdrop-blur-xl border border-white/10 p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center border border-primary/20">
                    <User className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <h2 className="text-lg md:text-xl font-black uppercase tracking-tight">Información Personal</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                        Nombre Completo *
                    </label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        <input
                            name="nombre"
                            value={formData.nombre}
                            onChange={onChange}
                            onBlur={onBlur}
                            placeholder="Ej. Juan Pérez"
                            className={`w-full pl-12 pr-4 py-4 rounded-2xl bg-black/40 border ${
                                errores.nombre ? 'border-red-500/50' : 'border-white/10'
                            } focus:border-primary/50 outline-none text-white transition-all font-medium`}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                        Correo Electrónico *
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        <input
                            type="email"
                            name="correo"
                            value={formData.correo}
                            onChange={onChange}
                            onBlur={onBlur}
                            placeholder="juan@ejemplo.com"
                            className={`w-full pl-12 pr-4 py-4 rounded-2xl bg-black/40 border ${
                                errores.correo ? 'border-red-500/50' : 'border-white/10'
                            } focus:border-primary/50 outline-none text-white transition-all font-medium`}
                        />
                    </div>
                </div>

                {/* 🍯 HONEYPOT (Invisible para humanos, trampa para bots) */}
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

                <div className="space-y-2 sm:col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                        Teléfono de Contacto *
                    </label>
                    <div className="relative flex items-center">
                        <div className="absolute left-3 sm:left-4 flex items-center gap-1 sm:gap-2 text-gray-500 border-r border-white/10 pr-2 sm:pr-3">
                            <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm font-bold">{BUSINESS_LOGIC.CONTACT.PHONE_PREFIX}</span>
                        </div>
                        <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={9}
                            name="telefono"
                            value={formData.telefono}
                            onChange={onChange}
                            onBlur={onBlur}
                            placeholder="0000-0000"
                            className={`w-full pl-20 sm:pl-24 pr-4 py-4 rounded-2xl bg-black/40 border ${
                                errores.telefono ? 'border-red-500/50' : 'border-white/10'
                            } focus:border-primary/50 outline-none text-white transition-all font-medium tracking-widest`}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
