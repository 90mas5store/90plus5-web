'use client';

import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from '@/lib/motion';
import { Category, Brand } from '@/lib/types';
import { ExtendedLeague } from '@/hooks/useCatalogMetadata';

const CarruselDeCategoria = dynamic(() => import('@/components/catalogo/CarruselDeCategoria'), {
    ssr: false,
    loading: () => <div className="h-40 animate-pulse bg-white/5 rounded-3xl" />,
});

interface CategoryCarouselSectionProps {
    currentCarrusel: {
        type: 'liga' | 'brand';
        title: string | null;
        items: Array<{ nombre: string; imagen: string; id?: string }>;
    } | null;
    selectedCategoryObj: Category | null | undefined;
    ligaSeleccionada: string | null;
    marcaSeleccionada: string | null;
    categoryBrands: Brand[];
    onSelectLeague: (leagueName: string) => void;
    onSelectBrand: (brandName: string) => void;
}

export default function CategoryCarouselSection({
    currentCarrusel,
    selectedCategoryObj,
    ligaSeleccionada,
    marcaSeleccionada,
    categoryBrands,
    onSelectLeague,
    onSelectBrand,
}: CategoryCarouselSectionProps) {
    if (!currentCarrusel || currentCarrusel.items.length === 0) return null;

    return (
        <>
            <CarruselDeCategoria
                title={currentCarrusel.title}
                items={currentCarrusel.items}
                selected={
                    currentCarrusel.type === 'brand'
                        ? categoryBrands.find((b) => b.id === marcaSeleccionada)?.name ?? null
                        : ligaSeleccionada
                }
                onSelect={(nombre: string) => {
                    if (currentCarrusel.type === 'brand') {
                        onSelectBrand(nombre);
                    } else {
                        onSelectLeague(nombre);
                    }
                }}
            />

            {/* TÍTULO CATEGORÍA EN MÓVIL */}
            <AnimatePresence mode="wait">
                {selectedCategoryObj && (
                    <motion.div
                        key={selectedCategoryObj.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="md:hidden flex flex-col items-center justify-center pb-6 -mt-1 relative z-10"
                    >
                        <motion.h2 className="text-2xl font-black text-primary drop-shadow-[0_0_20px_rgba(229,9,20,0.6)] uppercase tracking-widest text-center">
                            {selectedCategoryObj.nombre}
                        </motion.h2>
                        <div className="h-1 w-10 bg-gradient-to-r from-transparent via-primary to-transparent mt-2 rounded-full shadow-[0_0_10px_rgba(229,9,20,0.8)]" />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
