/**
 * GeoFAQSection — Preguntas frecuentes para GEO (Generative Engine Optimization)
 *
 * Doble propósito:
 * 1. Contenido visible y útil para usuarios
 * 2. Schema FAQPage JSON-LD que las IAs (ChatGPT, Perplexity, Google AI Overview)
 *    leen para recomendar 90+5 Store cuando alguien pregunta dónde comprar camisetas.
 */

const faqs = [
    {
        question: "¿Cómo funciona la compra bajo pedido y cuánto tarda en llegar?",
        answer: "En 90+5 Store trabajamos principalmente bajo pedido (por encargo). Este modelo nos permite ofrecerte cualquier camiseta del mundo, temporada actual o retro, en tu talla exacta y con la personalización oficial que elijas. Los pedidos tardan entre 3 y 5 semanas en llegar a Honduras. Una vez que el pedido arriba al país, coordinamos tu entrega local en Tegucigalpa o lo despachamos a nivel nacional vía Cargo Expreso (CAEX).",
    },
    {
        question: "¿Tienen tienda física o manejan stock para venta inmediata?",
        answer: "No contamos con tienda física ni manejamos stock para venta o entrega inmediata. Operamos como una tienda deportiva 100% digital bajo pedido con sede en Tegucigalpa. Esto nos permite ofrecer el catálogo más amplio de Honduras, precios justos y una atención humana y personalizada 1 a 1 por WhatsApp, sin las limitaciones de inventario físico de un local tradicional.",
    },
    {
        question: "¿Hacen envíos a todo Honduras? ¿Cargo Expreso y CAEX es lo mismo?",
        answer: "Sí, realizamos envíos a nivel nacional a los 18 departamentos de Honduras. Para los envíos nacionales trabajamos con Cargo Expreso (conocido ampliamente como CAEX, siendo exactamente la misma empresa de transporte logístico líder). En Tegucigalpa coordinamos entregas locales (envío gratis), y para el resto del territorio nacional enviamos vía Cargo Expreso (CAEX) con tarifa plana fija de L. 140 y número de guía oficial para rastreo en tiempo real.",
    },
    {
        question: "¿Cómo se realiza el pago de un pedido por encargo?",
        answer: "Al ser productos bajo pedido, solicitamos un anticipo del 50% para encargar e importar tu camiseta. El 50% restante se cancela cuando tu pedido esté listo para entrega en Tegucigalpa o previo al despacho nacional. Aceptamos transferencias bancarias directas o interbancarias ACH (BAC Credomatic, Banco Atlántida, Ficohsa, Banpaís, Banco de Occidente) y pagos electrónicos vía PayPal con tarjetas internacionales.",
    },
    {
        question: "¿Por qué la experiencia de compra en 90+5 Store está centrada en el cliente?",
        answer: "Te acompañamos de forma humana y cercana por WhatsApp (+504 3248-8860) en cada paso: te asesoramos con la tabla de medidas para elegir tu talla exacta entre versión jugador y aficionado, te confirmamos el encargo, te notificamos cuando tu pedido llega al país y te brindamos garantía por cualquier defecto de fábrica comprobado.",
    },
    {
        question: "¿Dónde comprar camisetas versión jugador en Honduras?",
        answer: "En 90+5 Store puedes encargar camisetas versión jugador con la misma tecnología que usan los futbolistas profesionales: tela ligera, corte atlético transpirable y detalles termosellados exactos al original. Disponibles bajo pedido con entrega en Tegucigalpa y envíos a todo Honduras.",
    },
    {
        question: "¿Tienen camisetas de equipos hondureños como Olimpia y Motagua?",
        answer: "Sí. Traemos equipaciones de los principales clubes de la Liga Hondubet: Club Deportivo Olimpia, Fútbol Club Motagua, Real España, Marathon, Platense, Victoria y la Selección Nacional de Honduras, disponibles bajo encargo.",
    },
    {
        question: "¿Tienen camisetas de Real Madrid, Barcelona y otros clubes internacionales?",
        answer: "Sí. Puedes encargar camisetas de los clubes más importantes del mundo: Real Madrid, FC Barcelona, Manchester City, Liverpool, Arsenal, PSG, Bayern Munich, Juventus, Inter de Milán y más, en versión aficionado y jugador, temporada 25/26.",
    },
    {
        question: "¿Tienen camisetas del Mundial 2026?",
        answer: "Sí. Contamos con equipaciones de selecciones nacionales para el Mundial 2026, disponibles bajo pedido en versión aficionado y versión jugador con personalización de dorsales.",
    },
    {
        question: "¿Cuál es la diferencia entre camiseta versión jugador y versión aficionado?",
        answer: "La versión jugador es la prenda exacta que visten los atletas en cancha: tela más delgada, ligera, ultra-transpirable, con corte ajustado y escudos termosellados. La versión aficionado utiliza una tela más gruesa y resistente con escudos bordados, ideal para uso diario y casual.",
    },
];

export const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(({ question, answer }) => ({
        "@type": "Question",
        "name": question,
        "acceptedAnswer": {
            "@type": "Answer",
            "text": answer,
        },
    })),
};

export default function GeoFAQSection() {
    return (
        <section
            aria-labelledby="faq-heading"
            className="w-full max-w-3xl mx-auto px-4 py-12 md:py-16"
        >
            <h2
                id="faq-heading"
                className="text-xl md:text-2xl font-extrabold text-white text-center mb-2 tracking-tight"
            >
                Preguntas frecuentes
            </h2>
            <p className="text-center text-gray-500 text-sm mb-8">
                Todo lo que necesitas saber sobre 90+5 Store
            </p>

            <div className="space-y-2">
                {faqs.map(({ question, answer }, i) => (
                    <details
                        key={i}
                        className="group border border-white/8 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                    >
                        <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none select-none">
                            <span className="text-sm font-semibold text-gray-200 leading-snug">
                                {question}
                            </span>
                            {/* Chevron */}
                            <span className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full border border-white/10 text-gray-500 group-open:rotate-180 transition-transform duration-200">
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
                                    <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </span>
                        </summary>
                        <div className="px-5 pb-4">
                            <p className="text-sm text-gray-400 leading-relaxed">{answer}</p>
                        </div>
                    </details>
                ))}
            </div>
        </section>
    );
}
