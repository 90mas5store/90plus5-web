'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { AnalyticsEventType } from '@/lib/analytics/types';

declare global {
    interface Window {
        trackEvent?: (eventType: AnalyticsEventType, metadata?: Record<string, any>) => void;
    }
}

function getSessionId(): string {
    if (typeof window === 'undefined') return '';
    try {
        let sid = sessionStorage.getItem('90plus5_analytics_session');
        if (!sid) {
            sid = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
            sessionStorage.setItem('90plus5_analytics_session', sid);
        }
        return sid;
    } catch {
        return 'anon_' + Date.now();
    }
}

function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    if (width < 640) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
}

export function sendAnalyticsEvent(eventType: AnalyticsEventType, metadata?: Record<string, any>) {
    if (typeof window === 'undefined') return;

    const path = window.location.pathname;
    // Ignorar rutas administrativas
    if (path.startsWith('/admin')) return;

    const sessionId = getSessionId();
    const device = getDeviceType();
    const referrer = document.referrer || null;

    const payload = {
        event_type: eventType,
        path,
        referrer,
        device,
        session_id: sessionId,
        metadata: metadata || {},
    };

    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/track', blob);
    } else {
        fetch('/api/analytics/track', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
        }).catch(() => { /* silent */ });
    }
}

export default function AnalyticsTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const lastTrackedRef = useRef<string>('');

    // Exponer función global para que cualquier componente pueda registrar eventos personalizados
    useEffect(() => {
        window.trackEvent = sendAnalyticsEvent;
        return () => {
            delete window.trackEvent;
        };
    }, []);

    // Registrar vistas de página en cada navegación
    useEffect(() => {
        if (!pathname || pathname.startsWith('/admin')) return;

        const currentUrl = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
        if (lastTrackedRef.current === currentUrl) return;
        lastTrackedRef.current = currentUrl;

        // Extraer UTM params si existen
        const utmSource = searchParams?.get('utm_source');
        const utmMedium = searchParams?.get('utm_medium');
        const utmCampaign = searchParams?.get('utm_campaign');

        const metadata: Record<string, any> = {};
        if (utmSource) metadata.utm_source = utmSource;
        if (utmMedium) metadata.utm_medium = utmMedium;
        if (utmCampaign) metadata.utm_campaign = utmCampaign;

        // Registrar vista de página
        sendAnalyticsEvent('page_view', metadata);
    }, [pathname, searchParams]);

    return null;
}
