'use client';

import React, { useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface TabItem {
    id: string;
    label: string;
    statusValue: string;
}

const LIFECYCLE_TABS: TabItem[] = [
    { id: 'all', label: 'Todos', statusValue: '' },
    { id: 'pending', label: 'Por Verificar', statusValue: 'pending_payment_50' },
    { id: 'deposit_paid', label: 'Para Fábrica', statusValue: 'deposit_paid' },
    { id: 'in_transit', label: 'En Tránsito', statusValue: 'in_transit' },
    { id: 'ready_for_delivery', label: 'Por Cobrar 50%', statusValue: 'ready_for_delivery' },
    { id: 'completed', label: 'Completados', statusValue: 'completed' },
];

export default function OrderLifecycleTabs() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const currentStatus = searchParams.get('status') || '';

    const handleSelectTab = (statusValue: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (statusValue) {
            params.set('status', statusValue);
        } else {
            params.delete('status');
        }
        params.delete('page');

        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    return (
        <div
            role="tablist"
            aria-label="Etapas del ciclo de vida de pedidos"
            className="inline-flex max-w-full items-center gap-1 bg-white/[0.04] p-1 rounded-xl sm:rounded-2xl border border-white/[0.06] overflow-x-auto no-scrollbar"
        >
            {LIFECYCLE_TABS.map((tab) => {
                const isActive = currentStatus === tab.statusValue;
                return (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => handleSelectTab(tab.statusValue)}
                        disabled={isPending}
                        className={`flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
                            isActive
                                ? 'bg-white text-black font-extrabold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl shadow-xs active:scale-[0.98]'
                                : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold text-xs px-3 py-1.5 rounded-lg sm:rounded-xl'
                        }`}
                    >
                        {tab.statusValue && (
                            <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                    isActive ? 'bg-primary' : 'bg-white/35'
                                }`}
                            />
                        )}
                        <span>{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
