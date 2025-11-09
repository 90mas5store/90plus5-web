import { Suspense } from "react";
import localFont from "next/font/local";
import "./globals.css";
import { CartProvider } from "../context/CartContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/cart/CartDrawer";
import ClientLayout from "./ClientLayout";

// 🧠 Fuente local Satoshi
const satoshi = localFont({
  src: [
    { path: "../fonts/Satoshi-Regular.otf", weight: "400", style: "normal" },
    { path: "../fonts/Satoshi-Medium.otf", weight: "500", style: "normal" },
    { path: "../fonts/Satoshi-Bold.otf", weight: "700", style: "normal" },
    { path: "../fonts/Satoshi-Black.otf", weight: "900", style: "normal" },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

// 🧾 Metadata global (con URL base configurada)
export const metadata = {
  metadataBase: new URL("https://90plus5store.vercel.app"), // ✅ ya no mostrará warnings
  title: {
    default: "90+5 Store",
    template: "%s | 90+5 Store",
  },
  description:
    "Camisetas y equipaciones oficiales que viven más allá del minuto 90.",
  openGraph: {
    title: "90+5 Store",
    description: "Donde los goles viven más allá del minuto 90.",
    url: "https://90plus5store.vercel.app",
    siteName: "90+5 Store",
    locale: "es_ES",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "90+5 Store - El tiempo se rompe aquí",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "90+5 Store",
    description: "El tiempo se rompe aquí ⚽🔥",
    images: ["/og-image.jpg"],
  },
};

// 🧱 Layout base (Server Component)
export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`dark ${satoshi.variable}`}>
      <body className="bg-black text-white font-satoshi antialiased relative overflow-x-hidden">
        {/* 💫 Overlay global */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-[#E50914]/10 via-[#0A0A0A]/90 to-black/95 pointer-events-none" />
        <div className="fixed inset-0 -z-[9] backdrop-blur-[1px] bg-black/40 pointer-events-none" />

        {/* ✅ Suspense global para evitar errores de useSearchParams */}
        <Suspense
          fallback={
            <main className="min-h-screen flex items-center justify-center text-white">
              Cargando contenido...
            </main>
          }
        >
          <CartProvider>
            <ClientLayout>
              <Header />
              <CartDrawer />
              <main className="pt-0 min-h-screen">{children}</main>
              <Footer />
            </ClientLayout>
          </CartProvider>
        </Suspense>
      </body>
    </html>
  );
}
