"use client";
import toast from "react-hot-toast";

/**
 * useToastMessage()
 * 🔥 Hook personalizado para mostrar toasts coherentes con la identidad 90+5 Store.
 *
 * Ejemplo de uso:
 *   const toastMsg = useToastMessage();
 *   toastMsg.success("Pedido confirmado ✅");
 */
export default function useToastMessage() {
  const success = (message) =>
    toast.success(message, {
      duration: 4000,
      style: {
        background: "#0A0A0A",
        color: "#fff",
        border: "1px solid rgba(229,9,20,0.3)",
        fontFamily: "Satoshi, sans-serif",
        fontSize: "14px",
        padding: "12px 16px",
      },
      iconTheme: { primary: "#E50914", secondary: "#fff" },
    });

  const error = (message) =>
    toast.error(message, {
      duration: 5000,
      style: {
        background: "#0A0A0A",
        color: "#fff",
        border: "1px solid rgba(255,50,50,0.4)",
        fontFamily: "Satoshi, sans-serif",
        fontSize: "14px",
        padding: "12px 16px",
      },
      iconTheme: { primary: "#ff3b3b", secondary: "#fff" },
    });

  const info = (message) =>
    toast(message, {
      duration: 4000,
      icon: "ℹ️",
      style: {
        background: "#111",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.2)",
        fontFamily: "Satoshi, sans-serif",
        fontSize: "14px",
      },
    });

  return { success, error, info };
}
