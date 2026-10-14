import React from "react";
import { CreditCard, X, Save } from "lucide-react";
import { PaymentMethodRecord } from "./types";

interface PaymentMethodModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingMethod: PaymentMethodRecord | null;
    setEditingMethod: React.Dispatch<React.SetStateAction<PaymentMethodRecord | null>>;
    onSave: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function PaymentMethodModal({
    isOpen,
    onClose,
    editingMethod,
    setEditingMethod,
    onSave,
}: PaymentMethodModalProps) {
    if (!isOpen || !editingMethod) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                {/* HEADER FIJO */}
                <div className="flex items-center justify-between border-b border-white/10 p-5 shrink-0 bg-neutral-900">
                    <h3 className="font-black text-white text-base uppercase tracking-tight flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        {editingMethod.id ? "Editar Método de Pago" : "Nuevo Método de Pago"}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* FORMULARIO CON SCROLL INTERNO */}
                <form onSubmit={onSave} className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                Nombre del Método *
                            </label>
                            <input
                                type="text"
                                required
                                value={editingMethod.name}
                                onChange={(e) => setEditingMethod({ ...editingMethod, name: e.target.value })}
                                placeholder="Ej. Tarjeta de Crédito / Débito"
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:border-primary outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                Tipo de Método
                            </label>
                            <select
                                value={editingMethod.type}
                                onChange={(e) => {
                                    const newType = e.target.value as PaymentMethodRecord["type"];
                                    const isPaypal = newType === "paypal";
                                    setEditingMethod({
                                        ...editingMethod,
                                        type: newType,
                                        code:
                                            isPaypal && (!editingMethod.code || editingMethod.code.startsWith("metodo_"))
                                                ? "paypal"
                                                : editingMethod.code,
                                        name: isPaypal && !editingMethod.name ? "PayPal / Tarjetas Internacionales" : editingMethod.name,
                                        description:
                                            isPaypal && !editingMethod.description
                                                ? "Paga de forma instantánea y segura con saldo PayPal, tarjeta de crédito o débito."
                                                : editingMethod.description,
                                    });
                                }}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:border-primary outline-none"
                            >
                                <option value="paypal" className="bg-black">PayPal / Tarjetas Internacionales (USD)</option>
                                <option value="transferencia" className="bg-black">Transferencia Bancaria</option>
                                <option value="link_pago" className="bg-black">Solicitar Link de Pago (WhatsApp)</option>
                                <option value="efectivo" className="bg-black">Efectivo / Pago al Entregar</option>
                                <option value="tarjeta" className="bg-black">Tarjeta de Crédito / Débito</option>
                                <option value="otro" className="bg-black">Otro Método Personalizado</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                Orden de Visualización (# Posición)
                            </label>
                            <input
                                type="number"
                                min={1}
                                value={editingMethod.sort_order || 1}
                                onChange={(e) => setEditingMethod({ ...editingMethod, sort_order: parseInt(e.target.value) || 1 })}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:border-primary outline-none font-mono"
                            />
                            <p className="text-[9px] text-gray-500 mt-0.5">Define la posición en el checkout (#1 aparece primero).</p>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                Descripción / Instrucciones
                            </label>
                            <textarea
                                rows={3}
                                value={editingMethod.description}
                                onChange={(e) => setEditingMethod({ ...editingMethod, description: e.target.value })}
                                placeholder="Ej. Pago seguro en línea con tarjetas Visa/Mastercard."
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:border-primary outline-none resize-none"
                            />
                        </div>

                        {/* CASILLAS MARCADORAS DE ESTADO */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <label className="flex items-center gap-2 p-3 bg-black/40 border border-white/10 rounded-xl cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={editingMethod.is_coming_soon}
                                    onChange={(e) => setEditingMethod({ ...editingMethod, is_coming_soon: e.target.checked })}
                                    className="w-4 h-4 accent-yellow-500 rounded"
                                />
                                <div>
                                    <span className="text-xs font-black text-yellow-400 block uppercase">Próximamente</span>
                                    <span className="text-[9px] text-gray-400 block">Bloquea en checkout con badge</span>
                                </div>
                            </label>

                            <label className="flex items-center gap-2 p-3 bg-black/40 border border-white/10 rounded-xl cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={editingMethod.active}
                                    onChange={(e) => setEditingMethod({ ...editingMethod, active: e.target.checked })}
                                    className="w-4 h-4 accent-primary rounded"
                                />
                                <div>
                                    <span className="text-xs font-black text-white block uppercase">Activo</span>
                                    <span className="text-[9px] text-gray-400 block">Visible en la tienda</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* FOOTER FIJO ABAJO */}
                    <div className="flex justify-end gap-2 p-4 border-t border-white/10 shrink-0 bg-neutral-900">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-primary/30 flex items-center gap-1.5 cursor-pointer"
                        >
                            <Save className="w-4 h-4" /> Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
