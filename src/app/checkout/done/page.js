"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useEffect, useState } from "react";
import Image from "next/image";
import Button from "../../../components/ui/Button";

export default function CheckoutDonePage() {
  const params = useSearchParams();
  const router = useRouter();

  const orderId = params.get("orderId");
  const nombre = params.get("nombre");
  const total = params.get("total");
  const metodo = params.get("metodo") || "transferencia";
  const municipio = params.get("municipio");
  const departamento = params.get("departamento");

  // 🛒 Recuperar carrito del localStorage antes de limpiar
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    const savedCart = localStorage.getItem("cartItems");
    if (savedCart) {
      setProductos(JSON.parse(savedCart));
    }

    // 🎊 Confetti animación
    const duration = 2 * 1000;
    const end = Date.now() + duration;
    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  const handleShare = () => {
    const message = `👋 Hola, soy ${nombre}. Te comparto el comprobante de mi pedido *${orderId}* por un monto de *L${total}* (${metodo}).`;
    const whatsappURL = `https://wa.me/50499999999?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, "_blank");
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-3xl w-full bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-2xl shadow-xl text-center"
      >
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-4 text-[#E50914]">¡Pedido completado!</h1>

        <p className="text-gray-300 mb-6">
          Gracias por tu compra, <span className="font-semibold text-white">{nombre}</span>.  
          En breve recibirás confirmación por correo o WhatsApp.
        </p>

        {/* Detalles del pedido */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-5 text-sm text-left mb-8 space-y-2">
          <p>
            <span className="text-white/70">ID del pedido:</span>{" "}
            <span className="text-white font-semibold">{orderId}</span>
          </p>
          <p>
            <span className="text-white/70">Método de pago:</span>{" "}
            <span className="capitalize text-white">{metodo}</span>
          </p>
          <p>
            <span className="text-white/70">Monto total:</span>{" "}
            <span className="text-[#E50914] font-semibold">L{total}</span>
          </p>
          {municipio && (
            <p>
              <span className="text-white/70">Dirección de envío:</span>{" "}
              <span className="text-white">
                {municipio}, {departamento}
              </span>
            </p>
          )}
        </div>

        {/* 🧾 Lista de productos */}
        {productos.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-[#E50914] mb-4 text-left">
              Resumen de tu pedido
            </h2>
            <div className="divide-y divide-white/10">
              {productos.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-white/10">
                      <Image
                        src={item.imagen}
                        alt={item.equipo}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col text-left leading-tight">
                      <p className="text-sm font-medium text-white">
                        {item.equipo}{" "}
                        <span className="text-gray-400">× {item.cantidad}</span>
                      </p>
                      <p className="text-xs text-gray-400">{item.modelo}</p>
                      {item.version && (
                        <p className="text-xs text-gray-500 italic">
                          Versión: {item.version}
                        </p>
                      )}
                      {item.talla && (
                        <p className="text-xs text-gray-500 italic">
                          Talla: {item.talla}
                        </p>
                      )}
                      {(item.dorsalNumero || item.dorsalNombre) && (
                        <p className="text-xs text-gray-500 italic">
                          Dorsal:{" "}
                          {item.dorsalNumero && (
                            <span className="text-white font-semibold">
                              {item.dorsalNumero}
                            </span>
                          )}{" "}
                          {item.dorsalNombre && (
                            <span className="text-white font-semibold uppercase">
                              - {item.dorsalNombre}
                            </span>
                          )}
                        </p>
                      )}
                      {item.parche && (
                        <p className="text-xs text-gray-500 italic">
                          Parche: {item.parche}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-white whitespace-nowrap">
                    L{(item.precio * item.cantidad).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acciones finales */}
        {(metodo === "transferencia" || metodo === "whatsapp") && (
          <Button onClick={handleShare} className="w-full py-3 mb-4">
            Compartir por WhatsApp
          </Button>
        )}

        <button
          onClick={() => router.push("/catalogo")}
          className="w-full text-sm text-gray-400 hover:text-white transition"
        >
          ← Volver al catálogo
        </button>
      </motion.div>
    </main>
  );
}
