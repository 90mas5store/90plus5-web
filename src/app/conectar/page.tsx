import { Suspense } from "react";
import ConectarContent from "./ConectarContent";
import { faqJsonLd } from "@/components/GeoFAQSection";
import { Metadata } from "next";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contáctanos por WhatsApp, correo o redes sociales. Atención personalizada para tu pedido de camisetas de fútbol en Honduras.",
  alternates: {
    canonical: "https://90mas5.store/conectar",
  },
  openGraph: {
    title: "Contacto | 90+5 Store",
    description:
      "Contáctanos por WhatsApp, correo o redes sociales. Atención personalizada para tu pedido de camisetas de fútbol en Honduras.",
    url: "https://90mas5.store/conectar",
  },
};

export default function ConectarPage() {
  return (
    <>
      {/* 🤖 GEO: FAQPage JSON-LD para ChatGPT, Perplexity, Google AI Overview */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Suspense
        fallback={
          <main className="min-h-dvh bg-black text-white flex items-center justify-center">
            Cargando página de contacto...
          </main>
        }
      >
        <ConectarContent />
      </Suspense>
    </>
  );
}
