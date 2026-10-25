'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Save,
    RefreshCw,
    Loader2,
    Eye,
    RotateCcw,
    Layers,
    Sparkles,
    History,
    ShieldCheck,
    ArrowRight,
} from 'lucide-react';
import useToastMessage from '@/hooks/useToastMessage';
import {
    HomeStylesSettings,
    DEFAULT_HOME_STYLES_SETTINGS,
} from '@/lib/homeStylesSettings';

export default function AdminHomeStylesSettingsPage() {
    const toast = useToastMessage();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [updatedAt, setUpdatedAt] = useState<string | null>(null);

    const [form, setForm] = useState<HomeStylesSettings>(DEFAULT_HOME_STYLES_SETTINGS);

    const loadConfig = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/settings/home-styles');
            if (!res.ok) throw new Error('Error al consultar configuración');
            const data = await res.json();
            if (data.card1) {
                setForm({
                    enabled: typeof data.enabled === 'boolean' ? data.enabled : true,
                    badge: data.badge || DEFAULT_HOME_STYLES_SETTINGS.badge,
                    title: data.title || DEFAULT_HOME_STYLES_SETTINGS.title,
                    subtitle: data.subtitle || DEFAULT_HOME_STYLES_SETTINGS.subtitle,
                    card1: { ...DEFAULT_HOME_STYLES_SETTINGS.card1, ...(data.card1 || {}) },
                    card2: { ...DEFAULT_HOME_STYLES_SETTINGS.card2, ...(data.card2 || {}) },
                    card3: { ...DEFAULT_HOME_STYLES_SETTINGS.card3, ...(data.card3 || {}) },
                });
                setUpdatedAt(data.updated_at || null);
            }
        } catch (err) {
            console.error('Error loading home styles config:', err);
            toast.error('Error al cargar la configuración de estilos');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    const handleResetDefaults = () => {
        if (confirm('¿Restaurar los textos originales recomendados de la Guía de Estilos?')) {
            setForm(DEFAULT_HOME_STYLES_SETTINGS);
            toast.info('Se restablecieron los textos sugeridos. Haz clic en Guardar Cambios para aplicar.');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.title.trim()) {
            toast.error('El título principal no puede estar vacío');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings/home-styles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al guardar');

            toast.success('¡Guía de Estilos actualizada con éxito en la tienda!');
            setUpdatedAt(new Date().toISOString());
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
            console.error('Error saving home styles:', err);
            toast.error(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-white/50 mb-1">
                        <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
                        <span>/</span>
                        <Link href="/admin/settings/banners" className="hover:text-white transition-colors">Configuración</Link>
                        <span>/</span>
                        <span className="text-white">Guía de Estilos (Home)</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Layers className="w-7 h-7 text-primary" />
                        <span>Guía de Estilos y Versiones</span>
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Edita los títulos, descripciones, etiquetas y enlaces de las 3 tarjetas de versiones en el Home.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleResetDefaults}
                        className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Restaurar textos originales"
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
                    <p className="text-sm">Cargando configuración de la sección...</p>
                </div>
            ) : (
                <form onSubmit={handleSave} className="space-y-6">
                    {/* 🔴 PREVISUALIZACIÓN EN VIVO */}
                    <div className="rounded-2xl border border-white/10 bg-[#0c0d12] p-5 sm:p-6 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-white flex items-center gap-2">
                                <Eye className="w-4 h-4 text-primary" />
                                <span>Previsualización en Vivo</span>
                            </span>
                            <span className="text-white/40">
                                {form.enabled ? '🟢 Sección Visible' : '⚪ Sección Oculta'}
                            </span>
                        </div>

                        {/* Encabezado previo */}
                        <div className="text-center max-w-xl mx-auto pt-2">
                            {form.badge && (
                                <span className="inline-block px-3 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] font-bold uppercase tracking-wider mb-2">
                                    {form.badge}
                                </span>
                            )}
                            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                {form.title}
                            </h3>
                            <p className="text-xs text-white/60 mt-1 line-clamp-2">
                                {form.subtitle}
                            </p>
                        </div>

                        {/* 3 Tarjetas en miniatura */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
                            {/* Card 1 */}
                            <div className="rounded-2xl border border-red-500/30 bg-gradient-to-b from-red-950/70 to-black p-4 flex flex-col justify-between min-h-[160px]">
                                <div>
                                    <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-red-500/15 text-red-300 border border-red-500/25 mb-2">
                                        {form.card1.tag}
                                    </span>
                                    <h4 className="text-sm font-black text-white uppercase">{form.card1.title}</h4>
                                    <p className="text-[11px] text-white/60 mt-1 line-clamp-3">{form.card1.subtitle}</p>
                                </div>
                                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-white mt-3">
                                    <span>{form.card1.buttonText}</span>
                                    <ArrowRight className="w-3 h-3 text-red-400" />
                                </div>
                            </div>

                            {/* Card 2 */}
                            <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-b from-blue-950/70 to-black p-4 flex flex-col justify-between min-h-[160px]">
                                <div>
                                    <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-blue-500/15 text-blue-300 border border-blue-500/25 mb-2">
                                        {form.card2.tag}
                                    </span>
                                    <h4 className="text-sm font-black text-white uppercase">{form.card2.title}</h4>
                                    <p className="text-[11px] text-white/60 mt-1 line-clamp-3">{form.card2.subtitle}</p>
                                </div>
                                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-white mt-3">
                                    <span>{form.card2.buttonText}</span>
                                    <ArrowRight className="w-3 h-3 text-blue-400" />
                                </div>
                            </div>

                            {/* Card 3 */}
                            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-950/70 to-black p-4 flex flex-col justify-between min-h-[160px]">
                                <div>
                                    <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/25 mb-2">
                                        {form.card3.tag}
                                    </span>
                                    <h4 className="text-sm font-black text-white uppercase">{form.card3.title}</h4>
                                    <p className="text-[11px] text-white/60 mt-1 line-clamp-3">{form.card3.subtitle}</p>
                                </div>
                                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-white mt-3">
                                    <span>{form.card3.buttonText}</span>
                                    <ArrowRight className="w-3 h-3 text-amber-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ⚙️ CONTROLES GENERALES DE LA SECCIÓN */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <div>
                                <label className="text-sm font-bold text-white block">Visibilidad de la Sección</label>
                                <span className="text-xs text-white/50">Mostrar u ocultar la Guía de Estilos en el Home</span>
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

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                            <div className="sm:col-span-4">
                                <label className="text-xs font-bold text-white/60 uppercase tracking-wider block mb-1">
                                    Píldora Superior
                                </label>
                                <input
                                    type="text"
                                    value={form.badge}
                                    onChange={(e) => setForm((prev) => ({ ...prev, badge: e.target.value }))}
                                    className="w-full bg-[#12131a] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary"
                                />
                            </div>
                            <div className="sm:col-span-8">
                                <label className="text-xs font-bold text-white/60 uppercase tracking-wider block mb-1">
                                    Título Principal
                                </label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                                    className="w-full bg-[#12131a] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary"
                                />
                            </div>
                            <div className="sm:col-span-12">
                                <label className="text-xs font-bold text-white/60 uppercase tracking-wider block mb-1">
                                    Subtítulo de la Sección
                                </label>
                                <input
                                    type="text"
                                    value={form.subtitle}
                                    onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                                    className="w-full bg-[#12131a] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 🗂️ EDICIÓN DE LAS 3 TARJETAS */}
                    <div className="space-y-4">
                        {/* Tarjeta 1 */}
                        <div className="rounded-2xl border border-red-500/20 bg-white/[0.02] p-5 space-y-4">
                            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                                <Sparkles className="w-4 h-4 text-red-400" />
                                <h3 className="text-sm font-bold text-white">Tarjeta 1 — Versión Jugador</h3>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-300 font-mono ml-auto">
                                    Borde Rojo
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                                <div className="sm:col-span-4">
                                    <label className="text-[11px] font-bold text-white/60 uppercase block mb-1">Píldora</label>
                                    <input
                                        type="text"
                                        value={form.card1.tag}
                                        onChange={(e) => setForm((prev) => ({ ...prev, card1: { ...prev.card1, tag: e.target.value } }))}
                                        className="w-full bg-[#12131a] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div className="sm:col-span-8">
                                    <label className="text-[11px] font-bold text-white/60 uppercase block mb-1">Título</label>
                                    <input
                                        type="text"
                                        value={form.card1.title}
                                        onChange={(e) => setForm((prev) => ({ ...prev, card1: { ...prev.card1, title: e.target.value } }))}
                                        className="w-full bg-[#12131a] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div className="sm:col-span-12">
                                    <label className="text-[11px] font-bold text-white/60 uppercase block mb-1">Descripción</label>
                                    <textarea
                                        rows={2}
                                        value={form.card1.subtitle}
                                        onChange={(e) => setForm((prev) => ({ ...prev, card1: { ...prev.card1, subtitle: e.target.value } }))}
                                        className="w-full bg-[#12131a] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div className="sm:col-span-6">
                                    <label className="text-[11px] font-bold text-white/60 uppercase block mb-1">Texto del Botón</label>
                                    <input
                                        type="text"
                                        value={form.card1.buttonText}
                                        onChange={(e) => setForm((prev) => ({ ...prev, card1: { ...prev.card1, buttonText: e.target.value } }))}
                                        className="w-full bg-[#12131a] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div className="sm:col-span-6">
                                    <label className="text-[11px] font-bold text-white/60 uppercase block mb-1">Enlace (URL)</label>
                                    <input
                                        type="text"
                                        value={form.card1.href}
                                        onChange={(e) => setForm((prev) => ({ ...prev, card1: { ...prev.card1, href: e.target.value } }))}
                                        className="w-full bg-[#12131a] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tarjeta 2 */}
                        <div className="rounded-2xl border border-blue-500/20 bg-white/[0.02] p-5 space-y-4">
                            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                                <History className="w-4 h-4 text-blue-400" />
                                <h3 className="text-sm font-bold text-white">Tarjeta 2 — Streetwear & Retro</h3>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-mono ml-auto">
                                    Borde Azul
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                                <div className="sm:col-span-4">
                                    <label className="text-[11px] font-bold text-white/60 uppercase block mb-1">Píldora</label>
                                    <input
                                        type="text"
                                        value={form.card2.tag}
                                        onChange={(e) => setForm((prev) => ({ ...prev, card2: { ...prev.card2, tag: e.target.value } }))}
                                        className="w-full bg-[#12131a] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div className="sm:col-span-8">
                                    <label className="text-[11px] font-bold text-white/60 uppercase block mb-1">Título</label>
                                    <input
                                        type="text"
                                        value={form.card2.title}
                                        onChange={(e) => setForm((prev) => ({ ...prev, card2: { ...prev.card2, title: e.target.value } }))}
                                        className="w-full bg-[#12131a] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div className="sm:col-span-12">
                                    <label className="text-[11px] font-bold text-white/60 uppercase block mb-1">Descripción</label>
                                    <textarea
                                        rows={2}
                                        value={form.card2.subtitle}
                                        onChange={(e) => setForm((prev) => ({ ...prev, card2: { ...prev.card2, subtitle: e.target.value } }))}
                                        className="w-full bg-[#12131a] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div className="sm:col-span-6">
                                    <label className="text-[11px] font-bold text-white/60 uppercase block mb-1">Texto del Botón</label>
                                    <input
                                        type="text"
                                        value={form.card2.buttonText}
                                        onChange={(e) => setForm((prev) => ({ ...prev, card2: { ...prev.card2, buttonText: e.target.value } }))}
                                        className="w-full bg-[#12131a] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div className="sm:col-span-6">
                                    <label className="text-[11px] font-bold text-white/60 uppercase block mb-1">Enlace (URL)</label>
                                    <input
                                        type="text"
                                        value={form.card2.href}
                                        onChange={(e) => setForm((prev) => ({ ...prev, card2: { ...prev.card2, href: e.target.value } }))}
                                        className="w-full bg-[#12131a] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tarjeta 3 */}
                        <div className="rounded-2xl border border-amber-500/20 bg-white/[0.02] p-5 space-y-4">
                            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                                <ShieldCheck className="w-4 h-4 text-amber-400" />
                                <h3 className="text-sm font-bold text-white">Tarjeta 3 — Versión Aficionado</h3>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono ml-auto">
                                    Borde Dorado
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                                <div className="sm:col-span-4">
                                    <label className="text-[11px] font-bold text-white/60 uppercase block mb-1">Píldora</label>
                                    <input
                                        type="text"
                                        value={form.card3.tag}
                                        onChange={(e) => setForm((prev) => ({ ...prev, card3: { ...prev.card3, tag: e.target.value } }))}
                                        className="w-full bg-[#12131a] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div className="sm:col-span-8">
                                    <label className="text-[11px] font-bold text-white/60 uppercase block mb-1">Título</label>
                                    <input
                                        type="text"
                                        value={form.card3.title}
                                        onChange={(e) => setForm((prev) => ({ ...prev, card3: { ...prev.card3, title: e.target.value } }))}
                                        className="w-full bg-[#12131a] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div className="sm:col-span-12">
                                    <label className="text-[11px] font-bold text-white/60 uppercase block mb-1">Descripción</label>
                                    <textarea
                                        rows={2}
                                        value={form.card3.subtitle}
                                        onChange={(e) => setForm((prev) => ({ ...prev, card3: { ...prev.card3, subtitle: e.target.value } }))}
                                        className="w-full bg-[#12131a] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div className="sm:col-span-6">
                                    <label className="text-[11px] font-bold text-white/60 uppercase block mb-1">Texto del Botón</label>
                                    <input
                                        type="text"
                                        value={form.card3.buttonText}
                                        onChange={(e) => setForm((prev) => ({ ...prev, card3: { ...prev.card3, buttonText: e.target.value } }))}
                                        className="w-full bg-[#12131a] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div className="sm:col-span-6">
                                    <label className="text-[11px] font-bold text-white/60 uppercase block mb-1">Enlace (URL)</label>
                                    <input
                                        type="text"
                                        value={form.card3.href}
                                        onChange={(e) => setForm((prev) => ({ ...prev, card3: { ...prev.card3, href: e.target.value } }))}
                                        className="w-full bg-[#12131a] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary font-mono"
                                    />
                                </div>
                            </div>
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
        </div>
    );
}
