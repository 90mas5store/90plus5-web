'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Crown, RefreshCw } from 'lucide-react';
import VipLoyaltySection from '@/components/admin/reportes/VipLoyaltySection';
import { TopBuyer } from '@/components/admin/reportes/types';
import useToastMessage from '@/hooks/useToastMessage';

interface ClientesPageProps {
    embedded?: boolean;
}

export default function ClientesPage({ embedded = false }: ClientesPageProps) {
    const toast = useToastMessage();
    const [topBuyers, setTopBuyers] = useState<TopBuyer[]>([]);
    const [loading, setLoading] = useState(true);

    const loadBuyers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/reports/top-buyers');
            if (!res.ok) throw new Error('Error al cargar clientes');
            const data: TopBuyer[] = await res.json();
            setTopBuyers(data);
        } catch {
            toast.error('Error al cargar clientes VIP');
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadBuyers();
    }, [loadBuyers]);

    const totalVipLegends = topBuyers.filter((b) => b.loyaltyTier === 'VIP_LEGEND').length;
    const totalLoyalFans = topBuyers.filter((b) => b.loyaltyTier === 'LOYAL_FAN').length;
    const totalJerseysPurchased = topBuyers.reduce((acc, b) => acc + (b.totalJerseys || 0), 0);

    return (
        <div className={embedded ? 'space-y-4 sm:space-y-5' : 'max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-28'}>
            {/* HEADER HOMOLOGADO (solo en vista independiente) */}
            {!embedded && (
                <div className="p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                            <Crown className="w-5 h-5" />
                        </span>
                        <div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                                Clientes VIP & Fidelización
                            </h1>
                            <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                                Programa de lealtad de aficionados: premia a tus compradores más leales con cupones y camisetas de recompensa.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={loadBuyers}
                            disabled={loading}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] text-xs font-semibold text-neutral-300 hover:text-white border border-white/[0.08] transition-all disabled:opacity-50 cursor-pointer"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-white' : ''}`} />
                            <span>Actualizar</span>
                        </button>
                    </div>
                </div>
            )}

            {/* TARJETAS KPI DE FIDELIDAD HOMOLOGADAS (AGENTS.md Regla 3) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                        <span>Aficionados Frecuentes</span>
                        <span className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight mt-2">
                        {loading ? '...' : topBuyers.length}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1 truncate">Compradores con historial activo</p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                        <span>VIP Legends (10+ Camisas)</span>
                        <span className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight mt-2">
                        {loading ? '...' : totalVipLegends}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1 truncate">{totalLoyalFans} en nivel Loyal Fan (5–9)</p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                        <span>Camisetas Entregadas</span>
                        <span className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight mt-2">
                        {loading ? '...' : totalJerseysPurchased}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1 truncate">Prendas adquiridas por estos clientes</p>
                </div>
            </div>

            {/* TABLA DE LEALTAD Y GESTIÓN DE CUPONES */}
            <VipLoyaltySection
                topBuyers={topBuyers}
                loadingBuyers={loading}
                onRefresh={loadBuyers}
            />
        </div>
    );
}
