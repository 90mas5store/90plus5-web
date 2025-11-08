"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type CartItem = {
  id: string;
  equipo: string;
  modelo: string;
  talla: string;
  precio: number;
  cantidad: number;
  imagen: string;
  version?: string;
  dorsal?: string;
};

type CartContextType = {
  items: CartItem[];
  total: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (id: string, talla?: string) => void;
  clearCart: () => void;
  updateQty: (id: string, nuevaCantidad: number, talla?: string) => void;
};

const CartContext = createContext<CartContextType>({} as CartContextType);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // 🧮 Calcular total
  const total = items.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0
  );

  // 💾 Cargar carrito desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem("cart90mas5");
    if (saved) setItems(JSON.parse(saved));
  }, []);

  // 💾 Guardar carrito al cambiar
  useEffect(() => {
    localStorage.setItem("cart90mas5", JSON.stringify(items));
  }, [items]);

  // ➕ Agregar item
  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.id === newItem.id && i.talla === newItem.talla
      );
      if (existing) {
        return prev.map((i) =>
          i.id === newItem.id && i.talla === newItem.talla
            ? { ...i, cantidad: i.cantidad + newItem.cantidad }
            : i
        );
      }
      return [...prev, newItem];
    });
    setIsOpen(true);
  };

  // ❌ Eliminar item
  const removeItem = (id: string, talla?: string) => {
    setItems((prev) =>
      prev.filter((item) => !(item.id === id && item.talla === talla))
    );
  };

  // 🧼 Vaciar carrito
  const clearCart = () => setItems([]);

  // 🔄 Actualizar cantidad
  const updateQty = (id: string, nuevaCantidad: number, talla?: string) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === id && item.talla === talla
            ? { ...item, cantidad: Math.max(1, nuevaCantidad) }
            : item
        )
        .filter((i) => i.cantidad > 0)
    );
  };

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        isOpen,
        openCart,
        closeCart,
        addItem,
        removeItem,
        clearCart,
        updateQty,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
