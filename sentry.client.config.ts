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

    // Capturar el 10% de las transacciones de performance en producción
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Capturar el 100% de sesiones con error (para replay) si hay consentimiento, de lo contrario 0
    replaysOnErrorSampleRate: hasConsentForReplay ? 1.0 : 0,
    replaysSessionSampleRate: hasConsentForReplay ? 0.05 : 0,

    integrations: [
        Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: false,
        }),
    ],

    // No activar en desarrollo a menos que tengas DSN de dev
    enabled: process.env.NODE_ENV === "production",
});
