import { createClient } from '@/lib/supabase/server';
import { Activity } from 'lucide-react';
import { getStartOfDayInStoreTz } from '@/lib/analytics/timezone';
import DashboardMetrics from '@/components/admin/DashboardMetrics';
import DashboardActionCards from '@/components/admin/dashboard/DashboardActionCards';
import DashboardQuickActions from '@/components/admin/dashboard/DashboardQuickActions';
import DashboardOrdersFeed, { DashboardOrder } from '@/components/admin/dashboard/DashboardOrdersFeed';

export const revalidate = 60; // Revalidar cada 60 segundos

export default async function AdminDashboard() {
    const supabase = await createClient();

    // 1️⃣ Calcular inicio del día en zona horaria local Honduras (UTC-6)
    const startOfDay = getStartOfDayInStoreTz(new Date());

    // 2️⃣ Consultas concurrentes optimizadas en paralelo
    const [
        todayOrdersRes,
        pendingPaymentRes,
        depositPaidRes,
        readyDeliveryRes,
        inTransitRes,
        recentOrdersRes,
    ] = await Promise.all([
        supabase
            .from('orders')
            .select('id, total_amount, status')
            .gte('created_at', startOfDay.toISOString())
            .neq('status', 'cancelled')
            .neq('status', 'Cancelled'),
        supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending_payment_50'),
        supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .in('status', ['deposit_paid', 'payment_verified']),
        supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .in('status', ['ready_for_delivery', 'pending_second_payment']),
        supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .in('status', ['processing', 'in_transit', 'shipped_to_hn']),
        supabase
            .from('orders')
            .select('id, customer_name, customer_email, customer_phone, status, total_amount, created_at')
            .order('created_at', { ascending: false })
            .limit(10),
    ]);

    // Métricas del día actual
    const todayOrdersData = todayOrdersRes.data || [];
    const todayOrdersCount = todayOrdersData.length;
    const todaySales = todayOrdersData.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
    const todayAvgTicket = todayOrdersCount > 0 ? todaySales / todayOrdersCount : 0;

    // Conteo de estados urgentes
    const pendingPaymentCount = pendingPaymentRes.count ?? 0;
    const depositPaidCount = depositPaidRes.count ?? 0;
    const readyDeliveryCount = readyDeliveryRes.count ?? 0;
    const inTransitCount = inTransitRes.count ?? 0;

    const orders: DashboardOrder[] = (recentOrdersRes.data || []).map((o) => ({
        id: o.id,
        customer_name: o.customer_name || 'Aficionado 90+5',
        customer_email: o.customer_email,
        customer_phone: o.customer_phone,
        status: o.status,
        total_amount: Number(o.total_amount) || 0,
        created_at: o.created_at,
    }));

    return (
        <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-16">
            {/* ═══════════════════ HEADER LIMPIO (Apple Design) ═══════════════════ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08]">
                <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="p-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                            <Activity className="w-4 h-4" />
                        </span>
                        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                            Cockpit Operativo
                        </h1>
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-[11px] font-medium text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Tienda Activa
                        </span>
                    </div>
                    <p className="text-xs text-neutral-400">
                        Atención urgente de pedidos, transferencias por verificar y actividad de hoy.
                    </p>
                </div>
            </div>

            {/* ═══════════════════ 1. PULSO DEL DÍA (MÉTRICAS VIVAS) ═══════════════════ */}
            <DashboardMetrics
                todayOrders={todayOrdersCount}
                todaySales={todaySales}
                todayAvgTicket={todayAvgTicket}
            />

            {/* ═══════════════════ 2. BANDEJA DE ACCIÓN OPERATIVA (URGENCIAS HOY) ═══════════════════ */}
            <DashboardActionCards
                pendingPaymentCount={pendingPaymentCount}
                depositPaidCount={depositPaidCount}
                readyDeliveryCount={readyDeliveryCount}
                inTransitCount={inTransitCount}
            />

            {/* ═══════════════════ 3. ACCIONES FRECUENTES TÁCTILES ═══════════════════ */}
            <DashboardQuickActions />

            {/* ═══════════════════ 4. BANDEJA DE ENTRADA RECIENTE CON WHATSAPP ═══════════════════ */}
            <DashboardOrdersFeed orders={orders} />
        </div>
    );
}
