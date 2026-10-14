import React from "react";
import { CreditCard, Building2, Plus, Edit, Trash2, Clock, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { PaymentMethodRecord } from "./types";

interface PaymentMethodsTabProps {
    methods: PaymentMethodRecord[];
    loading: boolean;
    onNewMethod: () => void;
    onEditMethod: (method: PaymentMethodRecord) => void;
    onDeleteMethod: (id: string, code?: string) => void;
    onToggleActive: (method: PaymentMethodRecord) => void;
    onToggleComingSoon: (method: PaymentMethodRecord) => void;
    onMoveMethod: (index: number, direction: "up" | "down") => void;
}

export default function PaymentMethodsTab({
    methods,
    loading,
    onNewMethod,
    onEditMethod,
    onDeleteMethod,
    onToggleActive,
    onToggleComingSoon,
    onMoveMethod,
}: PaymentMethodsTabProps) {
    return (
        <div className="bg-neutral-900 border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                    <h2 className="text-base md:text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        Opciones de Pago en Checkout
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Puedes activar la casilla &quot;Próximamente&quot; para métodos como tarjetas de crédito/débito y se mostrarán inactivos con el diseño oficial.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onNewMethod}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-primary/20 cursor-pointer shrink-0"
                >
                    <Plus className="w-4 h-4" /> Nuevo Método
                </button>
            </div>

            {loading ? (
                <div className="py-12 text-center text-gray-500 flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-xs">Cargando métodos de pago...</span>
                </div>
            ) : (
                <div className="space-y-3">
                    {methods.map((m, index) => (
                        <div
                            key={m.id}
                            className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                                m.active ? "bg-black/50 border-white/10" : "bg-black/20 border-white/5 opacity-50"
                            }`}
                        >
                            <div className="flex items-start sm:items-center gap-3 min-w-0">
                                {/* 🔼🔽 Botones de Reordenamiento */}
                                <div className="flex flex-col gap-0.5 shrink-0 bg-white/5 p-1 rounded-xl border border-white/5">
                                    <button
                                        type="button"
                                        disabled={index === 0}
                                        onClick={() => onMoveMethod(index, "up")}
                                        className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent text-gray-400 hover:text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                                        title="Subir posición"
                                    >
                                        <ChevronUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={index === methods.length - 1}
                                        onClick={() => onMoveMethod(index, "down")}
                                        className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent text-gray-400 hover:text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                                        title="Bajar posición"
                                    >
                                        <ChevronDown className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                        m.type === "paypal" || m.code === "paypal"
                                            ? "bg-[#003087]/20 text-[#0079C1] border border-[#0079C1]/30"
                                            : m.is_coming_soon
                                            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                            : "bg-primary/10 text-primary border border-primary/20"
                                    }`}
                                >
                                    {m.type === "transferencia" ? (
                                        <Building2 className="w-5 h-5" />
                                    ) : m.type === "paypal" || m.code === "paypal" ? (
                                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.82.875 4.965-.039.194-.086.39-.14.586-.882 4.417-3.834 6.721-8.528 6.721H9.278l-1.39 8.813a.642.642 0 0 1-.633.542zM8.88 12.182h1.666c3.275 0 5.28-1.571 5.943-4.893.037-.184.07-.367.098-.549.324-1.62-.02-2.73-.895-3.328-.737-.503-1.921-.692-3.64-.692H6.942L4.99 17.587h2.478l1.412-5.405z" />
                                        </svg>
                                    ) : (
                                        <CreditCard className="w-5 h-5" />
                                    )}
                                </div>

                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[10px] font-mono font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                            #{m.sort_order || index + 1}
                                        </span>
                                        <h3 className="font-black text-white text-sm uppercase tracking-tight">{m.name}</h3>
                                        {m.is_coming_soon && (
                                            <span className="text-[9px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-black uppercase tracking-widest flex items-center gap-1">
                                                <Clock className="w-2.5 h-2.5" /> PRÓXIMAMENTE
                                            </span>
                                        )}
                                        {!m.active && (
                                            <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
                                                Inactivo
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-md">{m.description || "Sin descripción"}</p>
                                </div>
                            </div>

                            {/* CONTROLES Y SWITCHES */}
                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                <button
                                    type="button"
                                    onClick={() => onToggleComingSoon(m)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                                        m.is_coming_soon
                                            ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                            : "bg-white/5 text-gray-400 border-white/10 hover:text-white"
                                    }`}
                                    title="Marcar como Próximamente en checkout"
                                >
                                    <Clock className="w-3.5 h-3.5" />
                                    {m.is_coming_soon ? "Próximamente" : "Disponible"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => onToggleActive(m)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                        m.active
                                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                            : "bg-red-500/20 text-red-400 border-red-500/30"
                                    }`}
                                >
                                    {m.active ? "Activo" : "Inactivo"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => onEditMethod(m)}
                                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
                                    title="Editar método"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => onDeleteMethod(m.id, m.code)}
                                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors cursor-pointer"
                                    title="Eliminar método"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
