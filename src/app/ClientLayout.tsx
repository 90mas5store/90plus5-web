"use client";

import { useState, useEffect } from "react";
import Loader from "../components/Loader";

import WhatsAppButton from "@/components/ui/WhatsAppButton";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const [showSplash, setShowSplash] = useState(false);

    useEffect(() => {
        // 🚀 Registrar Service Worker
        if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(err => {
                    console.warn('SW registration failed: ', err);
                });
            });
        }

        const hasSeen = sessionStorage.getItem("hasSeenSplash");

        if (!hasSeen) {
            setShowSplash(true);
            const timer = setTimeout(() => {
                setShowSplash(false);
                sessionStorage.setItem("hasSeenSplash", "true");
            }, 1800);
            return () => clearTimeout(timer);
        }
    }, []);

    return (
        <>
            <Loader show={showSplash} text="Entrando al campo..." />
            {!showSplash && (
                <>
                    <WhatsAppButton />
                    {children}
                </>
            )}
        </>
    );
}
