import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import ProductoPersonalizar from "@/components/product/ProductoPersonalizar";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { adaptSupabaseProductToProduct } from "@/lib/api";
import { SupabaseRawProduct } from "@/lib/types";
import { Metadata, ResolvingMetadata } from "next";

// ISR: revalidate every hour, unknown slugs served on-demand and cached
export const revalidate = 3600;
export const dynamicParams = true;

// Regex to detect if the slug is actually a UUID (Legacy URL support)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
    params: { slug: string };
};

// Explicit type for the Supabase product shape returned by getProduct
type SupabaseProduct = {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    team_id: string | null;
    league_id: string | null;
    category_id: string | null;
    teams: { name: string; logo_url: string } | null;
    product_images: { id: string; image_url: string; sort_order: number }[] | null;
    product_variants: Array<{
        version: string;
        price: number;
        original_price: number | null;
        active_original_price: boolean | null;
        active: boolean;
    }> | null;
    variants: Array<{
        version: string;
        price: number;
        original_price: number | null;
        active_original_price: boolean | null;
        active: boolean;
    }> | null;
    allows_customization?: boolean;
};

// Pre-generate the 30 most popular (featured) product pages at build time
export async function generateStaticParams(): Promise<{ slug: string }[]> {
    const supabase = createAdminClient();
    const { data } = await supabase
        .from("products")
        .select("slug")
        .eq("active", true)
        .eq("featured", true)
        .order("created_at", { ascending: false })
        .limit(30);

    return (data || [])
        .filter((p): p is { slug: string } => typeof p.slug === "string")
        .map((p) => ({ slug: p.slug }));
}

// 🛠️ Helper to fetch product data (Reusable for metadata & page)
async function getProduct(slug: string): Promise<SupabaseProduct | { redirect: string } | null> {
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
            id, name, description, image_url, team_id, league_id, category_id, allows_customization,
            teams (name, logo_url),
            product_variants (version, price, original_price, active_original_price, active),
            product_images (id, image_url, sort_order)
        `)
        .ilike("slug", slug)
        .eq("active", true)
        .single();

    if (!product) return null;

    const teams = Array.isArray(product.teams) ? product.teams[0] : product.teams;

    return {
        id: product.id,
        name: product.name,
        description: product.description ?? null,
        image_url: product.image_url ?? null,
        team_id: product.team_id ?? null,
        league_id: product.league_id ?? null,
        category_id: product.category_id ?? null,
        teams: teams ? { name: teams.name, logo_url: teams.logo_url ?? "" } : null,
        product_variants: product.product_variants ?? null,
        variants: product.product_variants ?? null,
        product_images: (product.product_images ?? null) as { id: string; image_url: string; sort_order: number }[] | null,
        allows_customization: product.allows_customization ?? true,
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
        alternates: {
            canonical: `https://90mas5.store/producto/${params.slug}`,
        },
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

    const productData = result as SupabaseProduct;

    // 🔄 Fetch Productos Relacionados — Liga primero, categoría como fallback
    const relatedBase = supabase
        .from("products")
        .select(`
            id, name, slug, image_url, featured,
            team_id, category_id, league_id,
            teams (name, logo_url),
            product_variants (version, price, active, original_price, active_original_price)
        `)
        .eq("active", true)
        .neq("id", productData.id)
        .order("featured", { ascending: false })
        .limit(4);

    const filterField = productData.league_id ? "league_id" : "category_id";
    const filterValue = productData.league_id ?? productData.category_id;

    const { data: relatedRaw } = filterValue
        ? await relatedBase.eq(filterField, filterValue)
        : await relatedBase;

    const relatedProducts = (relatedRaw as SupabaseRawProduct[] | null || []).map(adaptSupabaseProductToProduct);

    // 🧭 Breadcrumb data
    const teamName = productData.teams?.name || "Catálogo";
    const breadcrumbItems = [
        { label: "Catálogo", href: "/catalogo" },
        { label: `${teamName} — ${productData.name}` },
    ];

    // 🧠 Structured Data (JSON-LD) for Google Rich Results
    const price = productData.variants?.[0]?.price ?? 0;
    const productUrl = `https://90mas5.store/producto/${params.slug}`;

    const productJsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": productData.name,
        ...(productData.image_url && { "image": [productData.image_url] }),
        ...(productData.description && { "description": productData.description }),
        "sku": productData.id,
        "brand": {
            "@type": "Brand",
            "name": productData.teams?.name || "90+5 Store"
        },
        "offers": {
            "@type": "Offer",
            "url": productUrl,
            "priceCurrency": "HNL",
            "price": price,
            "availability": "https://schema.org/InStock",
            "itemCondition": "https://schema.org/NewCondition",
            "seller": {
                "@type": "Organization",
                "name": "90+5 Store"
            }
        }
    };

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Inicio",
                "item": "https://90mas5.store"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Catálogo",
                "item": "https://90mas5.store/catalogo"
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": `${teamName} — ${productData.name}`,
                "item": productUrl
            }
        ]
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            <ProductoPersonalizar
                product={productData}
                breadcrumb={<Breadcrumb items={breadcrumbItems} />}
                initialRelated={relatedProducts}
            />
        </>
    );
}
