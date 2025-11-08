"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { getCatalog, getConfig } from "../../lib/api";
import Button from "../../components/ui/Button";
import { useCart } from "../../context/CartContext";
import { Search } from "lucide-react";

export default function CatalogoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoriaParam = searchParams.get("categoria");
  const queryParam = searchParams.get("query");

  const { addItem } = useCart();

  const [productos, setProductos] = useState([]);
  const [ligas, setLigas] = useState([]);
  const [ligaSeleccionada, setLigaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(
    categoriaParam || null
  );
  const [searchTerm, setSearchTerm] = useState(queryParam || "");
  const [toast, setToast] = useState(null);

  // ✅ Actualizar el término de búsqueda si cambia el query param
  useEffect(() => {
    if (queryParam && queryParam !== searchTerm) {
      setSearchTerm(queryParam);
    }
  }, [queryParam]);

  // === Cargar datos ===
  useEffect(() => {
    async function fetchAll() {
      try {
        const [prodData, configData] = await Promise.all([
          getCatalog(),
          getConfig(),
        ]);
        setProductos(prodData || []);

        if (configData?.ligas?.length) {
          setLigas(configData.ligas);
        } else {
          const uniqueLigas = [
            ...new Set((prodData || []).map((p) => p.liga).filter(Boolean)),
          ];
          setLigas(uniqueLigas.map((l) => ({ nombre: l, imagen: null })));
        }
      } catch (error) {
        console.error("Error cargando catálogo:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  useEffect(() => {
    setCategoriaSeleccionada(categoriaParam || null);
  }, [categoriaParam]);

  // === Filtros + búsqueda mejorada ===
  const normalize = (s) =>
    (s || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

  const productosFiltrados = productos.filter((p) => {
    const categoriaMatch = categoriaSeleccionada
      ? normalize(p.Categoria) === normalize(categoriaSeleccionada)
      : true;

    const ligaMatch = ligaSeleccionada
      ? normalize(p.liga) === normalize(ligaSeleccionada)
      : true;

    const q = normalize(searchTerm);
    const searchMatch =
      !q ||
      normalize(p.equipo).includes(q) ||
      normalize(p.modelo).includes(q) ||
      normalize(p.nombre).includes(q) ||
      normalize(p.descripcion).includes(q) ||
      (p.dorsal && normalize(p.dorsal).includes(q)) ||
      (p.jugador && normalize(p.jugador).includes(q));

    return categoriaMatch && ligaMatch && searchMatch;
  });

  const categoriasDisponibles = [
    ...new Set(productos.map((p) => p.Categoria).filter(Boolean)),
  ];

  const handleCategoriaClick = (cat) => {
    if (cat === categoriaSeleccionada) {
      setCategoriaSeleccionada(null);
      router.push("/catalogo");
      setSearchTerm("");
    } else {
      setCategoriaSeleccionada(cat);
      router.push(`/catalogo?categoria=${encodeURIComponent(cat)}`);
      setSearchTerm("");
    }
  };

  const handleLigaClick = (liga) => {
    setLigaSeleccionada(liga === ligaSeleccionada ? null : liga);
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 1800);
  };

  const handleVerDetalles = (id) => {
    showToast("Cargando producto...");
    setTimeout(() => router.push(`/producto/${id}`), 900);
  };

  const categoriasFijas = ["Retro", "Femenino", "Tenis", "Formula1", "Fórmula 1"];
  const isFixedCategory =
    categoriaSeleccionada &&
    categoriasFijas.some((c) => normalize(c) === normalize(categoriaSeleccionada));
  const isPlaceholder = isFixedCategory && !loading && productosFiltrados.length === 0;

  const mostrarCarrusel = !categoriaSeleccionada;

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
              : "Explora camisetas, ediciones retro y colecciones únicas."}
          </p>
        </motion.div>
      </section>

      {/* BARRA DE BÚSQUEDA */}
      <div className="flex justify-center mb-12 px-4">
        <div className="relative w-full max-w-xl">
          <div className="absolute inset-0 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_25px_rgba(255,255,255,0.05)]" />
          <input
            type="text"
            placeholder="Buscar por equipo, modelo, o estilo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="relative w-full py-3 pl-12 pr-4 bg-transparent text-sm text-white placeholder-gray-400 outline-none rounded-2xl focus:ring-2 focus:ring-[#E50914]/50 focus:border-[#E50914]/40 transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 hover:opacity-30 transition-opacity duration-700 bg-[radial-gradient(circle_at_center,rgba(229,9,20,0.25),transparent_70%)]" />
        </div>
      </div>

      {/* RESULTADOS */}
      {(searchTerm || categoriaSeleccionada) && (
        <p className="text-center text-gray-400 mb-8">
          {productosFiltrados.length > 0
            ? `Resultados para “${searchTerm || categoriaSeleccionada}” (${productosFiltrados.length} productos)`
            : `No se encontraron resultados para “${searchTerm || categoriaSeleccionada}”.`}
        </p>
      )}

      {/* CARRUSEL DE LIGAS */}
      {mostrarCarrusel && (
        <section id="ligas" className="px-4 pb-12 max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-8 text-[#E50914]">
            Ligas disponibles
          </h2>

          <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide justify-center flex-wrap">
            {ligas.length > 0 ? (
              ligas.map((liga) => {
                const nombre = typeof liga === "string" ? liga : liga.nombre;
                const imagen = typeof liga === "string" ? null : liga.imagen;
                return (
                  <motion.div
                    key={nombre}
                    onClick={() => handleLigaClick(nombre)}
                    whileHover={{ scale: 1.06 }}
                    transition={{ duration: 0.18 }}
                    className={`cursor-pointer flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                      ligaSeleccionada === nombre
                        ? "bg-[#E50914]/20 border border-[#E50914]/50 shadow-[0_0_15px_rgba(229,9,20,0.25)]"
                        : "bg-[#111]/60 border border-[#222] hover:border-[#E50914]/30"
                    }`}
                  >
                    {imagen ? (
                      <Image
                        src={imagen}
                        alt={nombre}
                        width={64}
                        height={64}
                        className="object-contain"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-sm text-gray-200">
                        {String(nombre).slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <p className="text-xs text-gray-300 mt-2">{nombre}</p>
                  </motion.div>
                );
              })
            ) : (
              <p className="text-gray-400 text-center">No hay ligas disponibles</p>
            )}
          </div>
        </section>
      )}

      {/* PLACEHOLDER */}
      {isPlaceholder && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto text-center py-24 flex flex-col items-center justify-center"
        >
          <Image
            src={`/placeholders/${categoriaSeleccionada?.toLowerCase()}.jpg`}
            alt={categoriaSeleccionada}
            width={400}
            height={400}
            className="object-contain opacity-80 mb-8 drop-shadow-[0_0_25px_rgba(255,255,255,0.12)]"
            onError={(e) => (e.target.style.display = "none")}
          />
          <h2 className="text-4xl font-bold mb-4 text-[#E50914] drop-shadow-[0_0_20px_rgba(229,9,20,0.45)]">
            {categoriaSeleccionada}
          </h2>
          <p className="text-gray-400 text-lg mb-6">
            Próximamente: esta colección estará disponible muy pronto.
          </p>
          <Button
            variant="outline"
            className="px-8 py-3"
            onClick={() => {
              router.push("/catalogo");
              setCategoriaSeleccionada(null);
            }}
          >
            Volver al catálogo
          </Button>
        </motion.div>
      )}

      {/* GRID */}
      {!isPlaceholder && (
        <section className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 px-4">
          {loading ? (
            <p className="text-center text-gray-400 col-span-full">Cargando productos...</p>
          ) : productosFiltrados.length === 0 ? (
            <p className="text-center text-gray-400 col-span-full">No hay productos para mostrar.</p>
          ) : (
            productosFiltrados.map((item) => (
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
                      transition={{ duration: 0.5 }}
                      className="absolute top-3 left-3"
                    >
                      <Image
                        src={item.logoEquipo}
                        alt={item.equipo}
                        width={40}
                        height={40}
                        className="object-contain mix-blend-screen drop-shadow-[0_0_6px_rgba(255,255,255,0.5)] transition-all duration-500 ease-in-out"
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
                  <p className="text-[#E50914] font-bold mt-2">L{item.precio}</p>

                  <Button onClick={() => handleVerDetalles(item.id)} className="mt-4 w-full">
                    Ver detalles
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </section>
      )}

      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[120] px-6 py-3 bg-gradient-to-r from-[#E50914]/80 to-[#111]/80 backdrop-blur-lg border border-[#E50914]/40 shadow-[0_0_25px_rgba(229,9,20,0.6)] rounded-xl text-white text-sm font-medium"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
