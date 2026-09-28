import HomeClient from "../components/HomeClient";
import {
    getBannersServer,
    getFeaturedServer,
    getBestSellersServer,
    getNewArrivalsServer,
    getOnSaleServer,
    getSpecialBannersServer
} from "../lib/api-server";
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
        specialBannersData
    ] = await Promise.all([
        getFeaturedServer(),
        getBestSellersServer(),
        getNewArrivalsServer(),
        getOnSaleServer(),
        getBannersServer(),
        getSpecialBannersServer()
    ]);

    return (
        <HomeClient
            initialDestacados={featuredData || []}
            initialBestSellers={bestSellersData || []}
            initialNewArrivals={newArrivalsData || []}
            initialOnSale={onSaleData || []}
            initialBanners={bannersData || []}
            initialSpecialBanners={specialBannersData || []}
        />
    );
}
