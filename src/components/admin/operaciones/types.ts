import type { OrderMobileData } from '@/components/admin/orders/OrderMobileCard';

export type OperacionesTab = 'orders' | 'fabrica' | 'clientes' | 'analiticas';

export interface OperacionesTabItem {
    id: OperacionesTab;
    label: string;
    shortLabel: string;
    badge?: string | number;
}

export interface OrderRow extends OrderMobileData {
    payment_method?: string | null;
}

