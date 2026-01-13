'use client';
import { motion } from 'framer-motion';
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
            value: `L ${totalSales.toLocaleString()}`,
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
            value: `L ${averageOrder.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            icon: TrendingUp,
            color: "text-emerald-400",
            bg: "bg-neutral-900 border-white/5"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards.map((card, idx) => (
                <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`p-6 rounded-2xl border ${card.bg} hover:border-white/10 transition-colors relative overflow-hidden group`}
                >
                    <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity opacity-0 group-hover:opacity-100" />

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl bg-white/5 ${card.color}`}>
                                <card.icon size={24} />
                            </div>
                            {/* Placeholder for trend */}
                            {/* <span className="text-xs font-bold bg-green-500/20 text-green-500 px-2 py-1 rounded">+12%</span> */}
                        </div>
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{card.label}</h3>
                        <p className={`text-4xl font-black ${card.color} tracking-tight`}>{card.value}</p>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}
