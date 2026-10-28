import { createHmac, createHash } from 'crypto';
import { PIXELPAY_CONFIG } from './config';
import { SITE_URL } from '@/lib/config/site';

export interface PixelPayCustomer {
    name: string;
    email: string;
    phone?: string;
}

export interface PixelPayHostedOrderParams {
    orderId: string;
    amount: number;
    currency?: 'HNL' | 'USD';
    customer: PixelPayCustomer;
    paymentType?: 'deposit' | 'full';
    returnUrl?: string;
    cancelUrl?: string;
    callbackUrl?: string;
}

/**
 * Genera la firma criptográfica HMAC-SHA3-512 requerida por PixelPay Hosted Payment.
 * Formato: hash_hmac("sha3-512", app_key|order_id|app_url, secret_key)
 */
export function generatePixelPaySignature(appKey: string, orderId: string, appUrl: string, secretKey: string): string {
    const message = [appKey, orderId, appUrl].join('|');
    return createHmac('sha3-512', secretKey).update(message).digest('hex');
}

/**
 * Construye la URL completa del Hosted Checkout de PixelPay con todos los parámetros
 * requeridos y la firma criptográfica.
 */
export function buildPixelPayHostedUrl(params: PixelPayHostedOrderParams): string {
    const isProd = PIXELPAY_CONFIG.env === 'live' || PIXELPAY_CONFIG.env === 'production';
    const baseUrl = isProd ? PIXELPAY_CONFIG.productionEndpoint : PIXELPAY_CONFIG.sandboxEndpoint;
    const siteUrl = (SITE_URL || 'https://90mas5.store').replace(/\/$/, '');

    // Separar nombre y apellido del cliente
    const nameParts = params.customer.name.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Cliente';
    const lastName = nameParts.slice(1).join(' ') || 'General';

    // Generar firma de seguridad
    const signature = generatePixelPaySignature(
        PIXELPAY_CONFIG.key,
        params.orderId,
        siteUrl,
        PIXELPAY_CONFIG.secret
    );

    const formattedAmount = params.amount.toFixed(2);
    const currency = params.currency || 'HNL';

    const completeUrl = params.returnUrl || `${siteUrl}/checkout/done?orderId=${encodeURIComponent(params.orderId)}&metodo=tarjeta&status=success`;
    const cancelUrl = params.cancelUrl || `${siteUrl}/checkout?cancelled=1&orderId=${encodeURIComponent(params.orderId)}`;
    const callbackUrl = params.callbackUrl || `${siteUrl}/api/checkout/pixelpay/webhook`;

    const queryParams = new URLSearchParams({
        _key: PIXELPAY_CONFIG.key,
        _client_signature: signature,
        _order_id: params.orderId,
        _amount: formattedAmount,
        _currency: currency,
        _first_name: firstName,
        _last_name: lastName,
        _email: params.customer.email,
        _complete: completeUrl,
        _cancel: cancelUrl,
        _callback: callbackUrl,
    });

    if (params.customer.phone) {
        queryParams.set('_phone', params.customer.phone);
    }

    return `${baseUrl}?${queryParams.toString()}`;
}

/**
 * Valida el paymentHash retornado por PixelPay en el redirect o webhook.
 * Según la especificación oficial del SDK de PixelPay:
 * MD5(order_id|auth_key|secret_key) === paymentHash
 */
export function verifyPixelPayPaymentHash(hash: string, orderId: string): boolean {
    if (!hash || !orderId) return false;
    const chain = [orderId, PIXELPAY_CONFIG.key, PIXELPAY_CONFIG.secret].join('|');
    const expectedHash = createHash('md5').update(chain).digest('hex');
    return hash.toLowerCase() === expectedHash.toLowerCase();
}
