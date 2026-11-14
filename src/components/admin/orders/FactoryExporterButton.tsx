'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    Factory,
    FileSpreadsheet,
    FileText,
    Loader2,
    X,
    Check,
} from 'lucide-react';
import useToastMessage from '@/hooks/useToastMessage';

export default function FactoryExporterButton() {
    const toast = useToastMessage();
    const searchParams = useSearchParams();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [scope, setScope] = useState<'deposit_paid' | 'current' | 'all_active'>('deposit_paid');

    const handleExport = async (format: 'csv' | 'excel') => {
        setLoading(true);
        try {
            let statusParam = 'deposit_paid,payment_verified';
            if (scope === 'current') {
                const cur = searchParams.get('status');
                statusParam = cur || 'all';
            } else if (scope === 'all_active') {
                statusParam = 'deposit_paid,payment_verified,processing';
            }

            const now = new Date();
            const past60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
            const startDate = searchParams.get('startDate') || past60.toISOString().slice(0, 10);
            const endDate = searchParams.get('endDate') || now.toISOString().slice(0, 10);

            const query = new URLSearchParams({
                startDate,
                endDate,
                status: statusParam,
            });

            const res = await fetch(`/api/admin/reports/orders?${query}`);
            if (!res.ok) throw new Error('Error al consultar pedidos');

            const orders = await res.json();
            if (!orders || orders.length === 0) {
                toast.warning('No se encontraron pedidos con estos criterios');
                setLoading(false);
                return;
            }

            const rows: any[] = [];
            orders.forEach((order: any) => {
                const items = (order.order_items as any[]) || [];
                items.forEach((item: any) => {
                    const product = Array.isArray(item.products) ? item.products[0] : item.products;
                    const variant = Array.isArray(item.product_variants) ? item.product_variants[0] : item.product_variants;
                    const size = Array.isArray(item.sizes) ? item.sizes[0] : item.sizes;
                    const patch = Array.isArray(item.patches) ? item.patches[0] : item.patches;
                    const player = Array.isArray(item.players) ? item.players[0] : item.players;

                    const refNumber = order.id ? `#${order.id.slice(0, 8).toUpperCase()}` : '';
                    const dateFormatted = order.created_at ? order.created_at.slice(0, 10) : '';

                    const versionLabel =
                        variant?.version === 'player'
                            ? 'Versión Jugador'
                            : variant?.version === 'fan'
                            ? 'Versión Aficionado'
                            : variant?.version || 'Estándar';

                    let playerName = '';
                    let playerNumber = '';
                    if (item.personalization_type === 'player') {
                        playerName = player?.name || '';
                        playerNumber = player?.number ? String(player.number) : '';
                    } else if (item.personalization_type === 'custom') {
                        playerName = item.custom_name || '';
                        playerNumber = item.custom_number ? String(item.custom_number) : '';
                    }

                    rows.push({
                        pedido_ref: refNumber,
                        fecha: dateFormatted,
                        equipo: product?.teams?.name || '',
                        camiseta: product?.name || 'Camiseta Oficial',
                        temporada: product?.season || '',
                        version: versionLabel,
                        talla: size?.label || '',
                        cantidad: item.quantity || 1,
                        parches: patch?.name || 'Sin parches',
                        dorsal_nombre: playerName,
                        dorsal_numero: playerNumber,
                    });
                });
            });

            if (rows.length === 0) {
                toast.warning('Los pedidos encontrados no tienen items detallados');
                setLoading(false);
                return;
            }

            const headers = [
                'ID Pedido',
                'Fecha',
                'Equipo',
                'Camiseta',
                'Temporada',
                'Versión',
                'Talla',
                'Cantidad',
                'Parches',
                'Nombre Dorsal',
                'Número Dorsal',
            ];

            const csvContent = [
                headers.join(','),
                ...rows.map((r) =>
                    [
                        `"${r.pedido_ref}"`,
                        `"${r.fecha}"`,
                        `"${(r.equipo || '').replace(/"/g, '""')}"`,
                        `"${(r.camiseta || '').replace(/"/g, '""')}"`,
                        `"${r.temporada || ''}"`,
                        `"${r.version || ''}"`,
                        `"${r.talla || ''}"`,
                        r.cantidad,
                        `"${(r.parches || '').replace(/"/g, '""')}"`,
                        `"${(r.dorsal_nombre || '').replace(/"/g, '""')}"`,
                        `"${r.dorsal_numero || ''}"`,
                    ].join(',')
                ),
            ].join('\n');

            const blob = new Blob(['\uFEFF' + csvContent], {
                type: 'text/csv;charset=utf-8;',
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const fileName = `90mas5_lista_fabrica_${new Date().toISOString().slice(0, 10)}.${
                format === 'excel' ? 'csv' : 'csv'
            }`;
            link.setAttribute('href', url);
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.celebrate(`¡Lista de fábrica exportada (${rows.length} camisetas)!`);
            setOpen(false);
        } catch (err) {
            console.error('Error exportando para fábrica:', err);
            toast.error('Error al generar la lista para el proveedor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/[0.08] text-neutral-300 hover:text-white hover:bg-white/10 active:scale-[0.98] text-xs font-semibold transition-all cursor-pointer shadow-sm"
                title="Generar lista de camisetas para enviar al proveedor"
            >
                <Factory className="w-3.5 h-3.5 text-neutral-400" />
                <span className="hidden sm:inline">Exportar Fábrica</span>
                <span className="sm:hidden">Fábrica</span>
            </button>

            {open && (
                <>
                    <div
                        className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 animate-in fade-in duration-200"
                        onClick={() => setOpen(false)}
                    />
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm bg-[#0a0c10]/95 backdrop-blur-2xl border border-white/[0.12] rounded-2xl p-5 shadow-2xl space-y-4 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
                        <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
                            <div className="flex items-center gap-2.5">
                                <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                                    <Factory className="w-4 h-4" />
                                </span>
                                <div>
                                    <h3 className="text-sm font-black text-white">Lista de Fábrica</h3>
                                    <p className="text-[10px] text-neutral-400">Camisetas para el proveedor</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                                ¿Qué pedidos incluir?
                            </label>
                            <div className="space-y-1.5">
                                {[
                                    {
                                        id: 'deposit_paid',
                                        title: 'Anticipo 50% Confirmado',
                                        desc: 'Listos para pedir a fábrica (Recomendado)',
                                    },
                                    {
                                        id: 'all_active',
                                        title: 'En Producción & Tránsito',
                                        desc: 'Anticipos confirmados + en proceso',
                                    },
                                    {
                                        id: 'current',
                                        title: 'Filtro Actual de Pantalla',
                                        desc: 'Según la pestaña o búsqueda activa',
                                    },
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setScope(opt.id as any)}
                                        className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer active:scale-[0.98] ${
                                            scope === opt.id
                                                ? 'bg-white/10 border-white/20 text-white'
                                                : 'bg-white/[0.02] border-white/5 text-neutral-400 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        <div
                                            className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                                                scope === opt.id
                                                    ? 'border-white bg-white text-black'
                                                    : 'border-white/20'
                                            }`}
                                        >
                                            {scope === opt.id && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                        </div>
                                        <div className="min-w-0">
                                            <span className="text-xs font-bold block">{opt.title}</span>
                                            <span className="text-[10px] text-neutral-400 block">{opt.desc}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-2 flex gap-2">
                            <button
                                type="button"
                                onClick={() => handleExport('excel')}
                                disabled={loading}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white text-black hover:bg-neutral-200 active:scale-[0.98] text-xs font-extrabold transition-all cursor-pointer shadow-sm disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                                ) : (
                                    <FileSpreadsheet className="w-3.5 h-3.5 text-black" />
                                )}
                                <span>Descargar Excel</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleExport('csv')}
                                disabled={loading}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.08] text-neutral-300 hover:text-white active:scale-[0.98] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                            >
                                <FileText className="w-3.5 h-3.5 text-neutral-400" />
                                <span>CSV</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
