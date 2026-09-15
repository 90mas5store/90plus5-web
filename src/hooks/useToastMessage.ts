"use client";
import toast, { ToastOptions } from "react-hot-toast";

/**
 * useToastMessage()
 * 🔥 Hook personalizado para mostrar toasts coherentes con la identidad 90+5 Store.
 * 
 * Diseño premium homologado para toda la aplicación.
 */

// 🎨 Estilos base premium compartidos
const baseStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #0A0A0A 0%, #111111 100%)",
    color: "#fff",
    fontFamily: "Satoshi, sans-serif",
    fontSize: "12px", // Más pequeño en móvil
    fontWeight: 500,
    padding: "10px 14px", // Más compacto
    borderRadius: "12px", // Bordes menos redondeados
    boxShadow: "0 4px 16px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)",
    maxWidth: "300px", // Más estrecho para móvil
};

interface UseToastMessageReturn {
    success: (message: string) => string;
    error: (message: string) => string;
    info: (message: string) => string;
    cartSuccess: (productName: string, size: string, customization?: string | null) => string;
    confirm: (message: string) => string;
    loading: (message: string) => string;
    location: (message: string) => string;
    warning: (message: string) => string;
    celebrate: (message: string) => string;
    dismiss: (toastId?: string) => void;
}

// 🛠️ Instancia única y estable de métodos toast para evitar re-renders innecesarios en dependencias de hooks
const toastMethods: UseToastMessageReturn = {
    // ✅ Toast de éxito general
    success: (message: string) =>
        toast.success(message, {
            duration: 4000,
            style: {
                ...baseStyle,
                border: "1px solid rgba(229,9,20,0.4)",
                boxShadow: "0 8px 32px rgba(229,9,20,0.15), 0 0 0 1px rgba(229,9,20,0.1)",
            },
            iconTheme: { primary: "#E50914", secondary: "#fff" },
        }),

    // ❌ Toast de error
    error: (message: string) =>
        toast.error(message, {
            duration: 5000,
            style: {
                ...baseStyle,
                border: "1px solid rgba(255,50,50,0.5)",
                boxShadow: "0 8px 32px rgba(255,50,50,0.15), 0 0 0 1px rgba(255,50,50,0.1)",
            },
            iconTheme: { primary: "#ff3b3b", secondary: "#fff" },
        }),

    // ℹ️ Toast informativo
    info: (message: string) =>
        toast(message, {
            duration: 4000,
            icon: "💡",
            style: {
                ...baseStyle,
                border: "1px solid rgba(255,255,255,0.15)",
            },
        }),

    // 🛒 Toast especial para agregar al carrito
    cartSuccess: (productName: string, size: string, customization: string | null = null) => {
        const mensaje = customization
            ? `🎽 ${productName} · Talla ${size} · ${customization}`
            : `🎽 ${productName} · Talla ${size}`;

        return toast.success(
            mensaje,
            {
                duration: 4000,
                style: {
                    ...baseStyle,
                    border: "1px solid rgba(34,197,94,0.4)",
                    boxShadow: "0 8px 32px rgba(34,197,94,0.12), 0 0 0 1px rgba(34,197,94,0.08)",
                },
                iconTheme: { primary: "#22c55e", secondary: "#fff" },
            }
        );
    },

    // ✨ Toast de confirmación (acciones completadas)
    confirm: (message: string) =>
        toast.success(message, {
            duration: 3500,
            icon: "✨",
            style: {
                ...baseStyle,
                border: "1px solid rgba(229,9,20,0.5)",
                boxShadow: "0 8px 32px rgba(229,9,20,0.2), 0 0 0 1px rgba(229,9,20,0.15)",
            },
        }),

    // ⏳ Toast de carga
    loading: (message: string) =>
        toast.loading(message, {
            style: {
                ...baseStyle,
                border: "1px solid rgba(255,255,255,0.1)",
            },
        }),

    // 📍 Toast de ubicación
    location: (message: string) =>
        toast.success(message, {
            duration: 4000,
            icon: "📍",
            style: {
                ...baseStyle,
                border: "1px solid rgba(59,130,246,0.4)",
                boxShadow: "0 8px 32px rgba(59,130,246,0.12), 0 0 0 1px rgba(59,130,246,0.08)",
            },
        }),

    // ⚠️ Toast de advertencia
    warning: (message: string) =>
        toast(message, {
            duration: 4500,
            icon: "⚠️",
            style: {
                ...baseStyle,
                border: "1px solid rgba(251,191,36,0.4)",
                boxShadow: "0 8px 32px rgba(251,191,36,0.12), 0 0 0 1px rgba(251,191,36,0.08)",
            },
        }),

    // 🎉 Toast de celebración (pedidos completados)
    celebrate: (message: string) =>
        toast.success(message, {
            duration: 5000,
            icon: "🎉",
            style: {
                ...baseStyle,
                border: "1px solid rgba(229,9,20,0.6)",
                boxShadow: "0 12px 40px rgba(229,9,20,0.25), 0 0 0 1px rgba(229,9,20,0.2)",
                background: "linear-gradient(135deg, #0A0A0A 0%, #1a0a0a 100%)",
            },
        }),

    // 🔄 Dismiss toast por ID
    dismiss: (toastId?: string) => toast.dismiss(toastId),
};

export default function useToastMessage(): UseToastMessageReturn {
    return toastMethods;
}
