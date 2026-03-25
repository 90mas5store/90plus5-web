import { Suspense } from "react";
import HomeClient from "../components/HomeClient";
import { getBannersServer, getConfigServer, getFeaturedServer } from "../lib/api-server";

// 🚀 Optimización: Revalidación cada hora (ISR)
// ⚠️ TEMPORAL: 0 para desarrollo - cambiar a 3600 en producción
export const revalidate = 3600;

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
