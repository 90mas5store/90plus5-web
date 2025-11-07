'use client';
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { getFeatured, getConfig } from "@/lib/api";
import Button from "@/components/ui/Button";

export default function Home() {
  const [destacados, setDestacados] = useState([]);
  const [ligas, setLigas] = useState([]);
  const [ligaSeleccionada, setLigaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);

  // === Cargar destacados y ligas ===
  useEffect(() => {
    async function fetchData() {
      try {
        const [featuredData, configData] = await Promise.all([
          getFeatured(),
          getConfig(),
        ]);
        setDestacados(featuredData || []);
        setLigas(configData.ligas || []);
      } catch (error) {
        console.error("Error cargando los datos del Home:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // === Filtrado local por liga ===
  const destacadosFiltrados = ligaSeleccionada
    ? destacados.filter(
        (item) =>
          item.liga &&
          item.liga.toLowerCase() === ligaSeleccionada.toLowerCase()
      )
    : destacados;

  return (
    <main className="bg-black text-white min-h-screen relative overflow-hidden">
      {/* 🏟️ HERO SECTION */}
      <section className="relative flex flex-col items-center justify-center min-h-[100vh] text-center overflow-hidden">
        {/* Fondo */}
        <div className="absolute inset-0">
          <Image
            src="/fondo.jpg"
            alt="Fondo 90+5"
            fill
            priority
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#0A0A0A]/80 to-[#150021]/90" />
        </div>

        {/* Contenido principal */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="z-10 mt-20"
        >
          {/* Logotipo de texto 90+5 */}
          <div className="flex flex-col items-center mb-6">
            <div className="text-[100px] sm:text-[120px] md:text-[140px] font-extrabold tracking-tight leading-none text-[#E50914] drop-shadow-[0_0_35px_rgba(229,9,20,0.5)] select-none">
              90<span className="text-white">+</span>5
            </div>

            {/* Primer tagline */}
            <p className="text-gray-400 mt-3 text-sm tracking-widest uppercase">
              El tiempo se rompe aquí.
            </p>

            {/* Segundo tagline / CTA */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl font-light text-gray-100 mt-4 max-w-lg"
            >
              Donde el fútbol no termina en el 90... comienza la historia.
            </motion.p>
          </div>

          {/* Botón CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Button
              onClick={() =>
                document
                  .getElementById("ligas")
                  ?.scrollIntoView({ behavior: "smooth", block: "center" })
              }
              className="mt-8 px-10 py-3"
            >
              Explorar colección
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* 🏆 LIGAS */}
      {/* 🏆 CARRUSEL DE LIGAS */}
<section id="ligas" className="px-4 pb-12 max-w-6xl mx-auto text-center">
  <h2 className="text-3xl font-semibold mb-8 text-[#E50914]">
    Ligas disponibles
  </h2>

  <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide justify-center flex-wrap">
    {Array.isArray(ligas) && ligas.length > 0 ? (
      ligas.map((liga) => (
        <motion.div
          key={liga.nombre}
          onClick={() =>
            setLigaSeleccionada(
              ligaSeleccionada === liga.nombre ? null : liga.nombre
            )
          }
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.3 }}
          className={`cursor-pointer flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
            ligaSeleccionada === liga.nombre
              ? "bg-[#E50914]/20 border border-[#E50914]/50 shadow-[0_0_15px_rgba(229,9,20,0.3)]"
              : "bg-[#111]/60 border border-[#222] hover:border-[#E50914]/30"
          }`}
        >
          {liga.imagen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex items-center justify-center mb-2"
            >
              <Image
                src={liga.imagen}
                alt={liga.nombre}
                width={64}
                height={64}
                className="object-contain mix-blend-screen drop-shadow-[0_0_6px_rgba(255,255,255,0.4)] hover:drop-shadow-[0_0_12px_rgba(229,9,20,0.6)] transition-all duration-500 ease-in-out"
              />
            </motion.div>
          )}
          <p className="text-xs text-gray-300">{liga.nombre}</p>
        </motion.div>
      ))
    ) : (
      <p className="text-gray-400 text-center">No hay ligas disponibles</p>
    )}
  </div>

  {/* 🔗 Enlace dinámico */}
  <div className="text-center mt-6">
    <a
      href={`/catalogo${
        ligaSeleccionada
          ? `?liga=${encodeURIComponent(ligaSeleccionada)}`
          : ""
      }`}
      className="inline-block text-sm text-gray-400 hover:text-white transition-all"
    >
      Ver más de {ligaSeleccionada || "todas las ligas"} →
    </a>
  </div>
</section>


      {/* ⭐ DESTACADOS */}
      <section id="destacados" className="py-20 px-4 max-w-7xl mx-auto">
        <h2 className="text-center text-4xl font-bold text-[#E50914] mb-10">
          {ligaSeleccionada
            ? `Destacados de ${ligaSeleccionada}`
            : "Destacados 90+5"}
        </h2>

        {loading ? (
          <p className="text-center text-gray-400">Cargando productos...</p>
        ) : destacadosFiltrados.length === 0 ? (
          <p className="text-center text-gray-400">
            No hay productos destacados en esta liga.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {destacadosFiltrados.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.05 }}
                className="bg-[#111]/80 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden border border-[#222] hover:border-[#E50914]/50 transition-all"
              >
                <div className="relative">
                  {item.logoEquipo && (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.6 }}
    className="absolute top-3 left-3"
  >
    <Image
      src={item.logoEquipo}
      alt={item.equipo}
      width={40}
      height={40}
      className="object-contain mix-blend-screen drop-shadow-[0_0_6px_rgba(255,255,255,0.5)] hover:drop-shadow-[0_0_12px_rgba(229,9,20,0.6)] transition-all duration-500 ease-in-out"
    />
  </motion.div>
)}

                  <Image
                    src={item.imagen}
                    alt={item.modelo}
                    width={400}
                    height={400}
                    className="w-full h-64 object-cover"
                  />
                </div>
                <div className="p-4 text-center">
                  <h2 className="text-lg font-semibold text-white">
                    {item.equipo} <span className="text-gray-400">| {item.modelo}</span>
                  </h2>
                  <p className="text-[#E50914] font-bold mt-2">
                    L{item.precio}
                  </p>
                  <Button
                    onClick={() =>
                      (window.location.href = `/producto/${item.id}`)
                    }
                    className="mt-4 w-full"
                  >
                    Ver más
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}



