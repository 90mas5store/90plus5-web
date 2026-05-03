import { Suspense } from "react";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { CartProvider } from "../context/CartContext";
import HeaderWrapper from "../components/HeaderWrapper";
import CartDrawer from "../components/cart/CartDrawer";
import ClientLayout from "./ClientLayout";
import AnalyticsWrapper from "../components/AnalyticsWrapper";
import { Metadata, Viewport } from "next";
import { Partytown } from '@builder.io/partytown/react';
import { MotionProvider } from "@/lib/motion";

// 🧠 Fuente local Satoshi
const satoshi = localFont({
    src: [
        { path: "../fonts/Satoshi-Regular.woff2", weight: "400", style: "normal" },
        { path: "../fonts/Satoshi-Medium.woff2", weight: "500", style: "normal" },
        { path: "../fonts/Satoshi-Bold.woff2", weight: "700", style: "normal" },
        { path: "../fonts/Satoshi-Black.woff2", weight: "900", style: "normal" },
    ],
    display: "swap",
});

// 🧾 Metadata global
export const metadata: Metadata = {
    metadataBase: new URL("https://90mas5.store"),
    title: {
        default: "90+5 Store | Camisetas de Fútbol y Ropa Deportiva en Honduras",
        template: "%s | 90+5 Store",
    },
    description: "Compra las mejores camisetas de fútbol temporada 25/26 versión jugador y aficionado. Envíos a todo Honduras. Real Madrid, Barcelona, Olimpia, Motagua y más. Calidad Premium Garantizada.",
    applicationName: "90+5 Store",
    authors: [{ name: "90+5 Store", url: "https://90mas5.store" }],
    keywords: [
        "camisetas de fútbol honduras",
        "tienda deportiva tegucigalpa",
        "jerseys originales",
        "ropa deportiva honduras",
        "camisetas versión jugador",
        "uniformes de futbol",
        "real madrid",
        "barcelona",
        "premier league",
        "liga nacional honduras",
        "olimpia",
        "motagua",
        "comprar camisetas futbol",
        "tienda 90 min"
    ],
    referrer: "origin-when-cross-origin",
    icons: {
        icon: "/logo.svg",
        apple: "/logo.svg",
        shortcut: "/logo.svg",
    },
    manifest: "/manifest.json",
    openGraph: {
        title: "90+5 Store | Camisetas de Fútbol Premium en Honduras",
        description: "Encuentra las equipaciones oficiales 25/26 de tus equipos favoritos. Calidad versión jugador, envíos rápidos y seguros en todo Honduras.",
        url: "https://90mas5.store",
        siteName: "90+5 Store",
        locale: "es_HN",
        type: "website",
        images: [
            {
                url: "/og-image.jpg",
                width: 1200,
                height: 630,
                alt: "90+5 Store - Colección de Camisetas de Fútbol",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "90+5 Store | #1 en Camisetas de Fútbol",
        description: "El tiempo se rompe aquí. Las mejores equipaciones del mundo en Honduras. ⚽🔥",
        images: ["/og-image.jpg"],
        creator: "@90mas5store",
    },
    verification: {
        google: "CzTKVzB0AjaAMCpZbKFoVnPrICCmgkyRV70C5sJO8Qo",
    },
    category: "ecommerce",
};

export const viewport: Viewport = {
    themeColor: "#E50914",
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
};

// 🧱 Layout base (Server Component)
export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es" className={`dark ${satoshi.className}`}>
            <head>

                {/* Preconnect optimizado — crossOrigin para fetch API + imágenes desde mismo origen */}
                <link rel="preconnect" href="https://fhvxolslqrrkefsvbcrq.supabase.co" crossOrigin="anonymous" />
                <link rel="dns-prefetch" href="https://fhvxolslqrrkefsvbcrq.supabase.co" />

                {/* 🧠 JSON-LD: Organization */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Organization",
                            "name": "90+5 Store",
                            "alternateName": ["90mas5 Store", "90+5", "Noventa más cinco Store"],
                            "url": "https://90mas5.store",
                            "logo": {
                                "@type": "ImageObject",
                                "url": "https://90mas5.store/logo-512.png",
                                "width": 512,
                                "height": 512
                            },
                            "description": "La mejor tienda de camisetas de fútbol en Honduras. Equipaciones oficiales temporada 25/26 en versión jugador y aficionado. Real Madrid, Barcelona, Olimpia, Motagua, Bayern, y más. Envíos a todo Honduras.",
                            "foundingDate": "2024",
                            "areaServed": {
                                "@type": "Country",
                                "name": "Honduras"
                            },
                            "priceRange": "HNL 350 - HNL 900",
                            "telephone": "+50432488860",
                            "sameAs": [
                                "https://www.instagram.com/90mas5store",
                                "https://www.facebook.com/90mas5store",
                                "https://www.tiktok.com/@90mas5",
                                "https://wa.me/50432488860"
                            ],
                            "contactPoint": {
                                "@type": "ContactPoint",
                                "telephone": "+50432488860",
                                "contactType": "customer service",
                                "contactOption": "TollFree",
                                "availableLanguage": "Spanish",
                                "areaServed": "HN"
                            }
                        })
                    }}
                />
                {/* 🧠 JSON-LD: LocalBusiness (SportingGoodsStore) — clave para consultas "en Honduras" */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": ["LocalBusiness", "SportingGoodsStore", "Store"],
                            "name": "90+5 Store",
                            "description": "Tienda online líder en Honduras especializada en camisetas de fútbol premium. Versión jugador y aficionado. Temporada 25/26. Envíos a todo Honduras.",
                            "url": "https://90mas5.store",
                            "telephone": "+50432488860",
                            "image": "https://90mas5.store/og-image.jpg",
                            "logo": "https://90mas5.store/logo.svg",
                            "priceRange": "HNL 350 - HNL 900",
                            "currenciesAccepted": "HNL",
                            "paymentAccepted": "Transferencia bancaria, Pago móvil",
                            "address": {
                                "@type": "PostalAddress",
                                "addressCountry": "HN",
                                "addressRegion": "Honduras",
                                "description": "Servicio de entrega a domicilio en todo Honduras"
                            },
                            "areaServed": [
                                { "@type": "City", "name": "Tegucigalpa" },
                                { "@type": "City", "name": "San Pedro Sula" },
                                { "@type": "City", "name": "La Ceiba" },
                                { "@type": "City", "name": "Comayagua" },
                                { "@type": "City", "name": "Choluteca" },
                                { "@type": "City", "name": "Santa Bárbara" },
                                { "@type": "Country", "name": "Honduras" }
                            ],
                            "hasOfferCatalog": {
                                "@type": "OfferCatalog",
                                "name": "Camisetas de Fútbol",
                                "description": "Catálogo de equipaciones de fútbol temporada 25/26. Real Madrid, Barcelona, Olimpia, Motagua, Bayern Munich, Liga Hondubet, Premier League, La Liga, Champions League y más.",
                                "itemListElement": [
                                    { "@type": "ListItem", "position": 1, "name": "Camisetas versión jugador" },
                                    { "@type": "ListItem", "position": 2, "name": "Camisetas versión aficionado" },
                                    { "@type": "ListItem", "position": 3, "name": "Equipaciones Liga Hondubet" },
                                    { "@type": "ListItem", "position": 4, "name": "Camisetas Mundial 2026" },
                                    { "@type": "ListItem", "position": 5, "name": "Camisetas Retro" }
                                ]
                            },
                            "sameAs": [
                                "https://www.instagram.com/90mas5store",
                                "https://www.facebook.com/90mas5store",
                                "https://www.tiktok.com/@90mas5"
                            ]
                        })
                    }}
                />
                {/* 🧠 JSON-LD: WebSite + SearchAction */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "WebSite",
                            "url": "https://90mas5.store",
                            "name": "90+5 Store",
                            "description": "Camisetas de fútbol premium en Honduras",
                            "potentialAction": {
                                "@type": "SearchAction",
                                "target": {
                                    "@type": "EntryPoint",
                                    "urlTemplate": "https://90mas5.store/catalogo?query={search_term_string}"
                                },
                                "query-input": "required name=search_term_string"
                            }
                        })
                    }}
                />
                {/* 🧠 JSON-LD: SiteNavigationElement */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@graph": [
                                {
                                    "@type": "SiteNavigationElement",
                                    "name": "Catálogo",
                                    "url": "https://90mas5.store/catalogo"
                                },
                                {
                                    "@type": "SiteNavigationElement",
                                    "name": "Mundial 2026",
                                    "url": "https://90mas5.store/catalogo?categoria=Mundial2026"
                                },
                                {
                                    "@type": "SiteNavigationElement",
                                    "name": "Streetwear",
                                    "url": "https://90mas5.store/catalogo?categoria=streetwear"
                                },
                                {
                                    "@type": "SiteNavigationElement",
                                    "name": "Fútbol",
                                    "url": "https://90mas5.store/catalogo?categoria=Futbol"
                                },
                                {
                                    "@type": "SiteNavigationElement",
                                    "name": "Liga Hondubet",
                                    "url": "https://90mas5.store/catalogo?liga=Liga-Hondubet"
                                },
                                {
                                    "@type": "SiteNavigationElement",
                                    "name": "Premier League",
                                    "url": "https://90mas5.store/catalogo?liga=premier-league"
                                }
                            ]
                        })
                    }}
                />
                <Partytown
                    debug={process.env.NODE_ENV === 'development'}
                    forward={['gtag', 'fbq', 'dataLayer.push']}
                    resolveUrl={(url, location, type) => {
                        if (url.hostname === 'www.google-analytics.com') {
                            const proxyUrl = new URL('/proxytown/google-analytics' + url.pathname + url.search, location.href);
                            return proxyUrl;
                        }
                        if (url.hostname === 'www.googletagmanager.com') {
                            const proxyUrl = new URL('/proxytown/googletagmanager' + url.pathname + url.search, location.href);
                            return proxyUrl;
                        }
                        if (url.hostname === 'connect.facebook.net') {
                            const proxyUrl = new URL('/proxytown/facebook' + url.pathname + url.search, location.href);
                            return proxyUrl;
                        }
                        return url;
                    }}
                />
            </head>
            <body className="bg-background text-textLight antialiased relative overflow-x-hidden">
                {/* 💫 Overlay global */}
                <div className="fixed inset-0 -z-10 bg-gradient-to-b from-primary/10 via-background/90 to-black/95 pointer-events-none" />
                <div className="fixed inset-0 -z-[9] bg-black/40 pointer-events-none" />

                <AnalyticsWrapper />

                {/* ✅ Suspense global */}
                <Suspense
                    fallback={
                        <main className="min-h-dvh flex items-center justify-center text-white">
                            Cargando contenido...
                        </main>
                    }
                >
                    <CartProvider>
                        <MotionProvider>
                            <ClientLayout>
                                <HeaderWrapper />
                                <CartDrawer />
                                <main className="pt-0 min-h-dvh pb-[calc(4rem_+_env(safe-area-inset-bottom))] md:pb-0">{children}</main>
                            </ClientLayout>
                        </MotionProvider>
                    </CartProvider>
                </Suspense>

                {/* 🎉 Toaster global de notificaciones */}
                <Toaster
                    position="top-right"
                    toastOptions={{
                        className: "text-sm font-medium",
                        duration: 4000,
                        style: {
                            background: "#0A0A0A",
                            color: "#fff",
                            border: "1px solid rgba(229,9,20,0.3)",
                            fontFamily: "Satoshi, sans-serif",
                            padding: "12px 16px",
                            boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
                        },
                        success: {
                            iconTheme: {
                                primary: "#E50914",
                                secondary: "#fff",
                            },
                        },
                        error: {
                            style: {
                                border: "1px solid rgba(255,50,50,0.4)",
                            },
                        },
                    }}
                />
            </body>
        </html>
    );
}