import { Suspense } from "react";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { CartProvider } from "../context/CartContext";
import HeaderWrapper from "../components/HeaderWrapper";
import CartDrawer from "../components/cart/CartDrawer";
import ClientLayout from "./ClientLayout";
import AnalyticsWrapper from "../components/AnalyticsWrapper";
import AnalyticsTracker from "@/components/analytics/AnalyticsTracker";
import ClarityScript from "@/components/analytics/ClarityScript";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Metadata, Viewport } from "next";
import { Partytown } from '@builder.io/partytown/react';
import { MotionProvider } from "@/lib/motion";
import { SITE_URL, SITE_CONFIG, CONTACT, SOCIAL_LINKS, SEO } from "@/lib/config/site";
import CookieConsent from "@/components/CookieConsent";

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
    metadataBase: new URL(SITE_URL),
    title: {
        default: "90+5 Store | Tienda Deportiva en Tegucigalpa · Camisetas de Fútbol en Honduras",
        template: "%s | 90+5 Store",
    },
    description: "La tienda deportiva online líder en Honduras con sede en Tegucigalpa. Camisetas de fútbol oficiales 25/26 versión jugador y aficionado bajo pedido (3 a 5 semanas) y envíos a todo Honduras vía Cargo Expreso (CAEX). Experiencia 100% digital centrada en ti.",
    applicationName: SITE_CONFIG.name,
    authors: [{ name: SITE_CONFIG.name, url: SITE_URL }],
    keywords: [
        "tiendas deportivas en honduras",
        "tienda deportiva tegucigalpa",
        "tienda deportiva honduras",
        "tienda deportiva online honduras",
        "camisetas de fútbol honduras",
        "camisetas de futbol tegucigalpa",
        "comprar camisetas futbol honduras",
        "camisetas versión jugador honduras",
        "jerseys originales honduras",
        "ropa deportiva honduras",
        "uniformes de futbol honduras",
        "envios a toda honduras",
        "cargo expreso honduras",
        "caex honduras",
        "liga nacional honduras",
        "olimpia",
        "motagua",
        "real madrid honduras",
        "barcelona honduras",
        "tienda 90 mas 5"
    ],
    referrer: "origin-when-cross-origin",
    icons: {
        icon: "/logo.svg",
        apple: "/logo.svg",
        shortcut: "/logo.svg",
    },
    manifest: "/manifest.json",
    openGraph: {
        title: "90+5 Store | Tienda Deportiva Online en Honduras · Sede Tegucigalpa",
        description: "Camisetas de fútbol oficiales 25/26 versión jugador y aficionado bajo pedido (3 a 5 semanas) con personalización y envíos seguros a toda Honduras vía Cargo Expreso (CAEX).",
        url: SITE_URL,
        siteName: SITE_CONFIG.name,
        locale: SITE_CONFIG.locale,
        type: "website",
        images: [
            {
                url: "/og-image.jpg",
                width: 1200,
                height: 630,
                alt: "90+5 Store - Tienda Deportiva en Honduras",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "90+5 Store | Tienda Deportiva #1 en Honduras",
        description: "Camisetas de fútbol bajo pedido (3-5 semanas) y envíos seguros a toda Honduras vía Cargo Expreso (CAEX). Atención personalizada 1 a 1. ⚽🔥",
        images: ["/og-image.jpg"],
        creator: SOCIAL_LINKS.twitterHandle,
    },
    verification: {
        google: SEO.googleVerification,
    },
    category: "ecommerce",
};

export const viewport: Viewport = {
    themeColor: SEO.themeColor,
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
                {process.env.NEXT_PUBLIC_SUPABASE_URL && (
                    <>
                        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />
                        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
                    </>
                )}

                {/* 🧠 JSON-LD: Organization */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Organization",
                            "name": SITE_CONFIG.name,
                            "alternateName": ["90mas5 Store", "90+5", "Noventa más cinco Store"],
                            "url": SITE_URL,
                            "logo": {
                                "@type": "ImageObject",
                                "url": `${SITE_URL}/logo-512.png`,
                                "width": 512,
                                "height": 512
                            },
                            "description": "La mejor tienda de camisetas de fútbol en Honduras con sede en Tegucigalpa. Especialistas en equipaciones oficiales temporada 25/26 bajo pedido (3 a 5 semanas) en versión jugador y aficionado. Envíos a todo Honduras vía Cargo Expreso (CAEX).",
                            "foundingDate": SITE_CONFIG.foundingDate,
                            "areaServed": {
                                "@type": "Country",
                                "name": SITE_CONFIG.country
                            },
                            "priceRange": SITE_CONFIG.priceRange,
                            "telephone": CONTACT.phone,
                            "sameAs": [
                                SOCIAL_LINKS.instagram,
                                SOCIAL_LINKS.facebook,
                                SOCIAL_LINKS.tiktok,
                                SOCIAL_LINKS.whatsapp
                            ],
                            "contactPoint": {
                                "@type": "ContactPoint",
                                "telephone": CONTACT.phone,
                                "contactType": "customer service",
                                "contactOption": "TollFree",
                                "availableLanguage": "Spanish",
                                "areaServed": "HN"
                            }
                        })
                    }}
                />
                {/* 🧠 JSON-LD: OnlineStore & SportingGoodsStore — fundamental para Google y motores de IA */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": ["OnlineStore", "SportingGoodsStore", "Store"],
                            "name": SITE_CONFIG.name,
                            "alternateName": ["90mas5 Store", "90+5", "Noventa más Cinco Store"],
                            "description": "Tienda deportiva online líder en Honduras con sede de operaciones en Tegucigalpa. Especialistas en camisetas de fútbol oficiales temporada 25/26 en versión jugador y aficionado bajo pedido (3 a 5 semanas de llegada). Operación 100% digital sin tienda física ni stock para venta inmediata, ofreciendo el catálogo más amplio del país, atención personalizada 1 a 1 por WhatsApp, anticipo del 50% y envíos seguros a nivel nacional vía Cargo Expreso (CAEX).",
                            "url": SITE_URL,
                            "telephone": CONTACT.phone,
                            "email": CONTACT.email,
                            "image": `${SITE_URL}/og-image.jpg`,
                            "logo": `${SITE_URL}/logo.svg`,
                            "priceRange": SITE_CONFIG.priceRange,
                            "currenciesAccepted": SITE_CONFIG.currency,
                            "paymentAccepted": "Transferencia bancaria directa / ACH (BAC Credomatic, Banco Atlántida, Ficohsa, Banpaís, Occidente), PayPal, Tarjetas de débito y crédito internacionales",
                            "knowsAbout": [
                                "Tiendas deportivas en Honduras",
                                "Tienda deportiva en Tegucigalpa",
                                "Camisetas de fútbol en Honduras",
                                "Camisetas versión jugador",
                                "Uniformes de fútbol personalizados",
                                "Ropa deportiva en Honduras",
                                "Envíos a toda Honduras",
                                "Cargo Expreso CAEX Honduras"
                            ],
                            "address": {
                                "@type": "PostalAddress",
                                "addressLocality": "Tegucigalpa",
                                "addressRegion": "Francisco Morazán",
                                "addressCountry": "HN",
                                "description": "Sede logística en Tegucigalpa con cobertura y envíos a nivel nacional vía Cargo Expreso (CAEX)"
                            },
                            "areaServed": [
                                { "@type": "City", "name": "Tegucigalpa" },
                                { "@type": "City", "name": "San Pedro Sula" },
                                { "@type": "City", "name": "La Ceiba" },
                                { "@type": "City", "name": "Comayagua" },
                                { "@type": "City", "name": "Choluteca" },
                                { "@type": "City", "name": "El Progreso" },
                                { "@type": "City", "name": "Santa Bárbara" },
                                { "@type": "City", "name": "Danlí" },
                                { "@type": "City", "name": "Juticalpa" },
                                { "@type": "City", "name": "Roatán" },
                                { "@type": "City", "name": "Siguatepeque" },
                                { "@type": "City", "name": "Puerto Cortés" },
                                { "@type": "City", "name": "Santa Rosa de Copán" },
                                { "@type": "Country", "name": "Honduras" }
                            ],
                            "hasOfferCatalog": {
                                "@type": "OfferCatalog",
                                "name": "Camisetas de Fútbol y Ropa Deportiva",
                                "description": "Catálogo completo de equipaciones deportivas oficiales temporada 25/26. Real Madrid, Barcelona, Olimpia, Motagua, Bayern Munich, Liga Hondubet, Premier League, Selecciones y Colección Retro.",
                                "itemListElement": [
                                    { "@type": "ListItem", "position": 1, "name": "Camisetas versión jugador con tecnología transpirable" },
                                    { "@type": "ListItem", "position": 2, "name": "Camisetas versión aficionado con escudos bordados" },
                                    { "@type": "ListItem", "position": 3, "name": "Equipaciones oficiales de la Liga Hondubet" },
                                    { "@type": "ListItem", "position": 4, "name": "Camisetas oficiales del Mundial 2026" },
                                    { "@type": "ListItem", "position": 5, "name": "Camisetas Retro y Clásicos del Fútbol" },
                                    { "@type": "ListItem", "position": 6, "name": "Personalización oficial con tipografía de jugadores o nombre propio" }
                                ]
                            },
                            "sameAs": [
                                SOCIAL_LINKS.instagram,
                                SOCIAL_LINKS.facebook,
                                SOCIAL_LINKS.tiktok,
                                SOCIAL_LINKS.whatsapp
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
                            "url": SITE_URL,
                            "name": SITE_CONFIG.name,
                            "description": "Camisetas de fútbol premium en Honduras",
                            "potentialAction": {
                                "@type": "SearchAction",
                                "target": {
                                    "@type": "EntryPoint",
                                    "urlTemplate": `${SITE_URL}/catalogo?query={search_term_string}`
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
                                    "url": `${SITE_URL}/catalogo`
                                },
                                {
                                    "@type": "SiteNavigationElement",
                                    "name": "Mundial 2026",
                                    "url": `${SITE_URL}/catalogo?categoria=Mundial2026`
                                },
                                {
                                    "@type": "SiteNavigationElement",
                                    "name": "Streetwear",
                                    "url": `${SITE_URL}/catalogo?categoria=streetwear`
                                },
                                {
                                    "@type": "SiteNavigationElement",
                                    "name": "Fútbol",
                                    "url": `${SITE_URL}/catalogo?categoria=Futbol`
                                },
                                {
                                    "@type": "SiteNavigationElement",
                                    "name": "Liga Hondubet",
                                    "url": `${SITE_URL}/catalogo?liga=Liga-Hondubet`
                                },
                                {
                                    "@type": "SiteNavigationElement",
                                    "name": "Premier League",
                                    "url": `${SITE_URL}/catalogo?liga=premier-league`
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
                        return url;
                    }}
                />
                {/* ⚡ Optimización de conexiones a CDNs (Supabase, ESPN) */}
                <link rel="preconnect" href="https://fhvxolslqrrkefsvbcrq.supabase.co" />
                <link rel="dns-prefetch" href="https://fhvxolslqrrkefsvbcrq.supabase.co" />
                <link rel="dns-prefetch" href="https://a.espncdn.com" />
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
                <CookieConsent />
                <Suspense fallback={null}>
                    <AnalyticsTracker />
                </Suspense>
                <ClarityScript />
                <VercelAnalytics />
                <SpeedInsights />
            </body>
        </html>
    );
}