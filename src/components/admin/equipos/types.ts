export interface Team {
    id: string;
    name: string;
    slug: string;
    logo_url: string;
    country: string;
    league_id?: string;
    is_national_team: boolean;
    active: boolean;
    is_matchday_active?: boolean;
    matchday_opponent?: string | null;
    matchday_score?: string | null;
    matchday_period?: string | null;
    leagues?: { name: string };
}

export interface League {
    id: string;
    name: string;
}

export interface Brand {
    id: string;
    name: string;
}

export type FilterTab = 'all' | 'clubs' | 'national' | 'live';

export interface MatchdayConfig {
    is_matchday_active: boolean;
    opponent_selection: string;
    opponent_custom_name: string;
    score_home: string;
    score_away: string;
    period: string;
}

export interface TeamFormData {
    name: string;
    slug: string;
    logo_url: string;
    country: string;
    league_id: string;
    brand_id: string;
    is_national_team: boolean;
    active: boolean;
    is_matchday_active: boolean;
}

