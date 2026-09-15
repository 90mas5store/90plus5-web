import { Suspense } from "react";
import HomeClient from "../components/HomeClient";
import { getBannersServer, getConfigServer, getFeaturedServer, getSpecialBannersServer } from "../lib/api-server";
import { Metadata } from "next";
import { SITE_URL } from "@/lib/config/site";

// 🚀 Optimización: Revalidación cada hora (ISR)
export const revalidate = 3600;

export const metadata: Metadata = {
    title: "90+5 Store | Tienda Deportiva en Tegucigalpa · Camisetas de Fútbol en Honduras",
    description: "La mejor tienda deportiva online en Honduras  en Tegucigalpa. Camisetas oficiales 2026/27 versión jugador y aficionado bajo pedido (3 a 5 semanas) y envíos seguros a toda Honduras.",
    alternates: { canonical: SITE_URL },
};

export default async function Home() {
    // 🚀 Cargar datos en PARALELO desde el servidor
    // Esto elimina el tiempo de espera de red en el cliente (Waterfall)
    const [featuredData, configData, bannersData, specialBannersData] = await Promise.all([
        getFeaturedServer(),
        getConfigServer(),
        getBannersServer(),
        getSpecialBannersServer()
    ]);

    // 🚀 Preload hero image: el browser descarga antes de que React hidrate
    const firstBannerImage = bannersData?.[0]?.image_url as string | undefined;

    const normalize = (s: string) =>
        (s || "").toString().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

    // Procesar ligas (Lógica servida directamente ya procesada)
    let ligasProcesadas: import('@/lib/types').League[] = [];
    if (configData?.ligas?.length) {
        ligasProcesadas = configData.ligas;
    } else {
        // Fallback legacy (si no hay config, inferir de destacados - poco probable con la nueva API)
        const ligasUnicas = [
            ...new Set(
                (featuredData || []).map((p) => (p as any).liga).filter(Boolean)
            ),
        ].map((l) => ({
            id: normalize(l as string),
            nombre: l as string,
            slug: normalize(l as string),
            imagen: ""
        }));
        ligasProcesadas = ligasUnicas;
    }

    // Filtrar ligas visibles en Home y activas (configurables desde el panel de administración)
    ligasProcesadas = ligasProcesadas.filter(l => {
        const isVisibleInHome = l.show_in_home ?? l.show_on_home ?? true;
        const isActive = l.active ?? true;
        return isVisibleInHome && isActive;
    });

    return (
        <HomeClient
            initialDestacados={featuredData || []}
            initialBanners={bannersData || []}
            initialSpecialBanners={specialBannersData || []}
            initialLigas={ligasProcesadas}
            initialCategorias={configData?.categorias || []}
        />
    );
}
