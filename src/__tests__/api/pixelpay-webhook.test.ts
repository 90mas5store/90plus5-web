import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createHash } from 'crypto';

// Estado simulado de Supabase
const db = {
    order: null as null | { id: string; order_number: string; status: string },
    payment: null as null | { id: string; amount: number },
    updates: [] as Array<{ table: string; values: Record<string, unknown>; filters: Record<string, unknown> }>,
};

const sendEmail = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/email', () => ({ sendOrderStatusUpdateEmail: (...args: unknown[]) => sendEmail(...args) }));

vi.mock('@/lib/supabase/admin', () => ({
    createAdminClient: () => ({
        from: (table: string) => {
            const builder: any = {
                select: () => builder,
                eq: () => builder,
                gte: () => builder,
                lte: () => builder,
                maybeSingle: async () => ({
                    data: table === 'orders' ? db.order : db.payment,
                    error: null,
                }),
                update: (values: Record<string, unknown>) => {
                    const filters: Record<string, unknown> = {};
                    db.updates.push({ table, values, filters });
                    // Simula UPDATE condicional: solo afecta filas que cumplan los filtros
                    const rows = () => {
                        const o = db.order;
                        const matches = o && (filters.status === undefined || filters.status === o.status);
                        if (table === 'orders' && matches) o!.status = values.status as string;
                        return matches ? [{ id: o!.id, customer_name: 'Ana', customer_email: 'ana@example.com' }] : [];
                    };
                    const chain: any = {
                        eq: (col: string, val: unknown) => { filters[col] = val; return chain; },
                        select: async () => ({ data: rows(), error: null }),
                        then: (r: any) => r({ error: null }),
                    };
                    return chain;
                },
            };
            return builder;
        },
    }),
}));

import { POST } from '@/app/api/checkout/pixelpay/webhook/route';
import { PIXELPAY_CONFIG } from '@/lib/pixelpay/config';

const hashFor = (orderId: string) =>
    createHash('md5').update([orderId, PIXELPAY_CONFIG.key, PIXELPAY_CONFIG.secret].join('|')).digest('hex');

const callback = (body: Record<string, unknown>) =>
    new NextRequest('http://localhost:3000/api/checkout/pixelpay/webhook', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    });

// Cuerpo con el formato oficial del `_callback` de PixelPay Hosted Payment
const officialBody = (orderId: string, overrides: Record<string, unknown> = {}) => ({
    ref: orderId,
    uuid: 'P-a039903a-449c-4911-bf43-85b776284e97',
    status: 'paid',
    currency: 'HNL',
    amount: 750,
    order: orderId,
    payment_hash: hashFor(orderId),
    ...overrides,
});

describe('PixelPay Webhook (/api/checkout/pixelpay/webhook)', () => {
    beforeEach(() => {
        db.order = { id: 'uuid-1', order_number: 'A1B2C3D4', status: 'pending_payment_50' };
        db.payment = { id: 'pay-1', amount: 750 };
        db.updates = [];
        sendEmail.mockClear();
    });

    it('confirma la orden con el payload oficial (campo `order`)', async () => {
        const res = await POST(callback(officialBody('A1B2C3D4')));
        expect(res.status).toBe(200);
        expect(await res.json()).toMatchObject({ success: true, order_id: 'uuid-1' });

        const orderUpdate = db.updates.find(u => u.table === 'orders');
        expect(orderUpdate?.values.status).toBe('deposit_paid');
        // Solo avanza órdenes que siguen en el estado inicial
        expect(orderUpdate?.filters.status).toBe('pending_payment_50');
        expect(db.updates.find(u => u.table === 'payments')?.values.status).toBe('verified');
        expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
            customerEmail: 'ana@example.com',
            orderId: 'uuid-1',
            status: 'deposit_paid',
        }));
    });

    it('no modifica órdenes canceladas', async () => {
        db.order!.status = 'cancelled';
        const res = await POST(callback(officialBody('A1B2C3D4')));
        expect(res.status).toBe(200);
        expect(db.updates).toHaveLength(0);
        expect(sendEmail).not.toHaveBeenCalled();
    });

    it('rechaza con 403 si falta el payment_hash', async () => {
        const res = await POST(callback(officialBody('A1B2C3D4', { payment_hash: undefined })));
        expect(res.status).toBe(403);
        expect(db.updates).toHaveLength(0);
    });

    it('rechaza con 403 si el payment_hash es inválido', async () => {
        const res = await POST(callback(officialBody('A1B2C3D4', { payment_hash: hashFor('OTRA-ORDEN') })));
        expect(res.status).toBe(403);
        expect(db.updates).toHaveLength(0);
    });

    it('rechaza con 400 si el order es inválido (evita inyección en filtros)', async () => {
        const evil = 'x,id.neq.0';
        const res = await POST(callback(officialBody(evil)));
        expect(res.status).toBe(400);
        expect(db.updates).toHaveLength(0);
    });

    it('ignora callbacks cuyo status no es `paid`', async () => {
        const res = await POST(callback(officialBody('A1B2C3D4', { status: 'failed' })));
        expect(res.status).toBe(200);
        expect(db.updates).toHaveLength(0);
    });

    it('es idempotente si la orden ya fue confirmada', async () => {
        db.order!.status = 'deposit_paid';
        const res = await POST(callback(officialBody('A1B2C3D4')));
        expect(res.status).toBe(200);
        expect((await res.json()).message).toBe('Already processed');
        expect(db.updates).toHaveLength(0);
    });

    it('no confirma si el monto no coincide con el cobro registrado', async () => {
        const res = await POST(callback(officialBody('A1B2C3D4', { amount: 1 })));
        expect(res.status).toBe(200);
        expect((await res.json()).warning).toContain('Amount mismatch');
        expect(db.updates).toHaveLength(0);
    });

    it('responde 200 sin cambios si la orden no existe (evita reintentos)', async () => {
        db.order = null;
        const res = await POST(callback(officialBody('A1B2C3D4')));
        expect(res.status).toBe(200);
        expect(db.updates).toHaveLength(0);
    });
});

