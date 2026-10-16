import React from 'react';
import { ArrowRight, User } from 'lucide-react';
import SearchHighlight from '@/components/search/SearchHighlight';
import { SearchResult } from '@/types/search';

interface PlayerResultItemProps {
    item: SearchResult;
    isActive: boolean;
    query: string;
    onSelect: () => void;
}

export default function PlayerResultItem({
    item,
    isActive,
    query,
    onSelect,
}: PlayerResultItemProps) {
    return (
        <button
            type="button"
            data-search-item
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onSelect}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group cursor-pointer ${
                isActive
                    ? 'bg-purple-600/15 ring-1 ring-purple-500/40 shadow-[0_4px_16px_rgba(168,85,247,0.15)]'
                    : 'hover:bg-white/5'
            }`}
        >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                {item.playerNumber ? (
                    <span className="text-base font-black text-purple-400">
                        {item.playerNumber}
                    </span>
                ) : (
                    <User className="w-5 h-5 text-purple-400" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white truncate">
                        <SearchHighlight text={item.title} query={query} />
                    </p>
                    {item.teamName && (
                        <span className="text-[10px] font-semibold text-gray-400 truncate">
                            · {item.teamName}
                        </span>
                    )}
                </div>
                <p className="text-[11px] text-purple-400/80 font-medium mt-0.5">
                    {item.productCount != null
                        ? `Disponible en ${item.productCount} ${item.productCount === 1 ? 'camisa' : 'camisas'}`
                        : 'Disponible en personalización'}
                </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-purple-400 shrink-0">
                <span className="hidden sm:inline">Ver camisas</span>
                <ArrowRight className="w-4 h-4" />
            </div>
        </button>
    );
}
