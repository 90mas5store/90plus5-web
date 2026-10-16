export interface TopBuyer {
    email: string;
    name: string;
    phone: string;
    totalSpent: number;
    totalOrders: number;
    totalJerseys: number;
    avgOrderValue: number;
    lastOrderDate: string;
    freeJerseysEarned: number;
    jerseysUntilNext: number;
    loyaltyTier: 'VIP_LEGEND' | 'LOYAL_FAN' | 'STARTER_FAN';
}

export interface BestSellerItem {
    name: string;
    team_name: string | null;
    season: string | null;
    units: number;
    revenue: number;
}

export interface ShareStatItem {
    product_name: string;
    team_name: string | null;
    season: string | null;
    count: number;
}

export interface StatusOption {
    value: string;
    label: string;
    color: string;
}
