'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export function getConsentLevel(): 'all' | 'essential' | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem('90plus5_cookie_consent') as 'all' | 'essential' | null;
}

export default function CookieConsent() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const consent = getConsentLevel();
        if (!consent) {
            setShow(true);
        }
    }, []);

    const handleAccept = (level: 'all' | 'essential') => {
        window.localStorage.setItem('90plus5_cookie_consent', level);
        window.dispatchEvent(new Event('cookie_consent_changed'));
        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-0 left-0 w-full z-[9999] p-4 animate-slide-up">
            <div className="max-w-4xl mx-auto bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 md:p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-300 flex-1">
                    <p>
                        Utilizamos cookies para mejorar tu experiencia, analizar el tráfico y personalizar contenido. 
                        Lee nuestra <Link href="/legal/privacidad" className="text-[#E50914] hover:underline transition-colors">política de privacidad</Link> para más información.
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={() => handleAccept('essential')}
                        className="flex-1 md:flex-none px-4 py-2 text-sm font-medium text-white border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        Solo necesarias
                    </button>
                    <button
                        onClick={() => handleAccept('all')}
                        className="flex-1 md:flex-none px-4 py-2 text-sm font-medium text-white bg-[#E50914] rounded-lg hover:bg-[#E50914]/90 transition-colors"
                    >
                        Aceptar todas
                    </button>
                </div>
            </div>
            <style jsx>{`
                @keyframes slideUp {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .animate-slide-up {
                    animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
}
