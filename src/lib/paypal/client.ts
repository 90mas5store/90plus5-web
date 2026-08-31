/**
 * PayPal API Client (Sandbox & Live)
 * 90+5 Store
 */

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_MODE = (process.env.PAYPAL_MODE || 'sandbox').toLowerCase();

const PAYPAL_API_BASE = PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

let cachedAccessToken: string | null = null;
let tokenExpiry = 0;

/**
 * Obtiene un token OAuth 2.0 de PayPal (con caché en memoria).
 */
export async function getPayPalAccessToken(): Promise<string> {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        throw new Error('Las credenciales de PayPal (Client ID o Secret) no están configuradas en .env.local');
    }

    const now = Date.now();
    if (cachedAccessToken && now < tokenExpiry) {
        return cachedAccessToken;
    }

    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    if (!res.ok) {
        const errText = await res.text();
        console.error('[PayPal API] Error obteniendo access token:', errText);
        throw new Error(`Error de autenticación con PayPal (${res.status})`);
    }

    const data = await res.json();
    cachedAccessToken = data.access_token;
    tokenExpiry = now + (data.expires_in - 60) * 1000; // 60s de margen
    return cachedAccessToken as string;
}

/**
 * Crea una orden en PayPal en Dólares Estadounidenses (USD).
 */
export async function createPayPalOrder(params: {
    usdAmount: number;
    referenceId?: string;
    description?: string;
    items?: Array<{ name: string; quantity: number; unitPriceUsd: number }>;
}): Promise<{ id: string; status: string }> {
    const token = await getPayPalAccessToken();

    const formattedAmount = params.usdAmount.toFixed(2);

    const payload: any = {
        intent: 'CAPTURE',
        purchase_units: [
            {
                reference_id: params.referenceId || 'default',
                description: params.description || 'Compra en 90+5 Store',
                amount: {
                    currency_code: 'USD',
                    value: formattedAmount,
                },
            },
        ],
        application_context: {
            brand_name: '90+5 Store',
            landing_page: 'NO_PREFERENCE',
            user_action: 'PAY_NOW',
        },
    };

    const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
        console.error('[PayPal API] Error creando orden:', data);
        throw new Error(data.message || 'Error al generar la orden en PayPal');
    }

    return { id: data.id, status: data.status };
}

/**
 * Captura los fondos de una orden aprobada por el cliente.
 */
export async function capturePayPalOrder(orderId: string): Promise<{
    id: string;
    status: string;
    payerEmail?: string;
    payerName?: string;
    capturedAmountUsd?: number;
    captureId?: string;
}> {
    const token = await getPayPalAccessToken();

    const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    const data = await res.json();
    if (!res.ok) {
        console.error('[PayPal API] Error capturando orden:', data);
        throw new Error(data.message || 'Error al procesar el pago con PayPal');
    }

    const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
    const payer = data.payer;

    return {
        id: data.id,
        status: data.status,
        payerEmail: payer?.email_address,
        payerName: payer?.name ? `${payer.name.given_name || ''} ${payer.name.surname || ''}`.trim() : undefined,
        capturedAmountUsd: capture ? parseFloat(capture.amount?.value) : undefined,
        captureId: capture?.id,
    };
}
