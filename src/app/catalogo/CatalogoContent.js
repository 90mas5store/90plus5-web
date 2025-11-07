'use client';

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { getCatalog, getConfig } from "@/lib/api";
import Button from "@/components/ui/Button";

export default function CatalogoPage() {
  const [productos, setProductos] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [ligas, setLigas] = useState([]);
  const [ligaActiva, setLigaActiva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  // === Cargar catálogo y configuración ===
 useEffect(() => {
  const controller = new AbortController();
  const signal = controller.signal;
  let isActive = true; // evita race condition

  async function fetchData() {
    try {
      setLoading(true);

      const [catalogData, configData] = await Promise.all([
        getCatalog({ signal }),
        getConfig({ signal }),
      ]);

      if (!isActive) return; // si se canceló, no actualizar estado

      setProductos(catalogData || []);
      setFiltered(catalogData || []);
      setLigas(configData.ligas || []);

      const ligaURL = searchParams.get("liga");
      if (ligaURL) setLigaActiva(ligaURL);
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Petición cancelada por cambio rápido de liga");
      } else {
        console.error("Error cargando datos del catálogo:", error);
      }
    } finally {
      if (isActive) setLoading(false);
    }
  }

  fetchData();

  // Cleanup al desmontar o cambiar liga rápido
  return () => {
    isActive = false;
    controller.abort();
  };
}, [searchParams]);


  // === Filtro de búsqueda + liga activa ===
  useEffect(() => {
    const delay = setTimeout(() => {
      let data = productos;

      if (ligaActiva) {
        data = data.filter((p) => p.liga === ligaActiva);
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        data = data.filter((item) => {
          const combined = `${item.equipo} ${item.modelo} ${item.tipo} ${item.liga} ${item.color}`.toLowerCase();
          return combined.includes(q);
        });
      }

      setFiltered(data);
    }, 300);

    return () => clearTimeout(delay);
  }, [search, productos, ligaActiva]);

  // === Seleccionar/deseleccionar liga ===
  const handleLigaClick = (ligaNombre) => {
    if (ligaActiva === ligaNombre) {
      setLigaActiva(null);
      router.push("/catalogo");
    } else {
      setLigaActiva(ligaNombre);
      router.push(`/catalogo?liga=${encodeURIComponent(ligaNombre)}`);
    }
  };

  return (
    <main className="bg-black text-white min-h-screen relative overflow-hidden">
      {/* 🏆 HERO */}
      <section className="relative flex flex-col items-center justify-center min-h-[60vh] text-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/fondo.jpg"
            alt="Fondo catálogo"
            fill
            priority
            className="object-cover opacity-40"
          />
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

      {/* 🏟️ Carrusel de Ligas */}
<section className="relative z-10 mt-6 mb-10 px-6 max-w-7xl mx-auto">
  <h3 className="text-xl font-semibold mb-4 text-center text-gray-200">
    Explorar por Liga
  </h3>

  <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide justify-center flex-wrap">
    {Array.isArray(ligas) && ligas.length > 0 ? (
      ligas.map((liga) => (
        <motion.div
          key={liga.nombre}
          onClick={() => handleLigaClick(liga.nombre)}
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.3 }}
          className={`cursor-pointer flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
            ligaActiva === liga.nombre
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

      {/* 🧤 Productos */}
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
                transition={{ duration: 0.2 }}
                className="bg-[#111]/80 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden border border-[#222] hover:border-[#E50914]/50 transition-all"
              >
                {/* Imagen principal */}
                <div className="relative">
                  <Image
                    src={item.imagen}
                    alt={`${item.equipo} ${item.modelo}`}
                    width={400}
                    height={400}
                    className="w-full h-64 object-cover"
                  />
                  {(item.logoEquipo || item.logo) && (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    className="absolute top-3 left-3"
  >
    <Image
      src={item.logoEquipo || item.logo}
      alt={item.equipo}
      width={40}
      height={40}
      className="object-contain mix-blend-screen drop-shadow-[0_0_6px_rgba(255,255,255,0.45)] hover:drop-shadow-[0_0_10px_rgba(229,9,20,0.6)] transition-all duration-500 ease-in-out"
    />
  </motion.div>
)}

                </div>

                {/* Información del producto */}
                <div className="p-4 text-center">
                  <h2 className="text-lg font-semibold text-white">
                    {item.equipo} <span className="text-gray-400">| {item.modelo}</span>
                  </h2>
                  <p className="text-[#E50914] font-bold mt-2">
                    L{item.precio}
                  </p>
                  <Button
                    onClick={() => router.push(`/producto/${item.id}`)}
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

