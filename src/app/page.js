"use client";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getFeatured, getConfig } from "../lib/api";
import Button from "../components/ui/Button";
import { Search, ShoppingCart, Eye } from "lucide-react";
import CarruselDeCategoria from "../components/catalogo/CarruselDeCategoria";
import { useCart } from "../context/CartContext";

// 🎞️ Animaciones coherentes con Catálogo
const fadeInItem = (i = 0) => ({
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 10, scale: 0.97 },
  transition: { delay: i * 0.05, duration: 0.5, ease: "easeOut" },
});

const glowHover = {
  whileHover: {
    boxShadow: "0 0 22px rgba(229,9,20,0.25)",
    borderColor: "rgba(229,9,20,0.45)",
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

export default function Home() {
  const router = useRouter();
  const { addItem } = useCart();

  const [destacados, setDestacados] = useState([]);
  const [ligas, setLigas] = useState([]);
  const [ligaSeleccionada, setLigaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1500);
  };

  // 🚀 Cargar destacados + config
  useEffect(() => {
    async function fetchData() {
      try {
        const [featuredData, configData] = await Promise.all([
          getFeatured(),
          getConfig(),
        ]);
        setDestacados(featuredData || []);
        if (configData?.ligas?.length) {
          setLigas(configData.ligas);
        } else {
          const ligasUnicas = [
            ...new Set(
              (featuredData || []).map((p) => p.liga).filter(Boolean)
            ),
          ].map((l) => ({ nombre: l, imagen: null }));
          setLigas(ligasUnicas);
        }
      } catch (error) {
        console.error("Error cargando datos del Home:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // 🔍 Filtrado por liga
  const destacadosFiltrados = useMemo(() => {
    if (!ligaSeleccionada) return destacados;
    return destacados.filter(
      (item) =>
        item.liga &&
        item.liga.toLowerCase() === ligaSeleccionada.toLowerCase()
    );
  }, [destacados, ligaSeleccionada]);

  // 🔎 Buscar
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/catalogo?query=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      router.push(`/catalogo`);
    }
  };

  return (
    <main className="bg-black text-white min-h-screen relative overflow-hidden">
      {/* 🏟️ HERO */}
      <section className="relative flex flex-col items-center justify-center min-h-[100vh] text-center overflow-hidden">
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

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="z-10 mt-20"
        >
          <div className="flex flex-col items-center mb-6">
            <div className="text-[100px] sm:text-[120px] md:text-[140px] font-extrabold tracking-tight leading-none text-[#E50914] drop-shadow-[0_0_35px_rgba(229,9,20,0.5)] select-none">
              90<span className="text-white">+</span>5
            </div>
            <p className="text-gray-400 mt-3 text-sm tracking-widest uppercase">
              El tiempo se rompe aquí.
            </p>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl font-light text-gray-100 mt-4 max-w-lg"
            >
              Donde el fútbol no termina en el 90... comienza la historia.
            </motion.p>
          </div>
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

      {/* 🔍 BUSCADOR */}
      <section className="flex justify-center -mt-6 mb-20 px-4 z-10 relative">
        <form onSubmit={handleSearch} className="relative w-full max-w-xl">
          <div className="absolute inset-0 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_25px_rgba(255,255,255,0.05)]" />
          <input
            type="text"
            placeholder="Buscar por equipo, modelo o jugador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="relative w-full py-3 pl-12 pr-4 bg-transparent text-sm text-white placeholder-gray-400 outline-none rounded-2xl focus:ring-2 focus:ring-[#E50914]/50"
          />
          <Search
            onClick={handleSearch}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer hover:text-white transition"
          />
        </form>
      </section>

      {/* 🏆 LIGAS */}
      <div id="ligas">
        <CarruselDeCategoria
          title="Ligas disponibles"
          items={ligas.map((l) => ({
            nombre: l.nombre || l.Liga,
            imagen:
              l.imagen ||
              l["Imagen Liga (URL)"] ||
              "/logos/ligas/placeholder.svg",
          }))}
          selected={ligaSeleccionada}
          onSelect={(nombre) =>
            setLigaSeleccionada(ligaSeleccionada === nombre ? null : nombre)
          }
        />
      </div>

      {/* ⭐ DESTACADOS */}
      <section id="destacados" className="py-20 px-4 max-w-7xl mx-auto">
        <h2 className="text-center text-4xl font-bold text-[#E50914] mb-10 drop-shadow-[0_0_20px_rgba(229,9,20,0.4)]">
          {ligaSeleccionada
            ? `Destacados de ${ligaSeleccionada}`
            : "Destacados 90+5"}
        </h2>

        {loading ? (
          <p className="text-center text-gray-400">Cargando productos...</p>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={ligaSeleccionada || "all"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
            >
              {destacadosFiltrados.map((item, i) => (
                <motion.div
                  key={item.id}
                  {...fadeInItem(i)}
                  {...glowHover}
                  className="bg-[#111]/80 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden border border-[#222] transition-all"
                >
                  <div className="relative">
                    {item.logoEquipo && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{
                          scale: 1.08,
                          filter: "drop-shadow(0 0 12px rgba(229,9,20,0.45))",
                        }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="absolute top-3 left-3"
                      >
                        <Image
                          src={item.logoEquipo}
                          alt={item.equipo}
                          width={40}
                          height={40}
                          className="object-contain brightness-105 contrast-125 mix-blend-screen drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
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
                      {item.equipo}{" "}
                      <span className="text-gray-400">| {item.modelo}</span>
                    </h2>
                    <p className="text-[#E50914] font-bold mt-2">
                      L{item.precio}
                    </p>

                    <div className="flex gap-2 mt-4">
                     <Button
  onClick={() => {
    showToast("Abriendo personalización...");
    setTimeout(() => router.push(`/producto/${item.id}`), 500);
  }}
  className="flex-1 flex items-center justify-center gap-1 text-sm bg-[#E50914] hover:bg-[#ff1f27]"
>
  <ShoppingCart className="w-4 h-4" /> Añadir
</Button>

<Button
  onClick={() => {
    showToast("Cargando producto...");
    setTimeout(() => router.push(`/catalogo/${item.id}`), 500);
  }}
  className="flex-1 flex items-center justify-center gap-1 text-sm bg-white/10 hover:bg-white/20"
>
  <Eye className="w-4 h-4" /> Ver
</Button>


                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </section>

      {/* 🧃 Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[120] px-6 py-3 bg-gradient-to-r from-[#E50914]/80 to-[#111]/80 border border-[#E50914]/40 rounded-xl text-white text-sm font-medium"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
