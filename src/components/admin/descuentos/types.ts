export interface DiscountCode {
    id: string;
    code: string;
    description: string | null;
    discount_pct: number;
    category_ids: string[];
    league_ids: string[];
    team_ids: string[];
    max_uses: number | null;
    used_count: number;
    expires_at: string | null;
    active: boolean;
    created_by: string;
    created_at: string;
}

export interface UsageRow {
    id: string;
    code_id: string;
    order_id: string;
    customer_email: string;
    discount_amount: number;
    created_at: string;
    discount_codes: { code: string; discount_pct: number } | null;
}

export interface CatalogItem {
    id: string;
    name: string;
}

export interface DiscountFormData {
    code: string;
    description: string;
    discount_pct: number;
    category_ids: string[];
    league_ids: string[];
    team_ids: string[];
    max_uses: string | number;
    expires_at: string;
    active: boolean;
}

export type DiscountTab = 'codes' | 'audit';

