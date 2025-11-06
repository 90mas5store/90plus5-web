'use client';
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import HeatmapBackground from "@/components/HeatmapBackground";
import { getProductById, getProductOptions } from "@/lib/api";

export default function ProductoDetalle() {
  const { id } = useParams();
  const router = useRouter();
  const [producto, setProducto] = useState(null);
  const [opciones, setOpciones] = useState(null);
  const [loading, setLoading] = useState(true);

  // personalization states
  const [version, setVersion] = useState(null);
  const [talla, setTalla] = useState(null);
  const [parches, setParches] = useState([]);
  const [quiereDorsal, setQuiereDorsal] = useState(false);
  const [modoDorsal, setModoDorsal] = useState("");
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState("");
  const [nombrePersonalizado, setNombrePersonalizado] = useState("");
  const [numeroPersonalizado, setNumeroPersonalizado] = useState("");

  useEffect(() => {
    async function fetchProducto() {
      try {
        const data = await getProductById(id);
        setProducto(data || null);

        if (data?.liga && data?.equipo) {
          const opts = await getProductOptions({ liga: data.liga, equipo: data.equipo });
          setOpciones(opts || {});
        }
      } catch (err) {
        console.error("Error cargando producto:", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchProducto();
  }, [id]);

  const toggleParche = (parche) => {
    setParches((prev) => (prev.includes(parche) ? prev.filter((p) => p !== parche) : [...prev, parche]));
  };

  const handleNumeroChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val <= 99) setNumeroPersonalizado(val);
  };

  const handleNombreChange = (e) => {
    const val = e.target.value.toUpperCase().slice(0, 12);
    setNombrePersonalizado(val);
  };

  if (loading) return <main className="min-h-screen flex items-center justify-center bg-black text-white"><p>Cargando producto...</p></main>;
  if (!producto) return <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white"><p>No se encontró este producto.</p><button onClick={() => router.push("/catalogo")} className="mt-6 px-6 py-2 bg-[#E50914] rounded-full hover:bg-[#b0060e] transition-all">Volver al catálogo</button></main>;

  return (
    <main className="min-h-screen bg-black text-white py-20 px-4 relative overflow-hidden">
      <HeatmapBackground liga={producto?.liga} opacity={0.25} />

      <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Image box with fixed height */}
        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="flex justify-center relative group h-[400px] md:h-[550px]">
          <motion.div
            whileHover={{ scale: 1.08, boxShadow: "0 0 40px rgba(229,9,20,0.3)", filter: "brightness(1.05)" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="rounded-3xl overflow-hidden shadow-lg border border-[#222] max-w-md cursor-zoom-in w-full h-full flex items-center justify-center bg-black/30"
          >
            <div className="w-full h-full relative">
              <Image src={producto.imagen || "/placeholder.png"} alt={producto.modelo} fill className="object-contain" />
            </div>
          </motion.div>

          {/* logo */}
          {producto.logoEquipo && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.5 }} className="absolute top-3 left-3 w-12 h-12">
              <Image src={producto.logoEquipo} alt={producto.equipo} width={48} height={48} className="rounded-full object-contain bg-white p-1 shadow-md" />
            </motion.div>
          )}
        </motion.div>

        {/* Right panel */}
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="flex flex-col justify-center text-left space-y-6">
          {/* Title */}
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{producto.equipo} <span className="text-gray-400">| {producto.modelo}</span></h1>
          </div>

          <p className="text-[#E50914] text-2xl font-semibold mb-4">L{producto.precio}</p>

          {/* Version */}
          <div>
            <h3 className="font-semibold mb-2 text-gray-300">Versión</h3>
            <div className="flex gap-3 flex-wrap">
              {opciones?.versiones?.map((v) => (
                <button key={v} onClick={() => setVersion(v)} className={`px-5 py-2 rounded-full backdrop-blur-md border transition-all ${version === v ? "border-[#E50914] bg-[#E50914]/30" : "border-[#333] hover:border-[#E50914]/50"}`}>{v}</button>
              ))}
            </div>
          </div>

          {/* Talla */}
          <div>
            <h3 className="font-semibold mb-2 text-gray-300">Talla</h3>
            <div className="flex gap-3 flex-wrap">
              {opciones?.tallas?.map((t) => (
                <button key={t} onClick={() => setTalla(t)} className={`px-4 py-2 rounded-full backdrop-blur-md border transition-all ${talla === t ? "border-[#E50914] bg-[#E50914]/30" : "border-[#333] hover:border-[#E50914]/50"}`}>{t}</button>
              ))}
            </div>
          </div>

          {/* Parches */}
          {opciones?.parches?.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-gray-300">Parches</h3>
              <div className="flex gap-3 flex-wrap">
                {opciones.parches.map((p) => (
                  <button key={p} onClick={() => toggleParche(p)} className={`px-4 py-2 rounded-full backdrop-blur-md border transition-all ${parches.includes(p) ? "border-[#E50914] bg-[#E50914]/30" : "border-[#333] hover:border-[#E50914]/50"}`}>{p}</button>
                ))}
              </div>
            </div>
          )}

          {/* Dorsal */}
          <div>
            <h3 className="font-semibold mb-2 text-gray-300">¿Deseas agregar dorsal?</h3>
            <div className="flex gap-3">
              <button onClick={() => setQuiereDorsal(true)} className={`px-5 py-2 rounded-full border ${quiereDorsal ? "border-[#E50914] bg-[#E50914]/30" : "border-[#333] hover:border-[#E50914]/50"}`}>Sí</button>
              <button onClick={() => { setQuiereDorsal(false); setModoDorsal(""); setJugadorSeleccionado(""); setNombrePersonalizado(""); setNumeroPersonalizado(""); }} className={`px-5 py-2 rounded-full border ${!quiereDorsal ? "border-[#E50914] bg-[#E50914]/30" : "border-[#333] hover:border-[#E50914]/50"}`}>No</button>
            </div>

            {quiereDorsal && (
              <div className="mt-4 space-y-4">
                <div className="flex gap-3">
                  <button onClick={() => setModoDorsal("jugador")} className={`px-5 py-2 rounded-full border ${modoDorsal === "jugador" ? "border-[#E50914] bg-[#E50914]/30" : "border-[#333] hover:border-[#E50914]/50"}`}>Escoger jugador</button>
                  <button onClick={() => setModoDorsal("personalizado")} className={`px-5 py-2 rounded-full border ${modoDorsal === "personalizado" ? "border-[#E50914] bg-[#E50914]/30" : "border-[#333] hover:border-[#E50914]/50"}`}>Personalizado</button>
                </div>

                {modoDorsal === "jugador" && (
                  <div className="relative w-full max-w-md">
                    <div className="bg-[#111]/70 backdrop-blur-md border border-[#333] rounded-lg px-4 py-3 shadow-lg transition-all hover:border-[#E50914]/50">
                      <select value={jugadorSeleccionado} onChange={(e) => setJugadorSeleccionado(e.target.value)} className="w-full bg-transparent text-gray-100 outline-none text-sm appearance-none cursor-pointer">
                        <option value="">Selecciona jugador...</option>
                        {opciones?.dorsales?.filter((d) => d.jugador !== "Personalizado").map((d, i) => (
                          <option key={i} value={d.jugador} className="bg-[#0A0A0A] text-gray-100 hover:bg-[#E50914]/20">
                            {d.numero ? `${d.numero}. ${d.jugador}` : d.jugador}
                          </option>
                        ))}
                      </select>
                    </div>
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">▼</span>
                  </div>
                )}

                {modoDorsal === "personalizado" && (
                  <div className="flex gap-3 items-center">
                    <input type="text" placeholder="Número (1-99)" value={numeroPersonalizado} onChange={handleNumeroChange} maxLength={2} className="w-20 bg-transparent border border-[#333] rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-[#E50914]/70 outline-none backdrop-blur-md text-center" />
                    <input type="text" placeholder="Nombre (máx. 12)" value={nombrePersonalizado} onChange={handleNombreChange} className="flex-1 bg-transparent border border-[#333] rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-[#E50914]/70 outline-none backdrop-blur-md" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-6">
            <button className="flex-1 py-3 rounded-full bg-[#E50914] text-white font-semibold hover:bg-[#b0060e] transition-all">Agregar al carrito</button>
            <button onClick={() => router.push("/catalogo")} className="flex-1 py-3 rounded-full border border-gray-600 text-gray-300 hover:bg-white/10 transition-all">Volver</button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}





