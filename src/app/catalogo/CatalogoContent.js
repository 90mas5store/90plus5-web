'use client';
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { getCatalog, getConfig } from "@/lib/api";

export default function CatalogoPage() {
  const [productos, setProductos] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [ligas, setLigas] = useState([]);
  const [ligaActiva, setLigaActiva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const [catalogData, configData] = await Promise.all([getCatalog(), getConfig()]);
        setProductos(catalogData || []);
        setFiltered(catalogData || []);
        setLigas(configData.ligas || []);

        const ligaURL = searchParams.get("liga");
        if (ligaURL) setLigaActiva(ligaURL);
      } catch (err) {
        console.error("Error catalogo:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(() => {
      let data = productos;
      if (ligaActiva) data = data.filter((p) => p.liga === ligaActiva);
      if (search.trim()) {
        const q = search.toLowerCase();
        data = data.filter((item) => {
          const combined = `${item.equipo} ${item.modelo} ${item.tipo} ${item.liga} ${item.color}`.toLowerCase();
          return combined.includes(q);
        });
      }
      setFiltered(data);
    }, 250);
    return () => clearTimeout(t);
  }, [search, productos, ligaActiva]);

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
      {/* HERO */}
      <section className="relative flex flex-col items-center justify-center min-h-[60vh] text-center overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/fondo.jpg" alt="fondo" fill className="object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#0A0A0A]/80 to-[#150021]/90" />
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1 }} className="z-10 mt-24">
          <h1 className="text-5xl font-extrabold text-[#E50914] drop-shadow-[0_0_20px_rgba(229,9,20,0.5)]">
            Catálogo <span className="text-white">90+5</span>
          </h1>
          <p className="text-gray-400 mt-4 max-w-xl mx-auto text-sm">
            Explora nuestras prendas y revive la mística del fútbol.
          </p>
        </motion.div>
      </section>

      {/* Breadcrumb */}
      <div className="px-6 mt-4 text-sm text-gray-400 max-w-7xl mx-auto">
        <a href="/" className="hover:text-white transition">Inicio</a>{" › "}
        <span className="text-white font-semibold">Catálogo</span>
        {ligaActiva && <span>{" › "}{ligaActiva}</span>}
      </div>

      {/* Ligas */}
      <section className="relative z-10 mt-6 mb-10 px-6 max-w-7xl mx-auto">
        <h3 className="text-xl font-semibold mb-4 text-center text-gray-200">Explorar por Liga</h3>
        <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide justify-center">
          {ligas.map((liga) => (
            <motion.div
              key={liga.nombre}
              onClick={() => handleLigaClick(liga.nombre)}
              whileHover={{ scale: 1.06 }}
              className={`cursor-pointer flex flex-col items-center justify-center min-w-[100px] p-3 rounded-xl transition-all ${
                ligaActiva === liga.nombre ? "bg-[#E50914]/20 border border-[#E50914]" : "bg-[#111]/60 hover:border-[#E50914]/50 border border-transparent"
              }`}
            >
              {liga.imagen ? (
                <Image src={liga.imagen} alt={liga.nombre} width={56} height={56} className="object-contain mb-2" />
              ) : (
                <div className="w-14 h-14 mb-2 bg-[#222] rounded-full flex items-center justify-center text-gray-500 text-xs">N/A</div>
              )}
              <span className="text-xs text-center">{liga.nombre}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Search */}
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

      {/* Productos */}
      <section className="py-10 px-4 max-w-7xl mx-auto">
        {loading ? (
          <p className="text-center text-gray-400">Cargando productos...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400">No se encontraron productos que coincidan.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filtered.map((item) => (
              <motion.div key={item.id} whileHover={{ scale: 1.03 }} className="bg-[#111]/80 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden border border-[#222] transition-all hover:border-[#E50914]/50">
                <div className="relative">
                  <div className="w-full h-64 relative">
                    <Image src={item.imagen || "/placeholder.png"} alt={`${item.equipo} ${item.modelo}`} fill className="object-cover" />
                  </div>

                  {(item.logoEquipo || item.logo || item.ligaLogo) && (
                    <div className="absolute top-3 left-3">
                      <Image
                        src={item.logoEquipo || item.logo || item.ligaLogo}
                        alt={item.equipo || item.liga}
                        width={36}
                        height={36}
                        className="rounded-full bg-white p-0.5 object-contain"
                      />
                    </div>
                  )}
                </div>

                <div className="p-4 text-center">
                  <h2 className="text-lg font-semibold text-white">
                    {item.equipo} <span className="text-gray-400">| {item.modelo}</span>
                  </h2>
                  <p className="text-[#E50914] font-bold mt-2">L{item.precio}</p>
                  <button onClick={() => router.push(`/producto/${item.id}`)} className="mt-4 w-full py-2 rounded-full bg-[#E50914] hover:bg-[#b0060e] text-white font-semibold transition-all">
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
