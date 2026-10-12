import { Redis } from '@upstash/redis';
import type { LiveMatchData } from '@/hooks/useLiveMatches';

export const CACHE_TTL_SECONDS = 30; // 30 segundos — suficiente para tiempo real
export const STALE_CACHE_TTL_SECONDS = 86400; // 24 horas — respaldo ante caídas de ESPN
export const MEMORY_CACHE_TTL_MS = 30_000;

// Caché en memoria para instancias Serverless cálidas
let memoryCache: { data: Record<string, LiveMatchData>; timestamp: number; dateStr?: string } | null = null;

let redis: Redis | null = null;
let redisDisabledUntil = 0;

export function getRedis(): Redis | null {
  if (Date.now() < redisDisabledUntil) return null;
  if (redis) return redis;
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;
    redis = new Redis({ url, token });
    return redis;
  } catch {
    return null;
  }
}

export function isRedisAvailable(): boolean {
  return !!getRedis() && Date.now() >= redisDisabledUntil;
}

export function disableRedisTemporarily(durationMs = 60_000) {
  redisDisabledUntil = Date.now() + durationMs;
}

export function getMemoryCache(todayDateStr: string): Record<string, LiveMatchData> | null {
  if (!memoryCache) return null;

  // Si cambió el día (ej. medianoche en Honduras), descartar memoria anterior
  if (memoryCache.dateStr && memoryCache.dateStr !== todayDateStr) {
    memoryCache = null;
    return null;
  }

  const now = Date.now();
  if (now - memoryCache.timestamp < MEMORY_CACHE_TTL_MS) {
    return memoryCache.data;
  }

  return null;
}

export function getStaleMemoryCache(): Record<string, LiveMatchData> | null {
  if (memoryCache?.data && Object.keys(memoryCache.data).length > 0) {
    return memoryCache.data;
  }
  return null;
}

export function setMemoryCache(data: Record<string, LiveMatchData>, todayDateStr: string) {
  memoryCache = { data, timestamp: Date.now(), dateStr: todayDateStr };
}

export async function getRedisCache(cacheKey: string): Promise<Record<string, LiveMatchData> | null> {
  const client = getRedis();
  if (!client || Date.now() < redisDisabledUntil) return null;

  try {
    const getPromise = client.get<any>(cacheKey);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Redis get timeout')), 1000)
    );
    let cached = await Promise.race([getPromise, timeoutPromise]);
    if (typeof cached === 'string') {
      try {
        cached = JSON.parse(cached);
      } catch {
        cached = null;
      }
    }
    if (cached && typeof cached === 'object' && Object.keys(cached).length > 0) {
      return cached;
    }
  } catch (redisErr: any) {
    disableRedisTemporarily(60_000);
    console.warn('[live-matches] Redis cache read error/timeout, desactivando 60s:', redisErr?.message ?? redisErr);
  }

  return null;
}

export async function getStaleRedisCache(staleCacheKey: string): Promise<Record<string, LiveMatchData> | null> {
  const client = getRedis();
  if (!client || Date.now() < redisDisabledUntil) return null;

  try {
    const stale = await client.get<string | Record<string, LiveMatchData>>(staleCacheKey);
    if (stale) {
      const staleData = typeof stale === 'string' ? JSON.parse(stale) : stale;
      if (staleData && Object.keys(staleData).length > 0) {
        return staleData;
      }
    }
  } catch (staleErr: any) {
    console.warn('[live-matches] Error al leer stale cache de Redis:', staleErr?.message ?? staleErr);
  }

  return null;
}

export function saveToDistributedCache(
  cacheKey: string,
  staleCacheKey: string,
  data: Record<string, LiveMatchData>
) {
  const client = getRedis();
  if (!client || Date.now() < redisDisabledUntil) return;

  Promise.race([
    Promise.all([
      client.set(cacheKey, JSON.stringify(data), { ex: CACHE_TTL_SECONDS }),
      client.set(staleCacheKey, JSON.stringify(data), { ex: STALE_CACHE_TTL_SECONDS }),
    ]),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Redis set timeout')), 1500)),
  ]).catch(err => {
    disableRedisTemporarily(60_000);
    console.warn('[live-matches] Redis cache write error/timeout, desactivando 60s:', err?.message ?? err);
  });
}
