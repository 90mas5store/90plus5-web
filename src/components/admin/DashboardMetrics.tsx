'use client';
import { motion } from '@/lib/motion';
import { TrendingUp, ShoppingBag, CreditCard } from 'lucide-react';

interface DashboardMetricsProps {
    totalOrders: number;
    totalSales: number;
}

export default function DashboardMetrics({ totalOrders, totalSales }: DashboardMetricsProps) {
    const averageOrder = totalOrders > 0 ? totalSales / totalOrders : 0;

    const cards = [
        {
            label: "Ventas Totales",
            value: `L ${totalSales.toLocaleString("es-HN")}`,
            icon: CreditCard,
            color: "text-primary",
            bg: "bg-neutral-900 border-white/5" // Keeping base consistent but maybe adding glow
        },
        {
            label: "Pedidos",
            value: totalOrders,
            icon: ShoppingBag,
            color: "text-white",
            bg: "bg-neutral-900 border-white/5"
        },
        {
            label: "Ticket Promedio",
            value: `L ${averageOrder.toLocaleString("es-HN", { maximumFractionDigits: 0 })}`,
            icon: TrendingUp,
            color: "text-emerald-400",
            bg: "bg-neutral-900 border-white/5"
        }
    ];

    return (
        <div className="grid grid-cols-3 gap-2 md:gap-6">
            {cards.map((card, idx) => (
                <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`p-3 md:p-6 rounded-xl md:rounded-2xl border ${card.bg} hover:border-white/10 transition-colors relative overflow-hidden group`}
                >
                    <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity opacity-0 group-hover:opacity-100" />

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2 md:mb-4">
                            <div className={`p-1.5 md:p-3 rounded-lg md:rounded-xl bg-white/5 ${card.color}`}>
                                <card.icon className="w-4 h-4 md:w-6 md:h-6" />
                            </div>
                        </div>
                        <h3 className="text-gray-400 text-[9px] md:text-xs font-bold uppercase tracking-widest mb-1 truncate">{card.label}</h3>
                        <p className={`text-base md:text-4xl font-black ${card.color} tracking-tight truncate`}>{card.value}</p>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}
