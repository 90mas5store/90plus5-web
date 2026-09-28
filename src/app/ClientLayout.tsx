"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import WhatsAppButton from "@/components/ui/WhatsAppButton";

const Footer = dynamic(() => import("../components/Footer"), {
    loading: () => <div className="h-64 bg-black" />,
    ssr: true
});

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    // En admin: renderizar directamente sin WhatsApp ni Footer
    if (isAdmin) {
        return <>{children}</>;
    }

    return (
        <>
            <WhatsAppButton />
            {children}
            <Footer />
        </>
    );
}
