'use client';

import { useState, useCallback } from 'react';
import { DiscountState } from '@/types/checkout';
import { CartItem } from '@/context/CartContext';

export function useDiscountCoupon() {
    const [discountCode, setDiscountCode] = useState('');
    const [discountState, setDiscountState] = useState<DiscountState | null>(null);
    const [discountLoading, setDiscountLoading] = useState(false);
    const [discountError, setDiscountError] = useState<string | null>(null);

    const applyDiscount = useCallback(async (customerEmail: string, items: CartItem[]) => {
        if (!discountCode.trim()) return;
        if (!customerEmail || !customerEmail.includes('@')) {
            setDiscountError('Ingresa tu correo primero para validar el código');
            return;
        }

        setDiscountLoading(true);
        setDiscountError(null);

        try {
            const itemsPayload = items.map((item) => ({
                product_id: item.id,
                variant_id: item.variant_id || '',
                quantity: item.cantidad,
            }));

            const res = await fetch('/api/discount/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: discountCode,
                    email: customerEmail,
                    items: itemsPayload,
                }),
            });

            const data = await res.json();
            if (data.valid) {
                setDiscountState({
                    pct: data.discount_pct,
                    amount: data.discount_amount,
                    scopeDesc: data.scope_description,
                });
            } else {
                setDiscountError(data.message || 'Código inválido');
                setDiscountState(null);
            }
        } catch {
            setDiscountError('Error al validar el código');
        } finally {
            setDiscountLoading(false);
        }
    }, [discountCode]);

    const removeDiscount = useCallback(() => {
        setDiscountState(null);
        setDiscountCode('');
        setDiscountError(null);
    }, []);

    return {
        discountCode,
        setDiscountCode,
        discountState,
        discountLoading,
        discountError,
        setDiscountError,
        applyDiscount,
        removeDiscount,
    };
}
