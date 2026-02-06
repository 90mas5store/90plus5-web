"use client";

import { useState } from "react";
import { motion } from "@/lib/motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Phone,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import { TikTokIcon } from "@/components/icons/TikTokIcon";
import { getWhatsappLink } from "@/lib/whatsapp";

export default function Footer() {
  const router = useRouter();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

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
    <footer className="relative bg-gradient-to-b from-[#0A0A0A]/95 to-black border-t border-white/10 py-8 md:py-12 text-gray-300">
      {/* 🔥 Aura superior */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#E50914]/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-5 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        {/* 🏷️ Branding */}
        <div className="md:col-span-1 space-y-4">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-extrabold text-[#E50914] drop-shadow-[0_0_15px_rgba(229,9,20,0.4)]"
          >
            90<span className="text-white">+</span>5
          </motion.h2>
          <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
            Donde el tiempo se rompe.
            <br />
            Desde Tegucigalpa, Honduras.
          </p>
        </div>

        {/* 🔗 Enlaces (Acordeón en móvil) */}
        <div className="border-b border-white/10 md:border-none pb-4 md:pb-0">
          <button
            onClick={() => toggleSection("links")}
            className="w-full flex items-center justify-between text-white font-semibold text-lg mb-2 md:mb-4 md:cursor-default focus:outline-none"
          >
            Enlaces
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-300 md:hidden ${openSections["links"] ? "rotate-180 text-[#E50914]" : "text-gray-500"
                }`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${openSections["links"] ? "max-h-[400px] opacity-100 mt-2" : "max-h-0 opacity-0"
              } md:max-h-none md:opacity-100 md:mt-0`}
          >
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <Link href="/rastreo" className="hover:text-[#E50914] transition-colors block py-1">
                  Rastrear Pedido
                </Link>
              </li>
              <li>
                <button
                  onClick={() => handleScrollToSection("faq")}
                  className="hover:text-[#E50914] transition-colors text-left block py-1"
                >
                  Preguntas Frecuentes
                </button>
              </li>
              <li>
                <Link href="/legal/privacidad" className="hover:text-[#E50914] transition-colors block py-1">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/legal/envios" className="hover:text-[#E50914] transition-colors block py-1">
                  Envíos y Devoluciones
                </Link>
              </li>
              <li>
                <Link href="/legal/terminos" className="hover:text-[#E50914] transition-colors block py-1">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <button
                  onClick={() => handleScrollToSection("contacto")}
                  className="hover:text-[#E50914] transition-colors text-left block py-1"
                >
                  Contáctanos
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* 📞 Contacto (Acordeón en móvil) */}
        <div className="border-b border-white/10 md:border-none pb-4 md:pb-0">
          <button
            onClick={() => toggleSection("contact")}
            className="w-full flex items-center justify-between text-white font-semibold text-lg mb-2 md:mb-4 md:cursor-default focus:outline-none"
          >
            Contacto
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-300 md:hidden ${openSections["contact"] ? "rotate-180 text-[#E50914]" : "text-gray-500"
                }`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${openSections["contact"] ? "max-h-[300px] opacity-100 mt-2" : "max-h-0 opacity-0"
              } md:max-h-none md:opacity-100 md:mt-0`}
          >
            <div className="space-y-4 text-sm text-gray-400">
              <p className="flex items-center gap-3">
                <Mail size={16} className="text-[#E50914]" /> contacto@90mas5.store
              </p>
              <p className="flex items-center gap-3">
                <Phone size={16} className="text-[#E50914]" /> +504 3248-8860
              </p>
              <motion.a
                whileHover={{ scale: 1.05 }}
                href={getWhatsappLink({ message: "¡Hola! Quisiera más información." })}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-full bg-[#E50914]/10 border border-[#E50914]/30 hover:bg-[#E50914]/30 transition-all text-sm group"
              >
                <MessageCircle size={16} className="group-hover:text-white transition-colors" />
                <span className="font-medium text-white">Enviar WhatsApp</span>
              </motion.a>
            </div>
          </div>
        </div>
      </div>

      {/* 🌐 Redes Sociales */}
      <div className="relative mt-12 pt-8 border-t border-white/5">
        <div className="flex justify-center gap-8 mb-6">
          {[
            { href: "https://instagram.com/90mas5.store", label: "Instagram", icon: <Instagram size={22} /> },
            { href: "https://facebook.com/90mas5.store", label: "Facebook", icon: <Facebook size={22} /> },
            { href: "https://x.com/90plus5", label: "X (Twitter)", icon: <Twitter size={22} /> },
            { href: "https://www.tiktok.com/@90mas5", label: "TikTok", icon: <TikTokIcon size={20} /> },
          ].map((social, index) => (
            <motion.div
              key={index}
              className="group relative"
              whileHover={{ scale: 1.15, y: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Link
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="text-gray-500 hover:text-[#E50914] transition-colors duration-300 block"
              >
                {social.icon}
              </Link>
              {/* Tooltip */}
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wider font-semibold text-white bg-[#E50914] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap shadow-lg shadow-red-900/20">
                {social.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* ⚽ Derechos */}
        <p className="text-center text-xs text-gray-600 font-medium">
          © {new Date().getFullYear()} 90+5 Store. Todos los derechos reservados.
        </p>
      </div>

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
