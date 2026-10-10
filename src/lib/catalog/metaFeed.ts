import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SITE_URL, SITE_CONFIG } from '@/lib/config/site';

function escapeXml(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function cleanCdata(text: string): string {
    return text.replace(/]]>/g, ']]&gt;');
}

export async function generateMetaProductFeed(): Promise<string> {
    let supabase: any;
    try {
        supabase = createAdminClient();
    } catch {
        supabase = await createClient();
    }

    const { data: products, error } = await supabase
        .from('products')
        .select(`
            id,
            name,
            slug,
            description,
            image_url,
            season,
            active,
            teams (name),
            brands (name),
            categories (name),
            product_variants (price, active, version),
            product_images (image_url, sort_order)
        `)
        .eq('active', true)
        .order('created_at', { ascending: false });

    if (error || !products) {
        console.error('Error fetching products for Meta feed:', error);
        throw new Error('Error fetching products');
    }

    const itemsXml: string[] = [];

    for (const product of products) {
        if (!product.slug) continue;

        const teamName = (product.teams as any)?.name || (product.brands as any)?.name || '';
        const title = teamName && !product.name.toLowerCase().includes(teamName.toLowerCase())
            ? `${teamName} — ${product.name}`
            : product.name;

        // Determinar precio base (primera variante activa o precio más bajo)
        const activeVariants = (product.product_variants || []).filter((v: any) => v.active !== false);
        const prices = activeVariants.map((v: any) => Number(v.price)).filter((p: number) => !isNaN(p) && p > 0);
        const basePrice = prices.length > 0 ? Math.min(...prices) : 0;
        const formattedPrice = `${basePrice.toFixed(2)} HNL`;

        const productUrl = `${SITE_URL}/producto/${product.slug}`;
        const mainImage = product.image_url || `${SITE_URL}/og-image.jpg`;

        // Galería adicional (hasta 10 imágenes)
        const additionalImages = (product.product_images || [])
            .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
            .map((img: any) => img.image_url)
            .filter((url: string) => url && url !== mainImage)
            .slice(0, 10);

        const categoryName = (product.categories as any)?.name || 'Futbol';
        const brand = teamName || SITE_CONFIG.name;

        const description = product.description
            ? product.description.trim()
            : `Camiseta ${title}. Envíos a todo Honduras vía Cargo Expreso. Compra en ${SITE_CONFIG.name}.`;

        const item = `
    <item>
      <g:id>${escapeXml(product.id)}</g:id>
      <g:title><![CDATA[${cleanCdata(title)}]]></g:title>
      <g:description><![CDATA[${cleanCdata(description)}]]></g:description>
      <g:link>${escapeXml(productUrl)}</g:link>
      <g:image_link>${escapeXml(mainImage)}</g:image_link>
      ${additionalImages.map((imgUrl: string) => `<g:additional_image_link>${escapeXml(imgUrl)}</g:additional_image_link>`).join('\n      ')}
      <g:brand><![CDATA[${cleanCdata(brand)}]]></g:brand>
      <g:condition>new</g:condition>
      <g:availability>in stock</g:availability>
      <g:price>${formattedPrice}</g:price>
      <g:product_type><![CDATA[${cleanCdata(categoryName)}]]></g:product_type>
      <g:google_product_category>Sporting Goods &gt; Athletics &gt; Football</g:google_product_category>
      <g:fb_product_category>Sporting Goods &gt; Athletics &gt; Football</g:fb_product_category>
    </item>`;

        itemsXml.push(item);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title><![CDATA[${SITE_CONFIG.name} — Catálogo Oficial]]></title>
    <link>${SITE_URL}</link>
    <description><![CDATA[Catálogo de productos oficial de ${SITE_CONFIG.name} para Meta / Facebook / Instagram Shopping]]></description>
    ${itemsXml.join('')}
  </channel>
</rss>`;

    return xml;
}
