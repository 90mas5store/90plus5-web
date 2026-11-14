'use client';

import React from 'react';
import { Shield, Trophy, Tag, Bookmark, Scissors } from 'lucide-react';
import { CatalogoTab, CatalogoTabItem } from './types';

export const CATALOGO_TABS: CatalogoTabItem[] = [
    {
        key: 'equipos',
        label: 'Equipos',
        description: 'Clubes, selecciones y Matchday',
        icon: Shield,
    },
    {
        key: 'ligas',
        label: 'Ligas',
        description: 'Competiciones y visibilidad',
        icon: Trophy,
    },
    {
        key: 'categorias',
        label: 'Categorías',
        description: 'Categorías base y puntos focales',
        icon: Tag,
    },
    {
        key: 'marcas',
        label: 'Marcas',
        description: 'Marcas técnicas y patrocinadores',
        icon: Bookmark,
    },
    {
        key: 'estilos',
        label: 'Personalización',
        description: 'Parches, tallas y dorsales',
        icon: Scissors,
    },
];

interface CatalogoTabsProps {
    activeTab: CatalogoTab;
    onTabChange: (tab: CatalogoTab) => void;
}

export default function CatalogoTabs({ activeTab, onTabChange }: CatalogoTabsProps) {
    return (
        <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-2 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {CATALOGO_TABS.map((tab) => {
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
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

