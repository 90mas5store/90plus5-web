import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Rastrear Pedido',
    description: 'Consulta el estado de tu pedido en 90+5 Store. Ingresa tu número de pedido para ver el seguimiento en tiempo real.',
    robots: { index: false, follow: false },
}

export default function RastreoLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
