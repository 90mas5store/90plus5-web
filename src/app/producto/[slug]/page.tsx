import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductoPersonalizar from "@/components/product/ProductoPersonalizar";
import RelatedProducts from "@/components/product/RelatedProducts";
import { adaptSupabaseProductToProduct } from "@/lib/api";
import { Metadata, ResolvingMetadata } from "next";

// Regex to detect if the slug is actually a UUID (Legacy URL support)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
    params: { slug: string };
};

// 🛠️ Helper to fetch product data (Reusable for metadata & page)
async function getProduct(slug: string) {
    const supabase = await createClient();

    // 1. Legacy UUID Redirect Logic
    if (UUID_REGEX.test(slug)) {
        const { data } = await supabase.from("products").select("slug").eq("id", slug).single();
        if (data?.slug) return { redirect: `/producto/${data.slug}` };
        return null;
    }

    // 2. Fetch Product
    const { data: product } = await supabase
        .from("products")
        .select(`
            id, name, description, image_url, team_id, league_id, category_id,
            teams (name, logo_url),
            product_variants (version, price, original_price, active_original_price, active)
        `)
        .ilike("slug", slug)
        .eq("active", true)
        .single();

    if (!product) return null;

    // Transform for component
    return {
        ...product,
        teams: Array.isArray(product.teams) ? product.teams[0] : product.teams,
        variants: product.product_variants // Keep raw variants for structured data logic
    };
}

// SEO 🚀: Dynamic Metadata
export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const data = await getProduct(params.slug);

    // Redirect handled in component, here just return generic or null if not found (will 404 in comp)
    if (!data || 'redirect' in data) return { title: 'Producto no encontrado' };

    const previousImages = (await parent).openGraph?.images || [];
    const mainImage = data.image_url || "/og-image.jpg";
    const teamName = data.teams?.name || "Fútbol";

    // Formato solicitado: Equipo - Producto (El template del layout añade " | 90+5 Store")
    const title = `${teamName} - ${data.name}`;
    const fullTitle = `${title} | 90+5 Store`; // Para OpenGraph/Twitter que no usan template

    const description = data.description || `Compra la camiseta del ${teamName} al mejor precio. Envíos a todo Honduras.`;

    return {
        title, // Se aplicará el template: "%s | 90+5 Store"
        description,
        openGraph: {
            title: fullTitle,
            description,
            url: `https://90mas5.store/producto/${params.slug}`,
            images: [{ url: mainImage, width: 800, height: 800, alt: data.name }, ...previousImages],
        },
        twitter: {
            card: "summary_large_image",
            title: fullTitle,
            description,
            images: [mainImage],
            creator: "@90mas5store",
        },
    };
}

export default async function ProductoPage({ params }: Props) {
    const result = await getProduct(params.slug);
    const supabase = await createClient();

    if (!result) notFound();

    // Type Narrowing
    if ('redirect' in result && result.redirect) {
        redirect(result.redirect);
    }

    // Now 'result' is guaranteed to be the product object
    const productData = result as Exclude<typeof result, { redirect: string }>;

    // 🔄 Fetch Productos Relacionados
    // Prioridad: Misma Liga -> Misma Categoría -> Cualquiera
    let relatedQuery = supabase
        .from("products")
        .select(`
            id, name, slug, description, image_url, featured,
            team_id, category_id, league_id,
            teams (name, logo_url),
            product_variants (id, version, price, active, original_price, active_original_price),
            product_leagues (league_id)
        `)
        .eq("active", true)
        .neq("id", productData.id)
        .limit(4);

    // Estrategia Mejorada: Buscar por Categoría (amplio) pero priorizar Destacados
    // Esto asegura que casi siempre haya resultados si hay productos en la categoría
    if (productData.category_id) {
        relatedQuery = relatedQuery.eq("category_id", productData.category_id);
    }

    // Opcional: Si queremos priorizar la liga podemos ordenar, pero Supabase no permite ordenar complejo sin RPC
    // Así que confiamos en "Destacados" dentro de la categoría
    relatedQuery = relatedQuery.order("featured", { ascending: false });

    const { data: relatedRaw } = await relatedQuery;
    const relatedProducts = (relatedRaw || []).map(adaptSupabaseProductToProduct);

    // 🧠 Structured Data (JSON-LD) for Google Rich Results
    const price = productData.variants?.[0]?.price || 0;
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": productData.name,
        "image": [productData.image_url],
        "description": productData.description,
        "sku": productData.id,
        "brand": {
            "@type": "Brand",
            "name": productData.teams?.name || "90+5 Store"
        },
        "offers": {
            "@type": "Offer",
            "url": `https://90mas5.store/producto/${params.slug}`,
            "priceCurrency": "HNL",
            "price": price,
            "availability": "https://schema.org/InStock",
            "itemCondition": "https://schema.org/NewCondition"
        }
    };

    // @ts-ignore - Supabase type transformation handled above safely
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ProductoPersonalizar product={productData} />

            {/* 🔗 Relacionados */}
            <RelatedProducts products={relatedProducts} />
        </>
    );
}
