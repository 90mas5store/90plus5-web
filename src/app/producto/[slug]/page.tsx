import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import ProductoPersonalizar from '@/components/product/ProductoPersonalizar';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { adaptSupabaseProductToProduct } from '@/lib/api';
import { SupabaseRawProduct } from '@/lib/types';
import { Metadata, ResolvingMetadata } from 'next';
import { SITE_URL, SITE_CONFIG, SOCIAL_LINKS } from '@/lib/config/site';
import { buildProductJsonLd, buildBreadcrumbJsonLd, JsonLdProductInput } from '@/lib/seo/productJsonLd';

// ISR: revalidate every hour, unknown slugs served on-demand and cached
export const revalidate = 3600;
export const dynamicParams = true;

// Regex to detect if the slug is actually a UUID (Legacy URL support)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
    params: { slug: string };
};

type SupabaseProduct = JsonLdProductInput & {
    team_id: string | null;
    league_id: string | null;
    category_id: string | null;
    brand_id: string | null;
    gender?: string | null;
    allows_customization?: boolean;
    trending_until?: string | null;
};

// Pre-generate the 30 most popular (featured) product pages at build time
export async function generateStaticParams(): Promise<{ slug: string }[]> {
    const supabase = createAdminClient();
    const { data } = await supabase
        .from('products')
        .select('slug')
        .eq('active', true)
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(30);

    return (data || [])
        .filter((p): p is { slug: string } => typeof p.slug === 'string')
        .map((p) => ({ slug: p.slug }));
}

// 🛠️ Helper to fetch product data (Reusable for metadata & page)
async function getProduct(slug: string): Promise<SupabaseProduct | { redirect: string } | null> {
    const supabase = await createClient();

    // 1. Legacy UUID Redirect Logic
    if (UUID_REGEX.test(slug)) {
        const { data } = await supabase.from('products').select('slug').eq('id', slug).single();
        if (data?.slug) return { redirect: `/producto/${data.slug}` };
        return null;
    }

    // 2. Fetch Product with URL Decoding & Candidate Slug Handling
    let decodedSlug = slug;
    try {
        decodedSlug = decodeURIComponent(slug);
    } catch {
        decodedSlug = slug;
    }

    const sanitizeSlug = (s: string) =>
        (s || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .replace(/ñ/g, 'n')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

    const candidates = Array.from(
        new Set([slug, decodedSlug, sanitizeSlug(slug), sanitizeSlug(decodedSlug)])
    ).filter(Boolean);

    const { data: products } = await supabase
        .from('products')
        .select(`
            id, name, slug, description, image_url, team_id, league_id, category_id, brand_id, season, gender, allows_customization, trending_until,
            teams (name, logo_url),
            brands (name, slug, logo_url),
            categories (name),
            product_variants (version, price, original_price, active_original_price, active),
            product_images (id, image_url, sort_order)
        `)
        .in('slug', candidates)
        .eq('active', true)
        .limit(1);

    const product = products && products.length > 0 ? products[0] : null;
    if (!product) return null;

    const teams = Array.isArray(product.teams) ? product.teams[0] : product.teams;
    const brands = Array.isArray(product.brands) ? product.brands[0] : product.brands;
    const categories = Array.isArray(product.categories) ? product.categories[0] : product.categories;

    return {
        id: product.id,
        name: product.name,
        slug: product.slug || slug,
        description: product.description ?? null,
        image_url: product.image_url ?? null,
        team_id: product.team_id ?? null,
        league_id: product.league_id ?? null,
        category_id: product.category_id ?? null,
        brand_id: product.brand_id ?? null,
        season: (product as { season?: string | null }).season ?? null,
        gender: (product as { gender?: string | null }).gender ?? null,
        teams: teams ? { name: teams.name, logo_url: teams.logo_url ?? '' } : null,
        brands: brands ? { name: brands.name, slug: brands.slug ?? '', logo_url: (brands as { logo_url?: string }).logo_url ?? null } : null,
        categories: categories ? { name: categories.name } : null,
        product_variants: product.product_variants ?? null,
        variants: product.product_variants ?? null,
        product_images: (product.product_images ?? null) as { id: string; image_url: string; sort_order: number }[] | null,
        allows_customization: product.allows_customization ?? true,
        trending_until: (product as { trending_until?: string | null }).trending_until ?? null,
    };
}

// SEO 🚀: Dynamic Metadata
export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const data = await getProduct(params.slug);

    if (!data || 'redirect' in data) return { title: 'Producto no encontrado' };

    const previousImages = (await parent).openGraph?.images || [];
    const mainImage = data.image_url || '/og-image.jpg';
    const displayName = data.teams?.name || data.brands?.name || 'Fútbol';

    const title = `${displayName} - ${data.name}`;
    const fullTitle = `${title} | ${SITE_CONFIG.name}`;
    const description = data.description || `Compra ${data.name} de ${displayName} al mejor precio. Envíos a todo Honduras.`;

    return {
        title,
        description,
        alternates: {
            canonical: `${SITE_URL}/producto/${params.slug}`,
        },
        openGraph: {
            type: 'website',
            locale: SITE_CONFIG.locale,
            title: fullTitle,
            description,
            url: `${SITE_URL}/producto/${params.slug}`,
            images: [{ url: mainImage, alt: data.name }, ...previousImages],
        },
        twitter: {
            card: 'summary_large_image',
            title: fullTitle,
            description,
            images: [mainImage],
            creator: SOCIAL_LINKS.twitterHandle,
        },
    };
}

export default async function ProductoPage({ params }: Props) {
    const result = await getProduct(params.slug);
    const supabase = await createClient();

    if (!result) notFound();

    if ('redirect' in result && result.redirect) {
        redirect(result.redirect);
    }

    const productData = result as SupabaseProduct;

    // 🔄 Fetch Productos Relacionados — Liga primero, categoría como fallback
    const relatedBase = supabase
        .from('products')
        .select(`
            id, name, slug, image_url, featured,
            team_id, category_id, league_id, brand_id,
            teams (name, logo_url),
            brands (name, slug, logo_url),
            product_variants (version, price, active, original_price, active_original_price)
        `)
        .eq('active', true)
        .neq('id', productData.id)
        .order('featured', { ascending: false })
        .limit(4);

    const filterField = productData.brand_id ? 'brand_id' : productData.league_id ? 'league_id' : 'category_id';
    const filterValue = productData.brand_id ?? productData.league_id ?? productData.category_id;

    const { data: relatedRaw } = filterValue
        ? await relatedBase.eq(filterField, filterValue)
        : await relatedBase;

    const relatedProducts = (relatedRaw as SupabaseRawProduct[] | null || []).map(adaptSupabaseProductToProduct);

    // 🧭 Breadcrumb data
    const teamName = productData.teams?.name || productData.brands?.name || 'Catálogo';
    const breadcrumbItems = [
        { label: 'Catálogo', href: '/catalogo' },
        { label: `${teamName} — ${productData.name}` },
    ];

    // 🧠 Structured Data (JSON-LD) for Google Rich Results
    const productJsonLd = buildProductJsonLd(productData, params.slug);
    const breadcrumbJsonLd = buildBreadcrumbJsonLd(teamName, productData.name, params.slug);

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
