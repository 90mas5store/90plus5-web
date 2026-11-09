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
        setVariants((prev) => prev.filter((v) => v.tempId !== tempId));
        setVariantToDelete(null);
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

    // ⚡ Presets de 1-Clic para Acelerar la Creación de Productos
    const applyAdultPreset = () => {
        const allSizeIds = new Set(filteredSizes.map((s) => s.id));
        const fanVariant: AdminVariant = {
            tempId: `preset_fan_${Date.now()}`,
            version: 'Fan',
            price: 1200,
            cost: 0,
            active: true,
            original_price: 0,
            active_original_price: false,
            sizeIds: allSizeIds,
        };
        const playerVariant: AdminVariant = {
            tempId: `preset_player_${Date.now() + 1}`,
            version: 'Player',
            price: 1500,
            cost: 0,
            active: true,
            original_price: 0,
            active_original_price: false,
            sizeIds: allSizeIds,
        };
        setVariants([fanVariant, playerVariant]);
    };

    const applySinglePreset = (version: string, defaultPrice = 1200) => {
        const allSizeIds = new Set(filteredSizes.map((s) => s.id));
        setVariants([
            {
                tempId: `preset_${version.toLowerCase()}_${Date.now()}`,
                version,
                price: defaultPrice,
                cost: 0,
                active: true,
                original_price: 0,
                active_original_price: false,
                sizeIds: allSizeIds,
            },
        ]);
    };

    return {
        variants,
        setVariants,
        addVariant,
        updateVariant,
        removeVariant,
        toggleVariantSize,
        applyAdultPreset,
        applySinglePreset,
        variantToDelete,
        setVariantToDelete,
    };
}
