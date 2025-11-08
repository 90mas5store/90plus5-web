"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { getProductById, getProductOptions } from "../../../lib/api";
import Button from "../../../components/ui/Button";
import HeatmapBackground from "../../../components/HeatmapBackground";
import { useCart } from "../../../context/CartContext";

export default function ProductoDetalle() {
  const { id } = useParams();
  const router = useRouter();

  const [producto, setProducto] = useState(null);
  const [opciones, setOpciones] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados de personalización
  const [version, setVersion] = useState(null);
  const [talla, setTalla] = useState(null);
  const [parche, setParche] = useState(null);
  const [quiereDorsal, setQuiereDorsal] = useState(false);
  const [modoDorsal, setModoDorsal] = useState(""); // jugador o personalizado
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState("");
  const [nombrePersonalizado, setNombrePersonalizado] = useState("");
  const [numeroPersonalizado, setNumeroPersonalizado] = useState("");

  // 🔹 Toast visual
  const [showToast, setShowToast] = useState(false);

  const { addItem, openCart } = useCart(); // ✅ usar carrito

  // 🔹 Cargar producto y opciones
  useEffect(() => {
    async function fetchProducto() {
      try {
        const data = await getProductById(id);
        setProducto(data);

        if (data?.liga && data?.equipo) {
          const opts = await getProductOptions(data.liga, data.equipo);
          setOpciones(opts);
        }
      } catch (err) {
        console.error("Error cargando producto:", err);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchProducto();
  }, [id]);

  // 🔹 Solo un parche activo
  const handleParcheSelect = (p) => {
    setParche((prev) => (prev === p ? null : p));
  };

  // 🔹 Campos personalizados
  const handleNumeroChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val <= 99) setNumeroPersonalizado(val);
  };

  const handleNombreChange = (e) => {
    const val = e.target.value.toUpperCase().slice(0, 12);
    setNombrePersonalizado(val);
  };

  // 🔹 Agregar al carrito
  const handleAddToCart = () => {
    if (!version || !talla) {
      alert("Por favor selecciona una versión y una talla.");
      return;
    }

    const dorsal =
      quiereDorsal && modoDorsal === "jugador"
        ? jugadorSeleccionado
        : quiereDorsal && modoDorsal === "personalizado"
        ? `${numeroPersonalizado} - ${nombrePersonalizado}`
        : null;

    const newItem = {
      id: producto.id,
      nombre: producto.modelo,
      imagen: producto.imagen,
      equipo: producto.equipo,
      modelo: producto.modelo,
      version: version,
      talla: talla,
      parches: parche ? [parche] : [],
      dorsal: dorsal,
      cantidad: 1,
      precio: producto.precio,
    };

    addItem(newItem);
    openCart();

    // ✅ Mostrar toast visual
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  // Estados de carga
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Cargando producto...</p>
      </main>
    );
  }

  if (!producto) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
        <p>No se encontró este producto.</p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => router.push("/catalogo")}
        >
          Volver al catálogo
        </Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white pt-40 pb-24 px-4 relative overflow-hidden">
      {/* 🔥 Fondo dinámico */}
      <HeatmapBackground liga={producto?.liga} opacity={0.25} />

      <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* 🖼️ Imagen del producto */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex justify-center items-start"
        >
          <div className="relative group w-full max-w-md">
            <div className="overflow-hidden rounded-3xl border border-[#222]">
              <Image
                src={producto.imagen}
                alt={producto.modelo}
                width={600}
                height={600}
                className="w-full h-auto rounded-3xl shadow-lg transition-transform duration-700 group-hover:scale-105 group-hover:brightness-110"
                priority
              />
            </div>
            {/* Glow sutil al hacer hover */}
            <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-40 transition-all duration-700 bg-[radial-gradient(circle_at_center,rgba(229,9,20,0.4),transparent_70%)]"></div>
          </div>
        </motion.div>

        {/* 🧩 Panel de personalización */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col justify-center text-left space-y-6"
        >
          {/* 🏷️ Encabezado */}
          <div className="flex items-center gap-3 mb-2">
            {producto.logoEquipo && (
              <Image
                src={producto.logoEquipo}
                alt={producto.equipo}
                width={36}
                height={36}
                className="object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] brightness-95 contrast-125"
              />
            )}
            <h1 className="text-3xl font-bold">
              {producto.equipo}{" "}
              <span className="text-gray-400">| {producto.modelo}</span>
            </h1>
          </div>

          <p className="text-[#E50914] text-2xl font-semibold mb-4">
            L{producto.precio}
          </p>

          {/* 🧾 Versión */}
          {opciones?.versiones?.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-gray-300">Versión</h3>
              <div className="flex gap-3 flex-wrap">
                {opciones.versiones.map((v) => (
                  <button
                    key={v}
                    onClick={() => setVersion(v)}
                    className={`px-5 py-2 rounded-full backdrop-blur-md border transition-all ${
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

          {/* 📏 Talla */}
          {opciones?.tallas?.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-gray-300">Talla</h3>
              <div className="flex gap-3 flex-wrap">
                {opciones.tallas.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTalla(t)}
                    className={`px-4 py-2 rounded-full backdrop-blur-md border transition-all ${
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

          {/* 🩶 Parche */}
          {opciones?.parches?.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-gray-300">Parche</h3>
              <div className="flex gap-3 flex-wrap">
                {opciones.parches.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleParcheSelect(p)}
                    className={`px-4 py-2 rounded-full backdrop-blur-md border transition-all ${
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

          {/* 🏷️ Dorsal */}
          <div>
            <h3 className="font-semibold mb-2 text-gray-300">
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

            {quiereDorsal && (
              <div className="mt-4 space-y-4">
                {/* Modo de dorsal */}
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

                {/* Lista de jugadores */}
                {modoDorsal === "jugador" && (
                  <div className="relative w-full max-w-md">
                    <div className="bg-[#111]/70 backdrop-blur-md border border-[#333] rounded-lg px-4 py-3 shadow-lg transition-all hover:border-[#E50914]/50">
                      <select
                        value={jugadorSeleccionado}
                        onChange={(e) => setJugadorSeleccionado(e.target.value)}
                        className="w-full bg-transparent text-gray-100 outline-none text-sm appearance-none cursor-pointer"
                      >
                        <option value="">Selecciona jugador...</option>
                        {opciones?.dorsales
                          ?.filter((d) => d.jugador !== "Personalizado")
                          .map((d, i) => (
                            <option
                              key={i}
                              value={d.jugador}
                              className="bg-[#0A0A0A] text-gray-100 hover:bg-[#E50914]/20"
                            >
                              {d.numero ? `${d.numero}. ${d.jugador}` : d.jugador}
                            </option>
                          ))}
                      </select>
                    </div>
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">
                      ▼
                    </span>
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
              </div>
            )}
          </div>

          {/* 🛒 Botones finales */}
          <div className="flex gap-4 pt-6">
            <Button className="flex-1 py-3" onClick={handleAddToCart}>
              Agregar al carrito
            </Button>
            <Button
              variant="outline"
              className="flex-1 py-3"
              onClick={() => router.push("/catalogo")}
            >
              Volver
            </Button>
          </div>
        </motion.div>
      </div>

      {/* ✅ Toast de producto añadido */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-xl border border-white/10 bg-white/10 backdrop-blur-md shadow-lg text-white text-sm flex items-center gap-2"
          >
            <span className="inline-block w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
            Producto añadido al carrito
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
