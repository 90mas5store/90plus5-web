import type { LeagueDefinition, TeamDiscoveryMapping } from "@/lib/matchdayLeagues";

export type CategoryFilter =
    | "Todos"
    | "Copas Nacionales"
    | "Ligas Principales"
    | "Torneos Continentales"
    | "Selecciones & FIFA"
    | "Personalizados";

export interface ManualTestResult {
    valid: boolean;
    name?: string;
    message?: string;
    eventsCount?: number;
}

export type { LeagueDefinition, TeamDiscoveryMapping };
