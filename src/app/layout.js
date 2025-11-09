import localFont from "next/font/local";
import "./globals.css";
import { CartProvider } from "../context/CartContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/cart/CartDrawer";
import ClientLayout from "./ClientLayout";

// 🧠 Fuente local Satoshi (en /src/fonts/)
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

export const metadata = {
  title: "90+5 Store | Donde el tiempo se rompe",
  description:
    "Camisetas y equipaciones oficiales que viven más allá del minuto 90.",
  openGraph: {
    title: "90+5 Store",
    description: "Donde los goles viven más allá del minuto 90.",
    images: ["/og-image.jpg"],
  },
};

// 🧱 Layout base (Server Component)
export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`dark ${satoshi.variable}`}>
      <body className="bg-black text-white font-satoshi antialiased relative overflow-x-hidden">
        {/* 💫 Overlay global de aura cinematográfica */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-[#E50914]/10 via-[#0A0A0A]/90 to-black/95 pointer-events-none" />
        <div className="fixed inset-0 -z-[9] backdrop-blur-[1px] bg-black/40 pointer-events-none" />

        {/* 🛒 Proveedor global del carrito */}
        <CartProvider>
          <ClientLayout>
            {/* 🔝 Header fijo */}
            <Header />

            {/* 🛍️ Drawer del carrito */}
            <CartDrawer />

            {/* 📦 Contenido principal */}
            <main className="pt-0 min-h-screen">{children}</main>

            {/* ⚽ Footer */}
            <Footer />
          </ClientLayout>
        </CartProvider>
      </body>
    </html>
  );
}

