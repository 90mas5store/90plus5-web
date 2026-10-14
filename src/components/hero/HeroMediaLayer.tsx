import React from "react";
import Image from "next/image";
import { HeroSlide } from "./types";

interface HeroMediaLayerProps {
    currentSlideIndex: number;
    currentSlideData: HeroSlide;
    finalImageSrc: string;
    alt: string;
    overlayOpacity: number;
    canMountVideo: boolean;
    videoError: boolean;
    useFallbackImage: boolean;
    isVideoReady: boolean;
    prefersReducedMotion: boolean;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    onImageLoad: () => void;
    onImageError: () => void;
    onVideoLoad: () => void;
    onVideoError: () => void;
}

export default function HeroMediaLayer({
    currentSlideIndex,
    currentSlideData,
    finalImageSrc,
    alt,
    overlayOpacity,
    canMountVideo,
    videoError,
    useFallbackImage,
    isVideoReady,
    prefersReducedMotion,
    videoRef,
    onImageLoad,
    onImageError,
    onVideoLoad,
    onVideoError,
}: HeroMediaLayerProps) {
    return (
        <div className="absolute inset-0">
            {/* 1. Base Image Layer - SIEMPRE VISIBLE */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                    .hero-img-${currentSlideIndex} { object-position: ${currentSlideData?.imagePositionMobile || "center center"}; }
                    @media (min-width: 768px) { .hero-img-${currentSlideIndex} { object-position: ${currentSlideData?.imagePositionDesktop || "center center"}; } }
                `,
                }}
            />
            <Image
                key={finalImageSrc}
                src={finalImageSrc}
                alt={alt}
                fill
                priority={true}
                quality={75}
                loading="eager"
                fetchPriority="high"
                className={`object-cover z-0 hero-img-${currentSlideIndex}`}
                onLoad={onImageLoad}
                onError={onImageError}
                sizes="100vw"
                unoptimized={false}
            />

            {/* 2. Video Layer - SUPERPUESTO */}
            {currentSlideData?.videoSrc && canMountVideo && !videoError && !useFallbackImage && (
                <div
                    key={`video-${currentSlideIndex}`}
                    className="absolute inset-0 z-10"
                    style={{ opacity: isVideoReady ? 1 : 0, transition: "opacity 0.5s ease" }}
                >
                    <video
                        ref={videoRef}
                        autoPlay={!prefersReducedMotion}
                        loop
                        muted
                        playsInline
                        preload="none"
                        aria-hidden="true"
                        tabIndex={-1}
                        className="w-full h-full object-cover pointer-events-none"
                        onCanPlay={onVideoLoad}
                        onError={onVideoError}
                    >
                        <source
                            src={currentSlideData?.videoSrc}
                            type={currentSlideData?.videoSrc?.endsWith(".webm") ? "video/webm" : "video/mp4"}
                        />
                    </video>
                </div>
            )}

            {/* Gradient Overlays */}
            <div
                className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#0A0A0A]/70 to-[#150021]/90 pointer-events-none z-20"
                style={{ opacity: overlayOpacity }}
            />

            {/* Vignette Effect */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)",
                }}
            />

            {/* Bottom Fade for seamless transition */}
            <div className="absolute bottom-0 left-0 right-0 h-40 md:h-56 bg-gradient-to-t from-black from-20% via-black/70 via-50% to-transparent pointer-events-none z-20" />
        </div>
    );
}
