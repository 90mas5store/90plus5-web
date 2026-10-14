import React from "react";
import { Radio, ChevronDown, CheckCircle2, AlertCircle, Loader2, Plus } from "lucide-react";
import { LeagueDefinition, ManualTestResult } from "./types";

interface TorneosManualFormProps {
    showManualForm: boolean;
    setShowManualForm: React.Dispatch<React.SetStateAction<boolean>>;
    manualSlug: string;
    setManualSlug: (s: string) => void;
    manualName: string;
    setManualName: (s: string) => void;
    manualCategory: LeagueDefinition["category"];
    setManualCategory: (c: LeagueDefinition["category"]) => void;
    manualCountry: string;
    setManualCountry: (c: string) => void;
    testingManualSlug: boolean;
    testResult: ManualTestResult | null;
    onTestManualSlug: () => void;
    onAddManualLeague: (e: React.FormEvent) => void;
}

export default function TorneosManualForm({
    showManualForm,
    setShowManualForm,
    manualSlug,
    setManualSlug,
    manualName,
    setManualName,
    manualCategory,
    setManualCategory,
    manualCountry,
    setManualCountry,
    testingManualSlug,
    testResult,
    onTestManualSlug,
    onAddManualLeague,
}: TorneosManualFormProps) {
    return (
        <div className="bg-neutral-900/40 border border-white/10 rounded-2xl p-4 sm:p-5">
            <button
                type="button"
                onClick={() => setShowManualForm(!showManualForm)}
                className="w-full flex items-center justify-between text-left cursor-pointer"
            >
                <div className="flex items-center gap-2.5">
                    <Radio className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-bold text-gray-300">
                        Modo Avanzado: Ingresar slug técnico de ESPN manualmente
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showManualForm ? "rotate-180" : ""}`} />
            </button>

            {showManualForm && (
                <form onSubmit={onAddManualLeague} className="mt-5 pt-5 border-t border-white/10 space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
                        <div className="sm:col-span-4">
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                                Slug ESPN <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={manualSlug}
                                onChange={(e) => setManualSlug(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                                placeholder="ej. arg.copa, col.1, chi.1"
                                required
                                className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-primary outline-none transition-all placeholder:text-gray-600"
                            />
                        </div>

                        <div className="sm:col-span-4">
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                                Nombre en Tienda <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={manualName}
                                onChange={(e) => setManualName(e.target.value)}
                                placeholder="ej. Copa Argentina"
                                required
                                className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-primary outline-none transition-all placeholder:text-gray-600"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                                Categoría
                            </label>
                            <select
                                value={manualCategory}
                                onChange={(e) => setManualCategory(e.target.value as LeagueDefinition["category"])}
                                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary outline-none transition-all"
                            >
                                <option value="Copas Nacionales">Copas Nacionales</option>
                                <option value="Ligas Principales">Ligas Principales</option>
                                <option value="Torneos Continentales">Torneos Continentales</option>
                                <option value="Selecciones & FIFA">Selecciones & FIFA</option>
                                <option value="Personalizados">Personalizados</option>
                            </select>
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                                País (Opcional)
                            </label>
                            <input
                                type="text"
                                value={manualCountry}
                                onChange={(e) => setManualCountry(e.target.value)}
                                placeholder="ej. Argentina"
                                className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-primary outline-none transition-all placeholder:text-gray-600"
                            />
                        </div>
                    </div>

                    {testResult && (
                        <div
                            className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                                testResult.valid
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                    : "bg-red-500/10 border-red-500/30 text-red-300"
                            }`}
                        >
                            {testResult.valid ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span>
                                        <strong>Verificado con ESPN:</strong> Reconocido como <strong>{testResult.name}</strong> ({testResult.eventsCount} eventos registrados para hoy).
                                    </span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                                    <span>{testResult.message || "El slug no devolvió una cartelera válida en ESPN."}</span>
                                </>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onTestManualSlug}
                            disabled={testingManualSlug || !manualSlug.trim()}
                            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer flex items-center gap-2"
                        >
                            {testingManualSlug ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Radio className="w-3.5 h-3.5 text-red-400" />
                            )}
                            <span>Probar con ESPN</span>
                        </button>

                        <button
                            type="submit"
                            className="px-5 py-2 rounded-xl bg-white hover:bg-gray-100 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Añadir</span>
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
