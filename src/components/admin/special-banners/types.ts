import { Globe, Trophy, Star, Flame } from "lucide-react";

export interface SpecialBanner {
    id: string;
    title: string;
    subtitle: string;
    link_url: string;
    background_image_url: string;
    background_video_url: string;
    logo_url: string;
    decoration_image_url: string;
    badge_primary_text: string;
    badge_secondary_text: string;
    badge_secondary_icon: string;
    button_text: string;
    active: boolean;
    sort_order: number;
    slug?: string;
    product_count?: number;
    image_position_desktop?: string;
    image_position_mobile?: string;
}

export const ICON_OPTIONS = [
    { value: "globe", label: "Globe", Icon: Globe },
    { value: "trophy", label: "Trophy", Icon: Trophy },
    { value: "star", label: "Star", Icon: Star },
    { value: "flame", label: "Flame", Icon: Flame },
];

export const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    globe: Globe,
    trophy: Trophy,
    star: Star,
    flame: Flame,
};

export function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
}
