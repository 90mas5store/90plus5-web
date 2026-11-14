'use client';

import { Activity, FileSpreadsheet, Package, Users } from 'lucide-react';
import type { OperacionesTab, OperacionesTabItem } from './types';

interface OperacionesTabsProps {
    activeTab: OperacionesTab;
    onTabChange: (tab: OperacionesTab) => void;
    ordersCount: number;
}

const TAB_ICONS: Record<OperacionesTab, typeof Package> = {
    orders: Package,
    fabrica: FileSpreadsheet,
    clientes: Users,
    analiticas: Activity,
};

export function OperacionesTabs({
    activeTab,
    onTabChange,
    ordersCount,
}: OperacionesTabsProps) {
    const tabs: OperacionesTabItem[] = [
        { id: 'orders', label: 'Pedidos', shortLabel: 'Pedidos', badge: ordersCount },
        { id: 'fabrica', label: 'Lista Fábrica', shortLabel: 'Fábrica' },
        { id: 'clientes', label: 'Clientes VIP', shortLabel: 'VIP' },
        { id: 'analiticas', label: 'Analíticas', shortLabel: 'Analíticas' },
    ];

    return (
        <div
            role="tablist"
            aria-label="Secciones de operaciones"
            className="inline-flex max-w-full items-center gap-1 bg-white/[0.04] p-1 rounded-xl sm:rounded-2xl border border-white/[0.06] overflow-x-auto no-scrollbar"
        >
            {tabs.map((tab) => {
                const Icon = TAB_ICONS[tab.id];
                const isActive = activeTab === tab.id;

                return (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onTabChange(tab.id)}
                        className={`inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-all ${
                            isActive
                                ? 'bg-white text-black font-extrabold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl shadow-xs active:scale-[0.98]'
                                : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl'
                        }`}
                    >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.shortLabel}</span>
                        {tab.badge !== undefined && (
                            <span
                                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                                    isActive
                                        ? 'bg-black/10 text-black'
                                        : 'bg-white/[0.08] text-neutral-300'
                                }`}
                            >
                                {tab.badge}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

