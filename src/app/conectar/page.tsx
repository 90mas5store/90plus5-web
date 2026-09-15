import { Suspense } from "react";
import ConectarContent from "./ConectarContent";
import { faqJsonLd } from "@/components/GeoFAQSection";
import { Metadata } from "next";
import { SITE_URL, SITE_CONFIG } from "@/lib/config/site";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Conectar y Preguntas Frecuentes",
  description:
    "Atención personalizada 1 a 1 por WhatsApp (+504 3248-8860). Preguntas frecuentes sobre pedidos bajo encargo (3 a 5 semanas), envíos a todo Honduras vía Cargo Expreso (CAEX) y métodos de pago.",
  alternates: {
    canonical: `${SITE_URL}/conectar`,
  },
  openGraph: {
    title: `Conectar y Preguntas Frecuentes | ${SITE_CONFIG.name}`,
    description:
      "Atención personalizada 1 a 1 por WhatsApp (+504 3248-8860). Preguntas frecuentes sobre pedidos bajo encargo (3 a 5 semanas), envíos a todo Honduras vía Cargo Expreso (CAEX) y métodos de pago.",
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
