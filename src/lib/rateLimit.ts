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
            const { Ratelimit } = await import('@upstash/ratelimit');
            const { Redis } = await import('@upstash/redis');

            const redis = new Redis({ url: upstashUrl, token: upstashToken });
            const ratelimit = new Ratelimit({
                redis,
                limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs}ms`),
            });

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
