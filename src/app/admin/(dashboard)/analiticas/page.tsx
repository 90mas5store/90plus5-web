'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Activity,
    Users,
    Eye,
    ShoppingBag,
    Search,
    TrendingUp,
    Smartphone,
    Globe,
    Flame,
    RefreshCw,
    Loader2,
    ArrowUpRight,
    Sparkles,
    CheckCircle2,
    Clock,
    Layers,
    Compass
} from 'lucide-react';
import { AnalyticsSummary } from '@/lib/analytics/types';
import useToastMessage from '@/hooks/useToastMessage';

export default function AdminAnaliticasPage() {
    const toast = useToastMessage();
    const [range, setRange] = useState<'today' | '7d' | '30d' | 'all'>('7d');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AnalyticsSummary | null>(null);

    const loadStats = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/analytics/stats?range=${range}`);
            if (!res.ok) throw new Error('Error al cargar analíticas');
            const json: AnalyticsSummary = await res.json();
            setData(json);
        } catch (err) {
            console.error('Error loading analytics:', err);
            toast.error('Error al cargar estadísticas');
        } finally {
            setLoading(false);
        }
    }, [range]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* ═══════════════════ HEADER ═══════════════════ */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-black to-neutral-900 p-6 rounded-3xl border border-white/10 shadow-2xl">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="p-2 rounded-xl bg-primary/20 text-primary border border-primary/30">
                            <Activity className="w-5 h-5" />
                        </span>
                        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                            Analíticas & Tráfico
                        </h1>
                    </div>
                    <p className="text-xs md:text-sm text-gray-400">
                        Monitorea en tiempo real las visitas, productos populares, búsquedas y comportamiento de tus clientes.
                    </p>
                </div>

                {/* Filtros de Rango de Fecha & Refresh */}
                <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                        {(
                            [
                                { key: 'today', label: 'Hoy' },
                                { key: '7d', label: '7 Días' },
                                { key: '30d', label: '30 Días' },
                                { key: 'all', label: 'Histórico' },
                            ] as const
                        ).map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setRange(tab.key)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    range === tab.key
                                        ? 'bg-white text-black shadow-md'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={loadStats}
                        disabled={loading}
                        aria-label="Actualizar datos de analíticas"
                        className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                        title="Actualizar datos"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Aviso si falta ejecutar la migración SQL */}
            {data?.tableNeedsMigration && (
                <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">Paso final: Habilitar tabla en Supabase</h3>
                            <p className="text-xs text-gray-300 mt-0.5">
                                Para comenzar a registrar el historial de visitas en tu base de datos, copia y ejecuta el archivo <code>supabase/migrations/20260831_analytics_events.sql</code> en el <strong>SQL Editor de Supabase</strong>.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════ KPI CARDS GRID ═══════════════════ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {/* Visitantes Únicos */}
                <div className="bg-neutral-900/70 backdrop-blur-xl border border-white/10 p-4 md:p-5 rounded-2xl relative overflow-hidden group hover:border-blue-500/40 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Visitantes Únicos</span>
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <Users className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl md:text-3xl font-black text-white tracking-tight">
                        {loading ? <Loader2 className="w-6 h-6 animate-spin text-gray-500" /> : (data?.uniqueVisitors ?? 0).toLocaleString()}
                    </div>
                    <span className="text-[11px] text-gray-500 mt-1 block">Personas distintas navegando</span>
                </div>

                {/* Vistas Totales */}
                <div className="bg-neutral-900/70 backdrop-blur-xl border border-white/10 p-4 md:p-5 rounded-2xl relative overflow-hidden group hover:border-purple-500/40 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vistas de Página</span>
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <Eye className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl md:text-3xl font-black text-white tracking-tight">
                        {loading ? <Loader2 className="w-6 h-6 animate-spin text-gray-500" /> : (data?.totalPageViews ?? 0).toLocaleString()}
                    </div>
                    <span className="text-[11px] text-gray-500 mt-1 block">Total de páginas visualizadas</span>
                </div>

                {/* Vistas de Productos */}
                <div className="bg-neutral-900/70 backdrop-blur-xl border border-white/10 p-4 md:p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fichas de Camisetas</span>
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <ShoppingBag className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl md:text-3xl font-black text-white tracking-tight">
                        {loading ? <Loader2 className="w-6 h-6 animate-spin text-gray-500" /> : (data?.totalProductViews ?? 0).toLocaleString()}
                    </div>
                    <span className="text-[11px] text-gray-500 mt-1 block">Clicks en detalles de producto</span>
                </div>

                {/* Tasa de Conversión */}
                <div className="bg-neutral-900/70 backdrop-blur-xl border border-white/10 p-4 md:p-5 rounded-2xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Conversión de Compra</span>
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl md:text-3xl font-black text-amber-400 tracking-tight">
                        {loading ? <Loader2 className="w-6 h-6 animate-spin text-gray-500" /> : `${data?.conversionRate ?? 0}%`}
                    </div>
                    <span className="text-[11px] text-gray-500 mt-1 block">Pedidos vs Visitantes únicos</span>
                </div>
            </div>

            {/* ═══════════════════ GRÁFICA DE EVOLUCIÓN DIARIA ═══════════════════ */}
            <div className="bg-neutral-900/70 backdrop-blur-xl border border-white/10 p-5 md:p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-base md:text-lg font-extrabold text-white">Evolución de Tráfico</h2>
                        <p className="text-xs text-gray-400">Vistas de página y visitantes por día</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1.5 text-gray-300">
                            <span className="w-3 h-3 rounded-full bg-primary inline-block" /> Vistas
                        </span>
                        <span className="flex items-center gap-1.5 text-gray-300">
                            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Visitantes
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="h-48 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : data?.viewsTrend && data.viewsTrend.length > 0 ? (
                    <div className="space-y-3">
                        <div className="h-48 flex items-end justify-between gap-1.5 md:gap-3 pt-6 pb-2 px-2 border-b border-white/10 overflow-x-auto">
                            {data.viewsTrend.map((item, idx) => {
                                const maxViews = Math.max(...data.viewsTrend.map((d) => d.views), 1);
                                const hasViews = item.views > 0;
                                const hasVisitors = item.visitors > 0;
                                const heightPercent = hasViews ? Math.max(Math.round((item.views / maxViews) * 100), 12) : 2;
                                const visitorHeightPercent = hasVisitors ? Math.max(Math.round((item.visitors / maxViews) * 100), 8) : 2;

                                return (
                                    <div key={idx} className="flex-1 max-w-[48px] min-w-[28px] flex flex-col items-center gap-1.5 h-full justify-end group relative">
                                        {/* Tooltip Hover */}
                                        <div className="absolute -top-12 bg-black border border-white/20 px-2.5 py-1 rounded-xl text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-2xl">
                                            <p className="font-bold">{item.date}</p>
                                            <p className="text-primary">{item.views} vistas</p>
                                            <p className="text-blue-400">{item.visitors} visitantes</p>
                                        </div>

                                        <div className="w-full flex items-end justify-center gap-1 h-full">
                                            {/* Barra Vistas */}
                                            <div
                                                className={`w-1/2 rounded-t-md transition-all group-hover:brightness-125 ${
                                                    hasViews ? 'bg-gradient-to-t from-primary/60 to-primary' : 'bg-white/5'
                                                }`}
                                                style={{ height: `${heightPercent}%` }}
                                            />
                                            {/* Barra Visitantes */}
                                            <div
                                                className={`w-1/2 rounded-t-md transition-all group-hover:brightness-125 ${
                                                    hasVisitors ? 'bg-gradient-to-t from-blue-600/60 to-blue-400' : 'bg-white/5'
                                                }`}
                                                style={{ height: `${visitorHeightPercent}%` }}
                                            />
                                        </div>

                                        <span className="text-[10px] text-gray-500 truncate w-full text-center">
                                            {item.date.slice(5)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="h-40 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-2xl">
                        <Eye className="w-8 h-8 text-gray-600 mb-2" />
                        <p className="text-sm font-semibold text-gray-300">Aún no hay visitas registradas en este período</p>
                        <p className="text-xs text-gray-500 mt-1">Los datos se registrarán en tiempo real a medida que los usuarios naveguen por la tienda.</p>
                    </div>
                )}
            </div>

            {/* ═══════════════════ DOS COLUMNAS: TOP PRODUCTOS & BÚSQUEDAS ═══════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Top Productos Más Vistos */}
                <div className="bg-neutral-900/70 backdrop-blur-xl border border-white/10 p-5 md:p-6 rounded-3xl">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Flame className="w-4 h-4" />
                        </span>
                        <div>
                            <h2 className="text-base font-extrabold text-white">Top Camisetas Más Vistas</h2>
                            <p className="text-xs text-gray-400">Los productos que más atraen la atención</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>
                    ) : data?.topProducts && data.topProducts.length > 0 ? (
                        <div className="space-y-2.5">
                            {data.topProducts.map((prod, idx) => {
                                const maxViews = data.topProducts[0]?.views || 1;
                                const widthPercent = Math.max(Math.round((prod.views / maxViews) * 100), 10);

                                return (
                                    <div key={idx} className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 relative overflow-hidden group hover:border-white/20 transition-all">
                                        <div
                                            className="absolute left-0 top-0 bottom-0 bg-primary/10 transition-all pointer-events-none"
                                            style={{ width: `${widthPercent}%` }}
                                        />

                                        <div className="flex items-center gap-3 relative z-10 min-w-0">
                                            <span className="w-5 text-center text-xs font-black text-gray-500 group-hover:text-primary">
                                                #{idx + 1}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-xs md:text-sm font-bold text-white truncate">{prod.name}</p>
                                                {prod.teamName && (
                                                    <span className="text-[10px] text-gray-400 block">{prod.teamName}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="relative z-10 text-right shrink-0">
                                            <span className="text-xs md:text-sm font-black text-white font-mono">{prod.views}</span>
                                            <span className="text-[10px] text-gray-500 block">vistas</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500 text-center py-6">Sin vistas de productos en este período.</p>
                    )}
                </div>

                {/* Palabras Más Buscadas */}
                <div className="bg-neutral-900/70 backdrop-blur-xl border border-white/10 p-5 md:p-6 rounded-3xl">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <Search className="w-4 h-4" />
                        </span>
                        <div>
                            <h2 className="text-base font-extrabold text-white">Palabras Más Buscadas</h2>
                            <p className="text-xs text-gray-400">Lo que tus clientes escriben en el buscador</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>
                    ) : data?.topSearches && data.topSearches.length > 0 ? (
                        <div className="space-y-2">
                            {data.topSearches.map((search, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <Search className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                        <span className="text-xs md:text-sm font-semibold text-white truncate">&quot;{search.term}&quot;</span>
                                    </div>
                                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold font-mono">
                                        {search.count} veces
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500 text-center py-6">Sin búsquedas registradas en este período.</p>
                    )}
                </div>
            </div>

            {/* ═══════════════════ DOS COLUMNAS: FUENTES DE TRÁFICO & DISPOSITIVOS ═══════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Fuentes de Tráfico */}
                <div className="bg-neutral-900/70 backdrop-blur-xl border border-white/10 p-5 md:p-6 rounded-3xl">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="p-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20">
                            <Globe className="w-4 h-4" />
                        </span>
                        <div>
                            <h2 className="text-base font-extrabold text-white">Fuentes de Tráfico</h2>
                            <p className="text-xs text-gray-400">De dónde llegan tus visitantes (Redes Sociales, Google, etc.)</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>
                    ) : data?.trafficSources && data.trafficSources.length > 0 ? (
                        <div className="space-y-3">
                            {data.trafficSources.map((src, idx) => (
                                <div key={idx} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-gray-200">{src.source}</span>
                                        <span className="text-gray-400 font-mono">{src.count} ({src.percentage}%)</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                                            style={{ width: `${src.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500 text-center py-6">Sin fuentes de tráfico detectadas.</p>
                    )}
                </div>

                {/* Dispositivos */}
                <div className="bg-neutral-900/70 backdrop-blur-xl border border-white/10 p-5 md:p-6 rounded-3xl">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            <Smartphone className="w-4 h-4" />
                        </span>
                        <div>
                            <h2 className="text-base font-extrabold text-white">Dispositivos</h2>
                            <p className="text-xs text-gray-400">Tipo de pantalla de tus visitantes</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>
                    ) : data?.deviceBreakdown && data.deviceBreakdown.length > 0 ? (
                        <div className="space-y-3">
                            {data.deviceBreakdown.map((dev, idx) => (
                                <div key={idx} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-gray-200">{dev.device}</span>
                                        <span className="text-gray-400 font-mono">{dev.count} ({dev.percentage}%)</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                                            style={{ width: `${dev.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500 text-center py-6">Sin datos de dispositivos.</p>
                    )}
                </div>
            </div>

            {/* ═══════════════════ FEED DE ACTIVIDAD EN TIEMPO REAL ═══════════════════ */}
            <div className="bg-neutral-900/70 backdrop-blur-xl border border-white/10 p-5 md:p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                        <h2 className="text-base font-extrabold text-white">Última Actividad en Vivo</h2>
                    </div>
                    <span className="text-xs text-gray-400">Últimos eventos registrados</span>
                </div>

                {loading ? (
                    <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>
                ) : data?.recentEvents && data.recentEvents.length > 0 ? (
                    <div className="divide-y divide-white/5 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
                        {data.recentEvents.map((ev) => {
                            const badgeConfig = {
                                page_view: { label: 'Vista de Página', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
                                product_view: { label: 'Camiseta', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                                search: { label: 'Búsqueda', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
                                add_to_cart: { label: 'Carrito', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
                                matchday_click: { label: 'Matchday', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
                                checkout_start: { label: 'Checkout', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
                            }[ev.event_type] || { label: ev.event_type, color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' };

                            const timeFormatted = new Date(ev.created_at).toLocaleTimeString('es-HN', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                            });

                            return (
                                <div key={ev.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${badgeConfig.color}`}>
                                            {badgeConfig.label}
                                        </span>
                                        <span className="font-mono text-gray-300 truncate">{ev.path}</span>
                                    </div>
                                    <span className="text-gray-500 shrink-0 font-mono text-[11px]">{timeFormatted}</span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-xs text-gray-500 text-center py-6">Aún no hay actividad registrada.</p>
                )}
            </div>

            {/* ═══════════════════ TARJETA DE AYUDA / INTEGRACIONES ═══════════════════ */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-950/40 via-neutral-900 to-black border border-blue-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">¿Quieres ver grabaciones en video de tus visitantes?</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Tu tienda está lista para **Microsoft Clarity** y **Vercel Analytics**. Solo agrega tu ID de proyecto en las variables de entorno para ver mapas de calor y grabaciones de pantalla 100% gratis.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
