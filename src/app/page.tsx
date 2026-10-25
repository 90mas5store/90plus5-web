import HomeClient from "../components/HomeClient";
import {
    getBannersServer,
    getFeaturedServer,
    getBestSellersServer,
    getNewArrivalsServer,
    getOnSaleServer,
    getSpecialBannersServer,
    getConfigServer
} from "../lib/api-server";
import { getHeroShowcaseSettings } from "@/lib/heroSettings";
import { getMarqueeSettings } from "@/lib/marqueeSettings";
import { getHomeStylesSettings } from "@/lib/homeStylesSettings";
import { Metadata } from "next";
import { SITE_URL } from "@/lib/config/site";

// 🚀 Optimización: Revalidación cada hora (ISR)
export const revalidate = 3600;

export const metadata: Metadata = {
    title: "90+5 Store | Tienda Deportiva en Tegucigalpa · Camisetas de Fútbol en Honduras",
    description: "La mejor tienda deportiva online en Honduras en Tegucigalpa. Camisetas oficiales versión jugador y aficionado bajo pedido y envíos seguros a toda Honduras.",
    alternates: { canonical: SITE_URL },
};

export default async function Home() {
    // 🚀 Cargar datos en PARALELO desde el servidor
    const [
        featuredData,
        bestSellersData,
        newArrivalsData,
        onSaleData,
        bannersData,
        specialBannersData,
        configData,
        heroShowcaseData,
        marqueeSettingsData,
        homeStylesData,
    ] = await Promise.all([
        getFeaturedServer(),
        getBestSellersServer(),
        getNewArrivalsServer(),
        getOnSaleServer(),
        getBannersServer(),
        getSpecialBannersServer(),
        getConfigServer(),
        getHeroShowcaseSettings(),
        getMarqueeSettings(),
        getHomeStylesSettings(),
    ]);

    return (
        <HomeClient
            initialDestacados={featuredData || []}
            initialBestSellers={bestSellersData || []}
            initialNewArrivals={newArrivalsData || []}
            initialOnSale={onSaleData || []}
            initialBanners={bannersData || []}
            initialSpecialBanners={specialBannersData || []}
            initialLigas={configData?.ligas || []}
            initialCategorias={configData?.categorias || []}
            initialHeroSettings={heroShowcaseData}
            initialMarqueeSettings={marqueeSettingsData}
            initialStylesSettings={homeStylesData}
        />
    );
}
