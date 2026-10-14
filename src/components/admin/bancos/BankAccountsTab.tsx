import React from "react";
import { Building2, Plus, Edit, Trash2, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { BankAccountRecord } from "./types";

interface BankAccountsTabProps {
    banks: BankAccountRecord[];
    loading: boolean;
    onNewBank: () => void;
    onEditBank: (bank: BankAccountRecord) => void;
    onDeleteBank: (id: string, slug?: string) => void;
    onToggleActive: (bank: BankAccountRecord) => void;
    onMoveBank: (index: number, direction: "up" | "down") => void;
}

export default function BankAccountsTab({
    banks,
    loading,
    onNewBank,
    onEditBank,
    onDeleteBank,
    onToggleActive,
    onMoveBank,
}: BankAccountsTabProps) {
    return (
        <div className="bg-neutral-900 border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                    <h2 className="text-base md:text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        Cuentas Bancarias Registradas
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Estas cuentas se muestran al cliente cuando elige Transferencia Bancaria y en el correo de confirmación de pedido.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onNewBank}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-primary/20 cursor-pointer shrink-0"
                >
                    <Plus className="w-4 h-4" /> Nueva Cuenta
                </button>
            </div>

            {loading ? (
                <div className="py-12 text-center text-gray-500 flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-xs">Cargando cuentas bancarias...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {banks.map((b, index) => (
                        <div
                            key={b.id}
                            className={`p-5 rounded-2xl border transition-all space-y-4 ${
                                b.activo ? "bg-black/50 border-white/10" : "bg-black/20 border-white/5 opacity-50"
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    {/* 🔼🔽 Botones de Reordenamiento de Bancos */}
                                    <div className="flex flex-col gap-0.5 shrink-0 bg-white/5 p-1 rounded-xl border border-white/5">
                                        <button
                                            type="button"
                                            disabled={index === 0}
                                            onClick={() => onMoveBank(index, "up")}
                                            className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent text-gray-400 hover:text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                                            title="Subir posición"
                                        >
                                            <ChevronUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={index === banks.length - 1}
                                            onClick={() => onMoveBank(index, "down")}
                                            className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent text-gray-400 hover:text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                                            title="Bajar posición"
                                        >
                                            <ChevronDown className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden p-1 shrink-0">
                                        {b.logo ? (
                                            <img src={b.logo} alt={b.banco} className="w-full h-full object-contain" />
                                        ) : (
                                            <Building2 className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[9px] font-mono font-bold text-gray-500 bg-white/5 px-1.5 py-0.2 rounded border border-white/5">
                                                #{b.orden || index + 1}
                                            </span>
                                            <h3 className="font-black text-white text-sm truncate">{b.banco}</h3>
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">{b.tipo}</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => onToggleActive(b)}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase cursor-pointer shrink-0 ${
                                        b.activo
                                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                            : "bg-red-500/20 text-red-400 border-red-500/30"
                                    }`}
                                >
                                    {b.activo ? "Activa" : "Inactiva"}
                                </button>
                            </div>

                            <div className="bg-black/60 border border-white/5 p-3 rounded-xl space-y-1">
                                <p className="text-[10px] text-gray-500 uppercase font-bold">Número de Cuenta</p>
                                <p className="font-mono text-base font-black text-white tracking-widest">{b.numero}</p>
                                <p className="text-[10px] text-gray-400 font-medium">{b.titular}</p>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={() => onEditBank(b)}
                                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                    <Edit className="w-3.5 h-3.5" /> Editar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDeleteBank(b.id, b.slug)}
                                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
