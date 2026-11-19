'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Search,
    Plus,
    Trash2,
    Save,
    Loader2,
    Sparkles,
    Tag,
    Shield,
    X,
    CheckCircle2,
    AlertCircle,
    Zap,
    ArrowLeftRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import useToastMessage from '@/hooks/useToastMessage';
import TeamLogo from '@/components/TeamLogo';
import {
    SearchAliasRule,
    SearchSynonymRule,
    QuickSearchChipConfig,
    DEFAULT_SEARCH_SETTINGS,
} from '@/lib/search/searchSettingsTypes';
import { buildSearchIndex, searchCatalog } from '@/lib/search/searchEngine';
import { normalizeSearchText } from '@/lib/search/textUtils';
import {
    getCatalog,
    getConfig,
    getSearchablePlayers,
    clearProductCache,
    SearchablePlayer,
} from '@/lib/api';
import { resetSearchCatalogMemoryCache } from '@/hooks/useSearchCatalog';
import { Product, Category, League } from '@/lib/types';

interface SimpleTeam {
    id: string;
    name: string;
    logo_url: string | null;
}

export default function SearchAliasesManager() {
    const supabaseRef = useRef(createClient());
    const toast = useToastMessage();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const [aliases, setAliases] = useState<SearchAliasRule[]>(DEFAULT_SEARCH_SETTINGS.aliases);
    const [synonyms, setSynonyms] = useState<SearchSynonymRule[]>(DEFAULT_SEARCH_SETTINGS.synonyms);
    const [quickChips, setQuickChips] = useState<QuickSearchChipConfig[]>(DEFAULT_SEARCH_SETTINGS.quickChips);
    const [teams, setTeams] = useState<SimpleTeam[]>([]);
    const [filterText, setFilterText] = useState('');

    // Formulario rápido para nueva regla de alias de equipo
    const [newTargetTeam, setNewTargetTeam] = useState('');
    const [newAliasesInput, setNewAliasesInput] = useState('');
    const [aliasDraftByRule, setAliasDraftByRule] = useState<Record<string, string>>({});

    // Formulario rápido para sinónimo general de atributo/categoría
    const [newSynTarget, setNewSynTarget] = useState('');
    const [newSynListInput, setNewSynListInput] = useState('');
    const [synDraftByRule, setSynDraftByRule] = useState<Record<string, string>>({});

    // Formulario rápido para nuevo chip de acceso rápido
    const [newChipLabel, setNewChipLabel] = useState('');
    const [newChipQuery, setNewChipQuery] = useState('');
    const [newChipHref, setNewChipHref] = useState('');

    // Datos para el simulador de búsqueda en vivo
    const [testQuery, setTestQuery] = useState('');
    const [simCatalog, setSimCatalog] = useState<Product[]>([]);
    const [simCategories, setSimCategories] = useState<Category[]>([]);
    const [simLeagues, setSimLeagues] = useState<League[]>([]);
    const [simPlayers, setSimPlayers] = useState<SearchablePlayer[]>([]);

    useEffect(() => {
        let mounted = true;
        async function loadAll() {
            setLoading(true);
            try {
                const [settingsRes, teamsRes, catData, cfgData, playersData] = await Promise.all([
                    fetch('/api/admin/settings/search').then((r) => (r.ok ? r.json() : null)).catch(() => null),
                    supabaseRef.current
                        .from('teams')
                        .select('id, name, logo_url')
                        .is('deleted_at', null)
                        .order('name', { ascending: true }),
                    getCatalog().catch(() => [] as Product[]),
                    getConfig().catch(() => null),
                    getSearchablePlayers().catch(() => [] as SearchablePlayer[]),
                ]);

                if (!mounted) return;

                if (settingsRes?.aliases) setAliases(settingsRes.aliases);
                if (settingsRes?.synonyms) setSynonyms(settingsRes.synonyms);
                if (settingsRes?.quickChips) setQuickChips(settingsRes.quickChips);
                if (teamsRes.data) setTeams(teamsRes.data as SimpleTeam[]);
                setSimCatalog(catData);
                setSimCategories(cfgData?.categorias || []);
                setSimLeagues(cfgData?.ligas || []);
                setSimPlayers(playersData);
            } catch (err) {
                console.error('Error cargando configuración de búsqueda:', err);
                toast.error('Error al cargar la configuración de búsqueda');
            } finally {
                if (mounted) setLoading(false);
            }
        }
        loadAll();
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Mapa de escudos por nombre normalizado de equipo
    const teamLogoMap = useMemo(() => {
        const map = new Map<string, string | null>();
        for (const t of teams) {
            map.set(normalizeSearchText(t.name), t.logo_url);
        }
        return map;
    }, [teams]);

    const getTeamLogo = (targetTeam: string): string | null => {
        const targetNorm = normalizeSearchText(targetTeam);
        if (teamLogoMap.has(targetNorm)) return teamLogoMap.get(targetNorm) || null;
        for (const [k, url] of teamLogoMap.entries()) {
            if (k.includes(targetNorm) || targetNorm.includes(k)) return url;
        }
        return null;
    };

    // Índice del simulador en tiempo real (refleja alias + sinónimos sin guardar)
    const simIndex = useMemo(
        () =>
            buildSearchIndex({
                products: simCatalog,
                categories: simCategories,
                leagues: simLeagues,
                players: simPlayers,
                aliases,
                synonyms,
            }),
        [simCatalog, simCategories, simLeagues, simPlayers, aliases, synonyms]
    );

    const simResult = useMemo(() => {
        if (testQuery.trim().length < 2) return null;
        return searchCatalog(simIndex, testQuery, { productLimit: 5, categoryLimit: 2, leagueLimit: 2, playerLimit: 2 });
    }, [simIndex, testQuery]);

    // Estadísticas KPI
    const activeRulesCount = useMemo(() => aliases.filter((a) => a.active).length, [aliases]);
    const totalTermsCount = useMemo(
        () => aliases.reduce((acc, r) => acc + (r.active ? r.aliases.length : 0), 0),
        [aliases]
    );
    const activeSynonymsCount = useMemo(
        () => synonyms.reduce((acc, r) => acc + (r.active ? r.synonyms.length : 0), 0),
        [synonyms]
    );
    const activeChipsCount = useMemo(() => quickChips.filter((c) => c.active).length, [quickChips]);

    const filteredAliases = useMemo(() => {
        const q = normalizeSearchText(filterText);
        if (!q) return aliases;
        return aliases.filter(
            (r) =>
                normalizeSearchText(r.targetTeam).includes(q) ||
                r.aliases.some((a) => normalizeSearchText(a).includes(q))
        );
    }, [aliases, filterText]);

    // Acciones sobre Alias de Equipos
    const handleAddRule = () => {
        const target = newTargetTeam.trim();
        const parsedAliases = newAliasesInput
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length >= 2);

        if (!target) {
            toast.error('Seleccioná o escribí el equipo destino');
            return;
        }
        if (parsedAliases.length === 0) {
            toast.error('Agregá al menos un apodo de 2 o más caracteres');
            return;
        }

        const existingIndex = aliases.findIndex(
            (r) => normalizeSearchText(r.targetTeam) === normalizeSearchText(target)
        );

        if (existingIndex !== -1) {
            setAliases((prev) =>
                prev.map((rule, idx) =>
                    idx === existingIndex
                        ? {
                              ...rule,
                              active: true,
                              aliases: Array.from(new Set([...rule.aliases, ...parsedAliases])),
                          }
                        : rule
                )
            );
            toast.success(`Apodos agregados a ${target}`);
        } else {
            const newRule: SearchAliasRule = {
                id: `${normalizeSearchText(target).replace(/\s+/g, '-')}-${Date.now()}`,
                targetTeam: target,
                aliases: Array.from(new Set(parsedAliases)),
                active: true,
            };
            setAliases((prev) => [newRule, ...prev]);
        }

        setNewTargetTeam('');
        setNewAliasesInput('');
        setHasChanges(true);
    };

    const handleAddTermToRule = (ruleId: string) => {
        const raw = (aliasDraftByRule[ruleId] || '').trim();
        const terms = raw
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length >= 2);
        if (terms.length === 0) return;

        setAliases((prev) =>
            prev.map((r) =>
                r.id === ruleId
                    ? { ...r, aliases: Array.from(new Set([...r.aliases, ...terms])) }
                    : r
            )
        );
        setAliasDraftByRule((prev) => ({ ...prev, [ruleId]: '' }));
        setHasChanges(true);
    };

    const handleRemoveTermFromRule = (ruleId: string, term: string) => {
        setAliases((prev) =>
            prev.map((r) =>
                r.id === ruleId
                    ? { ...r, aliases: r.aliases.filter((a) => a !== term) }
                    : r
            )
        );
        setHasChanges(true);
    };

    const handleToggleRule = (ruleId: string) => {
        setAliases((prev) => prev.map((r) => (r.id === ruleId ? { ...r, active: !r.active } : r)));
        setHasChanges(true);
    };

    const handleDeleteRule = (ruleId: string) => {
        setAliases((prev) => prev.filter((r) => r.id !== ruleId));
        setHasChanges(true);
    };

    // Acciones sobre Sinónimos Generales de Atributos/Categorías
    const handleAddSynonymRule = () => {
        const target = newSynTarget.trim();
        const parsedSyns = newSynListInput
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length >= 2);

        if (target.length < 2) {
            toast.error('Escribí el término base del catálogo (ej. femenina, visitante, ninos)');
            return;
        }
        if (parsedSyns.length === 0) {
            toast.error('Agregá al menos un sinónimo de 2 o más caracteres');
            return;
        }

        const existingIdx = synonyms.findIndex(
            (r) => normalizeSearchText(r.targetTerm) === normalizeSearchText(target)
        );

        if (existingIdx !== -1) {
            setSynonyms((prev) =>
                prev.map((rule, idx) =>
                    idx === existingIdx
                        ? {
                              ...rule,
                              active: true,
                              synonyms: Array.from(new Set([...rule.synonyms, ...parsedSyns])),
                          }
                        : rule
                )
            );
            toast.success(`Sinónimos agregados a "${target}"`);
        } else {
            setSynonyms((prev) => [
                {
                    id: `syn-${normalizeSearchText(target).replace(/\s+/g, '-')}-${Date.now()}`,
                    targetTerm: target,
                    synonyms: Array.from(new Set(parsedSyns)),
                    active: true,
                },
                ...prev,
            ]);
        }

        setNewSynTarget('');
        setNewSynListInput('');
        setHasChanges(true);
    };

    const handleAddTermToSynonym = (ruleId: string) => {
        const raw = (synDraftByRule[ruleId] || '').trim();
        const terms = raw
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length >= 2);
        if (terms.length === 0) return;

        setSynonyms((prev) =>
            prev.map((r) =>
                r.id === ruleId
                    ? { ...r, synonyms: Array.from(new Set([...r.synonyms, ...terms])) }
                    : r
            )
        );
        setSynDraftByRule((prev) => ({ ...prev, [ruleId]: '' }));
        setHasChanges(true);
    };

    const handleRemoveTermFromSynonym = (ruleId: string, term: string) => {
        setSynonyms((prev) =>
            prev.map((r) =>
                r.id === ruleId
                    ? { ...r, synonyms: r.synonyms.filter((s) => s !== term) }
                    : r
            )
        );
        setHasChanges(true);
    };

    const handleToggleSynonym = (ruleId: string) => {
        setSynonyms((prev) => prev.map((r) => (r.id === ruleId ? { ...r, active: !r.active } : r)));
        setHasChanges(true);
    };

    const handleDeleteSynonym = (ruleId: string) => {
        setSynonyms((prev) => prev.filter((r) => r.id !== ruleId));
        setHasChanges(true);
    };

    // Acciones sobre Quick Chips
    const handleAddChip = () => {
        const label = newChipLabel.trim();
        const query = newChipQuery.trim();
        if (!label || !query) {
            toast.error('La etiqueta y el término de búsqueda son obligatorios');
            return;
        }
        const rawHref = newChipHref.trim();
        const href = rawHref.startsWith('/') ? rawHref : `/catalogo?query=${encodeURIComponent(query)}`;

        setQuickChips((prev) => [
            ...prev,
            {
                id: `chip-${Date.now()}`,
                label,
                query,
                href,
                active: true,
            },
        ]);
        setNewChipLabel('');
        setNewChipQuery('');
        setNewChipHref('');
        setHasChanges(true);
    };

    const handleToggleChip = (id: string) => {
        setQuickChips((prev) => prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));
        setHasChanges(true);
    };

    const handleDeleteChip = (id: string) => {
        setQuickChips((prev) => prev.filter((c) => c.id !== id));
        setHasChanges(true);
    };

    // Guardar configuración completa en store_settings
    const handleSaveAll = async () => {
        setSaving(true);
        try {
            const cleanedAliases = aliases.filter((r) => r.targetTeam.trim() && r.aliases.length > 0);
            const cleanedSynonyms = synonyms.filter((r) => r.targetTerm.trim() && r.synonyms.length > 0);
            const res = await fetch('/api/admin/settings/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    aliases: cleanedAliases,
                    synonyms: cleanedSynonyms,
                    quickChips,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Error al guardar');
            }

            setAliases(cleanedAliases);
            setSynonyms(cleanedSynonyms);
            setHasChanges(false);
            clearProductCache('config');
            resetSearchCatalogMemoryCache();
            toast.success('Configuración de búsqueda actualizada en toda la tienda');
        } catch (err: unknown) {
            console.error('Error guardando configuración de búsqueda:', err);
            toast.error((err as Error).message || 'No se pudo guardar');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="text-xs text-neutral-400 font-medium">Cargando Motor de Búsqueda y Alias...</span>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* 1. Encabezado de Sección Homologado */}
            <div className="p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                        <Search className="w-5 h-5" />
                    </span>
                    <div>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                            Búsqueda Inteligente y Alias
                        </h2>
                        <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                            Administrá apodos de clubes, sinónimos de atributos y accesos rápidos. Typos, espacios y plurales se resuelven automáticamente.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                    {hasChanges && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Cambios sin guardar
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={handleSaveAll}
                        disabled={saving || !hasChanges}
                        className="bg-white text-black font-extrabold hover:bg-neutral-200 active:scale-[0.98] rounded-xl px-4 py-2.5 text-xs sm:text-sm transition-all shadow-sm inline-flex items-center gap-2 disabled:opacity-40 cursor-pointer"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
                    </button>
                </div>
            </div>

            {/* 2. Tarjetas KPI Homologadas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] p-4 sm:p-5 rounded-2xl relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                        <span>Clubes con Alias</span>
                        <span className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight mt-2">
                        {activeRulesCount}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1 truncate">
                        Reglas activas en el motor
                    </p>
                </div>

                <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] p-4 sm:p-5 rounded-2xl relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                        <span>Apodos Activos</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight mt-2">
                        {totalTermsCount}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1 truncate">
                        Compartibles entre clubes
                    </p>
                </div>

                <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] p-4 sm:p-5 rounded-2xl relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                        <span>Sinónimos Globales</span>
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight mt-2">
                        {activeSynonymsCount}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1 truncate">
                        Ej: dama → femenina, away → visitante
                    </p>
                </div>

                <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] p-4 sm:p-5 rounded-2xl relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                        <span>Chips Rápidos</span>
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight mt-2">
                        {activeChipsCount}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1 truncate">
                        Atajos al abrir el buscador
                    </p>
                </div>
            </div>

            {/* 3. Simulador en Vivo del Motor Unificado */}
            <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
                <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06] mb-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                            Probador del Buscador en Vivo
                        </h3>
                    </div>
                    <span className="text-[11px] text-neutral-500 font-mono">
                        {simCatalog.length} prendas indexadas
                    </span>
                </div>

                <div className="relative">
                    <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={testQuery}
                        onChange={(e) => setTestQuery(e.target.value)}
                        placeholder='Probá búsquedas reales: "America dama", "realmadrid", "camisa del mota gua", "formula1"...'
                        className="w-full bg-black/40 border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-neutral-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                    />
                </div>

                {simResult && (
                    <div className="mt-4 p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                {simResult.meta.matchQuality === 'exact' && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Coincidencia Exacta ({simResult.totalProducts})
                                    </span>
                                )}
                                {simResult.meta.matchQuality === 'partial' && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-bold">
                                        <AlertCircle className="w-3 h-3" />
                                        Rescate Parcial ({simResult.totalProducts})
                                    </span>
                                )}
                                {simResult.meta.matchQuality === 'empty' && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[11px] font-bold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                        Sin stock → Rescate WhatsApp
                                    </span>
                                )}

                                {simResult.meta.correctedTerms.map((c) => (
                                    <span
                                        key={`${c.from}-${c.to}`}
                                        className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] text-neutral-300 font-mono"
                                    >
                                        {c.from} → <strong className="text-white">{c.to}</strong>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {simResult.products.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {simResult.products.map(({ product, score }) => (
                                    <div
                                        key={product.id}
                                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-white truncate">{product.equipo}</p>
                                            <p className="text-[11px] text-neutral-400 truncate">{product.modelo}</p>
                                        </div>
                                        <span className="text-[10px] font-mono text-neutral-500 shrink-0">
                                            {score.toFixed(1)} pts
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 4. Sinónimos de Atributos y Categorías (ej. dama -> femenina, away -> visitante) */}
            <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
                <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06] mb-5">
                    <div className="flex items-center gap-2">
                        <ArrowLeftRight className="w-4 h-4 text-blue-400" />
                        <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                            Sinónimos de Atributos y Categorías
                        </h3>
                    </div>
                    <span className="text-[11px] text-neutral-500">
                        Conecta términos de raíces distintas (ej. dama → femenina)
                    </span>
                </div>

                {/* Creador de Sinónimo */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                        <div className="md:col-span-4">
                            <input
                                type="text"
                                value={newSynTarget}
                                onChange={(e) => setNewSynTarget(e.target.value)}
                                placeholder="Término en tu catálogo (ej. femenina, visitante)"
                                className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-neutral-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                            />
                        </div>
                        <div className="md:col-span-6">
                            <input
                                type="text"
                                value={newSynListInput}
                                onChange={(e) => setNewSynListInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddSynonymRule();
                                    }
                                }}
                                placeholder="Sinónimos separados por coma (ej. dama, chica, women)"
                                className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-neutral-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <button
                                type="button"
                                onClick={handleAddSynonymRule}
                                className="w-full h-full bg-white/5 hover:bg-white/10 active:scale-[0.98] text-neutral-200 hover:text-white border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Agregar</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Lista de Sinónimos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {synonyms.map((rule) => (
                        <div
                            key={rule.id}
                            className={`p-3.5 rounded-2xl border transition-all ${
                                rule.active
                                    ? 'bg-white/[0.02] border-white/[0.07]'
                                    : 'bg-black/30 border-white/[0.04] opacity-60'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs sm:text-sm font-bold text-white font-mono">
                                            {rule.targetTerm}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleSynonym(rule.id)}
                                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer transition-all ${
                                                rule.active
                                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                    : 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
                                            }`}
                                        >
                                            <span
                                                className={`w-1.5 h-1.5 rounded-full ${
                                                    rule.active ? 'bg-blue-400' : 'bg-neutral-500'
                                                }`}
                                            />
                                            {rule.active ? 'Activo' : 'Pausado'}
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                        {rule.synonyms.map((term) => (
                                            <span
                                                key={term}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 font-medium"
                                            >
                                                <span>{term}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTermFromSynonym(rule.id, term)}
                                                    aria-label={`Quitar sinónimo ${term}`}
                                                    className="ml-0.5 text-blue-300/60 hover:text-red-400 transition-colors cursor-pointer"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                        <input
                                            type="text"
                                            value={synDraftByRule[rule.id] || ''}
                                            onChange={(e) =>
                                                setSynDraftByRule((prev) => ({
                                                    ...prev,
                                                    [rule.id]: e.target.value,
                                                }))
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ',') {
                                                    e.preventDefault();
                                                    handleAddTermToSynonym(rule.id);
                                                }
                                            }}
                                            onBlur={() => handleAddTermToSynonym(rule.id)}
                                            placeholder="+ sinónimo"
                                            className="w-24 focus:w-32 bg-black/40 border border-dashed border-white/15 focus:border-white/30 rounded-lg px-2 py-1 text-xs text-white placeholder:text-neutral-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleDeleteSynonym(rule.id)}
                                    aria-label={`Eliminar sinónimo ${rule.targetTerm}`}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/15 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 5. Gestión de Alias y Apodos de Equipos */}
            <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.06] mb-5">
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                            Apodos de Clubes y Selecciones
                        </h3>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            placeholder="Filtrar equipo o apodo..."
                            className="w-full bg-black/40 border border-white/[0.08] rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-white/30 transition-all"
                        />
                    </div>
                </div>

                {/* Creador Rápido de Regla */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] mb-5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-3">
                        Nueva Regla de Apodo
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                        <div className="md:col-span-4">
                            <input
                                type="text"
                                list="admin-teams-datalist"
                                value={newTargetTeam}
                                onChange={(e) => setNewTargetTeam(e.target.value)}
                                placeholder="Equipo destino (ej. América, Olimpia...)"
                                className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-neutral-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                            />
                            <datalist id="admin-teams-datalist">
                                {teams.map((t) => (
                                    <option key={t.id} value={t.name} />
                                ))}
                            </datalist>
                        </div>
                        <div className="md:col-span-6">
                            <input
                                type="text"
                                value={newAliasesInput}
                                onChange={(e) => setNewAliasesInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddRule();
                                    }
                                }}
                                placeholder="Apodos separados por coma (ej. aguilas, azulcremas)"
                                className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-neutral-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <button
                                type="button"
                                onClick={handleAddRule}
                                className="w-full h-full bg-white text-black font-extrabold hover:bg-neutral-200 active:scale-[0.98] rounded-xl px-4 py-2.5 text-xs sm:text-sm transition-all shadow-sm inline-flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Agregar</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Lista de Reglas */}
                <div className="space-y-2.5">
                    {filteredAliases.length === 0 ? (
                        <div className="text-center py-10 text-xs text-neutral-500">
                            No hay reglas que coincidan con &quot;{filterText}&quot;.
                        </div>
                    ) : (
                        filteredAliases.map((rule) => {
                            const logo = getTeamLogo(rule.targetTeam);
                            return (
                                <div
                                    key={rule.id}
                                    className={`p-3.5 rounded-2xl border transition-all ${
                                        rule.active
                                            ? 'bg-white/[0.02] border-white/[0.07]'
                                            : 'bg-black/30 border-white/[0.04] opacity-60'
                                    }`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center shrink-0 p-1">
                                                {logo ? (
                                                    <TeamLogo src={logo} alt={rule.targetTeam} size={24} />
                                                ) : (
                                                    <Shield className="w-4 h-4 text-neutral-500" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-sm font-bold text-white truncate">
                                                        {rule.targetTeam}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleRule(rule.id)}
                                                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer transition-all ${
                                                            rule.active
                                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                                : 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`w-1.5 h-1.5 rounded-full ${
                                                                rule.active ? 'bg-emerald-400' : 'bg-neutral-500'
                                                            }`}
                                                        />
                                                        {rule.active ? 'Activo' : 'Pausado'}
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                                    {rule.aliases.map((term) => (
                                                        <span
                                                            key={term}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-xs text-neutral-200 font-medium"
                                                        >
                                                            <Tag className="w-3 h-3 text-primary/80" />
                                                            <span>{term}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveTermFromRule(rule.id, term)}
                                                                aria-label={`Quitar apodo ${term}`}
                                                                className="ml-0.5 text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </span>
                                                    ))}

                                                    {/* Input inline para sumar apodo rápido */}
                                                    <div className="inline-flex items-center">
                                                        <input
                                                            type="text"
                                                            value={aliasDraftByRule[rule.id] || ''}
                                                            onChange={(e) =>
                                                                setAliasDraftByRule((prev) => ({
                                                                    ...prev,
                                                                    [rule.id]: e.target.value,
                                                                }))
                                                            }
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' || e.key === ',') {
                                                                    e.preventDefault();
                                                                    handleAddTermToRule(rule.id);
                                                                }
                                                            }}
                                                            onBlur={() => handleAddTermToRule(rule.id)}
                                                            placeholder="+ apodo"
                                                            className="w-24 focus:w-36 bg-black/40 border border-dashed border-white/15 focus:border-white/30 rounded-lg px-2 py-1 text-xs text-white placeholder:text-neutral-500 outline-none transition-all"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleDeleteRule(rule.id)}
                                            aria-label={`Eliminar regla de ${rule.targetTeam}`}
                                            className="self-end sm:self-center p-2 rounded-xl bg-white/5 hover:bg-red-500/15 text-neutral-400 hover:text-red-400 border border-white/[0.08] hover:border-red-500/25 transition-all cursor-pointer shrink-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* 6. Chips de Acceso Rápido del Buscador */}
            <div className="bg-[#0a0c10]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
                <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06] mb-5">
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                            Accesos Rápidos del Buscador
                        </h3>
                    </div>
                    <span className="text-[11px] text-neutral-500">
                        Píldoras sugeridas antes de escribir
                    </span>
                </div>

                {/* Nuevo Chip */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 mb-4 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="md:col-span-3">
                        <input
                            type="text"
                            value={newChipLabel}
                            onChange={(e) => setNewChipLabel(e.target.value)}
                            placeholder="Etiqueta (ej. ⚡ Manga Larga)"
                            className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-white/30 transition-all"
                        />
                    </div>
                    <div className="md:col-span-3">
                        <input
                            type="text"
                            value={newChipQuery}
                            onChange={(e) => setNewChipQuery(e.target.value)}
                            placeholder="Término (ej. manga larga)"
                            className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-white/30 transition-all"
                        />
                    </div>
                    <div className="md:col-span-4">
                        <input
                            type="text"
                            value={newChipHref}
                            onChange={(e) => setNewChipHref(e.target.value)}
                            placeholder="Ruta opcional (ej. /catalogo?categoria=retro)"
                            className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-white/30 transition-all font-mono"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <button
                            type="button"
                            onClick={handleAddChip}
                            className="w-full h-full bg-white/5 hover:bg-white/10 active:scale-[0.98] text-neutral-200 hover:text-white border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Añadir</span>
                        </button>
                    </div>
                </div>

                {/* Lista de Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {quickChips.map((chip) => (
                        <div
                            key={chip.id}
                            className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                                chip.active
                                    ? 'bg-white/[0.02] border-white/[0.07]'
                                    : 'bg-black/30 border-white/[0.04] opacity-55'
                            }`}
                        >
                            <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-white truncate">{chip.label}</p>
                                <p className="text-[11px] text-neutral-500 font-mono truncate">{chip.href}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => handleToggleChip(chip.id)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition-all ${
                                        chip.active
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
                                    }`}
                                >
                                    {chip.active ? 'Visible' : 'Oculto'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteChip(chip.id)}
                                    aria-label={`Eliminar chip ${chip.label}`}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/15 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
