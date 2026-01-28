"use client";

import HeroBanner from "./HeroBanner";
import { usePrefersReducedMotion } from "@/hooks/useOptimization";

interface Banner {
    id: string;
    title: string;
    description: string;
    image_url: string;
    video_url?: string;
    link_url: string;
    button_text: string;
    sort_order: number;
}

interface HomeBannerContainerProps {
    initialBanners?: any[];
}

export default function HomeBannerContainer({ initialBanners }: HomeBannerContainerProps) {
    const prefersReducedMotion = usePrefersReducedMotion();

    // Map initialBanners from Server to HeroSlide format
    const slides = initialBanners?.map((b: any) => ({
        imageSrc: b.image_url,
        videoSrc: b.video_url,
        title: b.title,
        subtitle: b.description,
        link: b.link_url,
        buttonText: b.button_text
    })) || [];

    // Si no hay slides, mostrar fallback
    if (slides.length === 0) {
        return (
            <HeroBanner
                categorySlug="home"
                className="min-h-[35vh] md:min-h-[55vh]"
                alt="90+5 Store Hero"
                overlayOpacity={0.6}
                enableParallax={!prefersReducedMotion}
            />
        );
    }

    return (
        <HeroBanner
            slides={slides}
            slideInterval={6000}
            className="min-h-[35vh] md:min-h-[55vh]"
            alt="90+5 Store Hero"
            overlayOpacity={0.6}
            enableParallax={!prefersReducedMotion}
        />
    );
}
