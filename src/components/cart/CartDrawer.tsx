"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useCart } from "../../context/CartContext";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Shirt } from "lucide-react";
import { useRouter } from "next/navigation";
import MainButton from "../ui/MainButton";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, clearCart, total, updateQty } =
    useCart();
  const router = useRouter();

  // 💰 Formateador de moneda
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-HN", {
      style: "currency",
      currency: "HNL",
      minimumFractionDigits: 0,
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
          {/* 🌑 Overlay con desenfoque profundo */}
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />

          {/* 🛍️ Drawer */}
          <motion.aside
            className="fixed top-0 right-0 h-full w-full sm:w-[450px] z-[100] flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 35 }}
          >
            <div className="h-full flex flex-col bg-[#0a0a0a] border-l border-white/5 shadow-2xl relative overflow-hidden">

              {/* ✨ Background Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -z-10" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 blur-[100px] -z-10" />

              {/* 🏷️ Header */}
              <div className="flex justify-between items-center p-6 border-b border-white/5 bg-black/20 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tighter uppercase">Tu Carrito</h2>
                    <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">
                      {items.length} {items.length === 1 ? 'Artículo' : 'Artículos'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeCart}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                  aria-label="Cerrar carrito"
                >
                  <X className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:rotate-90 transition-all" />
                </button>
              </div>

              {/* 📦 Contenido */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {items.length === 0 ? (
                    <motion.div
                      key="empty-state"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex flex-col justify-center items-center h-full text-center space-y-4"
                    >
                      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10 mb-2">
                        <ShoppingBag className="w-10 h-10 text-gray-600" />
                      </div>
                      <h3 className="text-xl font-bold text-white">Tu carrito está vacío</h3>
                      <p className="text-gray-500 text-sm max-w-[250px]">
                        Parece que aún no has añadido ninguna joya a tu colección.
                      </p>
                      <MainButton
                        onClick={closeCart}
                        variant="outline"
                        className="mt-4 border-primary/30 text-primary hover:bg-primary/10"
                      >
                        Explorar Tienda
                      </MainButton>
                    </motion.div>
                  ) : (
                    items.map((item, idx) => (
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
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group relative flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all duration-500"
                      >
                        {/* 🖼️ Imagen del Producto */}
                        <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-black border border-white/10">
                          <Image
                            src={item.imagen}
                            alt={item.equipo}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>

                        {/* 📝 Información */}
                        <div className="flex flex-col flex-1 min-w-0 justify-between">
                          <div className="space-y-1">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="text-sm font-black text-white leading-tight truncate uppercase tracking-tight">
                                {item.equipo}
                              </h3>
                              <button
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
                                className="text-gray-600 hover:text-primary transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-[10px] text-primary font-bold uppercase tracking-widest">
                              {item.modelo}
                            </p>

                            <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
                              {item.version && (
                                <span className="text-[9px] text-gray-500 font-bold uppercase flex items-center gap-1">
                                  <div className="w-1 h-1 bg-primary rounded-full" /> {item.version}
                                </span>
                              )}
                              {item.talla && (
                                <span className="text-[9px] text-gray-500 font-bold uppercase">Talla: {item.talla}</span>
                              )}
                              {item.parche && (
                                <span className="text-[9px] text-gray-500 font-bold uppercase">Parche: {item.parche}</span>
                              )}
                            </div>

                            {(item.dorsalNombre || item.dorsalNumero) && (
                              <div className="mt-1 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md inline-flex items-center gap-1.5">
                                <Shirt className="w-3 h-3 text-primary" />
                                <span className="text-[9px] font-black text-white uppercase">
                                  {item.dorsalNumero || 'S/N'} • {item.dorsalNombre || 'SIN NOMBRE'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* 🔢 Controles y Precio */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center bg-black/40 rounded-lg border border-white/10 p-0.5">
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
                                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-all"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center text-xs font-black text-white">
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
                                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-all"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-sm font-black text-white">
                              {formatCurrency(item.precio * item.cantidad)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              {/* 💳 Footer */}
              {items.length > 0 && (
                <motion.div
                  layout
                  className="p-6 bg-black/40 backdrop-blur-2xl border-t border-white/5 space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500">
                      <span>Subtotal</span>
                      <span className="text-white">{formatCurrency(total)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500">
                      <span>Envío</span>
                      <span className="text-green-500">Gratis</span>
                    </div>
                    <div className="h-px bg-white/5 my-2" />
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-black text-white uppercase tracking-tighter">Total</span>
                      <span className="text-2xl font-black text-primary drop-shadow-[0_0_15px_rgba(229,9,20,0.4)]">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <MainButton
                      onClick={() => {
                        closeCart();
                        setTimeout(() => {
                          router.push("/checkout");
                        }, 300);
                      }}
                      className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-black rounded-xl shadow-[0_15px_30px_rgba(229,9,20,0.3)] flex items-center justify-center gap-3 group"
                    >
                      <span>CONFIRMAR COMPRA</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </MainButton>

                    <button
                      onClick={clearCart}
                      className="w-full py-2 text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] hover:text-primary transition-colors"
                    >
                      Vaciar Carrito
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
