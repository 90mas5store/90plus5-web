import React from "react";

export interface HeroSlide {
    imageSrc?: string;
    videoSrc?: string;
    title?: string;
    subtitle?: string;
    link?: string;
    buttonText?: string;
    showButton?: boolean;
    imagePositionDesktop?: string;
    imagePositionMobile?: string;
}

export interface HeroBannerProps {
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
    /** Posición focal de imagen en desktop (CSS object-position, ej: "50% 40%") */
    imagePositionDesktop?: string;
    /** Posición focal de imagen en mobile (CSS object-position, ej: "50% 50%") */
    imagePositionMobile?: string;
    /** Children opcionales (para renderizar contenido encima) */
    children?: React.ReactNode;
    /** Clases adicionales */
    className?: string;
    /** Categorías adyacentes para preload */
    adjacentCategories?: string[];
}

export const SLUGS_WITH_VIDEO = ["mundial2026", "mundial-2026", "mundial"];

export const SLUGS_WITH_HERO_IMAGE = [
    "mundial2026",
    "mundial-2026",
    "mundial",
    "futbol",
    "retro",
    "streetwear-retro",
    "tenis",
    "formula1",
    "home",
    "default",
    "uefa",
];
