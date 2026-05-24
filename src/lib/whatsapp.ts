import { BUSINESS_LOGIC } from '@/lib/constants';

export const getWhatsappLink = ({
    phone = BUSINESS_LOGIC.CONTACT.WHATSAPP_NUMBER,
    message = 'Hola, tengo una consulta',
}: {
    phone?: string;
    message?: string;
} = {}) => {
    // Clean phone number: remove +, spaces, dashes
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    // Ensure country code 504 if missing and length suggests it's a local number (8 digits)
    const finalPhone = (cleanPhone.length === 8)
        ? `504${cleanPhone}`
        : cleanPhone;

    return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
};
