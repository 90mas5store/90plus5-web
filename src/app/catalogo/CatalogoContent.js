"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { getCatalog, getConfig } from "../../lib/api";
import Button from "../../components/ui/Button";
import { Search, ShoppingCart, Eye } from "lucide-react";
import CarruselDeCategoria from "../../components/catalogo/CarruselDeCategoria";

// 🎞️ Animaciones reutilizables
const fadeInItem = (i = 0) => ({
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { delay: i * 0.05, duration: 0.6, ease: "easeOut" },
});

const glowHover = {
  whileHover: {
    boxShadow: "0 0 22px rgba(229,9,20,0.25)",
    borderColor: "rgba(229,9,20,0.45)",
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

export default function CatalogoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoriaParam = searchParams.get("categoria");
  const queryParam = searchParams.get("query");

  const [productos, setProductos] = useState([]);
  const [config, setConfig] = useState(null);
  const [ligas, setLigas] = useState([]);
  const [ligaSeleccionada, setLigaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(categoriaParam || null);
  const [searchTerm, setSearchTerm] = useState(queryParam || "");
  const [toast, setToast] = useState(null);

  // === Funciones de utilidad ===
  const normalize = (s) =>
    (s || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

  // === Efectos de carga ===
  useEffect(() => {
    async function fetchAll() {
      try {
        const [prodData, cfg] = await Promise.all([getCatalog(), getConfig()]);
        setProductos(prodData || []);
        setConfig(cfg || {});
        const ligasFromConfig =
          cfg?.ligas?.length > 0
            ? cfg.ligas
            : [
                ...new Set(prodData.map((p) => p.liga).filter(Boolean)),
              ].map((l) => ({ nombre: l, imagen: null }));
        setLigas(ligasFromConfig);
      } catch (err) {
        console.error("Error cargando catálogo/config:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  useEffect(() => {
    if (queryParam && queryParam !== searchTerm) setSearchTerm(queryParam);
  }, [queryParam]);

  useEffect(() => {
    setCategoriaSeleccionada(categoriaParam || null);
    setLigaSeleccionada(null);
  }, [categoriaParam]);

  // === FILTRO ===
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const catMatch = categoriaSeleccionada
        ? normalize(p.categoria) === normalize(categoriaSeleccionada)
        : true;
      const ligaMatch = ligaSeleccionada
        ? normalize(p.liga) === normalize(ligaSeleccionada)
        : true;
      const q = normalize(searchTerm);
      const searchMatch =
        !q ||
        normalize(p.equipo).includes(q) ||
        normalize(p.modelo).includes(q) ||
        normalize(p.descripcion).includes(q);
      return catMatch && ligaMatch && searchMatch;
    });
  }, [productos, categoriaSeleccionada, ligaSeleccionada, searchTerm]);

  // === Toast ===
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1200);
  };

  // === Navegación ===
  const handleVerDetalles = (item) => {
    showToast("Cargando producto...");
    setTimeout(() => router.push(`/catalogo/${item.id}`), 500);
  };

  const handlePersonalizar = (item) => {
    showToast("Abriendo personalización...");
    setTimeout(() => router.push(`/producto/${item.id}`), 500);
  };

  // === Carrusel dinámico ===
  const currentCarrusel = useMemo(() => {
    if (categoriaSeleccionada) {
      const ligasUnicas = [
        ...new Set(
          productos
            .filter(
              (p) =>
                normalize(p.categoria) === normalize(categoriaSeleccionada) &&
                p.liga
            )
            .map((p) => p.liga)
        ),
      ];
      if (!ligasUnicas.length) return null;
      const items = ligasUnicas.map((nombreLiga) => {
        const found =
          ligas.find(
            (l) => normalize(l.nombre || l.Liga) === normalize(nombreLiga)
          ) || {};
        return {
          nombre: nombreLiga,
          imagen:
            found.imagen ||
            found["Imagen Liga (URL)"] ||
            "/logos/ligas/placeholder.svg",
        };
      });
      return {
        title: `Colecciones de ${categoriaSeleccionada}`,
        items,
        field: "liga",
      };
    } else {
      const items =
        ligas?.map((l) => ({
          nombre: l.nombre || l.Liga,
          imagen:
            l.imagen || l["Imagen Liga (URL)"] || "/logos/ligas/placeholder.svg",
        })) || [];
      return { title: "Ligas disponibles", items, field: "liga" };
    }
  }, [categoriaSeleccionada, productos, ligas, ligaSeleccionada]);

  return (
    <main className="min-h-screen bg-black text-white pt-20 pb-24 relative overflow-hidden">
      {/* HERO */}
      <section className="relative flex flex-col items-center justify-center min-h-[50vh] text-center overflow-hidden mb-12">
        <div className="absolute inset-0">
          <Image
            src="/fondo.jpg"
            alt="Fondo catálogo"
            fill
            priority
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#0A0A0A]/80 to-[#150021]/90" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
          className="z-10 max-w-3xl"
        >
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-[#E50914] drop-shadow-[0_0_35px_rgba(229,9,20,0.5)]">
            {categoriaSeleccionada ? categoriaSeleccionada : "Catálogo 90+5"}
          </h1>
          <p className="text-gray-300 mt-4 text-lg">
            {categoriaSeleccionada
              ? "Explora los productos de esta colección."
              : "Explora camisetas y colecciones por liga."}
          </p>
        </motion.div>
      </section>

      {/* BUSCADOR */}
      <div className="flex justify-center mb-10 px-4">
        <div className="relative w-full max-w-xl">
          <div className="absolute inset-0 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_25px_rgba(255,255,255,0.05)]" />
          <input
            type="text"
            placeholder="Buscar por equipo, modelo o estilo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="relative w-full py-3 pl-12 pr-4 bg-transparent text-sm text-white placeholder-gray-400 outline-none rounded-2xl focus:ring-2 focus:ring-[#E50914]/50"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* CARRUSEL PRINCIPAL */}
      {currentCarrusel && (
        <CarruselDeCategoria
          title={currentCarrusel.title}
          items={currentCarrusel.items}
          selected={ligaSeleccionada}
          onSelect={(nombre) =>
            setLigaSeleccionada(ligaSeleccionada === nombre ? null : nombre)
          }
        />
      )}

      {/* GRID DE PRODUCTOS */}
      <section className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 px-4">
        {loading ? (
          <p className="text-center text-gray-400 col-span-full">
            Cargando productos...
          </p>
        ) : productosFiltrados.length === 0 ? (
          <p className="text-center text-gray-400 col-span-full">
            No hay productos para mostrar.
          </p>
        ) : (
          productosFiltrados.map((item, i) => (
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

                {/* BOTONES */}
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => handlePersonalizar(item)}
                    className="flex-1 flex items-center justify-center gap-1 text-sm bg-[#E50914] hover:bg-[#ff1f27]"
                  >
                    <ShoppingCart className="w-4 h-4" /> Añadir
                  </Button>
                  <Button
                    onClick={() => handleVerDetalles(item)}
                    className="flex-1 flex items-center justify-center gap-1 text-sm bg-white/10 hover:bg-white/20"
                  >
                    <Eye className="w-4 h-4" /> Ver
                  </Button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </section>

      {/* TOAST */}
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
