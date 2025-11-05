'use client';
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const [destacados, setDestacados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const response = await fetch(
          "https://script.google.com/macros/s/AKfycbx3RYRMJ8vz_cfc_jhZh3t6FciJ3iszAMh83enMkv8dvBmz8uQonQ_nMCkBVK7jQDNkwg/exec?action=getFeatured"
        );
        const data = await response.json();
        setDestacados(data || []);
      } catch (error) {
        console.error("Error cargando los productos destacados:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFeatured();
  }, []);

  return (
    <main className="bg-black text-white min-h-screen relative overflow-hidden">
      
      {/* HEADER */}
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
          <a href="/" className="text-white font-semibold transition">Inicio</a>
          <a href="/catalogo" className="hover:text-white transition">Catálogo</a>
          <a href="/contacto" className="hover:text-white transition">Contacto</a>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section className="relative flex flex-col items-center justify-center min-h-[100vh] text-center overflow-hidden">
        {/* Fondo hero */}
        <div className="absolute inset-0">
          <img
            src="/fondo.jpg"
            alt="Fondo místico 90+5"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#0A0A0A]/80 to-[#150021]/90"></div>
        </div>

        {/* Efectos */}
        <div className="absolute w-[600px] h-[600px] bg-[#E50914] blur-[200px] opacity-25 rounded-full -top-40 left-1/2 -translate-x-1/2"></div>
        <div className="absolute w-[400px] h-[400px] bg-[#651FFF] blur-[180px] opacity-20 rounded-full bottom-0 right-1/4"></div>

        {/* Contenido hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="z-10 mt-20"
        >
          <div className="flex flex-col items-center mb-6">
            <div className="text-[80px] font-extrabold tracking-tight leading-none text-[#E50914] drop-shadow-[0_0_25px_rgba(229,9,20,0.5)]">
              90<span className="text-white">+</span>5
            </div>
            <p className="text-gray-400 mt-3 text-sm tracking-widest uppercase">
              El tiempo se rompe aquí.
            </p>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-100 mb-6"
          >
            Donde los goles viven más allá del minuto 90.
          </motion.h1>

          <motion.a
            href="#destacados"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="inline-block mt-4 px-8 py-3 bg-[#E50914] text-white font-semibold rounded-full shadow-lg hover:bg-[#b0060e] transition-all"
          >
            Explorar destacados
          </motion.a>
        </motion.div>
      </section>

      {/* SECCIÓN DESTACADOS */}
      <section id="destacados" className="py-20 px-4 max-w-7xl mx-auto">
        <h2 className="text-center text-4xl font-bold text-primary mb-10">
          Destacados 90+5
        </h2>

        {loading ? (
          <p className="text-center text-gray-400">Cargando productos...</p>
        ) : destacados.length === 0 ? (
          <p className="text-center text-gray-400">
            No hay productos destacados en este momento.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {destacados.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.05 }}
                className="bg-[#111]/80 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden border border-[#222] transition-all hover:border-[#E50914]/50"
              >
                <div className="relative">
                  <img
                    src={item.imagen}
                    alt={item.modelo}
                    className="w-full h-64 object-cover"
                  />
                  {item.logoEquipo && (
                    <div className="absolute top-3 left-3 bg-white/90 rounded-full p-1 shadow-md">
                      <img
                        src={item.logoEquipo}
                        alt={item.equipo}
                        className="w-8 h-8 object-contain"
                      />
                    </div>
                  )}
                </div>

                <div className="p-4 text-center">
                  <h2 className="text-lg font-semibold text-white mb-1">
                    {item.equipo}
                  </h2>
                  <p className="text-sm text-gray-400 mb-1">
                    {item.modelo}
                  </p>
                  <p className="text-primary font-bold text-lg mb-4">
                    L{item.precio}
                  </p>
                  <button className="w-full py-2 rounded-full bg-primary hover:bg-accent text-white font-semibold transition-all">
                    Ver más
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <a
            href="/catalogo"
            className="inline-block px-8 py-3 bg-primary text-white rounded-full font-semibold hover:bg-accent transition-all"
          >
            Ver catálogo completo
          </a>
        </div>
      </section>
    </main>
  );
}

