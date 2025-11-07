// app/layout.js
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
    <html lang="es">
      <body className="bg-black text-white">
        <Header />
        <main className="pt-24">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
