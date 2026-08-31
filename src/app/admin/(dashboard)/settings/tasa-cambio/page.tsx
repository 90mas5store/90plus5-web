'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    DollarSign,
    RefreshCw,
    Save,
    ArrowRightLeft,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Sparkles,
    ShieldCheck,
    CreditCard,
    Coins,
} from 'lucide-react';
import useToastMessage from '@/hooks/useToastMessage';

export default function AdminTasaCambioPage() {
    const toast = useToastMessage();
    const [rate, setRate] = useState<number>(26.80);
    const [inputRate, setInputRate] = useState<string>('26.80');
    const [updatedAt, setUpdatedAt] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);

    // Calculadora interactiva
    const [calcHnl, setCalcHnl] = useState<string>('1200');
    const [calcUsd, setCalcUsd] = useState<string>('44.78');

    const loadRate = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/settings/exchange-rate');
            if (!res.ok) throw new Error('Error al consultar tasa');
            const data = await res.json();
            if (data.rate) {
                setRate(data.rate);
                setInputRate(String(data.rate));
                setUpdatedAt(data.updated_at);
                // Actualizar calculadora con la nueva tasa
                const hnlNum = parseFloat(calcHnl) || 0;
                setCalcUsd((hnlNum / data.rate).toFixed(2));
            }
        } catch (err) {
            console.error('Error loading rate:', err);
            toast.error('Error al cargar la tasa de cambio');
        } finally {
            setLoading(false);
        }
    }, [calcHnl]);

    useEffect(() => {
        loadRate();
    }, [loadRate]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const num = parseFloat(inputRate);
        if (isNaN(num) || num <= 0) {
            toast.error('Ingresa una tasa de cambio válida mayor a 0');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings/exchange-rate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rate: num }),
            });
            
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Error al guardar');
            }

            const data = await res.json();
            setRate(data.rate);
            setInputRate(String(data.rate));
            setUpdatedAt(data.updated_at);
            toast.success('Tasa de cambio actualizada con éxito');

            // Recalcular
            const hnlNum = parseFloat(calcHnl) || 0;
            setCalcUsd((hnlNum / data.rate).toFixed(2));
        } catch (err: any) {
            console.error('Error saving rate:', err);
            toast.error(err.message || 'Error al guardar la tasa de cambio');
        } finally {
            setSaving(false);
        }
    };

    const handleHnlChange = (val: string) => {
        setCalcHnl(val);
        const num = parseFloat(val);
        if (!isNaN(num) && rate > 0) {
            setCalcUsd((num / rate).toFixed(2));
        } else {
            setCalcUsd('0.00');
        }
    };

    const handleUsdChange = (val: string) => {
        setCalcUsd(val);
        const num = parseFloat(val);
        if (!isNaN(num) && rate > 0) {
            setCalcHnl((num * rate).toFixed(2));
        } else {
            setCalcHnl('0.00');
        }
    };

    const applyPreset = (presetRate: number) => {
        setInputRate(presetRate.toFixed(2));
        const hnlNum = parseFloat(calcHnl) || 0;
        setCalcUsd((hnlNum / presetRate).toFixed(2));
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            {/* ═══════════════════ HEADER ═══════════════════ */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-black to-neutral-900 p-6 rounded-3xl border border-white/10 shadow-2xl">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <DollarSign className="w-5 h-5" />
                        </span>
                        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                            Tasa de Cambio (HNL ➡️ USD)
                        </h1>
                    </div>
                    <p className="text-xs md:text-sm text-gray-400">
                        Configura la tasa de conversión para pagos internacionales con **PayPal** y tarjetas en dólares.
                    </p>
                </div>

                <button
                    onClick={loadRate}
                    disabled={loading}
                    className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer self-start md:self-auto"
                    title="Actualizar datos"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* ═══════════════════ FORMULARIO DE AJUSTE (7 cols) ═══════════════════ */}
                <div className="lg:col-span-7 bg-neutral-900/70 backdrop-blur-xl border border-white/10 p-6 rounded-3xl space-y-6">
                    <div>
                        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                            <Coins className="w-5 h-5 text-emerald-400" />
                            Tasa Oficial de la Tienda
                        </h2>
                        <p className="text-xs text-gray-400">
                            Define cuántos Lempiras (HNL) equivalen a **1.00 USD**.
                        </p>
                    </div>

                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                                Lempiras por cada 1 USD (HNL / USD)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-400 font-mono">
                                    L
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="1"
                                    max="100"
                                    value={inputRate}
                                    onChange={(e) => setInputRate(e.target.value)}
                                    placeholder="26.80"
                                    className="w-full pl-9 pr-20 py-3.5 rounded-2xl bg-black/60 border border-white/15 text-white font-mono text-xl font-bold focus:border-emerald-500 focus:outline-none transition-colors"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                                    HNL
                                </span>
                            </div>
                        </div>

                        {/* Presets Rápidos */}
                        <div className="space-y-1.5">
                            <span className="text-[11px] font-semibold text-gray-500">Valores frecuentes:</span>
                            <div className="flex gap-2 flex-wrap">
                                {[26.50, 26.80, 27.00, 27.25, 27.50].map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => applyPreset(p)}
                                        className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                                            parseFloat(inputRate) === p
                                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                                : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
                                        }`}
                                    >
                                        L {p.toFixed(2)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={saving || loading}
                                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-950 cursor-pointer disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Guardando Tasa...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        <span>Guardar Nueva Tasa</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {updatedAt && (
                        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
                            <span>Última actualización:</span>
                            <span className="font-mono text-gray-400">
                                {new Date(updatedAt).toLocaleString('es-HN', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                })}
                            </span>
                        </div>
                    )}
                </div>

                {/* ═══════════════════ CALCULADORA EN VIVO (5 cols) ═══════════════════ */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-neutral-900/70 backdrop-blur-xl border border-white/10 p-6 rounded-3xl space-y-4">
                        <div className="flex items-center gap-2">
                            <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
                            <h2 className="text-base font-extrabold text-white">Calculadora en Vivo</h2>
                        </div>
                        <p className="text-xs text-gray-400">
                            Prueba cómo se calcularán los precios de tus camisetas en el Checkout con la tasa activa (<strong>1 USD = L {rate.toFixed(2)}</strong>):
                        </p>

                        <div className="space-y-3 pt-2">
                            {/* Monto HNL */}
                            <div className="space-y-1">
                                <span className="text-[11px] font-bold text-gray-400">Precio en Tienda (Lempiras):</span>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 font-mono">
                                        L
                                    </span>
                                    <input
                                        type="number"
                                        value={calcHnl}
                                        onChange={(e) => handleHnlChange(e.target.value)}
                                        className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-sm font-bold focus:border-emerald-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Monto USD */}
                            <div className="space-y-1">
                                <span className="text-[11px] font-bold text-gray-400">Cobro en PayPal (Dólares USD):</span>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400 font-mono">
                                        $
                                    </span>
                                    <input
                                        type="number"
                                        value={calcUsd}
                                        onChange={(e) => handleUsdChange(e.target.value)}
                                        className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-black/60 border border-emerald-500/40 text-emerald-400 font-mono text-sm font-black focus:border-emerald-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-[11px] text-gray-300">
                            💡 Ejemplo: Una camiseta de <strong>L {calcHnl || '0'} HNL</strong> se cobrará como <strong>${calcUsd || '0.00'} USD</strong>.
                        </div>
                    </div>

                    {/* Tarjeta Informativa de Seguridad */}
                    <div className="p-5 rounded-3xl bg-blue-950/20 border border-blue-500/20 space-y-2">
                        <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Cobros 100% Seguros</span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            Al usar la API oficial de PayPal, el monto en USD es verificado estrictamente en el servidor antes de confirmar cualquier pedido.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
