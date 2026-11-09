import { SupabaseClient } from '@supabase/supabase-js';

const SETTINGS_KEY = 'team_brand_defaults';

export type TeamBrandMap = Record<string, string>;

/**
 * Obtiene el mapa completo de marca oficial por equipo desde store_settings
 */
export async function getTeamBrandsMap(supabase: SupabaseClient): Promise<TeamBrandMap> {
    try {
        const { data, error } = await supabase
            .from('store_settings')
            .select('value')
            .eq('key', SETTINGS_KEY)
            .maybeSingle();

        if (error || !data || !data.value) {
            return {};
        }

        return (typeof data.value === 'object' ? data.value : {}) as TeamBrandMap;
    } catch (err) {
        console.warn('Error leyendo team_brand_defaults desde store_settings:', err);
        return {};
    }
}

/**
 * Guarda o actualiza la marca oficial de un equipo específico en store_settings
 */
export async function setTeamBrandDefault(
    supabase: SupabaseClient,
    teamId: string,
    brandId: string | null
): Promise<void> {
    if (!teamId) return;

    try {
        const currentMap = await getTeamBrandsMap(supabase);
        const updatedMap: TeamBrandMap = { ...currentMap };

        if (brandId) {
            updatedMap[teamId] = brandId;
        } else {
            delete updatedMap[teamId];
        }

        const { error } = await supabase
            .from('store_settings')
            .upsert(
                {
                    key: SETTINGS_KEY,
                    value: updatedMap,
                    description: 'Mapeo oficial de marca patrocinadora técnica por equipo de fútbol',
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'key' }
            );

        if (error) {
            console.error('Error guardando team_brand_defaults en store_settings:', error);
        }
    } catch (err) {
        console.error('Error en setTeamBrandDefault:', err);
    }
}

