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
        SHIPPING: 0, // Gratis
    }
};
