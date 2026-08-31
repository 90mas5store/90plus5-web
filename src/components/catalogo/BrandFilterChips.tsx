'use client';

import Image from 'next/image';
import { Brand } from '@/lib/types';

interface BrandFilterChipsProps {
    brands: Brand[];
    selectedBrandId: string | null;
    onSelectBrand: (brandId: string | null) => void;
}

export default function BrandFilterChips({
    brands,
    selectedBrandId,
    onSelectBrand,
}: BrandFilterChipsProps) {
    if (brands.length < 2) return null;

    return (
        <div className="px-4 pb-5 max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Marcas
                </span>
                <div className="h-px flex-1 bg-white/5" />
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {brands.map((brand) => {
                    const isSelected = selectedBrandId === brand.id;
                    return (
                        <button
                            key={brand.id}
                            onClick={() => {
                                onSelectBrand(isSelected ? null : brand.id);
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                                isSelected
                                    ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                                    : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            {brand.logo_url && (
                                <div className="relative w-5 h-5 shrink-0">
                                    <Image
                                        src={brand.logo_url}
                                        alt={brand.name}
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            )}
                            {brand.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
