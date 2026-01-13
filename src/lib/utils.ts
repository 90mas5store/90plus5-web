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
        const options: Intl.DateTimeFormatOptions = {
            day: "numeric",
            month: "long",
            year: "numeric",
            ...(includeTime && {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            }),
            timeZone: timeZone || undefined // undefined usa la del navegador
        };

        return new Intl.DateTimeFormat("es-HN", options).format(date);
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
