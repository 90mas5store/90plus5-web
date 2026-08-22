import { describe, it, expect } from "vitest";
import nextConfig from "../../../next.config.mjs";

describe("Content Security Policy (CSP)", () => {
    it("debe incluir la cabecera Content-Security-Policy con directivas estrictas", async () => {
        const headerConfigs = await nextConfig.headers();
        const globalHeaders = headerConfigs.find((cfg: { source: string }) => cfg.source === "/(.*)");

        expect(globalHeaders).toBeDefined();

        const cspHeader = globalHeaders?.headers.find(
            (h: { key: string }) => h.key === "Content-Security-Policy"
        );

        expect(cspHeader).toBeDefined();
        const cspValue = cspHeader?.value || "";

        // Default restrictivo
        expect(cspValue).toContain("default-src 'self'");

        // Control de scripts: restrictivo a orígenes específicos
        expect(cspValue).toContain("script-src 'self'");
        expect(cspValue).toContain("https://connect.facebook.net");
        expect(cspValue).toContain("https://www.google-analytics.com");
        expect(cspValue).toContain("https://www.googletagmanager.com");

        // Elementos script específicos
        expect(cspValue).toContain("script-src-elem 'self'");

        // Bloqueo de atributos inline (ej. onclick="...")
        expect(cspValue).toContain("script-src-attr 'none'");

        // Bloqueo de plugins (Flash, Java Applets, etc.)
        expect(cspValue).toContain("object-src 'none'");

        // Seguridad para web workers (Partytown)
        expect(cspValue).toContain("worker-src 'self' blob:");

        // Restricciones de navegación y marcos
        expect(cspValue).toContain("base-uri 'self'");
        expect(cspValue).toContain("form-action 'self'");
        expect(cspValue).toContain("frame-ancestors 'none'");

        // Forzar HTTPS para peticiones de recursos
        expect(cspValue).toContain("upgrade-insecure-requests");
    });
});
