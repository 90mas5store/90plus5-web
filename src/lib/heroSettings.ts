import { createAdminClient } from '@/lib/supabase/admin';

export interface HeroShowcaseSettings {
    quickTagBadge: string;
    quickTagAction: string;
    specsSizes: string;
    specsVersion: string;
    trustNotice: string;
    secondaryButtonText: string;
    secondaryButtonUrl: string;
    showQuickTag: boolean;
    showSpecs: boolean;
    showTrustNotice: boolean;
    showSecondaryButton: boolean;
}

export const DEFAULT_HERO_SETTINGS: HeroShowcaseSettings = {
    quickTagBadge: 'Prenda Oficial',
    quickTagAction: 'Ver detalles y tallas',
    specsSizes: 'Tallas: S · M · L · XL · 2XL',
    specsVersion: 'Versión Jugador & Fan',
    trustNotice: 'Prendas oficiales listas para despacho o pedido · Tegucigalpa & Honduras',
    secondaryButtonText: 'Ver Todo el Catálogo',
    secondaryButtonUrl: '/catalogo',
    showQuickTag: true,
    showSpecs: true,
    showTrustNotice: true,
    showSecondaryButton: true,
};

interface CacheEntry {
    data: HeroShowcaseSettings;
    timestamp: number;
}

let memoryCache: CacheEntry | null = null;
const CACHE_TTL_MS = 60 * 1000; // 1 minuto en memoria

export async function getHeroShowcaseSettings(): Promise<HeroShowcaseSettings> {
    const now = Date.now();
    if (memoryCache && now - memoryCache.timestamp < CACHE_TTL_MS) {
        return memoryCache.data;
    }

    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('store_settings')
            .select('*')
            .eq('key', 'hero_showcase_config')
            .maybeSingle();

        if (error || !data?.value) {
            return DEFAULT_HERO_SETTINGS;
        }

        const val = data.value as Record<string, unknown>;

        const settings: HeroShowcaseSettings = {
            quickTagBadge: typeof val.quick_tag_badge === 'string' ? val.quick_tag_badge : DEFAULT_HERO_SETTINGS.quickTagBadge,
            quickTagAction: typeof val.quick_tag_action === 'string' ? val.quick_tag_action : DEFAULT_HERO_SETTINGS.quickTagAction,
            specsSizes: typeof val.specs_sizes === 'string' ? val.specs_sizes : DEFAULT_HERO_SETTINGS.specsSizes,
            specsVersion: typeof val.specs_version === 'string' ? val.specs_version : DEFAULT_HERO_SETTINGS.specsVersion,
            trustNotice: typeof val.trust_notice === 'string' ? val.trust_notice : DEFAULT_HERO_SETTINGS.trustNotice,
            secondaryButtonText: typeof val.secondary_button_text === 'string' ? val.secondary_button_text : DEFAULT_HERO_SETTINGS.secondaryButtonText,
            secondaryButtonUrl: typeof val.secondary_button_url === 'string' ? val.secondary_button_url : DEFAULT_HERO_SETTINGS.secondaryButtonUrl,
            showQuickTag: typeof val.show_quick_tag === 'boolean' ? val.show_quick_tag : DEFAULT_HERO_SETTINGS.showQuickTag,
            showSpecs: typeof val.show_specs === 'boolean' ? val.show_specs : DEFAULT_HERO_SETTINGS.showSpecs,
            showTrustNotice: typeof val.show_trust_notice === 'boolean' ? val.show_trust_notice : DEFAULT_HERO_SETTINGS.showTrustNotice,
            showSecondaryButton: typeof val.show_secondary_button === 'boolean' ? val.show_secondary_button : DEFAULT_HERO_SETTINGS.showSecondaryButton,
        };

        memoryCache = { data: settings, timestamp: now };
        return settings;
    } catch (err) {
        console.error('[getHeroShowcaseSettings] Error fetching settings:', err);
        return DEFAULT_HERO_SETTINGS;
    }
}

export function invalidateHeroShowcaseCache() {
    memoryCache = null;
}
