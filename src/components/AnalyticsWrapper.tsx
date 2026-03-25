"use client";

import dynamic from 'next/dynamic';

// ssr: false evita que Partytown transforme type="text/partytown" → "text/partytown-x"
// en el servidor, lo que causaba un error de hidratación en el cliente.
const Analytics = dynamic(() => import('./Analytics'), { ssr: false });

export default function AnalyticsWrapper() {
    return <Analytics />;
}
