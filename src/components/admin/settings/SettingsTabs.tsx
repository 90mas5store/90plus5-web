'use client';

import React from 'react';
import { Lock, Activity, DollarSign, Trash2 } from 'lucide-react';
import { SettingsTab, SettingsTabItem } from './types';

export const SETTINGS_TABS: SettingsTabItem[] = [
    {
        key: 'admins',
        label: 'Administradores',
        description: 'Accesos autorizados y roles',
        icon: Lock,
    },
    {
        key: 'activity',
        label: 'Registro de Actividad',
        description: 'Auditoría en tiempo real',
        icon: Activity,
    },
    {
        key: 'tasa-cambio',
        label: 'Tasa de Cambio (USD)',
        description: 'Paridad Lempira / Dólar',
        icon: DollarSign,
    },
    {
        key: 'trash',
        label: 'Papelera',
        description: 'Recuperación de eliminados',
        icon: Trash2,
    },
];

interface SettingsTabsProps {
    activeTab: SettingsTab;
    onTabChange: (tab: SettingsTab) => void;
}

export default function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
    return (
        <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-2 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {SETTINGS_TABS.map((tab) => {
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

