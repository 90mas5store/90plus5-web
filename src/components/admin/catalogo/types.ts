import React from 'react';

export type CatalogoTab = 'equipos' | 'ligas' | 'categorias' | 'marcas' | 'estilos';

export interface CatalogoTabItem {
    key: CatalogoTab;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
}

