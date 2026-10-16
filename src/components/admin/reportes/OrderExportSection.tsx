'use client';

import React, { useState } from 'react';
import { Filter, Download, FileText, Loader2 } from 'lucide-react';
import useToastMessage from '@/hooks/useToastMessage';
import { StatusOption } from './types';

export const STATUS_OPTIONS: StatusOption[] = [
    { value: 'pending_payment_50', label: '1. Pedido recibido', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
    { value: 'deposit_paid', label: '2. Anticipo confirmado', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
    { value: 'processing', label: '3. Pedido realizado al proveedor', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    { value: 'in_transit', label: '4. Producto en tránsito', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { value: 'ready_for_delivery', label: '5. Producto listo para despachar', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
    { value: 'pending_second_payment', label: '6. Pendiente segundo pago', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
    { value: 'shipped_to_costumer', label: '7. Producto enviado al cliente', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
    { value: 'completed', label: '8. Producto recibido por el cliente', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
    { value: 'Cancelled', label: 'Cancelado', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
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
        <div className="bg-neutral-900 border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2 uppercase tracking-tight">
                    <Filter className="w-5 h-5 text-primary" />
                    Exportar Pedidos para Proveedor
                </h2>
            </div>

            {/* PRESETS DE FECHA */}
            <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    Períodos Rápidos
                </label>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => onSetPreset('today')}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors text-gray-300 cursor-pointer"
                    >
                        Hoy
                    </button>
                    <button
                        type="button"
                        onClick={() => onSetPreset('week')}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors text-gray-300 cursor-pointer"
                    >
                        Últimos 7 días
                    </button>
                    <button
                        type="button"
                        onClick={() => onSetPreset('month')}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors text-gray-300 cursor-pointer"
                    >
                        Último mes
                    </button>
                    <button
                        type="button"
                        onClick={() => onSetPreset('all')}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors text-gray-300 cursor-pointer"
                    >
                        Todo el historial
                    </button>
                </div>
            </div>

            {/* FECHAS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                        Fecha Inicio
                    </label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => onStartDateChange(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-xs sm:text-sm focus:border-primary outline-none"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                        Fecha Fin
                    </label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => onEndDateChange(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-xs sm:text-sm focus:border-primary outline-none"
                    />
                </div>
            </div>

            {/* FILTRO MÚLTIPLE DE ESTADOS */}
            <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    Estados a Incluir
                </label>
                <div className="flex flex-wrap gap-1.5">
                    <button
                        type="button"
                        onClick={() => onToggleStatus('all')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            selectedStatuses.includes('all')
                                ? 'bg-white text-black border-white'
                                : 'bg-black/30 text-gray-400 border-white/10 hover:border-white/30'
                        }`}
                    >
                        Todos los estados
                    </button>
                    {STATUS_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => onToggleStatus(opt.value)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                selectedStatuses.includes(opt.value)
                                    ? opt.color + ' border-current'
                                    : 'bg-black/30 text-gray-400 border-white/10 hover:border-white/30'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* BOTONES DE DESCARGA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                    type="button"
                    onClick={() => generateAndDownload('excel')}
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black p-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-xs sm:text-sm shadow-lg shadow-emerald-900/30 cursor-pointer"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Descargar Excel (.xlsx) para Proveedor
                </button>
                <button
                    type="button"
                    onClick={() => generateAndDownload('csv')}
                    disabled={loading}
                    className="w-full bg-white/10 hover:bg-white/20 text-white font-black p-3.5 rounded-xl flex items-center justify-center gap-2 transition-all border border-white/10 disabled:opacity-50 text-xs sm:text-sm cursor-pointer"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    Descargar CSV (.csv)
                </button>
            </div>
        </div>
    );
}
