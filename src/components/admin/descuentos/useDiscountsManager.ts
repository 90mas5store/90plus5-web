'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import useToastMessage from '@/hooks/useToastMessage';
import {
    createDiscountCode,
    updateDiscountCode,
    toggleDiscountCode,
    deleteDiscountCode,
} from '@/app/admin/discount-actions';
import { DiscountCode, UsageRow, CatalogItem, DiscountFormData, DiscountTab } from './types';

export function generateRandomCode(length = 8): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

const EMPTY_FORM: DiscountFormData = {
    code: '',
    description: '',
    discount_pct: 10,
    category_ids: [],
    league_ids: [],
    team_ids: [],
    max_uses: '',
    expires_at: '',
    active: true,
};

export function useDiscountsManager() {
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;
    const toast = useToastMessage() as {
        success: (m: string) => void;
        error: (m: string) => void;
        info: (m: string) => void;
    };

    const [tab, setTab] = useState<DiscountTab>('codes');
    const [codes, setCodes] = useState<DiscountCode[]>([]);
    const [usage, setUsage] = useState<UsageRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    // Catálogos auxiliares para restricciones de alcance
    const [categories, setCategories] = useState<CatalogItem[]>([]);
    const [leagues, setLeagues] = useState<CatalogItem[]>([]);
    const [teams, setTeams] = useState<CatalogItem[]>([]);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<DiscountFormData>({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);

    // Delete confirm dialog state
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; code: string } | null>(null);

    // Audit filter
    const [auditFilter, setAuditFilter] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [codesRes, usageRes] = await Promise.all([
                supabase.from('discount_codes').select('*').order('created_at', { ascending: false }),
                supabase
                    .from('discount_code_usage')
                    .select('*, discount_codes(code, discount_pct)')
                    .order('created_at', { ascending: false })
                    .limit(200),
            ]);
            setCodes(codesRes.data ?? []);
            setUsage(usageRes.data ?? []);
        } catch (err) {
            console.error('Error loading discounts:', err);
            toast.error('Error al cargar descuentos');
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    const fetchCatalogs = useCallback(async () => {
        try {
            const [catRes, leagRes, teamRes] = await Promise.all([
                supabase.from('categories').select('id, name').is('deleted_at', null).eq('active', true).order('name'),
                supabase.from('leagues').select('id, name').is('deleted_at', null).eq('active', true).order('name'),
                supabase.from('teams').select('id, name').is('deleted_at', null).eq('active', true).order('name'),
            ]);
            setCategories(catRes.data ?? []);
            setLeagues(leagRes.data ?? []);
            setTeams(teamRes.data ?? []);
        } catch (err) {
            console.warn('Error fetching auxiliary catalogs:', err);
        }
    }, [supabase]);

    useEffect(() => {
        fetchData();
        fetchCatalogs();
    }, [fetchData, fetchCatalogs]);

    const openNew = () => {
        setEditingId(null);
        setForm({ ...EMPTY_FORM });
        setModalOpen(true);
    };

    const openEdit = (dc: DiscountCode) => {
        setEditingId(dc.id);
        setForm({
            code: dc.code,
            description: dc.description ?? '',
            discount_pct: dc.discount_pct,
            category_ids: dc.category_ids ?? [],
            league_ids: dc.league_ids ?? [],
            team_ids: dc.team_ids ?? [],
            max_uses: dc.max_uses ?? '',
            expires_at: dc.expires_at ? dc.expires_at.slice(0, 16) : '',
            active: dc.active,
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.code.trim()) {
            toast.error('El código es requerido');
            return;
        }
        if (form.discount_pct <= 0 || form.discount_pct > 100) {
            toast.error('El porcentaje debe estar entre 1 y 100');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                code: form.code.trim().toUpperCase(),
                description: form.description.trim() || undefined,
                discount_pct: Number(form.discount_pct),
                category_ids: form.category_ids,
                league_ids: form.league_ids,
                team_ids: form.team_ids,
                max_uses: form.max_uses !== '' ? Number(form.max_uses) : null,
                expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
                active: form.active,
            };

            if (editingId) {
                await updateDiscountCode(editingId, payload);
            } else {
                await createDiscountCode(payload);
            }

            toast.success(editingId ? 'Código actualizado exitosamente' : 'Código creado exitosamente');
            setModalOpen(false);
            fetchData();
        } catch (err: unknown) {
            toast.error((err as Error).message || 'Error al guardar el código');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (id: string, current: boolean) => {
        setToggling(id);
        try {
            await toggleDiscountCode(id, !current);
            setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, active: !current } : c)));
            toast.success(!current ? 'Cupón activado' : 'Cupón pausado');
        } catch {
            toast.error('Error al cambiar estado');
        } finally {
            setToggling(null);
        }
    };

    const executeDelete = async (id: string) => {
        try {
            await deleteDiscountCode(id);
            toast.success('Código eliminado permanentemente');
            fetchData();
        } catch {
            toast.error('Error al eliminar código');
        }
    };

    const copyCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            toast.success(`Código "${code}" copiado al portapapeles`);
        } catch {
            toast.info(code);
        }
    };

    const filteredCodes = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return codes;
        return codes.filter(
            (c) =>
                c.code.toLowerCase().includes(q) ||
                (c.description && c.description.toLowerCase().includes(q))
        );
    }, [codes, search]);

    const filteredUsage = useMemo(() => {
        if (!auditFilter) return usage;
        return usage.filter(
            (u) =>
                u.discount_codes?.code === auditFilter ||
                u.customer_email.toLowerCase().includes(auditFilter.toLowerCase())
        );
    }, [usage, auditFilter]);

    const uniqueUsedCodes = useMemo(() => {
        return [...new Set(usage.map((u) => u.discount_codes?.code).filter(Boolean))] as string[];
    }, [usage]);

    const kpis = useMemo(() => {
        const activeCount = codes.filter((c) => c.active).length;
        const totalRedemptions = codes.reduce((acc, c) => acc + (c.used_count || 0), 0);
        const totalSaved = usage.reduce((acc, u) => acc + (u.discount_amount || 0), 0);
        const avgPct =
            codes.length > 0
                ? codes.reduce((acc, c) => acc + (c.discount_pct || 0), 0) / codes.length
                : 0;
        return {
            activeCount,
            totalCodes: codes.length,
            totalRedemptions,
            totalSaved,
            avgPct,
        };
    }, [codes, usage]);

    return {
        tab,
        setTab,
        codes: filteredCodes,
        usage: filteredUsage,
        uniqueUsedCodes,
        loading,
        toggling,
        search,
        setSearch,
        auditFilter,
        setAuditFilter,
        categories,
        leagues,
        teams,
        modalOpen,
        setModalOpen,
        editingId,
        form,
        setForm,
        saving,
        deleteTarget,
        setDeleteTarget,
        kpis,
        fetchData,
        openNew,
        openEdit,
        handleSave,
        handleToggle,
        executeDelete,
        copyCode,
    };
}

