export interface Patch {
    id: string;
    name: string;
    competition_id: string | null;
    category_id: string | null;
    active: boolean;
}

export interface Size {
    id: string;
    label: string;
    sort_order: number | null;
    category_id: string | null;
    gender: string | null;
    active: boolean;
    additional_cost: number;
}

export interface Team {
    id: string;
    name: string;
}

export interface Player {
    id: string;
    team_id: string;
    name: string;
    number: number;
    active: boolean;
}

export interface League {
    id: string;
    name: string;
}

export interface Category {
    id: string;
    name: string;
}

export const GENDER_LABELS: Record<string, string> = {
    man: "Hombre",
    woman: "Mujer",
    kid: "Niño",
};

export const EMPTY_PATCH = {
    name: "",
    competition_id: "",
    category_id: "",
    active: true,
};

export const EMPTY_SIZE = {
    label: "",
    sort_order: "",
    category_id: "",
    gender: "",
    active: true,
    additional_cost: "",
};

export const TABS = [
    { key: "parches" as const, label: "Parches" },
    { key: "tallas" as const, label: "Tallas" },
    { key: "plantillas" as const, label: "Plantillas" },
];
