import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

describe("Middleware - Rate Limiting", () => {
    const createApiRequest = (path: string, options: { ip?: string; method?: string; origin?: string } = {}) => {
        const headers: Record<string, string> = {};
        if (options.ip) headers["x-forwarded-for"] = options.ip;
        if (options.origin) headers["origin"] = options.origin;

        return new NextRequest(`http://localhost${path}`, {
            method: options.method || "GET",
            headers,
        });
    };

    it("permite solicitudes normales e incluye encabezados X-RateLimit-*", async () => {
        const req = createApiRequest("/api/live-matches", { ip: "192.168.1.100" });
        const res = await middleware(req);

        expect(res.status).toBe(200);
        expect(res.headers.get("X-RateLimit-Limit")).toBe("60");
        expect(res.headers.get("X-RateLimit-Remaining")).toBeDefined();
    });

    it("bloquea solicitudes al exceder el límite y retorna 429 con Retry-After", async () => {
        const ip = "192.168.1.101";

        // Realizamos 5 solicitudes permitidas (límite STRICT es 5)
        for (let i = 0; i < 5; i++) {
            const req = createApiRequest("/api/orders/create", { ip, method: "POST" });
            const res = await middleware(req);
            expect(res.status).toBe(200);
        }

        // La 6ta solicitud debe ser bloqueada
        const blockedReq = createApiRequest("/api/orders/create", { ip, method: "POST" });
        const blockedRes = await middleware(blockedReq);

        expect(blockedRes.status).toBe(429);
        expect(blockedRes.headers.get("X-RateLimit-Limit")).toBe("5");
        expect(blockedRes.headers.get("X-RateLimit-Remaining")).toBe("0");
        expect(blockedRes.headers.get("Retry-After")).toBeDefined();

        const json = await blockedRes.json();
        expect(json.success).toBe(false);
        expect(json.error).toContain("Has realizado demasiadas solicitudes");
    });

    it("permite peticiones OPTIONS (CORS preflight) sin consumir rate limit", async () => {
        const ip = "192.168.1.102";
        const optionsReq = createApiRequest("/api/orders/create", {
            ip,
            method: "OPTIONS",
            origin: "https://90mas5.store"
        });

        const res = await middleware(optionsReq);
        expect(res.status).toBe(204);
        expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://90mas5.store");
    });

    it("no aplica rate limit por IP a los webhooks", async () => {
        const req = createApiRequest("/api/webhooks/resend", { ip: "192.168.1.103", method: "POST" });
        const res = await middleware(req);

        expect(res.status).toBe(200);
        expect(res.headers.get("X-RateLimit-Limit")).toBeNull();
    });

    it("permite orígenes de Vercel (*.vercel.app) en producción", async () => {
        const req = createApiRequest("/api/orders/create", {
            ip: "192.168.1.104",
            method: "OPTIONS",
            origin: "https://90plus5-web.vercel.app",
        });
        const res = await middleware(req);
        expect(res.status).toBe(204);
        expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://90plus5-web.vercel.app");
    });

    it("permite llamadas a /api/live-matches sin importar el origen", async () => {
        const req = createApiRequest("/api/live-matches", {
            ip: "192.168.1.105",
            method: "GET",
            origin: "https://some-client-origin.com",
        });
        const res = await middleware(req);
        expect(res.status).toBe(200);
    });
});
