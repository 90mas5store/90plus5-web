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
                icon: <Gem className="w-3 h-3 text-amber-400" />,
                tag: '💎 Ajuste Atlético · Termosellado',
                color: 'text-amber-400',
            };
        }
        if (lower.includes('fan') || lower.includes('aficionado')) {
            return {
                icon: <Shield className="w-3 h-3 text-blue-400" />,
                tag: '⭐ Corte Regular · Bordado',
                color: 'text-blue-400',
            };
        }
        return {
            icon: <Sparkles className="w-3 h-3 text-primary" />,
            tag: '✨ Edición Oficial',
            color: 'text-gray-400',
        };
    };

    return (
        <>
            {/* Opciones de Versión */}
            {opciones?.versiones &&
                opciones.versiones.length > 0 &&
                !(opciones.versiones.length === 1 && opciones.versiones[0].label === 'Estandar') && (
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-gray-300">Versión</h3>
                            {versionSeleccionada && (
                                <span className="text-xs text-primary font-medium flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Seleccionado
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
                                        className={`p-4 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group cursor-pointer ${
                                            isSelected
                                                ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(229,9,20,0.15)]'
                                                : 'border-white/5 bg-white/5 hover:border-white/20'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span
                                                className={`block font-bold text-base ${
                                                    isSelected ? 'text-white' : 'text-gray-300'
                                                }`}
                                            >
                                                {v.label}
                                            </span>
                                            <span className="text-xs font-bold text-white">
                                                L{' '}
                                                {opciones.preciosPorVersion?.[v.label]?.toLocaleString('es-HN', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>

                                        {/* Micro-badge explicativo Fan vs Player */}
                                        <div className="flex items-center gap-1.5 mt-2 text-[10px] font-medium text-gray-400">
                                            {badgeInfo.icon}
                                            <span className={isSelected ? 'text-white/90' : 'text-gray-400'}>
                                                {badgeInfo.tag}
                                            </span>
                                        </div>

                                        {isSelected && (
                                            <div className="absolute top-0 right-0 w-7 h-7 bg-primary flex items-center justify-center rounded-bl-xl">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
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
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-300">Talla</h3>
                        <button
                            type="button"
                            onClick={() => setShowSizeRecommender(true)}
                            className="group relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/40 text-xs font-bold text-white hover:bg-primary/30 hover:border-primary shadow-[0_0_12px_rgba(229,9,20,0.3)] hover:shadow-[0_0_18px_rgba(229,9,20,0.6)] transition-all duration-300 cursor-pointer overflow-hidden active:scale-95"
                        >
                            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping opacity-30 pointer-events-none" />
                            <Ruler className="w-3.5 h-3.5 text-primary group-hover:rotate-12 transition-transform duration-300 shrink-0" />
                            <span className="relative z-10 bg-gradient-to-r from-white via-red-100 to-white bg-clip-text text-transparent group-hover:text-white transition-colors">
                                ¿Dudas con tu talla?
                            </span>
                            <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse shrink-0" />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {opciones.tallas
                            .filter((t) => {
                                if (!versionSeleccionada || !opciones.variantSizesMap) return true;
                                const allowedSizes = opciones.variantSizesMap[versionSeleccionada.id];
                                return allowedSizes ? allowedSizes.includes(t.id) : true;
                            })
                            .map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTallaSeleccionada(t)}
                                    className={`min-w-[48px] h-12 md:min-w-[56px] md:h-14 px-2 rounded-xl border flex flex-col items-center justify-center font-bold transition-all duration-300 cursor-pointer ${
                                        tallaSeleccionada?.id === t.id
                                            ? 'border-primary bg-primary text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]'
                                            : 'border-white/10 bg-white/5 hover:border-white/30 text-gray-400'
                                    }`}
                                >
                                    <span className="text-sm md:text-base leading-none">{t.label}</span>
                                    {t.additional_cost && t.additional_cost > 0 ? (
                                        <span
                                            className={`text-[8px] md:text-[9px] leading-none mt-0.5 font-medium ${
                                                tallaSeleccionada?.id === t.id
                                                    ? 'text-white/80'
                                                    : 'text-amber-400/70'
                                            }`}
                                        >
                                            +L{t.additional_cost}
                                        </span>
                                    ) : null}
                                </button>
                            ))}
                        {versionSeleccionada &&
                            opciones.variantSizesMap &&
                            (!opciones.variantSizesMap[versionSeleccionada.id] ||
                                opciones.variantSizesMap[versionSeleccionada.id].length === 0) && (
                                <p className="text-xs text-red-400 italic">
                                    No hay tallas disponibles para esta versión.
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
                    <h3 className="text-sm font-semibold text-gray-300">Parche Oficial</h3>
                    <div className="flex flex-wrap gap-3">
                        {opciones.parches.map((p) => (
                            <button
                                key={p.id}
                                onClick={() =>
                                    setParcheSeleccionado(parcheSeleccionado?.id === p.id ? null : p)
                                }
                                className={`px-5 py-3 rounded-xl border text-sm font-bold transition-all duration-300 cursor-pointer ${
                                    parcheSeleccionado?.id === p.id
                                        ? 'border-primary bg-primary/10 text-white shadow-[0_0_12px_rgba(229,9,20,0.2)]'
                                        : 'border-white/10 bg-white/5 hover:border-white/30 text-gray-400'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Sección Dorsal */}
            {producto.allows_customization !== false && (
                <div className="space-y-4 p-5 rounded-3xl bg-white/5 border border-white/5">
                    <h3 className="text-sm font-semibold text-gray-300">Personalización de Dorsal</h3>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setQuiereDorsal(true);
                                setModoDorsal(hasPlayers ? 'jugador' : 'personalizado');
                            }}
                            className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all cursor-pointer ${
                                quiereDorsal
                                    ? 'border-primary bg-primary/20 text-white'
                                    : 'border-white/10 hover:border-white/20 text-gray-500'
                            }`}
                        >
                            SÍ, AGREGAR
                        </button>
                        <button
                            onClick={() => {
                                setQuiereDorsal(false);
                                setModoDorsal('');
                                setJugadorSeleccionado(null);
                                setNombrePersonalizado('');
                                setNumeroPersonalizado('');
                            }}
                            className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all cursor-pointer ${
                                !quiereDorsal
                                    ? 'border-white/40 bg-white/10 text-white'
                                    : 'border-white/10 hover:border-white/20 text-gray-500'
                            }`}
                        >
                            NO, GRACIAS
                        </button>
                    </div>

                    <AnimatePresence>
                        {quiereDorsal && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-4 pt-4 overflow-hidden"
                            >
                                {hasPlayers && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setModoDorsal('jugador')}
                                            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer ${
                                                modoDorsal === 'jugador'
                                                    ? 'border-primary text-primary'
                                                    : 'border-white/10 text-gray-500'
                                            }`}
                                        >
                                            Jugador Real
                                        </button>
                                        <button
                                            onClick={() => setModoDorsal('personalizado')}
                                            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer ${
                                                modoDorsal === 'personalizado'
                                                    ? 'border-primary text-primary'
                                                    : 'border-white/10 text-gray-500'
                                            }`}
                                        >
                                            Mi Nombre
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
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-primary outline-none"
                                    >
                                        <option value="">Selecciona una estrella...</option>
                                        {opciones?.dorsales
                                            ?.filter((d) => d.jugador !== 'Personalizado')
                                            .map((d) => (
                                                <option key={d.id} value={d.id}>
                                                    {d.numero ? `${d.numero}. ${d.jugador}` : d.jugador}
                                                </option>
                                            ))}
                                    </select>
                                )}

                                {modoDorsal === 'personalizado' && (
                                    <div className="flex flex-row gap-2 sm:gap-3">
                                        <label htmlFor="numero-dorsal" className="sr-only">
                                            Número de dorsal
                                        </label>
                                        <input
                                            id="numero-dorsal"
                                            type="text"
                                            placeholder="Nº"
                                            value={numeroPersonalizado}
                                            onChange={handleNumeroChange}
                                            maxLength={2}
                                            className="w-16 shrink-0 bg-black/40 border border-white/10 rounded-xl px-2 py-3 text-center font-black text-primary focus:border-primary outline-none"
                                        />
                                        <label htmlFor="nombre-dorsal" className="sr-only">
                                            Nombre de dorsal
                                        </label>
                                        <input
                                            id="nombre-dorsal"
                                            type="text"
                                            placeholder="Ej. L. PALMA"
                                            value={nombrePersonalizado}
                                            onChange={handleNombreChange}
                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:border-primary outline-none uppercase"
                                        />
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </>
    );
}
