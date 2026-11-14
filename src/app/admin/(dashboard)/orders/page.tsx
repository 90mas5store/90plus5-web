import { createClient } from '@/lib/supabase/server';
import { OperacionesHubClient } from '@/components/admin/operaciones/OperacionesHubClient';
import { OrdersView } from '@/components/admin/operaciones/OrdersView';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function OrdersPage({
    searchParams,
}: {
    searchParams?: { q?: string; page?: string; status?: string; startDate?: string; endDate?: string; tab?: string };
}) {
    const supabase = await createClient();
    const queryTerm = (searchParams?.q || '').slice(0, 100);
    const statusFilter = searchParams?.status || '';
    const startDate = searchParams?.startDate || '';
    const endDate = searchParams?.endDate || '';
    const currentPage = Math.max(1, parseInt(searchParams?.page || '1', 10));
    const from = (currentPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    if (queryTerm) {
        const sanitized = queryTerm.replace(/[%_,().]/g, '');
        if (sanitized) {
            query = query.or(`customer_name.ilike.%${sanitized}%,customer_email.ilike.%${sanitized}%,id.ilike.%${sanitized}%`);
        }
    }
    if (statusFilter) {
        query = query.eq('status', statusFilter);
    }
    if (startDate) {
        query = query.gte('created_at', `${startDate}T00:00:00`);
    }
    if (endDate) {
        query = query.lte('created_at', `${endDate}T23:59:59`);
    }

    const { data: orders, error, count } = await query;

    const baseParams: Record<string, string> = {};
    if (queryTerm) baseParams.q = queryTerm;
    if (statusFilter) baseParams.status = statusFilter;
    if (startDate) baseParams.startDate = startDate;
    if (endDate) baseParams.endDate = endDate;

    const totalCount = count ?? 0;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return (
        <OperacionesHubClient
            ordersCount={totalCount}
            ordersContent={
                <OrdersView
                    orders={orders ?? []}
                    count={totalCount}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    from={from}
                    to={to}
                    baseParams={baseParams}
                    errorMessage={error?.message ?? null}
                />
            }
        />
    );
}
