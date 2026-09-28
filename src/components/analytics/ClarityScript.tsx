'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

export default function ClarityScript() {
    const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;
    const [shouldLoad, setShouldLoad] = useState(false);

    useEffect(() => {
        if (!clarityId) return;

        // Disparar carga en la primera interacción o tras timeout no intrusivo
        const triggerLoad = () => {
            setShouldLoad(true);
            cleanup();
        };

        const events = ['scroll', 'touchstart', 'mousedown', 'keydown'];
        const cleanup = () => {
            events.forEach(evt => window.removeEventListener(evt, triggerLoad));
            clearTimeout(timerId);
        };

        events.forEach(evt => window.addEventListener(evt, triggerLoad, { passive: true, once: true }));

        const timerId = setTimeout(() => {
            if ('requestIdleCallback' in window) {
                window.requestIdleCallback(triggerLoad, { timeout: 2000 });
            } else {
                triggerLoad();
            }
        }, 4000);

        return cleanup;
    }, [clarityId]);

    if (!clarityId || !shouldLoad) return null;

    return (
        <Script
            id="microsoft-clarity"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
                __html: `
                    (function(c,l,a,r,i,t,y){
                        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                    })(window, document, "clarity", "script", "${clarityId}");
                `,
            }}
        />
    );
}
