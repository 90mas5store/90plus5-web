import { createAdminClient } from '@/lib/supabase/admin';

export type MarqueeIconType = 
    | 'clock' 
    | 'truck' 
    | 'sparkles' 
    | 'shield' 
    | 'message' 
    | 'flame' 
    | 'star' 
    | 'tag' 
    | 'zap';

export interface MarqueeItem {
    id: string;
    icon: MarqueeIconType;
    highlight: string;
    text: string;
    active: boolean;
}

export interface MarqueeBarSettings {
    enabled: boolean;
    speedSeconds: number;
    autoCalculateCutoff: boolean;
    items: MarqueeItem[];
}

export const DEFAULT_MARQUEE_SETTINGS: MarqueeBarSettings = {
    enabled: true,
    speedSeconds: 32,
    autoCalculateCutoff: true,
    items: [
        {
            id: 'cutoff',
            icon: 'clock',
            highlight: 'Cierre de Pedidos',
            text: 'Pedidos los 5, 15 y 25 de cada mes (Próximo: {proximo_cierre}) · Llegada en ~1 mes (3-4 semanas)',
            active: true,
        },
        {
            id: 'shipping',
            icon: 'truck',
            highlight: 'Envíos Honduras',
            text: 'Envíos asegurados a los 18 departamentos vía CAEX y express en Tegucigalpa',
            active: true,
        },
        {
            id: 'dorsal',
            icon: 'sparkles',
            highlight: 'Dorsal Oficial',
            text: 'Personalización oficial disponible: Nombre, número y parches de torneo',
            active: true,
        },
        {
            id: 'quality',
            icon: 'shield',
            highlight: '100% Calidad',
            text: 'Calidad Premium Garantizada · Versión Jugador y Versión Aficionado',
            active: true,
        },
        {
            id: 'support',
            icon: 'message',
            highlight: 'Soporte WhatsApp',
            text: 'Atención personalizada 1 a 1 y asesoría en tallas vía WhatsApp',
            active: true,
        },
    ],
};

interface CacheEntry {
    data: MarqueeBarSettings;
    timestamp: number;
}

let memoryCache: CacheEntry | null = null;
const CACHE_TTL_MS = 60 * 1000; // 1 minuto en memoria

/**
 * Calcula dinámicamente la fecha del próximo corte (5, 15 o 25)
 */
export function calculateNextCutoffDate(): string {
    const now = new Date();
    const day = now.getDate();
    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    let targetDay = 5;
    let targetMonthIndex = now.getMonth();

    if (day <= 5) {
        targetDay = 5;
    } else if (day <= 15) {
        targetDay = 15;
    } else if (day <= 25) {
        targetDay = 25;
    } else {
        targetDay = 5;
        targetMonthIndex = (now.getMonth() + 1) % 12;
    }

    return `${targetDay} de ${monthNames[targetMonthIndex]}`;
}

/**
 * Obtiene la configuración de la marquesina desde store_settings
 */
export async function getMarqueeSettings(): Promise<MarqueeBarSettings> {
    const now = Date.now();
    if (memoryCache && now - memoryCache.timestamp < CACHE_TTL_MS) {
        return memoryCache.data;
    }

    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('store_settings')
            .select('*')
            .eq('key', 'marquee_bar_config')
            .maybeSingle();

        if (error || !data?.value) {
            return DEFAULT_MARQUEE_SETTINGS;
        }

        const val = data.value as Partial<MarqueeBarSettings>;

        const settings: MarqueeBarSettings = {
            enabled: typeof val.enabled === 'boolean' ? val.enabled : DEFAULT_MARQUEE_SETTINGS.enabled,
            speedSeconds: typeof val.speedSeconds === 'number' && val.speedSeconds >= 10 && val.speedSeconds <= 120
                ? val.speedSeconds
                : DEFAULT_MARQUEE_SETTINGS.speedSeconds,
            autoCalculateCutoff: typeof val.autoCalculateCutoff === 'boolean'
                ? val.autoCalculateCutoff
                : DEFAULT_MARQUEE_SETTINGS.autoCalculateCutoff,
            items: Array.isArray(val.items) && val.items.length > 0
                ? val.items.map((item, idx) => ({
                    id: item.id || `item-${idx}`,
                    icon: item.icon || 'sparkles',
                    highlight: item.highlight || '',
                    text: item.text || '',
                    active: typeof item.active === 'boolean' ? item.active : true,
                }))
                : DEFAULT_MARQUEE_SETTINGS.items,
        };

        memoryCache = { data: settings, timestamp: now };
        return settings;
    } catch (err) {
        console.error('[getMarqueeSettings] Error fetching settings:', err);
        return DEFAULT_MARQUEE_SETTINGS;
    }
}

export function invalidateMarqueeSettingsCache() {
    memoryCache = null;
}
