"use client";

import React from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import {
    HeroSlide,
    HeroBannerProps,
    HeroSkeleton,
    SlideIndicators,
    HeroOverlayText,
    HeroMediaLayer,
    HeroProgressBar,
    useHeroSlideshow,
} from "./hero";

export default function HeroBanner(props: HeroBannerProps) {
    const {
        minHeight,
        alt = "Hero Banner 90+5",
        overlayOpacity = 0.5,
        slideInterval = 5000,
        className = "",
        children,
    } = props;

    const {
        containerRef,
        videoRef,
        prefersReducedMotion,
        isLoading,
        isInitialMountRef,
        safeCurrentSlide,
        currentSlideData,
        finalImageSrc,
        canMountVideo,
        videoError,
        useFallbackImage,
        isVideoReady,
        preparedSlides,
        setIsHovered,
        handleImageLoad,
        handleImageError,
        handleVideoLoad,
        handleVideoError,
        goToSlide,
    } = useHeroSlideshow(props);

    return (
        <section
            ref={containerRef}
            className={`relative z-0 flex flex-col items-center justify-center text-center overflow-hidden ${className} ${
                !minHeight ? "min-h-[55dvh] md:min-h-[60dvh]" : ""
            }`}
            style={minHeight ? { minHeight } : undefined}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Skeleton Loader - Only show if not initial mount to avoid LCP delay */}
            <AnimatePresence>
                {isLoading && !isInitialMountRef.current && (
                    <motion.div
                        className="absolute inset-0 z-40"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <HeroSkeleton minHeight={minHeight} className={!minHeight ? "h-full" : undefined} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Background Media Container (Image, Video, Gradients) */}
            <HeroMediaLayer
                currentSlideIndex={safeCurrentSlide}
                currentSlideData={currentSlideData}
                finalImageSrc={finalImageSrc}
                alt={alt}
                overlayOpacity={overlayOpacity}
                canMountVideo={canMountVideo}
                videoError={videoError}
                useFallbackImage={useFallbackImage}
                isVideoReady={isVideoReady}
                prefersReducedMotion={prefersReducedMotion}
                videoRef={videoRef}
                onImageLoad={handleImageLoad}
                onImageError={handleImageError}
                onVideoLoad={handleVideoLoad}
                onVideoError={handleVideoError}
            />

            {/* Overlay Text + CTA Button */}
            <HeroOverlayText
                title={currentSlideData?.title}
                subtitle={currentSlideData?.subtitle}
                buttonText={currentSlideData?.buttonText}
                showButton={currentSlideData?.showButton}
                link={currentSlideData?.link}
            />

            {/* Slide Indicators */}
            <SlideIndicators
                total={preparedSlides.length}
                current={safeCurrentSlide}
                onSelect={goToSlide}
            />

            {/* Custom Content */}
            <div className="z-10 px-4 w-full">{children}</div>

            {/* Progress Bar for Slideshow */}
            <HeroProgressBar
                totalSlides={preparedSlides.length}
                currentSlide={safeCurrentSlide}
                slideInterval={slideInterval}
            />
        </section>
    );
}

export function CategoryHeroBanner({
    categorySlug,
    minHeight,
    adjacentCategories = [],
    imagePositionDesktop,
    imagePositionMobile,
    children,
}: {
    categorySlug: string;
    minHeight?: string;
    adjacentCategories?: string[];
    imagePositionDesktop?: string;
    imagePositionMobile?: string;
    children?: React.ReactNode;
}) {
    return (
        <HeroBanner
            categorySlug={categorySlug}
            minHeight={minHeight}
            alt={`Hero ${categorySlug}`}
            adjacentCategories={adjacentCategories}
            imagePositionDesktop={imagePositionDesktop}
            imagePositionMobile={imagePositionMobile}
        >
            {children}
        </HeroBanner>
    );
}

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

export type { HeroSlide, HeroBannerProps };
