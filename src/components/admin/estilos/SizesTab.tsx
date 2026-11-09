'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
    Ruler,
    Edit,
    Trash2,
    X,
    Save,
    Loader2,
    Plus,
    Sparkles,
    Search,
    Wand2,
    AlertTriangle,
    Footprints,
    Shirt,
    Baby,
    Check,
    Users,
    Tag,
} from 'lucide-react';
import { Size, Category, EMPTY_SIZE } from './types';

interface SizesTabProps {
    sizes: Size[];
    sizesLoading: boolean;
    sizeSaving: boolean;
    editingSize: Size | null;
    sizeForm: typeof EMPTY_SIZE;
    setSizeForm: React.Dispatch<React.SetStateAction<typeof EMPTY_SIZE>>;
    categories: Category[];
    isSuperAdmin: boolean;
    onOpenEditSize: (s: Size) => void;
    onOpenNewSize: () => void;
    onSaveSize: () => void;
    onOpenDeleteSize: (id: string) => void;
    onGeneratePreset?: (
        presetType:
            | 'clothing'
            | 'kids'
            | 'shoes_us'
            | 'shoes_eu'
            | 'adult'
            | 'woman'
            | 'shoes_man'
            | 'shoes_woman'
            | 'shoes_kids'
    ) => Promise<void>;
    onCleanupDuplicates?: () => Promise<void>;
}

type SizeFilterTab = 'all' | 'clothing' | 'kids' | 'shoes';
type SizeType = 'clothing' | 'shoes' | 'accessories';
type AudienceKey = 'man' | 'woman' | 'kid';

export default function SizesTab({
    sizes,
    sizesLoading,
    sizeSaving,
    editingSize,
    sizeForm,
    setSizeForm,
    categories,
    isSuperAdmin,
    onOpenEditSize,
    onOpenNewSize,
    onSaveSize,
    onOpenDeleteSize,
    onGeneratePreset,
    onCleanupDuplicates,
}: SizesTabProps) {
    const [filterTab, setFilterTab] = useState<SizeFilterTab>('all');
    const [audienceFilter, setAudienceFilter] = useState<'all' | 'man' | 'woman' | 'kid'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Segmentador interno del formulario (Tipo y Audiencias Múltiples)
    const [selectedType, setSelectedType] = useState<SizeType>('clothing');
    const [selectedAudiences, setSelectedAudiences] = useState<AudienceKey[]>(['man', 'woman']);

    // Encontrar ID de la categoría Tenis / Calzado
    const shoeCategory = useMemo(() => {
        return categories.find((c) => /tenis|calzado|zapato/i.test(c.name));
    }, [categories]);

    // Sincronizar el formulario cuando se entra en modo edición o se resetea
    useEffect(() => {
        if (editingSize) {
            // Detectar tipo según categoría o etiqueta
            const isShoe =
                (shoeCategory && editingSize.category_id === shoeCategory.id) ||
                /^(\d{1,2}(\.5)?|\d{2})(\s*(US|EU))?$/i.test(editingSize.label.trim()) &&
                    editingSize.gender !== 'kid';
            const isKid = editingSize.gender === 'kid' || /año|infantil/i.test(editingSize.label);

            if (isShoe) {
                setSelectedType('shoes');
            } else if (isKid) {
                setSelectedType('clothing');
            } else {
                setSelectedType('clothing');
            }

            // Detectar audiencias
            if (editingSize.gender === 'man') {
                setSelectedAudiences(['man']);
            } else if (editingSize.gender === 'woman') {
                setSelectedAudiences(['woman']);
            } else if (editingSize.gender === 'kid') {
                setSelectedAudiences(['kid']);
            } else {
                // null o universal
                setSelectedAudiences(['man', 'woman']);
            }
        } else {
            // Valores por defecto para nueva talla
            setSelectedType('clothing');
            setSelectedAudiences(['man', 'woman']);
        }
    }, [editingSize, shoeCategory]);

    // Función para alternar una audiencia individual (SELECCIÓN MÚLTIPLE)
    const toggleAudience = (aud: AudienceKey) => {
        const next = selectedAudiences.includes(aud)
            ? selectedAudiences.filter((a) => a !== aud)
            : [...selectedAudiences, aud];

        // Al menos una audiencia debe estar seleccionada
        const finalAudiences = next.length === 0 ? [aud] : next;
        setSelectedAudiences(finalAudiences);

        // Mapear al campo gender compatible con PostgreSQL constraint ('man' | 'woman' | 'kid' | null)
        let mappedGender = '';
        if (finalAudiences.includes('man') && finalAudiences.includes('woman')) {
            mappedGender = ''; // null = Universal Adulto / Aplica a ambos
        } else if (finalAudiences.length === 1) {
            mappedGender = finalAudiences[0];
        } else if (finalAudiences.includes('kid')) {
            mappedGender = 'kid';
        } else {
            mappedGender = '';
        }

        setSizeForm((s) => ({ ...s, gender: mappedGender }));
    };

    // Función para cambiar el tipo de producto
    const handleTypeChange = (type: SizeType) => {
        setSelectedType(type);
        if (type === 'shoes') {
            setSizeForm((s) => ({
                ...s,
                category_id: shoeCategory ? shoeCategory.id : s.category_id,
            }));
        } else {
            setSizeForm((s) => ({
                ...s,
                category_id: '',
            }));
        }
    };

    // Detección en vivo de si la talla que el usuario está escribiendo ya existe
    const duplicateMatch = useMemo(() => {
        const trimmed = sizeForm.label.trim().toLowerCase();
        if (!trimmed) return null;

        return sizes.find(
            (s) =>
                s.active &&
                s.label.trim().toLowerCase() === trimmed &&
                (!editingSize || s.id !== editingSize.id)
        );
    }, [sizeForm.label, sizes, editingSize]);

    // Clasificar y filtrar tallas según tab, audiencia y búsqueda
    const filteredSizesList = useMemo(() => {
        let list = sizes;

        // Filtro por pestaña
        if (filterTab === 'clothing') {
            list = list.filter((s) => {
                const isKid = s.gender === 'kid' || /año|infantil/i.test(s.label);
                const isShoe =
                    /^(\d{1,2}(\.5)?|\d{2})(\s*(US|EU))?$/i.test(s.label.trim()) && !isKid;
                return !isKid && !isShoe;
            });
        } else if (filterTab === 'kids') {
            list = list.filter((s) => s.gender === 'kid' || /año|infantil/i.test(s.label));
        } else if (filterTab === 'shoes') {
            list = list.filter((s) => {
                const isShoe =
                    /^(\d{1,2}(\.5)?|\d{2})(\s*(US|EU))?$/i.test(s.label.trim()) &&
                    !/año/i.test(s.label);
                const isShoeCat = s.category_id === shoeCategory?.id;
                return isShoe || isShoeCat;
            });
        }

        // Filtro por audiencia
        if (audienceFilter !== 'all') {
            list = list.filter((s) => {
                if (audienceFilter === 'man') {
                    return s.gender === 'man' || s.gender === null || s.gender === '';
                }
                if (audienceFilter === 'woman') {
                    return s.gender === 'woman' || s.gender === null || s.gender === '';
                }
                if (audienceFilter === 'kid') {
                    return s.gender === 'kid';
                }
                return true;
            });
        }

        // Filtro por búsqueda
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            list = list.filter((s) => s.label.toLowerCase().includes(q));
        }

        return list;
    }, [sizes, filterTab, audienceFilter, searchQuery, shoeCategory]);

    return (
        <div className="space-y-6">
            {/* ⚡ Barra Superior de Presets Oficiales y Limpieza */}
            <div className="relative overflow-hidden bg-[#0d0e12]/60 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-5 shadow-2xl">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                                Presets Oficiales & Escalas de Tallas
                            </h3>
                        </div>
                        <p className="text-xs text-gray-400">
                            Genera escalas oficiales completas sin duplicados o limpia registros repetidos
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {onGeneratePreset && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => onGeneratePreset('clothing')}
                                    disabled={sizeSaving}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/10 text-white transition-all cursor-pointer flex items-center gap-1.5"
                                    title="Genera escala oficial universal XS, S, M, L, XL, 2XL, 3XL (+L100), 4XL (+L100)"
                                >
                                    <Shirt className="w-3.5 h-3.5 text-primary" />
                                    <span>+ Ropa Universal (XS-4XL)</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => onGeneratePreset('kids')}
                                    disabled={sizeSaving}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/10 text-white transition-all cursor-pointer flex items-center gap-1.5"
                                    title="Genera tallas infantiles 2 a 16 años"
                                >
                                    <Baby className="w-3.5 h-3.5 text-sky-400" />
                                    <span>+ Niños (2-16a)</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => onGeneratePreset('shoes_us')}
                                    disabled={sizeSaving}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/10 text-white transition-all cursor-pointer flex items-center gap-1.5"
                                    title="Genera escala de calzado US (5 a 12)"
                                >
                                    <Footprints className="w-3.5 h-3.5 text-amber-400" />
                                    <span>+ Calzado US (5-12)</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => onGeneratePreset('shoes_eu')}
                                    disabled={sizeSaving}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/10 text-white transition-all cursor-pointer flex items-center gap-1.5"
                                    title="Genera escala de calzado EU (35 a 45 EU)"
                                >
                                    <Footprints className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>+ Calzado EU (35-45)</span>
                                </button>
                            </>
                        )}

                        {onCleanupDuplicates && (
                            <button
                                type="button"
                                onClick={onCleanupDuplicates}
                                disabled={sizeSaving}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 active:scale-[0.98] border border-amber-500/20 text-amber-300 transition-all cursor-pointer flex items-center gap-1.5 ml-auto lg:ml-2"
                                title="Desactiva automáticamente tallas repetidas idénticas"
                            >
                                <Wand2 className="w-3.5 h-3.5" />
                                <span>Limpiar Duplicados</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* 📋 Lista de Tallas con Filtros Segmentados */}
                <div className="lg:col-span-7 space-y-4">
                    {/* Barra de Filtros y Búsqueda */}
                    <div className="flex flex-col gap-2.5">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
                                {(
                                    [
                                        { key: 'all' as const, label: `Todas (${sizes.length})` },
                                        { key: 'clothing' as const, label: '👕 Ropa Universal' },
                                        { key: 'kids' as const, label: '👶 Niños' },
                                        { key: 'shoes' as const, label: '👟 Calzado' },
                                    ] as const
                                ).map((tab) => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setFilterTab(tab.key)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                                            filterTab === tab.key
                                                ? 'bg-primary text-white shadow-md shadow-primary/20'
                                                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="relative min-w-[200px]">
                                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Buscar talla..."
                                    className="w-full bg-[#14151b] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-primary outline-none"
                                />
                            </div>
                        </div>

                        {/* Sub-filtro por Audiencia */}
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                            <span className="font-bold text-[10px] uppercase text-gray-500 mr-1">Audiencia:</span>
                            {[
                                { key: 'all' as const, label: 'Todos' },
                                { key: 'man' as const, label: '👨 Hombre' },
                                { key: 'woman' as const, label: '👩 Mujer' },
                                { key: 'kid' as const, label: '🧒 Niños' },
                            ].map((a) => (
                                <button
                                    key={a.key}
                                    type="button"
                                    onClick={() => setAudienceFilter(a.key)}
                                    className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                                        audienceFilter === a.key
                                            ? 'bg-white/20 text-white font-black'
                                            : 'bg-white/5 text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {a.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {sizesLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : filteredSizesList.length === 0 ? (
                        <div className="relative overflow-hidden bg-[#0d0e12]/60 border border-white/[0.08] backdrop-blur-xl rounded-3xl p-16 text-center shadow-2xl">
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                            <Ruler className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-white font-bold text-base">No hay tallas en este filtro</p>
                            <p className="text-gray-400 text-sm mt-1">
                                Crea una con el formulario lateral o usa los botones de preset superior
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {filteredSizesList.map((s) => {
                                const isKid = s.gender === 'kid' || /año|infantil/i.test(s.label);
                                const isShoe =
                                    s.category_id === shoeCategory?.id ||
                                    (/^(\d{1,2}(\.5)?|\d{2})(\s*(US|EU))?$/i.test(s.label.trim()) && !isKid);

                                return (
                                    <div
                                        key={s.id}
                                        className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all p-4 flex items-center gap-4 ${
                                            editingSize?.id === s.id
                                                ? 'border-primary/50 bg-primary/10 shadow-lg shadow-primary/10'
                                                : 'border-white/[0.08] bg-[#0d0e12]/60 hover:border-white/20'
                                        }`}
                                    >
                                        {/* Specular highlight */}
                                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                                        <div
                                            className={`w-2 h-2 rounded-full shrink-0 ${
                                                s.active
                                                    ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                                                    : 'bg-neutral-600'
                                            }`}
                                        />

                                        <div className="w-14 h-11 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
                                            <span className="font-black text-xs text-white leading-none text-center px-1 font-mono">
                                                {s.label}
                                            </span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-white text-sm tracking-wide">{s.label}</p>
                                                {s.additional_cost > 0 && (
                                                    <span className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold font-mono">
                                                        +L {s.additional_cost}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                                {/* Badge de Tipo */}
                                                {isShoe ? (
                                                    <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                        <Footprints className="w-3 h-3" /> Calzado
                                                    </span>
                                                ) : isKid ? (
                                                    <span className="text-[10px] text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                        <Baby className="w-3 h-3" /> Ropa Infantil
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                        <Shirt className="w-3 h-3" /> Ropa
                                                    </span>
                                                )}

                                                {/* Badge de Audiencia */}
                                                {s.gender === 'man' ? (
                                                    <span className="text-[10px] text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold">
                                                        👨 Hombre
                                                    </span>
                                                ) : s.gender === 'woman' ? (
                                                    <span className="text-[10px] text-pink-300 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full font-bold">
                                                        👩 Mujer
                                                    </span>
                                                ) : s.gender === 'kid' ? (
                                                    <span className="text-[10px] text-sky-300 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full font-bold">
                                                        🧒 Niños
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold">
                                                        👨👩 Adultos (Hombre + Mujer)
                                                    </span>
                                                )}

                                                {s.sort_order !== null && (
                                                    <span className="text-[10px] text-gray-500 font-mono">
                                                        Orden #{s.sort_order}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {!s.active && (
                                            <span className="text-[10px] uppercase font-bold text-gray-500 border border-neutral-700/60 px-2 py-0.5 rounded-full shrink-0">
                                                Inactiva
                                            </span>
                                        )}

                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => onOpenEditSize(s)}
                                                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 active:scale-[0.98] transition-all cursor-pointer"
                                                title="Editar Talla"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onOpenDeleteSize(s.id)}
                                                disabled={!isSuperAdmin}
                                                title={
                                                    !isSuperAdmin
                                                        ? 'Solo super admin puede eliminar'
                                                        : 'Eliminar / Desactivar Talla'
                                                }
                                                className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 📝 Formulario Lateral Apple Design con Segmentador y Selección Múltiple */}
                <div className="lg:col-span-5">
                    <div className="sticky top-28 relative overflow-hidden bg-[#0d0e12]/80 border border-white/[0.08] backdrop-blur-xl rounded-3xl p-6 space-y-5 shadow-2xl">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                    <Ruler className="w-4 h-4" />
                                </div>
                                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                                    {editingSize ? 'Editar Talla' : 'Nueva Talla'}
                                </h2>
                            </div>
                            {editingSize && (
                                <button
                                    type="button"
                                    onClick={onOpenNewSize}
                                    className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
                                    title="Cancelar edición"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Alerta inteligente en vivo si la talla ya existe */}
                        {duplicateMatch && (
                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
                                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                                <div>
                                    <p className="font-bold">Esta talla ya existe en el catálogo</p>
                                    <p className="text-[11px] text-amber-300/80 mt-0.5">
                                        No necesitas duplicarla. Las prendas pueden seleccionarla directamente.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* 1. SEGMENTADOR DE TIPO (Ropa / Calzado / Otros) */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-2 flex items-center justify-between">
                                <span>1. Tipo de Producto *</span>
                                <span className="text-[10px] text-gray-500 font-normal">Segmentador Principal</span>
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
                                            onClick={() => handleTypeChange(t.id)}
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

                        {/* 2. PÚBLICO / AUDIENCIA (SELECCIÓN MÚLTIPLE - Checkboxes) */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-2 flex items-center justify-between">
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
                            <p className="text-[10px] text-gray-500 mt-1.5">
                                Puedes marcar varios a la vez (ej: Masculino + Femenino para prendas de adulto). Al crear un producto, este jalara automáticamente solo las que coincidan.
                            </p>
                        </div>

                        {/* 3. ETIQUETA / NOMBRE DE LA TALLA */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-2">
                                3. Etiqueta / Medida de la Talla *
                            </label>
                            <input
                                type="text"
                                value={sizeForm.label}
                                onChange={(e) => setSizeForm((s) => ({ ...s, label: e.target.value }))}
                                onKeyDown={(e) => e.key === 'Enter' && onSaveSize()}
                                placeholder={
                                    selectedType === 'shoes'
                                        ? 'Ej: 43 EU, 7.5 US, 40, 9.5...'
                                        : selectedType === 'clothing' && selectedAudiences.includes('kid')
                                        ? 'Ej: 8 años, 10 años, 12 años...'
                                        : 'Ej: XS, S, M, L, XL, 2XL, Unitalla...'
                                }
                                className="w-full bg-[#14151b] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-bold"
                            />
                        </div>

                        {/* ⚡ Sugerencias Rápidas de 1 Clic según el Tipo Seleccionado */}
                        <div className="space-y-2 pt-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                <span>Píldoras Rápidas para Rellenar:</span>
                            </p>

                            <div className="bg-black/30 border border-white/5 rounded-2xl p-3">
                                {selectedType === 'clothing' && (
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-[9px] font-bold uppercase text-gray-400 block mb-1">
                                                👕 Ropa Universal (Hombre / Mujer):
                                            </span>
                                            <div className="flex flex-wrap gap-1">
                                                {[
                                                    { l: 'XS', c: '', o: '1' },
                                                    { l: 'S', c: '', o: '2' },
                                                    { l: 'M', c: '', o: '3' },
                                                    { l: 'L', c: '', o: '4' },
                                                    { l: 'XL', c: '', o: '5' },
                                                    { l: '2XL', c: '', o: '6' },
                                                    { l: '3XL', c: '100', o: '7' },
                                                    { l: '4XL', c: '100', o: '8' },
                                                    { l: 'Unitalla', c: '', o: '99' },
                                                ].map((p) => (
                                                    <button
                                                        key={p.l}
                                                        type="button"
                                                        onClick={() => {
                                                            setSizeForm((s) => ({
                                                                ...s,
                                                                label: p.l,
                                                                additional_cost: p.c,
                                                                sort_order: p.o,
                                                            }));
                                                            setSelectedAudiences(['man', 'woman']);
                                                        }}
                                                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white/5 hover:bg-white/10 active:scale-[0.96] text-gray-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                                                    >
                                                        {p.l}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <span className="text-[9px] font-bold uppercase text-sky-400 block mb-1">
                                                👶 Infantil / Niños:
                                            </span>
                                            <div className="flex flex-wrap gap-1">
                                                {[
                                                    '2 años',
                                                    '4 años',
                                                    '6 años',
                                                    '8 años',
                                                    '10 años',
                                                    '12 años',
                                                    '14 años',
                                                    '16 años',
                                                ].map((label, idx) => (
                                                    <button
                                                        key={label}
                                                        type="button"
                                                        onClick={() => {
                                                            setSizeForm((s) => ({
                                                                ...s,
                                                                label,
                                                                additional_cost: '',
                                                                sort_order: String(idx + 1),
                                                                gender: 'kid',
                                                            }));
                                                            setSelectedAudiences(['kid']);
                                                        }}
                                                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-sky-500/10 hover:bg-sky-500/20 active:scale-[0.96] text-sky-300 border border-sky-500/20 transition-all cursor-pointer"
                                                    >
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedType === 'shoes' && (
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-[9px] font-bold uppercase text-amber-400 block mb-1">
                                                👟 Calzado (US / EU):
                                            </span>
                                            <div className="flex flex-wrap gap-1">
                                                {[
                                                    '35 EU',
                                                    '36 EU',
                                                    '37 EU',
                                                    '38 EU',
                                                    '39 EU',
                                                    '40 EU',
                                                    '41 EU',
                                                    '42 EU',
                                                    '43 EU',
                                                    '44 EU',
                                                    '45 EU',
                                                    '7.5 US',
                                                    '8 US',
                                                    '8.5 US',
                                                    '9 US',
                                                    '10 US',
                                                ].map((label) => (
                                                    <button
                                                        key={label}
                                                        type="button"
                                                        onClick={() => {
                                                            setSizeForm((s) => ({
                                                                ...s,
                                                                label,
                                                                additional_cost: '',
                                                            }));
                                                        }}
                                                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500/20 active:scale-[0.96] text-amber-300 border border-amber-500/20 transition-all cursor-pointer"
                                                    >
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedType === 'accessories' && (
                                    <div>
                                        <div className="flex flex-wrap gap-1">
                                            {['Unitalla', 'Estándar', 'S/M', 'L/XL'].map((label) => (
                                                <button
                                                    key={label}
                                                    type="button"
                                                    onClick={() =>
                                                        setSizeForm((s) => ({
                                                            ...s,
                                                            label,
                                                            additional_cost: '',
                                                        }))
                                                    }
                                                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white/5 hover:bg-white/10 active:scale-[0.96] text-gray-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Costo Adicional y Orden */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-2">
                                    Costo Extra (HNL)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 font-bold text-xs">
                                        +L
                                    </span>
                                    <input
                                        type="number"
                                        value={sizeForm.additional_cost}
                                        onChange={(e) =>
                                            setSizeForm((s) => ({
                                                ...s,
                                                additional_cost: e.target.value,
                                            }))
                                        }
                                        placeholder="0"
                                        min={0}
                                        step={0.01}
                                        className="w-full bg-[#14151b] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white focus:border-amber-400 outline-none text-sm font-medium font-mono"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">
                                    Recargo opcional (ej: L 100 extra en 3XL o 4XL).
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-2">
                                    Orden en Tienda
                                </label>
                                <input
                                    type="number"
                                    value={sizeForm.sort_order}
                                    onChange={(e) =>
                                        setSizeForm((s) => ({
                                            ...s,
                                            sort_order: e.target.value,
                                        }))
                                    }
                                    placeholder="1, 2, 3..."
                                    min={0}
                                    className="w-full bg-[#14151b] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-primary outline-none text-sm font-medium font-mono"
                                />
                                <p className="text-[10px] text-gray-500 mt-1">
                                    Para ordenar de menor a mayor.
                                </p>
                            </div>
                        </div>

                        {/* Activa en Tienda */}
                        <label className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl cursor-pointer hover:bg-white/[0.06] transition-colors select-none">
                            <span className="text-xs font-medium text-white flex items-center gap-2">
                                <span
                                    className={`w-2 h-2 rounded-full ${
                                        sizeForm.active
                                            ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                                            : 'bg-neutral-600'
                                    }`}
                                />
                                Talla Activa en Catálogo
                            </span>
                            <input
                                type="checkbox"
                                checked={sizeForm.active}
                                onChange={(e) =>
                                    setSizeForm((s) => ({ ...s, active: e.target.checked }))
                                }
                                className="w-4 h-4 accent-primary rounded cursor-pointer"
                            />
                        </label>

                        {/* Botón Guardar */}
                        <button
                            type="button"
                            onClick={onSaveSize}
                            disabled={sizeSaving || Boolean(duplicateMatch)}
                            className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-primary/20 cursor-pointer text-xs"
                        >
                            {sizeSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {sizeSaving
                                ? 'Guardando...'
                                : editingSize
                                ? 'Actualizar Talla'
                                : 'Crear Talla'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
