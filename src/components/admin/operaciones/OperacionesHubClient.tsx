'use client';

import { Suspense, useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import ReportesPage from '@/app/admin/(dashboard)/reportes/page';
import ClientesPage from '@/app/admin/(dashboard)/clientes/page';
import AdminAnaliticasPage from '@/app/admin/(dashboard)/analiticas/page';
import { OperacionesHeader } from './OperacionesHeader';
import { OperacionesTabs } from './OperacionesTabs';
import type { OperacionesTab } from './types';

interface OperacionesHubClientProps {
    ordersContent: ReactNode;
    ordersCount: number;
}

const VALID_TABS: readonly OperacionesTab[] = ['orders', 'fabrica', 'clientes', 'analiticas'];

function parseTab(raw: string | null): OperacionesTab {
    if (raw && (VALID_TABS as readonly string[]).includes(raw)) {
        return raw as OperacionesTab;
    }
    return 'orders';
}

function OperacionesHubContent({
    ordersContent,
    ordersCount,
}: OperacionesHubClientProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const urlTab = parseTab(searchParams.get('tab'));
    const [activeTab, setActiveTab] = useState<OperacionesTab>(urlTab);

    useEffect(() => {
        setActiveTab(urlTab);
    }, [urlTab]);

    const handleTabChange = (nextTab: OperacionesTab) => {
        setActiveTab(nextTab);
        const params = new URLSearchParams(searchParams.toString());
        if (nextTab === 'orders') {
            params.delete('tab');
        } else {
            params.set('tab', nextTab);
        }
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    };

    return (
        <div className="space-y-5 sm:space-y-6 pb-28 max-w-7xl mx-auto">
            <OperacionesHeader />

            <div className="flex items-center justify-between">
                <OperacionesTabs
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    ordersCount={ordersCount}
                />
            </div>

            {activeTab === 'orders' && ordersContent}
            {activeTab === 'fabrica' && <ReportesPage embedded />}
            {activeTab === 'clientes' && <ClientesPage embedded />}
            {activeTab === 'analiticas' && <AdminAnaliticasPage embedded />}
        </div>
    );
}

export function OperacionesHubClient(props: OperacionesHubClientProps) {
    return (
        <Suspense
            fallback={
                <div className="space-y-5 sm:space-y-6 pb-28 max-w-7xl mx-auto">
                    <OperacionesHeader />
                    <div className="h-10 w-80 rounded-2xl bg-white/[0.04] animate-pulse" />
                </div>
            }
        >
            <OperacionesHubContent {...props} />
        </Suspense>
    );
}
