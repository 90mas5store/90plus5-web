import React from 'react';
import ProductImage from '@/components/ProductImage';
import SearchHighlight from '@/components/search/SearchHighlight';
import { SearchResult } from '@/types/search';

interface ProductResultItemProps {
    item: SearchResult;
    isActive: boolean;
    query: string;
    onSelect: () => void;
}

export default function ProductResultItem({
    item,
    isActive,
    query,
    onSelect,
}: ProductResultItemProps) {
    return (
        <button
            type="button"
            data-search-item
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onSelect}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group cursor-pointer ${
                isActive
                    ? 'bg-primary/15 ring-1 ring-primary/30 shadow-[0_4px_16px_rgba(229,9,20,0.1)]'
                    : 'hover:bg-white/5'
            }`}
        >
            <div className="w-11 h-14 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-neutral-900 flex items-center justify-center p-0.5">
                <ProductImage
                    src={item.image || ''}
                    alt={item.title}
                    width={44}
                    height={56}
                    className="w-full h-full object-cover rounded-md group-hover:scale-105 transition-transform duration-300"
                />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white truncate">
                        <SearchHighlight text={item.title} query={query} />
                    </p>

                    {/* ⚡ Matchday Live Badge */}
                    {item.isLive && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-primary text-white animate-pulse shadow-[0_0_8px_rgba(229,9,20,0.6)]">
                            ⚡ EN VIVO {item.liveScore} {item.liveMinute}
                        </span>
                    )}
                    {item.isUpcoming && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-600/30 text-blue-300 border border-blue-500/30">
                            📅 JUEGA HOY
                        </span>
                    )}
                </div>
                <p className="text-[11px] text-gray-400 truncate uppercase tracking-wider mt-0.5">
                    <SearchHighlight
                        text={item.subtitle || ''}
                        query={query}
                    />
                </p>
            </div>
            {item.price != null && (
                <div className="shrink-0 text-right">
                    <span className="text-sm font-black text-white group-hover:text-primary transition-colors">
                        L {item.price.toLocaleString('es-HN')}
                    </span>
                    <span className="block text-[10px] text-emerald-400 font-semibold">
                        Disponible
                    </span>
                </div>
            )}
        </button>
    );
}
