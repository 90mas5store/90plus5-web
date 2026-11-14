import React from 'react';

export type SettingsTab = 'admins' | 'activity' | 'tasa-cambio' | 'trash';

export interface SettingsTabItem {
    key: SettingsTab;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
}

