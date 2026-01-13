"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";

// ============================================
// 🎨 TIPOS E INTERFACES
// ============================================

interface HeroSlide {
    /** Ruta a la imagen */
    imageSrc?: string;
    /** Ruta al video */
    videoSrc?: string;
    /** Título overlay (opcional) */
    title?: string;
    /** Subtítulo overlay (opcional) */
    subtitle?: string;
    /** Link al hacer clic (opcional) */
    link?: string;
}

interface HeroBannerProps {
    /** Ruta a la imagen del hero (desde /public) */
    imageSrc?: string;
    /** Ruta al video del hero (desde /public, formatos: .mp4, .webm) */
    videoSrc?: string;
    /** Array de slides para carrusel (override imageSrc/videoSrc) */
    slides?: HeroSlide[];
    /** Intervalo del slideshow en ms (default: 5000) */
    slideInterval?: number;
    /** Imagen de fallback si no se proporciona ninguna */
    fallbackImage?: string;
    /** Altura mínima del hero */
    minHeight?: string;
    /** Alt text para la imagen */
    alt?: string;
    /** Slug de categoría para buscar imagen automática */
    categorySlug?: string;
    /** Opacidad del overlay (0-1) */
    overlayOpacity?: number;
    /** Habilitar efecto parallax */
    enableParallax?: boolean;
    /** Intensidad del parallax (0-1) */
    parallaxIntensity?: number;
    /** Título overlay opcional */
    title?: string;
    /** Subtítulo overlay opcional */
    subtitle?: string;
    /** Children opcionales (para renderizar contenido encima) */
    children?: React.ReactNode;
    /** Clases adicionales */
    className?: string;
    /** Categorías adyacentes para preload */
    adjacentCategories?: string[];
}

// ============================================
// 🎭 SKELETON LOADER COMPONENT
// ============================================

function HeroSkeleton({ minHeight }: { minHeight: string }) {
    return (
        <div
            className="relative overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]"
            style={{ minHeight }}
        >
            {/* Animated shimmer effect */}
            <div className="absolute inset-0">
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                    animate={{
                        x: ["-100%", "100%"],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
            </div>

            {/* Subtle pulse effect */}
            <motion.div
                className="absolute inset-0 bg-primary/5"
                animate={{
                    opacity: [0.05, 0.15, 0.05],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Loading indicator */}
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
            </div>
        </div>
    );
}

// ============================================
// 🎬 SLIDE INDICATORS
// ============================================

function SlideIndicators({
    total,
    current,
    onSelect
}: {
    total: number;
    current: number;
    onSelect: (index: number) => void;
}) {
    if (total <= 1) return null;

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {Array.from({ length: total }).map((_, index) => (
                <button
                    key={index}
                    onClick={() => onSelect(index)}
                    className={`
            w-2 h-2 rounded-full transition-all duration-300
            ${index === current
                            ? 'bg-primary w-6 shadow-[0_0_10px_rgba(229,9,20,0.5)]'
                            : 'bg-white/40 hover:bg-white/60'
                        }
          `}
                    aria-label={`Ir a slide ${index + 1}`}
                />
            ))}
        </div>
    );
}

// ============================================
// 📝 OVERLAY TEXT COMPONENT
// ============================================

function HeroOverlayText({
    title,
    subtitle
}: {
    title?: string;
    subtitle?: string;
}) {
    if (!title && !subtitle) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4"
        >
            {title && (
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)]"
                >
                    {title}
                </motion.h1>
            )}
            {subtitle && (
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="mt-4 text-lg sm:text-xl md:text-2xl text-gray-200 font-medium max-w-2xl drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)]"
                >
                    {subtitle}
                </motion.p>
            )}
        </motion.div>
    );
}

// ============================================
// 🏟️ MAIN HERO BANNER COMPONENT
// ============================================

export default function HeroBanner({
    imageSrc,
    videoSrc,
    slides,
    slideInterval = 5000,
    fallbackImage = "/fondo.jpg",
    minHeight = "30vh", // Más compacto en móvil
    alt = "Hero Banner 90+5",
    categorySlug,
    overlayOpacity = 0.5,
    enableParallax = true,
    parallaxIntensity = 0.3,
    title,
    subtitle,
    children,
    className = "",
    adjacentCategories = [],
}: HeroBannerProps) {
    const containerRef = useRef<HTMLElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [mediaError, setMediaError] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [parallaxOffset, setParallaxOffset] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    // ============================================
    // 📸 PREPARAR SLIDES
    // ============================================

    const preparedSlides: HeroSlide[] = slides && slides.length > 0
        ? slides
        : [{
            imageSrc: imageSrc || (categorySlug ? `/heroes/${categorySlug}.jpg` : fallbackImage),
            videoSrc: videoSrc,
            title: title,
            subtitle: subtitle,
        }];

    const currentSlideData = preparedSlides[currentSlide];

    // ============================================
    // 🎠 CARRUSEL AUTOMÁTICO
    // ============================================

    useEffect(() => {
        if (preparedSlides.length <= 1 || isHovered) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % preparedSlides.length);
        }, slideInterval);

        return () => clearInterval(interval);
    }, [preparedSlides.length, slideInterval, isHovered]);

    // ============================================
    // 🌀 EFECTO PARALLAX
    // ============================================

    useEffect(() => {
        if (!enableParallax) return;

        const handleScroll = () => {
            if (!containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const scrollProgress = -rect.top / (rect.height + window.innerHeight);
            const offset = scrollProgress * 100 * parallaxIntensity;

            // Solo aplicar parallax cuando el hero está visible
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                requestAnimationFrame(() => {
                    setParallaxOffset(Math.max(-30, Math.min(30, offset)));
                });
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll(); // Initial call

        return () => window.removeEventListener("scroll", handleScroll);
    }, [enableParallax, parallaxIntensity]);

    // ============================================
    // 🚀 PRELOAD IMÁGENES ADYACENTES
    // ============================================

    useEffect(() => {
        if (adjacentCategories.length === 0) return;

        adjacentCategories.forEach((category) => {
            const img = new window.Image();
            img.src = `/heroes/${category}.jpg`;
        });
    }, [adjacentCategories]);

    // ============================================
    // 🖼️ PRELOAD SLIDES DEL CARRUSEL
    // ============================================

    useEffect(() => {
        preparedSlides.forEach((slide) => {
            if (slide.imageSrc) {
                const img = new window.Image();
                img.src = slide.imageSrc;
            }
        });
    }, [preparedSlides]);

    // ============================================
    // 📥 HANDLERS
    // ============================================

    const handleMediaLoad = useCallback(() => {
        setIsLoading(false);
        setMediaError(false);
    }, []);

    const handleMediaError = useCallback(() => {
        setIsLoading(false);
        setMediaError(true);
    }, []);

    const goToSlide = useCallback((index: number) => {
        setCurrentSlide(index);
    }, []);

    // Determinar la imagen final a mostrar
    const finalImageSrc = mediaError
        ? fallbackImage
        : (currentSlideData.imageSrc || fallbackImage);

    const hasVideo = !!currentSlideData.videoSrc && !mediaError;

    // ============================================
    // 🎨 RENDER
    // ============================================

    return (
        <section
            ref={containerRef}
            className={`relative z-0 flex flex-col items-center justify-center text-center overflow-hidden ${className}`}
            style={{ minHeight: 'clamp(30vh, 40vw, 45vh)' }} // Responsive height
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Skeleton Loader */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        className="absolute inset-0 z-40"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <HeroSkeleton minHeight={minHeight} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Background Media Container with Parallax */}
            <motion.div
                className="absolute inset-0"
                style={{
                    y: enableParallax ? parallaxOffset : 0,
                    scale: enableParallax ? 1.1 : 1, // Extra scale to prevent edges showing during parallax
                }}
                transition={{ type: "tween", duration: 0 }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`slide-${currentSlide}`}
                        className="absolute inset-0"
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                    >
                        {/* Video Background */}
                        {hasVideo && (
                            <video
                                ref={videoRef}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="absolute inset-0 w-full h-full object-cover"
                                onLoadedData={handleMediaLoad}
                                onError={handleMediaError}
                            >
                                <source
                                    src={currentSlideData.videoSrc}
                                    type={currentSlideData.videoSrc?.endsWith(".webm") ? "video/webm" : "video/mp4"}
                                />
                            </video>
                        )}

                        {/* Image Background */}
                        {!hasVideo && (
                            <Image
                                src={finalImageSrc}
                                alt={alt}
                                fill
                                priority
                                className="object-cover object-center"
                                style={{ objectPosition: 'center 30%' }} // Centrar mejor en móvil
                                onLoad={handleMediaLoad}
                                onError={handleMediaError}
                                sizes="100vw"
                            />
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Gradient Overlays */}
                <div
                    className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#0A0A0A]/70 to-[#150021]/90 pointer-events-none"
                    style={{ opacity: overlayOpacity }}
                />

                {/* Vignette Effect */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)'
                    }}
                />

                {/* Bottom Fade for seamless transition */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
            </motion.div>

            {/* Overlay Text (optional) */}
            <HeroOverlayText
                title={currentSlideData.title}
                subtitle={currentSlideData.subtitle}
            />

            {/* Slide Indicators */}
            <SlideIndicators
                total={preparedSlides.length}
                current={currentSlide}
                onSelect={goToSlide}
            />

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="z-10 px-4 w-full"
            >
                {children}
            </motion.div>

            {/* Progress Bar for Slideshow */}
            {preparedSlides.length > 1 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-30">
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{
                            duration: slideInterval / 1000,
                            ease: "linear",
                            repeat: Infinity,
                        }}
                        key={currentSlide} // Reset animation on slide change
                    />
                </div>
            )}
        </section>
    );
}

// ============================================
// 🏷️ COMPONENTE AUXILIAR PARA CATEGORÍAS
// ============================================

export function CategoryHeroBanner({
    categorySlug,
    minHeight = "30vh",
    adjacentCategories = [],
    children
}: {
    categorySlug: string;
    minHeight?: string;
    adjacentCategories?: string[];
    children?: React.ReactNode;
}) {
    return (
        <HeroBanner
            categorySlug={categorySlug}
            minHeight={minHeight}
            alt={`Hero ${categorySlug}`}
            adjacentCategories={adjacentCategories}
        >
            {children}
        </HeroBanner>
    );
}

// ============================================
// 🎪 COMPONENTE PARA SLIDESHOW PROMOCIONAL
// ============================================

export function PromoHeroBanner({
    slides,
    slideInterval = 5000,
    minHeight = "45vh",
}: {
    slides: HeroSlide[];
    slideInterval?: number;
    minHeight?: string;
}) {
    return (
        <HeroBanner
            slides={slides}
            slideInterval={slideInterval}
            minHeight={minHeight}
            alt="Promociones 90+5"
        />
    );
}
