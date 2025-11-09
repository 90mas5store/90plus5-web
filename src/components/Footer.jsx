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

export default function Footer() {
  const router = useRouter();

  // 🔄 Navegación con scroll suave hacia secciones de /conectar
  const handleScrollToSection = async (sectionId) => {
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
    <footer className="relative bg-gradient-to-b from-[#0A0A0A]/95 to-black border-t border-white/10 py-8 text-gray-300">
      {/* 🔥 Aura superior */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#E50914]/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
        {/* 🏷️ Branding */}
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-extrabold text-[#E50914] drop-shadow-[0_0_15px_rgba(229,9,20,0.4)]"
          >
            90<span className="text-white">+</span>5
          </motion.h2>
          <p className="mt-3 text-sm text-gray-400 max-w-xs leading-relaxed">
            Donde el tiempo se rompe.  
            <br />
            Desde Tegucigalpa, Honduras.
          </p>
        </div>

        {/* 🔗 Enlaces */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-lg mb-3">Enlaces</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <button
                onClick={() => handleScrollToSection("faq")}
                className="hover:text-[#E50914] transition-colors"
              >
                Preguntas Frecuentes
              </button>
            </li>
            <li>
              <button
                onClick={() => handleScrollToSection("privacidad")}
                className="hover:text-[#E50914] transition-colors"
              >
                Política de Privacidad
              </button>
            </li>
            <li>
              <button
                onClick={() => handleScrollToSection("contacto")}
                className="hover:text-[#E50914] transition-colors"
              >
                Contáctanos
              </button>
            </li>
          </ul>
        </div>

        {/* 📞 Contacto */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-lg mb-3">Contacto</h3>
          <p className="flex items-center gap-2 text-sm">
            <Mail size={16} className="text-[#E50914]" /> hola@90plus5.store
          </p>
          <p className="flex items-center gap-2 text-sm">
            <Phone size={16} className="text-[#E50914]" /> +504 9876-5432
          </p>
          <motion.a
            whileHover={{ scale: 1.05 }}
            href="https://wa.me/50496649622"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 px-5 py-2 rounded-full bg-[#E50914]/20 border border-[#E50914]/50 hover:bg-[#E50914]/40 transition-all text-sm"
          >
            <MessageCircle size={16} /> Enviar WhatsApp
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

