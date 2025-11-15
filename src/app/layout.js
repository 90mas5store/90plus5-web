import { Suspense } from "react";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { CartProvider } from "../context/CartContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/cart/CartDrawer";
import ClientLayout from "./ClientLayout";

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
export const metadata = {
  metadataBase: new URL("https://90mas5.store"),
  title: {
    default: "90+5 Store",
    template: "%s | 90+5 Store",
  },
  description:
    "Camisetas y equipaciones oficiales que viven más allá del minuto 90.",
  openGraph: {
    title: "90+5 Store",
    description: "Donde los goles viven más allá del minuto 90.",
    url: "https://90mas5.store",
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
    <html lang="es" className={`dark ${satoshi.className}`}>
      <body className="bg-black text-white antialiased relative overflow-x-hidden">
        {/* 💫 Overlay global */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-[#E50914]/10 via-[#0A0A0A]/90 to-black/95 pointer-events-none" />
        <div className="fixed inset-0 -z-[9] backdrop-blur-[1px] bg-black/40 pointer-events-none" />

        {/* ✅ Suspense global */}
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
