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
        { url: `${BASE_URL}/legal/envios`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
        { url: `${BASE_URL}/conectar`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
        { url: `${BASE_URL}/catalogo?orden=top_sellers`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.85 },
        { url: `${BASE_URL}/catalogo?categoria=retro`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.85 },
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

        // 2. Productos activos (con imágenes optimizadas para Google Images)
        const { data: products } = await supabase
            .from('products')
            .select('slug, updated_at, featured, image_url, name, teams(name)')
            .eq('active', true);

        const productRoutes: MetadataRoute.Sitemap = (products || [])
            .filter((p: any) => Boolean(p.slug))
            .map((product: any) => {
                const teamName = (product.teams as any)?.name;
                const imageTitle = teamName ? `${teamName} - ${product.name}` : product.name;
                const lastMod = product.updated_at ? new Date(product.updated_at) : new Date();
                return {
                    url: `${BASE_URL}/producto/${product.slug}`,
                    lastModified: isNaN(lastMod.getTime()) ? new Date() : lastMod,
                    changeFrequency: 'weekly',
                    priority: product.featured ? 0.9 : 0.7,
                    ...(product.image_url ? {
                        images: [{
                            url: product.image_url,
                            title: imageTitle,
                        }],
                    } : {}),
                };
            });

        // 3. Páginas de categoría (/catalogo?categoria=...)
        const { data: categories } = await supabase
            .from('categories')
            .select('slug, name')
            .is('deleted_at', null);

        const categoryRoutes: MetadataRoute.Sitemap = (categories || [])
            .filter((c: any) => Boolean(c.slug))
            .map((cat: any) => ({
                url: `${BASE_URL}/catalogo?categoria=${encodeURIComponent(cat.slug)}`,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 0.85,
            }));

        // 4. Páginas de liga (/catalogo?liga=...)
        const { data: leagues } = await supabase
            .from('leagues')
            .select('slug, name')
            .is('deleted_at', null);

        const leagueRoutes: MetadataRoute.Sitemap = (leagues || [])
            .filter((l: any) => Boolean(l.slug))
            .map((league: any) => ({
                url: `${BASE_URL}/catalogo?liga=${encodeURIComponent(league.slug)}`,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 0.85,
            }));

        // 5. Páginas de equipos (/catalogo?equipo=...)
        const { data: teams } = await supabase
            .from('teams')
            .select('slug, name')
            .is('deleted_at', null);

        const teamRoutes: MetadataRoute.Sitemap = (teams || [])
            .filter((t: any) => Boolean(t.slug))
            .map((team: any) => ({
                url: `${BASE_URL}/catalogo?equipo=${encodeURIComponent(team.slug)}`,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 0.8,
            }));

        // 6. Páginas de marcas (/catalogo?marca=...)
        const { data: brands } = await supabase
            .from('brands')
            .select('slug, name')
            .eq('active', true)
            .is('deleted_at', null);

        const brandRoutes: MetadataRoute.Sitemap = (brands || [])
            .filter((b: any) => Boolean(b.slug))
            .map((brand: any) => ({
                url: `${BASE_URL}/catalogo?marca=${encodeURIComponent(brand.slug)}`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.8,
            }));

        return [...staticRoutes, ...categoryRoutes, ...leagueRoutes, ...teamRoutes, ...brandRoutes, ...productRoutes]
    } catch (error) {
        console.warn('Error generating sitemap:', error);
        return staticRoutes;
    }
}
