export interface TrackingOrderItem {
    product: string;
    team?: string;
    quantity: number;
    image?: string;
    version?: string;
    size?: string | null;
    personalization?: string | null;
}

export interface TrackingStatus {
    code: string;
    label: string;
    progress: number;
    desc: string;
}

export interface TrackingBilling {
    subtotal: number;
    total: number;
    deposit_paid: number;
    remaining: number;
}

export interface TrackingHistoryItem {
    status_id: string;
    label: string;
    date: string;
}

export interface TrackingOrder {
    id: string;
    customer_name?: string | null;
    date: string;
    location: string;
    items: TrackingOrderItem[];
    status: TrackingStatus;
    billing: TrackingBilling;
    history: TrackingHistoryItem[];
}
