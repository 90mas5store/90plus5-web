import { SITE_URL, SITE_CONFIG } from '@/lib/config/site';

export interface JsonLdProductInput {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    season?: string | null;
    teams: { name: string; logo_url: string } | null;
    brands: { name: string; slug: string; logo_url?: string | null } | null;
    categories: { name: string } | null;
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
}

export function buildProductJsonLd(product: JsonLdProductInput, slug: string) {
    const productUrl = `${SITE_URL}/producto/${slug}`;
    const activeVariants = product.variants?.filter((v) => v.active) ?? [];
    const price = activeVariants[0]?.price ?? product.variants?.[0]?.price ?? 0;

    const teamName = product.teams?.name || product.brands?.name || 'Catálogo';
    const categoryName = product.categories?.name || null;

    // Galería: imagen principal + product_images ordenadas
    const galleryImages = [
        ...(product.image_url ? [product.image_url] : []),
        ...(product.product_images ?? [])
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((img) => img.image_url)
            .filter((url) => url !== product.image_url),
    ];

    // Descripción enriquecida: usa la del producto o genera una automática dinámica
    const hasJugador = activeVariants.some((v) => v.version?.toLowerCase().includes('jugador'));
    const hasAficionado = activeVariants.some((v) => v.version?.toLowerCase().includes('aficionado'));
    const versionStr =
        hasJugador && hasAficionado
            ? 'versión jugador y aficionado'
            : hasJugador
            ? 'versión jugador'
            : hasAficionado
            ? 'versión aficionado'
            : '';

    const seasonStr = product.season ? `temporada ${product.season}` : '';
    const isBrandProduct = !product.teams?.name && !!product.brands?.name;

    const autoDescription = isBrandProduct
        ? [
              `${product.brands!.name} ${product.name}.`,
              seasonStr ? `${seasonStr}.` : '',
              categoryName ? `Categoría: ${categoryName}.` : '',
              'Envíos a todo Honduras.',
              `Compra en ${SITE_CONFIG.name}.`,
          ]
              .filter(Boolean)
              .join(' ')
        : [
              `Camiseta ${teamName} ${product.name} ${seasonStr}.`.replace(/\s+/g, ' ').trim(),
              versionStr ? `Disponible en ${versionStr}.` : '',
              'Envíos a todo Honduras.',
              `Compra en ${SITE_CONFIG.name}, la tienda de fútbol #1 en Honduras.`,
          ]
              .filter(Boolean)
              .join(' ');

    const enrichedDescription = product.description || autoDescription;

    // Múltiples ofertas estructuradas por cada variante activa
    const offers =
        activeVariants.length > 0
            ? activeVariants.map((v) => {
                  const versionLabel = v.version?.toLowerCase().includes('jugador')
                      ? 'Versión Jugador'
                      : v.version?.toLowerCase().includes('aficionado')
                      ? 'Versión Aficionado'
                      : v.version;

                  return {
                      '@type': 'Offer',
                      name: `${product.name} — ${versionLabel}`,
                      url: productUrl,
                      priceCurrency: 'HNL',
                      price: v.price,
                      ...(v.original_price && v.active_original_price
                          ? {
                                priceValidUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000)
                                    .toISOString()
                                    .split('T')[0],
                            }
                          : {}),
                      availability: 'https://schema.org/InStock',
                      itemCondition: 'https://schema.org/NewCondition',
                      areaServed: { '@type': 'Country', name: 'Honduras' },
                      seller: {
                          '@type': 'Organization',
                          name: SITE_CONFIG.name,
                          url: SITE_URL,
                      },
                  };
              })
            : [
                  {
                      '@type': 'Offer',
                      url: productUrl,
                      priceCurrency: 'HNL',
                      price,
                      availability: 'https://schema.org/InStock',
                      itemCondition: 'https://schema.org/NewCondition',
                      areaServed: { '@type': 'Country', name: 'Honduras' },
                      seller: {
                          '@type': 'Organization',
                          name: SITE_CONFIG.name,
                          url: SITE_URL,
                      },
                  },
              ];

    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        ...(galleryImages.length > 0 && { image: galleryImages }),
        description: enrichedDescription,
        sku: product.id,
        brand: {
            '@type': 'Brand',
            name: product.brands?.name || product.teams?.name || SITE_CONFIG.name,
        },
        category: categoryName || 'Deportes',
        keywords: [
            product.teams?.name
                ? `camiseta ${teamName}`
                : `${product.brands?.name || ''} ${categoryName || ''}`.trim(),
            `${product.name} Honduras`,
            product.teams?.name
                ? 'camiseta fútbol Honduras'
                : `${product.brands?.name || ''} Honduras`.trim(),
            'comprar Honduras',
        ]
            .filter(Boolean)
            .join(', '),
        offers: offers.length === 1 ? offers[0] : offers,
        seller: {
            '@type': 'Organization',
            name: SITE_CONFIG.name,
            url: SITE_URL,
        },
    };
}

export function buildBreadcrumbJsonLd(teamName: string, productName: string, slug: string) {
    const productUrl = `${SITE_URL}/producto/${slug}`;

    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Inicio',
                item: SITE_URL,
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Catálogo',
                item: `${SITE_URL}/catalogo`,
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: `${teamName} — ${productName}`,
                item: productUrl,
            },
        ],
    };
}
