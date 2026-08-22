import { describe, it, expect } from 'vitest';
import {
    sanitizeText,
    createOrderSchema,
    discountValidateSchema,
    paymentProofSchema,
    adminInviteSchema,
    discountCodeAdminSchema,
} from '@/lib/validations';

describe('Backend Data Validations', () => {
    describe('sanitizeText', () => {
        it('elimina etiquetas script y código HTML', () => {
            const input = 'Juan<script>alert("hack")</script> <b>Pérez</b>';
            const clean = sanitizeText(input);
            expect(clean).toBe('Juan Pérez');
        });

        it('mantiene texto limpio sin alteraciones', () => {
            const input = 'Carlos Mendoza';
            expect(sanitizeText(input)).toBe('Carlos Mendoza');
        });
    });

    describe('createOrderSchema', () => {
        const validItem = {
            product_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            variant_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
            size_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
            quantity: 2,
            personalization_type: 'none' as const,
        };

        const validOrderPayload = {
            customer_name: 'Maria López',
            customer_email: 'maria@example.com',
            customer_phone: '+50499887766',
            shipping_department: 'Francisco Morazán',
            shipping_municipality: 'Tegucigalpa',
            shipping_address: 'Col. Palmira, Avenida República de Chile',
            payment_method: 'transferencia' as const,
            items: [validItem],
            idempotency_key: 'key-123456789',
        };

        it('valida exitosamente un pedido correcto', () => {
            const result = createOrderSchema.safeParse(validOrderPayload);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.customer_name).toBe('Maria López');
                expect(result.data.customer_email).toBe('maria@example.com');
            }
        });

        it('normaliza teléfonos de 8 dígitos añadiendo el prefijo +504', () => {
            const payload = { ...validOrderPayload, customer_phone: '99887766' };
            // Simular pre-procesamiento del handler
            if (/^[0-9]{8}$/.test(payload.customer_phone)) {
                payload.customer_phone = `+504${payload.customer_phone}`;
            }
            const result = createOrderSchema.safeParse(payload);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.customer_phone).toBe('+50499887766');
            }
        });

        it('rechaza correos electrónicos inválidos', () => {
            const payload = { ...validOrderPayload, customer_email: 'correo-invalido' };
            const result = createOrderSchema.safeParse(payload);
            expect(result.success).toBe(false);
        });

        it('rechaza cantidades de producto menores a 1 o mayores a 99', () => {
            const invalidItem = { ...validItem, quantity: 0 };
            const payload = { ...validOrderPayload, items: [invalidItem] };
            const result = createOrderSchema.safeParse(payload);
            expect(result.success).toBe(false);
        });

        it('rechaza UUIDs malformados en los artículos', () => {
            const invalidItem = { ...validItem, product_id: 'not-a-uuid' };
            const payload = { ...validOrderPayload, items: [invalidItem] };
            const result = createOrderSchema.safeParse(payload);
            expect(result.success).toBe(false);
        });

        it('sanitiza el nombre personalizado del producto', () => {
            const customItem = {
                ...validItem,
                personalization_type: 'custom' as const,
                custom_number: 10,
                custom_name: 'MESSI <script>xss()</script>',
            };
            const payload = { ...validOrderPayload, items: [customItem] };
            const result = createOrderSchema.safeParse(payload);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.items[0].custom_name).toBe('MESSI');
            }
        });

        it('rechaza métodos de pago no autorizados', () => {
            const payload = { ...validOrderPayload, payment_method: 'paypal' as any };
            const result = createOrderSchema.safeParse(payload);
            expect(result.success).toBe(false);
        });
    });

    describe('discountValidateSchema', () => {
        it('convierte el código de descuento a mayúsculas', () => {
            const payload = {
                code: 'descuento10',
                email: 'test@example.com',
                items: [{
                    product_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
                    variant_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
                    quantity: 1,
                }],
            };
            const result = discountValidateSchema.safeParse(payload);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.code).toBe('DESCUENTO10');
            }
        });
    });

    describe('paymentProofSchema', () => {
        it('rechaza orderId si no es un UUID válido', () => {
            const result = paymentProofSchema.safeParse({ orderId: '123-abc' });
            expect(result.success).toBe(false);
        });

        it('acepta orderId en formato UUID válido', () => {
            const result = paymentProofSchema.safeParse({ orderId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' });
            expect(result.success).toBe(true);
        });
    });

    describe('discountCodeAdminSchema', () => {
        it('rechaza porcentajes de descuento mayores a 100%', () => {
            const payload = {
                code: 'PROMO150',
                discount_pct: 150,
            };
            const result = discountCodeAdminSchema.safeParse(payload);
            expect(result.success).toBe(false);
        });

        it('rechaza porcentajes menores a 1%', () => {
            const payload = {
                code: 'PROMO0',
                discount_pct: 0,
            };
            const result = discountCodeAdminSchema.safeParse(payload);
            expect(result.success).toBe(false);
        });
    });
});
