import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'https://90mas5.store'

export const revalidate = 3600 // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // 1. Rutas Estáticas
    const staticRoutes: MetadataRoute.Sitemap = [
        { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
        { url: `${BASE_URL}/catalogo`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: `${BASE_URL}/conectar`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
        { url: `${BASE_URL}/legal/terminos`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
        { url: `${BASE_URL}/legal/privacidad`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
        { url: `${BASE_URL}/legal/envios`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    ]

    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // 2. Productos activos
        const { data: products } = await supabase
            .from('products')
            .select('slug, updated_at, featured')
            .eq('active', true);

        const productRoutes: MetadataRoute.Sitemap = (products || []).map((product) => ({
            url: `${BASE_URL}/producto/${product.slug}`,
            lastModified: new Date(product.updated_at || new Date()),
            changeFrequency: 'weekly',
            priority: product.featured ? 0.8 : 0.6,
        }))

        // 3. Páginas de categoría (/catalogo?categoria=...)
        const { data: categories } = await supabase
            .from('categories')
            .select('slug, name');

        const categoryRoutes: MetadataRoute.Sitemap = (categories || []).map((cat) => ({
            url: `${BASE_URL}/catalogo?categoria=${encodeURIComponent(cat.slug)}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.85,
        }))

        // 4. Páginas de liga (/catalogo?liga=...)
        const { data: leagues } = await supabase
            .from('leagues')
            .select('slug, name');

        const leagueRoutes: MetadataRoute.Sitemap = (leagues || []).filter(l => l.slug).map((league) => ({
            url: `${BASE_URL}/catalogo?liga=${encodeURIComponent(league.slug)}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        }))

        return [...staticRoutes, ...categoryRoutes, ...leagueRoutes, ...productRoutes]
    } catch (error) {
        console.warn('Error generating sitemap:', error);
        return staticRoutes;
    }
}
