"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  Copy,
  Building2,
  Share2,
  ArrowLeft,
  ChevronDown
} from "lucide-react";
import Button from "../../../components/ui/MainButton";
import { BANK_ACCOUNTS } from "../../../lib/config/banks";
import { getWhatsappLink } from "@/lib/whatsapp";

export default function CheckoutDonePage() {
  const params = useSearchParams();
  const router = useRouter();

  const orderId = params.get("orderId");
  const nombre = params.get("nombre");
  const total = params.get("total");
  const anticipo = params.get("anticipo");
  const metodo = params.get("metodo") || "transferencia";
  const municipio = params.get("municipio");
  const departamento = params.get("departamento");

  const [productos, setProductos] = useState([]);
  const [copied, setCopied] = useState("");
  const [expandedBank, setExpandedBank] = useState(null); // null = todas colapsadas

  useEffect(() => {
    const savedCart = localStorage.getItem("cartItems");
    if (savedCart) {
      setProductos(JSON.parse(savedCart));
    }

    // 🎊 Confetti
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

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleShare = () => {
    const message = `👋 Hola, soy ${nombre}. Te comparto el comprobante de mi pedido *${orderId}* por un monto de *L${total}* (${metodo}).`;
    const whatsappURL = getWhatsappLink({ message });
    window.open(whatsappURL, "_blank");
  };

  // 🏦 DATOS BANCARIOS (Desde Config Central)
  const bancosDisponibles = BANK_ACCOUNTS;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-20 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-green-500/5 blur-[120px] -z-10" />

      <div className="max-w-4xl mx-auto">

        {/* ✅ SUCCESS HEADER */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border-2 border-green-500 mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase mb-3">
            ¡Pedido Confirmado!
          </h1>
          <p className="text-gray-400 text-lg">
            Gracias por tu compra, <span className="text-white font-bold">{nombre}</span>
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">

          {/* 📋 COLUMNA IZQUIERDA: DETALLES DEL PEDIDO */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Resumen del Pedido */}
            <section className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem]">
              <h2 className="text-xl font-black uppercase tracking-tight mb-6">Resumen del Pedido</h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                  <span className="text-gray-400 text-sm">ID del Pedido</span>
                  <span className="font-black text-primary">{orderId}</span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                  <span className="text-gray-400 text-sm">Total</span>
                  <span className="text-2xl font-black text-white">L{total}</span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                  <span className="text-gray-400 text-sm">Anticipo (50%)</span>
                  <span className="text-xl font-black text-green-500">L{anticipo}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Método de Pago</span>
                  <span className="capitalize font-bold text-white">{metodo}</span>
                </div>

                {municipio && (
                  <div className="pt-3 border-t border-white/5">
                    <span className="text-gray-400 text-sm block mb-1">Dirección de Envío</span>
                    <span className="text-white font-medium">{municipio}, {departamento}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Productos */}
            {productos.length > 0 && (
              <section className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem]">
                <h2 className="text-xl font-black uppercase tracking-tight mb-6">Artículos</h2>
                <div className="space-y-4">
                  {productos.map((item, idx) => (
                    <div key={idx} className="flex gap-4 pb-4 border-b border-white/5 last:border-0">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black border border-white/10 shrink-0">
                        <Image
                          src={item.imagen}
                          alt={item.equipo}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-white truncate">{item.equipo}</p>
                        <p className="text-xs text-gray-400">{item.modelo}</p>
                        {item.talla && <p className="text-xs text-gray-500">Talla: {item.talla}</p>}
                        {item.dorsalNombre && (
                          <p className="text-xs text-primary font-bold">
                            Dorsal: {item.dorsalNumero} {item.dorsalNombre}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-white">L{item.precio}</p>
                        <p className="text-xs text-gray-500">x{item.cantidad}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </motion.div>

          {/* 🏦 COLUMNA DERECHA: INFORMACIÓN DE PAGO */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {metodo === "transferencia" && (
              <>
                {/* Instrucciones */}
                <section className="bg-primary/10 backdrop-blur-xl border border-primary/20 p-6 rounded-[2rem]">
                  <h2 className="text-xl font-black uppercase tracking-tight mb-4 text-primary">
                    📋 Instrucciones de Pago
                  </h2>
                  <ol className="space-y-3 text-sm text-gray-300">
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-black shrink-0">1</span>
                      <span>Realiza la transferencia del <strong className="text-white">anticipo de L{anticipo}</strong> a cualquiera de las cuentas de abajo</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-black shrink-0">2</span>
                      <span>Guarda tu comprobante de pago</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-black shrink-0">3</span>
                      <span>Envíanos el comprobante por WhatsApp con tu número de pedido</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-black shrink-0">4</span>
                      <span>Procesaremos tu pedido en menos de 24 horas</span>
                    </li>
                  </ol>
                </section>

                {/* Cuentas Bancarias - Acordeón */}
                <div className="space-y-3">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">
                    💳 Selecciona una cuenta para transferir
                  </h3>

                  {bancosDisponibles.map((banco, idx) => {
                    const isExpanded = expandedBank === idx;

                    return (
                      <motion.div
                        key={idx}
                        initial={false}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[1.5rem] overflow-hidden"
                      >
                        {/* Header - Siempre visible */}
                        <button
                          onClick={() => setExpandedBank(isExpanded ? null : idx)}
                          className="w-full p-5 flex items-center gap-4 hover:bg-white/5 transition-colors"
                        >
                          {/* Logo */}
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden p-1 shrink-0">
                            {banco.logo ? (
                              <Image src={banco.logo} alt={banco.banco} width={48} height={48} className="object-contain" />
                            ) : (
                              <Building2 className="w-6 h-6 text-primary" />
                            )}
                          </div>

                          {/* Nombre del banco */}
                          <div className="flex-1 text-left">
                            <h3 className="font-black text-white text-base">{banco.banco}</h3>
                            <p className="text-xs text-gray-500">{banco.tipo}</p>
                          </div>

                          {/* Icono expandir/colapsar */}
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          </motion.div>
                        </button>

                        {/* Detalles - Expandible */}
                        <motion.div
                          initial={false}
                          animate={{
                            height: isExpanded ? "auto" : 0,
                            opacity: isExpanded ? 1 : 0
                          }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-2 space-y-4 border-t border-white/5">
                            {/* Titular */}
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">
                                Titular de la Cuenta
                              </label>
                              <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-xl px-4 py-3">
                                <span className="font-bold text-white text-sm">{banco.titular}</span>
                              </div>
                            </div>

                            {/* Número de cuenta */}
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">
                                Número de Cuenta
                              </label>
                              <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-xl px-4 py-3">
                                <span className="font-black text-primary text-lg tracking-wider">{banco.numero}</span>
                                <button
                                  onClick={() => copyToClipboard(banco.numero, `cuenta-${idx}`)}
                                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                  {copied === `cuenta-${idx}` ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <Copy className="w-5 h-5 text-gray-400" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Monto a transferir */}
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">
                                Monto a Transferir
                              </label>
                              <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                                <span className="font-black text-green-500 text-2xl">L{anticipo}</span>
                                <button
                                  onClick={() => copyToClipboard(anticipo, `monto-${idx}`)}
                                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                  {copied === `monto-${idx}` ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <Copy className="w-5 h-5 text-gray-400" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </div>


                {/* Botón WhatsApp */}
                <Button
                  onClick={handleShare}
                  className="w-full py-5 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl flex items-center justify-center gap-3"
                >
                  <Share2 className="w-5 h-5" />
                  <span>ENVIAR COMPROBANTE POR WHATSAPP</span>
                </Button>
              </>
            )}

            {metodo === "whatsapp" && (
              <section className="bg-green-500/10 backdrop-blur-xl border border-green-500/20 p-6 rounded-[2rem] text-center">
                <h2 className="text-xl font-black uppercase tracking-tight mb-4 text-green-500">
                  ✅ Confirmación por WhatsApp
                </h2>
                <p className="text-gray-300 mb-6">
                  Te hemos redirigido a WhatsApp. Completa tu pedido enviando el mensaje.
                </p>
                <Button
                  onClick={handleShare}
                  className="w-full py-4 bg-green-600 hover:bg-green-700"
                >
                  Abrir WhatsApp de nuevo
                </Button>
              </section>
            )}
          </motion.div>
        </div>

        {/* Botón Volver */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <button
            onClick={() => router.push("/catalogo")}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold uppercase tracking-widest">Volver al Catálogo</span>
          </button>
        </motion.div>
      </div>
    </main>
  );
}
