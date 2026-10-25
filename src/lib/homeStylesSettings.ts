import { createAdminClient } from '@/lib/supabase/admin';

export interface StyleCardConfig {
    id: string;
    tag: string;
    title: string;
    subtitle: string;
    href: string;
    buttonText: string;
}

export interface HomeStylesSettings {
    enabled: boolean;
    badge: string;
    title: string;
    subtitle: string;
    card1: StyleCardConfig;
    card2: StyleCardConfig;
    card3: StyleCardConfig;
}

export const DEFAULT_HOME_STYLES_SETTINGS: HomeStylesSettings = {
    enabled: true,
    badge: 'Guía de Estilos',
    title: 'Elige Tu Versión Ideal',
    subtitle: 'Diferentes cortes y acabados según cómo quieras lucir tu camiseta: de juego, clásica o urbana.',
    card1: {
        id: 'jugador',
        tag: 'Tecnología Pro',
        title: 'Versión Jugador',
        subtitle: 'Corte atlético ajustado, tela ultraligera de alta ventilación y escudos termosellados. La misma prenda que visten los futbolistas profesionales en la cancha.',
        href: '/catalogo?version=jugador',
        buttonText: 'Ver Versión Jugador',
    },
    card2: {
        id: 'retro',
        tag: 'Cultura & Época',
        title: 'Streetwear & Retro',
        subtitle: 'Piezas históricas de los 90s y 2000s, finales de torneo memorables y siluetas clásicas para llevar la pasión futbolera con estilo urbano a la calle.',
        href: '/catalogo?categoria=streetwear-retro',
        buttonText: 'Ver Joyas Retro',
    },
    card3: {
        id: 'aficionado',
        tag: 'Corte Clásico & Fan',
        title: 'Versión Aficionado',
        subtitle: 'Corte estándar relajado y escudos bordados de máxima resistencia. Diseñada para lucirla con total comodidad en el estadio o en tu día a día.',
        href: '/catalogo?version=aficionado',
        buttonText: 'Ver Versión Fan',
    },
};

interface CacheEntry {
    data: HomeStylesSettings;
    timestamp: number;
}

let memoryCache: CacheEntry | null = null;
const CACHE_TTL_MS = 60 * 1000;

export async function getHomeStylesSettings(): Promise<HomeStylesSettings> {
    const now = Date.now();
    if (memoryCache && now - memoryCache.timestamp < CACHE_TTL_MS) {
        return memoryCache.data;
    }

    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('store_settings')
            .select('*')
            .eq('key', 'home_styles_bento_config')
            .maybeSingle();

        if (error || !data?.value) {
            return DEFAULT_HOME_STYLES_SETTINGS;
        }

        const val = data.value as Partial<HomeStylesSettings>;

        const settings: HomeStylesSettings = {
            enabled: typeof val.enabled === 'boolean' ? val.enabled : DEFAULT_HOME_STYLES_SETTINGS.enabled,
            badge: val.badge || DEFAULT_HOME_STYLES_SETTINGS.badge,
            title: val.title || DEFAULT_HOME_STYLES_SETTINGS.title,
            subtitle: val.subtitle || DEFAULT_HOME_STYLES_SETTINGS.subtitle,
            card1: {
                ...DEFAULT_HOME_STYLES_SETTINGS.card1,
                ...(val.card1 || {}),
            },
            card2: {
                ...DEFAULT_HOME_STYLES_SETTINGS.card2,
                ...(val.card2 || {}),
            },
            card3: {
                ...DEFAULT_HOME_STYLES_SETTINGS.card3,
                ...(val.card3 || {}),
            },
        };

        memoryCache = { data: settings, timestamp: now };
        return settings;
    } catch (err) {
        console.error('[getHomeStylesSettings] Error fetching settings:', err);
        return DEFAULT_HOME_STYLES_SETTINGS;
    }
}

export function invalidateHomeStylesSettingsCache() {
    memoryCache = null;
}
