'use client';

import { useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import MainButton from '@/components/ui/MainButton';

export default function EmptyCartState() {
    const router = useRouter();

    return (
        <main className="min-h-dvh flex flex-col items-center justify-center bg-[#0a0a0a] text-white px-6">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/10 mb-6">
                <ShoppingBag className="w-12 h-12 text-gray-600" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Tu carrito está vacío</h2>
            <p className="text-gray-500 mb-8 text-center max-w-xs">Parece que aún no has añadido nada a tu pedido.</p>
            <MainButton onClick={() => router.push('/catalogo')} className="px-10 py-4 font-black tracking-widest">
                VOLVER AL CATÁLOGO
            </MainButton>
        </main>
    );
}
