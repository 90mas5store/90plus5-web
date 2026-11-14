export interface OrderItem {
    quantity: number;
    unit_price: number;
    product_variants: { cost: number | null } | null;
    products: { name: string; teams: { name: string } | null } | null;
}

export interface Payment {
    amount: number;
    method: string | null;
    notes: string | null;
    status: string;
    type: string | null;
}

export interface AccountingOrder {
    id: string;
    created_at: string;
    status: string;
    total_amount: number;
    subtotal: number | null;
    discount_amount: number | null;
    customer_name: string;
    order_items: OrderItem[];
    payments: Payment[];
}

export interface OrderMetrics {
    order: AccountingOrder;
    revenue: number;
    productRevenue: number;
    discountAmount: number;
    shippingRevenue: number;
    productCost: number;
    shippingCost: number;
    totalCost: number;
    grossProfit: number;
    marginPct: number;
    verifiedPaid: number;
    missingCosts: boolean;
}

export type PresetKey = 'today' | '7d' | '30d' | 'month' | 'year' | 'custom';

export interface AccountingTotals {
    revenue: number;
    productRevenue: number;
    discountAmount: number;
    shippingRevenue: number;
    productCost: number;
    shippingCost: number;
    totalCost: number;
    grossProfit: number;
}

export interface ProductProfitItem {
    name: string;
    units: number;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
}

