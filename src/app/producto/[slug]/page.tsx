import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductoPersonalizar from "@/components/product/ProductoPersonalizar";
import Breadcrumb from "@/components/ui/Breadcrumb";
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

    const relatedProducts = ((relatedRaw || []) as any[]).map(adaptSupabaseProductToProduct);

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

    // @ts-ignore - Supabase type transformation handled above safely
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
