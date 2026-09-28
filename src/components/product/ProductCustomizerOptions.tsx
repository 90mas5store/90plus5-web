'use client';

import { motion, AnimatePresence } from '@/lib/motion';
import { CheckCircle2, Ruler, Sparkles, Gem, Shield } from 'lucide-react';
import SizeRecommenderModal from '@/components/product/SizeRecommenderModal';
import useToastMessage from '@/hooks/useToastMessage';
import {
    CustomizerProduct,
    ProductOptionsState,
    SelectedOption,
} from '@/types/productCustomizer';

interface ProductCustomizerOptionsProps {
    producto: CustomizerProduct;
    productRaw: CustomizerProduct;
    opciones: ProductOptionsState;
    versionSeleccionada: SelectedOption | null;
    setVersionSeleccionada: (v: SelectedOption) => void;
    setPrecioActual: (p: number) => void;
    setPrecioOriginalActual: (val: { price: number; active: boolean } | null) => void;
    tallaSeleccionada: SelectedOption | null;
    setTallaSeleccionada: (t: SelectedOption | null) => void;
    showSizeRecommender: boolean;
    setShowSizeRecommender: (val: boolean) => void;
    parcheSeleccionado: SelectedOption | null;
    setParcheSeleccionado: (p: SelectedOption | null) => void;
    quiereDorsal: boolean;
    setQuiereDorsal: (val: boolean) => void;
    modoDorsal: string;
    setModoDorsal: (val: string) => void;
    jugadorSeleccionado: { id: string; numero: string; nombre: string } | null;
    setJugadorSeleccionado: (j: { id: string; numero: string; nombre: string } | null) => void;
    numeroPersonalizado: string;
    setNumeroPersonalizado: (val: string) => void;
    nombrePersonalizado: string;
    setNombrePersonalizado: (val: string) => void;
}

export default function ProductCustomizerOptions({
    producto,
    productRaw,
    opciones,
    versionSeleccionada,
    setVersionSeleccionada,
    setPrecioActual,
    setPrecioOriginalActual,
    tallaSeleccionada,
    setTallaSeleccionada,
    showSizeRecommender,
    setShowSizeRecommender,
    parcheSeleccionado,
    setParcheSeleccionado,
    quiereDorsal,
    setQuiereDorsal,
    modoDorsal,
    setModoDorsal,
    jugadorSeleccionado,
    setJugadorSeleccionado,
    numeroPersonalizado,
    setNumeroPersonalizado,
    nombrePersonalizado,
    setNombrePersonalizado,
}: ProductCustomizerOptionsProps) {
    const toast = useToastMessage();

    const handleNumeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '');
        if (parseInt(val, 10) <= 99 || val === '') setNumeroPersonalizado(val);
    };

    const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toUpperCase().slice(0, 12);
        setNombrePersonalizado(val);
    };

    const hasPlayers =
        (opciones?.dorsales?.filter((d) => d.jugador !== 'Personalizado')?.length || 0) > 0;

    const getVersionBadge = (label: string) => {
        const lower = label.toLowerCase();
        if (lower.includes('player') || lower.includes('jugador')) {
            return {
                icon: <Gem className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
                tag: 'Versión Jugador · Corte atlético al cuerpo',
                color: 'text-amber-400',
            };
        }
        if (lower.includes('fan') || lower.includes('aficionado')) {
            return {
                icon: <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />,
                tag: 'Versión Aficionado · Corte cómodo bordado',
                color: 'text-blue-400',
            };
        }
        return {
            icon: <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />,
            tag: 'Edición oficial',
            color: 'text-gray-400',
        };
    };

    return (
        <div className="space-y-5">
            {/* Opciones de Versión */}
            {opciones?.versiones &&
                opciones.versiones.length > 0 &&
                !(opciones.versiones.length === 1 && opciones.versiones[0].label === 'Estandar') && (
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                                1. Elegí tu versión
                            </span>
                            {versionSeleccionada && (
                                <span className="text-xs text-primary font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Lista
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {opciones.versiones.map((v) => {
                                const badgeInfo = getVersionBadge(v.label);
                                const isSelected = versionSeleccionada?.id === v.id;
                                return (
                                    <button
                                        key={v.id}
                                        onClick={() => {
                                            setVersionSeleccionada(v);
                                            setPrecioActual(
                                                opciones.preciosPorVersion?.[v.label] ?? producto.precio ?? 0
                                            );
                                            setPrecioOriginalActual(
                                                opciones.originalesPorVersion?.[v.label] ?? null
                                            );
                                        }}
                                        className={`p-4 rounded-2xl border transition-all duration-200 text-left relative overflow-hidden group cursor-pointer active:scale-[0.98] ${
                                            isSelected
                                                ? 'border-primary/80 bg-white/[0.08] backdrop-blur-xl shadow-[0_8px_30px_rgba(229,9,20,0.25)] ring-1 ring-primary/40'
                                                : 'border-white/[0.08] bg-white/[0.03] backdrop-blur-md hover:border-white/20 hover:bg-white/[0.06]'
                                        }`}
                                    >
                                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

                                        <div className="flex items-center justify-between">
                                            <span
                                                className={`block font-black text-base tracking-tight ${
                                                    isSelected ? 'text-white' : 'text-gray-300'
                                                }`}
                                            >
                                                {v.label}
                                            </span>
                                            <span className="text-xs font-mono font-bold text-white tabular-nums bg-white/[0.08] px-2 py-0.5 rounded-full border border-white/10">
                                                L{' '}
                                                {opciones.preciosPorVersion?.[v.label]?.toLocaleString('es-HN', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 mt-2 text-[10px] font-medium">
                                            {badgeInfo.icon}
                                            <span className={isSelected ? 'text-white font-semibold' : 'text-gray-400'}>
                                                {badgeInfo.tag}
                                            </span>
                                        </div>

                                        {isSelected && (
                                            <div className="absolute top-0 right-0 w-6 h-6 bg-primary flex items-center justify-center rounded-bl-xl shadow-md">
                                                <CheckCircle2 className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

            {/* Opciones de Talla */}
            {opciones?.tallas && opciones.tallas.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                            2. Elegí tu talla
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowSizeRecommender(true)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-red-400 transition-colors cursor-pointer group"
                        >
                            <Ruler className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform shrink-0" />
                            <span className="underline underline-offset-4 decoration-primary/40 group-hover:decoration-primary">
                                ¿No sabés tu talla? Calculala aquí
                            </span>
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2.5 pt-1">
                        {opciones.tallas
                            .filter((t) => {
                                if (!versionSeleccionada || !opciones.variantSizesMap) return true;
                                const allowedSizes = opciones.variantSizesMap[versionSeleccionada.id];
                                return allowedSizes ? allowedSizes.includes(t.id) : true;
                            })
                            .map((t) => {
                                const isSelected = tallaSeleccionada?.id === t.id;
                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => setTallaSeleccionada(t)}
                                        className={`min-w-[50px] h-12 md:min-w-[58px] md:h-14 px-2.5 rounded-2xl border flex flex-col items-center justify-center font-black transition-all duration-150 cursor-pointer active:scale-90 ${
                                            isSelected
                                                ? 'border-primary bg-gradient-to-b from-primary to-red-600 text-white shadow-[0_4px_20px_rgba(229,9,20,0.45)] ring-1 ring-white/30'
                                                : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/25 text-white/80'
                                        }`}
                                    >
                                        <span className="text-sm md:text-base leading-none">{t.label}</span>
                                        {t.additional_cost && t.additional_cost > 0 ? (
                                            <span
                                                className={`text-[8px] md:text-[9px] font-mono leading-none mt-1 font-bold ${
                                                    isSelected ? 'text-white/90' : 'text-amber-400'
                                                }`}
                                            >
                                                +L{t.additional_cost}
                                            </span>
                                        ) : null}
                                    </button>
                                );
                            })}
                        {versionSeleccionada &&
                            opciones.variantSizesMap &&
                            (!opciones.variantSizesMap[versionSeleccionada.id] ||
                                opciones.variantSizesMap[versionSeleccionada.id].length === 0) && (
                                <p className="text-xs text-red-400 italic">
                                    No hay tallas disponibles para esta versión en este momento.
                                </p>
                            )}
                    </div>
                </div>
            )}

            {/* MODAL RECOMENDADOR INTELIGENTE DE TALLAS */}
            <SizeRecommenderModal
                isOpen={showSizeRecommender}
                onClose={() => setShowSizeRecommender(false)}
                productName={producto.modelo}
                categoryName={producto.liga}
                genderRaw={productRaw.gender || (productRaw as { gender?: string }).gender}
                brandName={producto.brands?.name || 'Camisetas'}
                versionName={versionSeleccionada?.label || 'Estándar'}
                availableSizes={(opciones?.tallas || [])
                    .filter((t) => {
                        if (!versionSeleccionada || !opciones?.variantSizesMap) return true;
                        const allowedSizes = opciones.variantSizesMap[versionSeleccionada.id];
                        return allowedSizes ? allowedSizes.includes(t.id) : true;
                    })
                    .map((t) => t.label)}
                onSelectSize={(sizeLabel) => {
                    const matchingTalla = opciones?.tallas?.find(
                        (t) => t.label.trim().toLowerCase() === sizeLabel.trim().toLowerCase()
                    );
                    if (matchingTalla) {
                        setTallaSeleccionada(matchingTalla);
                        toast.success(`Talla ${matchingTalla.label} seleccionada`);
                    }
                }}
            />

            {/* Opciones de Parche */}
            {opciones?.parches && opciones.parches.length > 0 && (
                <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                        3. Parches de competencia
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                        {opciones.parches.map((p) => {
                            const isSelected = parcheSeleccionado?.id === p.id;
                            return (
                                <button
                                    key={p.id}
                                    onClick={() =>
                                        setParcheSeleccionado(isSelected ? null : p)
                                    }
                                    className={`px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                                        isSelected
                                            ? 'border-primary/80 bg-primary/20 text-white shadow-[0_4px_16px_rgba(229,9,20,0.3)] ring-1 ring-white/20'
                                            : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/25 text-white/80'
                                    }`}
                                >
                                    {p.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Sección Dorsal — Nombre grande y dominante, número compacto */}
            {producto.allows_customization !== false && (
                <div className="rounded-[2rem] bg-gradient-to-br from-[#14151c]/90 via-[#0e0f14]/90 to-black/90 backdrop-blur-2xl border border-white/[0.08] p-5 sm:p-6 shadow-[0_15px_40px_rgba(0,0,0,0.5)] relative overflow-hidden space-y-4">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-white/70">
                            Dorsal y nombre en la espalda
                        </span>
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                            Sin costo extra
                        </span>
                    </div>

                    {/* Apple Segmented Control Pill */}
                    <div className="p-1 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 flex gap-1">
                        <button
                            onClick={() => {
                                setQuiereDorsal(true);
                                setModoDorsal(hasPlayers ? 'jugador' : 'personalizado');
                            }}
                            className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-95 ${
                                quiereDorsal
                                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                                    : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                            }`}
                        >
                            SÍ, PERSONALIZAR
                        </button>
                        <button
                            onClick={() => {
                                setQuiereDorsal(false);
                                setModoDorsal('');
                                setJugadorSeleccionado(null);
                                setNombrePersonalizado('');
                                setNumeroPersonalizado('');
                            }}
                            className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-95 ${
                                !quiereDorsal
                                    ? 'bg-white/[0.15] text-white shadow-sm border border-white/20'
                                    : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                            }`}
                        >
                            SIN DORSAL
                        </button>
                    </div>

                    <AnimatePresence>
                        {quiereDorsal && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                                className="space-y-3 pt-1 overflow-hidden"
                            >
                                {hasPlayers && (
                                    <div className="p-1 rounded-xl bg-black/40 border border-white/10 flex gap-1">
                                        <button
                                            onClick={() => setModoDorsal('jugador')}
                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                                modoDorsal === 'jugador'
                                                    ? 'bg-white/[0.15] text-white shadow-sm border border-white/15'
                                                    : 'text-white/50 hover:text-white'
                                            }`}
                                        >
                                            Jugador del plantel
                                        </button>
                                        <button
                                            onClick={() => setModoDorsal('personalizado')}
                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                                modoDorsal === 'personalizado'
                                                    ? 'bg-white/[0.15] text-white shadow-sm border border-white/15'
                                                    : 'text-white/50 hover:text-white'
                                            }`}
                                        >
                                            Tu nombre y número
                                        </button>
                                    </div>
                                )}

                                {modoDorsal === 'jugador' && hasPlayers && (
                                    <select
                                        value={jugadorSeleccionado ? jugadorSeleccionado.id : ''}
                                        onChange={(e) => {
                                            const selectedPlayer = opciones?.dorsales?.find(
                                                (d) => d.id === e.target.value
                                            );
                                            if (selectedPlayer) {
                                                setJugadorSeleccionado({
                                                    id: selectedPlayer.id,
                                                    numero: selectedPlayer.numero,
                                                    nombre: selectedPlayer.jugador,
                                                });
                                            } else {
                                                setJugadorSeleccionado(null);
                                            }
                                        }}
                                        className="w-full bg-black/60 backdrop-blur-xl border border-white/15 focus:border-primary/80 focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none transition-all cursor-pointer"
                                    >
                                        <option value="" className="bg-[#121318]">Elegí una estrella del equipo...</option>
                                        {opciones?.dorsales
                                            ?.filter((d) => d.jugador !== 'Personalizado')
                                            .map((d) => (
                                                <option key={d.id} value={d.id} className="bg-[#121318]">
                                                    {d.numero ? `${d.numero}. ${d.jugador}` : d.jugador}
                                                </option>
                                            ))}
                                    </select>
                                )}

                                {modoDorsal === 'personalizado' && (
                                    <div className="flex items-end gap-2.5">
                                        {/* Campo Nombre: Dominante y amplio */}
                                        <div className="flex-1 min-w-0">
                                            <label htmlFor="nombre-dorsal" className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">
                                                Nombre o apodo en la espalda
                                            </label>
                                            <input
                                                id="nombre-dorsal"
                                                type="text"
                                                placeholder="EJ. PALMA"
                                                value={nombrePersonalizado}
                                                onChange={handleNombreChange}
                                                className="w-full bg-black/60 backdrop-blur-xl border border-white/15 focus:border-primary focus:ring-1 focus:ring-primary/40 rounded-xl px-3.5 py-2.5 font-mono font-bold text-sm text-white outline-none uppercase tracking-wider transition-all placeholder:text-white/25"
                                            />
                                        </div>

                                        {/* Campo Número: Compacto y ajustado */}
                                        <div className="w-16 shrink-0">
                                            <label htmlFor="numero-dorsal" className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1 text-center">
                                                Dorsal
                                            </label>
                                            <input
                                                id="numero-dorsal"
                                                type="text"
                                                placeholder="10"
                                                value={numeroPersonalizado}
                                                onChange={handleNumeroChange}
                                                maxLength={2}
                                                className="w-full bg-black/60 backdrop-blur-xl border border-white/15 focus:border-primary focus:ring-1 focus:ring-primary/40 rounded-xl px-2 py-2.5 text-center font-mono font-black text-lg text-primary outline-none transition-all placeholder:text-white/25"
                                            />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

