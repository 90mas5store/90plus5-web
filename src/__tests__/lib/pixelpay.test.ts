import { describe, it, expect } from 'vitest';
import { 
    generatePixelPaySignature, 
    buildPixelPayHostedUrl, 
    verifyPixelPayPaymentHash,
    getPixelPayAppUrl,
    parsePixelPayCallback
} from '@/lib/pixelpay/client';
import { PIXELPAY_CONFIG } from '@/lib/pixelpay/config';
import { createHash } from 'crypto';

describe('PixelPay Integration Client', () => {
    it('generates a valid HMAC SHA3-512 signature', () => {
        const appKey = '1234567890';
        const orderId = 'ORD-TEST-001';
        const appUrl = 'https://90mas5.store';
        const secretKey = '@s4ndb0x-abcd-1234-n1l4-p1x3l';

        const signature = generatePixelPaySignature(appKey, orderId, appUrl, secretKey);

        expect(typeof signature).toBe('string');
        // SHA3-512 hex digest is 128 characters long
        expect(signature.length).toBe(128);
        expect(/^[a-f0-9]{128}$/.test(signature)).toBe(true);
    });

    it('builds a complete PixelPay Hosted URL with required query parameters', () => {
        const urlString = buildPixelPayHostedUrl({
            orderId: 'ORD-999',
            amount: 1500.5,
            currency: 'HNL',
            customer: {
                name: 'Carlos Mendoza',
                email: 'carlos@example.com',
                phone: '+50499887766',
            },
            paymentType: 'deposit',
        });

        const url = new URL(urlString);
        expect(url.origin + url.pathname).toBe(PIXELPAY_CONFIG.sandboxEndpoint);
        expect(url.searchParams.get('_key')).toBe(PIXELPAY_CONFIG.key);
        expect(url.searchParams.get('_order_id')).toBe('ORD-999');
        expect(url.searchParams.get('_amount')).toBe('1500.50');
        expect(url.searchParams.get('_currency')).toBe('HNL');
        expect(url.searchParams.get('_first_name')).toBe('Carlos');
        expect(url.searchParams.get('_last_name')).toBe('Mendoza');
        expect(url.searchParams.get('_email')).toBe('carlos@example.com');
        expect(url.searchParams.get('_phone')).toBe('+50499887766');
        expect(url.searchParams.get('_client_signature')).toBeDefined();
        expect(url.searchParams.get('_complete')).toContain('/checkout/done');
        expect(url.searchParams.get('_cancel')).toContain('/checkout');
        expect(url.searchParams.get('_callback')).toContain('/api/checkout/pixelpay/webhook');
    });

    it('correctly verifies a valid paymentHash', () => {
        const orderId = 'ORD-HASH-123';
        const chain = [orderId, PIXELPAY_CONFIG.key, PIXELPAY_CONFIG.secret].join('|');
        const validHash = createHash('md5').update(chain).digest('hex');

        expect(verifyPixelPayPaymentHash(validHash, orderId)).toBe(true);
        expect(verifyPixelPayPaymentHash(validHash.toUpperCase(), orderId)).toBe(true); // Case-insensitive
    });

    it('rejects an invalid paymentHash', () => {
        expect(verifyPixelPayPaymentHash('invalid_hash_value_123', 'ORD-HASH-123')).toBe(false);
        expect(verifyPixelPayPaymentHash('', 'ORD-HASH-123')).toBe(false);
    });

    it('matches the official documentation signature example (ORDER-8888)', () => {
        const signature = generatePixelPaySignature(
            '1234567890',
            'ORDER-8888',
            'https://pixelpay.dev',
            '@s4ndb0x-abcd-1234-n1l4-p1x3l'
        );
        // La documentación muestra el resultado abreviado: `688084a6...e852ee2a`
        expect(signature.startsWith('688084a6')).toBe(true);
        expect(signature.endsWith('e852ee2a')).toBe(true);
    });

    it('signs with the PixelPay platform domain (app_url), not the store URL', () => {
        const url = new URL(buildPixelPayHostedUrl({
            orderId: 'ORD-SIGN-1',
            amount: 1,
            customer: { name: 'Ana Lopez', email: 'ana@example.com' },
        }));
        const expected = generatePixelPaySignature(
            PIXELPAY_CONFIG.key,
            'ORD-SIGN-1',
            getPixelPayAppUrl(),
            PIXELPAY_CONFIG.secret
        );
        expect(getPixelPayAppUrl()).toBe(new URL(PIXELPAY_CONFIG.sandboxEndpoint).origin);
        expect(url.searchParams.get('_client_signature')).toBe(expected);
    });

    it('parses the official _callback payload format', () => {
        const parsed = parsePixelPayCallback({
            ref: '4oRJCUc0',
            uuid: 'P-a039903a-449c-4911-bf43-85b776284e97',
            status: 'paid',
            amount: 1,
            order: '4oRJCUc0',
            payment_hash: '0b3de9ea8cd10f2494360bfc136c77e6',
            card_issuer: 'BAC Credomatic',
            authorization_id: 'AUTH-123456',
            card_brand: 'visa',
        });
        expect(parsed).toEqual({
            orderId: '4oRJCUc0',
            paymentHash: '0b3de9ea8cd10f2494360bfc136c77e6',
            status: 'paid',
            paymentUuid: 'P-a039903a-449c-4911-bf43-85b776284e97',
            amount: 1,
            cardIssuer: 'BAC Credomatic',
            authorizationId: 'AUTH-123456',
            cardBrand: 'visa',
        });
    });
});
