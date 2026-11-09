'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from '@/lib/motion';
import { X, Save, Loader2, Shield, Tag, Plus } from 'lucide-react';
import useToastMessage from '@/hooks/useToastMessage';
import LogoUpload from '@/components/admin/LogoUpload';
import { CatalogItem } from '@/types/adminProduct';

interface QuickCreateModalProps {
    isOpen: boolean;
    type: 'team' | 'brand';
    leagues?: CatalogItem[];
    onClose: () => void;
    onCreated: (item: CatalogItem) => void;
}

const generateSlug = (name: string) =>
    name
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

export default function QuickCreateModal({
    isOpen,
    type,
    leagues = [],
    onClose,
    onCreated,
}: QuickCreateModalProps) {
    const supabase = createClient();
    const toast = useToastMessage();

    const [name, setName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [country, setCountry] = useState('');
    const [leagueId, setLeagueId] = useState('');
    const [isNationalTeam, setIsNationalTeam] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName('');
            setLogoUrl('');
            setCountry('');
            setLeagueId('');
            setIsNationalTeam(false);
            setSaving(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            toast.error('El nombre es requerido');
            return;
        }

        setSaving(true);
        const slug = generateSlug(trimmed);

        try {
            if (type === 'brand') {
                const { data, error } = await supabase
                    .from('brands')
                    .insert({
                        name: trimmed,
                        slug,
                        logo_url: logoUrl.trim() || null,
                        active: true,
                        sort_order: 0,
                    })
                    .select('id, name, slug')
                    .single();

                if (error) throw error;
                toast.success(`Marca "${trimmed}" creada exitosamente`);
                onCreated({
                    id: data.id,
                    name: data.name,
                    slug: data.slug,
                });
                onClose();
            } else {
                const { data, error } = await supabase
                    .from('teams')
                    .insert({
                        name: trimmed,
                        slug,
                        logo_url: logoUrl.trim() || null,
                        country: country.trim() || 'Internacional',
                        league_id: leagueId || null,
                        is_national_team: isNationalTeam,
                        active: true,
                    })
                    .select('id, name, slug, country, league_id')
                    .single();

                if (error) throw error;
                toast.success(`Equipo "${trimmed}" creado exitosamente`);
                onCreated({
                    id: data.id,
                    name: data.name,
                    slug: data.slug,
                    country: data.country,
                    league_id: data.league_id,
                });
                onClose();
            }
        } catch (err: any) {
            console.error('Error al crear elemento:', err);
            toast.error(err?.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const isTeam = type === 'team';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 8 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                    className="relative w-full max-w-md bg-[#0d0e12] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Specular Highlight superior estilo Apple */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                {isTeam ? <Shield className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white tracking-wide">
                                    {isTeam ? 'Crear Nuevo Equipo' : 'Crear Nueva Marca'}
                                </h3>
                                <p className="text-[11px] text-gray-400">
                                    Se vinculará automáticamente al producto actual
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                                Nombre {isTeam ? 'del Equipo' : 'de la Marca'} *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={isTeam ? 'Ej. Real Madrid Retro o Al-Hilal' : 'Ej. Kelme, Hummel o Meyba'}
                                autoFocus
                                required
                                className="w-full bg-[#14151b] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                            />
                        </div>

                        {isTeam && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                                        Liga Base (Opcional)
                                    </label>
                                    <select
                                        value={leagueId}
                                        onChange={(e) => setLeagueId(e.target.value)}
                                        className="w-full bg-[#14151b] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                                    >
                                        <option value="">— Ninguna o Por Definir —</option>
                                        {leagues.map((l) => (
                                            <option key={l.id} value={l.id}>
                                                {l.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                                        País / Región
                                    </label>
                                    <input
                                        type="text"
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                        placeholder="Ej. España, Inglaterra, Internacional"
                                        className="w-full bg-[#14151b] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                                    />
                                </div>

                                <div className="flex items-center gap-3 pt-1">
                                    <input
                                        type="checkbox"
                                        id="quick_is_national_team"
                                        checked={isNationalTeam}
                                        onChange={(e) => setIsNationalTeam(e.target.checked)}
                                        className="w-4 h-4 rounded border-white/20 bg-[#14151b] text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                                    />
                                    <label htmlFor="quick_is_national_team" className="text-xs text-gray-300 cursor-pointer select-none">
                                        Es Selección Nacional
                                    </label>
                                </div>
                            </>
                        )}

                        {/* Escudo / Logo */}
                        <LogoUpload
                            value={logoUrl}
                            onChange={setLogoUrl}
                            folder={isTeam ? 'teams' : 'brands'}
                            label={isTeam ? 'Escudo Oficial' : 'Logo de la Marca'}
                            description="Sube PNG transparente o pega URL directa"
                        />

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={saving}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover active:scale-[0.98] transition-all shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-3.5 h-3.5" /> Crear y Vincular
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

