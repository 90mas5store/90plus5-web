'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Plus,
    Edit,
    Trash2,
    Search,
    X,
    Save,
    Loader2,
    Shield,
    ChevronLeft,
    ChevronRight,
    Trophy,
    Tag,
    Flame,
    Globe,
    Layers,
} from 'lucide-react';
import useToastMessage from '@/hooks/useToastMessage';
import { useAdminRole } from '@/hooks/useAdminRole';
import LogoUpload from '@/components/admin/LogoUpload';
import { motion, AnimatePresence } from '@/lib/motion';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { getTeamBrandsMap, setTeamBrandDefault, TeamBrandMap } from '@/lib/teamBrandSettings';

const PAGE_SIZE = 20;

type FilterTab = 'all' | 'clubs' | 'national' | 'live';

interface Team {
    id: string;
    name: string;
    slug: string;
    logo_url: string;
    country: string;
    league_id?: string;
    is_national_team: boolean;
    active: boolean;
    is_matchday_active?: boolean;
    matchday_opponent?: string | null;
    matchday_score?: string | null;
    matchday_period?: string | null;
    // Join
    leagues?: { name: string };
}

interface League {
    id: string;
    name: string;
}

interface Brand {
    id: string;
    name: string;
}

export default function TeamsPage() {
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;
    const toast = useToastMessage();
    const { isSuperAdmin } = useAdminRole();

    const [teams, setTeams] = useState<Team[]>([]);
    const [allTeamsList, setAllTeamsList] = useState<Team[]>([]);
    const [leagues, setLeagues] = useState<League[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [teamBrandsMap, setTeamBrandsMap] = useState<TeamBrandMap>({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<FilterTab>('all');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Modal de Edición / Creación de Equipo
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    // Modal Dedicado de Matchday Manual
    const [matchdayModalTeam, setMatchdayModalTeam] = useState<Team | null>(null);
    const [matchdayConfig, setMatchdayConfig] = useState({
        is_matchday_active: true,
        opponent_selection: '',
        opponent_custom_name: '',
        score_home: '0',
        score_away: '0',
        period: 'En Vivo',
    });

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        logo_url: '',
        country: '',
        league_id: '',
        brand_id: '',
        is_national_team: false,
        active: true,
        is_matchday_active: false,
    });

    const fetchTeams = useCallback(
        async (p = page) => {
            setLoading(true);
            const from = (p - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;
            try {
                const { data, error, count } = await supabase
                    .from('teams')
                    .select(`*, leagues (name)`, { count: 'exact' })
                    .is('deleted_at', null)
                    .order('name', { ascending: true })
                    .range(from, to);

                if (error) throw error;
                setTeams(data || []);
                setTotalCount(count ?? 0);
            } catch (error: unknown) {
                console.error('Error fetching teams:', error);
                toast.error('Error al cargar equipos');
            } finally {
                setLoading(false);
            }
        },
        [page, supabase, toast]
    );

    const fetchAuxiliaryData = useCallback(async () => {
        try {
            const [leaguesRes, brandsRes, allTeamsRes, brandMap] = await Promise.all([
                supabase.from('leagues').select('id, name').order('name'),
                supabase.from('brands').select('id, name').eq('active', true).is('deleted_at', null).order('name'),
                supabase.from('teams').select('id, name, logo_url').is('deleted_at', null).order('name', { ascending: true }),
                getTeamBrandsMap(supabase),
            ]);

            if (leaguesRes.data) setLeagues(leaguesRes.data);
            if (brandsRes.data) setBrands(brandsRes.data);
            if (allTeamsRes.data) setAllTeamsList(allTeamsRes.data);
            setTeamBrandsMap(brandMap);
        } catch (e) {
            console.warn('Error fetching auxiliary data:', e);
        }
    }, [supabase]);

    useEffect(() => {
        fetchTeams();
        fetchAuxiliaryData();
    }, [fetchTeams, fetchAuxiliaryData]);

    useEffect(() => {
        if (editingTeam) {
            setFormData({
                name: editingTeam.name,
                slug: editingTeam.slug || '',
                logo_url: editingTeam.logo_url || '',
                country: editingTeam.country || '',
                league_id: editingTeam.league_id || '',
                brand_id: teamBrandsMap[editingTeam.id] || '',
                is_national_team: editingTeam.is_national_team,
                active: editingTeam.active,
                is_matchday_active: !!editingTeam.is_matchday_active,
            });
        } else {
            setFormData({
                name: '',
                slug: '',
                logo_url: '',
                country: '',
                league_id: '',
                brand_id: '',
                is_national_team: false,
                active: true,
                is_matchday_active: false,
            });
        }
    }, [editingTeam, isModalOpen, teamBrandsMap]);

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('El nombre del equipo es obligatorio');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: formData.name.trim(),
                slug: formData.slug.trim(),
                logo_url: formData.logo_url,
                country: formData.country.trim(),
                league_id: formData.league_id || null,
                is_national_team: formData.is_national_team,
                active: formData.active,
                is_matchday_active: formData.is_matchday_active,
            };

            let savedTeamId = editingTeam?.id;

            if (editingTeam) {
                const { error } = await supabase.from('teams').update(payload).eq('id', editingTeam.id);
                if (error) throw error;
                toast.success('Equipo actualizado exitosamente');
            } else {
                const { data: created, error } = await supabase.from('teams').insert(payload).select('id').single();
                if (error) throw error;
                savedTeamId = created.id;
                toast.success('Equipo creado exitosamente');
            }

            // Sincronizar marca oficial por defecto
            if (savedTeamId) {
                await setTeamBrandDefault(supabase, savedTeamId, formData.brand_id || null);
                setTeamBrandsMap((prev) => {
                    const next = { ...prev };
                    if (formData.brand_id) next[savedTeamId!] = formData.brand_id;
                    else delete next[savedTeamId!];
                    return next;
                });
            }

            setIsModalOpen(false);
            setEditingTeam(null);
            fetchTeams();
        } catch (error: unknown) {
            console.error('Error saving team:', error);
            toast.error(`Error: ${(error as Error).message}`);
        } finally {
            setSaving(false);
        }
    };

    // Modal Matchday Manual
    const openMatchdayModal = (team: Team) => {
        setMatchdayModalTeam(team);

        let opponentSel = '';
        let customName = '';
        if (team.matchday_opponent) {
            const matchInList = allTeamsList.find((t) => t.name.toLowerCase() === team.matchday_opponent?.toLowerCase());
            if (matchInList) {
                opponentSel = matchInList.id;
            } else {
                opponentSel = 'custom';
                customName = team.matchday_opponent;
            }
        }

        let scoreH = '0';
        let scoreA = '0';
        if (team.matchday_score && team.matchday_score.includes('-')) {
            const parts = team.matchday_score.split('-').map((s) => s.trim());
            scoreH = parts[0] || '0';
            scoreA = parts[1] || '0';
        }

        setMatchdayConfig({
            is_matchday_active: team.is_matchday_active ?? true,
            opponent_selection: opponentSel,
            opponent_custom_name: customName,
            score_home: scoreH,
            score_away: scoreA,
            period: team.matchday_period || 'En Vivo',
        });
    };

    const handleSaveMatchdayConfig = async () => {
        if (!matchdayModalTeam) return;

        let opponentFinalName = '';
        if (matchdayConfig.opponent_selection === 'custom') {
            opponentFinalName = matchdayConfig.opponent_custom_name.trim() || 'Rival';
        } else if (matchdayConfig.opponent_selection) {
            const found = allTeamsList.find((t) => t.id === matchdayConfig.opponent_selection);
            opponentFinalName = found ? found.name : 'Rival';
        }

        const scoreFinalStr = `${matchdayConfig.score_home.trim()} - ${matchdayConfig.score_away.trim()}`;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('teams')
                .update({
                    is_matchday_active: matchdayConfig.is_matchday_active,
                    matchday_opponent: matchdayConfig.is_matchday_active ? opponentFinalName : null,
                    matchday_score: matchdayConfig.is_matchday_active ? scoreFinalStr : null,
                    matchday_period: matchdayConfig.is_matchday_active ? matchdayConfig.period : null,
                })
                .eq('id', matchdayModalTeam.id);

            if (error) throw error;
            toast.success(
                matchdayConfig.is_matchday_active
                    ? `Matchday activado: ${matchdayModalTeam.name} vs ${opponentFinalName}`
                    : `Matchday desactivado para ${matchdayModalTeam.name}`
            );

            setTeams((prev) =>
                prev.map((t) =>
                    t.id === matchdayModalTeam.id
                        ? {
                              ...t,
                              is_matchday_active: matchdayConfig.is_matchday_active,
                              matchday_opponent: opponentFinalName,
                              matchday_score: scoreFinalStr,
                              matchday_period: matchdayConfig.period,
                          }
                        : t
                )
            );

            setMatchdayModalTeam(null);
        } catch (e: any) {
            console.error('Error saving matchday config:', e);
            toast.error(`Error: ${e.message}`);
        } finally {
            setSaving(false);
        }
    };

    const executeDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from('teams')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            toast.success('Equipo movido a la papelera');
            setTeams((prev) => prev.filter((c) => c.id !== id));
        } catch (error: unknown) {
            console.error('Error deleting team:', error);
            toast.error('Error al eliminar');
        }
    };

    // Filtros rápidos
    const filteredTeams = useMemo(() => {
        return teams.filter((t) => {
            const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                (t.country && t.country.toLowerCase().includes(search.toLowerCase())) ||
                (t.leagues?.name && t.leagues.name.toLowerCase().includes(search.toLowerCase()));

            if (!matchSearch) return false;

            if (activeTab === 'clubs') return !t.is_national_team;
            if (activeTab === 'national') return t.is_national_team;
            if (activeTab === 'live') return Boolean(t.is_matchday_active);

            return true;
        });
    }, [teams, search, activeTab]);

    const brandsMap = useMemo(() => {
        const m = new Map<string, string>();
        brands.forEach((b) => m.set(b.id, b.name));
        return m;
    }, [brands]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
            {/* 🏷️ Header Apple Style */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            CRM Deportivo
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3 mt-1">
                        <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                        Equipos y Clubes
                    </h1>
                    <p className="text-zinc-400 mt-1 text-xs sm:text-sm">
                        Administra identidad deportiva, marcas oficiales y partidos en vivo.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setEditingTeam(null);
                        setIsModalOpen(true);
                    }}
                    className="bg-white hover:bg-zinc-200 text-black px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_8px_20px_rgba(255,255,255,0.1)] active:scale-[0.98] w-full sm:w-auto text-sm cursor-pointer"
                >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Nuevo Equipo</span>
                </button>
            </div>

            {/* 🛡️ Card Principal en Cristal Translúcido Apple */}
            <div className="relative bg-[#0d0e12]/60 backdrop-blur-xl border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl p-5 sm:p-7">
                {/* Specular Highlight */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                {/* Herramientas & Filtros Rápidos */}
                <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                    {/* Buscador */}
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Buscar por club, país o liga..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Chips de Filtrado Rápido */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
                        {[
                            { key: 'all', label: 'Todos', icon: Layers },
                            { key: 'clubs', label: 'Clubes', icon: Trophy },
                            { key: 'national', label: 'Selecciones', icon: Globe },
                            { key: 'live', label: 'En Vivo', icon: Flame },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            const isSelected = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key as FilterTab)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all select-none cursor-pointer active:scale-[0.98] whitespace-nowrap ${
                                        isSelected
                                            ? 'bg-white text-black shadow-md'
                                            : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tabla de Equipos */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <span className="text-xs text-zinc-400 font-medium">Cargando catálogo deportivo...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto -mx-5 sm:mx-0">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/[0.08] text-[11px] uppercase tracking-wider text-zinc-400">
                                    <th className="py-3.5 px-4 font-bold w-20 text-center whitespace-nowrap">Escudo</th>
                                    <th className="py-3.5 px-4 font-bold min-w-[200px]">Nombre & Tipo</th>
                                    <th className="py-3.5 px-4 font-bold min-w-[140px]">País</th>
                                    <th className="py-3.5 px-4 font-bold min-w-[150px]">Liga Base</th>
                                    <th className="py-3.5 px-4 font-bold min-w-[140px]">Marca Oficial</th>
                                    <th className="py-3.5 px-4 font-bold text-center whitespace-nowrap">Estado</th>
                                    <th className="py-3.5 px-4 font-bold text-right whitespace-nowrap">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredTeams.map((team) => {
                                    const assignedBrandId = teamBrandsMap[team.id];
                                    const brandName = assignedBrandId ? brandsMap.get(assignedBrandId) : null;

                                    return (
                                        <tr key={team.id} className="group hover:bg-white/[0.02] transition-colors">
                                            {/* Escudo */}
                                            <td className="py-3.5 px-4 text-center">
                                                <div className="w-12 h-12 relative mx-auto rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center overflow-hidden p-1 shadow-sm">
                                                    {team.logo_url ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={team.logo_url}
                                                            alt={team.name}
                                                            className="w-full h-full object-contain"
                                                        />
                                                    ) : (
                                                        <Shield className="w-5 h-5 text-zinc-600" />
                                                    )}
                                                </div>
                                            </td>

                                            {/* Nombre & Badge */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-black text-white text-base leading-tight">
                                                        {team.name}
                                                    </span>
                                                    {team.is_national_team && (
                                                        <span className="text-[10px] font-bold text-blue-400 border border-blue-400/20 bg-blue-400/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                            Selección
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs font-mono text-zinc-500 block mt-0.5">
                                                    /{team.slug}
                                                </span>
                                            </td>

                                            {/* País */}
                                            <td className="py-3.5 px-4 text-xs font-semibold text-zinc-300">
                                                {team.country || <span className="text-zinc-600 italic">—</span>}
                                            </td>

                                            {/* Liga Base */}
                                            <td className="py-3.5 px-4">
                                                {team.leagues?.name ? (
                                                    <span className="text-xs font-bold text-amber-400/90 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
                                                        <Trophy className="w-3 h-3" />
                                                        {team.leagues.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-zinc-600 italic">Sin liga</span>
                                                )}
                                            </td>

                                            {/* Marca Patrocinadora Oficial */}
                                            <td className="py-3.5 px-4">
                                                {brandName ? (
                                                    <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
                                                        <Tag className="w-3 h-3" />
                                                        {brandName}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-zinc-600 italic">No asignada</span>
                                                )}
                                            </td>

                                            {/* Estado */}
                                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                        team.active
                                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                    }`}
                                                >
                                                    {team.active ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>

                                            {/* Acciones */}
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => openMatchdayModal(team)}
                                                        title={
                                                            team.is_matchday_active
                                                                ? 'Partido en Vivo activo (Clic para editar)'
                                                                : 'Activar Partido en Vivo (Matchday)'
                                                        }
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.98] ${
                                                            team.is_matchday_active
                                                                ? 'bg-[#E50914] text-white shadow-[0_0_12px_rgba(229,9,20,0.5)] animate-pulse'
                                                                : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                                                        }`}
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                        <span>{team.is_matchday_active ? 'En Vivo' : 'Matchday'}</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingTeam(team);
                                                            setIsModalOpen(true);
                                                        }}
                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer active:scale-[0.98]"
                                                        title="Editar equipo y marca"
                                                    >
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteTarget(team.id)}
                                                        disabled={!isSuperAdmin}
                                                        title={!isSuperAdmin ? 'Solo Super Admins pueden eliminar' : 'Mover a papelera'}
                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {filteredTeams.length === 0 && (
                            <div className="text-center py-16 text-zinc-500 text-sm">
                                No se encontraron equipos con el criterio seleccionado.
                            </div>
                        )}
                    </div>
                )}

                {/* Paginación Apple */}
                {totalCount > PAGE_SIZE && (
                    <div className="flex items-center justify-between mt-6 pt-5 border-t border-white/[0.08]">
                        <p className="text-xs text-zinc-400">
                            Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} de {totalCount} clubes
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setPage((p) => p - 1)}
                                disabled={page === 1}
                                className="w-8 h-8 flex items-center justify-center rounded-xl border border-white/10 text-zinc-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-xs text-zinc-300 font-mono font-bold">
                                {page} / {Math.ceil(totalCount / PAGE_SIZE)}
                            </span>
                            <button
                                type="button"
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page >= Math.ceil(totalCount / PAGE_SIZE)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl border border-white/10 text-zinc-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 🍎 MODAL DE EDICIÓN / CREACIÓN DE EQUIPO (Apple Spring Motion) */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                            className="bg-[#0d0e12] border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90dvh]"
                        >
                            {/* Specular Highlight */}
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                            {/* Modal Header */}
                            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                                <div>
                                    <h2 className="text-lg font-black text-white uppercase tracking-tight">
                                        {editingTeam ? 'Editar Equipo' : 'Nuevo Equipo'}
                                    </h2>
                                    <p className="text-xs text-zinc-400 mt-0.5">
                                        Vincula su liga base y marca técnica para optimizar la creación de productos.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                                {/* Escudo Oficial Optimizado */}
                                <LogoUpload
                                    value={formData.logo_url}
                                    onChange={(url) => setFormData((prev) => ({ ...prev, logo_url: url }))}
                                    folder="teams"
                                    label="Escudo Oficial del Equipo"
                                    description="PNG transparente con el escudo oficial del club o selección"
                                />

                                <div className="space-y-4">
                                    {/* Nombre */}
                                    <div>
                                        <label className="text-xs font-bold uppercase text-zinc-400 mb-2 block tracking-wider">
                                            Nombre del Club / Selección *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none text-sm transition-all"
                                            placeholder="Ej: Real Madrid"
                                        />
                                    </div>

                                    {/* Slug URL */}
                                    <div>
                                        <label className="text-xs font-bold uppercase text-zinc-400 mb-2 block tracking-wider">
                                            Slug URL
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.slug}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none font-mono text-xs transition-all"
                                            placeholder="ej: real-madrid"
                                        />
                                    </div>

                                    {/* Liga Base & Marca Técnica Oficial */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold uppercase text-zinc-400 mb-2 block tracking-wider flex items-center gap-1.5">
                                                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                                                <span>Liga Base</span>
                                            </label>
                                            <select
                                                value={formData.league_id}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, league_id: e.target.value }))}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none text-xs sm:text-sm transition-all"
                                            >
                                                <option value="">-- Seleccionar Liga --</option>
                                                {leagues.map((l) => (
                                                    <option key={l.id} value={l.id}>
                                                        {l.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold uppercase text-zinc-400 mb-2 block tracking-wider flex items-center gap-1.5">
                                                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                                                <span>Marca Oficial / Patrocinador</span>
                                            </label>
                                            <select
                                                value={formData.brand_id}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, brand_id: e.target.value }))}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none text-xs sm:text-sm transition-all"
                                            >
                                                <option value="">-- Sin Marca Habitual --</option>
                                                {brands.map((b) => (
                                                    <option key={b.id} value={b.id}>
                                                        {b.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* País & Tipo */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold uppercase text-zinc-400 mb-2 block tracking-wider">
                                                País de Origen
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.country}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none text-sm transition-all"
                                                placeholder="Ej: España"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold uppercase text-zinc-400 mb-2 block tracking-wider">
                                                Estado
                                            </label>
                                            <select
                                                value={formData.active ? 'true' : 'false'}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.value === 'true' }))}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none text-sm transition-all"
                                            >
                                                <option value="true">Activo en Catálogo</option>
                                                <option value="false">Inactivo / Oculto</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Toggle Selección Nacional */}
                                    <div className="pt-2">
                                        <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer hover:bg-white/[0.05] transition-colors select-none">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_national_team}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, is_national_team: e.target.checked }))}
                                                className="w-4 h-4 rounded border-white/20 bg-black/50 text-primary focus:ring-primary"
                                            />
                                            <div>
                                                <span className="text-sm font-bold text-white block">
                                                    ¿Es una Selección Nacional?
                                                </span>
                                                <span className="text-xs text-zinc-400">
                                                    Marca si el equipo representa a un país (para filtros internacionales).
                                                </span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-5 border-t border-white/10 bg-black/40 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 text-xs font-bold transition-all cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-[0_4px_16px_rgba(229,9,20,0.3)] disabled:opacity-50 active:scale-[0.98] cursor-pointer"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    <span>{saving ? 'Guardando...' : 'Guardar Equipo'}</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 🔴 MODAL DEDICADO MATCHDAY EN VIVO */}
            <AnimatePresence>
                {matchdayModalTeam && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <div className="absolute inset-0" onClick={() => setMatchdayModalTeam(null)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                            className="bg-[#0d0e12] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col"
                        >
                            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#E50914] animate-ping" />
                                    <h2 className="text-base font-black text-white uppercase tracking-tight">
                                        Partido en Vivo · {matchdayModalTeam.name}
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setMatchdayModalTeam(null)}
                                    className="text-zinc-400 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* Toggle Matchday */}
                                <label className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer">
                                    <div>
                                        <span className="text-sm font-bold text-white block">Estado del Partido</span>
                                        <span className="text-xs text-zinc-400">Mostrar barra de partido en vivo en el home</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={matchdayConfig.is_matchday_active}
                                        onChange={(e) =>
                                            setMatchdayConfig((prev) => ({
                                                ...prev,
                                                is_matchday_active: e.target.checked,
                                            }))
                                        }
                                        className="w-4 h-4 rounded border-white/20 bg-black/50 text-primary"
                                    />
                                </label>

                                {matchdayConfig.is_matchday_active && (
                                    <>
                                        {/* Rival */}
                                        <div>
                                            <label className="text-xs font-bold uppercase text-zinc-400 mb-2 block tracking-wider">
                                                Equipo Rival
                                            </label>
                                            <select
                                                value={matchdayConfig.opponent_selection}
                                                onChange={(e) =>
                                                    setMatchdayConfig((prev) => ({
                                                        ...prev,
                                                        opponent_selection: e.target.value,
                                                    }))
                                                }
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none text-sm"
                                            >
                                                <option value="">-- Seleccionar de la lista --</option>
                                                {allTeamsList
                                                    .filter((t) => t.id !== matchdayModalTeam.id)
                                                    .map((t) => (
                                                        <option key={t.id} value={t.id}>
                                                            {t.name}
                                                        </option>
                                                    ))}
                                                <option value="custom">Otro (Escribir nombre manual)...</option>
                                            </select>

                                            {matchdayConfig.opponent_selection === 'custom' && (
                                                <input
                                                    type="text"
                                                    value={matchdayConfig.opponent_custom_name}
                                                    onChange={(e) =>
                                                        setMatchdayConfig((prev) => ({
                                                            ...prev,
                                                            opponent_custom_name: e.target.value,
                                                        }))
                                                    }
                                                    placeholder="Nombre del rival"
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none text-sm mt-2"
                                                />
                                            )}
                                        </div>

                                        {/* Marcador */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold uppercase text-zinc-400 mb-1 block">
                                                    Goles {matchdayModalTeam.name.slice(0, 10)}
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={matchdayConfig.score_home}
                                                    onChange={(e) =>
                                                        setMatchdayConfig((prev) => ({
                                                            ...prev,
                                                            score_home: e.target.value,
                                                        }))
                                                    }
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-mono text-center text-lg font-bold outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold uppercase text-zinc-400 mb-1 block">
                                                    Goles Rival
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={matchdayConfig.score_away}
                                                    onChange={(e) =>
                                                        setMatchdayConfig((prev) => ({
                                                            ...prev,
                                                            score_away: e.target.value,
                                                        }))
                                                    }
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-mono text-center text-lg font-bold outline-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Periodo */}
                                        <div>
                                            <label className="text-xs font-bold uppercase text-zinc-400 mb-1 block">
                                                Periodo del Partido
                                            </label>
                                            <input
                                                type="text"
                                                value={matchdayConfig.period}
                                                onChange={(e) =>
                                                    setMatchdayConfig((prev) => ({ ...prev, period: e.target.value }))
                                                }
                                                placeholder="Ej: En Vivo 65', Medio Tiempo, Final"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm outline-none"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="p-5 border-t border-white/10 bg-black/40 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setMatchdayModalTeam(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveMatchdayConfig}
                                    disabled={saving}
                                    className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-[0.98]"
                                >
                                    {saving ? 'Guardando...' : 'Aplicar Marcador'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Confirmar Eliminación */}
            <ConfirmDialog
                open={Boolean(deleteTarget)}
                title="Mover a Papelera"
                message="¿Estás seguro de mover este equipo a la papelera? Podrás restaurarlo más tarde desde la configuración."
                confirmLabel="Mover a Papelera"
                danger
                onConfirm={() => {
                    if (deleteTarget) {
                        executeDelete(deleteTarget);
                        setDeleteTarget(null);
                    }
                }}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
