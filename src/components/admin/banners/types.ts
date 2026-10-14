export interface Banner {
    id: string;
    title: string;
    description: string;
    image_url: string;
    video_url?: string;
    link_url: string;
    button_text: string;
    show_button: boolean;
    active: boolean;
    show_on_home: boolean;
    sort_order: number;
    image_position_desktop: string;
    image_position_mobile: string;
}

export interface CatalogFilterOption {
    id: string;
    name: string;
    slug: string;
}
