"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Activity, Search, ShieldAlert, User, Clock, ChevronLeft, ChevronRight } from "lucide-react";

interface Log {
    id: string;
    admin_email: string;
    action: string;
    details: Record<string, unknown>;
    created_at: string;
    severity?: 'info' | 'warning' | 'danger';
}

const PAGE_SIZE = 20;

export default function ActivityLogsPage() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;

    const fetchLogs = useCallback(async (p = 1) => {
        setLoading(true);
        const from = (p - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        try {
            const { data, error, count } = await supabase
                .from("admin_logs")
                .select("*", { count: 'exact' })
                .order("created_at", { ascending: false })
                .range(from, to);

            if (error) throw error;
            setLogs(data || []);
            setTotalCount(count ?? 0);
        } catch (error) {
            console.error("Error fetching logs", error);
        } finally {
            setLoading(false);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetchLogs(page);
    }, [fetchLogs, page]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    // Filtrado en cliente (dentro de la página actual)
    const filteredLogs = logs.filter(log =>
        log.admin_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getActionColor = (action: string, severity?: string) => {
        if (severity === 'danger' || action.includes('DELETE')) return 'text-red-500 bg-red-500/10 border-red-500/20';
        if (severity === 'warning' || action.includes('UPDATE')) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    };

    return (
        <div className="max-w-5xl mx-auto py-4 md:py-8 space-y-4 md:space-y-8 animate-in fade-in duration-700">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-2 flex items-center gap-3">
                        <Activity className="text-primary" /> Auditoría
                    </h1>
                    <p className="text-gray-400 max-w-lg text-sm md:text-base leading-relaxed">
                        Registro de seguridad de todas las acciones críticas realizadas por los administradores.
                    </p>
                </div>

                {/* Search */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar usuario o acción..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-primary outline-none transition-all"
                    />
                </div>
            </div>

            {/* Logs List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-20 text-gray-600">Cargando registros...</div>
                ) : filteredLogs.length === 0 ? (
                    <div className="text-center py-20 bg-[#111] rounded-3xl border border-white/5">
                        <ShieldAlert size={48} className="mx-auto text-gray-700 mb-4" />
                        <p className="text-gray-500">No hay registros de actividad recientes.</p>
                    </div>
                ) : (
                    <div className="relative border-l border-white/10 ml-4 md:ml-6 space-y-8 py-2">
                        {filteredLogs.map((log) => (
                            <div key={log.id} className="relative pl-8 group">
                                {/* Timeline Dot */}
                                <div className={`
                                    absolute left-[-5px] top-2 w-2.5 h-2.5 rounded-full border border-black ring-4 ring-black 
                                    ${getActionColor(log.action, log.severity).split(' ')[0].replace('text-', 'bg-')}
                                `}></div>

                                <div className="bg-[#111] border border-white/5 rounded-2xl p-4 md:p-5 hover:border-white/10 transition-all shadow-lg hover:bg-[#161616]">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${getActionColor(log.action, log.severity)}`}>
                                                {log.action.replace('_', ' ')}
                                            </span>
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock size={12} />
                                                {new Date(log.created_at).toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="mt-1 hidden md:block">
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                                                <User size={14} />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-medium mb-1 flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                                                <span className="text-primary">{log.admin_email}</span>
                                                <span className="text-gray-500 font-normal text-sm">realizó una acción</span>
                                            </p>

                                            {/* Details JSON Render */}
                                            <div className="bg-black/40 rounded-lg p-3 border border-white/5 font-mono text-xs text-gray-400 overflow-x-auto">
                                                {log.details && typeof log.details === 'object' ? (
                                                    Object.entries(log.details).map(([key, value]) => (
                                                        <div key={key} className="flex gap-2">
                                                            <span className="text-gray-500">{key}:</span>
                                                            <span className="text-gray-300">{String(value)}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span>{String(log.details)}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* PAGINACIÓN */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <p className="text-xs text-gray-500">
                        {totalCount} registros · página {page} de {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Siguiente <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
