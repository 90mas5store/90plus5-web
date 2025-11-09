'use client';

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { getCatalog, getProductOptions } from "../../../lib/api";
import HeatmapBackground from "../../../components/HeatmapBackground";
import Loader from "../../../components/Loader";
import Button from "../../../components/ui/Button";
import { useCart } from "../../../context/CartContext";
import { ArrowLeft } from "lucide-react";

export default function ProductoPersonalizar() {
  const { id } = useParams();
  const router = useRouter();
  const { addItem, openCart } = useCart();

  const [producto, setProducto] = useState(null);
  const [opciones, setOpciones] = useState(null);
  const [loading, setLoading] = useState(true);

  // Personalización
  const [version, setVersion] = useState(null);
  const [talla, setTalla] = useState(null);
  const [parche, setParche] = useState(null);

  // Dorsal
  const [quiereDorsal, setQuiereDorsal] = useState(false);
  const [modoDorsal, setModoDorsal] = useState("");
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState("");
  const [numeroPersonalizado, setNumeroPersonalizado] = useState("");
  const [nombrePersonalizado, setNombrePersonalizado] = useState("");

  // Otros estados
  const [showToast, setShowToast] = useState(false);

  // Referencias para zoom
  const containerRef = useRef(null);
  const lensRef = useRef(null);
  const blurRef = useRef(null);

useEffect(() => {
  setTimeout(() => window.scrollTo({ top: 70, behavior: "smooth" }), 200);
}, []);

  // === CARGA DE PRODUCTO ===
  useEffect(() => {
    async function fetchProducto() {
      try {
        const data = await getCatalog();
        const found = data.find((p) => String(p.id) === String(id));
        setProducto(found);

        if (found?.liga && found?.equipo) {
          const opts = await getProductOptions(found.liga, found.equipo);
          setOpciones(opts);
        }
      } catch (err) {
        console.error("Error cargando producto:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducto();
  }, [id]);

  // === MANEJO DEL ZOOM ===
  const handleZoomMove = (e) => {
    if (!containerRef.current || !lensRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    window.requestAnimationFrame(() => {
      lensRef.current.style.left = `${x - 80}px`;
      lensRef.current.style.top = `${y - 80}px`;
      lensRef.current.style.backgroundPosition = `${-(x * 2 - 80)}px ${-(y * 2 - 80)}px`;
    });
  };

  const handleEnter = () => {
    lensRef.current.style.opacity = 1;
    blurRef.current.style.opacity = 1;
  };

  const handleLeave = () => {
    lensRef.current.style.opacity = 0;
    blurRef.current.style.opacity = 0;
  };

  // === DORSAL PERSONALIZADO ===
  const handleNumeroChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val <= 99) setNumeroPersonalizado(val);
  };
  const handleNombreChange = (e) => {
    const val = e.target.value.toUpperCase().slice(0, 12);
    setNombrePersonalizado(val);
  };

  const handleAddToCart = () => {
  if (!version || !talla) {
    alert("Selecciona una versión y una talla.");
    return;
  }

  // Si el dorsal es personalizado, separa número/nombre correctamente
  const dorsalNumero =
    modoDorsal === "personalizado" ? numeroPersonalizado : jugadorSeleccionado?.split(" - ")[0] || "";
  const dorsalNombre =
    modoDorsal === "personalizado" ? nombrePersonalizado : jugadorSeleccionado?.split(" - ")[1] || "";

  const newItem = {
    id: producto.id,
    modelo: producto.modelo,      // ✅ modelo real del producto
    equipo: producto.equipo,
    liga: producto.liga || "",
    version,
    talla,
    parche,
    dorsalNumero,
    dorsalNombre,
    imagen: producto.imagen,
    precio: producto.precio,
    cantidad: 1,
  };

  addItem(newItem);
  openCart();

  setShowToast(true);
  setTimeout(() => setShowToast(false), 2500);
};


  // === ESTADOS DE CARGA / ERROR ===
  if (loading) return <Loader text="Cargando opciones..." />;

  if (!producto)
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
        <h1 className="text-2xl font-bold mb-3">Producto no encontrado 😔</h1>
        <Button variant="outline" onClick={() => router.push("/catalogo")}>
          Volver al catálogo
        </Button>
      </main>
    );

  // === COLORES DEL AURA ===
  const getAuraColors = (liga) => {
    if (!liga) return "from-[#E50914]/25 via-black/80 to-black";
    const map = {
      "Barcelona": "from-[#004D98]/40 via-black/80 to-[#A50044]/40",
      "Real Madrid": "from-[#FFFFFF]/10 via-[#A899CA]/20 to-black",
      "PSG": "from-[#004170]/40 via-black/80 to-[#DA291C]/40",
      "Manchester United": "from-[#DA291C]/40 via-black/80 to-[#FBE122]/30",
      "Olimpia": "from-[#FFFFFF]/15 via-black/80 to-[#E50914]/40",
    };
    return map[liga] || "from-[#E50914]/30 via-black/80 to-black";
  };

  return (
    <motion.main
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className={`min-h-screen text-white pt-28 pb-24 px-6 relative overflow-hidden bg-gradient-to-b ${getAuraColors(
        producto.liga
      )}`}
    >
      <HeatmapBackground liga={producto.liga} opacity={0.15} />

      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 relative z-10">
        {/* 🖼️ IMAGEN CON ZOOM */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex justify-center"
        >
          <div
            ref={containerRef}
            className="relative group rounded-3xl border border-[#222] overflow-hidden"
            onMouseMove={handleZoomMove}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
          >
            <Image
              src={producto.imagen}
              alt={producto.modelo}
              width={600}
              height={600}
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />

            <div
              ref={blurRef}
              className="absolute inset-0 backdrop-blur-[4px] opacity-0 transition-opacity duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
            ></div>

            <div
              ref={lensRef}
              className="absolute w-40 h-40 rounded-full pointer-events-none border-2 border-[#E50914]/60 shadow-[0_0_12px_rgba(229,9,20,0.3)] opacity-0 transition-opacity duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform"
              style={{
                backgroundImage: `url(${producto.imagen})`,
                backgroundSize: "1200px 1200px",
                backgroundRepeat: "no-repeat",
              }}
            ></div>
          </div>
        </motion.div>

        {/* 🧩 PANEL DE PERSONALIZACIÓN */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col gap-6"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>

          <div className="flex items-center gap-3">
            {producto.logoEquipo && (
              <Image
                src={producto.logoEquipo}
                alt={producto.equipo}
                width={42}
                height={42}
                className="object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]"
              />
            )}
            <h1 className="text-3xl font-bold drop-shadow-[0_0_25px_rgba(229,9,20,0.5)]">
              {producto.equipo}{" "}
              <span className="text-gray-400">| {producto.modelo}</span>
            </h1>
          </div>

          <p className="text-gray-300 leading-relaxed text-sm md:text-base">
            {producto.descripcion ||
              "Selecciona tus opciones para crear tu versión personalizada de esta camiseta."}
          </p>

          {/* Version */}
          {opciones?.versiones?.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-300 mb-2">Versión</h3>
              <div className="flex flex-wrap gap-3">
                {opciones.versiones.map((v) => (
                  <button
                    key={v}
                    onClick={() => setVersion(v)}
                    className={`px-5 py-2 rounded-full border transition-all ${
                      version === v
                        ? "border-[#E50914] bg-[#E50914]/30"
                        : "border-[#333] hover:border-[#E50914]/50"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Talla */}
          {opciones?.tallas?.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-300 mb-2">Talla</h3>
              <div className="flex flex-wrap gap-3">
                {opciones.tallas.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTalla(t)}
                    className={`px-4 py-2 rounded-full border transition-all ${
                      talla === t
                        ? "border-[#E50914] bg-[#E50914]/30"
                        : "border-[#333] hover:border-[#E50914]/50"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Parche */}
          {opciones?.parches?.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-300 mb-2">Parche</h3>
              <div className="flex flex-wrap gap-3">
                {opciones.parches.map((p) => (
                  <button
                    key={p}
                    onClick={() => setParche(p)}
                    className={`px-4 py-2 rounded-full border transition-all ${
                      parche === p
                        ? "border-[#E50914] bg-[#E50914]/30"
                        : "border-[#333] hover:border-[#E50914]/50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dorsal */}
          <div>
            <h3 className="font-semibold text-gray-300 mb-2">
              ¿Deseas agregar dorsal?
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => setQuiereDorsal(true)}
                className={`px-5 py-2 rounded-full border ${
                  quiereDorsal
                    ? "border-[#E50914] bg-[#E50914]/30"
                    : "border-[#333] hover:border-[#E50914]/50"
                }`}
              >
                Sí
              </button>
              <button
                onClick={() => {
                  setQuiereDorsal(false);
                  setModoDorsal("");
                  setJugadorSeleccionado("");
                  setNombrePersonalizado("");
                  setNumeroPersonalizado("");
                }}
                className={`px-5 py-2 rounded-full border ${
                  !quiereDorsal
                    ? "border-[#E50914] bg-[#E50914]/30"
                    : "border-[#333] hover:border-[#E50914]/50"
                }`}
              >
                No
              </button>
            </div>

            <AnimatePresence>
              {quiereDorsal && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 space-y-4"
                >
                  {/* Modo dorsal */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setModoDorsal("jugador")}
                      className={`px-5 py-2 rounded-full border transition-all ${
                        modoDorsal === "jugador"
                          ? "border-[#E50914] bg-[#E50914]/30"
                          : "border-[#333] hover:border-[#E50914]/50"
                      }`}
                    >
                      Escoger jugador
                    </button>
                    <button
                      onClick={() => setModoDorsal("personalizado")}
                      className={`px-5 py-2 rounded-full border transition-all ${
                        modoDorsal === "personalizado"
                          ? "border-[#E50914] bg-[#E50914]/30"
                          : "border-[#333] hover:border-[#E50914]/50"
                      }`}
                    >
                      Personalizado
                    </button>
                  </div>

                  {/* Jugador oficial */}
                  {modoDorsal === "jugador" && (
                    <div className="relative w-full max-w-md">
                      <select
                        value={jugadorSeleccionado}
                        onChange={(e) =>
                          setJugadorSeleccionado(e.target.value)
                        }
                        className="w-full bg-transparent border border-[#333] rounded-lg px-4 py-2 text-sm text-gray-200 focus:border-[#E50914]/70 outline-none backdrop-blur-md"
                      >
                        <option value="">Selecciona jugador...</option>
                        {opciones?.dorsales
                          ?.filter((d) => d.jugador !== "Personalizado")
                          .map((d, i) => (
                            <option
                              key={i}
                              value={`${d.numero} - ${d.jugador}`}
                            >
                              {d.numero ? `${d.numero}. ${d.jugador}` : d.jugador}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {/* Personalizado */}
                  {modoDorsal === "personalizado" && (
                    <div className="flex gap-3 items-center">
                      <input
                        type="text"
                        placeholder="Número (1-99)"
                        value={numeroPersonalizado}
                        onChange={handleNumeroChange}
                        maxLength={2}
                        className="w-20 bg-transparent border border-[#333] rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-[#E50914]/70 outline-none backdrop-blur-md text-center"
                      />
                      <input
                        type="text"
                        placeholder="Nombre (máx. 12)"
                        value={nombrePersonalizado}
                        onChange={handleNombreChange}
                        className="flex-1 bg-transparent border border-[#333] rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-[#E50914]/70 outline-none backdrop-blur-md"
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Botones finales */}
          <div className="flex gap-4 pt-4">
            <Button onClick={handleAddToCart} className="flex-1 py-3">
              Añadir al carrito
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/catalogo")}
              className="flex-1 py-3"
            >
              Volver
            </Button>
          </div>
        </motion.div>
      </div>

      {/* ✅ TOAST */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-xl border border-white/10 bg-white/10 backdrop-blur-md shadow-lg text-white text-sm flex items-center gap-2"
          >
            <span className="inline-block w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
            Añadido al carrito correctamente
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}

