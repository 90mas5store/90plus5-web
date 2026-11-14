'use client';

import { FileSpreadsheet } from 'lucide-react';
import { useReportesData } from '@/components/admin/reportes/useReportesData';
import OrderExportSection from '@/components/admin/reportes/OrderExportSection';

interface ReportesPageProps {
    embedded?: boolean;
}

export default function ReportesPage({ embedded = false }: ReportesPageProps) {
    const {
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        selectedStatuses,
        toggleStatus,
        setPreset,
    } = useReportesData();

    return (
        <div className={embedded ? 'space-y-4 sm:space-y-5' : 'max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-28'}>
            {!embedded && (
                <div className="p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                            <FileSpreadsheet className="w-5 h-5" />
                        </span>
                        <div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                                Lista Fábrica & Proveedores
                            </h1>
                            <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                                Genera y descarga hojas de cálculo en Excel (.xlsx) y CSV con el formato exacto requerido por tus proveedores de camisetas.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <OrderExportSection
                startDate={startDate}
                endDate={endDate}
                selectedStatuses={selectedStatuses}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onToggleStatus={toggleStatus}
                onSetPreset={setPreset}
            />
        </div>
    );
}
