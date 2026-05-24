"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Globe, Trophy, Star, Flame } from "lucide-react";
import type { SpecialBanner } from "@/lib/types";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    globe: Globe,
    trophy: Trophy,
    star: Star,
    flame: Flame,
};

const SLIDE_INTERVAL = 10000; // 10 seconds

interface SpecialEventBannerProps {
    banners?: SpecialBanner[];
}

export default function SpecialEventBanner({ banners }: SpecialEventBannerProps) {
    if (!banners || banners.length === 0) return null;

    return <SpecialEventCarousel banners={banners} />;
}

function SpecialEventCarousel({ banners }: { banners: SpecialBanner[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [videoFailedMap, setVideoFailedMap] = useState<Record<string, boolean>>({});

    const banner = banners[currentIndex];
    const hasMultiple = banners.length > 1;

    // Auto-advance carousel
    useEffect(() => {
        if (!hasMultiple || isHovered) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, SLIDE_INTERVAL);

        return () => clearInterval(interval);
    }, [banners.length, hasMultiple, isHovered]);

    const goToSlide = useCallback((index: number) => {
        setCurrentIndex(index);
    }, []);

    const handleVideoError = useCallback((bannerId: string) => {
        setVideoFailedMap((prev) => ({ ...prev, [bannerId]: true }));
    }, []);

    const IconComponent = ICON_MAP[banner.badge_secondary_icon] || Globe;
    const videoFailed = videoFailedMap[banner.id] || false;

    return (
        <section
            className="px-4 max-w-7xl mx-auto -mt-6 md:-mt-10 mb-8 relative z-10"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link
                href={banner.link_url || "/catalogo"}
                className="block group relative overflow-hidden rounded-2xl w-full h-auto min-h-[220px] md:min-h-[260px] border border-white/10 shadow-[0_-8px_30px_rgba(0,0,0,0.5),0_20px_50px_rgba(0,0,0,0.4)] bg-black/90 hover:border-white/20 transition-colors duration-500"
            >
                {/* === BACKGROUND LAYERS (crossfade) === */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={banner.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="absolute inset-0 z-0 bg-neutral-900"
                    >
                        {banner.background_video_url && !videoFailed ? (
                            <video
                                key={`video-${banner.id}`}
                                src={banner.background_video_url}
                                autoPlay
                                loop
                                muted
                                playsInline
                                preload="none"
                                poster={banner.background_image_url || undefined}
                                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-[2s] ease-out brightness-75 group-hover:brightness-90"
                                onError={() => handleVideoError(banner.id)}
                            />
                        ) : banner.background_image_url ? (
                            <Image
                                src={banner.background_image_url}
                                alt={banner.title}
                                fill
                                className="object-cover opacity-60 brightness-75"
                            />
                        ) : null}
                        {/* Dark Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
                    </motion.div>
                </AnimatePresence>

                {/* === CONTENT (crossfade) === */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`content-${banner.id}`}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="relative w-full h-full px-5 md:px-12 py-8 md:py-10 flex items-center justify-between z-10"
                    >
                        {/* === LEFT CONTENT === */}
                        <div className="flex flex-col justify-center gap-3 z-10 w-full max-w-4xl">
                            {/* Badges */}
                            {(banner.badge_primary_text || banner.badge_secondary_text) && (
                                <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
                                    {banner.badge_primary_text && (
                                        <span className="px-2 py-[2px] md:px-3 md:py-1 bg-white text-black text-[8px] md:text-xs font-black uppercase tracking-widest rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)] border border-white">
                                            {banner.badge_primary_text}
                                        </span>
                                    )}
                                    {banner.badge_secondary_text && (
                                        <div className="flex items-center gap-1.5 bg-black/40 text-[#FFD700] border border-[#FFD700]/30 backdrop-blur-md px-2 py-0.5 md:px-3 md:py-1 rounded-full shadow-sm">
                                            <IconComponent className="w-3 h-3 fill-current" />
                                            <span className="text-[8px] md:text-[10px] font-bold tracking-wider uppercase">
                                                {banner.badge_secondary_text}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* HEADLINE: LOGO + TITLE */}
                            <div className="flex items-center gap-3 md:gap-6">
                                {banner.logo_url && (
                                    <div className="relative h-12 w-9 md:h-24 md:w-20 flex-shrink-0 drop-shadow-2xl">
                                        <Image
                                            src={banner.logo_url}
                                            alt={banner.title}
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                )}
                                <h2 className="text-4xl md:text-8xl font-black uppercase text-white tracking-tighter drop-shadow-xl leading-none">
                                    {banner.title}
                                </h2>
                            </div>

                            {/* Subtitle */}
                            {banner.subtitle && (
                                <div className="mt-1 md:mt-2">
                                    <p className="text-gray-300 font-medium text-xs md:text-xl tracking-wide max-w-xl pl-1 text-balance">
                                        {banner.subtitle}
                                    </p>
                                </div>
                            )}

                            {/* Mobile CTA */}
                            {banner.button_text && (
                                <div className="md:hidden mt-4 pl-1">
                                    <span className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded-full font-bold uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.3)] w-fit">
                                        <span>{banner.button_text}</span>
                                        <ArrowRight className="w-3 h-3" />
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* === DECORATION IMAGE === */}
                        {banner.decoration_image_url && (
                            <div className="absolute right-[-10px] bottom-[-10px] md:right-10 md:bottom-[-40px] w-28 h-28 md:w-[400px] md:h-[400px] pointer-events-none z-10 md:z-20 opacity-40 md:opacity-100">
                                <div className="w-full h-full relative transition-transform duration-700 ease-out group-hover:scale-110 group-hover:-rotate-3 group-hover:-translate-y-2">
                                    <Image
                                        src={banner.decoration_image_url}
                                        alt=""
                                        fill
                                        className="object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Desktop CTA Button */}
                        {banner.button_text && (
                            <div className="hidden md:flex flex-col justify-end pb-4 h-full z-20 relative">
                                <span className="flex items-center gap-3 bg-white hover:bg-[#f0f0f0] text-black px-8 py-3 rounded-full font-bold uppercase text-sm tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-300 group/btn transform hover:scale-105 active:scale-95">
                                    <span>{banner.button_text}</span>
                                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                </span>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* === SLIDE INDICATORS === */}
                {hasMultiple && (
                    <div className="absolute bottom-3 right-4 md:bottom-5 md:right-8 z-30 flex gap-2">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    goToSlide(index);
                                }}
                                className={`
                                    h-2 rounded-full transition-all duration-300
                                    ${index === currentIndex
                                        ? "bg-white w-6 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                        : "bg-white/30 w-2 hover:bg-white/60"
                                    }
                                `}
                                aria-label={`Ir a banner ${index + 1}`}
                            />
                        ))}
                    </div>
                )}

                {/* === PROGRESS BAR === */}
                {hasMultiple && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10 z-30 rounded-b-2xl overflow-hidden">
                        <motion.div
                            className="h-full bg-white/60"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{
                                duration: SLIDE_INTERVAL / 1000,
                                ease: "linear",
                            }}
                            key={currentIndex}
                        />
                    </div>
                )}
            </Link>
        </section>
    );
}
