import { Suspense } from "react";
import HomeClient from "../components/HomeClient";
import { getBannersServer, getConfigServer, getFeaturedServer } from "../lib/api-server";
import { Metadata } from "next";

// 🚀 Optimización: Revalidación cada hora (ISR)
export const revalidate = 3600;

export const metadata: Metadata = {
    alternates: { canonical: "https://90mas5.store" },
};

export default async function Home() {
    // 🚀 Cargar datos en PARALELO desde el servidor
    // Esto elimina el tiempo de espera de red en el cliente (Waterfall)
    const [featuredData, configData, bannersData] = await Promise.all([
        getFeaturedServer(),
        getConfigServer(),
        getBannersServer()
    ]);

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

    // Filtrar "Mundial 2026" y normalizar para props
    const normalize = (s: string) =>
        (s || "").toString().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

    ligasProcesadas = ligasProcesadas.filter(l => !normalize(l.nombre).includes("mundial"));

    return (
        <HomeClient
            initialDestacados={featuredData || []}
            initialBanners={bannersData || []}
            initialLigas={ligasProcesadas}
            initialCategorias={configData?.categorias || []}
        />
    );
}
