'use client';

import { MapPin, Truck } from 'lucide-react';
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
}: ShippingDetailsSectionProps) {
    return (
        <section className="bg-white/5 backdrop-blur-md sm:backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                    <MapPin className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight">Detalles de Entrega</h2>
            </div>

            {/* 📍 Botón de Geolocalización manual */}
            <div className="mb-6">
                <button
                    onClick={onDetectLocation}
                    type="button"
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary hover:text-primary-light transition-colors p-2 hover:bg-primary/5 rounded-lg border border-transparent hover:border-primary/20 cursor-pointer"
                >
                    <MapPin className="w-4 h-4" />
                    <span>Usar mi ubicación actual</span>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                        Departamento *
                    </label>
                    <select
                        name="departamento"
                        value={formData.departamento}
                        onChange={(e) => onDepartmentChange(e.target.value)}
                        onBlur={onBlur}
                        className={`w-full px-4 py-4 rounded-2xl bg-black/40 border ${
                            errores.departamento ? 'border-red-500/50' : 'border-white/10'
                        } text-white focus:border-primary/50 outline-none transition-all font-medium appearance-none`}
                    >
                        <option value="" className="bg-[#0a0a0a]">
                            Selecciona...
                        </option>
                        {uniqueDepartments.map((dep) => (
                            <option key={dep} value={dep} className="bg-[#0a0a0a]">
                                {dep}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                        Municipio *
                    </label>
                    <select
                        name="municipio"
                        value={formData.municipio}
                        onChange={onChange}
                        onBlur={onBlur}
                        disabled={!formData.departamento}
                        className={`w-full px-4 py-4 rounded-2xl bg-black/40 border ${
                            errores.municipio ? 'border-red-500/50' : 'border-white/10'
                        } text-white focus:border-primary/50 outline-none transition-all font-medium appearance-none disabled:opacity-30`}
                    >
                        <option value="" className="bg-[#0a0a0a]">
                            Selecciona...
                        </option>
                        {formData.departamento &&
                            municipalities.map((mun) => (
                                <option key={mun} value={mun} className="bg-[#0a0a0a]">
                                    {mun}
                                </option>
                            ))}
                    </select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                        Dirección Exacta *
                    </label>
                    <div className="relative">
                        <Truck className="absolute left-4 top-5 w-4 h-4 text-gray-600" />
                        <textarea
                            name="direccion"
                            rows={3}
                            value={formData.direccion}
                            onChange={onChange}
                            onBlur={onBlur}
                            placeholder="Barrio, calle, número de casa, puntos de referencia..."
                            className={`w-full pl-12 pr-4 py-4 rounded-2xl bg-black/40 border ${
                                errores.direccion ? 'border-red-500/50' : 'border-white/10'
                            } focus:border-primary/50 outline-none text-white transition-all font-medium resize-none`}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
