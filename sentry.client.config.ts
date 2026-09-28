import * as Sentry from "@sentry/nextjs";

let hasConsentForReplay = false;
try {
    if (typeof window !== "undefined") {
        hasConsentForReplay = window.localStorage.getItem("90plus5_cookie_consent") === "all";
    }
} catch (error) {
    // Ignore localStorage access errors
}

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Capturar el 5% de las transacciones de performance en producción
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,

    // No inicializar replay síncronamente en el bundle crítico inicial
    replaysOnErrorSampleRate: hasConsentForReplay ? 1.0 : 0,
    replaysSessionSampleRate: hasConsentForReplay ? 0.05 : 0,

    integrations: [],

    // No activar en desarrollo a menos que tengas DSN de dev
    enabled: process.env.NODE_ENV === "production",
});

// 🚀 Carga asíncrona y diferida de Replay para no bloquear el hilo principal (TBT)
if (hasConsentForReplay && typeof window !== "undefined" && process.env.NODE_ENV === "production") {
    const loadReplay = () => {
        import("@sentry/nextjs").then((sentry) => {
            const client = sentry.getClient();
            if (client && sentry.replayIntegration) {
                client.addIntegration(sentry.replayIntegration({
                    maskAllText: true,
                    blockAllMedia: false,
                }));
            }
        }).catch(() => {});
    };

    if ("requestIdleCallback" in window) {
        window.requestIdleCallback(loadReplay, { timeout: 4000 });
    } else {
        setTimeout(loadReplay, 3000);
    }
}
