"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Button from "../../../components/ui/MainButton";
import { useEffect } from "react";

export default function TransferenciaPage() {
  const params = useSearchParams();
  const router = useRouter();

  const orderId = params.get("orderId");
  const nombre = params.get("nombre");
  const total = params.get("total");
  const metodo = params.get("metodo") || "transferencia";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleConfirm = () => {
    // Redirige al done con los mismos datos
    const query = new URLSearchParams({
      orderId,
      nombre,
      total,
      metodo,
    }).toString();
    router.push(`/checkout/done?${query}`);
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-lg w-full bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-2xl shadow-xl"
      >
        <h1 className="text-2xl font-bold text-[#E50914] mb-6 text-center">
          Transferencia bancaria
        </h1>

        <p className="text-gray-300 text-center mb-6">
          Gracias <span className="text-white font-semibold">{nombre}</span>,
          tu pedido ha sido registrado correctamente.
          Solo falta realizar el pago por transferencia.
        </p>

        <div className="bg-black/40 border border-white/10 rounded-xl p-5 text-sm space-y-2 mb-8">
          <p className="text-white font-medium">💳 Cuenta para transferir:</p>
          <p className="text-gray-300">Banco Atlántida</p>
          <p className="text-gray-300">Cuenta: <span className="font-semibold text-white">1234567890</span></p>
          <p className="text-gray-300">Titular: <span className="font-semibold text-white">90+5 Store</span></p>
          <p className="text-gray-300">Tipo de cuenta: Ahorros</p>
          <p className="text-gray-300">Monto: <span className="text-[#E50914] font-semibold">L{total}</span></p>
          <p className="text-xs text-gray-500 mt-3 italic">
            Envía tu comprobante al WhatsApp o presiona el botón de abajo cuando ya hayas realizado la transferencia.
          </p>
        </div>

        <Button onClick={handleConfirm} className="w-full mt-4 py-3">
          He realizado la transferencia
        </Button>

        <button
          onClick={() => router.push("/catalogo")}
          className="mt-4 w-full text-sm text-gray-400 hover:text-white transition"
        >
          ← Volver al catálogo
        </button>
      </motion.div>
    </main>
  );
}
