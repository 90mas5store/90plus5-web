import React from "react";

interface TorneosKPIsProps {
    activeCount: number;
    totalTracked: number;
    copasCount: number;
    customCount: number;
    updatedAt: string | null;
}

export default function TorneosKPIs({
    activeCount,
    totalTracked,
    copasCount,
    customCount,
    updatedAt,
}: TorneosKPIsProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Torneos Monitoreados</span>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl sm:text-3xl font-black text-white">{activeCount}</span>
                    <span className="text-xs text-gray-500 font-medium">de {totalTracked}</span>
                </div>
            </div>

            <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Copas Nacionales</span>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl sm:text-3xl font-black text-amber-400">{copasCount}</span>
                    <span className="text-xs text-gray-500 font-medium">activas</span>
                </div>
            </div>

            <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Personalizados</span>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl sm:text-3xl font-black text-blue-400">{customCount}</span>
                    <span className="text-xs text-gray-500 font-medium">añadidos</span>
                </div>
            </div>

            <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Última Sincro</span>
                <div className="mt-1.5 text-xs text-gray-300 font-medium truncate">
                    {updatedAt
                        ? new Date(updatedAt).toLocaleTimeString("es-HN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                          })
                        : "Por defecto"}
                </div>
            </div>
        </div>
    );
}
