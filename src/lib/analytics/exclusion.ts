/**
 * Utilidades para exclusión de analíticas (Localhost, Desarrollador y Administrador).
 * Permite evitar datos falsos provocados por pruebas locales o visitas del dueño desde PC o móvil.
 */

export const ANALYTICS_EXCLUSION_STORAGE_KEY = '90plus5_ignore_analytics';
export const ANALYTICS_EXCLUSION_COOKIE_KEY = '90plus5_ignore_analytics';

/**
 * Detecta si el entorno actual es localhost o desarrollo.
 */
export function isLocalhost(): boolean {
    if (typeof window === 'undefined') {
        return process.env.NODE_ENV === 'development';
    }

    const host = window.location.hostname;
    return (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '0.0.0.0' ||
        host === '[::1]' ||
        host.endsWith('.local') ||
        process.env.NODE_ENV === 'development'
    );
}

/**
 * Verifica si las analíticas deben ser excluidas en el navegador actual:
 * 1. Si está en localhost / desarrollo -> SIEMPRE excluido.
 * 2. Si tiene la bandera de exclusión guardada en localStorage o Cookie -> excluido.
 */
export function isAnalyticsExcluded(): boolean {
    if (typeof window === 'undefined') return false;

    // 1. Siempre excluir localhost / entornos de desarrollo
    if (isLocalhost()) return true;

    // 2. Comprobar bandera en localStorage
    try {
        if (localStorage.getItem(ANALYTICS_EXCLUSION_STORAGE_KEY) === 'true') {
            return true;
        }
    } catch {
        // En modos ultra-privados localStorage puede lanzar excepciones
    }

    // 3. Comprobar bandera en Cookie
    try {
        if (document.cookie.split(';').some(c => c.trim().startsWith(`${ANALYTICS_EXCLUSION_COOKIE_KEY}=true`))) {
            return true;
        }
    } catch {
        // Ignorar
    }

    return false;
}

/**
 * Activa o desactiva la exclusión de analíticas en este dispositivo.
 * Guarda la preferencia tanto en localStorage como en Cookie (1 año) para máxima persistencia.
 */
export function setAnalyticsExcluded(excluded: boolean): void {
    if (typeof window === 'undefined') return;

    try {
        if (excluded) {
            localStorage.setItem(ANALYTICS_EXCLUSION_STORAGE_KEY, 'true');
            document.cookie = `${ANALYTICS_EXCLUSION_COOKIE_KEY}=true; path=/; max-age=31536000; SameSite=Lax`;
        } else {
            localStorage.removeItem(ANALYTICS_EXCLUSION_STORAGE_KEY);
            document.cookie = `${ANALYTICS_EXCLUSION_COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`;
        }
    } catch {
        // Ignorar errores de acceso
    }
}
