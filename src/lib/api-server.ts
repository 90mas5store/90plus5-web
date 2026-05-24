import { createClient } from "@supabase/supabase-js";
import { Product, Brand, Config, SupabaseRawProduct } from "./types";

// ✅ Cliente seguro para Server Components (solo necesita URL + ANON KEY para datos públicos)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * 🔄 Adaptador de datos de Supabase a nuestra interfaz Product
 * (Duplicado intencionalmente para evitar importar dependencias de cliente desde lib/api.ts)
 */
function adaptSupabaseProductToProduct(raw: SupabaseRawProduct): Product {
    const variants = raw.product_variants || [];

    const basePrice =
        variants.length > 0
            ? Math.min(...variants.filter(v => v.active).map(v => v.price))
            : 0;

    const teams = Array.isArray(raw.teams) ? raw.teams[0] : raw.teams;
    const brand = Array.isArray(raw.brands) ? raw.brands[0] : raw.brands ?? null;

    return {
        id: raw.id,
        slug: raw.slug,
        equipo: teams?.name ?? "",
        logoEquipo: teams?.logo_url ?? undefined,
        modelo: raw.name,
        precio: basePrice,
        imagen: raw.image_url,
        destacado: raw.featured ?? false,
        team_id: raw.team_id,
        category_id: raw.category_id,
        league_id: raw.league_id,
        league_ids: raw.product_leagues?.map(pl => pl.league_id) || (raw.league_id ? [raw.league_id] : []),
        brand_id: raw.brand_id ?? null,
        brand_name: brand?.name ?? null,
        brand_logo: brand?.logo_url ?? null,
        sort_order: raw.sort_order || 0,
        product_variants: variants.map(v => ({
            id: v.id,
            version: v.version,
            price: v.price,
            active: v.active,
            original_price: v.original_price,
            active_original_price: v.active_original_price
        })),
    };
}
/** ⭐ Obtener productos destacados (Server Side) - USA SORT_ORDER MANUAL */
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
            brand_id,
            teams(
                id,
                name,
                logo_url
            ),
            brands(
                name,
                slug,
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

    // ✅ NO aplicamos sort - respetamos el orden de la BD
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
            .select("id,name,slug,order_index,icon_url,hero_image_position_desktop,hero_image_position_mobile")
            .eq("active", true)
            .order("order_index", { ascending: true }),

        supabase
            .from("leagues")
            .select("id,name,slug,image_url,category_id,hero_image_position_desktop,hero_image_position_mobile")
            .eq("active", true)
            .order("sort_order", { ascending: true }),
    ]);

    if (catError) {
        console.error("Error fetching categories:", catError);
        throw catError;
    }

    if (leagueError) {
        console.error("Error fetching leagues:", leagueError);
        throw leagueError;
    }

    const adaptedCategorias = (categories ?? []).map((cat: Record<string, unknown>) => ({
        id: cat.id,
        nombre: cat.name,
        slug: cat.slug,
        order: cat.order_index,
        icon_url: cat.icon_url,
        hero_image_position_desktop: cat.hero_image_position_desktop,
        hero_image_position_mobile: cat.hero_image_position_mobile,
    }));

    const adaptedLigas = (leagues ?? []).map((league: Record<string, unknown>) => ({
        id: league.id,
        nombre: league.name,
        slug: league.slug,
        imagen: league.image_url ?? "",
        category_id: league.category_id,
        hero_image_position_desktop: league.hero_image_position_desktop,
        hero_image_position_mobile: league.hero_image_position_mobile,
    }));

    const { data: brands, error: brandError } = await supabase
        .from("brands")
        .select("id, name, slug, logo_url, sort_order")
        .eq("active", true)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true });

    if (brandError) {
        console.error("Error fetching brands:", brandError);
    }

    const adaptedMarcas: Brand[] = (brands ?? []).map((b: Record<string, unknown>) => ({
        id: b.id as string,
        name: b.name as string,
        slug: b.slug as string,
        logo_url: (b.logo_url as string) ?? null,
        sort_order: (b.sort_order as number) ?? 0,
    }));

    return {
        categorias: adaptedCategorias,
        ligas: adaptedLigas,
        marcas: adaptedMarcas,
    } as Config;
}

/** 🏆 Obtener Special Banners / Eventos (Server Side) */
export async function getSpecialBannersServer() {
    const { data, error } = await supabase
        .from("special_banners")
        .select("id, title, subtitle, link_url, background_image_url, background_video_url, logo_url, decoration_image_url, badge_primary_text, badge_secondary_text, badge_secondary_icon, button_text")
        .eq("active", true)
        .order("sort_order", { ascending: true });

    if (error) {
        console.error("Error fetching special banners:", error);
        return [];
    }

    return data;
}

/** 🖼️ Obtener Banners (Server Side) */
export async function getBannersServer() {
    const { data, error } = await supabase
        .from("banners")
        .select("id, title, description, image_url, video_url, link_url, button_text, show_button, image_position_desktop, image_position_mobile")
        .eq("active", true)
        .eq("show_on_home", true)
        .order("sort_order", { ascending: true });

    if (error) {
        console.error("Error fetching banners:", error);
        return [];
    }

    return data;
}
