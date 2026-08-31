'use client';

import { ArrowDown } from 'lucide-react';
import ProductCard from '@/components/ui/ProductCard';
import MainButton from '@/components/ui/MainButton';
import { Product } from '@/lib/types';
import type { LiveMatchData } from '@/hooks/useLiveMatches';

interface ProductGridSectionProps {
    loading: boolean;
    loadingMore: boolean;
    productos: Product[];
    totalProducts: number;
    topSellerIds: string[];
    liveMatches: Record<string, LiveMatchData | null>;
    onPersonalizar: () => void;
    onClearFilters: () => void;
    onLoadMore: () => void;
}

export default function ProductGridSection({
    loading,
    loadingMore,
    productos,
    totalProducts,
    topSellerIds,
    liveMatches,
    onPersonalizar,
    onClearFilters,
    onLoadMore,
}: ProductGridSectionProps) {
    return (
        <section className="max-w-7xl mx-auto px-4 mt-8">
            {/* Loading Skeleton Inicial */}
            {loading && productos.length === 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
                    {[...Array(24)].map((_, i) => (
                        <div key={i} className="aspect-[3/4] bg-white/5 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : productos.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-400 text-lg mb-4">No encontramos productos con esos filtros.</p>
                    <button onClick={onClearFilters} className="text-primary hover:underline cursor-pointer font-bold">
                        Borrar filtros
                    </button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
                        {productos.map((item, i) => (
                            <div key={item.id} className="h-full">
                                <ProductCard
                                    item={item}
                                    priority={i < 4}
                                    onPress={onPersonalizar}
                                    topSeller={topSellerIds.includes(item.id)}
                                    liveMatch={liveMatches[item.team_id] ?? null}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Botón Cargar Más */}
                    {productos.length < totalProducts && (
                        <div className="flex justify-center mt-12 pb-8">
                            <MainButton
                                onClick={onLoadMore}
                                disabled={loadingMore}
                                isLoading={loadingMore}
                                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold uppercase tracking-widest text-sm backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer"
                            >
                                <span>{loadingMore ? 'Cargando...' : 'Cargar más camisetas'}</span>
                                {!loadingMore && <ArrowDown className="w-4 h-4" />}
                            </MainButton>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
