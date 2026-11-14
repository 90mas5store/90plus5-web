'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Radio } from 'lucide-react';
import { Team, MatchdayConfig } from './types';

interface TeamMatchdayModalProps {
    team: Team | null;
    onClose: () => void;
    matchdayConfig: MatchdayConfig;
    setMatchdayConfig: React.Dispatch<React.SetStateAction<MatchdayConfig>>;
    allTeamsList: Team[];
    saving: boolean;
    onSave: () => Promise<void>;
}

export function TeamMatchdayModal({
    team,
    onClose,
    matchdayConfig,
    setMatchdayConfig,
    allTeamsList,
    saving,
    onSave,
}: TeamMatchdayModalProps) {
    if (!team) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <div className="absolute inset-0" onClick={onClose} />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                    className="bg-[#0a0c10]/95 backdrop-blur-2xl border border-white/[0.1] rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent"
                >
                    {/* Header */}
                    <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
                                <Radio className="w-4 h-4 animate-pulse" />
                            </div>
                            <div>
                                <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-tight">
                                    Partido en Vivo · {team.name}
                                </h2>
                                <p className="text-[11px] text-neutral-400">Control de barra Matchday en la tienda</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-5 sm:p-6 space-y-4">
                        {/* Toggle Matchday */}
                        <label className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] cursor-pointer hover:bg-white/[0.05] transition-colors select-none">
                            <div>
                                <span className="text-xs sm:text-sm font-bold text-white block">Estado del Partido</span>
                                <span className="text-[11px] text-neutral-400">Mostrar barra de partido en vivo en el home</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={matchdayConfig.is_matchday_active}
                                onChange={(e) =>
                                    setMatchdayConfig((prev) => ({
                                        ...prev,
                                        is_matchday_active: e.target.checked,
                                    }))
                                }
                                className="w-4 h-4 rounded border-white/20 bg-black/50 text-white focus:ring-0 cursor-pointer"
                            />
                        </label>

                        {matchdayConfig.is_matchday_active && (
                            <div className="space-y-4 pt-1">
                                {/* Rival */}
                                <div>
                                    <label className="text-[11px] font-bold uppercase text-neutral-400 mb-1.5 block tracking-wider">
                                        Equipo Rival
                                    </label>
                                    <select
                                        value={matchdayConfig.opponent_selection}
                                        onChange={(e) =>
                                            setMatchdayConfig((prev) => ({
                                                ...prev,
                                                opponent_selection: e.target.value,
                                            }))
                                        }
                                        className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                                    >
                                        <option value="">-- Seleccionar de la lista --</option>
                                        {allTeamsList
                                            .filter((t) => t.id !== team.id)
                                            .map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.name}
                                                </option>
                                            ))}
                                        <option value="custom">Otro (Escribir nombre manual)...</option>
                                    </select>

                                    {matchdayConfig.opponent_selection === 'custom' && (
                                        <input
                                            type="text"
                                            value={matchdayConfig.opponent_custom_name}
                                            onChange={(e) =>
                                                setMatchdayConfig((prev) => ({
                                                    ...prev,
                                                    opponent_custom_name: e.target.value,
                                                }))
                                            }
                                            placeholder="Nombre del rival"
                                            className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-neutral-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all mt-2"
                                        />
                                    )}
                                </div>

                                {/* Marcador */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] font-bold uppercase text-neutral-400 mb-1 block truncate">
                                            Goles {team.name.slice(0, 12)}
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={matchdayConfig.score_home}
                                            onChange={(e) =>
                                                setMatchdayConfig((prev) => ({
                                                    ...prev,
                                                    score_home: e.target.value,
                                                }))
                                            }
                                            className="w-full bg-black/40 border border-white/[0.08] rounded-xl p-2.5 text-white font-mono text-center text-lg font-bold outline-none focus:border-white/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold uppercase text-neutral-400 mb-1 block">
                                            Goles Rival
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={matchdayConfig.score_away}
                                            onChange={(e) =>
                                                setMatchdayConfig((prev) => ({
                                                    ...prev,
                                                    score_away: e.target.value,
                                                }))
                                            }
                                            className="w-full bg-black/40 border border-white/[0.08] rounded-xl p-2.5 text-white font-mono text-center text-lg font-bold outline-none focus:border-white/30"
                                        />
                                    </div>
                                </div>

                                {/* Periodo */}
                                <div>
                                    <label className="text-[11px] font-bold uppercase text-neutral-400 mb-1 block">
                                        Periodo del Partido
                                    </label>
                                    <input
                                        type="text"
                                        value={matchdayConfig.period}
                                        onChange={(e) =>
                                            setMatchdayConfig((prev) => ({ ...prev, period: e.target.value }))
                                        }
                                        placeholder="Ej: En Vivo 65', Medio Tiempo, Final"
                                        className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-neutral-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-black/40 flex justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-white/5 hover:bg-white/10 active:scale-[0.98] text-neutral-300 hover:text-white border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs sm:text-sm transition-all cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={onSave}
                            disabled={saving}
                            className="bg-white text-black font-extrabold hover:bg-neutral-200 active:scale-[0.98] rounded-xl px-4 py-2 text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            <span>{saving ? 'Guardando...' : 'Aplicar Marcador'}</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

