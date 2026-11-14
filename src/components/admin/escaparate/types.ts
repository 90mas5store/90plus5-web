import React from 'react';

export type EscaparateTab = 'banners' | 'special' | 'marquesina' | 'matchday' | 'estilos';

export interface EscaparateTabItem {
    key: EscaparateTab;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    badge?: string;
    liveDot?: boolean;
}

