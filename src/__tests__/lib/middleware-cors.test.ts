import { describe, it, expect } from "vitest";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";

describe("CORS Middleware", () => {
    const createReq = (url: string, method: string = "GET", headers: Record<string, string> = {}) => {
        return new NextRequest(new URL(url, "http://localhost:3000"), {
            method,
            headers: new Headers(headers),
        });
    };

    it("permite peticiones sin el header Origin (peticiones directas o same-origin)", async () => {
        const req = createReq("/api/discount/validate", "POST");
        const res = await middleware(req);

        expect(res.status).toBe(200);
    });

    it("permite peticiones desde el origen oficial (https://90mas5.store)", async () => {
        const req = createReq("/api/discount/validate", "POST", {
            origin: "https://90mas5.store",
        });
        const res = await middleware(req);

        expect(res.status).toBe(200);
        expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://90mas5.store");
        expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
    });

    it("permite peticiones desde la versión con www (https://www.90mas5.store)", async () => {
        const req = createReq("/api/discount/validate", "POST", {
            origin: "https://www.90mas5.store",
        });
        const res = await middleware(req);

        expect(res.status).toBe(200);
        expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://www.90mas5.store");
    });

    it("permite peticiones desde localhost en entornos de desarrollo/pruebas", async () => {
        const req = createReq("/api/discount/validate", "POST", {
            origin: "http://localhost:3000",
        });
        const res = await middleware(req);

        expect(res.status).toBe(200);
        expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
    });

    it("rechaza (403) peticiones de orígenes no autorizados", async () => {
        const req = createReq("/api/discount/validate", "POST", {
            origin: "https://malicious-website.com",
        });
        const res = await middleware(req);

        expect(res.status).toBe(403);
        const body = await res.json();
        expect(body.error).toContain("CORS policy");
    });

    it("responde 204 con cabeceras CORS en peticiones preflight (OPTIONS) de un origen autorizado", async () => {
        const req = createReq("/api/orders/create", "OPTIONS", {
            origin: "https://90mas5.store",
        });
        const res = await middleware(req);

        expect(res.status).toBe(204);
        expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://90mas5.store");
        expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST");
        expect(res.headers.get("Access-Control-Allow-Headers")).toContain("Content-Type");
    });

    it("rechaza (403) peticiones preflight (OPTIONS) de un origen no autorizado", async () => {
        const req = createReq("/api/orders/create", "OPTIONS", {
            origin: "https://evil-hacker.com",
        });
        const res = await middleware(req);

        expect(res.status).toBe(403);
    });

    it("exime a las rutas de webhook (/api/webhooks/*) de las restricciones de origen", async () => {
        const req = createReq("/api/webhooks/resend", "POST", {
            origin: "https://external-webhook-provider.com",
        });
        const res = await middleware(req);

        expect(res.status).toBe(200);
    });
});
