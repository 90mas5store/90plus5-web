'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
    isAnalyticsExcluded,
    setAnalyticsExcluded,
    ANALYTICS_EXCLUSION_STORAGE_KEY,
} from '@/lib/analytics/exclusion';

export default function AnalyticsExclusionHandler() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // 1. Si el usuario visita cualquier ruta de administración (/admin), auto-excluir este dispositivo
        if (pathname?.startsWith('/admin')) {
            const alreadyExcluded = localStorage.getItem(ANALYTICS_EXCLUSION_STORAGE_KEY) === 'true';
            if (!alreadyExcluded) {
                setAnalyticsExcluded(true);
            }
        }

        // 2. Comprobar si hay un parámetro secreto en la URL (ej: ?admin_mode=true o ?skip_analytics=true)
        const adminModeParam = searchParams?.get('admin_mode') || searchParams?.get('skip_analytics');

        if (adminModeParam !== null && adminModeParam !== undefined) {
            const shouldExclude = adminModeParam === 'true' || adminModeParam === '1';

            if (shouldExclude) {
                setAnalyticsExcluded(true);
                toast.success('🛡️ Modo Admin: Este dispositivo ha sido excluido de las analíticas.', {
                    id: 'analytics-exclusion-toggle',
                    duration: 5000,
                    style: {
                        background: '#0B0D11',
                        color: '#fff',
                        border: '1px solid rgba(229, 9, 20, 0.4)',
                    },
                });
            } else {
                setAnalyticsExcluded(false);
                toast.success('📊 Analíticas reactivadas para este dispositivo.', {
                    id: 'analytics-exclusion-toggle',
                    duration: 5000,
                    style: {
                        background: '#0B0D11',
                        color: '#fff',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                    },
                });
            }

            // Limpiar el parámetro de la URL sin recargar la página para mantener la URL limpia
            try {
                const url = new URL(window.location.href);
                url.searchParams.delete('admin_mode');
                url.searchParams.delete('skip_analytics');
                window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
            } catch {
                // Silencioso
            }
        }
    }, [pathname, searchParams]);

    return null;
}
