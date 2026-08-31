export interface AdminSize {
    id: string;
    label: string;
    category_id: string | null;
    gender: string | null;
}

export interface AdminPatch {
    id: string;
    name: string;
    category_id: string | null;
}

export interface AdminVariant {
    id?: string; // UUID from DB (if existing)
    tempId: string; // Internal UI ID
    version: string;
    price: number;
    cost: number;
    active: boolean;
    original_price: number;
    active_original_price: boolean;
    sizeIds: Set<string>;
}

export interface AdminPlayer {
    id: string;
    name: string;
    number: number;
    active: boolean;
}

export interface AdminProductFormData {
    name: string;
    description: string;
    slug: string;
    image_url: string;
    team_id: string;
    league_id: string;
    category_id: string;
    brand_id: string;
    gender: string;
    active: boolean;
    featured: boolean;
    allows_customization: boolean;
    sort_order: number;
    season: string;
}

export interface CatalogItem {
    id: string;
    name: string;
}
