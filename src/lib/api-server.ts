import { createClient } from "@supabase/supabase-js";
import { Product, Config } from "./types";

// ✅ Cliente seguro para Server Components (solo necesita URL + ANON KEY para datos públicos)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * 🔄 Adaptador de datos de Supabase a nuestra interfaz Product
 * (Duplicado intencionalmente para evitar importar dependencias de cliente desde lib/api.ts)
 */
function adaptSupabaseProductToProduct(raw: any): Product {
    const variants = raw.product_variants || [];

    const basePrice =
        variants.length > 0
            ? Math.min(...variants.filter((v: any) => v.active).map((v: any) => v.price))
            : 0;

    return {
        id: raw.id,
        slug: raw.slug,
        equipo: raw.teams?.name ?? "",
        logoEquipo: raw.teams?.logo_url ?? null,
        modelo: raw.name,
        precio: basePrice,
        imagen: raw.image_url,
        destacado: raw.featured ?? false,
        team_id: raw.team_id,
        category_id: raw.category_id,
        league_id: raw.league_id,
        league_ids: raw.product_leagues?.map((pl: any) => pl.league_id) || (raw.league_id ? [raw.league_id] : []),
        sort_order: raw.sort_order || 0,
        product_variants: variants.map((v: any) => ({
            id: v.id,
            version: v.version,
            price: v.price,
            active: v.active,
            original_price: v.original_price,
            active_original_price: v.active_original_price
        })),
    };
}

/** ⭐ Obtener productos destacados (Server Side) */
export async function getFeaturedServer(): Promise<Product[]> {
    const { data, error } = await supabase
        .from("products")
        .select(`
            id,
            name,
            slug,
            image_url,
            featured,
            sort_order,
            team_id,
            category_id,
            league_id,
            teams(
                id,
                name,
                logo_url
            ),
            product_variants(
                id,
                version,
                price,
                active
            ),
            product_leagues(
                league_id
            )
        `)
        .eq("active", true)
        .eq("featured", true)
        .order("sort_order", { ascending: true });

    if (error) {
        console.error("Error fetching featured from Supabase (Server):", error);
        return [];
    }

    return data.map(adaptSupabaseProductToProduct);
}

/** ⚙️ Obtener configuración global (Server Side) */
export async function getConfigServer(): Promise<Config> {
    const [
        { data: categories, error: catError },
        { data: leagues, error: leagueError },
    ] = await Promise.all([
        supabase
            .from("categories")
            .select("id,name,slug,order_index,icon_url")
            .eq("active", true)
            .order("order_index"),

        supabase
            .from("leagues")
            .select("id,name,slug,image_url,category_id")
            .eq("active", true)
            .order("sort_order", { ascending: true }),
    ]);

    if (catError) console.error("Error fetching categories (Server):", catError);
    if (leagueError) console.error("Error fetching leagues (Server):", leagueError);

    // Adaptar categorías
    const adaptedCategorias = (categories ?? []).map((cat: any) => ({
        id: cat.id,
        nombre: cat.name,
        slug: cat.slug,
        order: cat.order_index,
        icon_url: cat.icon_url,
    }));

    // Adaptar ligas
    const adaptedLigas = (leagues ?? []).map((league: any) => ({
        id: league.id,
        nombre: league.name,
        slug: league.slug,
        imagen: league.image_url ?? "",
        category_id: league.category_id,
    }));

    return {
        categorias: adaptedCategorias,
        ligas: adaptedLigas,
    } as Config;
}

/** 🖼️ Obtener Banners Home (Server Side) */
export async function getBannersServer() {
    const { data, error } = await supabase
        .from("banners")
        .select("id, title, description, image_url, video_url, link_url, button_text")
        .eq("active", true)
        .eq("show_on_home", true)
        .order("sort_order", { ascending: true });

    if (error) {
        console.error("Error fetching banners (Server):", error);
        return [];
    }
    return data;
}
