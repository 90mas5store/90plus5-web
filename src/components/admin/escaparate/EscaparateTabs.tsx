'use client';

import React from 'react';
import { LayoutTemplate, Sparkles, Megaphone, Radio, Layers } from 'lucide-react';
import { EscaparateTab, EscaparateTabItem } from './types';

export const ESCAPARATE_TABS: EscaparateTabItem[] = [
    {
        key: 'banners',
        label: 'Banners Hero',
        description: 'Carrusel principal de la portada',
        icon: LayoutTemplate,
    },
    {
        key: 'special',
        label: 'Banners Especiales',
        description: 'Colecciones y colaboraciones',
        icon: Sparkles,
    },
    {
        key: 'marquesina',
        label: 'Marquesina de Avisos',
        description: 'Texto corredizo superior de envíos y cortes',
        icon: Megaphone,
    },
    {
        key: 'matchday',
        label: 'Fútbol & Matchday',
        description: 'Marcadores en vivo y torneos ESPN',
        icon: Radio,
        liveDot: true,
    },
    {
        key: 'estilos',
        label: 'Bloques del Home',
        description: 'Guía de estilos y secciones visuales',
        icon: Layers,
    },
];

interface EscaparateTabsProps {
    activeTab: EscaparateTab;
    onTabChange: (tab: EscaparateTab) => void;
}

export default function EscaparateTabs({ activeTab, onTabChange }: EscaparateTabsProps) {
    return (
        <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-2 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {ESCAPARATE_TABS.map((tab) => {
                    const isActive = activeTab === tab.key;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => onTabChange(tab.key)}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-[0.98] shrink-0 ${
                                isActive
                                    ? 'bg-white text-black font-extrabold shadow-sm'
                                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Icon size={14} className={isActive ? 'text-black' : 'text-neutral-400'} />
                            <span>{tab.label}</span>
                            {tab.liveDot && (
                                <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                        isActive ? 'bg-red-600' : 'bg-emerald-400 animate-pulse'
                                    }`}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

