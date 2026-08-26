"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { X, Ruler, Scale, Shirt, Sparkles, Check, Info, Table, AlertCircle, User, Baby } from "lucide-react";
import {
  AudienceGender,
  calculateRecommendedSize,
  convertKgToLb,
  convertLbToKg,
  detectAudienceGender,
  FitPreference,
  isPlayerCut,
  KIDS_MEASUREMENTS_TABLE,
  SIZE_MEASUREMENTS_TABLE,
  WeightUnit,
  WOMEN_MEASUREMENTS_TABLE,
} from "@/lib/utils/sizeRecommender";

interface SizeRecommenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName?: string | null;
  categoryName?: string | null;
  genderRaw?: string | null;
  brandName?: string | null;
  versionName?: string | null;
  availableSizes?: string[]; // ej: ['S', 'M', 'L', 'XL'] o ['16', '18', '20', '22', '24']
  onSelectSize: (sizeLabel: string) => void;
}

export default function SizeRecommenderModal({
  isOpen,
  onClose,
  productName,
  categoryName,
  genderRaw,
  brandName,
  versionName,
  availableSizes = [],
  onSelectSize,
}: SizeRecommenderModalProps) {
  const [activeTab, setActiveTab] = useState<"calculator" | "table">("calculator");
  const [audienceGender, setAudienceGender] = useState<AudienceGender>("man");
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [weightInput, setWeightInput] = useState<string>("75");
  const [fitPreference, setFitPreference] = useState<FitPreference>("normal");
  const [childAgeYears, setChildAgeYears] = useState<number>(8);

  // Autodetectar género exclusivamente al abrir el modal
  useEffect(() => {
    if (isOpen) {
      const detected = detectAudienceGender(productName, categoryName, availableSizes, genderRaw);
      setAudienceGender(detected);
      if (detected === "woman") {
        setHeightCm(163);
        setWeightInput("58");
      } else if (detected === "kid") {
        setHeightCm(135);
        setChildAgeYears(8);
      } else {
        setHeightCm(175);
        setWeightInput("75");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleAudienceChange = (newAudience: AudienceGender) => {
    setAudienceGender(newAudience);
    if (newAudience === "woman") {
      setHeightCm(163);
      if (!weightInput || Number(weightInput) > 120 || Number(weightInput) < 35) {
        setWeightInput("58");
      }
    } else if (newAudience === "kid") {
      setHeightCm(135);
      setChildAgeYears(8);
    } else {
      setHeightCm(175);
      if (!weightInput || Number(weightInput) < 40) {
        setWeightInput("75");
      }
    }
  };

  const isPlayer = useMemo(() => isPlayerCut(versionName), [versionName]);

  // Validación numérica del peso ingresado
  const numericWeight = useMemo(() => {
    const val = Number(weightInput);
    return isNaN(val) ? 0 : val;
  }, [weightInput]);

  const isWeightValid = useMemo(() => {
    if (audienceGender === "kid") return true; // En niños usamos Edad + Estatura
    if (!weightInput.trim()) return false;
    const maxVal = weightUnit === "kg" ? 250 : 550;
    const minVal = weightUnit === "kg" ? 20 : 44;
    return numericWeight >= minVal && numericWeight <= maxVal;
  }, [audienceGender, weightInput, numericWeight, weightUnit]);

  // Manejador del cambio de unidades kg / lb
  const handleUnitToggle = (newUnit: WeightUnit) => {
    if (newUnit === weightUnit) return;
    if (numericWeight > 0) {
      if (newUnit === "lb") {
        setWeightInput(String(convertKgToLb(numericWeight)));
      } else {
        setWeightInput(String(convertLbToKg(numericWeight)));
      }
    }
    setWeightUnit(newUnit);
  };

  // Cálculo en tiempo real de la talla recomendada
  const recommendation = useMemo(() => {
    return calculateRecommendedSize({
      heightCm,
      weightValue: isWeightValid ? numericWeight : 75,
      weightUnit,
      fitPreference,
      audienceGender,
      childAgeYears,
      brandName,
      versionName,
    });
  }, [heightCm, numericWeight, isWeightValid, weightUnit, fitPreference, audienceGender, childAgeYears, brandName, versionName]);

  // Verificar si la talla recomendada existe en el stock actual del producto
  const isSizeAvailable = useMemo(() => {
    if (!availableSizes.length) return true;
    return availableSizes.some(
      (s) => s.toLowerCase().trim() === recommendation.recommendedSize.toLowerCase().trim()
    );
  }, [availableSizes, recommendation.recommendedSize]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-lg md:max-w-4xl overflow-hidden rounded-3xl bg-neutral-900 border border-white/10 text-white shadow-2xl flex flex-col max-h-[92vh]"
        >
          {/* HEADER */}
          <div className="flex items-center justify-between p-4 md:p-5 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#E50914]/20 border border-[#E50914]/40 flex items-center justify-center text-[#E50914]">
                <Ruler className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-black text-white tracking-wide">
                  Asistente de Talla Ideal
                </h3>
                <p className="text-xs text-gray-400 font-medium">
                  {brandName || "Camisetas"} {versionName ? `· ${versionName}` : ""}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* TABS SELECTOR */}
          <div className="flex border-b border-white/10 bg-black/40 px-4 md:px-6 pt-3 justify-between items-center">
            <div className="flex">
              <button
                onClick={() => setActiveTab("calculator")}
                className={`flex items-center gap-2 pb-3 px-3 md:px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === "calculator"
                    ? "border-[#E50914] text-[#E50914]"
                    : "border-transparent text-gray-400 hover:text-gray-200"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Calculador</span>
              </button>
              <button
                onClick={() => setActiveTab("table")}
                className={`flex items-center gap-2 pb-3 px-3 md:px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === "table"
                    ? "border-[#E50914] text-[#E50914]"
                    : "border-transparent text-gray-400 hover:text-gray-200"
                }`}
              >
                <Table className="w-4 h-4" />
                <span>Tabla de Medidas</span>
              </button>
            </div>

            {/* SELECTOR DE AUDIENCIA / GÉNERO */}
            <div className="hidden sm:flex rounded-xl bg-neutral-800 p-1 border border-white/10 text-xs font-bold mb-2">
              <button
                type="button"
                onClick={() => handleAudienceChange("man")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  audienceGender === "man" ? "bg-[#E50914] text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <User className="w-3.5 h-3.5" /> Hombre
              </button>
              <button
                type="button"
                onClick={() => handleAudienceChange("woman")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  audienceGender === "woman" ? "bg-[#E50914] text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <User className="w-3.5 h-3.5" /> Mujer
              </button>
              <button
                type="button"
                onClick={() => handleAudienceChange("kid")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  audienceGender === "kid" ? "bg-[#E50914] text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <Baby className="w-3.5 h-3.5" /> Niños
              </button>
            </div>
          </div>

          {/* CONTENT AREA */}
          <div className="p-4 md:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            {/* SELECTOR DE GÉNERO PARA MOBILE */}
            <div className="flex sm:hidden rounded-xl bg-neutral-800 p-1 border border-white/10 text-xs font-bold mb-4 justify-between">
              <button
                type="button"
                onClick={() => handleAudienceChange("man")}
                className={`flex-1 py-1.5 rounded-lg transition-colors text-center cursor-pointer ${
                  audienceGender === "man" ? "bg-[#E50914] text-white" : "text-gray-400"
                }`}
              >
                Hombre
              </button>
              <button
                type="button"
                onClick={() => handleAudienceChange("woman")}
                className={`flex-1 py-1.5 rounded-lg transition-colors text-center cursor-pointer ${
                  audienceGender === "woman" ? "bg-[#E50914] text-white" : "text-gray-400"
                }`}
              >
                Mujer
              </button>
              <button
                type="button"
                onClick={() => handleAudienceChange("kid")}
                className={`flex-1 py-1.5 rounded-lg transition-colors text-center cursor-pointer ${
                  audienceGender === "kid" ? "bg-[#E50914] text-white" : "text-gray-400"
                }`}
              >
                Niños
              </button>
            </div>

            {activeTab === "calculator" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 items-stretch">
                {/* COLUMNA IZQUIERDA: CONTROLES / INPUTS */}
                <div className="space-y-4 flex flex-col justify-between">
                  {/* AVISO DE CORTE JUGADOR O MODALIDAD NIÑOS */}
                  {audienceGender === "kid" ? (
                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-200 text-xs">
                      <Baby className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
                      <span>
                        <strong>Calculador Infantil:</strong> Selecciona la edad del niño/a y su estatura para calcular la talla numérica (16 al 28).
                      </span>
                    </div>
                  ) : isPlayer ? (
                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                      <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                      <span>
                        <strong>Atención:</strong> Esta prenda es versión <strong>Jugador (Slim Fit)</strong>. El calculador ajustará la recomendación para mayor comodidad.
                      </span>
                    </div>
                  ) : null}

                  {/* CONTROLES PARA NIÑOS VS ADULTOS */}
                  {audienceGender === "kid" ? (
                    <>
                      {/* EDAD DEL NIÑO (AÑOS) */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                            <Baby className="w-3.5 h-3.5 text-[#E50914]" /> Edad del niño/a (años)
                          </label>
                          <span className="text-sm font-black text-[#E50914] bg-[#E50914]/10 px-2.5 py-0.5 rounded-full border border-[#E50914]/30">
                            {childAgeYears} años
                          </span>
                        </div>
                        <input
                          type="range"
                          min={2}
                          max={14}
                          step={1}
                          value={childAgeYears}
                          onChange={(e) => setChildAgeYears(Number(e.target.value))}
                          className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#E50914]"
                        />
                        <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-medium">
                          <span>2 años</span>
                          <span>8 años</span>
                          <span>14 años</span>
                        </div>
                      </div>

                      {/* ESTATURA DEL NIÑO (CM) */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                            <Ruler className="w-3.5 h-3.5 text-[#E50914]" /> Estatura (cm)
                          </label>
                          <span className="text-sm font-black text-[#E50914] bg-[#E50914]/10 px-2.5 py-0.5 rounded-full border border-[#E50914]/30">
                            {heightCm} cm
                          </span>
                        </div>
                        <input
                          type="range"
                          min={90}
                          max={165}
                          step={1}
                          value={heightCm}
                          onChange={(e) => setHeightCm(Number(e.target.value))}
                          className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#E50914]"
                        />
                        <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-medium">
                          <span>90 cm</span>
                          <span>130 cm</span>
                          <span>165 cm</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* ESTATURA ADULTOS (CM) */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                            <Ruler className="w-3.5 h-3.5 text-[#E50914]" /> Estatura (cm)
                          </label>
                          <span className="text-sm font-black text-[#E50914] bg-[#E50914]/10 px-2.5 py-0.5 rounded-full border border-[#E50914]/30">
                            {heightCm} cm
                          </span>
                        </div>
                        <input
                          type="range"
                          min={140}
                          max={210}
                          step={1}
                          value={heightCm}
                          onChange={(e) => setHeightCm(Number(e.target.value))}
                          className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#E50914]"
                        />
                        <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-medium">
                          <span>140 cm</span>
                          <span>175 cm</span>
                          <span>210 cm</span>
                        </div>
                      </div>

                      {/* PESO CORPORAL (KG / LB) */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5 text-[#E50914]" /> Peso corporal
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="flex rounded-lg bg-neutral-800 p-0.5 border border-white/10 text-xs font-semibold">
                              <button
                                type="button"
                                onClick={() => handleUnitToggle("kg")}
                                className={`px-2.5 py-0.5 rounded-md transition-colors ${
                                  weightUnit === "kg" ? "bg-[#E50914] text-white" : "text-gray-400 hover:text-white"
                                }`}
                              >
                                kg
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUnitToggle("lb")}
                                className={`px-2.5 py-0.5 rounded-md transition-colors ${
                                  weightUnit === "lb" ? "bg-[#E50914] text-white" : "text-gray-400 hover:text-white"
                                }`}
                              >
                                lb
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="relative">
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              placeholder="Ingresa tu peso"
                              value={weightInput}
                              onChange={(e) => setWeightInput(e.target.value)}
                              className={`w-full px-4 py-2.5 rounded-xl text-white font-bold text-sm focus:outline-none transition-all ${
                                !isWeightValid
                                  ? "bg-red-500/10 border-2 border-red-500 text-red-200 focus:border-red-400 placeholder:text-red-300/50"
                                  : "bg-neutral-800 border border-white/10 focus:border-[#E50914]"
                              }`}
                            />
                            <span className="text-sm font-bold text-gray-400 shrink-0 uppercase">
                              {weightUnit}
                            </span>
                          </div>
                          {!isWeightValid && (
                            <p className="flex items-center gap-1 text-[11px] font-bold text-red-400 mt-1.5">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>Ingresa un peso válido para calcular tu talla</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* PREFERENCIA DE AJUSTE */}
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-2 flex items-center gap-1.5">
                          <Shirt className="w-3.5 h-3.5 text-[#E50914]" /> Preferencia de ajuste
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setFitPreference("tight")}
                            className={`p-2.5 md:p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                              fitPreference === "tight"
                                ? "bg-[#E50914]/15 border-[#E50914] text-white shadow-[0_0_15px_rgba(229,9,20,0.2)]"
                                : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <div className="text-xs font-bold">Entallado</div>
                            <div className="text-[10px] opacity-70 mt-0.5">Pegado</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFitPreference("normal")}
                            className={`p-2.5 md:p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                              fitPreference === "normal"
                                ? "bg-[#E50914]/15 border-[#E50914] text-white shadow-[0_0_15px_rgba(229,9,20,0.2)]"
                                : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <div className="text-xs font-bold">Normal</div>
                            <div className="text-[10px] opacity-70 mt-0.5">Estándar</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFitPreference("loose")}
                            className={`p-2.5 md:p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                              fitPreference === "loose"
                                ? "bg-[#E50914]/15 border-[#E50914] text-white shadow-[0_0_15px_rgba(229,9,20,0.2)]"
                                : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <div className="text-xs font-bold">Holgado</div>
                            <div className="text-[10px] opacity-70 mt-0.5">Suelto</div>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* COLUMNA DERECHA: RESULTADO & BOTÓN DE ACCIÓN */}
                <div className="flex flex-col justify-between space-y-4 p-5 rounded-3xl bg-gradient-to-br from-neutral-900 to-black border border-[#E50914]/30 shadow-xl relative overflow-hidden">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#E50914]">
                          Talla Recomendada {audienceGender === "kid" ? "(Infantil)" : audienceGender === "woman" ? "(Mujer)" : "(Hombre)"}
                        </span>
                        <div className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-baseline gap-2 mt-0.5">
                          Talla {isWeightValid ? recommendation.recommendedSize : "--"}
                        </div>
                      </div>
                      <div className="w-14 h-14 rounded-2xl bg-[#E50914] text-white flex items-center justify-center font-black text-2xl shadow-[0_0_25px_rgba(229,9,20,0.6)] shrink-0">
                        {isWeightValid ? recommendation.recommendedSize : "?"}
                      </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-[#E50914]/40 to-transparent" />

                    <p className="text-xs md:text-sm text-gray-300 leading-relaxed font-normal">
                      {isWeightValid
                        ? recommendation.explanation.replace(/\*\*/g, "")
                        : "Por favor ingresa tu peso en la casilla para generar la recomendación personalizada."}
                    </p>
                  </div>

                  {/* BOTÓN APLICAR EN 1-CLIC */}
                  <button
                    type="button"
                    disabled={!isWeightValid || !isSizeAvailable}
                    onClick={() => {
                      if (isWeightValid && isSizeAvailable) {
                        onSelectSize(recommendation.recommendedSize);
                        onClose();
                      }
                    }}
                    className={`w-full py-4 px-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                      isWeightValid && isSizeAvailable
                        ? "bg-[#E50914] text-white hover:bg-red-700 shadow-[0_0_20px_rgba(229,9,20,0.5)] cursor-pointer"
                        : "bg-neutral-800 text-gray-500 cursor-not-allowed border border-white/5"
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    {!isWeightValid
                      ? "Ingresa un peso válido"
                      : isSizeAvailable
                      ? `Seleccionar Talla ${recommendation.recommendedSize}`
                      : `Talla ${recommendation.recommendedSize} fuera de stock`}
                  </button>
                </div>
              </div>
            ) : (
              /* TABLA DE MEDIDAS (CM) SEGÚN AUDIENCIA */
              <div className="space-y-4">
                <p className="text-xs text-gray-300 leading-relaxed">
                  {audienceGender === "kid"
                    ? "Tabla de tallas numéricas de niños con edad aproximada y dimensiones en centímetros:"
                    : audienceGender === "woman"
                    ? "Tabla de medidas en centímetros para camisetas de mujer (corte entallado):"
                    : "Medidas aproximadas en centímetros para camisetas de hombre / unisex:"}
                </p>

                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/50">
                  {audienceGender === "kid" ? (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 text-gray-400 font-bold uppercase tracking-wider text-[10px] border-b border-white/10">
                        <tr>
                          <th className="p-3">Talla Numérica</th>
                          <th className="p-3">Edad Aprox.</th>
                          <th className="p-3">Estatura</th>
                          <th className="p-3">Pecho × Largo (cm)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-medium">
                        {KIDS_MEASUREMENTS_TABLE.map((row) => {
                          const isRecommended = isWeightValid && row.size === recommendation.recommendedSize;
                          return (
                            <tr
                              key={row.size}
                              className={`transition-colors ${
                                isRecommended ? "bg-[#E50914]/15 text-white font-bold" : "hover:bg-white/5 text-gray-300"
                              }`}
                            >
                              <td className="p-3 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center font-bold">
                                  {row.size}
                                </span>
                                {isRecommended && (
                                  <span className="text-[10px] text-[#E50914] font-black uppercase tracking-wider">
                                    (Recomendada)
                                  </span>
                                )}
                              </td>
                              <td className="p-3">{row.approxAge}</td>
                              <td className="p-3">{row.heightRange}</td>
                              <td className="p-3">{row.pecho} cm × {row.largo} cm</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 text-gray-400 font-bold uppercase tracking-wider text-[10px] border-b border-white/10">
                        <tr>
                          <th className="p-3">Talla</th>
                          <th className="p-3">Versión Fan (Pecho × Largo)</th>
                          <th className="p-3">Versión Jugador (Pecho × Largo)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-medium">
                        {(audienceGender === "woman" ? WOMEN_MEASUREMENTS_TABLE : SIZE_MEASUREMENTS_TABLE).map((row) => {
                          const isRecommended = isWeightValid && row.size === recommendation.recommendedSize;
                          return (
                            <tr
                              key={row.size}
                              className={`transition-colors ${
                                isRecommended ? "bg-[#E50914]/15 text-white font-bold" : "hover:bg-white/5 text-gray-300"
                              }`}
                            >
                              <td className="p-3 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center font-bold">
                                  {row.size}
                                </span>
                                {isRecommended && (
                                  <span className="text-[10px] text-[#E50914] font-black uppercase tracking-wider">
                                    (Recomendada)
                                  </span>
                                )}
                              </td>
                              <td className="p-3">{row.fanPecho} cm × {row.fanLargo} cm</td>
                              <td className="p-3">{row.playerPecho} cm × {row.playerLargo} cm</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-gray-400 text-xs space-y-1">
                  <div>• <strong>Pecho:</strong> Ancho medido de axila a axila.</div>
                  <div>• <strong>Largo:</strong> Altura desde el hombro hasta el borde inferior.</div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
