'use client';

import { useState } from 'react';
import { AdminVariant, AdminSize } from '@/types/adminProduct';

export function useProductVariantsManager(filteredSizes: AdminSize[]) {
    const [variants, setVariants] = useState<AdminVariant[]>([]);
    const [variantToDelete, setVariantToDelete] = useState<string | null>(null);

    const addVariant = () => {
        const newVariant: AdminVariant = {
            tempId: `new_${Date.now()}`,
            version: 'Player',
            price: 1400,
            cost: 0,
            active: true,
            original_price: 0,
            active_original_price: false,
            sizeIds: new Set(filteredSizes.map((s) => s.id)),
        };
        setVariants((prev) => [...prev, newVariant]);
    };

    const updateVariant = (tempId: string, field: keyof AdminVariant, value: unknown) => {
        setVariants((prev) =>
            prev.map((v) => (v.tempId === tempId ? { ...v, [field]: value } : v))
        );
    };

    const removeVariant = (tempId: string) => {
        setVariantToDelete(tempId);
    };

    const toggleVariantSize = (tempId: string, sizeId: string) => {
        setVariants((prev) =>
            prev.map((v) => {
                if (v.tempId !== tempId) return v;
                const nextSizes = new Set(v.sizeIds);
                if (nextSizes.has(sizeId)) nextSizes.delete(sizeId);
                else nextSizes.add(sizeId);
                return { ...v, sizeIds: nextSizes };
            })
        );
    };

    return {
        variants,
        setVariants,
        addVariant,
        updateVariant,
        removeVariant,
        toggleVariantSize,
        variantToDelete,
        setVariantToDelete,
    };
}
