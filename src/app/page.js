'use client';
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const [destacados, setDestacados] = useState([]);
  const [ligas, setLigas] = useState([]);
  const [ligaSeleccionada, setLigaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);

  // === Cargar destacados y ligas ===
  useEffect(() => {
    async function fetchData() {
      try {
        const [featuredRes, configRes] = await Promise.all([
          fetch(
            "https://script.google.com/macros/s/AKfycbx3RYRMJ8vz_cfc_jhZh3t6FciJ3iszAMh83enMkv8dvBmz8uQonQ_nMCkBVK7jQDNkwg/exec?action=getFeatured"
          ),
          fetch(
            "https://script.google.com/macros/s/AKfycbx3RYRMJ8vz_cfc_jhZh3t6FciJ3iszAMh83enMkv8dvBmz8uQonQ_nMCkBVK7jQDNkwg/exec?action=getConfig"
          ),
        ]);

        const destacadosData = await featuredRes.json();
        const configData = await configRes.json();

        setDestacados(destacadosData || []);
        setLigas(configData.ligas || []);
      } catch (error) {
        console.error("Error cargando los datos del Home:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // === Filtrado local por liga seleccionada ===
  const destacadosFiltrados = ligaSeleccionada
    ? destacados.filter(
        (item) =>
          item.liga &&
          item.liga.toLowerCase() === ligaSeleccionada.toLowerCase()
      )
    : destacados;

  return (
    <main className="bg-black text-white min-h-screen relative overflow-hidden">
      {/* HEADER FIJO CON LOGO */}
      <header className="fixed top-0 left-0 w-full flex items-center justify-between p-6 z-30 backdrop-blur-md bg-black/30 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Logo 90+5"
            className="w-10 h-10 object-contain"
          />
          <span className="text-white text-lg font-semibold tracking-widest">
            90+5 Store
          </span>
        </div>

        <nav className="hidden sm:flex items-center gap-6 text-gray-300 text-sm">
          <a href="/" className="text-white font-semibold transition">
            Inicio
          </a>
          <a href="/catalogo" className="hover:text-white transition">
            Catálogo
          </a>
          <a href="/contacto" className="hover:text-white transition">
            Contacto
          </a>
        </nav>
      </header>

      {/* 🏟️ HERO SECTION FINAL SIN PARPADEOS */}
<section className="relative flex flex-col items-center justify-center min-h-[100vh] text-center overflow-hidden">
  {/* Fondo */}
  <div className="absolute inset-0">
    <img
      src="/fondo.jpg"
      alt="Fondo místico 90+5"
      className="w-full h-full object-cover opacity-40"
    />
    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#0A0A0A]/80 to-[#150021]/90" />
  </div>

  {/* Glow pulsante (solo fondo) */}
  <motion.div
    initial={{ opacity: 0.3, scale: 1 }}
    animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    className="absolute top-[40%] left-1/2 -translate-x-1/2 w-[250px] h-[250px] md:w-[400px] md:h-[400px] 
    bg-[#E50914] blur-[140px] rounded-full pointer-events-none"
  />

  {/* Contenido principal */}
  <div className="z-10 mt-28 flex flex-col items-center text-center px-4">
    {/* Marca principal */}
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="text-[90px] sm:text-[110px] md:text-[130px] font-extrabold tracking-tight leading-[0.9] 
      text-[#E50914] drop-shadow-[0_0_40px_rgba(229,9,20,0.6)] select-none"
    >
      90<span className="text-white">+</span>5
    </motion.div>

    {/* Primer tagline */}
    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 1 }}
      className="text-gray-400 mt-3 text-sm sm:text-base tracking-[0.3em] uppercase"
    >
      El tiempo se rompe aquí.
    </motion.p>

    {/* Segundo tagline (nuevo con llamada a la acción) */}
    <motion.h1
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 1 }}
      className="mt-5 text-xl sm:text-2xl md:text-3xl font-light text-gray-200 leading-snug max-w-2xl"
    >
      Viví el tiempo extra con estilo.
    </motion.h1>

    {/* Botón */}
    <motion.a
      href="#ligas"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
      className="inline-block mt-10 px-8 py-3 bg-[#E50914] text-white font-semibold rounded-full shadow-lg hover:bg-[#b0060e] transition-all text-base sm:text-lg"
    >
      Explorar colección
    </motion.a>
  </div>
</section>


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
                className={`cursor-pointer flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                  ligaSeleccionada === liga.nombre
                    ? "bg-[#E50914]/20 border border-[#E50914]/50 shadow-[0_0_15px_rgba(229,9,20,0.3)]"
                    : "bg-[#111]/60 border border-[#222]"
                }`}
              >
                {liga.imagen && (
                  <img
                    src={liga.imagen}
                    alt={liga.nombre}
                    className="w-14 h-14 object-contain mb-2"
                  />
                )}
                <p className="text-xs text-gray-300">{liga.nombre}</p>
              </motion.div>
            ))
          ) : (
            <p className="text-gray-400 text-center">
              No hay ligas disponibles
            </p>
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

      {/* ⭐ SECCIÓN DESTACADOS */}
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
                className="bg-[#111]/80 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden border border-[#222] transition-all hover:border-[#E50914]/50"
              >
                <div className="relative">
                  {item.logoEquipo && (
                    <img
                      src={item.logoEquipo}
                      alt={item.equipo}
                      className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white object-contain p-0.5"
                    />
                  )}
                  <img
                    src={item.imagen}
                    alt={item.modelo}
                    className="w-full h-64 object-cover"
                  />
                </div>
                <div className="p-4 text-center">
                  <h2 className="text-lg font-semibold text-white">
                    {item.equipo}
                  </h2>
                  <p className="text-sm text-gray-400">{item.modelo}</p>
                  <p className="text-[#E50914] font-bold mt-2">
                    L{item.precio}
                  </p>
                  <button
                    onClick={() =>
                      (window.location.href = `/producto/${item.id}`)
                    }
                    className="w-full mt-3 py-2 rounded-full bg-[#E50914] hover:bg-[#b0060e] text-white font-semibold transition-all"
                  >
                    Ver más
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

