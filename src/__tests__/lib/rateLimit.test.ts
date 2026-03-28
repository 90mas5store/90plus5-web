import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

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
