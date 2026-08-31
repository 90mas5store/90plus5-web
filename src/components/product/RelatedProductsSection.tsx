'use client';

import Link from 'next/link';
import ProductImage from '@/components/ProductImage';
import TeamLogo from '@/components/TeamLogo';
import { Product as LibProduct } from '@/lib/types';

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
        <section className="mt-16">
            <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center px-4">
                    También te podría interesar
                </h2>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
                {products.map((item) => (
                    <Link
                        key={item.id}
                        href={`/producto/${item.slug || item.id}`}
                        onClick={onProductClick}
                        className="group relative bg-[#0a0a0a] rounded-[2rem] overflow-hidden border border-white/5 hover:border-primary/40 transition-all duration-700 cursor-pointer aspect-[4/5] shadow-xl block hover:-translate-y-2.5"
                    >
                        <div className="absolute inset-0">
                            <ProductImage
                                src={item.imagen}
                                alt={`${item.equipo} ${item.modelo}`}
                                width={300}
                                height={400}
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                        </div>

                        {item.logoEquipo && (
                            <div className="absolute top-4 left-4 z-20">
                                <TeamLogo src={item.logoEquipo} alt={item.equipo} size={36} />
                            </div>
                        )}

                        <div className="absolute inset-0 z-10 flex flex-col justify-end p-4 sm:p-5">
                            <div className="transform transition-transform duration-500 group-hover:-translate-y-2">
                                <h3 className="text-sm sm:text-base font-black text-white leading-tight truncate">
                                    {item.equipo}
                                </h3>
                                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70 truncate">
                                    {item.modelo}
                                </p>
                                <div className="mt-2 inline-block px-3 py-0.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-full">
                                    <p className="text-primary font-black text-xs sm:text-sm">
                                        L{' '}
                                        {item.precio.toLocaleString('es-HN', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
