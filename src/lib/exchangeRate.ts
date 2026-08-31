import { createAdminClient } from '@/lib/supabase/admin';

// Fallback por defecto si no hay conexión o no está configurado (mínimo 26.80)
export const DEFAULT_HNL_TO_USD_RATE = 26.80;

let cachedRate: number | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minuto de caché en memoria

/**
 * Obtiene la tasa de cambio vigente de Lempiras (HNL) a Dólares (USD).
 * 1 USD = X HNL.
 */
export async function getExchangeRate(): Promise<number> {
    const now = Date.now();
    if (cachedRate !== null && now < cacheExpiry) {
        return cachedRate;
    }

    const envRate = Number(process.env.NEXT_PUBLIC_HNL_TO_USD_RATE);
    const configuredFallback = !isNaN(envRate) && envRate > 0 ? envRate : DEFAULT_HNL_TO_USD_RATE;

    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('store_settings')
            .select('value')
            .eq('key', 'hnl_to_usd_rate')
            .maybeSingle();

        if (!error && data?.value?.rate) {
            const parsedRate = Number(data.value.rate);
            if (!isNaN(parsedRate) && parsedRate > 0) {
                cachedRate = parsedRate;
                cacheExpiry = now + CACHE_TTL_MS;
                return parsedRate;
            }
        }

        // Si no existe aún en la base de datos, inicializarlo para que quede guardado permanentemente
        if (!data) {
            await supabase
                .from('store_settings')
                .upsert(
                    {
                        key: 'hnl_to_usd_rate',
                        value: { rate: configuredFallback },
                        description: 'Tasa de cambio de Lempiras hondureños (HNL) por cada 1 Dólar estadounidense (USD)',
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'key' }
                );
        }
    } catch (err) {
        console.warn('[ExchangeRate] Error fetching exchange rate from DB:', err);
    }

    cachedRate = configuredFallback;
    cacheExpiry = now + CACHE_TTL_MS;
    return configuredFallback;
}

/**
 * Invalida la caché en memoria cuando el administrador cambia la tasa de cambio.
 */
export function invalidateExchangeRateCache() {
    cachedRate = null;
    cacheExpiry = 0;
}

/**
 * Convierte un monto en Lempiras (HNL) a Dólares Estadounidenses (USD).
 * @param hnlAmount Monto en Lempiras (ej. 1200)
 * @param rate Tasa de cambio HNL por USD (ej. 24.80)
 * @returns Monto en USD formateado a 2 decimales (ej. 48.39)
 */
export function convertHnlToUsd(hnlAmount: number, rate: number): number {
    if (!hnlAmount || hnlAmount <= 0 || !rate || rate <= 0) return 0;
    return Number((hnlAmount / rate).toFixed(2));
}
