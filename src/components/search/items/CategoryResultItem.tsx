import React from 'react';
import Image from 'next/image';
import { ArrowRight, Trophy, Sparkles } from 'lucide-react';
import SearchHighlight from '@/components/search/SearchHighlight';
import { SearchResult } from '@/types/search';

interface CategoryResultItemProps {
    item: SearchResult;
    isActive: boolean;
    query: string;
    onSelect: () => void;
}

export default function CategoryResultItem({
    item,
    isActive,
    query,
    onSelect,
}: CategoryResultItemProps) {
    return (
        <button
            type="button"
            data-search-item
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onSelect}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 active:scale-[0.985] text-left group cursor-pointer ${
                isActive
                    ? 'bg-primary/15 ring-1 ring-primary/30'
                    : 'hover:bg-white/5 active:bg-white/[0.08]'
            }`}
        >
            <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    item.type === 'category'
                        ? 'bg-primary/10 border border-primary/20'
                        : 'bg-blue-500/10 border border-blue-500/20'
                }`}
            >
                {item.image ? (
                    <Image
                        src={item.image}
                        alt=""
                        width={20}
                        height={20}
                        className="object-contain brightness-0 invert opacity-85"
                    />
                ) : item.type === 'league' ? (
                    <Trophy className="w-4 h-4 text-amber-400" />
                ) : (
                    <Sparkles className="w-4 h-4 text-primary" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                    <SearchHighlight text={item.title} query={query} />
                </p>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider">
                    {item.subtitle}
                </p>
            </div>
            <ArrowRight
                className={`w-4 h-4 shrink-0 transition-all duration-200 ${
                    isActive
                        ? 'text-primary translate-x-0'
                        : 'text-gray-600 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'
                }`}
            />
        </button>
    );
}
