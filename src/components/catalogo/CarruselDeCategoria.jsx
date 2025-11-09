"use client";
import { motion } from "framer-motion";
import Image from "next/image";

export default function CarruselDeCategoria({
  title = "Ligas disponibles",
  items = [],
  selected = null,
  onSelect = () => {},
}) {
  if (!items || items.length === 0)
    return (
      <p className="text-gray-400 text-center py-8">
        No hay elementos para mostrar.
      </p>
    );

  return (
    <section className="px-4 pb-12 max-w-6xl mx-auto text-center">
      {title && (
        <h2 className="text-3xl font-semibold mb-8 text-[#E50914] drop-shadow-[0_0_15px_rgba(229,9,20,0.35)]">
          {title}
        </h2>
      )}

      <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide justify-center flex-wrap">
        {items.map((item) => {
          const nombre = item.nombre || item.Liga;
          const imagen =
            item.imagen ||
            item["Imagen Liga (URL)"] ||
            "/logos/ligas/placeholder.svg";

          return (
            <motion.div
              key={nombre}
              onClick={() => onSelect(nombre)}
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
              className={`cursor-pointer flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                selected === nombre
                  ? "bg-[#E50914]/20 border border-[#E50914]/50 shadow-[0_0_20px_rgba(229,9,20,0.4)]"
                  : "bg-[#111]/60 border border-[#222] hover:border-[#E50914]/30"
              }`}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="flex items-center justify-center mb-2"
              >
                <Image
                  src={imagen}
                  alt={nombre}
                  width={64}
                  height={64}
                  className="object-contain mix-blend-screen drop-shadow-[0_0_8px_rgba(255,255,255,0.35)] hover:drop-shadow-[0_0_16px_rgba(229,9,20,0.7)] transition-all duration-500 ease-in-out"
                />
              </motion.div>
              <p className="text-xs text-gray-300">{nombre}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

