'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Sparkles,
    Save,
    RefreshCw,
    Loader2,
    Calendar,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    Info,
    Eye,
} from 'lucide-react';
import useToastMessage from '@/hooks/useToastMessage';

interface SeasonConfig {
    season: string;
    seasonShort: string;
    badge: string;
    title: string;
    subtitle: string;
    buttonText: string;
    updated_at?: string | null;
}

export default function AdminSeasonSettingsPage() {
    const toast = useToastMessage();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState<SeasonConfig>({
        season: '2026/27',
        seasonShort: '26/27',
        badge: 'NOVEDADES',
        title: 'Equipaciones 2026/27',
        subtitle: 'Versión Jugador y Aficionado bajo pedido con personalización oficial.',
        buttonText: 'Explorar Catálogo',
        updated_at: null,
    });

    const loadConfig = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/settings/season');
            if (!res.ok) throw new Error('Error al consultar configuración');
            const data = await res.json();
            if (data.season) {
                setForm({
                    season: data.season,
                    seasonShort: data.seasonShort || '26/27',
                    badge: data.badge || 'NOVEDADES',
                    title: data.title || `Equipaciones ${data.season}`,
                    subtitle: data.subtitle || 'Versión Jugador y Aficionado bajo pedido con personalización oficial.',
                    buttonText: data.buttonText || 'Explorar Catálogo',
                    updated_at: data.updated_at,
                });
            }
        } catch (err) {
            console.error('Error loading season config:', err);
            toast.error('Error al cargar la configuración de temporada');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    const handleSeasonChange = (newSeason: string) => {
        // Autogenerar abreviatura si coincide con formato YYYY/YY
        const match = newSeason.match(/^20(\d{2})[\/\-_](\d{2})$/);
        const autoShort = match ? `${match[1]}/${match[2]}` : form.seasonShort;

        setForm((prev) => ({
            ...prev,
            season: newSeason,
            seasonShort: autoShort,
            title: prev.title.startsWith('Equipaciones') ? `Equipaciones ${newSeason}` : prev.title,
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.season.trim()) {
            toast.error('La temporada no puede estar vacía');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings/season', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    season: form.season.trim(),
                    seasonShort: form.seasonShort.trim() || form.season.trim(),
                    badge: form.badge.trim() || 'NOVEDADES',
                    title: form.title.trim() || `Equipaciones ${form.season.trim()}`,
                    subtitle: form.subtitle.trim() || 'Versión Jugador y Aficionado bajo pedido con personalización oficial.',
                    buttonText: form.buttonText.trim() || 'Explorar Catálogo',
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al guardar');

            setForm((prev) => ({ ...prev, updated_at: data.updated_at }));
            toast.success('¡Configuración de temporada actualizada con éxito!');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al guardar configuración';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
            {/* Header de la sección */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Temporada & Header</h1>
                            <p className="text-sm text-gray-400">
                                Gestiona la temporada activa oficial y la tarjeta promocional del menú principal.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={loadConfig}
                        disabled={loading || saving}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>Recargar</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="min-h-[300px] flex flex-col items-center justify-center gap-3 text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-sm font-medium">Cargando configuración...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Formulario de Edición (7 cols) */}
                    <div className="lg:col-span-7 bg-neutral-900/60 border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
                        <form onSubmit={handleSave} className="space-y-5">
                            {/* Temporada y Abreviatura */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                        Temporada Oficial
                                    </label>
                                    <input
                                        type="text"
                                        value={form.season}
                                        onChange={(e) => handleSeasonChange(e.target.value)}
                                        placeholder="Ej. 2026/27 o 2027/28"
                                        required
                                        className="w-full bg-neutral-800/80 border border-neutral-700/80 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
                                    />
                                    <span className="text-[11px] text-gray-500 mt-1 block">
                                        Se usará como filtro en el catálogo: <code className="text-primary font-mono">?temporada={form.season}</code>
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                        Abreviatura (Badge)
                                    </label>
                                    <input
                                        type="text"
                                        value={form.seasonShort}
                                        onChange={(e) => setForm((p) => ({ ...p, seasonShort: e.target.value }))}
                                        placeholder="Ej. 26/27"
                                        required
                                        className="w-full bg-neutral-800/80 border border-neutral-700/80 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
                                    />
                                    <span className="text-[11px] text-gray-500 mt-1 block">
                                        Versión corta para espacios reducidos.
                                    </span>
                                </div>
                            </div>

                            {/* Badge y Título */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                        Etiqueta / Badge
                                    </label>
                                    <input
                                        type="text"
                                        value={form.badge}
                                        onChange={(e) => setForm((p) => ({ ...p, badge: e.target.value }))}
                                        placeholder="NOVEDADES"
                                        className="w-full bg-neutral-800/80 border border-neutral-700/80 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                        Título de la Tarjeta
                                    </label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                                        placeholder={`Equipaciones ${form.season}`}
                                        className="w-full bg-neutral-800/80 border border-neutral-700/80 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
                                    />
                                </div>
                            </div>

                            {/* Subtítulo / Descripción */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    Subtítulo / Propuesta de Valor
                                </label>
                                <textarea
                                    value={form.subtitle}
                                    onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
                                    rows={2}
                                    placeholder="Versión Jugador y Aficionado bajo pedido con personalización oficial."
                                    className="w-full bg-neutral-800/80 border border-neutral-700/80 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all resize-none"
                                />
                            </div>

                            {/* Texto del Botón */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    Texto del Botón CTA
                                </label>
                                <input
                                    type="text"
                                    value={form.buttonText}
                                    onChange={(e) => setForm((p) => ({ ...p, buttonText: e.target.value }))}
                                    placeholder="Explorar Catálogo"
                                    className="w-full bg-neutral-800/80 border border-neutral-700/80 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
                                />
                            </div>

                            {/* Botón de Guardar */}
                            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <span className="text-xs text-gray-500">
                                    {form.updated_at ? (
                                        <>Última actualización: {new Date(form.updated_at).toLocaleString('es-HN')}</>
                                    ) : (
                                        <>Sin cambios guardados previamente</>
                                    )}
                                </span>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Guardando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>Guardar Cambios</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Vista Previa en Vivo (5 cols) */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <Eye className="w-4 h-4 text-primary" />
                            <span>Vista Previa en Vivo (Mega Menú)</span>
                        </div>

                        {/* Card idéntica a la del header */}
                        <div className="w-full max-w-[280px] mx-auto flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-br from-red-950/50 via-neutral-950 to-black border border-white/15 relative overflow-hidden shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10 pointer-events-none" />
                            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary/25 rounded-full blur-2xl pointer-events-none" />

                            <div className="relative z-20">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/20 border border-primary/40 text-[10px] font-black text-primary uppercase tracking-wider mb-2.5">
                                    <Sparkles className="w-3 h-3 text-amber-400" />
                                    {form.badge || 'NOVEDADES'}
                                </span>
                                <h3 className="font-extrabold text-white text-base leading-tight">
                                    {form.title || `Equipaciones ${form.season}`}
                                </h3>
                                <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                                    {form.subtitle || 'Versión Jugador y Aficionado bajo pedido con personalización oficial.'}
                                </p>
                            </div>

                            <div className="relative z-20 mt-5">
                                <div className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-3 rounded-xl bg-primary text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-primary/30">
                                    <span>{form.buttonText || 'Explorar Catálogo'}</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-[10px] text-gray-500 mt-2 block text-center font-mono">
                                    Enlace: /catalogo?temporada={form.season}
                                </span>
                            </div>
                        </div>

                        {/* Explicación de impacto */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-gray-400 leading-relaxed space-y-2">
                            <div className="flex items-center gap-2 text-white font-bold">
                                <Info className="w-4 h-4 text-primary" />
                                <span>¿Qué sucede al guardar?</span>
                            </div>
                            <p>
                                1. La tarjeta del mega menú en el Header se actualiza instantáneamente en toda la tienda.
                            </p>
                            <p>
                                2. Al hacer clic en el botón, los visitantes serán dirigidos al catálogo con el filtro exacto de esa temporada (<code className="text-primary font-mono">{form.season}</code>).
                            </p>
                            <p>
                                3. No requiere despliegues de código ni modificar archivos manuales.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
