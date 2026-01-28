'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { useEffect } from 'react';

declare global {
    interface Window {
        gtag: (command: string, targetId: string, config?: any) => void;
        fbq: (command: string, eventName: string, params?: any) => void;
    }
}

export default function Analytics() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (pathname && window.gtag) {
            window.gtag('config', process.env.NEXT_PUBLIC_GA_ID!, {
                page_path: pathname,
            });
        }
        if (pathname && window.fbq) {
            window.fbq('track', 'PageView');
        }
    }, [pathname, searchParams]);

    return (
        <>
            {/* --- GOOGLE ANALYTICS 4 --- */}
            {process.env.NEXT_PUBLIC_GA_ID && (
                <>
                    <Script
                        strategy="lazyOnload"
                        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
                    />
                    <Script
                        id="google-analytics"
                        strategy="lazyOnload"
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

            {/* --- FACEBOOK PIXEL --- */}
            {process.env.NEXT_PUBLIC_FB_PIXEL_ID && (
                <Script
                    id="facebook-pixel"
                    strategy="lazyOnload"
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
