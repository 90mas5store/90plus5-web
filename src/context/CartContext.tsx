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
  liga?: string;
  tipo?: string;
  color?: string;
  dorsalNumero?: string;
  dorsalNombre?: string;
  parche?: string;
  parches?: string[];
};

// 👉 Tipo del contexto
type CartContextType = {
  items: CartItem[];
  total: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (
    id: string,
    talla?: string,
    version?: string,
    parche?: string,
    dorsalNumero?: string,
    dorsalNombre?: string
  ) => void;
  clearCart: () => void;
  updateQty: (
    id: string,
    nuevaCantidad: number,
    talla?: string,
    version?: string,
    parche?: string,
    dorsalNumero?: string,
    dorsalNombre?: string
  ) => void;
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

  // 🧩 Función auxiliar para comparar ítems idénticos
  const isSameItem = (a: CartItem, b: CartItem) =>
    a.id === b.id &&
    a.talla === b.talla &&
    a.version === b.version &&
    a.parche === b.parche &&
    a.dorsalNumero === b.dorsalNumero &&
    a.dorsalNombre === b.dorsalNombre;

  // ➕ Agregar item
  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => isSameItem(i, newItem));

      if (existing) {
        return prev.map((i) =>
          isSameItem(i, newItem)
            ? { ...i, cantidad: i.cantidad + newItem.cantidad }
            : i
        );
      }

      return [...prev, newItem];
    });
    setIsOpen(true);
  };

  // ❌ Eliminar item
  const removeItem = (
    id: string,
    talla?: string,
    version?: string,
    parche?: string,
    dorsalNumero?: string,
    dorsalNombre?: string
  ) => {
    setItems((prev) =>
      prev.filter(
        (item) =>
          !(
            item.id === id &&
            item.talla === talla &&
            item.version === version &&
            item.parche === parche &&
            item.dorsalNumero === dorsalNumero &&
            item.dorsalNombre === dorsalNombre
          )
      )
    );
  };

  // 🔄 Actualizar cantidad
  const updateQty = (
    id: string,
    nuevaCantidad: number,
    talla?: string,
    version?: string,
    parche?: string,
    dorsalNumero?: string,
    dorsalNombre?: string
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id &&
        item.talla === talla &&
        item.version === version &&
        item.parche === parche &&
        item.dorsalNumero === dorsalNumero &&
        item.dorsalNombre === dorsalNombre
          ? { ...item, cantidad: Math.max(1, nuevaCantidad) }
          : item
      )
    );
  };

  // 🧼 Vaciar carrito
  const clearCart = () => setItems([]);

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
