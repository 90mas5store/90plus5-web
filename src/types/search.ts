export interface SearchResult {
    type: 'product' | 'category' | 'league' | 'alias';
    id: string;
    title: string;
    subtitle?: string;
    image?: string;
    price?: number;
    href: string;
    liveScore?: string;
    liveMinute?: string;
    isLive?: boolean;
    isUpcoming?: boolean;
    isFinished?: boolean;
}

export interface QuickClub {
    name: string;
    logoUrl?: string;
    query: string;
}

export interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    onSearch?: (e: React.FormEvent) => void;
    onNavigate?: () => void;
    placeholder?: string;
    className?: string;
    enableLiveResults?: boolean;
    autoFocus?: boolean;
}
