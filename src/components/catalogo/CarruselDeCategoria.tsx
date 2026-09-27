"use client";
import { useRef, useState, useEffect } from "react";
import { motion } from "@/lib/motion";
import Image from "next/image";
import { Sparkles } from "lucide-react";

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
    <section className="pb-4 md:pb-6 max-w-7xl mx-auto relative select-none">
      {title && (
        <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 mb-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
            {title}
          </span>
          {selected && (
            <button
              onClick={() => onSelect("")}
              className="text-[11px] text-red-400 hover:text-red-300 font-semibold tracking-wide transition-colors cursor-pointer"
            >
              Mostrar todas
            </button>
          )}
        </div>
      )}

      <div className="relative">
        {/* Gradiente fade izquierdo Apple Style */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
            canScrollLeft ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Gradiente fade derecho Apple Style */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
            canScrollRight ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Apple Segmented Filter Rail (Cápsulas de vidrio horizontales) */}
        <div
          ref={scrollRef}
          className="flex gap-2 sm:gap-2.5 overflow-x-auto scrollbar-hide px-4 sm:px-6 md:px-8 py-1.5 overscroll-x-contain items-center justify-start"
          role="tablist"
          aria-label="Ligas disponibles"
        >
          {/* Opción 'Todas las Ligas' */}
          <button
            role="tab"
            aria-selected={!selected}
            onClick={() => onSelect("")}
            className={`relative shrink-0 flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-full text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
              !selected
                ? "text-white"
                : "bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/70 hover:text-white"
            }`}
          >
            {!selected && (
              <motion.div
                layoutId="activeLeagueCapsule"
                className="absolute inset-0 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 shadow-[0_2px_12px_rgba(255,255,255,0.15)]"
                transition={{ type: "spring", damping: 26, stiffness: 350 }}
              />
            )}
            <Sparkles className={`w-3.5 h-3.5 relative z-10 ${!selected ? 'text-amber-400' : 'text-gray-400'}`} />
            <span className="relative z-10 tracking-tight">Todas</span>
          </button>

          {/* Ligas en cápsulas translúcidas */}
          {items.map((item) => {
            const nombre = item.nombre || item.Liga;
            const imagen =
              item.imagen ||
              item["Imagen Liga (URL)"] ||
              "/logos/ligas/placeholder.svg";

            if (!nombre) return null;

            const isSelected = selected === nombre;

            return (
              <button
                key={nombre}
                role="tab"
                aria-selected={isSelected}
                onClick={() => onSelect(nombre)}
                className={`relative shrink-0 flex items-center gap-2.5 px-3.5 py-2 sm:px-4 sm:py-2 min-h-[44px] rounded-full text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                  isSelected
                    ? "text-white"
                    : "bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/70 hover:text-white"
                }`}
              >
                {/* Píldora activa deslizante con física de resortes Apple */}
                {isSelected && (
                  <motion.div
                    layoutId="activeLeagueCapsule"
                    className="absolute inset-0 rounded-full bg-[#E50914] shadow-[0_4px_18px_rgba(229,9,20,0.45)] border border-red-400/40"
                    transition={{ type: "spring", damping: 26, stiffness: 350 }}
                  />
                )}

                {/* Logo normalizado */}
                <div className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center shrink-0">
                  <Image
                    src={imagen}
                    alt=""
                    aria-hidden="true"
                    width={20}
                    height={20}
                    className="w-full h-full object-contain filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
                  />
                </div>

                {/* Nombre de Liga en Cápsula */}
                <span className="relative z-10 tracking-tight whitespace-nowrap">
                  {nombre}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
