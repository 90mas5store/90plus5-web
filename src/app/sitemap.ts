import { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { SITE_URL } from '@/lib/config/site'

const BASE_URL = SITE_URL

export const revalidate = 3600 // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // 1. Rutas Estáticas Principales y de Confianza
    const staticRoutes: MetadataRoute.Sitemap = [
        { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
        { url: `${BASE_URL}/catalogo`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.95 },
        { url: `${BASE_URL}/rastreo`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
        { url: `${BASE_URL}/legal/envios`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
        { url: `${BASE_URL}/conectar`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
        { url: `${BASE_URL}/legal/terminos`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
        { url: `${BASE_URL}/legal/privacidad`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    ]

    try {
        let supabase: any;
        try {
            supabase = createAdminClient();
        } catch {
            supabase = await createClient();
        }

        // 2. Productos activos (Prioridad máxima después del inicio)
        const { data: products } = await supabase
            .from('products')
            .select('slug, updated_at, featured, image_url')
            .eq('active', true);

        const productRoutes: MetadataRoute.Sitemap = (products || [])
            .filter((p: any) => Boolean(p.slug))
            .map((product: any) => {
                const lastMod = product.updated_at ? new Date(product.updated_at) : new Date();
                return {
                    url: `${BASE_URL}/producto/${product.slug}`,
                    lastModified: isNaN(lastMod.getTime()) ? new Date() : lastMod,
                    changeFrequency: 'daily',
                    priority: product.featured ? 0.95 : 0.9,
                    ...(product.image_url ? {
                        images: [product.image_url],
                    } : {}),
                };
            });

        // 3. Páginas de categoría (/catalogo?categoria=...)
        const { data: categories } = await supabase
            .from('categories')
            .select('slug')
            .is('deleted_at', null);

        const categoryRoutes: MetadataRoute.Sitemap = (categories || [])
            .filter((c: any) => Boolean(c.slug))
            .map((cat: any) => ({
                url: `${BASE_URL}/catalogo?categoria=${encodeURIComponent(cat.slug)}`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.75,
            }));

        // 4. Páginas de equipos (/catalogo?equipo=...)
        const { data: teams } = await supabase
            .from('teams')
            .select('slug')
            .is('deleted_at', null);

        const teamRoutes: MetadataRoute.Sitemap = (teams || [])
            .filter((t: any) => Boolean(t.slug))
            .map((team: any) => ({
                url: `${BASE_URL}/catalogo?equipo=${encodeURIComponent(team.slug)}`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.75,
            }));

        // 5. Páginas de liga (/catalogo?liga=...)
        const { data: leagues } = await supabase
            .from('leagues')
            .select('slug')
            .is('deleted_at', null);

        const leagueRoutes: MetadataRoute.Sitemap = (leagues || [])
            .filter((l: any) => Boolean(l.slug))
            .map((league: any) => ({
                url: `${BASE_URL}/catalogo?liga=${encodeURIComponent(league.slug)}`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.7,
            }));

        // 6. Páginas de marcas (/catalogo?marca=...)
        const { data: brands } = await supabase
            .from('brands')
            .select('slug')
            .eq('active', true)
            .is('deleted_at', null);

        const brandRoutes: MetadataRoute.Sitemap = (brands || [])
            .filter((b: any) => Boolean(b.slug))
            .map((brand: any) => ({
                url: `${BASE_URL}/catalogo?marca=${encodeURIComponent(brand.slug)}`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.65,
            }));

        // Productos van PRIMERO después de las rutas estáticas
        const allRoutes = [
            ...staticRoutes,
            ...productRoutes,
            ...categoryRoutes,
            ...teamRoutes,
            ...leagueRoutes,
            ...brandRoutes,
        ];
        const uniqueRoutes = Array.from(new Map(allRoutes.map((r) => [r.url, r])).values());
        return uniqueRoutes;
    } catch (error) {
        console.warn('Error generating sitemap:', error);
        return staticRoutes;
    }
}
