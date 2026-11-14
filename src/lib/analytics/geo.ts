import { NextRequest } from 'next/server';

/**
 * Diccionario de nombres de países en español y sus emojis de bandera
 */
const COUNTRY_INFO: Record<string, { name: string; flag: string }> = {
    HN: { name: 'Honduras', flag: '🇭🇳' },
    US: { name: 'Estados Unidos', flag: '🇺🇸' },
    ES: { name: 'España', flag: '🇪🇸' },
    MX: { name: 'México', flag: '🇲🇽' },
    GT: { name: 'Guatemala', flag: '🇬🇹' },
    SV: { name: 'El Salvador', flag: '🇸🇻' },
    NI: { name: 'Nicaragua', flag: '🇳🇮' },
    CR: { name: 'Costa Rica', flag: '🇨🇷' },
    PA: { name: 'Panamá', flag: '🇵🇦' },
    CO: { name: 'Colombia', flag: '🇨🇴' },
    AR: { name: 'Argentina', flag: '🇦🇷' },
    CA: { name: 'Canadá', flag: '🇨🇦' },
    CL: { name: 'Chile', flag: '🇨🇱' },
    PE: { name: 'Perú', flag: '🇵🇪' },
    EC: { name: 'Ecuador', flag: '🇪🇨' },
    DO: { name: 'Rep. Dominicana', flag: '🇩🇴' },
    IT: { name: 'Italia', flag: '🇮🇹' },
    GB: { name: 'Reino Unido', flag: '🇬🇧' },
    DE: { name: 'Alemania', flag: '🇩🇪' },
    FR: { name: 'Francia', flag: '🇫🇷' },
    BR: { name: 'Brasil', flag: '🇧🇷' },
    UY: { name: 'Uruguay', flag: '🇺🇾' },
};

/**
 * Convierte un código ISO de 2 letras a emoji de bandera (ej. 'HN' -> 🇭🇳)
 */
export function getCountryFlag(code?: string | null): string {
    if (!code || code.length !== 2) return '🌐';
    const upper = code.toUpperCase();
    if (COUNTRY_INFO[upper]) return COUNTRY_INFO[upper].flag;
    
    // Fallback matemático para códigos ISO válidos
    const first = upper.charCodeAt(0) - 65 + 0x1f1e6;
    const second = upper.charCodeAt(1) - 65 + 0x1f1e6;
    if (first >= 0x1f1e6 && first <= 0x1f1ff && second >= 0x1f1e6 && second <= 0x1f1ff) {
        return String.fromCodePoint(first, second);
    }
    return '🌐';
}

/**
 * Retorna el nombre en español del país
 */
export function getCountryName(code?: string | null): string {
    if (!code) return 'Desconocido';
    const upper = code.toUpperCase();
    return COUNTRY_INFO[upper]?.name || upper;
}

/**
 * Extrae la ubicación geográfica a partir de encabezados HTTP (Vercel, Cloudflare o proxies)
 */
export function extractGeoFromRequest(request: NextRequest): {
    country: string | null;
    city: string | null;
    region: string | null;
} {
    // 1. Vercel Edge Headers
    const vercelCountry = request.headers.get('x-vercel-ip-country');
    const vercelCity = request.headers.get('x-vercel-ip-city');
    const vercelRegion = request.headers.get('x-vercel-ip-country-region');

    // 2. Cloudflare Headers
    const cfCountry = request.headers.get('cf-ipcountry');

    let country = vercelCountry || cfCountry || null;
    if (country) {
        country = country.toUpperCase();
        if (country === 'XX' || country === 'T1') country = null;
    }

    let city: string | null = null;
    if (vercelCity) {
        try {
            city = decodeURIComponent(vercelCity);
        } catch {
            city = vercelCity;
        }
    }

    const region = vercelRegion || null;

    return {
        country,
        city,
        region,
    };
}

