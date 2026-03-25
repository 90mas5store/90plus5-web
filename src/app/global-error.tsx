"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        Sentry.captureException(error);
    }, [error]);

    return (
        <html lang="es">
            <body className="min-h-dvh bg-black flex items-center justify-center">
                <div className="text-center text-white p-8">
                    <h2 className="text-2xl font-bold mb-4">Algo salió mal</h2>
                    <button
                        onClick={reset}
                        className="px-6 py-2 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-colors"
                    >
                        Intentar de nuevo
                    </button>
                </div>
            </body>
        </html>
    );
}
