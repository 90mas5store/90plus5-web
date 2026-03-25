/**
 * Rate limiter en memoria.
 * 
 * ⚠️ A8 ADVERTENCIA IMPORTANTE:
 * En entornos serverless (Vercel) el estado NO persiste entre instancias.
 * Un atacante puede hacer N reqs/min × M instancias = bypass efectivo.
 * 
 * Para producción a escala, migrar a Upstash Redis (`@upstash/ratelimit`).
 * Este rate limiter es una capa de defensa básica, NO una solución completa.
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Limpieza periódica de entradas expiradas (cada 5 min)
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of store.entries()) {
            if (now > entry.resetAt) store.delete(key);
        }
    }, 5 * 60_000);
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    retryAfterMs: number;
}

/**
 * @param identifier  Clave única (p.ej. `"orders:${ip}"`)
 * @param maxRequests Máximo de solicitudes permitidas en la ventana
 * @param windowMs    Tamaño de la ventana en milisegundos
 */
export function checkRateLimit(
    identifier: string,
    maxRequests: number,
    windowMs: number
): RateLimitResult {
    const now = Date.now();
    const entry = store.get(identifier);

    if (!entry || now > entry.resetAt) {
        store.set(identifier, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: maxRequests - 1, retryAfterMs: 0 };
    }

    if (entry.count >= maxRequests) {
        return { allowed: false, remaining: 0, retryAfterMs: entry.resetAt - now };
    }

    entry.count++;
    return { allowed: true, remaining: maxRequests - entry.count, retryAfterMs: 0 };
}

/** Extrae la IP real del request (compatible con Vercel / proxies). */
export function getClientIp(request: Request): string {
    return (
        request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
        request.headers.get('x-real-ip') ??
        'unknown'
    );
}
