import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Finalizar Pedido',
    robots: { index: false, follow: false },
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
