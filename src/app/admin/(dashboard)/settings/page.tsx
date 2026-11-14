'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import SettingsHeader from '@/components/admin/settings/SettingsHeader';
import SettingsTabs, { SETTINGS_TABS } from '@/components/admin/settings/SettingsTabs';
import { SettingsTab } from '@/components/admin/settings/types';

import AdminUsersPage from '@/app/admin/(dashboard)/settings/admins/page';
import ActivityLogsPage from '@/app/admin/(dashboard)/settings/activity/page';
import AdminTasaCambioPage from '@/app/admin/(dashboard)/settings/tasa-cambio/page';
import TrashPage from '@/app/admin/(dashboard)/settings/trash/page';

function SettingsContent() {
    const searchParams = useSearchParams();
    const initialTab = (searchParams.get('tab') as SettingsTab) || 'admins';

    const isValidTab = (t: string): t is SettingsTab => {
        return SETTINGS_TABS.some((tab) => tab.key === t);
    };

    const [activeTab, setActiveTab] = useState<SettingsTab>(
        isValidTab(initialTab) ? initialTab : 'admins'
    );

    useEffect(() => {
        const queryTab = searchParams.get('tab');
        if (queryTab && isValidTab(queryTab)) {
            setActiveTab(queryTab);
        }
    }, [searchParams]);

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Encabezado Homologado */}
            <SettingsHeader />

            {/* Selector Segmentado Apple 4-en-1 */}
            <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Vista Activa */}
            <div className="min-h-[450px]">
                {activeTab === 'admins' && <AdminUsersPage />}
                {activeTab === 'activity' && <ActivityLogsPage />}
                {activeTab === 'tasa-cambio' && <AdminTasaCambioPage />}
                {activeTab === 'trash' && <TrashPage />}
            </div>
        </div>
    );
}

export default function AdminSettingsPage() {
    return (
        <Suspense
            fallback={
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-xs text-neutral-400 font-medium">Cargando Sistema & Seguridad...</span>
                </div>
            }
        >
            <SettingsContent />
        </Suspense>
    );
}
