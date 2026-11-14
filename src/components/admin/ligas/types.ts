export interface League {
    id: string;
    name: string;
    slug: string;
    image_url: string;
    category_id?: string;
    active: boolean;
    show_in_home?: boolean;
    show_on_home?: boolean;
    sort_order: number;
    season: string;
    hero_image_position_desktop?: string;
    hero_image_position_mobile?: string;
    categories?: { name: string };
}

export interface Category {
    id: string;
    name: string;
}

export interface LeagueFormData {
    name: string;
    slug: string;
    image_url: string;
    category_id: string;
    active: boolean;
    show_in_home: boolean;
    sort_order: number;
    season: string;
}

