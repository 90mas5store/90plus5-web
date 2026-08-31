'use client';

import TeamLogo from '@/components/TeamLogo';
import { CustomizerProduct, SelectedOption } from '@/types/productCustomizer';
import type { LiveMatchData } from '@/hooks/useLiveMatches';

interface ProductHeaderInfoProps {
    producto: CustomizerProduct;
    precioConRecargo: number;
    precioOriginalActual: { price: number; active: boolean } | null;
    tallaSeleccionada: SelectedOption | null;
    liveMatch: LiveMatchData | null;
    showLiveBanner: boolean;
    isMobile?: boolean;
}

export default function ProductHeaderInfo({
    producto,
    precioConRecargo,
    precioOriginalActual,
    tallaSeleccionada,
    liveMatch,
    showLiveBanner,
    isMobile = false,
}: ProductHeaderInfoProps) {
    const hasDiscount =
        precioOriginalActual?.active &&
        precioOriginalActual.price > precioConRecargo &&
        precioConRecargo > 0;

    const discountAmount = hasDiscount
        ? precioOriginalActual.price - precioConRecargo
        : 0;

    const discountPercent = hasDiscount
        ? Math.round((discountAmount / precioOriginalActual.price) * 100)
        : 0;

    if (isMobile) {
        return (
            <div className="flex lg:hidden flex-col gap-2 pt-1">
                <div className="flex items-start gap-3">
                    <TeamLogo src={producto.logoEquipo} alt={producto.equipo} size={52} />
                    <div className="min-w-0 flex-1">
                        <p className="text-2xl font-black tracking-tight text-white leading-none truncate">
                            {producto.equipo}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap mt-1.5">
                            <p className="text-primary font-bold text-xs uppercase tracking-widest truncate">
                                {producto.modelo}
                            </p>
                            {producto.season && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-gray-300 border border-white/10">
                                    {producto.season}
                                </span>
                            )}
                        </div>
                    </div>
                    {showLiveBanner && (
                        <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 shadow-md ${
                                liveMatch?.isFinished
                                    ? 'bg-amber-600 text-white shadow-[0_0_12px_rgba(217,119,6,0.6)]'
                                    : liveMatch?.isUpcoming
                                    ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.6)]'
                                    : 'bg-primary text-white animate-pulse shadow-[0_0_12px_rgba(229,9,20,0.6)]'
                            }`}
                        >
                            {liveMatch?.isFinished ? '🏆 FINAL' : liveMatch?.isUpcoming ? '📅 PRÓXIMO' : '⚡ EN VIVO'}
                        </span>
                    )}
                </div>

                <div className="flex items-baseline gap-2.5 flex-wrap">
                    {precioConRecargo > 0 ? (
                        <>
                            <span className="text-3xl font-black text-white tracking-tight">
                                L{' '}
                                {precioConRecargo.toLocaleString('es-HN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </span>
                            {hasDiscount && (
                                <>
                                    <span className="text-gray-500 line-through text-base opacity-60">
                                        L{' '}
                                        {precioOriginalActual.price.toLocaleString('es-HN', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                        AHORRAS L {discountAmount.toLocaleString('es-HN')} ({discountPercent}% OFF)
                                    </span>
                                </>
                            )}
                            {tallaSeleccionada?.additional_cost ? (
                                <span className="text-xs text-amber-400 font-medium ml-1">
                                    (incluye +L{tallaSeleccionada.additional_cost} por talla)
                                </span>
                            ) : null}
                        </>
                    ) : (
                        <span className="text-2xl font-bold text-white">Consultar precio</span>
                    )}
                </div>

                <p className="text-gray-400 leading-relaxed text-xs border-l-2 border-primary/30 pl-3 italic mt-1">
                    {producto.descripcion ||
                        'Diseño exclusivo con materiales de alta calidad para el máximo rendimiento y estilo.'}
                </p>
            </div>
        );
    }

    return (
        <div className="hidden lg:flex flex-col gap-4">
            <div className="flex items-start gap-4">
                <TeamLogo src={producto.logoEquipo} alt={producto.equipo} size={56} />
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-none text-white">
                            {producto.equipo}
                        </h1>
                        {showLiveBanner && (
                            <span
                                className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 shadow-md ${
                                    liveMatch?.isFinished
                                        ? 'bg-amber-600 text-white shadow-[0_0_12px_rgba(217,119,6,0.6)]'
                                        : liveMatch?.isUpcoming
                                        ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.6)]'
                                        : 'bg-primary text-white animate-pulse shadow-[0_0_12px_rgba(229,9,20,0.6)]'
                                }`}
                            >
                                {liveMatch?.isFinished ? '🏆 FINAL' : liveMatch?.isUpcoming ? '📅 PRÓXIMO' : '⚡ EN VIVO'}
                            </span>
                        )}
                    </div>
                    {liveMatch && (
                        <div
                            className={`mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border text-sm font-bold text-white ${
                                liveMatch.isFinished
                                    ? 'border-amber-500/40'
                                    : liveMatch.isUpcoming
                                    ? 'border-blue-500/40'
                                    : 'border-primary/40'
                            }`}
                        >
                            <span className="text-white">{liveMatch.homeTeam}</span>
                            {liveMatch.isUpcoming ? (
                                <>
                                    <span className="text-blue-400 font-bold">vs</span>
                                    <span className="text-white">{liveMatch.awayTeam}</span>
                                    <span className="text-blue-300 text-xs font-semibold bg-blue-500/20 px-2 py-0.5 rounded-md">
                                        {liveMatch.startTime || 'Próximamente'}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span
                                        className={
                                            liveMatch.isFinished
                                                ? 'text-amber-400 text-base'
                                                : 'text-primary text-base'
                                        }
                                    >
                                        {liveMatch.homeScore} - {liveMatch.awayScore}
                                    </span>
                                    <span className="text-white">{liveMatch.awayTeam}</span>
                                    {liveMatch.isFinished ? (
                                        <span className="text-amber-300 text-xs font-semibold bg-amber-500/20 px-2 py-0.5 rounded-md">
                                            Final
                                        </span>
                                    ) : (
                                        liveMatch.minute && (
                                            <span className="text-gray-400 text-xs font-normal">
                                                {liveMatch.minute}&apos;
                                            </span>
                                        )
                                    )}
                                </>
                            )}
                            {liveMatch.leagueName && (
                                <span className="text-gray-400 text-xs font-normal border-l border-white/20 pl-2">
                                    {liveMatch.leagueName}
                                </span>
                            )}
                        </div>
                    )}
                    <div className="flex items-center gap-2.5 flex-wrap mt-2">
                        <p className="text-primary font-semibold text-sm tracking-wide">
                            {producto.modelo}
                        </p>
                        {producto.season && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-gray-300 border border-white/10">
                                {producto.season}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-baseline gap-3 mt-2 flex-wrap">
                {precioConRecargo > 0 ? (
                    <>
                        <span className="text-4xl font-bold text-white tracking-tight">
                            L{' '}
                            {precioConRecargo.toLocaleString('es-HN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </span>
                        {hasDiscount && (
                            <>
                                <span className="text-gray-500 line-through text-lg opacity-60">
                                    L{' '}
                                    {precioOriginalActual.price.toLocaleString('es-HN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </span>
                                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                    AHORRAS L {discountAmount.toLocaleString('es-HN')} ({discountPercent}% OFF)
                                </span>
                            </>
                        )}
                        {tallaSeleccionada?.additional_cost ? (
                            <span className="text-xs text-amber-400 font-medium ml-1">
                                (incluye +L{tallaSeleccionada.additional_cost} por talla)
                            </span>
                        ) : null}
                    </>
                ) : (
                    <span className="text-3xl font-bold text-white tracking-wide">Consultar</span>
                )}
            </div>

            <p className="text-gray-400 leading-relaxed text-sm md:text-base border-l-2 border-primary/30 pl-4 italic">
                {producto.descripcion ||
                    'Diseño exclusivo con materiales de alta calidad para el máximo rendimiento y estilo.'}
            </p>
        </div>
    );
}
