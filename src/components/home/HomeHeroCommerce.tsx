"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Trophy, Star, Flame, Globe, ChevronLeft, ChevronRight, ShoppingBag, Sparkles } from "lucide-react";
import { m as motion, AnimatePresence } from "@/lib/motion";
import { SpecialBanner } from "@/lib/types";
import { usePrefersReducedMotion } from "@/hooks/useOptimization";
import { HeroShowcaseSettings, DEFAULT_HERO_SETTINGS } from "@/lib/heroSettings";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    globe: Globe,
    trophy: Trophy,
    star: Star,
    flame: Flame,
};

export interface UnifiedHeroSlide {
    id: string;
    title: string;
    subtitle: string;
    linkUrl: string;
    buttonText: string;
    backgroundImageUrl?: string;
    backgroundVideoUrl?: string;
    logoUrl?: string;
    decorationImageUrl?: string;
    badgePrimaryText?: string;
    badgeSecondaryText?: string;
    badgeSecondaryIcon?: string;
    imagePositionDesktop?: string;
    imagePositionMobile?: string;
    isMainHero?: boolean;
}

interface HomeHeroCommerceProps {
    specialBanners?: SpecialBanner[];
    banners?: Record<string, unknown>[];
    heroSettings?: HeroShowcaseSettings;
}

export default function HomeHeroCommerce({
    specialBanners = [],
    banners = [],
    heroSettings = DEFAULT_HERO_SETTINGS,
}: HomeHeroCommerceProps) {
    const prefersReducedMotion = usePrefersReducedMotion();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [videoFailedMap, setVideoFailedMap] = useState<Record<string, boolean>>({});
    const [canLoadVideo, setCanLoadVideo] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined" && window.innerWidth >= 768) {
            const timer = setTimeout(() => setCanLoadVideo(true), 800);
            return () => clearTimeout(timer);
        }
    }, []);

    // Construcción de slides: Flagship Hero Principal como #1 (editable en admin) + Banners especiales / estándar
    const slides: UnifiedHeroSlide[] = useMemo(() => {
        const activeSpecial = (specialBanners || []).filter((sb) => sb.active !== false);
        const heroFromDb = activeSpecial.find((sb) => sb.slug === "hero-principal");

        // Slide #1: Si existe en la BD bajo "hero-principal", se usa la configuración del Admin; si no, fallback
        const mainStoreHero: UnifiedHeroSlide = heroFromDb
            ? {
                  id: heroFromDb.id,
                  title: heroFromDb.title || "CAMISETAS OFICIALES",
                  subtitle: heroFromDb.subtitle || "La tienda deportiva #1 en Honduras. Versión Jugador y Aficionado bajo pedido.",
                  linkUrl: heroFromDb.link_url || "/catalogo",
                  buttonText: heroFromDb.button_text || "Comprar Ahora",
                  backgroundImageUrl: heroFromDb.background_image_url || "/heroes/home.jpg",
                  backgroundVideoUrl: heroFromDb.background_video_url || undefined,
                  logoUrl: heroFromDb.logo_url || undefined,
                  decorationImageUrl: heroFromDb.decoration_image_url || undefined,
                  badgePrimaryText: heroFromDb.badge_primary_text || "Nueva Temporada",
                  badgeSecondaryText: heroFromDb.badge_secondary_text || "90+5 Store Honduras",
                  badgeSecondaryIcon: heroFromDb.badge_secondary_icon || "trophy",
                  imagePositionDesktop: heroFromDb.image_position_desktop || "50% 50%",
                  imagePositionMobile: heroFromDb.image_position_mobile || "50% 50%",
                  isMainHero: true,
              }
            : {
                  id: "main-store-hero",
                  title: "CAMISETAS OFICIALES",
                  subtitle: "La tienda deportiva #1 en Honduras. Versión Jugador y Aficionado con dorsal y parches oficiales de tus clubes y selecciones favoritas.",
                  linkUrl: "/catalogo",
                  buttonText: "Comprar Ahora",
                  badgePrimaryText: "Nueva Temporada",
                  badgeSecondaryText: "90+5 Store Honduras",
                  badgeSecondaryIcon: "trophy",
                  backgroundImageUrl: "/heroes/home.jpg",
                  isMainHero: true,
              };

        const otherSlides: UnifiedHeroSlide[] = [];

        // Agregar los demás banners especiales (excluyendo el hero principal)
        activeSpecial
            .filter((sb) => sb.id !== mainStoreHero.id && sb.slug !== "hero-principal")
            .forEach((sb) => {
                otherSlides.push({
                    id: sb.id,
                    title: sb.title || "COLECCIÓN ESPECIAL",
                    subtitle: sb.subtitle || "Prendas oficiales versión jugador y aficionado.",
                    linkUrl: sb.link_url && sb.link_url !== "/catalogo"
                        ? sb.link_url
                        : (sb.slug ? `/coleccion/${sb.slug}` : "/catalogo"),
                    buttonText: sb.button_text || "Ver Colección",
                    backgroundImageUrl: sb.background_image_url || undefined,
                    backgroundVideoUrl: sb.background_video_url || undefined,
                    logoUrl: sb.logo_url || undefined,
                    decorationImageUrl: sb.decoration_image_url || undefined,
                    badgePrimaryText: sb.badge_primary_text || "Colección Exclusiva",
                    badgeSecondaryText: sb.badge_secondary_text || "Edición Limitada",
                    badgeSecondaryIcon: sb.badge_secondary_icon || "star",
                    imagePositionDesktop: sb.image_position_desktop || "50% 50%",
                    imagePositionMobile: sb.image_position_mobile || "50% 50%",
                });
            });

        // Agregar banners estándar activos si no hay especiales
        if (otherSlides.length === 0 && banners && banners.length > 0) {
            banners.forEach((b: any) => {
                otherSlides.push({
                    id: b.id || `banner-${b.sort_order || 0}`,
                    title: b.title || "NUEVOS INGRESOS",
                    subtitle: b.description || "Envíos a todo Honduras vía CAEX.",
                    linkUrl: b.link_url || "/catalogo",
                    buttonText: b.button_text || "Explorar Tienda",
                    backgroundImageUrl: b.image_url || undefined,
                    backgroundVideoUrl: b.video_url || undefined,
                    badgePrimaryText: "Drop Oficial",
                    badgeSecondaryText: "Disponibles Ya",
                    badgeSecondaryIcon: "flame",
                    imagePositionDesktop: b.image_position_desktop || "50% 40%",
                    imagePositionMobile: b.image_position_mobile || "50% 50%",
                });
            });
        }

        return [mainStoreHero, ...otherSlides];
    }, [specialBanners, banners]);

    const hasMultiple = slides.length > 1;

    // Auto-rotación del carrusel (7 segundos)
    useEffect(() => {
        if (!hasMultiple || isHovered) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % slides.length);
        }, 7000);
        return () => clearInterval(interval);
    }, [hasMultiple, isHovered, slides.length]);

    const handlePrev = useCallback(() => {
        setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    }, [slides.length]);

    const handleNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, [slides.length]);

    const currentSlide = slides[currentIndex] || slides[0];
    const IconComponent = ICON_MAP[currentSlide.badgeSecondaryIcon || "trophy"] || Trophy;
    const isVideoFailed = currentSlide.id ? !!videoFailedMap[currentSlide.id] : false;

    const posMobile = currentSlide.imagePositionMobile || "50% 20%";
    const posDesktop = currentSlide.imagePositionDesktop || "50% 50%";

    return (
        <section
            aria-label="Escaparate principal"
            className="relative w-full overflow-hidden bg-[#07080a] h-[82vh] min-h-[520px] max-h-[720px] sm:h-auto sm:min-h-[480px] md:min-h-[520px] lg:min-h-[560px] flex items-end md:items-center justify-center border-b border-white/[0.08]"
            style={{
                // @ts-expect-error CSS variable for responsive objectPosition
                "--hero-pos-mob": posMobile,
                "--hero-pos-desk": posDesktop,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* CHIP FLOTANTE ESTILO APPLE EN MÓVIL: Da estatus de producto oficial sin tapar la foto */}
            <div className="md:hidden absolute top-3.5 right-3.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/45 border border-white/15 backdrop-blur-md text-[10px] text-white/90 shadow-md pointer-events-none">
                {heroSettings.showSpecs && heroSettings.specsVersion ? (
                    <span className="text-[#FFD700] font-bold">{heroSettings.specsVersion}</span>
                ) : heroSettings.showQuickTag && heroSettings.quickTagBadge ? (
                    <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-semibold">{heroSettings.quickTagBadge}</span>
                    </>
                ) : (
                    <span className="text-white/80 font-medium">90+5 Original</span>
                )}
            </div>

            {/* FONDO MULTIMEDIA CON CAPA CROSSFADE Y CLARIDAD APPLE */}
            <AnimatePresence mode="sync">
                <motion.div
                    key={`bg-${currentSlide.id}`}
                    initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 1.04 }}
                    animate={{
                        opacity: 1,
                        scale: isHovered && !prefersReducedMotion ? 1.05 : (prefersReducedMotion ? 1 : 1.03),
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                        duration: 0.8,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                    className="absolute inset-0 z-0 pointer-events-none transition-transform duration-700 ease-out overflow-hidden"
                >
                    {/* CAPA AMBIENTAL DE RESPALDO: Si la imagen tiene recortes o transparencias, difumina los colores de la misma imagen para que NUNCA aparezcan franjas negras */}
                    {currentSlide.backgroundImageUrl && (
                        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                            <Image
                                src={currentSlide.backgroundImageUrl}
                                alt=""
                                fill
                                sizes="33vw"
                                priority={false}
                                aria-hidden="true"
                                className="w-full h-full object-cover blur-3xl scale-125 opacity-55 brightness-95 saturate-150"
                            />
                        </div>
                    )}

                    {/* CAPA PRINCIPAL EN ZOOM-TO-FILL: Rellena el 100% del espacio sin importar el tamaño o proporción del archivo */}
                    {currentSlide.backgroundVideoUrl && canLoadVideo && !isVideoFailed ? (
                        <video
                            src={currentSlide.backgroundVideoUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="none"
                            poster={currentSlide.backgroundImageUrl}
                            className="w-full h-full min-w-full min-h-full object-cover opacity-85 brightness-[0.92] contrast-105 scale-[1.04] sm:scale-[1.03] [object-position:var(--hero-pos-mob)] md:[object-position:var(--hero-pos-desk)]"
                            style={{ objectFit: "cover" }}
                            onError={() => setVideoFailedMap((prev) => ({ ...prev, [currentSlide.id]: true }))}
                        />
                    ) : currentSlide.backgroundImageUrl ? (
                        <Image
                            src={currentSlide.backgroundImageUrl}
                            alt={currentSlide.title}
                            fill
                            priority
                            sizes="100vw"
                            className="min-w-full min-h-full object-cover opacity-90 sm:opacity-95 brightness-[0.94] contrast-[1.04] scale-[1.06] sm:scale-[1.03] transition-transform duration-700 [object-position:var(--hero-pos-mob)] md:[object-position:var(--hero-pos-desk)]"
                            style={{ objectFit: "cover" }}
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#121319] via-[#090a0e] to-black" />
                    )}

                    {/* VIÑETA DIRECCIONAL APPLE: Protege la legibilidad de la cápsula sin oscurecer innecesariamente el lienzo */}
                    <div className="absolute bottom-0 inset-x-0 h-[56%] bg-gradient-to-t from-[#07080a] via-[#07080a]/75 to-transparent md:hidden pointer-events-none z-20" />
                    <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-[#07080a]/80 via-[#07080a]/40 to-transparent w-1/2 pointer-events-none z-20" />
                    <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-[#07080a]/40 to-transparent pointer-events-none z-20" />
                </motion.div>
            </AnimatePresence>

            {/* Acentos de luz ambiental */}
            <div className="absolute top-1/4 left-8 w-80 h-80 bg-primary/10 rounded-full blur-[140px] pointer-events-none" />

            {/* CONTENIDO EDITORIAL */}
            <div className="relative z-10 max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pb-10 pt-4 sm:py-12 md:py-14 w-full flex flex-col md:flex-row items-center justify-between gap-4 md:gap-10">
                
                {/* COLUMNA IZQUIERDA: CÁPSULA TRANSLÚCIDA APPLE PARA TEXTO Y ACCIONES */}
                <div className="w-full md:max-w-xl lg:max-w-2xl flex flex-col items-start text-left p-3.5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-black/55 md:bg-black/40 border border-white/15 md:border-white/10 border-t-white/30 md:border-t-white/20 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    
                    {/* OVERLINE / KICKER TIPOGRÁFICO ELEGANTE ESTILO APPLE */}
                    {(currentSlide.badgePrimaryText || currentSlide.badgeSecondaryText) && (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`badges-${currentSlide.id}`}
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3 text-[11px] sm:text-xs uppercase tracking-widest"
                            >
                                {currentSlide.badgePrimaryText && (
                                    <span className="flex items-center gap-1.5 text-white font-extrabold">
                                        <Sparkles className="w-3 h-3 text-white/80 fill-white/20 shrink-0" />
                                        <span>{currentSlide.badgePrimaryText}</span>
                                    </span>
                                )}
                                {currentSlide.badgePrimaryText && currentSlide.badgeSecondaryText && (
                                    <span className="text-white/30">·</span>
                                )}
                                {currentSlide.badgeSecondaryText && (
                                    <span className="flex items-center gap-1.5 text-white/60 font-semibold">
                                        <IconComponent className="w-3 h-3 text-white/50 shrink-0" />
                                        <span>{currentSlide.badgeSecondaryText}</span>
                                    </span>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    )}

                    {/* TÍTULO */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`title-${currentSlide.id}`}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.35 }}
                            className="flex flex-col gap-1.5 sm:gap-3"
                        >
                            <div className="flex items-center gap-2 sm:gap-3">
                                {currentSlide.logoUrl && (
                                    <div className="relative h-8 w-8 sm:h-14 sm:w-14 shrink-0 drop-shadow-md">
                                        <Image
                                            src={currentSlide.logoUrl}
                                            alt=""
                                            fill
                                            sizes="56px"
                                            className="object-contain"
                                        />
                                    </div>
                                )}
                                <h2 className="text-xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight leading-[1.08]">
                                    {currentSlide.title}
                                </h2>
                            </div>

                            <p className="text-[11.5px] sm:text-sm md:text-base text-white/80 font-normal leading-snug sm:leading-relaxed max-w-xl text-balance line-clamp-2 md:line-clamp-none">
                                {currentSlide.subtitle}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    {/* BOTONES DE COMPRA Y CATÁLOGO */}
                    <div className="flex flex-row items-center gap-2 sm:gap-4 mt-3 sm:mt-7 w-full sm:w-auto">
                        <Link
                            href={currentSlide.linkUrl}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-6 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white text-black font-extrabold text-xs sm:text-sm hover:bg-neutral-100 transition-all shadow-lg active:scale-95 group text-center cursor-pointer"
                        >
                            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
                            <span className="truncate">{currentSlide.buttonText}</span>
                            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-1 transition-transform shrink-0" />
                        </Link>

                        {heroSettings.showSecondaryButton && (
                            <Link
                                href={heroSettings.secondaryButtonUrl || "/catalogo"}
                                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-white font-bold text-xs sm:text-sm backdrop-blur-md transition-all active:scale-95 text-center cursor-pointer"
                            >
                                <span className="truncate">{heroSettings.secondaryButtonText || "Ver Catálogo"}</span>
                            </Link>
                        )}
                    </div>

                    {/* CONFIANZA */}
                    {heroSettings.showTrustNotice && heroSettings.trustNotice && (
                        <div className="flex items-center gap-2 mt-2.5 sm:mt-4 pt-2.5 sm:pt-4 border-t border-white/10 text-white/70 text-[10px] sm:text-xs font-medium w-full">
                            <span className="flex h-1.5 w-1.5 sm:h-2 sm:w-2 relative shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
                            </span>
                            <span className="truncate">{heroSettings.trustNotice}</span>
                        </div>
                    )}
                </div>

                {/* COLUMNA DERECHA: SHOWCASE INTERACTIVO / FUNCIÓN ÚTIL SOBRE LA IMAGEN */}
                <div className="hidden md:flex flex-col items-end gap-3 self-end shrink-0 z-10">
                    {/* Si tiene elemento decorativo 3D */}
                    {currentSlide.decorationImageUrl ? (
                        <motion.div
                            key={`decor-${currentSlide.id}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.5 }}
                            className="relative w-44 h-44 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 shrink-0 pointer-events-none flex items-center justify-center"
                        >
                            <motion.div
                                animate={prefersReducedMotion ? undefined : { y: [0, -10, 0] }}
                                transition={prefersReducedMotion ? undefined : { repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                                className="relative w-full h-full"
                            >
                                <Image
                                    src={currentSlide.decorationImageUrl}
                                    alt="Elemento decorativo 90+5"
                                    fill
                                    sizes="320px"
                                    className="object-contain drop-shadow-[0_20px_45px_rgba(0,0,0,0.85)]"
                                />
                            </motion.div>
                        </motion.div>
                    ) : (
                        /* Píldora interactiva estilo Apple Vision / Quick View: Da utilidad directa a la imagen */
                        heroSettings.showQuickTag && (
                            <Link
                                href={currentSlide.linkUrl}
                                className="group/tag inline-flex items-center gap-3 px-4 py-3 rounded-2xl bg-black/50 hover:bg-black/75 border border-white/15 hover:border-white/30 backdrop-blur-xl text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 text-left cursor-pointer"
                            >
                                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-primary group-hover/tag:bg-primary group-hover/tag:text-black transition-colors shrink-0">
                                    <ShoppingBag className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                    {heroSettings.quickTagBadge && (
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/60">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            <span>{heroSettings.quickTagBadge}</span>
                                        </div>
                                    )}
                                    <div className="text-xs sm:text-sm font-black text-white group-hover/tag:text-primary transition-colors flex items-center gap-1">
                                        <span>{heroSettings.quickTagAction || currentSlide.buttonText}</span>
                                        <ArrowRight className="w-3.5 h-3.5 group-hover/tag:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        )
                    )}

                    {/* Especificaciones visuales de la prenda visible */}
                    {heroSettings.showSpecs && (heroSettings.specsSizes || heroSettings.specsVersion) && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/45 border border-white/10 backdrop-blur-md text-[11px] text-white/80 font-medium shadow-lg select-none">
                            {heroSettings.specsSizes && <span>{heroSettings.specsSizes}</span>}
                            {heroSettings.specsSizes && heroSettings.specsVersion && (
                                <span className="text-white/30">•</span>
                            )}
                            {heroSettings.specsVersion && (
                                <span className="text-[#FFD700] font-bold">{heroSettings.specsVersion}</span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* CONTROLES DEL CARRUSEL */}
            {hasMultiple && (
                <>
                    <button
                        onClick={handlePrev}
                        aria-label="Hero anterior"
                        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 border border-white/15 text-white items-center justify-center backdrop-blur-md transition-all active:scale-90"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleNext}
                        aria-label="Hero siguiente"
                        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 border border-white/15 text-white items-center justify-center backdrop-blur-md transition-all active:scale-90"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Indicadores de diapositiva */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                        {slides.map((s, idx) => (
                            <button
                                key={s.id}
                                onClick={() => setCurrentIndex(idx)}
                                aria-label={`Slide ${idx + 1}`}
                                className={`transition-all duration-300 rounded-full ${
                                    idx === currentIndex
                                        ? "w-6 h-1.5 bg-white shadow-sm"
                                        : "w-1.5 h-1.5 bg-white/30 hover:bg-white/60"
                                }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}
