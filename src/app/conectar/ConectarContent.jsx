"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function ContactoPage() {
  const searchParams = useSearchParams();

  // 🔦 Efecto de highlight al llegar con hash (#faq, #privacidad, etc.)
  useEffect(() => {
    const hash = window.location.hash?.replace("#", "");
    if (hash) {
      const section = document.getElementById(hash);
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "center" });

        // ✨ Highlight temporal
        section.classList.add("highlight-section");
        setTimeout(() => {
          section.classList.remove("highlight-section");
        }, 1200);
      }
    }
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden font-satoshi">
      {/* AURA */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(229,9,20,0.15),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none" />

      {/* CONTACTO */}
      <section
        id="contacto"
        className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-24"
      >
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl font-extrabold mb-4"
        >
          Hablemos ⚡
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-gray-300 max-w-xl leading-relaxed"
        >
          Somos fanáticos del fútbol, la moda retro y los detalles que hacen historia.
          Si querés colaborar, tenés una duda o simplemente querés saludar, escribinos.
          <br />
          Basados en <span className="text-[#E50914] font-semibold">Tegucigalpa, Honduras</span> ⚽
        </motion.p>

        {/* DATOS */}
        <div className="mt-10 flex flex-col sm:flex-row sm:justify-center gap-8 text-gray-300">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-[#E50914]" />
            <span>contacto@90mas5.store</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-[#E50914]" />
            <span>+504 3248-8860</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-[#E50914]" />
            <span>Tegucigalpa, Honduras</span>
          </div>
        </div>

        {/* WHATSAPP */}
        <motion.a
          href="https://wa.me/50432488860?text=¡Hola!%20Quiero%20hacer%20una%20consulta%20sobre%20un%20producto."
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-10 inline-flex items-center gap-2 bg-[#25D366] text-black font-semibold px-6 py-3 rounded-full shadow-[0_0_15px_rgba(37,211,102,0.5)] hover:shadow-[0_0_25px_rgba(37,211,102,0.8)] transition-all"
        >
          <MessageCircle className="w-5 h-5" />
          Enviar mensaje por WhatsApp
        </motion.a>
      </section>

      {/* PRIVACIDAD */}
      <section
        id="privacidad"
        className="relative z-10 px-6 sm:px-16 py-16 border-t border-white/10 bg-black/40 backdrop-blur-sm"
      >
        <h2 className="text-2xl font-bold mb-4 text-white/90">
          Políticas de Privacidad
        </h2>
        <p className="text-gray-400 max-w-3xl leading-relaxed">
          En <span className="text-white font-semibold">90+5 Store</span> valoramos tu privacidad.
          No compartimos tus datos personales con terceros y solo utilizamos tu información para procesar tus pedidos, mejorar tu experiencia y ofrecerte un mejor servicio.
          Pronto encontrarás aquí los detalles completos de nuestras políticas.
        </p>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="relative z-10 px-6 sm:px-16 py-16 border-t border-white/10 bg-black/60 backdrop-blur-sm"
      >
        <h2 className="text-2xl font-bold mb-6 text-white/90">
          Preguntas Frecuentes (FAQ)
        </h2>

        <div className="grid gap-6 max-w-3xl">
          <div>
            <h3 className="font-semibold text-white/90">
              ¿Cómo realizo un pedido?
            </h3>
            <p className="text-gray-400 text-sm">
              Próximamente agregaremos aquí una guía paso a paso para comprar desde la tienda.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white/90">
              ¿Hacen envíos a todo el país?
            </h3>
            <p className="text-gray-400 text-sm">
              Sí, hacemos envíos en Honduras. Pronto añadiremos más detalles sobre costos y tiempos de entrega.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white/90">
              ¿Puedo cambiar o devolver un producto?
            </h3>
            <p className="text-gray-400 text-sm">
              Próximamente encontrarás aquí nuestras políticas de cambio y devolución.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER SIMPLE */}
      <footer className="text-center py-8 text-gray-500 text-sm border-t border-white/10">
        © {new Date().getFullYear()} 90+5 Store · Tegucigalpa, Honduras
      </footer>

      {/* ✨ Estilo para highlight */}
      <style jsx global>{`
        .highlight-section {
          box-shadow: 0 0 25px rgba(229, 9, 20, 0.6);
          transition: box-shadow 0.8s ease-in-out;
        }
      `}</style>
    </main>
  );
}
