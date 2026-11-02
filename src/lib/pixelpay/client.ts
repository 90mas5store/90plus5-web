import { createHmac, createHash, timingSafeEqual } from 'crypto';
import { PIXELPAY_CONFIG } from './config';
import { SITE_URL } from '@/lib/config/site';

export interface PixelPayCustomer {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
}

export interface PixelPayHostedOrderParams {
    orderId: string;
    amount: number;
    currency?: 'HNL' | 'USD';
    customer: PixelPayCustomer;
    paymentType?: 'deposit' | 'full';
    shippingAmount?: number;
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
 * Devuelve el endpoint Hosted activo según el ambiente configurado.
 */
export function getPixelPayHostedEndpoint(): string {
    const isProd = PIXELPAY_CONFIG.env === 'live' || PIXELPAY_CONFIG.env === 'production';
    return isProd ? PIXELPAY_CONFIG.productionEndpoint : PIXELPAY_CONFIG.sandboxEndpoint;
}

/**
 * Dominio de la plataforma PixelPay del comercio (`app_url`) usado en la firma.
 * Según la documentación oficial es el dominio de PixelPay (ej. `https://pixelpay.app`),
 * NO la URL de la tienda.
 */
export function getPixelPayAppUrl(): string {
    const raw = PIXELPAY_CONFIG.appUrl || new URL(getPixelPayHostedEndpoint()).origin;
    return raw.replace(/\/$/, '');
}

/**
 * Construye la URL completa del Hosted Checkout de PixelPay con todos los parámetros
 * requeridos y la firma criptográfica.
 */
export function buildPixelPayHostedUrl(params: PixelPayHostedOrderParams): string {
    const baseUrl = getPixelPayHostedEndpoint();
    const siteUrl = (SITE_URL || 'https://90mas5.store').replace(/\/$/, '');

    // Separar nombre y apellido del cliente
    const nameParts = params.customer.name.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Cliente';
    const lastName = nameParts.slice(1).join(' ') || 'General';

    // Generar firma de seguridad (app_key|order_id|app_url)
    const signature = generatePixelPaySignature(
        PIXELPAY_CONFIG.key,
        params.orderId,
        getPixelPayAppUrl(),
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
    if (params.customer.address) {
        queryParams.set('_address', params.customer.address.slice(0, 120));
    }
    if (params.customer.city) {
        queryParams.set('_city', params.customer.city.slice(0, 120));
    }
    if (params.customer.state) {
        queryParams.set('_state', params.customer.state.slice(0, 120));
    }
    if (params.customer.country) {
        queryParams.set('_country', params.customer.country);
    }
    if (params.shippingAmount !== undefined) {
        queryParams.set('_shipping_amount', params.shippingAmount.toFixed(2));
    }

    return `${baseUrl}?${queryParams.toString()}`;
}

/**
 * Valida el paymentHash retornado por PixelPay en el redirect o webhook.
 * Según la especificación oficial del SDK de PixelPay:
 * MD5(order_id|auth_key|secret_key) === paymentHash
 */
export function verifyPixelPayPaymentHash(hash: string, orderId: string): boolean {
    if (typeof hash !== 'string' || typeof orderId !== 'string' || !hash || !orderId) return false;
    const chain = [orderId, PIXELPAY_CONFIG.key, PIXELPAY_CONFIG.secret].join('|');
    const expected = Buffer.from(createHash('md5').update(chain).digest('hex'));
    const received = Buffer.from(hash.toLowerCase());
    // Comparación en tiempo constante para evitar ataques de timing
    return expected.length === received.length && timingSafeEqual(expected, received);
}

export interface PixelPayCallbackData {
    orderId: string | null;
    paymentHash: string | null;
    status: string | null;
    paymentUuid: string | null;
    amount: number | null;
    cardIssuer?: string | null;
    authorizationId?: string | null;
    cardBrand?: string | null;
}

/**
 * Normaliza el cuerpo del webhook `_callback` de PixelPay Hosted Payment.
 * Formato oficial: { order, ref, uuid, status: "paid", amount, payment_hash, authorization_id, card_issuer, card_brand, ... }
 */
export function parsePixelPayCallback(payload: Record<string, unknown>): PixelPayCallbackData {
    const str = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : typeof v === 'number' ? String(v) : null);
    const amountRaw = payload.amount;
    const amount = typeof amountRaw === 'number' ? amountRaw : typeof amountRaw === 'string' ? Number(amountRaw) : NaN;

    return {
        orderId: str(payload.order) ?? str(payload.ref) ?? str(payload._order_id) ?? str(payload.order_id),
        paymentHash: str(payload.payment_hash) ?? str(payload.paymentHash),
        status: str(payload.status)?.toLowerCase() ?? null,
        paymentUuid: str(payload.uuid),
        amount: Number.isFinite(amount) ? amount : null,
        cardIssuer: str(payload.card_issuer),
        authorizationId: str(payload.authorization_id) ?? str(payload.auth_code) ?? str(payload.transaction_id),
        cardBrand: str(payload.card_brand),
    };
}
