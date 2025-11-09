"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { getCatalog } from "../../../lib/api";
import { ArrowLeft } from "lucide-react";
import HeatmapBackground from "../../../components/HeatmapBackground";
import Loader from "../../../components/Loader";

export default function ProductShowcase() {
  const { id } = useParams();
  const router = useRouter();
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);

  // Refs para zoom fluido
  const containerRef = useRef(null);
  const lensRef = useRef(null);
  const blurRef = useRef(null);

useEffect(() => {
  setTimeout(() => window.scrollTo({ top: 100, behavior: "smooth" }), 200);
}, []);


  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getCatalog();
        const found = data.find((p) => String(p.id) === String(id));
        setProducto(found || null);
      } catch (err) {
        console.error("Error cargando producto:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // 🎨 Aura dinámica
  const getAuraColors = (liga) => {
    if (!liga) return "from-[#E50914]/20 via-black/70 to-black";
    const map = {
      Barcelona: "from-[#004D98]/50 via-black/70 to-[#A50044]/50",
      "Real Madrid": "from-[#FFFFFF]/10 via-[#A899CA]/20 to-black",
      PSG: "from-[#004170]/50 via-black/70 to-[#DA291C]/50",
      "Manchester United": "from-[#DA291C]/50 via-black/70 to-[#FBE122]/40",
      Olimpia: "from-[#FFFFFF]/15 via-black/70 to-[#E50914]/40",
      "Liga Nacional": "from-[#E50914]/25 via-black/70 to-[#111]/80",
    };
    return map[liga] || "from-[#E50914]/30 via-black/70 to-black";
  };

  // 🔍 Zoom fluido
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

  if (loading) return <Loader text="Cargando producto..." />;

  if (!producto)
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white text-center">
        <h1 className="text-2xl font-bold mb-3">Producto no encontrado 😔</h1>
        <button
          onClick={() => router.push("/catalogo")}
          className="text-[#E50914] hover:underline"
        >
          Volver al catálogo
        </button>
      </main>
    );

  return (
    <motion.main
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className={`min-h-screen text-white pt-28 pb-16 px-6 relative overflow-hidden bg-gradient-to-b ${getAuraColors(
        producto.liga || producto.equipo
      )}`}
    >
      <HeatmapBackground liga={producto?.liga} opacity={0.15} />

      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
        {/* 🖼️ Imagen con zoom */}
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
            {/* Imagen principal */}
            <Image
              src={producto.imagen}
              alt={producto.modelo}
              width={600}
              height={600}
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Blur cinematográfico */}
            <div
              ref={blurRef}
              className="absolute inset-0 backdrop-blur-[4px] opacity-0 transition-opacity duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
            ></div>

            {/* Lupa fluida y suave */}
            <div
              ref={lensRef}
              className="absolute w-40 h-40 rounded-full pointer-events-none border-2 border-[#E50914]/60 shadow-[0_0_10px_rgba(229,9,20,0.25)] opacity-0 transition-opacity duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform"
              style={{
                backgroundImage: `url(${producto.imagen})`,
                backgroundSize: "1200px 1200px",
                backgroundRepeat: "no-repeat",
              }}
            ></div>
          </div>
        </motion.div>

        {/* ℹ️ Información del producto */}
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
                width={48}
                height={48}
                className="object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]"
              />
            )}
            <h1 className="text-4xl font-extrabold drop-shadow-[0_0_25px_rgba(229,9,20,0.5)]">
              {producto.equipo}{" "}
              <span className="text-gray-300 font-medium">
                | {producto.modelo}
              </span>
            </h1>
          </div>

          <p className="text-gray-300 text-lg leading-relaxed">
            {producto.descripcion ||
              "Una camiseta diseñada para revivir la pasión, la historia y el legado de tu club."}
          </p>

          <p className="italic text-gray-400 text-sm border-l-4 border-[#E50914] pl-4">
            {producto.liga
              ? `Colección ${producto.liga} ${new Date().getFullYear()}`
              : "Edición especial para verdaderos hinchas."}
          </p>

          <div>
            <p className="text-[#E50914] text-2xl font-bold">
              L{producto.precio}
            </p>
            <p className="text-sm text-gray-400 uppercase tracking-wide">
              {producto.categoria} · {producto.liga || "Colección Especial"}
            </p>
          </div>

          <div className="mt-6">
            <button
              onClick={() => router.push(`/producto/${producto.id}`)}
              className="bg-[#E50914] hover:bg-[#ff1f27] px-8 py-3 rounded-full font-semibold transition-all shadow-[0_0_15px_rgba(229,9,20,0.6)]"
            >
              Configurar mi camiseta
            </button>
          </div>
        </motion.div>
      </div>
    </motion.main>
  );
}

