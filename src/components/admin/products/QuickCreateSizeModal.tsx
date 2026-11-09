'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from '@/lib/motion';
import { X, Save, Loader2, Ruler, Shirt, Footprints, Tag, Check, Sparkles } from 'lucide-react';
import useToastMessage from '@/hooks/useToastMessage';
import { AdminSize, CatalogItem } from '@/types/adminProduct';

interface QuickCreateSizeModalProps {
    isOpen: boolean;
    categories?: CatalogItem[];
    defaultGender?: string;
    onClose: () => void;
    onCreated: (size: AdminSize) => void;
}

type SizeType = 'clothing' | 'shoes' | 'accessories';
type AudienceKey = 'man' | 'woman' | 'kid';

export default function QuickCreateSizeModal({
    isOpen,
    categories = [],
    defaultGender = '',
    onClose,
    onCreated,
}: QuickCreateSizeModalProps) {
    const supabase = createClient();
    const toast = useToastMessage();

    const [label, setLabel] = useState('');
    const [selectedType, setSelectedType] = useState<SizeType>('clothing');
    const [selectedAudiences, setSelectedAudiences] = useState<AudienceKey[]>(['man', 'woman']);
    const [additionalCost, setAdditionalCost] = useState('0');
    const [saving, setSaving] = useState(false);

    // Encontrar ID de categoría Calzado / Tenis
    const shoeCategory = useMemo(() => {
        return categories.find((c) => /tenis|calzado|zapato/i.test(c.name));
    }, [categories]);

    useEffect(() => {
        if (isOpen) {
            setLabel('');
            setAdditionalCost('0');
            setSaving(false);

            // Determinar audiencia inicial según género del producto
            if (defaultGender === 'kid') {
                setSelectedAudiences(['kid']);
            } else if (defaultGender === 'woman') {
                setSelectedAudiences(['woman']);
            } else if (defaultGender === 'man') {
                setSelectedAudiences(['man']);
            } else {
                setSelectedAudiences(['man', 'woman']);
            }

            setSelectedType('clothing');
        }
    }, [isOpen, defaultGender]);

    if (!isOpen) return null;

    const toggleAudience = (aud: AudienceKey) => {
        const next = selectedAudiences.includes(aud)
            ? selectedAudiences.filter((a) => a !== aud)
            : [...selectedAudiences, aud];

        setSelectedAudiences(next.length === 0 ? [aud] : next);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = label.trim();
        if (!trimmed) {
            toast.error('La etiqueta de la talla es requerida');
            return;
        }

        setSaving(true);
        try {
            const cost = parseFloat(additionalCost) || 0;

            // Determinar gender para PostgreSQL ('man' | 'woman' | 'kid' | null)
            let mappedGender: string | null = null;
            if (selectedAudiences.includes('man') && selectedAudiences.includes('woman')) {
                mappedGender = null; // Universal Adulto
            } else if (selectedAudiences.length === 1) {
                mappedGender = selectedAudiences[0];
            } else if (selectedAudiences.includes('kid')) {
                mappedGender = 'kid';
            } else {
                mappedGender = null;
            }

            // Determinar category_id
            const targetCategoryId =
                selectedType === 'shoes' && shoeCategory ? shoeCategory.id : null;

            const payload = {
                label: trimmed,
                gender: mappedGender,
                category_id: targetCategoryId,
                additional_cost: cost,
                active: true,
                sort_order: 99,
            };

            const { data, error } = await supabase
                .from('sizes')
                .insert(payload)
                .select('id, label, category_id, gender, additional_cost, sort_order, active')
                .single();

            if (error) throw error;

            toast.success(`Talla "${trimmed}" creada exitosamente`);
            onCreated({
                id: data.id,
                label: data.label,
                category_id: data.category_id,
                gender: data.gender,
                additional_cost: data.additional_cost,
                sort_order: data.sort_order,
                active: data.active,
            });
            onClose();
        } catch (err: any) {
            console.error('Error creando talla:', err);
            toast.error(err?.message || 'Error al guardar la talla');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 8 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                    className="relative w-full max-w-lg bg-[#0d0e12] border border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden"
                >
                    {/* Specular highlight estilo Apple */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                <Ruler className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white tracking-wide">
                                    Crear Nueva Talla
                                </h3>
                                <p className="text-[11px] text-gray-400">
                                    Segmentada por Tipo y Audiencia para auto-filtrado inteligente
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {/* 1. SEGMENTADOR DE TIPO */}
                        <div>
                            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                                <span>1. Tipo de Producto *</span>
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'clothing' as const, label: 'Ropa', icon: Shirt },
                                    { id: 'shoes' as const, label: 'Calzado', icon: Footprints },
                                    { id: 'accessories' as const, label: 'Otros', icon: Tag },
                                ].map((t) => {
                                    const Icon = t.icon;
                                    const isSelected = selectedType === t.id;
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setSelectedType(t.id)}
                                            className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'bg-white text-black border-white shadow-md font-black'
                                                    : 'bg-[#14151b] border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span>{t.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2. PÚBLICO / AUDIENCIA (SELECCIÓN MÚLTIPLE) */}
                        <div>
                            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                                <span>2. Público / Audiencia *</span>
                                <span className="text-[10px] text-emerald-400 font-bold">Selección Múltiple</span>
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { key: 'man' as const, label: 'Masculino', subtitle: 'Hombre', emoji: '👨' },
                                    { key: 'woman' as const, label: 'Femenino', subtitle: 'Mujer', emoji: '👩' },
                                    { key: 'kid' as const, label: 'Infantil', subtitle: 'Niños', emoji: '🧒' },
                                ].map((aud) => {
                                    const isChecked = selectedAudiences.includes(aud.key);
                                    return (
                                        <button
                                            key={aud.key}
                                            type="button"
                                            onClick={() => toggleAudience(aud.key)}
                                            className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden ${
                                                isChecked
                                                    ? 'bg-primary/15 border-primary text-white shadow-sm'
                                                    : 'bg-[#14151b] border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between w-full mb-1">
                                                <span className="text-base">{aud.emoji}</span>
                                                <div
                                                    className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                                                        isChecked
                                                            ? 'bg-primary border-primary text-white'
                                                            : 'border-white/20 bg-white/5'
                                                    }`}
                                                >
                                                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                                </div>
                                            </div>
                                            <p className="text-xs font-bold leading-tight text-white">{aud.label}</p>
                                            <p className="text-[10px] text-gray-400 font-normal">{aud.subtitle}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 3. ETIQUETA / MEDIDA */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                                    3. Etiqueta / Medida *
                                </label>
                                <span className="text-[10px] text-gray-500">
                                    {selectedType === 'shoes'
                                        ? 'Ej: 43 EU, 7.5 US, 40'
                                        : selectedType === 'clothing' && selectedAudiences.includes('kid')
                                        ? 'Ej: 8 años, 10 años'
                                        : 'Ej: 5XL, Unitalla, 3XL'}
                                </span>
                            </div>
                            <input
                                type="text"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                placeholder={
                                    selectedType === 'shoes'
                                        ? 'Ej: 43 EU, 7.5 US, 35 EU'
                                        : selectedType === 'clothing' && selectedAudiences.includes('kid')
                                        ? 'Ej: 8 años, 10 años'
                                        : 'Ej: 5XL, Unitalla, 3XL'
                                }
                                autoFocus
                                required
                                className="w-full bg-[#14151b] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-bold"
                            />

                            {/* Sugerencias rápidas */}
                            <div className="mt-2.5">
                                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1.5 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-amber-400" />
                                    <span>Píldoras Rápidas:</span>
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedType === 'clothing' && (
                                        <>
                                            {['3XL', '4XL', '5XL', 'Unitalla'].map((l) => (
                                                <button
                                                    key={l}
                                                    type="button"
                                                    onClick={() => setLabel(l)}
                                                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                                                >
                                                    {l}
                                                </button>
                                            ))}
                                        </>
                                    )}
                                    {selectedType === 'shoes' && (
                                        <>
                                            {['35 EU', '36 EU', '41 EU', '42 EU', '43 EU', '44 EU'].map((l) => (
                                                <button
                                                    key={l}
                                                    type="button"
                                                    onClick={() => setLabel(l)}
                                                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition-all cursor-pointer"
                                                >
                                                    {l}
                                                </button>
                                            ))}
                                        </>
                                    )}
                                    {selectedType === 'accessories' && (
                                        <>
                                            {['Unitalla', 'Estándar', 'S/M', 'L/XL'].map((l) => (
                                                <button
                                                    key={l}
                                                    type="button"
                                                    onClick={() => setLabel(l)}
                                                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                                                >
                                                    {l}
                                                </button>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Costo Adicional */}
                        <div>
                            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                                Costo Extra (HNL)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 font-bold text-xs">
                                    +L
                                </span>
                                <input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={additionalCost}
                                    onChange={(e) => setAdditionalCost(e.target.value)}
                                    placeholder="0"
                                    className="w-full bg-[#14151b] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white focus:border-primary outline-none text-xs font-mono"
                                />
                            </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={saving}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover active:scale-[0.98] transition-all shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-3.5 h-3.5" /> Crear y Seleccionar
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
