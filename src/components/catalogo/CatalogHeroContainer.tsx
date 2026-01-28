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
        const cacheKey = `banner_cache_${bannerContextKey}`;
        let mounted = true;

        async function findBanners() {
            // 0. Intentar Cache Local (Instantáneo)
            try {
                const cached = sessionStorage.getItem(cacheKey);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (parsed && Array.isArray(parsed) && parsed.length > 0) {
                        setDynamicSlides(parsed);
                        setLoading(false); // Ya mostramos algo, adiós skeleton
                    }
                }
            } catch (e) { /* ignore */ }

            // 1. Construir link (usamos la misma lógica de prioridad)
            let targetLink = "/catalogo";

            // Usamos la misma lógica que antes, pero dentro del efecto controlado por contextKey
            if (categorySlug) {
                // Si hay categoría, buscamos banner de esa categoría e IGNORAMOS la liga
                targetLink += `?categoria=${categorySlug}`;
            } else if (leagueSlug) {
                // Solo si NO hay categoría, intentamos buscar por liga (fallback)
                targetLink += `?liga=${leagueSlug}`;
            } else {
                if (mounted) setLoading(false);
                return;
            }

            try {
                // 2. Buscar banners activos
                const { data } = await supabase
                    .from("banners")
                    .select("title, description, image_url, video_url, button_text, link_url, sort_order")
                    .eq("active", true)
                    .ilike("link_url", `%${targetLink}%`) // Búsqueda simple y directa
                    .order("sort_order", { ascending: true })
                    .limit(5);

                if (!mounted) return;

                if (data && data.length > 0) {
                    const mappedSlides = data.map(b => ({
                        imageSrc: b.image_url,
                        videoSrc: b.video_url, // ✅ Video Support
                        title: b.title,
                        subtitle: b.description,
                        link: b.link_url,
                        buttonText: b.button_text || "Ver Más"
                    }));
                    setDynamicSlides(mappedSlides);
                    // 3. Guardar en Cache
                    try { sessionStorage.setItem(cacheKey, JSON.stringify(mappedSlides)); } catch (e) { }
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
    }, [bannerContextKey]); // ✅ MAGIA AQUÍ: Solo recarga si cambia la "clave" principal

    // A) Si encontramos banners (1 o varios), mostramos Carrusel/Hero Dinámico
    if (dynamicSlides.length > 0) {
        return (
            <HeroBanner
                slides={dynamicSlides}
                slideInterval={5000} // Rotación automática
                className="min-h-[35vh] md:min-h-[55vh] mb-4"
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
            categorySlug={categorySlug || leagueSlug || "catalogo"}
            className="min-h-[35vh] md:min-h-[55vh] mb-4"
            alt={categoryName || "Catálogo 90+5 Store"}
            overlayOpacity={0.6}
            adjacentCategories={adjacentCategories}
            enableParallax={!prefersReducedMotion}
        />
    );
}
