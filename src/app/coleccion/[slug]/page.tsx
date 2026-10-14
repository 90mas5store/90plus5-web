import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSpecialBannerCollectionServer } from "@/lib/api-server";
import { SITE_CONFIG, SITE_URL } from "@/lib/config/site";
import CollectionClient from "./CollectionClient";

export const revalidate = 60; // ⚡ ISR: revalida cada 60s o vía on-demand revalidate

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const { banner } = await getSpecialBannerCollectionServer(slug);

    if (!banner) {
        return {
            title: `Colección Especial | ${SITE_CONFIG.name}`,
            description: "Colección exclusiva de camisetas y artículos deportivos oficiales.",
        };
    }

    const title = `${banner.title} - Colección Exclusiva | ${SITE_CONFIG.name}`;
    const description = banner.subtitle || `Descubre la colección especial de ${banner.title} en 90+5 Store Honduras. Prendas seleccionadas, personalización oficial y envíos a todo el país.`;
    const canonical = `${SITE_URL}/coleccion/${banner.slug || slug}`;

    return {
        title,
        description,
        alternates: {
            canonical,
        },
        openGraph: {
            title,
            description,
            url: canonical,
            siteName: SITE_CONFIG.name,
            locale: "es_HN",
            type: "website",
            images: banner.background_image_url
                ? [
                    {
                        url: banner.background_image_url,
                        width: 1200,
                        height: 630,
                        alt: banner.title,
                    },
                ]
                : undefined,
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: banner.background_image_url ? [banner.background_image_url] : undefined,
        },
    };
}

export default async function SpecialCollectionPage({ params }: PageProps) {
    const { slug } = await params;
    const { banner, products } = await getSpecialBannerCollectionServer(slug);

    if (!banner) {
        notFound();
    }

    return <CollectionClient banner={banner} products={products} />;
}
