'use client';

import React, { useState } from 'react';
import { Filter, Download, FileText, Loader2 } from 'lucide-react';
import useToastMessage from '@/hooks/useToastMessage';
import { StatusOption } from './types';

export const STATUS_OPTIONS: StatusOption[] = [
    { value: 'pending_payment_50', label: '1. Pedido recibido', color: 'bg-primary' },
    { value: 'deposit_paid', label: '2. Anticipo confirmado', color: 'bg-primary' },
    { value: 'processing', label: '3. En proveedor', color: 'bg-primary' },
    { value: 'in_transit', label: '4. En tránsito', color: 'bg-primary' },
    { value: 'ready_for_delivery', label: '5. Listo despachar', color: 'bg-primary' },
    { value: 'pending_second_payment', label: '6. Pend. 2do pago', color: 'bg-primary' },
    { value: 'shipped_to_costumer', label: '7. Enviado cliente', color: 'bg-primary' },
    { value: 'completed', label: '8. Completado', color: 'bg-primary' },
    { value: 'Cancelled', label: 'Cancelado', color: 'bg-neutral-500' },
];

function formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
        'pending_payment_50': '1. Pedido recibido',
        'deposit_paid': '2. Anticipo confirmado',
        'processing': '3. Pedido realizado al proveedor',
        'in_transit': '4. Producto en tránsito',
        'ready_for_delivery': '5. Producto listo para despachar',
        'pending_second_payment': '6. Pendiente segundo pago',
        'shipped_to_costumer': '7. Producto enviado al cliente',
        'completed': '8. Producto recibido por el cliente',
        'paid_full': '8. Producto recibido por el cliente',
        'shipped_to_hn': '4. Producto en tránsito',
        'Cancelled': 'Cancelado',
    };
    return statusMap[status] || status;
}

interface OrderExportSectionProps {
    startDate: string;
    endDate: string;
    selectedStatuses: string[];
    onStartDateChange: (val: string) => void;
    onEndDateChange: (val: string) => void;
    onToggleStatus: (val: string) => void;
    onSetPreset: (preset: 'today' | 'week' | 'month' | 'all') => void;
}

export default function OrderExportSection({
    startDate,
    endDate,
    selectedStatuses,
    onStartDateChange,
    onEndDateChange,
    onToggleStatus,
    onSetPreset,
}: OrderExportSectionProps) {
    const toast = useToastMessage();
    const [loading, setLoading] = useState(false);

    const generateAndDownload = async (format: 'csv' | 'excel') => {
        if (!startDate || !endDate) {
            toast.error('Por favor selecciona ambas fechas');
            return;
        }
        setLoading(true);
        try {
            const statusParam = selectedStatuses.includes('all') ? 'all' : selectedStatuses.join(',');
            const queryParams = new URLSearchParams({ startDate, endDate, status: statusParam });
            const response = await fetch(`/api/admin/reports/orders?${queryParams}`);
            if (!response.ok) throw new Error('Error al obtener datos');

            const orders = await response.json();
            if (!orders || orders.length === 0) {
                toast.warning('No se encontraron pedidos con estos criterios');
                setLoading(false);
                return;
            }

            const rows = orders.flatMap((order: any) => {
                return (((order.order_items as any[]) || [])).map((item: any) => {
                    const getVal = (obj: any, key: string) => {
                        if (!obj) return '';
                        if (Array.isArray(obj)) return obj[0]?.[key] || '';
                        return obj[key] || '';
                    };

                    const personalizacion =
                        item.personalization_type === 'player'
                            ? 'Jugador'
                            : item.personalization_type === 'custom'
                            ? 'Personalizado'
                            : 'Sin personalizar';

                    const playersData = Array.isArray(item.players) ? item.players[0] : item.players;

                    const nombreDorsal =
                        item.personalization_type === 'player'
                            ? playersData?.name || ''
                            : item.personalization_type === 'custom'
                            ? item.custom_name || ''
                            : '';

                    const numeroDorsal =
                        item.personalization_type === 'player'
                            ? playersData?.number || ''
                            : item.personalization_type === 'custom'
                            ? item.custom_number || ''
                            : '';

                    return {
                        'ID Pedido': order.id.slice(0, 8).toUpperCase(),
                        'Fecha': new Date(order.created_at).toLocaleDateString('es-HN'),
                        'Cliente': order.customer_name || '',
                        'Email': order.customer_email || '',
                        'Teléfono': order.customer_phone || '',
                        'Estado': formatStatus(order.status),
                        'Equipo': getVal(item.products?.teams, 'name') || getVal(item.products?.brands, 'name') || 'N/A',
                        'Producto': getVal(item.products, 'name') || 'Producto Desconocido',
                        'Temporada': getVal(item.products, 'season') || '',
                        'Equipo/Versión': getVal(item.product_variants, 'version') || 'Estándar',
                        'Talla': getVal(item.sizes, 'label') || 'N/A',
                        'Parches': getVal(item.patches, 'name') || 'Sin parches',
                        'Personalización': personalizacion,
                        'Nombre Dorsal': nombreDorsal,
                        'Número Dorsal': numeroDorsal,
                        'Cantidad': item.quantity,
                        'Precio Unit.': item.unit_price,
                        'Subtotal': item.unit_price * item.quantity,
                    };
                });
            });

            const columns = Object.keys(rows[0] || {});
            const filename = `pedidos_${startDate}_${endDate}`;

            const triggerDownload = (blob: Blob, name: string) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = name;
                document.body.appendChild(link);
                link.click();
                setTimeout(() => {
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                }, 100);
            };

            if (format === 'excel') {
                const ExcelJS = (await import('exceljs')).default;
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('Pedidos');
                worksheet.columns = columns.map((key) => ({
                    header: key,
                    key,
                    width: Math.max(key.length, ...rows.map((r: any) => String(r[key] ?? '').length)) + 2,
                }));
                worksheet.addRows(rows);
                const excelBuffer = await workbook.xlsx.writeBuffer();
                const blob = new Blob([excelBuffer], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                });
                triggerDownload(blob, `${filename}.xlsx`);
            } else {
                const escape = (v: unknown) => {
                    const s = String(v ?? '');
                    return s.includes(',') || s.includes('"') || s.includes('\n')
                        ? `"${s.replace(/"/g, '""')}"`
                        : s;
                };
                const csvLines = [
                    columns.map(escape).join(','),
                    ...rows.map((r: any) => columns.map((c) => escape(r[c])).join(',')),
                ];
                const blob = new Blob(['\uFEFF' + csvLines.join('\n')], {
                    type: 'text/csv;charset=utf-8',
                });
                triggerDownload(blob, `${filename}.csv`);
            }
            toast.success('Reporte para proveedor descargado correctamente');
        } catch (err: unknown) {
            console.error('Download error:', err);
            toast.error('Error al generar el reporte');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 space-y-5 sm:space-y-6 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
            {/* SUBHEADER DE SECCIÓN HOMOLOGADO */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                        <Filter className="w-4 h-4" />
                    </span>
                    <div>
                        <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                            Configurar Exportación
                        </h2>
                        <p className="text-xs text-neutral-400">
                            Filtra por rango de fechas y estados del pedido antes de generar los archivos.
                        </p>
                    </div>
                </div>
            </div>

            {/* PRESETS DE FECHA TIPO APPLE SEGMENTED CONTROL */}
            <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    Período Rápido
                </label>
                <div className="inline-flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl sm:rounded-2xl border border-white/[0.06] overflow-x-auto max-w-full">
                    {[
                        { key: 'today', label: 'Hoy' },
                        { key: 'week', label: '7 Días' },
                        { key: 'month', label: '30 Días' },
                        { key: 'all', label: 'Histórico' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => onSetPreset(tab.key as any)}
                            className="px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* SELECTORES DE FECHA ERGONÓMICOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                        Fecha Inicio
                    </label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => onStartDateChange(e.target.value)}
                        className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-white/30 focus:ring-1 focus:ring-white/20 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                        Fecha Fin
                    </label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => onEndDateChange(e.target.value)}
                        className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-white/30 focus:ring-1 focus:ring-white/20 outline-none transition-all"
                    />
                </div>
            </div>

            {/* FILTRO MÚLTIPLE DE ESTADOS UNIFICADO APPLE */}
            <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    Estados a Incluir
                </label>
                <div className="flex flex-wrap gap-1.5">
                    <button
                        type="button"
                        onClick={() => onToggleStatus('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer active:scale-[0.98] ${
                            selectedStatuses.includes('all')
                                ? 'bg-white text-black shadow-xs'
                                : 'bg-white/[0.04] text-neutral-300 border border-white/[0.06] hover:text-white hover:bg-white/[0.08] font-semibold'
                        }`}
                    >
                        Todos los estados
                    </button>
                    {STATUS_OPTIONS.map((opt) => {
                        const isSelected = selectedStatuses.includes(opt.value);
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => onToggleStatus(opt.value)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer active:scale-[0.98] ${
                                    isSelected
                                        ? 'bg-white text-black font-extrabold shadow-xs'
                                        : 'bg-white/[0.04] text-neutral-300 border border-white/[0.06] hover:text-white hover:bg-white/[0.08] font-semibold'
                                }`}
                            >
                                <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                        isSelected ? 'bg-primary' : 'bg-white/35'
                                    }`}
                                />
                                <span>{opt.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* BOTONES DE DESCARGA HOMOLOGADOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                    type="button"
                    onClick={() => generateAndDownload('excel')}
                    disabled={loading}
                    className="w-full bg-white text-black font-extrabold hover:bg-neutral-200 active:scale-[0.98] px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-xs sm:text-sm shadow-sm cursor-pointer"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Download className="w-4 h-4" />}
                    Descargar Excel (.xlsx) para Proveedor
                </button>
                <button
                    type="button"
                    onClick={() => generateAndDownload('csv')}
                    disabled={loading}
                    className="w-full bg-white/5 hover:bg-white/10 active:scale-[0.98] text-neutral-300 hover:text-white font-semibold px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all border border-white/[0.08] disabled:opacity-50 text-xs sm:text-sm cursor-pointer"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4 text-neutral-400" />}
                    Descargar CSV (.csv)
                </button>
            </div>
        </div>
    );
}
