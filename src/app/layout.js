import localFont from "next/font/local";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { CartProvider } from "../context/CartContext";
import CartDrawer from "../components/cart/CartDrawer";

// 🧠 Fuente local Satoshi (en /src/fonts/)
const satoshi = localFont({
  src: [
    {
      path: "../fonts/Satoshi-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/Satoshi-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/Satoshi-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/Satoshi-Black.otf",
      weight: "900",
      style: "normal",
    },
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

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${satoshi.variable}`}>
      <body className="bg-black text-white font-satoshi antialiased">
        {/* 🧠 Proveedor global del carrito */}
        <CartProvider>
          {/* 🔝 Header fijo */}
          <Header />

          {/* 🛒 Drawer del carrito (superpuesto) */}
          <CartDrawer />

          {/* 📦 Contenido principal */}
          <main className="pt-0">{children}</main>

          {/* ⚽ Footer del sitio */}
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
