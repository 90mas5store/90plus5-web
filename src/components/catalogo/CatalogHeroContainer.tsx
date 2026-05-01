"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import HeroBanner from "@/components/HeroBanner";

interface Props {
    categorySlug?: string | null;
    leagueSlug?: string | null;
    categoryName?: string;
    adjacentCategories?: string[];
    prefersReducedMotion?: boolean;
    imagePositionDesktop?: string;
    imagePositionMobile?: string;
}

export default function CatalogHeroContainer({
    categorySlug,
    leagueSlug,
    categoryName,
    adjacentCategories,
    prefersReducedMotion = false,
    imagePositionDesktop,
    imagePositionMobile,
}: Props) {
    const [dynamicSlides, setDynamicSlides] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const bannerContextKey = categorySlug || leagueSlug;

    useEffect(() => {
        let mounted = true;

        async function findBanners() {
            let targetLink = "/catalogo";
            if (categorySlug) targetLink += `?categoria=${categorySlug}`;
            else if (leagueSlug) targetLink += `?liga=${leagueSlug}`;

            try {
                let query = supabase
                    .from("banners")
                    .select("title, description, image_url, video_url, button_text, show_button, link_url, sort_order, image_position_desktop, image_position_mobile")
                    .eq("active", true)
                    .order("sort_order", { ascending: true })
                    .limit(5);

                if (targetLink === "/catalogo") {
                    query = query.eq("link_url", "/catalogo");
                } else {
                    query = query.ilike("link_url", `%${targetLink}%`);
                }

                const { data } = await query;

                if (!mounted) return;

                if (data && data.length > 0) {
                    setDynamicSlides(data.map(b => ({
                        imageSrc: b.image_url,
                        videoSrc: b.video_url,
                        title: b.title,
                        subtitle: b.description,
                        link: b.link_url,
                        buttonText: b.button_text,
                        showButton: b.show_button ?? false,
                        imagePositionDesktop: b.image_position_desktop || imagePositionDesktop || '50% 40%',
                        imagePositionMobile: b.image_position_mobile || imagePositionMobile || '50% 50%',
                    })));
                } else {
                    setDynamicSlides([]);
                }
            } catch (e) {
                // ignorar error
            } finally {
                if (mounted) setLoading(false);
            }
        }

        findBanners();
        return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bannerContextKey]);

    if (dynamicSlides.length > 0) {
        return (
            <HeroBanner
                slides={dynamicSlides}
                slideInterval={5000}
                className="min-h-[55dvh] md:min-h-[60dvh] mb-4"
                alt={categoryName || "Catálogo"}
                overlayOpacity={0.6}
                adjacentCategories={adjacentCategories}
                enableParallax={!prefersReducedMotion}
            />
        );
    }

    return (
        <HeroBanner
            categorySlug={categorySlug || leagueSlug || "default"}
            className="min-h-[55dvh] md:min-h-[60dvh] mb-4"
            alt={categoryName || "Catálogo 90+5 Store"}
            overlayOpacity={0.6}
            adjacentCategories={adjacentCategories}
            enableParallax={!prefersReducedMotion}
            imagePositionDesktop={imagePositionDesktop || '50% 40%'}
            imagePositionMobile={imagePositionMobile || '50% 50%'}
        />
    );
}
