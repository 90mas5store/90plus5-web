import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/client'

const BASE_URL = 'https://90mas5.store'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // 1. Rutas Estáticas
    const routes = [
        '',
        '/catalogo',
        '/rastreo',
        '/conectar',
        '/legal/terminos',
        '/legal/privacidad',
        '/legal/envios',
    ].map((route) => ({
        url: `${BASE_URL}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }))

    // 2. Rutas Dinámicas (Productos)
    try {
        const supabase = createClient();
        const { data: products } = await supabase
            .from('products')
            .select('slug, updated_at')
            .eq('active', true);

        const productRoutes = products?.map((product) => ({
            url: `${BASE_URL}/producto/${product.slug}`,
            lastModified: new Date(product.updated_at || new Date()),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        })) || []

        return [...routes, ...productRoutes]
    } catch (error) {
        console.warn('Error generating sitemap products:', error);
        return routes;
    }
}
