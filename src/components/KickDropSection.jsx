"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import React from "react";

export default function KickDropSection() {
  const router = useRouter();

  const videos = [
    {
      src: "/videos/barcelona.mp4",
      titulo: "FC Barcelona 25/26",
      descripcion: "La historia nunca muere.",
      link: "/catalogo?categoria=Barcelona",
    },
    {
      src: "/videos/olimpia.mp4",
      titulo: "Olimpia Legacy",
      descripcion: "Sangre, garra y gloria.",
      link: "/catalogo?categoria=Olimpia",
    },
    {
      src: "/videos/retro.mp4",
      titulo: "Retro Mundial",
      descripcion: "Clásicos que marcaron eras.",
      link: "/catalogo?categoria=Retro",
    },
  ];

  return (
    <section
      id="kickdrop"
      className="relative py-20 px-4 max-w-7xl mx-auto overflow-hidden"
    >
      {/* 🔥 Título */}
      <motion.h2
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center text-4xl font-bold text-[#E50914] mb-10 drop-shadow-[0_0_25px_rgba(229,9,20,0.45)]"
      >
        Kick Drops 🎥
      </motion.h2>

      {/* 🎞️ Carrusel horizontal */}
      <div className="flex overflow-x-auto gap-6 snap-x snap-mandatory scrollbar-hide pb-6">
        {videos.map((v, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15, duration: 0.6 }}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 30px rgba(229,9,20,0.25)",
              borderColor: "rgba(229,9,20,0.4)",
            }}
            className="relative min-w-[280px] sm:min-w-[340px] md:min-w-[400px] h-[500px] snap-center rounded-2xl overflow-hidden border border-[#222] bg-[#111]/70 backdrop-blur-md transition-all duration-500"
          >
            {/* 🎥 Video */}
            <video
              src={v.src}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />

            {/* 📄 Info */}
            <div className="absolute bottom-6 left-6 z-10 max-w-[80%]">
              <h3 className="text-xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                {v.titulo}
              </h3>
              <p className="text-gray-300 text-sm mt-1">{v.descripcion}</p>
              <motion.button
                onClick={() => router.push(v.link)}
                whileHover={{
                  backgroundColor: "#ff1f27",
                  scale: 1.05,
                  boxShadow: "0 0 15px rgba(229,9,20,0.6)",
                }}
                className="mt-4 px-5 py-2.5 bg-[#E50914] text-white font-semibold rounded-full text-sm shadow-[0_0_10px_rgba(229,9,20,0.4)] transition-all"
              >
                Ver colección
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
