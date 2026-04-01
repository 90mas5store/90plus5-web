"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import Loader from "../components/Loader";

import WhatsAppButton from "@/components/ui/WhatsAppButton";

const Footer = dynamic(() => import("../components/Footer"), {
    loading: () => <div className="h-64 bg-black" />,
    ssr: true
});

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const [showSplash, setShowSplash] = useState(false);
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    useEffect(() => {
        // 🚀 Registrar Service Worker
        if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(err => {
                    console.warn('SW registration failed: ', err);
                });
            });
        }

        // 🔴 No mostrar splash en el panel admin
        if (isAdmin) return;

        const hasSeen = sessionStorage.getItem("hasSeenSplash");

        if (!hasSeen) {
            // Llamar setState en callback (no síncronamente en el body del effect)
            const showTimer = setTimeout(() => setShowSplash(true), 0);
            const hideTimer = setTimeout(() => {
                setShowSplash(false);
                sessionStorage.setItem("hasSeenSplash", "true");
            }, 800);
            return () => {
                clearTimeout(showTimer);
                clearTimeout(hideTimer);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin]);

    // En admin: renderizar directamente sin splash, WhatsApp ni Footer
    if (isAdmin) {
        return <>{children}</>;
    }

    return (
        <>
            <Loader show={showSplash} text="Entrando al campo..." />
            <WhatsAppButton />
            {children}
            <Footer />
        </>
    );
}
