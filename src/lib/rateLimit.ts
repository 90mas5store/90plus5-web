/**
 * Rate limiter con graceful fallback:
 * - Si UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN están presentes → Upstash Redis (distribuido)
 * - Si no → in-memory (desarrollo local, advertencia: no persiste entre instancias serverless)
 *
 * Para activar Upstash, añadir a .env.local:
 *   UPSTASH_REDIS_REST_URL=https://...upstash.io
 *   UPSTASH_REDIS_REST_TOKEN=...
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Limpieza periódica de entradas expiradas (cada 5 min, solo en-memory)
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of store.entries()) {
            if (now > entry.resetAt) store.delete(key);
        }
    }, 5 * 60_000);
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    retryAfterMs: number;
}

export interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

/** Configuración de niveles (tiers) de rate limiting */
export const RATE_LIMIT_TIERS = {
    // 🔒 Estricto: Rutas sensibles (pedidos, pagos, cupones, invitaciones)
    STRICT: { maxRequests: 5, windowMs: 60_000 },
    // 🛡️ Admin: Operaciones y reportes administrativos
    ADMIN: { maxRequests: 30, windowMs: 60_000 },
    // 🌐 General: Consultas públicas (partidos en vivo, cuentas bancarias, rastreo)
    GENERAL: { maxRequests: 60, windowMs: 60_000 },
} as const;

/**
 * Determina el tier de rate limit según el path de la URL.
 * Retorna null si la ruta está exenta (como webhooks).
 */
export function getRateLimitTierForPath(pathname: string): { tier: keyof typeof RATE_LIMIT_TIERS; config: RateLimitConfig } | null {
    // Webhooks están exentos de rate limit por IP (usan autenticación por firma)
    if (pathname.startsWith('/api/webhooks')) {
        return null;
    }

    // Rutas estrictas (transacciones, datos sensibles, invitaciones)
    if (
        pathname === '/api/orders/create' ||
        pathname === '/api/payments/proof' ||
        pathname === '/api/discount/validate' ||
        pathname === '/api/admin/invite'
    ) {
        return { tier: 'STRICT', config: RATE_LIMIT_TIERS.STRICT };
    }

    // Rutas de administración (/api/admin/*)
    if (pathname.startsWith('/api/admin')) {
        return { tier: 'ADMIN', config: RATE_LIMIT_TIERS.ADMIN };
    }

    // Rutas generales por defecto (/api/*)
    return { tier: 'GENERAL', config: RATE_LIMIT_TIERS.GENERAL };
}

/**
 * Genera encabezados HTTP estándar de Rate Limiting (X-RateLimit-* y Retry-After).
 */
export function getRateLimitHeaders(
    result: RateLimitResult,
    maxRequests: number
): Record<string, string> {
    const retryAfterSeconds = Math.ceil(result.retryAfterMs / 1000);
    const resetTimeSeconds = Math.ceil((Date.now() + result.retryAfterMs) / 1000);

    const headers: Record<string, string> = {
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, result.remaining).toString(),
        'X-RateLimit-Reset': resetTimeSeconds.toString(),
    };

    if (!result.allowed) {
        headers['Retry-After'] = Math.max(1, retryAfterSeconds).toString();
    }

    return headers;
}

function checkInMemory(
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

// Caché de instancias de Ratelimit para Upstash
let cachedUpstashRedis: any = null;
const ratelimitInstances = new Map<string, any>();

/**
 * @param identifier  Clave única (p.ej. `"orders:${ip}"`)
 * @param maxRequests Máximo de solicitudes permitidas en la ventana
 * @param windowMs    Tamaño de la ventana en milisegundos
 */
export async function checkRateLimit(
    identifier: string,
    maxRequests: number,
    windowMs: number
): Promise<RateLimitResult> {
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (upstashUrl && upstashToken) {
        try {
            const cacheKey = `${maxRequests}_${windowMs}`;

            if (!ratelimitInstances.has(cacheKey)) {
                const { Ratelimit } = await import('@upstash/ratelimit');
                const { Redis } = await import('@upstash/redis');

                if (!cachedUpstashRedis) {
                    cachedUpstashRedis = new Redis({ url: upstashUrl, token: upstashToken });
                }

                const ratelimit = new Ratelimit({
                    redis: cachedUpstashRedis,
                    limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs}ms`),
                });

                ratelimitInstances.set(cacheKey, ratelimit);
            }

            const ratelimit = ratelimitInstances.get(cacheKey);
            const { success, remaining, reset } = await ratelimit.limit(identifier);
            return {
                allowed: success,
                remaining,
                retryAfterMs: success ? 0 : Math.max(0, reset - Date.now()),
            };
        } catch (err) {
            // Fallback to in-memory if Upstash fails
            console.warn('[rateLimit] Upstash error, falling back to in-memory:', err);
            return checkInMemory(identifier, maxRequests, windowMs);
        }
    }

    return checkInMemory(identifier, maxRequests, windowMs);
}

/** Extrae la IP real del request (compatible con Vercel / proxies). */
export function getClientIp(request: Request): string {
    return (
        request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
        request.headers.get('x-real-ip') ??
        'unknown'
    );
}

