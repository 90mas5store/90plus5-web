export interface Brand {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    active: boolean;
    sort_order: number;
}

export interface BrandFormData {
    name: string;
    slug: string;
    logo_url: string;
    active: boolean;
    sort_order: number;
}

