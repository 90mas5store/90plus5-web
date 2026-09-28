'use client';

import dynamic from 'next/dynamic';
import { Category, Brand } from '@/lib/types';

const CarruselDeCategoria = dynamic(() => import('@/components/catalogo/CarruselDeCategoria'), {
    ssr: false,
    loading: () => <div className="h-40 animate-pulse bg-white/5 rounded-3xl" />,
});

interface CategoryCarouselSectionProps {
    currentCarrusel: {
        type: 'liga' | 'brand';
        title: string | null;
        items: Array<{ nombre: string; imagen: string; id?: string; slug?: string }>;
    } | null;
    ligaSeleccionada: string | null;
    marcaSeleccionada: string | null;
    categoryBrands: Brand[];
    onSelectLeague: (leagueName: string) => void;
    onSelectBrand: (brandName: string) => void;
}

export default function CategoryCarouselSection({
    currentCarrusel,
    ligaSeleccionada,
    marcaSeleccionada,
    categoryBrands,
    onSelectLeague,
    onSelectBrand,
}: CategoryCarouselSectionProps) {
    if (!currentCarrusel || currentCarrusel.items.length === 0) return null;

    const selectedValue =
        currentCarrusel.type === 'brand'
            ? categoryBrands.find((b) => b.id === marcaSeleccionada)?.name ?? null
            : ligaSeleccionada;

    return (
        <CarruselDeCategoria
            title={currentCarrusel.title}
            items={currentCarrusel.items}
            selected={selectedValue}
            onSelect={(nombre: string) => {
                if (currentCarrusel.type === 'brand') {
                    onSelectBrand(nombre);
                } else {
                    onSelectLeague(nombre);
                }
            }}
        />
    );
}
