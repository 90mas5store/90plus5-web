'use client';

import React, { useState, useEffect } from 'react';
import {
    Sliders,
    Save,
    X,
    Loader2,
    Sparkles,
    ShoppingBag,
    CheckCircle2,
    Eye,
    Info,
    RefreshCw,
} from 'lucide-react';
import { HeroShowcaseSettings, DEFAULT_HERO_SETTINGS } from '@/lib/heroSettings';
import useToastMessage from '@/hooks/useToastMessage';

interface HeroShowcaseSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function HeroShowcaseSettingsModal({ isOpen, onClose }: HeroShowcaseSettingsModalProps) {
    const toast = useToastMessage();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<HeroShowcaseSettings>(DEFAULT_HERO_SETTINGS);

    useEffect(() => {
        if (!isOpen) return;

        async function fetchSettings() {
            setLoading(true);
            try {
                const res = await fetch('/api/admin/settings/hero-showcase');
                if (res.ok) {
                    const data = await res.json();
                    setSettings({
                        quickTagBadge: data.quickTagBadge ?? DEFAULT_HERO_SETTINGS.quickTagBadge,
                        quickTagAction: data.quickTagAction ?? DEFAULT_HERO_SETTINGS.quickTagAction,
                        specsSizes: data.specsSizes ?? DEFAULT_HERO_SETTINGS.specsSizes,
                        specsVersion: data.specsVersion ?? DEFAULT_HERO_SETTINGS.specsVersion,
                        trustNotice: data.trustNotice ?? DEFAULT_HERO_SETTINGS.trustNotice,
                        secondaryButtonText: data.secondaryButtonText ?? DEFAULT_HERO_SETTINGS.secondaryButtonText,
                        secondaryButtonUrl: data.secondaryButtonUrl ?? DEFAULT_HERO_SETTINGS.secondaryButtonUrl,
                        showQuickTag: data.showQuickTag ?? true,
                        showSpecs: data.showSpecs ?? true,
                        showTrustNotice: data.showTrustNotice ?? true,
                        showSecondaryButton: data.showSecondaryButton ?? true,
                    });
                }
            } catch (err) {
                console.error('Error fetching hero showcase settings:', err);
                toast.error('No se pudo cargar la configuración del Hero');
            } finally {
                setLoading(false);
            }
        }

        fetchSettings();
    }, [isOpen, toast]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings/hero-showcase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Error al guardar');
            }

            toast.success('¡Textos y elementos del Hero guardados correctamente!');
            onClose();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al guardar';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#111218] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#151722]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                            <Sliders className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-black text-white">
                                Textos & Elementos del Hero
                            </h2>
                            <p className="text-xs text-white/50">
                                Personaliza la píldora interactiva sobre la imagen, tallas, confianza y botones.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body scrollable */}
                {loading ? (
                    <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center gap-3 text-white/50">
                        <Loader2 className="w-7 h-7 animate-spin text-primary" />
                        <span className="text-xs font-semibold">Cargando textos...</span>
                    </div>
                ) : (
                    <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        {/* 1. PÍLDORA INTERACTIVA SOBRE LA IMAGEN */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4 text-emerald-400" />
                                    <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                                        Píldora Interactiva (Sobre la Imagen)
                                    </h3>
                                </div>
                                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold select-none text-white/70">
                                    <input
                                        type="checkbox"
                                        checked={settings.showQuickTag}
                                        onChange={(e) => setSettings({ ...settings, showQuickTag: e.target.checked })}
                                        className="rounded border-white/20 bg-black text-primary focus:ring-0"
                                    />
                                    <span>Activa</span>
                                </label>
                            </div>

                            {settings.showQuickTag && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <label className="block text-[11px] font-bold text-white/60 mb-1.5 uppercase">
                                            Badge / Estado Superior
                                        </label>
                                        <input
                                            type="text"
                                            value={settings.quickTagBadge}
                                            onChange={(e) => setSettings({ ...settings, quickTagBadge: e.target.value })}
                                            placeholder="Ej. Prenda Oficial 24/25 o En Stock"
                                            className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-white/60 mb-1.5 uppercase">
                                            Texto de Acción
                                        </label>
                                        <input
                                            type="text"
                                            value={settings.quickTagAction}
                                            onChange={(e) => setSettings({ ...settings, quickTagAction: e.target.value })}
                                            placeholder="Ej. Ver detalles y tallas"
                                            className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. CHIP DE TALLAS Y VERSIONES */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-[#FFD700]" />
                                    <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                                        Especificaciones de Talla & Versión
                                    </h3>
                                </div>
                                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold select-none text-white/70">
                                    <input
                                        type="checkbox"
                                        checked={settings.showSpecs}
                                        onChange={(e) => setSettings({ ...settings, showSpecs: e.target.checked })}
                                        className="rounded border-white/20 bg-black text-primary focus:ring-0"
                                    />
                                    <span>Activa</span>
                                </label>
                            </div>

                            {settings.showSpecs && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <label className="block text-[11px] font-bold text-white/60 mb-1.5 uppercase">
                                            Texto de Tallas Disponibles
                                        </label>
                                        <input
                                            type="text"
                                            value={settings.specsSizes}
                                            onChange={(e) => setSettings({ ...settings, specsSizes: e.target.value })}
                                            placeholder="Tallas: S · M · L · XL · 2XL"
                                            className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-white/60 mb-1.5 uppercase">
                                            Versiones Disponibles
                                        </label>
                                        <input
                                            type="text"
                                            value={settings.specsVersion}
                                            onChange={(e) => setSettings({ ...settings, specsVersion: e.target.value })}
                                            placeholder="Versión Jugador & Fan"
                                            className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 3. AVISO DE CONFIANZA / COBERTURA */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                                    Aviso de Cobertura / Garantía al Pie
                                </h3>
                                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold select-none text-white/70">
                                    <input
                                        type="checkbox"
                                        checked={settings.showTrustNotice}
                                        onChange={(e) => setSettings({ ...settings, showTrustNotice: e.target.checked })}
                                        className="rounded border-white/20 bg-black text-primary focus:ring-0"
                                    />
                                    <span>Activo</span>
                                </label>
                            </div>

                            {settings.showTrustNotice && (
                                <div className="pt-2">
                                    <label className="block text-[11px] font-bold text-white/60 mb-1.5 uppercase">
                                        Texto de Entrega y Cobertura
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.trustNotice}
                                        onChange={(e) => setSettings({ ...settings, trustNotice: e.target.value })}
                                        placeholder="Prendas oficiales listas para despacho o pedido · Tegucigalpa & Honduras"
                                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                    />
                                </div>
                            )}
                        </div>

                        {/* 4. BOTÓN SECUNDARIO */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                                    Botón Secundario (Junto a Comprar Ahora)
                                </h3>
                                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold select-none text-white/70">
                                    <input
                                        type="checkbox"
                                        checked={settings.showSecondaryButton}
                                        onChange={(e) => setSettings({ ...settings, showSecondaryButton: e.target.checked })}
                                        className="rounded border-white/20 bg-black text-primary focus:ring-0"
                                    />
                                    <span>Activo</span>
                                </label>
                            </div>

                            {settings.showSecondaryButton && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <label className="block text-[11px] font-bold text-white/60 mb-1.5 uppercase">
                                            Texto del Botón
                                        </label>
                                        <input
                                            type="text"
                                            value={settings.secondaryButtonText}
                                            onChange={(e) => setSettings({ ...settings, secondaryButtonText: e.target.value })}
                                            placeholder="Ver Todo el Catálogo"
                                            className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-white/60 mb-1.5 uppercase">
                                            Enlace de Destino
                                        </label>
                                        <input
                                            type="text"
                                            value={settings.secondaryButtonUrl}
                                            onChange={(e) => setSettings({ ...settings, secondaryButtonUrl: e.target.value })}
                                            placeholder="/catalogo"
                                            className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </form>
                )}

                {/* Footer con botón guardar */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#151722]">
                    <span className="text-[11px] text-white/50">
                        Los cambios impactan el Hero principal en vivo.
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold transition-all cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-white hover:text-black text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Guardar Todo</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
