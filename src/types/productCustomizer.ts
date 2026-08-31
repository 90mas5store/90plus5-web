export interface ProductVariant {
    version: string;
    price: number;
    active: boolean;
    original_price?: number;
    active_original_price?: boolean;
}

export interface Team {
    name: string;
    logo_url: string;
}

export interface Brand {
    name: string;
    slug: string;
    logo_url?: string | null;
}

export interface CustomizerProduct {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    team_id: string | null;
    teams?: Team | null;
    brand_id?: string | null;
    brands?: Brand | null;
    product_variants?: ProductVariant[] | null;
    product_images?: { id: string; image_url: string; sort_order: number }[] | null;
    modelo?: string;
    equipo?: string;
    liga?: string;
    imagen?: string;
    logoEquipo?: string;
    precio?: number;
    descripcion?: string;
    slug?: string;
    league_id?: string | null;
    category_id?: string | null;
    allows_customization?: boolean;
    trending_until?: string | null;
    season?: string | null;
    gender?: string | null;
}

export interface ProductOptionsState {
    dorsales: { id: string; jugador: string; numero: string }[];
    preciosPorVersion: Record<string, number>;
    originalesPorVersion: Record<string, { price: number; active: boolean }>;
    versiones?: { id: string; label: string }[];
    tallas?: { id: string; label: string; additional_cost?: number }[];
    parches?: { id: string; label: string }[];
    variantSizesMap?: Record<string, string[]>;
}

export interface SelectedOption {
    id: string;
    label: string;
    additional_cost?: number;
}
