export const BUSINESS_LOGIC = {
    ORDER: {
        DEPOSIT_PERCENTAGE: 0.5, // 50%
    },
    CONTACT: {
        PHONE_PREFIX: "+504",
        PHONE_NUMBER: "3248-8860", // Formato visual
        WHATSAPP_NUMBER: "50432488860", // Formato para links
        /** Regex de validación del número local (sin prefijo de país) */
        PHONE_REGEX: /^[0-9]{4}-[0-9]{4}$/,
    },
    FEES: {
        /** Costo de envío estándar en Lempiras */
        SHIPPING_COST: 140,
        /** Zonas con envío gratis (Tegucigalpa / Distrito Central) */
        FREE_SHIPPING_ZONES: [
            {
                department: 'Francisco Morazán',
                municipalities: ['Tegucigalpa', 'Distrito Central'],
            },
        ],
    },
};

/**
 * Calcula el costo de envío según departamento y municipio.
 * Devuelve 0 (gratis) para Tegucigalpa y Distrito Central; 140 para el resto.
 */
export function calcShippingCost(department: string, municipality: string): number {
    const isFree = BUSINESS_LOGIC.FEES.FREE_SHIPPING_ZONES.some(
        zone =>
            zone.department === department &&
            zone.municipalities.includes(municipality)
    );
    return isFree ? 0 : BUSINESS_LOGIC.FEES.SHIPPING_COST;
}
