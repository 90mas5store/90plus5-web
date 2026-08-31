"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type CartItem = {
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
  parche?: string | null;
  parches?: string[];
  // UUIDs para Supabase
  variant_id?: string | null;
  size_id?: string | null;
  patch_id?: string | null;
  player_id?: string | null;
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
  const [isHydrated, setIsHydrated] = useState(false);

  // 🧮 Calcular total
  const total = items.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0
  );

  // 💾 1. Cargar carrito desde localStorage una sola vez al montar
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem("cart90mas5") || localStorage.getItem("cartItems");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // 💾 2. Guardar carrito al cambiar (SOLO si ya se cargó/hidrató de localStorage)
  useEffect(() => {
    if (typeof window === 'undefined' || !isHydrated) return;

    try {
      const cartData = JSON.stringify(items);
      localStorage.setItem("cart90mas5", cartData);
      localStorage.setItem("cartItems", cartData);
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [items, isHydrated]);

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
            ? { ...i, cantidad: Math.min(i.cantidad + newItem.cantidad, 99) }
            : i
        );
      }

      // 🛡️ A2 FIX: Clamp cantidad al agregar
      return [...prev, { ...newItem, cantidad: Math.min(Math.max(1, newItem.cantidad), 99) }];
    });
    setIsOpen(true);

    if (typeof window !== 'undefined' && window.trackEvent) {
      window.trackEvent('add_to_cart', {
        productId: newItem.id,
        modelo: newItem.modelo,
        equipo: newItem.equipo,
        talla: newItem.talla,
        precio: newItem.precio,
        cantidad: newItem.cantidad,
      });
    }
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
          ? { ...item, cantidad: Math.min(Math.max(1, nuevaCantidad), 99) }
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
