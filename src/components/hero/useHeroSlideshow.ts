import { useRef, useState, useEffect, useCallback } from "react";
import { usePrefersReducedMotion } from "@/hooks/useOptimization";
import {
    HeroSlide,
    HeroBannerProps,
    SLUGS_WITH_VIDEO,
    SLUGS_WITH_HERO_IMAGE,
} from "./types";

export function useHeroSlideshow(props: HeroBannerProps) {
    const {
        imageSrc,
        videoSrc,
        slides,
        slideInterval = 5000,
        fallbackImage = "/heroes/default.jpg",
        categorySlug,
        enableParallax = true,
        parallaxIntensity = 0.3,
        imagePositionDesktop,
        imagePositionMobile,
        title,
        subtitle,
        adjacentCategories = [],
    } = props;

    const containerRef = useRef<HTMLElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const prefersReducedMotion = usePrefersReducedMotion();

    // Check if this resource was previously loaded (cache hint)
    const getCacheKey = useCallback(() => {
        if (slides && slides.length > 0) return `hero_${slides[0].imageSrc}`;
        if (categorySlug) return `hero_${categorySlug}`;
        return "hero_default";
    }, [slides, categorySlug]);

    const [isLoading, setIsLoading] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const [isVideoReady, setIsVideoReady] = useState(false);
    const [useFallbackImage, setUseFallbackImage] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [parallaxOffset, setParallaxOffset] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [canMountVideo, setCanMountVideo] = useState(false);

    // Ref para evitar setState síncrono en effect durante el montaje inicial
    const isInitialMountRef = useRef(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setCanMountVideo(true);
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

    // Normalizar slug de categoría para mapear variantes como mundial-2026 -> mundial2026
    const cleanCategorySlug = categorySlug?.toLowerCase().trim();
    const normalizedHeroSlug =
        cleanCategorySlug === "mundial-2026" || cleanCategorySlug === "mundial"
            ? "mundial2026"
            : cleanCategorySlug;

    const defaultHeroImage =
        normalizedHeroSlug && SLUGS_WITH_HERO_IMAGE.includes(normalizedHeroSlug)
            ? `/heroes/${normalizedHeroSlug}.jpg`
            : fallbackImage;

    const preparedSlides: HeroSlide[] =
        slides && slides.length > 0
            ? slides
            : [
                  {
                      imageSrc: imageSrc || defaultHeroImage,
                      videoSrc:
                          videoSrc ||
                          (cleanCategorySlug && SLUGS_WITH_VIDEO.includes(cleanCategorySlug)
                              ? `/heroes/mundial2026.mp4`
                              : undefined),
                      title: title,
                      subtitle: subtitle,
                      imagePositionDesktop: imagePositionDesktop,
                      imagePositionMobile: imagePositionMobile,
                  },
              ];

    const safeCurrentSlide =
        currentSlide >= 0 && currentSlide < preparedSlides.length ? currentSlide : 0;
    const currentSlideData = preparedSlides[safeCurrentSlide] || preparedSlides[0] || {};

    // Determinar la imagen final (si el video falla o no hay video)
    const finalImageSrc = useFallbackImage
        ? fallbackImage
        : currentSlideData?.imageSrc || fallbackImage;

    useEffect(() => {
        const cacheKey = getCacheKey();
        const wasCached =
            typeof window !== "undefined" ? sessionStorage.getItem(cacheKey) === "loaded" : false;

        const shouldShowLoading = !isInitialMountRef.current && !wasCached;
        isInitialMountRef.current = false;

        const id = setTimeout(() => {
            if (shouldShowLoading) setIsLoading(true);
            else if (wasCached) setIsLoading(false);
            setVideoError(false);
            setIsVideoReady(false);
            setUseFallbackImage(false);
            setCurrentSlide(0);
        }, 0);
        return () => clearTimeout(id);
    }, [categorySlug, imageSrc, videoSrc, slides, getCacheKey]);

    // Asegurar que si preparedSlides cambia de longitud, currentSlide no quede desfasado
    useEffect(() => {
        if (currentSlide >= preparedSlides.length) {
            setCurrentSlide(0);
        }
    }, [currentSlide, preparedSlides.length]);

    // Carrusel automático
    useEffect(() => {
        if (preparedSlides.length <= 1 || isHovered) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % preparedSlides.length);
            setVideoError(false);
        }, slideInterval);

        return () => clearInterval(interval);
    }, [preparedSlides.length, slideInterval, isHovered]);

    // Efecto Parallax
    useEffect(() => {
        if (!enableParallax) return;

        let rafPending = false;

        const handleScroll = () => {
            if (!containerRef.current || rafPending) return;

            rafPending = true;
            requestAnimationFrame(() => {
                rafPending = false;
                if (!containerRef.current) return;
                const rect = containerRef.current.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    const scrollProgress = -rect.top / (rect.height + window.innerHeight);
                    const offset = scrollProgress * 100 * parallaxIntensity;
                    setParallaxOffset(Math.max(-30, Math.min(30, offset)));
                }
            });
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener("scroll", handleScroll);
    }, [enableParallax, parallaxIntensity]);

    // Preload imágenes adyacentes
    useEffect(() => {
        if (adjacentCategories.length === 0) return;

        const timer = setTimeout(() => {
            adjacentCategories.forEach((category) => {
                const clean = category.toLowerCase().trim();
                const normalized =
                    clean === "mundial-2026" || clean === "mundial" ? "mundial2026" : clean;
                if (SLUGS_WITH_HERO_IMAGE.includes(normalized)) {
                    const img = new window.Image();
                    img.src = `/heroes/${normalized}.jpg`;
                }
            });
        }, 2000);
        return () => clearTimeout(timer);
    }, [adjacentCategories]);

    // Timeout de seguridad si onLoad nunca dispara
    useEffect(() => {
        if (!isLoading) return;
        const timer = setTimeout(() => {
            setIsLoading(false);
            if (typeof window !== "undefined") {
                sessionStorage.setItem(getCacheKey(), "loaded");
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [isLoading, getCacheKey]);

    const handleImageLoad = useCallback(() => {
        setIsLoading(false);
        if (typeof window !== "undefined") {
            sessionStorage.setItem(getCacheKey(), "loaded");
        }
    }, [getCacheKey]);

    const handleImageError = useCallback(() => {
        console.warn("Error loading hero image, switching to fallback.");
        setUseFallbackImage(true);
        setIsLoading(false);
    }, []);

    const handleVideoLoad = useCallback(() => {
        setIsVideoReady(true);
    }, []);

    const handleVideoError = useCallback(() => {
        console.warn("Video failed to load (404/Error) - Keeping image");
        setVideoError(true);
    }, []);

    const goToSlide = useCallback((index: number) => {
        setCurrentSlide(index);
        setVideoError(false);
        setIsVideoReady(false);
        setUseFallbackImage(false);
        setIsLoading(true);
    }, []);

    return {
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
        isHovered,
        setIsHovered,
        parallaxOffset,
        handleImageLoad,
        handleImageError,
        handleVideoLoad,
        handleVideoError,
        goToSlide,
    };
}
