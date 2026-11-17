import { Metadata } from 'next'
import { SITE_URL } from '@/lib/config/site'

export const metadata: Metadata = {
    title: {
        absolute: 'Rastrear Pedido | 90+5 Store Honduras',
    },
    description: 'Consulta el estado de tu pedido en 90+5 Store. Ingresa tu número de pedido para ver el seguimiento en tiempo real y guía de envío en Honduras.',
    alternates: {
        canonical: `${SITE_URL}/rastreo`,
    },
    robots: { index: true, follow: true },
}

export default function RastreoLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
