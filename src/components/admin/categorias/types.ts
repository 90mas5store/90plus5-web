export interface Category {
    id: string;
    name: string;
    slug: string;
    icon_url?: string;
    active: boolean;
    order_index: number;
    hero_image_position_desktop?: string;
    hero_image_position_mobile?: string;
}

export interface CategoryFormData {
    name: string;
    slug: string;
    icon_url: string;
    active: boolean;
    order_index: number;
    hero_image_position_desktop: string;
    hero_image_position_mobile: string;
}

