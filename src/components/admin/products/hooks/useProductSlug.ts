'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { buildProductSlug, generateUniqueSlug } from '@/lib/utils/slug';
import { CatalogItem, AdminProductFormData } from '@/types/adminProduct';

interface UseProductSlugProps {
    productId?: string;
    formData: AdminProductFormData;
    teams: CatalogItem[];
    brands: CatalogItem[];
    categories: CatalogItem[];
    onSlugGenerated: (slug: string) => void;
    initialAutoSlug?: boolean;
}

export function useProductSlug({
    productId = '',
    formData,
    teams,
    brands,
    categories,
    onSlugGenerated,
    initialAutoSlug = false,
}: UseProductSlugProps) {
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;

    const [isAutoSlug, setIsAutoSlug] = useState(initialAutoSlug);
    const [slugChecking, setSlugChecking] = useState(false);
    const [slugIsUnique, setSlugIsUnique] = useState<boolean | null>(null);

    // Auto-generación de slug
    useEffect(() => {
        if (!isAutoSlug) return;
        const teamName = teams.find((t) => t.id === formData.team_id)?.name;
        const brandName = brands.find((b) => b.id === formData.brand_id)?.name;
        const categoryName = categories.find((c) => c.id === formData.category_id)?.name;

        const autoSlug = buildProductSlug({
            teamName,
            brandName,
            name: formData.name,
            season: formData.season,
            categoryName,
            gender: formData.gender,
        });

        onSlugGenerated(autoSlug);
    }, [
        formData.name,
        formData.team_id,
        formData.brand_id,
        formData.category_id,
        formData.season,
        formData.gender,
        teams,
        brands,
        categories,
        isAutoSlug,
        onSlugGenerated,
    ]);

    // Chequeo de unicidad con debounce
    useEffect(() => {
        if (!formData.slug) {
            setSlugIsUnique(null);
            return;
        }

        const timer = setTimeout(async () => {
            setSlugChecking(true);
            try {
                const uniqueSlug = await generateUniqueSlug(supabase, formData.slug, productId);
                setSlugIsUnique(uniqueSlug === formData.slug);
            } catch (err) {
                console.error('Error verificando slug:', err);
            } finally {
                setSlugChecking(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [formData.slug, productId, supabase]);

    return {
        isAutoSlug,
        setIsAutoSlug,
        slugChecking,
        slugIsUnique,
    };
}
