'use client';

import React from 'react';
import { Shield, Trophy, Tag, Edit, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Team, Brand } from './types';

interface TeamsTableProps {
    teams: Team[];
    brands: Brand[];
    teamBrandsMap: Record<string, string>;
    loading: boolean;
    page: number;
    totalPages: number;
    totalCount: number;
    isSuperAdmin: boolean;
    onPageChange: (p: number) => void;
    onEditTeam: (team: Team) => void;
    onDeleteTeam: (id: string) => void;
    onOpenMatchday: (team: Team) => void;
}

export default function TeamsTable({
    teams,
    brands,
    teamBrandsMap,
    loading,
    page,
    totalPages,
    totalCount,
    isSuperAdmin,
    onPageChange,
    onEditTeam,
    onDeleteTeam,
    onOpenMatchday,
}: TeamsTableProps) {
    const brandsMap = new Map(brands.map((b) => [b.id, b.name]));

    if (loading) {
        return (
            <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="text-xs text-neutral-400 font-medium">Cargando catálogo de equipos...</span>
            </div>
        );
    }

    return (
        <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl relative before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
            {teams.length === 0 ? (
                <div className="py-20 text-center px-4">
                    <Shield className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                    <p className="text-sm font-bold text-neutral-300">No se encontraron equipos</p>
                    <p className="text-xs text-neutral-500 mt-1">Prueba con otro término de búsqueda o pestaña.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[760px]">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/[0.06] text-[10px] sm:text-xs uppercase tracking-wider text-neutral-400 font-bold">
                                <th className="py-3.5 px-4 w-20 text-center whitespace-nowrap">Escudo</th>
                                <th className="py-3.5 px-4 min-w-[200px]">Equipo & Slug</th>
                                <th className="py-3.5 px-4 min-w-[130px]">País</th>
                                <th className="py-3.5 px-4 min-w-[150px]">Liga</th>
                                <th className="py-3.5 px-4 min-w-[140px]">Marca</th>
                                <th className="py-3.5 px-4 text-center whitespace-nowrap">Estado</th>
                                <th className="py-3.5 px-4 text-right whitespace-nowrap">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {teams.map((team) => {
                                const assignedBrandId = teamBrandsMap[team.id];
                                const brandName = assignedBrandId ? brandsMap.get(assignedBrandId) : null;

                                return (
                                    <tr key={team.id} className="hover:bg-white/[0.02] transition-colors">
                                        {/* Escudo */}
                                        <td className="py-3.5 px-4 text-center">
                                            <div className="w-11 h-11 relative mx-auto rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center overflow-hidden p-1 shadow-xs">
                                                {team.logo_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={team.logo_url}
                                                        alt={team.name}
                                                        className="w-full h-full object-contain"
                                                    />
                                                ) : (
                                                    <Shield className="w-5 h-5 text-neutral-600" />
                                                )}
                                            </div>
                                        </td>

                                        {/* Nombre & Slug */}
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-white text-sm">
                                                    {team.name}
                                                </span>
                                                {team.is_national_team && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-300 border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 rounded-full">
                                                        Selección
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[11px] font-mono text-neutral-500 block mt-0.5">
                                                /{team.slug}
                                            </span>
                                        </td>

                                        {/* País */}
                                        <td className="py-3.5 px-4 text-xs font-medium text-neutral-300">
                                            {team.country || <span className="text-neutral-600 italic">—</span>}
                                        </td>

                                        {/* Liga */}
                                        <td className="py-3.5 px-4">
                                            {team.leagues?.name ? (
                                                <span className="text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
                                                    <Trophy className="w-3 h-3" />
                                                    {team.leagues.name}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-neutral-600 italic">Sin liga</span>
                                            )}
                                        </td>

                                        {/* Marca */}
                                        <td className="py-3.5 px-4">
                                            {brandName ? (
                                                <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
                                                    <Tag className="w-3 h-3" />
                                                    {brandName}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-neutral-600 italic">Sin marca</span>
                                            )}
                                        </td>

                                        {/* Estado */}
                                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                    team.active
                                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                }`}
                                            >
                                                <span
                                                    className={`w-1.5 h-1.5 rounded-full ${
                                                        team.active ? 'bg-emerald-400' : 'bg-rose-400'
                                                    }`}
                                                />
                                                <span>{team.active ? 'Activo' : 'Inactivo'}</span>
                                            </span>
                                        </td>

                                        {/* Acciones */}
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => onOpenMatchday(team)}
                                                    title={
                                                        team.is_matchday_active
                                                            ? 'Partido en Vivo activo (Clic para editar)'
                                                            : 'Activar Partido en Vivo (Matchday)'
                                                    }
                                                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.98] ${
                                                        team.is_matchday_active
                                                            ? 'bg-rose-600 text-white shadow-xs'
                                                            : 'bg-white/5 border border-white/[0.08] text-neutral-300 hover:text-white hover:bg-white/10'
                                                    }`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${team.is_matchday_active ? 'bg-white animate-pulse' : 'bg-neutral-500'}`} />
                                                    <span>{team.is_matchday_active ? 'En Vivo' : 'Matchday'}</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => onEditTeam(team)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/[0.08] transition-all cursor-pointer active:scale-[0.98]"
                                                    title="Editar equipo y marca"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => onDeleteTeam(team.id)}
                                                    disabled={!isSuperAdmin}
                                                    title={!isSuperAdmin ? 'Solo Super Admins pueden eliminar' : 'Mover a papelera'}
                                                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-rose-500/10 text-neutral-300 hover:text-rose-400 border border-white/[0.08] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* PAGINACIÓN */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-t border-white/[0.06] bg-black/20">
                    <p className="text-[11px] sm:text-xs text-neutral-400 text-center sm:text-left">
                        Total: <span className="text-white font-bold">{totalCount}</span> equipos registrados
                    </p>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {page > 1 ? (
                            <button
                                type="button"
                                onClick={() => onPageChange(page - 1)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] text-neutral-300 hover:text-white border border-white/[0.08] transition-all text-xs font-bold cursor-pointer"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                            </button>
                        ) : (
                            <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.02] text-neutral-600 text-xs font-bold cursor-not-allowed">
                                <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                            </span>
                        )}
                        <span className="text-xs text-neutral-400 px-2 font-mono">
                            {page} / {totalPages}
                        </span>
                        {page < totalPages ? (
                            <button
                                type="button"
                                onClick={() => onPageChange(page + 1)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] text-neutral-300 hover:text-white border border-white/[0.08] transition-all text-xs font-bold cursor-pointer"
                            >
                                Siguiente <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        ) : (
                            <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.02] text-neutral-600 text-xs font-bold cursor-not-allowed">
                                Siguiente <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

