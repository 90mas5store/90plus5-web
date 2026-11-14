'use client';

import React from 'react';
import { Search, Flame, Shield, Globe } from 'lucide-react';
import { FilterTab } from './types';

interface TeamsFiltersProps {
    search: string;
    onSearchChange: (val: string) => void;
    activeTab: FilterTab;
    onTabChange: (tab: FilterTab) => void;
}

export default function TeamsFilters({
    search,
    onSearchChange,
    activeTab,
    onTabChange,
}: TeamsFiltersProps) {
    const tabs: { key: FilterTab; label: string; icon?: React.ReactNode; dot?: string }[] = [
        { key: 'all', label: 'Todos' },
        { key: 'clubs', label: 'Clubes', icon: <Shield className="w-3.5 h-3.5" /> },
        { key: 'national', label: 'Selecciones', icon: <Globe className="w-3.5 h-3.5" /> },
        { key: 'live', label: 'Matchday En Vivo', dot: 'bg-emerald-400' },
    ];

    return (
        <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Buscador Spotlight */}
            <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Buscar por equipo, país o liga..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-xl py-2.5 pl-10 pr-3 text-white placeholder:text-neutral-500 focus:border-white/30 focus:ring-1 focus:ring-white/20 outline-none transition-all text-xs sm:text-sm"
                />
            </div>

            {/* Segmented Control Apple */}
            <div className="inline-flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl sm:rounded-2xl border border-white/[0.06] overflow-x-auto shrink-0">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => onTabChange(tab.key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                                isActive
                                    ? 'bg-white text-black shadow-xs'
                                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {tab.dot && <span className={`w-1.5 h-1.5 rounded-full ${tab.dot} ${isActive ? 'animate-pulse' : ''}`} />}
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

