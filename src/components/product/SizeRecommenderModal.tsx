"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "@/lib/motion";
import { X, Ruler, Scale, Shirt, Check, Info, Table, AlertCircle, User, Baby } from "lucide-react";
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
  availableSizes?: string[];
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
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"calculator" | "table">("calculator");
  const [audienceGender, setAudienceGender] = useState<AudienceGender>("man");
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [weightInput, setWeightInput] = useState<string>("75");
  const [fitPreference, setFitPreference] = useState<FitPreference>("normal");
  const [childAgeYears, setChildAgeYears] = useState<number>(8);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Bloqueo de scroll cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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
    if (audienceGender === "kid") return true;
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

  // Cálculo en tiempo real de la recomendación de talla
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

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
        {/* Backdrop dismiss */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ type: "spring", damping: 30, stiffness: 350 }}
          className="relative w-full max-w-2xl lg:max-w-3xl overflow-hidden rounded-[2rem] bg-[#0c0d12]/98 backdrop-blur-2xl border border-white/15 text-white shadow-[0_25px_80px_rgba(0,0,0,0.9)] flex flex-col max-h-[92vh] z-10"
        >
          {/* Specular Top Highlight (§12 Apple Design) */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none z-30" />

          {/* HEADER */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.03]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-sm">
                <Ruler className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-tight">
                  Calculá tu talla ideal
                </h3>
                <p className="text-xs text-white/50 font-medium">
                  {brandName || "Camisetas"} {versionName ? `· Versión ${versionName}` : ""}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.15] border border-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-sm"
              aria-label="Cerrar asistente"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* TABS Y SELECTOR DE GÉNERO */}
          <div className="flex flex-col sm:flex-row border-b border-white/10 bg-black/40 px-5 py-2.5 justify-between items-stretch sm:items-center gap-2.5">
            {/* Tabs Mode */}
            <div className="flex gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab("calculator")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  activeTab === "calculator"
                    ? "bg-primary text-white shadow-sm"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Calculador</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("table")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  activeTab === "table"
                    ? "bg-primary text-white shadow-sm"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Tabla de Medidas</span>
              </button>
            </div>

            {/* Audience Segmented Pill */}
            <div className="flex rounded-xl bg-black/60 p-1 border border-white/10 text-xs font-bold">
              <button
                type="button"
                onClick={() => handleAudienceChange("man")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1 rounded-lg transition-all cursor-pointer active:scale-95 ${
                  audienceGender === "man" ? "bg-white text-black font-black shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                <User className="w-3.5 h-3.5" /> Hombre
              </button>
              <button
                type="button"
                onClick={() => handleAudienceChange("woman")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1 rounded-lg transition-all cursor-pointer active:scale-95 ${
                  audienceGender === "woman" ? "bg-white text-black font-black shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                <User className="w-3.5 h-3.5" /> Mujer
              </button>
              <button
                type="button"
                onClick={() => handleAudienceChange("kid")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1 rounded-lg transition-all cursor-pointer active:scale-95 ${
                  audienceGender === "kid" ? "bg-white text-black font-black shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                <Baby className="w-3.5 h-3.5" /> Niños
              </button>
            </div>
          </div>

          {/* CONTENIDO SCROLLEABLE */}
          <div className="p-4 sm:p-5 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 space-y-4">
            {activeTab === "calculator" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch">
                {/* COLUMNA IZQUIERDA: CONTROLES */}
                <div className="space-y-4">
                  {/* AVISOS DE VERSIÓN O MODALIDAD */}
                  {audienceGender === "kid" ? (
                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-blue-500/10 border border-blue-500/25 text-blue-200 text-xs">
                      <Baby className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
                      <span>
                        <strong>Calculador Infantil:</strong> Seleccioná la edad del niño o niña y su estatura para calcular la talla adecuada (16 al 28).
                      </span>
                    </div>
                  ) : isPlayer ? (
                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs">
                      <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                      <span>
                        <strong>Ojo con el corte:</strong> Esta camiseta es versión <strong>Jugador (Slim Fit)</strong>. Viene más pegada al cuerpo; calculamos la talla para que te quede cómoda.
                      </span>
                    </div>
                  ) : null}

                  {/* CONTROLES PARA NIÑOS VS ADULTOS */}
                  {audienceGender === "kid" ? (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                            <Baby className="w-3.5 h-3.5 text-primary" /> Edad del niño/a
                          </label>
                          <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/25">
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
                          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between text-[10px] text-white/40 mt-1 font-mono">
                          <span>2 años</span>
                          <span>8 años</span>
                          <span>14 años</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                            <Ruler className="w-3.5 h-3.5 text-primary" /> Estatura (cm)
                          </label>
                          <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/25">
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
                          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between text-[10px] text-white/40 mt-1 font-mono">
                          <span>90 cm</span>
                          <span>130 cm</span>
                          <span>165 cm</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* ESTATURA ADULTOS */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                            <Ruler className="w-3.5 h-3.5 text-primary" /> Tu estatura
                          </label>
                          <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/25">
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
                          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between text-[10px] text-white/40 mt-1 font-mono">
                          <span>140 cm</span>
                          <span>175 cm</span>
                          <span>210 cm</span>
                        </div>
                      </div>

                      {/* PESO CORPORAL */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5 text-primary" /> Tu peso
                          </label>
                          <div className="flex rounded-lg bg-white/[0.06] p-0.5 border border-white/10 text-xs font-bold">
                            <button
                              type="button"
                              onClick={() => handleUnitToggle("kg")}
                              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                                weightUnit === "kg" ? "bg-primary text-white" : "text-white/50 hover:text-white"
                              }`}
                            >
                              kg
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUnitToggle("lb")}
                              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                                weightUnit === "lb" ? "bg-primary text-white" : "text-white/50 hover:text-white"
                              }`}
                            >
                              lb
                            </button>
                          </div>
                        </div>

                        <div className="relative">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              placeholder="Ingresá tu peso"
                              value={weightInput}
                              onChange={(e) => setWeightInput(e.target.value)}
                              className={`w-full px-3.5 py-2 rounded-xl text-white font-mono font-bold text-sm outline-none transition-all ${
                                !isWeightValid
                                  ? "bg-red-500/10 border border-red-500/60 text-red-200 placeholder:text-red-300/40"
                                  : "bg-white/[0.04] border border-white/15 focus:border-primary/80 focus:ring-1 focus:ring-primary/40"
                              }`}
                            />
                            <span className="text-xs font-mono font-bold text-white/50 uppercase px-2 py-2 rounded-xl bg-white/[0.04] border border-white/10 shrink-0">
                              {weightUnit}
                            </span>
                          </div>
                          {!isWeightValid && (
                            <p className="flex items-center gap-1 text-[11px] font-bold text-red-400 mt-1">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>Ingresá un peso válido</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* PREFERENCIA DE AJUSTE */}
                      <div>
                        <label className="block text-xs font-bold text-white/80 mb-1.5 flex items-center gap-1.5">
                          <Shirt className="w-3.5 h-3.5 text-primary" /> ¿Cómo te gusta usarla?
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setFitPreference("tight")}
                            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer active:scale-95 ${
                              fitPreference === "tight"
                                ? "bg-primary/20 border-primary text-white shadow-sm ring-1 ring-primary/40"
                                : "bg-white/[0.03] border-white/10 text-white/60 hover:bg-white/[0.06] hover:text-white"
                            }`}
                          >
                            <div className="text-xs font-bold leading-tight">Al cuerpo</div>
                            <div className="text-[10px] text-white/40 mt-0.5">Ceñido</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFitPreference("normal")}
                            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer active:scale-95 ${
                              fitPreference === "normal"
                                ? "bg-primary/20 border-primary text-white shadow-sm ring-1 ring-primary/40"
                                : "bg-white/[0.03] border-white/10 text-white/60 hover:bg-white/[0.06] hover:text-white"
                            }`}
                          >
                            <div className="text-xs font-bold leading-tight">Normal</div>
                            <div className="text-[10px] text-white/40 mt-0.5">Estándar</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFitPreference("loose")}
                            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer active:scale-95 ${
                              fitPreference === "loose"
                                ? "bg-primary/20 border-primary text-white shadow-sm ring-1 ring-primary/40"
                                : "bg-white/[0.03] border-white/10 text-white/60 hover:bg-white/[0.06] hover:text-white"
                            }`}
                          >
                            <div className="text-xs font-bold leading-tight">Holgado</div>
                            <div className="text-[10px] text-white/40 mt-0.5">Suelto</div>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* COLUMNA DERECHA: RESULTADO & APLICAR */}
                <div className="flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/15 relative overflow-hidden space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary">
                          Talla recomendada
                        </span>
                        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-baseline gap-2 mt-0.5">
                          Talla {isWeightValid ? recommendation.recommendedSize : "--"}
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-black text-xl shadow-[0_4px_20px_rgba(229,9,20,0.4)] shrink-0 border border-white/20">
                        {isWeightValid ? recommendation.recommendedSize : "?"}
                      </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-primary/50 to-transparent" />

                    <p className="text-xs text-white/80 leading-relaxed font-normal">
                      {isWeightValid
                        ? recommendation.explanation.replace(/\*\*/g, "")
                        : "Ingresá tu peso para que el calculador te tire la recomendación exacta."}
                    </p>
                  </div>

                  {/* BOTÓN APLICAR */}
                  <button
                    type="button"
                    disabled={!isWeightValid || !isSizeAvailable}
                    onClick={() => {
                      if (isWeightValid && isSizeAvailable) {
                        onSelectSize(recommendation.recommendedSize);
                        onClose();
                      }
                    }}
                    className={`w-full py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 ${
                      isWeightValid && isSizeAvailable
                        ? "bg-primary text-white hover:brightness-110 shadow-[0_8px_25px_rgba(229,9,20,0.35)] cursor-pointer"
                        : "bg-white/[0.05] text-white/30 cursor-not-allowed border border-white/5"
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    {!isWeightValid
                      ? "Ingresá tu peso"
                      : isSizeAvailable
                      ? `Elegir talla ${recommendation.recommendedSize}`
                      : `Talla ${recommendation.recommendedSize} agotada`}
                  </button>
                </div>
              </div>
            ) : (
              /* TABLA DE MEDIDAS */
              <div className="space-y-3">
                <p className="text-xs text-white/70">
                  {audienceGender === "kid"
                    ? "Tallas numéricas para niños con edad aproximada y medidas en centímetros:"
                    : audienceGender === "woman"
                    ? "Medidas en centímetros para camisetas de mujer (corte entallado):"
                    : "Medidas aproximadas en centímetros para camisetas de hombre / unisex:"}
                </p>

                <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40">
                  {audienceGender === "kid" ? (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 text-white/60 font-bold uppercase tracking-wider text-[10px] border-b border-white/10">
                        <tr>
                          <th className="p-2.5">Talla</th>
                          <th className="p-2.5">Edad</th>
                          <th className="p-2.5">Estatura</th>
                          <th className="p-2.5">Pecho × Largo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        {KIDS_MEASUREMENTS_TABLE.map((row) => {
                          const isRecommended = isWeightValid && row.size === recommendation.recommendedSize;
                          return (
                            <tr
                              key={row.size}
                              className={`transition-colors ${
                                isRecommended ? "bg-primary/20 text-white font-bold" : "hover:bg-white/5 text-white/80"
                              }`}
                            >
                              <td className="p-2.5 flex items-center gap-1.5 font-sans font-bold">
                                <span className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-xs">
                                  {row.size}
                                </span>
                                {isRecommended && (
                                  <span className="text-[9px] text-primary font-black uppercase tracking-wider">
                                    (Tu talla)
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 font-sans">{row.approxAge}</td>
                              <td className="p-2.5">{row.heightRange}</td>
                              <td className="p-2.5">{row.pecho} × {row.largo} cm</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 text-white/60 font-bold uppercase tracking-wider text-[10px] border-b border-white/10">
                        <tr>
                          <th className="p-2.5">Talla</th>
                          <th className="p-2.5">Versión Fan (Pecho × Largo)</th>
                          <th className="p-2.5">Versión Jugador (Pecho × Largo)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        {(audienceGender === "woman" ? WOMEN_MEASUREMENTS_TABLE : SIZE_MEASUREMENTS_TABLE).map((row) => {
                          const isRecommended = isWeightValid && row.size === recommendation.recommendedSize;
                          return (
                            <tr
                              key={row.size}
                              className={`transition-colors ${
                                isRecommended ? "bg-primary/20 text-white font-bold" : "hover:bg-white/5 text-white/80"
                              }`}
                            >
                              <td className="p-2.5 flex items-center gap-1.5 font-sans font-bold">
                                <span className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-xs">
                                  {row.size}
                                </span>
                                {isRecommended && (
                                  <span className="text-[9px] text-primary font-black uppercase tracking-wider">
                                    (Tu talla)
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5">{row.fanPecho} × {row.fanLargo} cm</td>
                              <td className="p-2.5">{row.playerPecho} × {row.playerLargo} cm</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white/50 text-[11px] space-y-0.5">
                  <div>• <strong>Pecho:</strong> Medida de axila a axila en plano.</div>
                  <div>• <strong>Largo:</strong> Desde el hombro hasta el dobladillo inferior.</div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
