import React from "react";
import Image from "next/image";
import { Building2, X, Save, Upload } from "lucide-react";
import { BankAccountRecord, AVAILABLE_BANK_LOGOS } from "./types";

interface BankAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingBank: BankAccountRecord | null;
    setEditingBank: React.Dispatch<React.SetStateAction<BankAccountRecord | null>>;
    onSave: (e: React.FormEvent<HTMLFormElement>) => void;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function BankAccountModal({
    isOpen,
    onClose,
    editingBank,
    setEditingBank,
    onSave,
    onFileUpload,
}: BankAccountModalProps) {
    if (!isOpen || !editingBank) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                {/* HEADER FIJO */}
                <div className="flex items-center justify-between border-b border-white/10 p-5 shrink-0 bg-neutral-900">
                    <h3 className="font-black text-white text-base uppercase tracking-tight flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        {editingBank.id ? "Editar Cuenta Bancaria" : "Nueva Cuenta Bancaria"}
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
                                Nombre del Banco *
                            </label>
                            <input
                                type="text"
                                required
                                value={editingBank.banco}
                                onChange={(e) => setEditingBank({ ...editingBank, banco: e.target.value })}
                                placeholder="Ej. BAC Credomatic"
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:border-primary outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                Número de Cuenta *
                            </label>
                            <input
                                type="text"
                                required
                                value={editingBank.numero}
                                onChange={(e) => setEditingBank({ ...editingBank, numero: e.target.value })}
                                placeholder="Ej. 759045731"
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 font-mono text-xs sm:text-sm text-white focus:border-primary outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                Nombre del Titular *
                            </label>
                            <input
                                type="text"
                                required
                                value={editingBank.titular}
                                onChange={(e) => setEditingBank({ ...editingBank, titular: e.target.value })}
                                placeholder="Ej. Daniel Alejandro Urbizo"
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:border-primary outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                Tipo de Cuenta
                            </label>
                            <input
                                type="text"
                                value={editingBank.tipo}
                                onChange={(e) => setEditingBank({ ...editingBank, tipo: e.target.value })}
                                placeholder="Ej. Cuenta de Ahorros"
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:border-primary outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                Orden de Visualización (# Posición)
                            </label>
                            <input
                                type="number"
                                min={1}
                                value={editingBank.orden || 1}
                                onChange={(e) => setEditingBank({ ...editingBank, orden: parseInt(e.target.value) || 1 })}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:border-primary outline-none font-mono"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                Logo de la Cuenta Bancaria
                            </label>

                            {/* 📁 Botón Subir Archivo desde Dispositivo */}
                            <div className="mb-3 p-3 bg-white/5 border border-dashed border-white/20 rounded-xl flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden relative">
                                        {editingBank.logo ? (
                                            <Image src={editingBank.logo} alt="Preview" fill className="object-contain p-1" />
                                        ) : (
                                            <Building2 className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-white truncate">
                                            {editingBank.logo ? "Imagen Seleccionada" : "Subir archivo de imagen"}
                                        </p>
                                        <p className="text-[9px] text-gray-400">PNG, JPG, SVG o WEBP (Máx 5MB)</p>
                                    </div>
                                </div>

                                <label className="px-3 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shrink-0 transition-all">
                                    <Upload className="w-4 h-4" />
                                    Subir Archivo
                                    <input type="file" accept="image/*" className="hidden" onChange={onFileUpload} />
                                </label>
                            </div>

                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                                O elige un logo prediseñado:
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                                {AVAILABLE_BANK_LOGOS.map((item) => {
                                    const isSelected = (editingBank.logo || "") === item.value;
                                    return (
                                        <button
                                            key={item.value}
                                            type="button"
                                            onClick={() => setEditingBank({ ...editingBank, logo: item.value })}
                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center gap-1.5 cursor-pointer ${
                                                isSelected
                                                    ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(229,9,20,0.2)]"
                                                    : "border-white/10 bg-black/40 hover:border-white/20"
                                            }`}
                                        >
                                            <div className="relative w-8 h-8 rounded overflow-hidden flex items-center justify-center">
                                                <Image src={item.value} alt={item.label} fill className="object-contain" />
                                            </div>
                                            <span className={`text-[10px] font-bold truncate max-w-full ${isSelected ? "text-white" : "text-gray-400"}`}>
                                                {item.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <details className="group">
                                <summary className="text-[10px] font-bold text-gray-500 hover:text-gray-300 cursor-pointer uppercase tracking-wider select-none">
                                    + O ingresar URL manual
                                </summary>
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        value={editingBank.logo || ""}
                                        onChange={(e) => setEditingBank({ ...editingBank, logo: e.target.value })}
                                        placeholder="Ej. https://mi-dominio.com/logo-banco.png"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-primary outline-none font-mono"
                                    />
                                </div>
                            </details>
                        </div>

                        <label className="flex items-center gap-2 p-3 bg-black/40 border border-white/10 rounded-xl cursor-pointer">
                            <input
                                type="checkbox"
                                checked={editingBank.activo}
                                onChange={(e) => setEditingBank({ ...editingBank, activo: e.target.checked })}
                                className="w-4 h-4 accent-primary rounded"
                            />
                            <div>
                                <span className="text-xs font-black text-white block uppercase">Cuenta Activa</span>
                                <span className="text-[9px] text-gray-400 block">Se muestra para transferencias</span>
                            </div>
                        </label>
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
