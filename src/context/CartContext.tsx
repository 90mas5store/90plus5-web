"use client";

import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // ✅ Cargar carrito guardado
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cartItems");
      if (stored) setItems(JSON.parse(stored));
    } catch (err) {
      console.error("Error cargando carrito:", err);
    }
  }, []);

  // ✅ Guardar cambios automáticamente
  useEffect(() => {
    try {
      localStorage.setItem("cartItems", JSON.stringify(items));
    } catch (err) {
      console.error("Error guardando carrito:", err);
    }
  }, [items]);

  // Funciones principales
  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const clearCart = () => setItems([]);

  const addItem = (item) => {
    setItems((prev) => {
      const existing = prev.find(
        (p) =>
          p.id === item.id &&
          p.version === item.version &&
          p.talla === item.talla &&
          p.dorsal === item.dorsal
      );

      if (existing) {
        return prev.map((p) =>
          p === existing ? { ...p, cantidad: p.cantidad + 1 } : p
        );
      } else {
        return [...prev, item];
      }
    });
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQty = (id, cantidad) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, cantidad: Math.max(cantidad, 1) } : item
        )
        .filter((item) => item.cantidad > 0)
    );
  };

  const total = items.reduce(
    (sum, item) => sum + item.precio * item.cantidad,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        total,
        isOpen,
        openCart,
        closeCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de un CartProvider");
  }
  return context;
}
