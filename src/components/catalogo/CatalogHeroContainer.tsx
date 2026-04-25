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
}

export default function CatalogHeroContainer({
    categorySlug,
    leagueSlug,
    categoryName,
    adjacentCategories,
    prefersReducedMotion = false
}: Props) {
    const [dynamicSlides, setDynamicSlides] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    // Clave para evitar recargas innecesarias:
    // Si hay categoría, esa es la clave. Si no, la liga.
    // Al filtrar por liga DENTRO de una categoría, esta clave NO cambia, 
    // por lo tanto el efecto NO corre y el banner NO parpadea.
    const bannerContextKey = categorySlug || leagueSlug;

    useEffect(() => {
        let mounted = true;

        async function findBanners() {
            // Construir link según contexto
            let targetLink = "/catalogo";

            if (categorySlug) {
                targetLink += `?categoria=${categorySlug}`;
            } else if (leagueSlug) {
                targetLink += `?liga=${leagueSlug}`;
            }

            try {
                let query = supabase
                    .from("banners")
                    .select("title, description, image_url, video_url, button_text, link_url, sort_order")
                    .eq("active", true)
                    .order("sort_order", { ascending: true })
                    .limit(5);

                // Para /catalogo exacto usamos eq para no matchear /catalogo?categoria=X
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
                        buttonText: b.button_text || "Ver Más"
                    })));
                } else {
                    setDynamicSlides([]);
                }
            } catch (e) {
                // Ignorar error
            } finally {
                if (mounted) setLoading(false);
            }
        }

        findBanners();

        return () => { mounted = false; };
    // categorySlug, leagueSlug, supabase omitted: bannerContextKey already encapsulates them
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bannerContextKey]);

    // A) Si encontramos banners (1 o varios), mostramos Carrusel/Hero Dinámico
    if (dynamicSlides.length > 0) {
        return (
            <HeroBanner
                slides={dynamicSlides}
                slideInterval={5000} // Rotación automática
                className="min-h-[35dvh] md:min-h-[55dvh] mb-4"
                alt={categoryName || "Catálogo"}
                overlayOpacity={0.6}
                adjacentCategories={adjacentCategories}
                enableParallax={!prefersReducedMotion}
            />
        );
    }

    // Fallback: Lógica original (buscar imagen en local file system por slug)
    return (
        <HeroBanner
            categorySlug={categorySlug || leagueSlug || "default"}
            className="min-h-[35dvh] md:min-h-[55dvh] mb-4"
            alt={categoryName || "Catálogo 90+5 Store"}
            overlayOpacity={0.6}
            adjacentCategories={adjacentCategories}
            enableParallax={!prefersReducedMotion}
        />
    );
}
