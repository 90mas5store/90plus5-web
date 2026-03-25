import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Capturar el 10% de las transacciones de performance en producción
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Capturar el 100% de sesiones con error (para replay)
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.05,

    integrations: [
        Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: false,
        }),
    ],

    // No activar en desarrollo a menos que tengas DSN de dev
    enabled: process.env.NODE_ENV === "production",
});
