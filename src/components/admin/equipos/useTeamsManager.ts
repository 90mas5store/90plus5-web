'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import useToastMessage from '@/hooks/useToastMessage';
import { useAdminRole } from '@/hooks/useAdminRole';
import { getTeamBrandsMap, setTeamBrandDefault, TeamBrandMap } from '@/lib/teamBrandSettings';
import { Team, League, Brand, FilterTab, MatchdayConfig, TeamFormData } from './types';

export const PAGE_SIZE = 20;

export function useTeamsManager() {
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
    const [matchdayConfig, setMatchdayConfig] = useState<MatchdayConfig>({
        is_matchday_active: true,
        opponent_selection: '',
        opponent_custom_name: '',
        score_home: '0',
        score_away: '0',
        period: 'En Vivo',
    });

    const [formData, setFormData] = useState<TeamFormData>({
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
            const matchSearch =
                t.name.toLowerCase().includes(search.toLowerCase()) ||
                (t.country && t.country.toLowerCase().includes(search.toLowerCase())) ||
                (t.leagues?.name && t.leagues.name.toLowerCase().includes(search.toLowerCase()));

            if (!matchSearch) return false;

            if (activeTab === 'clubs') return !t.is_national_team;
            if (activeTab === 'national') return t.is_national_team;
            if (activeTab === 'live') return t.is_matchday_active;

            return true;
        });
    }, [teams, search, activeTab]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return {
        teams: filteredTeams,
        allTeamsList,
        leagues,
        brands,
        teamBrandsMap,
        loading,
        search,
        setSearch,
        activeTab,
        setActiveTab,
        page,
        setPage,
        totalCount,
        totalPages,
        isModalOpen,
        setIsModalOpen,
        editingTeam,
        setEditingTeam,
        saving,
        deleteTarget,
        setDeleteTarget,
        matchdayModalTeam,
        setMatchdayModalTeam,
        matchdayConfig,
        setMatchdayConfig,
        formData,
        setFormData,
        handleSave,
        openMatchdayModal,
        handleSaveMatchdayConfig,
        executeDelete,
        isSuperAdmin,
    };
}

