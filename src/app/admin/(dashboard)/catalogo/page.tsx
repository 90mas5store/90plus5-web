'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import CatalogoHeader from '@/components/admin/catalogo/CatalogoHeader';
import CatalogoTabs, { CATALOGO_TABS } from '@/components/admin/catalogo/CatalogoTabs';
import { CatalogoTab } from '@/components/admin/catalogo/types';

import TeamsPage from '@/app/admin/(dashboard)/equipos/page';
import LeaguesPage from '@/app/admin/(dashboard)/ligas/page';
import CategoriesPage from '@/app/admin/(dashboard)/categorias/page';
import BrandsPage from '@/app/admin/(dashboard)/marcas/page';
import EstilosPage from '@/app/admin/(dashboard)/estilos/page';

function CatalogoContent() {
    const searchParams = useSearchParams();
    const initialTab = (searchParams.get('tab') as CatalogoTab) || 'equipos';

    const isValidTab = (t: string): t is CatalogoTab => {
        return CATALOGO_TABS.some((tab) => tab.key === t);
    };

    const [activeTab, setActiveTab] = useState<CatalogoTab>(
        isValidTab(initialTab) ? initialTab : 'equipos'
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
            <CatalogoHeader />

            {/* Control Segmentado Apple 5-en-1 */}
            <CatalogoTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Vista Activa */}
            <div className="min-h-[500px]">
                {activeTab === 'equipos' && <TeamsPage />}
                {activeTab === 'ligas' && <LeaguesPage />}
                {activeTab === 'categorias' && <CategoriesPage />}
                {activeTab === 'marcas' && <BrandsPage />}
                {activeTab === 'estilos' && <EstilosPage />}
            </div>
        </div>
    );
}

export default function CatalogoHubPage() {
    return (
        <Suspense
            fallback={
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-xs text-neutral-400 font-medium">Cargando Estructura del Catálogo...</span>
                </div>
            }
        >
            <CatalogoContent />
        </Suspense>
    );
}

