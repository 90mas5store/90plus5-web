'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import useToastMessage from '@/hooks/useToastMessage';
import { useAdminRole } from '@/hooks/useAdminRole';
import { clearProductCache } from '@/lib/api';
import { revalidateConfig } from '@/app/admin/actions';
import { League, Category, LeagueFormData } from './types';

export const PAGE_SIZE = 20;

export function useLeaguesManager() {
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;
    const toast = useToastMessage();
    const { isSuperAdmin } = useAdminRole();

    const [leagues, setLeagues] = useState<League[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLeague, setEditingLeague] = useState<League | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const [formData, setFormData] = useState<LeagueFormData>({
        name: '',
        slug: '',
        image_url: '',
        category_id: '',
        active: true,
        show_in_home: true,
        sort_order: 0,
        season: '',
    });

    const fetchLeagues = useCallback(
        async (p = page) => {
            setLoading(true);
            const from = (p - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;
            try {
                const { data, error, count } = await supabase
                    .from('leagues')
                    .select(`*, categories (name)`, { count: 'exact' })
                    .is('deleted_at', null)
                    .order('sort_order', { ascending: true })
                    .range(from, to);

                if (error) throw error;
                setLeagues(data || []);
                setTotalCount(count ?? 0);
            } catch (error: unknown) {
                console.error('Error fetching leagues:', error);
                toast.error('Error al cargar ligas');
            } finally {
                setLoading(false);
            }
        },
        [page, supabase, toast]
    );

    const fetchCategories = useCallback(async () => {
        try {
            const { data } = await supabase.from('categories').select('id, name').order('name');
            if (data) setCategories(data);
        } catch (e) {
            console.warn('Error fetching categories:', e);
        }
    }, [supabase]);

    useEffect(() => {
        fetchLeagues();
        fetchCategories();
    }, [fetchLeagues, fetchCategories]);

    useEffect(() => {
        if (editingLeague) {
            setFormData({
                name: editingLeague.name,
                slug: editingLeague.slug,
                image_url: editingLeague.image_url || '',
                category_id: editingLeague.category_id || '',
                active: editingLeague.active,
                show_in_home: editingLeague.show_in_home ?? editingLeague.show_on_home ?? true,
                sort_order: editingLeague.sort_order || 0,
                season: editingLeague.season || '',
            });
        } else {
            setFormData({
                name: '',
                slug: '',
                image_url: '',
                category_id: '',
                active: true,
                show_in_home: true,
                sort_order: leagues.length + 1,
                season: '',
            });
        }
    }, [editingLeague, isModalOpen, leagues.length]);

    const handleNameChange = (val: string) => {
        setFormData((prev) => ({
            ...prev,
            name: val,
            slug: !editingLeague ? val.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') : prev.slug,
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
                image_url: formData.image_url,
                category_id: formData.category_id || null,
                active: formData.active,
                show_in_home: formData.show_in_home,
                sort_order: formData.sort_order,
                season: formData.season.trim(),
            };

            if (editingLeague) {
                const { error } = await supabase.from('leagues').update(payload).eq('id', editingLeague.id);
                if (error) throw error;
                toast.success('Liga actualizada exitosamente');
            } else {
                const { error } = await supabase.from('leagues').insert(payload);
                if (error) throw error;
                toast.success('Liga creada exitosamente');
            }

            setIsModalOpen(false);
            setEditingLeague(null);
            fetchLeagues();
            clearProductCache('config');
            await revalidateConfig();
        } catch (error: unknown) {
            console.error('Error saving league:', error);
            toast.error(`Error: ${(error as Error).message}`);
        } finally {
            setSaving(false);
        }
    };

    const executeDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from('leagues')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            toast.success('Liga movida a la papelera');
            setLeagues((prev) => prev.filter((c) => c.id !== id));
            clearProductCache('config');
            await revalidateConfig();
        } catch (error: unknown) {
            console.error('Error deleting league:', error);
            toast.error('Error al eliminar');
        }
    };

    const filteredLeagues = useMemo(() => {
        return leagues.filter(
            (l) =>
                l.name.toLowerCase().includes(search.toLowerCase()) ||
                l.slug.toLowerCase().includes(search.toLowerCase())
        );
    }, [leagues, search]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return {
        leagues: filteredLeagues,
        categories,
        loading,
        search,
        setSearch,
        page,
        setPage,
        totalCount,
        totalPages,
        isModalOpen,
        setIsModalOpen,
        editingLeague,
        setEditingLeague,
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

