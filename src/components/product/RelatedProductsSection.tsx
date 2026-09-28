'use client';

import ProductCard from '@/components/ui/ProductCard';
import { Product as LibProduct } from '@/lib/types';
import { Sparkles } from 'lucide-react';

interface RelatedProductsSectionProps {
    products: LibProduct[];
    onProductClick: () => void;
}

export default function RelatedProductsSection({
    products,
    onProductClick,
}: RelatedProductsSectionProps) {
    if (products.length === 0) return null;

    return (
        <section className="mt-16 md:mt-24 pt-8 border-t border-white/5 relative">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center mb-8 md:mb-10 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/10 text-white/60 text-[11px] font-bold uppercase tracking-wider mb-2.5">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Colección Relacionada</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
                    También te podría interesar
                </h2>
                <p className="text-white/50 text-xs sm:text-sm font-medium mt-1 max-w-md mx-auto">
                    Prendas oficiales y alternativas seleccionadas para completar tu colección
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 relative z-10">
                {products.map((item) => (
                    <div key={item.id} className="h-full">
                        <ProductCard
                            item={item}
                            priority={false}
                            enableGlow={true}
                            onPress={() => onProductClick()}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
}

