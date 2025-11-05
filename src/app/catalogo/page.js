'use client';
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";

export default function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [ligas, setLigas] = useState([]);
  const [ligaActiva, setLigaActiva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  // --- Cargar catálogo y configuración ---
  useEffect(() => {
    async function fetchData() {
      try {
        const [resCatalogo, resConfig] = await Promise.all([
          fetch("https://script.google.com/macros/s/AKfycbx3RYRMJ8vz_cfc_jhZh3t6FciJ3iszAMh83enMkv8dvBmz8uQonQ_nMCkBVK7jQDNkwg/exec?action=getCatalog"),
          fetch("https://script.google.com/macros/s/AKfycbx3RYRMJ8vz_cfc_jhZh3t6FciJ3iszAMh83enMkv8dvBmz8uQonQ_nMCkBVK7jQDNkwg/exec?action=getConfig")
        ]);
        const catalogData = await resCatalogo.json();
        const configData = await resConfig.json();

        setProductos(catalogData || []);
        setFiltered(catalogData || []);
        setLigas(configData.ligas || []);

        // Si viene con ?liga=XXX desde el home
        const ligaURL = searchParams.get("liga");
        if (ligaURL) setLigaActiva(ligaURL);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [searchParams]);

  // --- Filtro de búsqueda + liga activa (debounce) ---
  useEffect(() => {
    const delay = setTimeout(() => {
      let filteredData = productos;

      // Filtrar por liga activa
      if (ligaActiva) {
        filteredData = filteredData.filter((p) => p.liga === ligaActiva);
      }

      // Filtrar por texto
      if (search.trim()) {
        const query = search.toLowerCase();
        filteredData = filteredData.filter((item) => {
          const combined =
            `${item.equipo} ${item.modelo} ${item.tipo} ${item.liga} ${item.color}`.toLowerCase();
          return combined.includes(query);
        });
      }

      setFiltered(filteredData);
    }, 300);

    return () => clearTimeout(delay);
  }, [search, productos, ligaActiva]);

  // --- Seleccionar o deseleccionar liga ---
  const handleLigaClick = (ligaNombre) => {
    if (ligaActiva === ligaNombre) {
      setLigaActiva(null);
      router.push("/catalogo"); // quita el query param
    } else {
      setLigaActiva(ligaNombre);
      router.push(`/catalogo?liga=${encodeURIComponent(ligaNombre)}`);
    }
  };

  return (
    <main className="bg-black text-white min-h-screen relative overflow-hidden">
      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full flex items-center justify-between p-6 z-30 backdrop-blur-md bg-black/30 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo 90+5" className="w-10 h-10 object-contain" />
          <span className="text-white text-lg font-semibold tracking-widest">
            90+5 Store
          </span>
        </div>
        <nav className="hidden sm:flex items-center gap-6 text-gray-300 text-sm">
          <a href="/" className="hover:text-white transition">Inicio</a>
          <a href="/catalogo" className="text-white font-semibold transition">Catálogo</a>
          <a href="/contacto" className="hover:text-white transition">Contacto</a>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative flex flex-col items-center justify-center min-h-[60vh] text-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="/fondo.jpg" alt="Fondo catálogo" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#0A0A0A]/80 to-[#150021]/90"></div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="z-10 mt-24"
        >
          <h1 className="text-5xl font-extrabold text-[#E50914] drop-shadow-[0_0_20px_rgba(229,9,20,0.5)]">
            Catálogo <span className="text-white">90+5</span>
          </h1>
          <p className="text-gray-400 mt-4 max-w-xl mx-auto text-sm">
            Explora nuestras prendas y revive la mística del fútbol.
          </p>
        </motion.div>
      </section>

      {/* 🧭 Breadcrumb */}
      <div className="px-6 mt-4 text-sm text-gray-400 max-w-7xl mx-auto">
        <a href="/" className="hover:text-white transition">Inicio</a> {"›"}{" "}
        <a href="/catalogo" className="hover:text-white transition">Catálogo</a>
        {ligaActiva && (
          <>
            {" › "}
            <span className="text-white font-semibold">{ligaActiva}</span>
          </>
        )}
      </div>

      {/* 🏆 Carrusel de Ligas */}
      <section className="relative z-10 mt-6 mb-10 px-6 max-w-7xl mx-auto">
        <h3 className="text-xl font-semibold mb-4 text-center text-gray-200">
          Explorar por Liga
        </h3>
        <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide justify-center">
          {ligas.map((liga) => (
            <motion.div
              key={liga.nombre}
              onClick={() => handleLigaClick(liga.nombre)}
              whileHover={{ scale: 1.08 }}
              className={`cursor-pointer flex flex-col items-center justify-center min-w-[100px] p-3 rounded-xl transition-all ${
                ligaActiva === liga.nombre
                  ? "bg-[#E50914]/20 border border-[#E50914]"
                  : "bg-[#111]/60 border border-transparent hover:border-[#E50914]/50"
              }`}
            >
              {liga.imagen ? (
                <img
                  src={liga.imagen}
                  alt={liga.nombre}
                  className="w-14 h-14 object-contain mb-2"
                />
              ) : (
                <div className="w-14 h-14 mb-2 bg-[#222] rounded-full flex items-center justify-center text-gray-500 text-xs">
                  N/A
                </div>
              )}
              <span className="text-xs text-center">{liga.nombre}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 🔍 Barra de búsqueda */}
      <section className="relative z-10 mt-[-20px] mb-10 px-6 flex justify-center">
        <div className="w-full max-w-md bg-[#111]/80 backdrop-blur-lg border border-[#222] rounded-full px-5 py-3 flex items-center shadow-md">
          <input
            type="text"
            placeholder="Buscar por equipo, liga o tipo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-gray-200 w-full placeholder-gray-500 text-sm"
          />
          <span className="text-gray-400 text-lg ml-2">⌕</span>
        </div>
      </section>

      {/* 🏟️ Productos */}
      <section className="py-10 px-4 max-w-7xl mx-auto">
        {loading ? (
          <p className="text-center text-gray-400">Cargando productos...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400">
            No se encontraron productos que coincidan.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filtered.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.05 }}
                className="bg-[#111]/80 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden border border-[#222] transition-all hover:border-[#E50914]/50"
              >
                <img
                  src={item.imagen}
                  alt={item.modelo}
                  className="w-full h-64 object-cover"
                />
                <div className="p-4 text-center">
                  {item.logoEquipo && (
                    <div className="flex justify-center mb-3">
                      <img
                        src={item.logoEquipo}
                        alt={item.equipo}
                        className="w-8 h-8 rounded-full object-contain bg-white p-0.5"
                      />
                    </div>
                  )}
                  <h2 className="text-lg font-semibold text-white">{item.equipo}</h2>
                  <p className="text-sm text-gray-400">{item.modelo}</p>
                  <p className="text-primary font-bold mt-2">L{item.precio}</p>
                  <button className="mt-4 w-full py-2 rounded-full bg-primary hover:bg-accent text-white font-semibold transition-all">
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

