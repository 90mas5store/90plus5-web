import { Suspense } from "react";
import ConectarContent from "./ConectarContent";
import { faqJsonLd } from "@/components/GeoFAQSection";
import { Metadata } from "next";
import { SITE_URL, SITE_CONFIG } from "@/lib/config/site";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contáctanos por WhatsApp, correo o redes sociales. Atención personalizada para tu pedido de camisetas de fútbol en Honduras.",
  alternates: {
    canonical: `${SITE_URL}/conectar`,
  },
  openGraph: {
    title: `Contacto | ${SITE_CONFIG.name}`,
    description:
      "Contáctanos por WhatsApp, correo o redes sociales. Atención personalizada para tu pedido de camisetas de fútbol en Honduras.",
    url: `${SITE_URL}/conectar`,
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
