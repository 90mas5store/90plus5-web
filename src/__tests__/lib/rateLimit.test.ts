import { describe, it, expect } from "vitest";
import {
    checkRateLimit,
    getClientIp,
    getRateLimitTierForPath,
    getRateLimitHeaders,
    RATE_LIMIT_TIERS
} from "@/lib/rateLimit";

// Note: checkRateLimit is async. In test env, no UPSTASH vars are set,
// so it falls back to the in-memory implementation.

describe("checkRateLimit", () => {
    it("permite la primera solicitud", async () => {
        const result = await checkRateLimit("test-ip-1", 5, 60_000);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4);
    });

    it("acumula solicitudes dentro de la ventana", async () => {
        const key = "test-ip-2";
        await checkRateLimit(key, 3, 60_000);
        await checkRateLimit(key, 3, 60_000);
        const third = await checkRateLimit(key, 3, 60_000);
        expect(third.allowed).toBe(true);
        expect(third.remaining).toBe(0);
    });

    it("bloquea al superar el límite", async () => {
        const key = "test-ip-3";
        await checkRateLimit(key, 2, 60_000);
        await checkRateLimit(key, 2, 60_000);
        const blocked = await checkRateLimit(key, 2, 60_000);
        expect(blocked.allowed).toBe(false);
        expect(blocked.remaining).toBe(0);
        expect(blocked.retryAfterMs).toBeGreaterThan(0);
    });

    it("keys distintas no se interfieren", async () => {
        await checkRateLimit("ip-a", 1, 60_000);
        const blocked = await checkRateLimit("ip-a", 1, 60_000);
        const fresh = await checkRateLimit("ip-b", 1, 60_000);
        expect(blocked.allowed).toBe(false);
        expect(fresh.allowed).toBe(true);
    });

    it("resetea la ventana después del tiempo definido", async () => {
        const key = "test-ip-reset";
        await checkRateLimit(key, 1, 10); // ventana de 10ms
        await checkRateLimit(key, 1, 10); // bloquear
        await new Promise(r => setTimeout(r, 20));  // esperar reset
        const afterReset = await checkRateLimit(key, 1, 10);
        expect(afterReset.allowed).toBe(true);
    });
});

describe("getClientIp", () => {
    const makeRequest = (headers: Record<string, string>) =>
        new Request("http://localhost/api/test", { headers });

    it("extrae IP de x-forwarded-for", () => {
        const req = makeRequest({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" });
        expect(getClientIp(req)).toBe("1.2.3.4");
    });

    it("extrae IP de x-real-ip si no hay x-forwarded-for", () => {
        const req = makeRequest({ "x-real-ip": "5.6.7.8" });
        expect(getClientIp(req)).toBe("5.6.7.8");
    });

    it("devuelve 'unknown' si no hay headers de IP", () => {
        const req = makeRequest({});
        expect(getClientIp(req)).toBe("unknown");
    });
});

describe("getRateLimitTierForPath", () => {
    it("retorna null para webhooks", () => {
        expect(getRateLimitTierForPath("/api/webhooks/resend")).toBeNull();
    });

    it("retorna tier STRICT para endpoints sensibles", () => {
        expect(getRateLimitTierForPath("/api/orders/create")).toEqual({
            tier: "STRICT",
            config: RATE_LIMIT_TIERS.STRICT,
        });
        expect(getRateLimitTierForPath("/api/payments/proof")).toEqual({
            tier: "STRICT",
            config: RATE_LIMIT_TIERS.STRICT,
        });
        expect(getRateLimitTierForPath("/api/discount/validate")).toEqual({
            tier: "STRICT",
            config: RATE_LIMIT_TIERS.STRICT,
        });
    });

    it("retorna tier ADMIN para rutas de administración", () => {
        expect(getRateLimitTierForPath("/api/admin/reports/orders")).toEqual({
            tier: "ADMIN",
            config: RATE_LIMIT_TIERS.ADMIN,
        });
    });

    it("retorna tier GENERAL por defecto para otras rutas de la API", () => {
        expect(getRateLimitTierForPath("/api/live-matches")).toEqual({
            tier: "GENERAL",
            config: RATE_LIMIT_TIERS.GENERAL,
        });
    });
});

describe("getRateLimitHeaders", () => {
    it("genera headers correctos cuando la solicitud es permitida", () => {
        const result = { allowed: true, remaining: 4, retryAfterMs: 0 };
        const headers = getRateLimitHeaders(result, 5);

        expect(headers["X-RateLimit-Limit"]).toBe("5");
        expect(headers["X-RateLimit-Remaining"]).toBe("4");
        expect(headers["Retry-After"]).toBeUndefined();
    });

    it("incluye Retry-After cuando la solicitud es bloqueada", () => {
        const result = { allowed: false, remaining: 0, retryAfterMs: 5000 };
        const headers = getRateLimitHeaders(result, 5);

        expect(headers["X-RateLimit-Limit"]).toBe("5");
        expect(headers["X-RateLimit-Remaining"]).toBe("0");
        expect(headers["Retry-After"]).toBe("5");
        expect(headers["X-RateLimit-Reset"]).toBeDefined();
    });
});

