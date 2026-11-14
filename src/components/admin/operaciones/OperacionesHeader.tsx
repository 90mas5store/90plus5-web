import { Package } from 'lucide-react';

export function OperacionesHeader() {
    return (
        <div className="p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                    <Package className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                            Centro de Pedidos & Operaciones
                        </h1>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            4 en 1
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                        Gestión de pedidos, lista de producción para fábrica, clientes VIP y analíticas en vivo.
                    </p>
                </div>
            </div>
        </div>
    );
}

