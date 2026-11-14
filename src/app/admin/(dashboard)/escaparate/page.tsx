'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import EscaparateHeader from '@/components/admin/escaparate/EscaparateHeader';
import EscaparateTabs, { ESCAPARATE_TABS } from '@/components/admin/escaparate/EscaparateTabs';
import { EscaparateTab } from '@/components/admin/escaparate/types';

import BannersPage from '@/app/admin/(dashboard)/settings/banners/page';
import SpecialBannersPage from '@/app/admin/(dashboard)/settings/special-banners/page';
import AdminMarqueeSettingsPage from '@/app/admin/(dashboard)/settings/marquesina/page';
import AdminTorneosSettingsPage from '@/app/admin/(dashboard)/settings/torneos/page';
import AdminHomeStylesSettingsPage from '@/app/admin/(dashboard)/settings/estilos-home/page';

function EscaparateContent() {
    const searchParams = useSearchParams();
    const initialTab = (searchParams.get('tab') as EscaparateTab) || 'banners';

    const isValidTab = (t: string): t is EscaparateTab => {
        return ESCAPARATE_TABS.some((tab) => tab.key === t);
    };

    const [activeTab, setActiveTab] = useState<EscaparateTab>(
        isValidTab(initialTab) ? initialTab : 'banners'
    );

    useEffect(() => {
        const queryTab = searchParams.get('tab');
        if (queryTab && isValidTab(queryTab)) {
            setActiveTab(queryTab);
        }
    }, [searchParams]);

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Encabezado Homologado con Enlace en Vivo a Tienda */}
            <EscaparateHeader />

            {/* Selector Segmentado de Estudios */}
            <EscaparateTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Contenido Dinámico por Pestaña */}
            <div className="min-h-[500px]">
                {activeTab === 'banners' && <BannersPage />}
                {activeTab === 'special' && <SpecialBannersPage />}
                {activeTab === 'marquesina' && <AdminMarqueeSettingsPage />}
                {activeTab === 'matchday' && <AdminTorneosSettingsPage />}
                {activeTab === 'estilos' && <AdminHomeStylesSettingsPage />}
            </div>
        </div>
    );
}

export default function EscaparateStudioPage() {
    return (
        <Suspense
            fallback={
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-xs text-neutral-400 font-medium">Cargando Escaparate Studio...</span>
                </div>
            }
        >
            <EscaparateContent />
        </Suspense>
    );
}

