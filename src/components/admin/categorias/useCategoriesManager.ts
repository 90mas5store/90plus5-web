'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import useToastMessage from '@/hooks/useToastMessage';
import { useAdminRole } from '@/hooks/useAdminRole';
import { clearProductCache } from '@/lib/api';
import { revalidateConfig } from '@/app/admin/actions';
import { Category, CategoryFormData } from './types';

export const PAGE_SIZE = 20;

export function useCategoriesManager() {
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;
    const toast = useToastMessage();
    const { isSuperAdmin } = useAdminRole();

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const [formData, setFormData] = useState<CategoryFormData>({
        name: '',
        slug: '',
        icon_url: '',
        active: true,
        order_index: 0,
        hero_image_position_desktop: '50% 40%',
        hero_image_position_mobile: '50% 50%',
    });

    const fetchCategories = useCallback(
        async (p = page) => {
            setLoading(true);
            const from = (p - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;
            try {
                const { data, error, count } = await supabase
                    .from('categories')
                    .select('*', { count: 'exact' })
                    .is('deleted_at', null)
                    .order('order_index', { ascending: true })
                    .range(from, to);

                if (error) throw error;
                setCategories(data || []);
                setTotalCount(count ?? 0);
            } catch (error: unknown) {
                console.error('Error fetching categories:', error);
                toast.error('Error al cargar categorías');
            } finally {
                setLoading(false);
            }
        },
        [page, supabase, toast]
    );

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        if (editingCategory) {
            setFormData({
                name: editingCategory.name,
                slug: editingCategory.slug,
                icon_url: editingCategory.icon_url || '',
                active: editingCategory.active,
                order_index: editingCategory.order_index || 0,
                hero_image_position_desktop: editingCategory.hero_image_position_desktop || '50% 40%',
                hero_image_position_mobile: editingCategory.hero_image_position_mobile || '50% 50%',
            });
        } else {
            setFormData({
                name: '',
                slug: '',
                icon_url: '',
                active: true,
                order_index: categories.length + 1,
                hero_image_position_desktop: '50% 40%',
                hero_image_position_mobile: '50% 50%',
            });
        }
    }, [editingCategory, isModalOpen, categories.length]);

    const handleNameChange = (val: string) => {
        setFormData((prev) => ({
            ...prev,
            name: val,
            slug: !editingCategory ? val.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') : prev.slug,
        }));
    };

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.slug.trim()) {
            toast.error('Nombre y Slug son requeridos');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: formData.name.trim(),
                slug: formData.slug.trim(),
                icon_url: formData.icon_url,
                active: formData.active,
                order_index: formData.order_index,
                hero_image_position_desktop: formData.hero_image_position_desktop,
                hero_image_position_mobile: formData.hero_image_position_mobile,
            };

            if (editingCategory) {
                const { error } = await supabase.from('categories').update(payload).eq('id', editingCategory.id);
                if (error) throw error;
                toast.success('Categoría actualizada exitosamente');
            } else {
                const { error } = await supabase.from('categories').insert(payload);
                if (error) throw error;
                toast.success('Categoría creada exitosamente');
            }

            setIsModalOpen(false);
            setEditingCategory(null);
            fetchCategories();
            clearProductCache('config');
            await revalidateConfig();
        } catch (error: unknown) {
            console.error('Error saving category:', error);
            toast.error(`Error: ${(error as Error).message}`);
        } finally {
            setSaving(false);
        }
    };

    const executeDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from('categories')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            toast.success('Categoría movida a la papelera');
            setCategories((prev) => prev.filter((c) => c.id !== id));
            clearProductCache('config');
            await revalidateConfig();
        } catch (error: unknown) {
            console.error('Error deleting category:', error);
            toast.error('Error al eliminar');
        }
    };

    const filteredCategories = useMemo(() => {
        return categories.filter(
            (c) =>
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.slug.toLowerCase().includes(search.toLowerCase())
        );
    }, [categories, search]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return {
        categories: filteredCategories,
        loading,
        search,
        setSearch,
        page,
        setPage,
        totalCount,
        totalPages,
        isModalOpen,
        setIsModalOpen,
        editingCategory,
        setEditingCategory,
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

