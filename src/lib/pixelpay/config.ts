/**
 * PixelPay Configuration
 * 
 * Default sandbox credentials from PixelPay official documentation:
 * Key: 1234567890
 * Secret: @s4ndb0x-abcd-1234-n1l4-p1x3l
 * 
 * In production, configure PIXELPAY_KEY and PIXELPAY_SECRET in .env.local / Vercel.
 */

export const PIXELPAY_CONFIG = {
    key: process.env.PIXELPAY_KEY || '1234567890',
    secret: process.env.PIXELPAY_SECRET || '@s4ndb0x-abcd-1234-n1l4-p1x3l',
    env: (process.env.PIXELPAY_ENV || 'sandbox').toLowerCase() as 'sandbox' | 'live' | 'production',
    
    // Hosted Checkout Endpoints
    sandboxEndpoint: 'https://pixelpay.app/api/v2/transaction/hosted/sandbox',
    productionEndpoint: process.env.PIXELPAY_ENDPOINT || 'https://pixelpay.app/api/v2/transaction/hosted/other',
    
    // Dominio de la plataforma PixelPay del comercio (`app_url` en la firma de seguridad).
    // Si no se define, se deriva del origen del endpoint Hosted activo.
    appUrl: process.env.PIXELPAY_APP_URL || '',

    // Status / Direct API Endpoint
    apiEndpoint: process.env.PIXELPAY_ENV === 'live' || process.env.PIXELPAY_ENV === 'production'
        ? 'https://pixelpay.app'
        : 'https://pixelpay.dev',
};

export function isPixelPayConfigured(): boolean {
    return Boolean(
        process.env.PIXELPAY_KEY && 
        process.env.PIXELPAY_SECRET && 
        process.env.PIXELPAY_KEY !== '1234567890'
    );
}
