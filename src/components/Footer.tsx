"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Phone,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
} from "lucide-react";
import { SiTiktok } from "react-icons/si";
import { getWhatsappLink } from "@/lib/whatsapp";

export default function Footer() {
  const router = useRouter();

  // 🔄 Navegación con scroll suave hacia secciones de /conectar
  const handleScrollToSection = async (sectionId: string) => {
    if (window.location.pathname === "/conectar") {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "center" });
        section.classList.add("highlight-section");
        setTimeout(() => {
          section.classList.remove("highlight-section");
        }, 1200);
      }
    } else {
      router.push(`/conectar#${sectionId}`);
      setTimeout(() => {
        const section = document.getElementById(sectionId);
        if (section) {
          section.scrollIntoView({ behavior: "smooth", block: "center" });
          section.classList.add("highlight-section");
          setTimeout(() => {
            section.classList.remove("highlight-section");
          }, 1200);
        }
      }, 600);
    }
  };

  return (
    <footer className="relative bg-gradient-to-b from-[#0A0A0A]/95 to-black border-t border-white/10 py-6 md:py-8 text-gray-300">
      {/* 🔥 Aura superior */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#E50914]/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
        {/* 🏷️ Branding */}
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-2xl md:text-3xl font-extrabold text-[#E50914] drop-shadow-[0_0_15px_rgba(229,9,20,0.4)]"
          >
            90<span className="text-white">+</span>5
          </motion.h2>
          <p className="mt-2 md:mt-3 text-xs md:text-sm text-gray-400 max-w-xs leading-relaxed">
            Donde el tiempo se rompe.
            <br />
            Desde Tegucigalpa, Honduras.
          </p>
        </div>

        {/* 🔗 Enlaces */}
        <div className="space-y-2 md:space-y-3">
          <h3 className="text-white font-semibold text-base md:text-lg mb-2 md:mb-3">Enlaces</h3>
          <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
            <li>
              <Link
                href="/rastreo"
                className="hover:text-[#E50914] transition-colors"
              >
                Rastrear Pedido
              </Link>
            </li>
            <li>
              <button
                onClick={() => handleScrollToSection("faq")}
                className="hover:text-[#E50914] transition-colors text-left"
              >
                Preguntas Frecuentes
              </button>
            </li>
            <li>
              <Link
                href="/legal/privacidad"
                className="hover:text-[#E50914] transition-colors"
              >
                Política de Privacidad
              </Link>
            </li>
            <li>
              <Link
                href="/legal/envios"
                className="hover:text-[#E50914] transition-colors"
              >
                Envíos y Devoluciones
              </Link>
            </li>
            <li>
              <Link
                href="/legal/terminos"
                className="hover:text-[#E50914] transition-colors"
              >
                Términos y Condiciones
              </Link>
            </li>
            <li>
              <button
                onClick={() => handleScrollToSection("contacto")}
                className="hover:text-[#E50914] transition-colors text-left"
              >
                Contáctanos
              </button>
            </li>
          </ul>
        </div>

        {/* 📞 Contacto */}
        <div className="space-y-2 md:space-y-3">
          <h3 className="text-white font-semibold text-base md:text-lg mb-2 md:mb-3">Contacto</h3>
          <p className="flex items-center gap-2 text-xs md:text-sm">
            <Mail size={14} className="text-[#E50914] md:w-4 md:h-4" /> contacto@90mas5.store
          </p>
          <p className="flex items-center gap-2 text-xs md:text-sm">
            <Phone size={14} className="text-[#E50914] md:w-4 md:h-4" /> +504 3248-8860
          </p>
          <motion.a
            whileHover={{ scale: 1.05 }}
            href={getWhatsappLink({ message: "¡Hola! Quisiera más información." })}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-2 md:mt-3 px-4 md:px-5 py-1.5 md:py-2 rounded-full bg-[#E50914]/20 border border-[#E50914]/50 hover:bg-[#E50914]/40 transition-all text-xs md:text-sm"
          >
            <MessageCircle size={14} className="md:w-4 md:h-4" /> Enviar WhatsApp
          </motion.a>
        </div>
      </div>

      {/* 🌐 Redes Sociales con Tooltips */}
      <div className="flex justify-center gap-6 mt-8 text-gray-400 relative">
        {[
          { href: "https://instagram.com/90mas5.store", label: "Instagram", icon: <Instagram size={20} /> },
          { href: "https://facebook.com/90mas5.store", label: "Facebook", icon: <Facebook size={20} /> },
          { href: "https://x.com/90plus5", label: "X (Twitter)", icon: <Twitter size={20} /> },
          { href: "https://www.tiktok.com/@90mas5", label: "TikTok", icon: <SiTiktok size={18} /> },
        ].map((social, index) => (
          <motion.div
            key={index}
            className="group relative"
            whileHover={{ scale: 1.15 }}
            transition={{ type: "spring", stiffness: 250, damping: 15 }}
          >
            <Link
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#E50914] transition-colors"
            >
              {social.icon}
            </Link>

            {/* Tooltip */}
            <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs text-white bg-[#E50914]/90 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              {social.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* ⚽ Derechos */}
      <p className="text-center text-xs text-gray-500 mt-6">
        © {new Date().getFullYear()} 90+5 Store. Todos los derechos reservados.
      </p>

      {/* ✨ Highlight effect para secciones */}
      <style jsx global>{`
        .highlight-section {
          box-shadow: 0 0 25px rgba(229, 9, 20, 0.6);
          transition: box-shadow 0.8s ease-in-out;
        }
      `}</style>
    </footer>
  );
}
