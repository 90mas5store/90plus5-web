"use client";
import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import Image from "next/image";

interface CategoryItem {
  nombre?: string;
  Liga?: string;
  imagen?: string;
  "Imagen Liga (URL)"?: string;
  [key: string]: unknown;
}

interface CarruselDeCategoriaProps {
  title?: string;
  items?: CategoryItem[];
  selected?: string | null;
  onSelect?: (nombre: string) => void;
}

export default function CarruselDeCategoria({
  title,
  items = [],
  selected = null,
  onSelect = () => {},
}: CarruselDeCategoriaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Detectar estado de scroll para mostrar/ocultar gradientes
  const updateScrollState = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", updateScrollState, { passive: true });
      return () => el.removeEventListener("scroll", updateScrollState);
    }
  }, [items]);

  if (!items || items.length === 0) return null;

  return (
    <section className="pb-4 md:pb-8 max-w-7xl mx-auto relative">
      {title && (
        <h2 className="text-center text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-4 px-4">
          {title}
        </h2>
      )}

      <div className="relative">
        {/* Gradiente fade izquierdo */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
            canScrollLeft ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Gradiente fade derecho */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
            canScrollRight ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className="flex gap-5 md:gap-7 overflow-x-auto scrollbar-hide px-6 md:px-8 py-2 scroll-smooth"
          role="tablist"
          aria-label="Ligas disponibles"
        >
          {items.map((item) => {
            const nombre = item.nombre || item.Liga;
            const imagen =
              item.imagen ||
              item["Imagen Liga (URL)"] ||
              "/logos/ligas/placeholder.svg";

            if (!nombre) return null;

            const isSelected = selected === nombre;

            return (
              <motion.button
                key={nombre}
                role="tab"
                aria-selected={isSelected}
                onClick={() => onSelect(nombre)}
                whileTap={{ scale: 0.92 }}
                className="flex-shrink-0 flex flex-col items-center gap-2 group outline-none"
              >
                {/* Avatar circular */}
                <div
                  className={`relative w-[68px] h-[68px] md:w-20 md:h-20 rounded-full transition-all duration-400 ease-out ${
                    isSelected
                      ? "ring-[2.5px] ring-[#E50914] ring-offset-2 ring-offset-black shadow-[0_0_20px_rgba(229,9,20,0.35)]"
                      : "ring-[1.5px] ring-white/10 ring-offset-1 ring-offset-black group-hover:ring-white/30"
                  }`}
                >
                  {/* Fondo interior */}
                  <div
                    className={`absolute inset-0 rounded-full transition-colors duration-300 ${
                      isSelected
                        ? "bg-gradient-to-br from-[#1a0505] to-[#0a0a0a]"
                        : "bg-[#0e0e0e] group-hover:bg-[#141414]"
                    }`}
                  />

                  {/* Logo */}
                  <div className="absolute inset-0 flex items-center justify-center p-3.5 md:p-4">
                    <Image
                      src={imagen}
                      alt={nombre}
                      width={48}
                      height={48}
                      unoptimized={imagen.endsWith(".svg")}
                      className={`object-contain w-full h-full transition-all duration-400 ${
                        isSelected
                          ? "brightness-110 drop-shadow-[0_0_8px_rgba(229,9,20,0.3)] scale-105"
                          : "brightness-75 group-hover:brightness-100 drop-shadow-[0_0_6px_rgba(255,255,255,0.1)]"
                      }`}
                      sizes="(max-width: 768px) 68px, 80px"
                    />
                  </div>
                </div>

                {/* Nombre */}
                <span
                  className={`text-[10px] md:text-[11px] font-semibold tracking-wide text-center leading-tight max-w-[76px] md:max-w-[88px] line-clamp-2 transition-colors duration-300 ${
                    isSelected
                      ? "text-white"
                      : "text-gray-500 group-hover:text-gray-300"
                  }`}
                >
                  {nombre}
                </span>

                {/* Indicador dot activo */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="w-1 h-1 rounded-full bg-[#E50914] shadow-[0_0_6px_rgba(229,9,20,0.6)]"
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
