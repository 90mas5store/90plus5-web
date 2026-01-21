"use client";
import { useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CategoryItem {
  nombre?: string;
  Liga?: string;
  imagen?: string;
  "Imagen Liga (URL)"?: string;
  [key: string]: any;
}

interface CarruselDeCategoriaProps {
  title?: string;
  items?: CategoryItem[];
  selected?: string | null;
  onSelect?: (nombre: string) => void;
}

export default function CarruselDeCategoria({
  title = "Ligas disponibles",
  items = [],
  selected = null,
  onSelect = () => { },
}: CarruselDeCategoriaProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = 300;
      const maxScroll = current.scrollWidth - current.clientWidth;

      if (direction === "left") {
        // Si está al inicio, ir al final
        if (current.scrollLeft <= 5) { // Pequeña tolerancia
          current.scrollTo({ left: maxScroll, behavior: "smooth" });
        } else {
          current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
        }
      } else {
        // Si está al final, volver al inicio
        if (current.scrollLeft >= maxScroll - 5) {
          current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
      }
    }
  };

  if (!items || items.length === 0)
    return (
      <p className="text-gray-400 text-center py-8">
        No hay elementos para mostrar.
      </p>
    );

  return (
    <section className="px-4 pb-6 md:pb-12 max-w-7xl mx-auto text-center relative group">
      {title && (
        <h2 className="text-2xl md:text-3xl font-semibold mb-6 md:mb-8 text-[#E50914] drop-shadow-[0_0_15px_rgba(229,9,20,0.35)]">
          {title}
        </h2>
      )}

      <div className="relative flex items-center">
        {/* Left Arrow */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 z-10 p-2 bg-black/50 hover:bg-[#E50914] rounded-full text-white backdrop-blur-sm transition-all -ml-4 md:-ml-8 hidden md:flex"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-3 md:gap-6 pb-4 scrollbar-hide px-4 w-full snap-x snap-mandatory"
          style={{ scrollBehavior: "smooth" }}
        >
          {items.map((item) => {
            const nombre = item.nombre || item.Liga;
            const imagen =
              item.imagen ||
              item["Imagen Liga (URL)"] ||
              "/logos/ligas/placeholder.svg";

            if (!nombre) return null;

            return (
              <motion.div
                key={nombre}
                onClick={() => onSelect(nombre)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex-shrink-0 snap-center cursor-pointer flex flex-col items-center justify-between p-2 md:p-3 rounded-xl transition-all w-24 md:w-32 h-28 md:h-36 ${selected === nombre
                  ? "bg-[#E50914]/20 border border-[#E50914]/50 shadow-[0_0_20px_rgba(229,9,20,0.4)]"
                  : "bg-[#111]/60 border border-[#222] hover:border-[#E50914]/30"
                  }`}
              >
                <div className="relative w-14 h-14 md:w-16 md:h-16 mb-2">
                  <Image
                    src={imagen}
                    alt={nombre}
                    fill
                    unoptimized={imagen.endsWith('.svg')}
                    className="object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]"
                    sizes="(max-width: 768px) 56px, 64px"
                  />
                </div>
                <div className="flex-1 flex items-center justify-center w-full">
                  <p className="text-[10px] md:text-xs text-gray-300 font-medium text-center leading-tight line-clamp-2">
                    {nombre}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 z-10 p-2 bg-black/50 hover:bg-[#E50914] rounded-full text-white backdrop-blur-sm transition-all -mr-4 md:-mr-8 hidden md:flex"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
}
