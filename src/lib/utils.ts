import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const HONDURAS_TIMEZONE = "America/Tegucigalpa";

/**
 * Combina clases de Tailwind de manera eficiente
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Formatea una fecha ISO UTC a formato legible local o UTC-6 (Honduras).
 * @param dateString Fecha en formato ISO string (UTC)
 * @param includeTime Si debe incluir la hora
 * @param timeZone Zona horaria específica (opcional, por defecto intenta detectar o usa America/Tegucigalpa como fallback)
 */
export function formatDate(
    dateString: string | null | undefined,
    includeTime: boolean = true,
    timeZone?: string
): string {
    if (!dateString) return "Fecha no disponible";

    const date = new Date(dateString);

    // Si la fecha es inválida
    if (isNaN(date.getTime())) return "Fecha inválida";

    try {
        const tz = timeZone || HONDURAS_TIMEZONE;

        const datePart = new Intl.DateTimeFormat("es-HN", {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: tz,
        }).format(date);

        if (!includeTime) {
            return datePart;
        }

        const timePart = new Intl.DateTimeFormat("es-HN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: tz,
        }).format(date);

        // Normalizamos espacios no separables (narrow no-break space \u202f o \u00a0 en p. m.)
        const cleanTime = timePart.replace(/[\u202F\u00A0]/g, " ");

        // Formato determinista idéntico en servidor (Node) y cliente (Navegador)
        return `${datePart}, ${cleanTime}`;
    } catch (e) {
        // Fallback si falla la detección
        return date.toLocaleDateString("es-HN");
    }
}

/**
 * Formatea una cantidad en Lempiras
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-HN", {
        style: "currency",
        currency: "HNL",
        minimumFractionDigits: 2
    }).format(amount);
}
