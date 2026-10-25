'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
    Save,
    RefreshCw,
    Loader2,
    ArrowLeft,
    CheckCircle2,
    Plus,
    Trash2,
    ChevronUp,
    ChevronDown,
    Clock,
    Truck,
    Sparkles,
    ShieldCheck,
    MessageCircle,
    Flame,
    Star,
    Tag,
    Zap,
    LucideIcon,
    Radio,
    Eye,
    RotateCcw,
    AlertCircle,
} from 'lucide-react';
import useToastMessage from '@/hooks/useToastMessage';
import {
    MarqueeBarSettings,
    MarqueeItem,
    MarqueeIconType,
    DEFAULT_MARQUEE_SETTINGS,
    calculateNextCutoffDate,
} from '@/lib/marqueeSettings';

const AVAILABLE_ICONS: { type: MarqueeIconType; label: string; icon: LucideIcon }[] = [
    { type: 'clock', label: 'Reloj / Cierre', icon: Clock },
    { type: 'truck', label: 'Envíos / CAEX', icon: Truck },
    { type: 'sparkles', label: 'Destacado / Dorsal', icon: Sparkles },
    { type: 'shield', label: 'Garantía / Calidad', icon: ShieldCheck },
    { type: 'message', label: 'WhatsApp / Soporte', icon: MessageCircle },
    { type: 'flame', label: 'Fuego / Lo más pedido', icon: Flame },
    { type: 'star', label: 'Estrella / Selección', icon: Star },
    { type: 'tag', label: 'Oferta / Descuento', icon: Tag },
    { type: 'zap', label: 'Rápido / Matchday', icon: Zap },
];

const ICON_MAP: Record<MarqueeIconType, LucideIcon> = {
    clock: Clock,
    truck: Truck,
    sparkles: Sparkles,
    shield: ShieldCheck,
    message: MessageCircle,
    flame: Flame,
    star: Star,
    tag: Tag,
    zap: Zap,
};

export default function AdminMarqueeSettingsPage() {
    const toast = useToastMessage();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [updatedAt, setUpdatedAt] = useState<string | null>(null);

    const [form, setForm] = useState<MarqueeBarSettings>(DEFAULT_MARQUEE_SETTINGS);

    const nextCutoffText = useMemo(() => calculateNextCutoffDate(), []);

    const loadConfig = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/settings/marquee');
            if (!res.ok) throw new Error('Error al consultar la configuración');
            const data = await res.json();
            if (data.items) {
                setForm({
                    enabled: typeof data.enabled === 'boolean' ? data.enabled : true,
                    speedSeconds: data.speedSeconds || 32,
                    autoCalculateCutoff: typeof data.autoCalculateCutoff === 'boolean' ? data.autoCalculateCutoff : true,
                    items: data.items,
                });
                setUpdatedAt(data.updated_at || null);
            }
        } catch (err) {
            console.error('Error loading marquee config:', err);
            toast.error('Error al cargar la configuración de la marquesina');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    const handleAddItem = () => {
        const newItem: MarqueeItem = {
            id: `item-${Date.now()}`,
            icon: 'sparkles',
            highlight: 'Nuevo Aviso',
            text: 'Escribe aquí el texto que verán tus clientes en la tienda...',
            active: true,
        };
        setForm((prev) => ({
            ...prev,
            items: [...prev.items, newItem],
        }));
    };

    const handleUpdateItem = (id: string, updates: Partial<MarqueeItem>) => {
        setForm((prev) => ({
            ...prev,
            items: prev.items.map((it) => (it.id === id ? { ...it, ...updates } : it)),
        }));
    };

    const handleDeleteItem = (id: string) => {
        if (form.items.length <= 1) {
            toast.error('Debe haber al menos un aviso en la marquesina');
            return;
        }
        setForm((prev) => ({
            ...prev,
            items: prev.items.filter((it) => it.id !== id),
        }));
    };

    const handleMoveItem = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= form.items.length) return;

        const newItems = [...form.items];
        const temp = newItems[index];
        newItems[index] = newItems[targetIndex];
        newItems[targetIndex] = temp;

        setForm((prev) => ({
            ...prev,
            items: newItems,
        }));
    };

    const handleResetDefaults = () => {
        if (confirm('¿Restaurar los avisos recomendados por defecto de 90+5 Store?')) {
            setForm(DEFAULT_MARQUEE_SETTINGS);
            toast.info('Se cargaron los avisos recomendados. Recuerda hacer clic en Guardar Cambios.');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validaciones básicas
        const emptyTextItem = form.items.find((it) => !it.text.trim());
        if (emptyTextItem) {
            toast.error('Todos los avisos deben tener un texto descriptivo');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings/marquee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al guardar');

            toast.success('¡Marquesina actualizada con éxito en la tienda!');
            setUpdatedAt(new Date().toISOString());
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
            console.error('Error saving marquee settings:', err);
            toast.error(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    // Alertas activas procesadas para la previsualización en vivo
    const previewAlerts = useMemo(() => {
        return form.items
            .filter((item) => item.active)
            .map((item) => {
                const IconComponent = ICON_MAP[item.icon] || Sparkles;
                let text = item.text;
                if (form.autoCalculateCutoff) {
                    text = text.replace(/\{proximo_cierre\}|\{auto_cutoff\}/gi, nextCutoffText);
                }
                return {
                    id: item.id,
                    icon: IconComponent,
                    highlight: item.highlight,
                    text,
                };
            });
    }, [form.items, form.autoCalculateCutoff, nextCutoffText]);

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-16">
            {/* Header de la página */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-white/50 mb-1">
                        <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
                        <span>/</span>
                        <Link href="/admin/settings/temporada" className="hover:text-white transition-colors">Configuración</Link>
                        <span>/</span>
                        <span className="text-white">Marquesina Superior</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Radio className="w-7 h-7 text-primary" />
                        <span>Marquesina de Avisos</span>
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Controla los avisos, fechas de corte y mensajes que se desplazan en la barra superior de la tienda.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleResetDefaults}
                        className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Restaurar avisos originales"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Restaurar Originales</span>
                    </button>
                    <button
                        type="button"
                        onClick={loadConfig}
                        disabled={loading}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                        title="Refrescar datos"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-white/50 space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm">Cargando configuración de la marquesina...</p>
                </div>
            ) : (
                <form onSubmit={handleSave} className="space-y-6">
                    {/* 🔴 PREVISUALIZACIÓN EN VIVO */}
                    <div className="rounded-2xl border border-white/10 bg-[#0c0d12] p-4 sm:p-5 space-y-3 shadow-xl">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-white flex items-center gap-2">
                                <Eye className="w-4 h-4 text-primary" />
                                <span>Previsualización en Vivo de la Tienda</span>
                            </span>
                            <span className="text-white/40">
                                {form.enabled ? '🟢 Barra Visible' : '⚪ Barra Oculta'}
                            </span>
                        </div>

                        {/* Barra animada de ejemplo */}
                        <div className="relative w-full h-9 rounded-xl border border-white/10 bg-[#07080a] overflow-hidden flex items-center">
                            {!form.enabled ? (
                                <div className="w-full text-center text-xs text-white/40 italic">
                                    La marquesina está desactivada. No se mostrará a los clientes.
                                </div>
                            ) : previewAlerts.length === 0 ? (
                                <div className="w-full text-center text-xs text-amber-400">
                                    No hay avisos activos. Activa al menos un aviso abajo para que se muestre.
                                </div>
                            ) : (
                                <div
                                    className="flex w-max animate-marquee-preview items-center"
                                    style={{
                                        animationDuration: `${form.speedSeconds}s`,
                                    }}
                                >
                                    {[...previewAlerts, ...previewAlerts].map((item, idx) => {
                                        const Icon = item.icon;
                                        return (
                                            <div
                                                key={`preview-${item.id}-${idx}`}
                                                className="flex items-center gap-2 px-6 text-xs text-white/80 whitespace-nowrap shrink-0"
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                                <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                                                {item.highlight && (
                                                    <span className="font-bold text-white tracking-tight">
                                                        {item.highlight}:
                                                    </span>
                                                )}
                                                <span className="text-white/70 font-medium">
                                                    {item.text}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ⚙️ CONTROLES GLOBALES */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Activar/Desactivar */}
                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between">
                            <div>
                                <label className="text-sm font-bold text-white block">Estado de la Barra</label>
                                <span className="text-xs text-white/50">Mostrar u ocultar en el Home</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setForm((prev) => ({ ...prev, enabled: !prev.enabled }))}
                                className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer ${
                                    form.enabled ? 'bg-primary' : 'bg-white/20'
                                }`}
                            >
                                <div
                                    className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-1 ${
                                        form.enabled ? 'left-6' : 'left-1'
                                    }`}
                                />
                            </button>
                        </div>

                        {/* Velocidad */}
                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-white">Velocidad</label>
                                <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                                    {form.speedSeconds}s
                                </span>
                            </div>
                            <input
                                type="range"
                                min={15}
                                max={60}
                                step={1}
                                value={form.speedSeconds}
                                onChange={(e) => setForm((prev) => ({ ...prev, speedSeconds: Number(e.target.value) }))}
                                className="w-full accent-primary cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-white/40">
                                <span>Más Rápido (15s)</span>
                                <span>Normal (32s)</span>
                                <span>Suave (60s)</span>
                            </div>
                        </div>

                        {/* Variable Automática de Corte */}
                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between">
                            <div>
                                <label className="text-sm font-bold text-white block">Fecha de Corte Auto</label>
                                <span className="text-xs text-white/50">Calcula los 5, 15 y 25 ({nextCutoffText})</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setForm((prev) => ({ ...prev, autoCalculateCutoff: !prev.autoCalculateCutoff }))}
                                className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer ${
                                    form.autoCalculateCutoff ? 'bg-primary' : 'bg-white/20'
                                }`}
                            >
                                <div
                                    className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-1 ${
                                        form.autoCalculateCutoff ? 'left-6' : 'left-1'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* 📋 LISTA DE AVISOS */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <span>Lista de Avisos ({form.items.length})</span>
                                </h2>
                                <p className="text-xs text-white/50 mt-0.5">
                                    Tip: Puedes usar <code className="text-primary font-mono bg-white/5 px-1 py-0.5 rounded">{'{proximo_cierre}'}</code> en cualquier texto para que inserte la fecha automáticamente.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-black text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-md"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Agregar Nuevo Aviso</span>
                            </button>
                        </div>

                        {/* Items */}
                        <div className="space-y-3.5">
                            {form.items.map((item, index) => {
                                const IconComp = ICON_MAP[item.icon] || Sparkles;

                                return (
                                    <div
                                        key={item.id}
                                        className={`rounded-2xl border transition-all p-4 space-y-3 ${
                                            item.active
                                                ? 'bg-white/[0.03] border-white/10'
                                                : 'bg-white/[0.01] border-white/5 opacity-60'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            {/* Icono + Activo */}
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                                    <IconComp className="w-4 h-4" />
                                                </div>
                                                <span className="text-xs font-bold text-white">
                                                    Aviso #{index + 1}
                                                </span>
                                                <span
                                                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                                        item.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'
                                                    }`}
                                                >
                                                    {item.active ? 'Activo' : 'Pausado'}
                                                </span>
                                            </div>

                                            {/* Controles de orden y eliminar */}
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateItem(item.id, { active: !item.active })}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                                        item.active ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                                    }`}
                                                >
                                                    {item.active ? 'Pausar' : 'Activar'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleMoveItem(index, 'up')}
                                                    disabled={index === 0}
                                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
                                                    title="Subir posición"
                                                >
                                                    <ChevronUp className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleMoveItem(index, 'down')}
                                                    disabled={index === form.items.length - 1}
                                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
                                                    title="Bajar posición"
                                                >
                                                    <ChevronDown className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer ml-1"
                                                    title="Eliminar aviso"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Campos editables */}
                                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                                            {/* Selector de Icono */}
                                            <div className="sm:col-span-3">
                                                <label className="text-[11px] font-bold text-white/60 uppercase tracking-wider block mb-1">
                                                    Ícono
                                                </label>
                                                <select
                                                    value={item.icon}
                                                    onChange={(e) => handleUpdateItem(item.id, { icon: e.target.value as MarqueeIconType })}
                                                    className="w-full bg-[#12131a] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary cursor-pointer"
                                                >
                                                    {AVAILABLE_ICONS.map((opt) => (
                                                        <option key={opt.type} value={opt.type}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Titulo destacado */}
                                            <div className="sm:col-span-3">
                                                <label className="text-[11px] font-bold text-white/60 uppercase tracking-wider block mb-1">
                                                    Etiqueta destacada
                                                </label>
                                                <input
                                                    type="text"
                                                    value={item.highlight}
                                                    onChange={(e) => handleUpdateItem(item.id, { highlight: e.target.value })}
                                                    placeholder="Ej: Cierre de Pedidos"
                                                    className="w-full bg-[#12131a] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                                                />
                                            </div>

                                            {/* Texto descriptivo */}
                                            <div className="sm:col-span-6">
                                                <label className="text-[11px] font-bold text-white/60 uppercase tracking-wider block mb-1">
                                                    Texto del aviso
                                                </label>
                                                <input
                                                    type="text"
                                                    value={item.text}
                                                    onChange={(e) => handleUpdateItem(item.id, { text: e.target.value })}
                                                    placeholder="Escribe el mensaje..."
                                                    className="w-full bg-[#12131a] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Barra de Guardado */}
                    <div className="sticky bottom-4 z-40 rounded-2xl border border-white/15 bg-black/90 backdrop-blur-md p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl">
                        <div className="text-xs text-white/60 text-center sm:text-left">
                            {updatedAt ? (
                                <span>Última actualización: <strong className="text-white">{new Date(updatedAt).toLocaleString('es-HN')}</strong></span>
                            ) : (
                                <span>Los cambios se reflejarán instantáneamente en la portada de la tienda.</span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-black text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Guardando cambios...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        <span>Guardar Cambios</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <style jsx>{`
                @keyframes marqueePreview {
                    0% {
                        transform: translateX(0%);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
                }
                .animate-marquee-preview {
                    animation-name: marqueePreview;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
            `}</style>
        </div>
    );
}
