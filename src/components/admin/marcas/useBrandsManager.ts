'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import useToastMessage from '@/hooks/useToastMessage';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Brand, BrandFormData } from './types';

export const PAGE_SIZE = 20;

export function generateBrandSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export function useBrandsManager() {
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;
    const toast = useToastMessage();
    const { isSuperAdmin } = useAdminRole();

    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const [formData, setFormData] = useState<BrandFormData>({
        name: '',
        slug: '',
        logo_url: '',
        active: true,
        sort_order: 0,
    });

    const fetchBrands = useCallback(
        async (p = page) => {
            setLoading(true);
            const from = (p - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;
            try {
                const { data, error, count } = await supabase
                    .from('brands')
                    .select('*', { count: 'exact' })
                    .is('deleted_at', null)
                    .order('sort_order', { ascending: true })
                    .order('name', { ascending: true })
                    .range(from, to);

                if (error) throw error;
                setBrands(data || []);
                setTotalCount(count ?? 0);
            } catch (error: unknown) {
                console.error('Error fetching brands:', error);
                toast.error('Error al cargar marcas');
            } finally {
                setLoading(false);
            }
        },
        [page, supabase, toast]
    );

    useEffect(() => {
        fetchBrands();
    }, [fetchBrands]);

    useEffect(() => {
        if (editingBrand) {
            setFormData({
                name: editingBrand.name,
                slug: editingBrand.slug || '',
                logo_url: editingBrand.logo_url || '',
                active: editingBrand.active,
                sort_order: editingBrand.sort_order ?? 0,
            });
        } else {
            setFormData({
                name: '',
                slug: '',
                logo_url: '',
                active: true,
                sort_order: brands.length + 1,
            });
        }
    }, [editingBrand, isModalOpen, brands.length]);

    const handleNameChange = (name: string) => {
        setFormData((prev) => ({
            ...prev,
            name,
            slug: !editingBrand ? generateBrandSlug(name) : prev.slug,
        }));
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('El nombre de la marca es obligatorio');
            return;
        }

        const slug = formData.slug.trim() || generateBrandSlug(formData.name);

        setSaving(true);
        try {
            const payload = {
                name: formData.name.trim(),
                slug,
                logo_url: formData.logo_url || null,
                active: formData.active,
                sort_order: formData.sort_order,
            };

            if (editingBrand) {
                const { error } = await supabase.from('brands').update(payload).eq('id', editingBrand.id);
                if (error) throw error;
                toast.success('Marca actualizada exitosamente');
            } else {
                const { error } = await supabase.from('brands').insert(payload);
                if (error) throw error;
                toast.success('Marca creada exitosamente');
            }

            setIsModalOpen(false);
            setEditingBrand(null);
            fetchBrands();
        } catch (error: unknown) {
            console.error('Error saving brand:', error);
            toast.error(`Error: ${(error as Error).message}`);
        } finally {
            setSaving(false);
        }
    };

    const executeDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from('brands')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            toast.success('Marca movida a la papelera');
            setBrands((prev) => prev.filter((b) => b.id !== id));
        } catch (error: unknown) {
            console.error('Error deleting brand:', error);
            toast.error('Error al eliminar');
        }
    };

    const filteredBrands = useMemo(() => {
        return brands.filter(
            (b) =>
                b.name.toLowerCase().includes(search.toLowerCase()) ||
                (b.slug && b.slug.toLowerCase().includes(search.toLowerCase()))
        );
    }, [brands, search]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return {
        brands: filteredBrands,
        loading,
        search,
        setSearch,
        page,
        setPage,
        totalCount,
        totalPages,
        isModalOpen,
        setIsModalOpen,
        editingBrand,
        setEditingBrand,
        saving,
        deleteTarget,
        setDeleteTarget,
        formData,
        setFormData,
        handleNameChange,
        handleSave,
        executeDelete,
        isSuperAdmin,
    };
}

