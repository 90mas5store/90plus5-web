'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

declare global {
    interface Window {
        gtag: (command: string, targetId: string, config?: Record<string, unknown>) => void;
        fbq: (command: string, eventName: string, params?: Record<string, unknown>) => void;
    }
}

export default function Analytics() {
    const pathname = usePathname();

    useEffect(() => {
        if (pathname && window.gtag) {
            window.gtag('config', process.env.NEXT_PUBLIC_GA_ID!, {
                page_path: pathname,
            });
        }
        if (pathname && window.fbq) {
            window.fbq('track', 'PageView');
        }
    }, [pathname]);

    return (
        <>
            {/* --- GOOGLE ANALYTICS 4 (Partytown) --- */}
            {process.env.NEXT_PUBLIC_GA_ID && (
                <>
                    <script
                        async
                        type="text/partytown"
                        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
                    />
                    <script
                        type="text/partytown"
                        id="google-analytics"
                        dangerouslySetInnerHTML={{
                            __html: `
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                                page_path: window.location.pathname,
                            });
                            `,
                        }}
                    />
                </>
            )}

            {/* --- FACEBOOK PIXEL (Partytown) --- */}
            {process.env.NEXT_PUBLIC_FB_PIXEL_ID && (
                <script
                    type="text/partytown"
                    id="facebook-pixel"
                    dangerouslySetInnerHTML={{
                        __html: `
                        !function(f,b,e,v,n,t,s)
                        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                        n.queue=[];t=b.createElement(e);t.async=!0;
                        t.src=v;s=b.getElementsByTagName(e)[0];
                        s.parentNode.insertBefore(t,s)}(window, document,'script',
                        'https://connect.facebook.net/en_US/fbevents.js');
                        fbq('init', '${process.env.NEXT_PUBLIC_FB_PIXEL_ID}');
                        fbq('track', 'PageView');
                        `,
                    }}
                />
            )}
        </>
    );
}
