"use client";

// Removed heavy framer-motion import for grid items to improve TBT
import { Shirt, ArrowRight } from "lucide-react";
import ProductImage from "../../components/ProductImage";
import TeamLogo from "../../components/TeamLogo";
import { Product } from "../../lib/types";
import type { LiveMatchData } from "../../hooks/useLiveMatches";

// Tipos para las props del componente
interface ProductCardProps {
    item: Product;
    priority?: boolean;
    onPress: (item: Product) => void;
    enableGlow?: boolean;
    topSeller?: boolean;
    liveMatch?: LiveMatchData | null;
}

// Variantes de animación
const fadeInItem = {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 10, scale: 0.97 },
    transition: { duration: 0.5, ease: "easeOut" }
};

const glowHover = {
    boxShadow: "0 0 22px rgba(229,9,20,0.25)",
    borderColor: "rgba(229,9,20,0.45)",
    transition: { duration: 0.3, ease: "easeOut" as const }
};

// Use standard button instead of div for semantics and keyboard accessibility
export default function ProductCard({ item, priority = false, onPress, enableGlow = true, topSeller = false, liveMatch = null }: ProductCardProps) {

    // Extraer datos asegurando que no fallen
    const {
        equipo,
        modelo,
        precio,
        imagen,
        logoEquipo,
        trending_until,
    } = item;

    // isLive: partido en curso via API, O activación manual admin
    const isLive = !!liveMatch || (trending_until ? new Date(trending_until) > new Date() : false);

    // Datos del marcador cuando viene de la API
    const opponent = liveMatch ? (liveMatch.isHome ? liveMatch.awayTeam : liveMatch.homeTeam) : null;
    const ourScore = liveMatch ? (liveMatch.isHome ? liveMatch.homeScore : liveMatch.awayScore) : null;
    const theirScore = liveMatch ? (liveMatch.isHome ? liveMatch.awayScore : liveMatch.homeScore) : null;
    // Nombre corto del rival (primeras 2 palabras)
    const shortOpponent = opponent ? opponent.split(' ').slice(0, 2).join(' ') : null;

    return (
        <button
            type="button"
            onClick={() => onPress(item)}
            aria-label={`Ver ${equipo} ${modelo}`}
            className={`group relative bg-[#0a0a0a] rounded-[2rem] overflow-hidden border border-white/5
            ${enableGlow ? 'hover:shadow-[0_0_22px_rgba(229,9,20,0.25)] hover:border-primary/45' : 'hover:border-primary/40'}
            transition-all duration-500 ease-out cursor-pointer aspect-[4/5] shadow-2xl animate-in fade-in zoom-in-95 fill-mode-both w-full text-left`}
            style={{ animationDuration: '600ms' }}
        >
            {/* 🖼️ Main Image */}
            <div className="absolute inset-0">
                <ProductImage
                    src={imagen}
                    alt={`${equipo} ${modelo}`}
                    // Sizes optimizados para grid responsivo
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                    priority={priority}
                />

                {/* Dynamic Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </div>

            {/* 🏷️ Team Logo Overlay */}
            {logoEquipo && (
                <div className="absolute top-3 left-3 md:top-5 md:left-5 z-20 transform group-hover:scale-110 transition-transform duration-500">
                    <TeamLogo
                        src={logoEquipo}
                        alt={equipo}
                        size={32} // Más pequeño en móvil
                        className="w-8 h-8 md:w-12 md:h-12" // Responsive
                    />
                </div>
            )}

            {/* 🔥 Badges: EN VIVO (con marcador) / TOP */}
            {(isLive || topSeller) && (
                <div className="absolute top-3 right-3 md:top-4 md:right-4 z-20 flex flex-col gap-1 items-end">
                    {isLive && (
                        <>
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold bg-primary text-white shadow-[0_0_10px_rgba(229,9,20,0.6)] animate-pulse">
                                ⚡ EN VIVO
                            </span>
                            {shortOpponent && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold bg-black/70 text-white border border-white/20 whitespace-nowrap">
                                    vs {shortOpponent} · {ourScore}-{theirScore}
                                </span>
                            )}
                        </>
                    )}
                    {!isLive && topSeller && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold bg-amber-500/90 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                            🔥 TOP
                        </span>
                    )}
                </div>
            )}

            {/* 📝 Content Wrapper */}
            <div className="absolute inset-0 z-10 flex flex-col justify-end p-3 sm:p-4 md:p-6">
                <div className="transform transition-transform duration-500 ease-out group-hover:-translate-y-16 md:group-hover:-translate-y-20">
                    <h3 className="text-base sm:text-lg md:text-2xl font-bold text-white leading-tight tracking-tight drop-shadow-lg">
                        {equipo}
                    </h3>
                    <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm font-medium tracking-wide mt-0.5 sm:mt-1">
                        {modelo}
                    </p>
                    <div className="mt-1.5 sm:mt-2 md:mt-3 inline-block px-2.5 py-0.5 sm:px-3 md:px-4 md:py-1 bg-black/60 md:bg-white/10 md:backdrop-blur-xl border border-white/10 rounded-full">
                        <p className="text-primary font-bold text-xs sm:text-sm md:text-lg">
                            L {precio.toLocaleString("es-HN")}
                        </p>
                    </div>
                </div>
            </div>

            {/* ⚡ Action Label (Slides up) — div instead of button to avoid nested buttons */}
            <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 z-20 transform translate-y-24 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)">
                <div className="w-full py-3 md:py-4 bg-primary text-white font-bold rounded-xl md:rounded-2xl shadow-[0_15px_30px_rgba(229,9,20,0.4)] flex items-center justify-center gap-2 md:gap-3 group/btn">
                    <Shirt className="w-4 h-4 md:w-5 md:h-5 group-hover/btn:rotate-12 transition-transform hidden md:block" />
                    <span className="tracking-wide text-xs md:text-[15px]">Personalizar</span>
                    <ArrowRight className="w-3 h-3 md:w-4 md:h-4 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all" />
                </div>
            </div>
        </button>
    );
}
