"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useCart } from "../../context/CartContext";
import { X, Plus, Minus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, clearCart, total, updateQty } =
    useCart();
  const router = useRouter();

  // 💰 Formateador de moneda
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-HN", {
      style: "currency",
      currency: "HNL",
      minimumFractionDigits: 2,
    }).format(value);

  // ⏱️ Limpieza automática después de 1 hora
  useEffect(() => {
    const timestamp = localStorage.getItem("cartTimestamp");
    const now = Date.now();

    if (timestamp && now - parseInt(timestamp) > 3600000) {
      clearCart();
      localStorage.removeItem("cartTimestamp");
    } else {
      localStorage.setItem("cartTimestamp", now.toString());
    }
  }, [items, clearCart]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-[90]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.aside
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] z-[100] flex flex-col shadow-[inset_-2px_0_30px_rgba(255,255,255,0.12)]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="h-full flex flex-col bg-gradient-to-br from-white/4 to-white/2 backdrop-blur-md border border-white/10 shadow-2xl rounded-l-lg overflow-hidden">
              {/* Header */}
              <div className="flex justify-between items-center p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">Tu carrito</h2>
                <button
                  onClick={closeCart}
                  className="p-2 rounded-md hover:bg-white/5 transition"
                  aria-label="Cerrar carrito"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Contenido */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence mode="popLayout">
                  {items.length === 0 ? (
                    <motion.div
                      key="empty-state"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="flex justify-center items-center h-40"
                    >
                      <p className="text-center text-white/70 text-sm">
                        Tu carrito está vacío 🛒
                      </p>
                    </motion.div>
                  ) : (
                    items.map((item) => (
                      <motion.div
                        key={
                          item.id +
                          (item.talla || "") +
                          (item.version || "") +
                          (item.parche || "") +
                          (item.dorsalNumero || "") +
                          (item.dorsalNombre || "")
                        }
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="flex justify-between items-stretch gap-3 p-3 rounded-lg bg-white/5 border border-white/10 shadow-[inset_0_0_8px_rgba(255,255,255,0.06)] hover:bg-white/10 transition"
                      >
                        {/* Imagen */}
                        <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-white/5">
                          <Image
                            src={item.imagen}
                            alt={item.equipo}
                            fill
                            className="object-cover"
                          />
                        </div>

                        {/* Columna izquierda: info + controles */}
                        <div className="flex flex-col flex-1 justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-white">
                              {item.equipo}
                            </h3>

                            <p className="text-xs text-white/70">
                              {item.modelo}
                              {item.version && ` • ${item.version}`}
                            </p>

                            {item.talla && (
                              <p className="text-xs text-white/70">
                                Talla: {item.talla}
                              </p>
                            )}

                            {item.parche && (
                              <p className="text-xs text-white/70">
                                Parche: {item.parche}
                              </p>
                            )}

                            {(item.dorsalNombre || item.dorsalNumero) && (
                              <p className="text-xs text-white/70">
                                Dorsal:{" "}
                                {item.dorsalNumero && `${item.dorsalNumero} `}
                                {item.dorsalNombre && `- ${item.dorsalNombre}`}
                              </p>
                            )}
                          </div>

                          {/* Controles de cantidad */}
                          <div className="flex items-center mt-2">
                            <button
                              onClick={() =>
                                updateQty(
                                  item.id,
                                  item.cantidad - 1,
                                  item.talla,
                                  item.version,
                                  item.parche,
                                  item.dorsalNumero,
                                  item.dorsalNombre
                                )
                              }
                              className="p-1 rounded border border-white/10 hover:bg-white/10 transition"
                            >
                              <Minus className="w-3 h-3 text-white" />
                            </button>

                            <span className="px-3 text-sm text-white">
                              {item.cantidad}
                            </span>

                            <button
                              onClick={() =>
                                updateQty(
                                  item.id,
                                  item.cantidad + 1,
                                  item.talla,
                                  item.version,
                                  item.parche,
                                  item.dorsalNumero,
                                  item.dorsalNombre
                                )
                              }
                              className="p-1 rounded border border-white/10 hover:bg-white/10 transition"
                            >
                              <Plus className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        </div>

                        {/* Columna derecha: precio + eliminar */}
                        <div className="flex flex-col justify-between items-end text-right">
                          <p className="text-sm font-medium text-white">
                            {formatCurrency(item.precio * item.cantidad)}
                          </p>

                          <motion.button
                            whileTap={{ scale: 0.85, rotate: -10 }}
                            onClick={() =>
                              removeItem(
                                item.id,
                                item.talla,
                                item.version,
                                item.parche,
                                item.dorsalNumero,
                                item.dorsalNombre
                              )
                            }
                            className="p-1 text-white/60 hover:text-red-400 transition"
                            aria-label="Eliminar producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <motion.div
                  layout
                  className="border-t border-white/10 p-4 space-y-3"
                >
                  <div className="flex justify-between text-sm">
                    <span className="text-white/80">Subtotal:</span>
                    <span className="font-semibold text-white">
                      {formatCurrency(total)}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      closeCart();
                      setTimeout(() => {
                        router.push("/checkout");
                      }, 300);
                    }}
                    className="w-full bg-white/10 text-white py-2 rounded-lg font-semibold hover:bg-white/15 transition"
                  >
                    Confirmar compra
                  </button>

                  <button
                    onClick={clearCart}
                    className="w-full text-sm text-white/70 underline hover:text-red-400"
                  >
                    Vaciar carrito
                  </button>
                </motion.div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
