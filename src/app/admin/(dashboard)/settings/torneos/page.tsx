'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Radio,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Globe2,
  Sparkles,
  ArrowRight,
  Search,
  ExternalLink,
  ChevronDown,
  Shield,
  HelpCircle,
  Zap,
} from 'lucide-react';
import useToastMessage from '@/hooks/useToastMessage';
import type { LeagueDefinition, TeamDiscoveryMapping } from '@/lib/matchdayLeagues';

type CategoryFilter = 'Todos' | 'Copas Nacionales' | 'Ligas Principales' | 'Torneos Continentales' | 'Selecciones & FIFA' | 'Personalizados';

export default function AdminTorneosSettingsPage() {
  const toast = useToastMessage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Datos del backend
  const [defaultLeagues, setDefaultLeagues] = useState<LeagueDefinition[]>([]);
  const [customLeagues, setCustomLeagues] = useState<LeagueDefinition[]>([]);
  const [disabledLeagues, setDisabledLeagues] = useState<string[]>([]);
  const [suggestedLeagues, setSuggestedLeagues] = useState<LeagueDefinition[]>([]);
  const [popularTeams, setPopularTeams] = useState<TeamDiscoveryMapping[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  // Búsqueda inteligente / Descubrimiento
  const [discoveryQuery, setDiscoveryQuery] = useState('');

  // Modo manual avanzado (colapsable)
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualSlug, setManualSlug] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualCategory, setManualCategory] = useState<LeagueDefinition['category']>('Personalizados');
  const [manualCountry, setManualCountry] = useState('');
  const [testingManualSlug, setTestingManualSlug] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; name?: string; message?: string; eventsCount?: number } | null>(null);

  // Filtros de la lista activa
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('Todos');
  const [listSearch, setListSearch] = useState('');

  // Cargar configuración desde el backend
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/torneos');
      if (!res.ok) throw new Error('Error al consultar configuración');
      const data = await res.json();

      setDefaultLeagues(data.default_leagues || []);
      setCustomLeagues(data.custom_leagues || []);
      setDisabledLeagues(data.disabled_leagues || []);
      setSuggestedLeagues(data.suggested_leagues || []);
      setPopularTeams(data.popular_teams || []);
      setUpdatedAt(data.updated_at || null);
    } catch (err) {
      console.error('Error al cargar torneos:', err);
      toast.error('Error al cargar la lista de torneos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Lista combinada de torneos en seguimiento
  const trackedLeagues = useMemo(() => {
    return [...defaultLeagues, ...customLeagues];
  }, [defaultLeagues, customLeagues]);

  const activeSlugsSet = useMemo(() => {
    const disabledSet = new Set(disabledLeagues);
    return new Set(trackedLeagues.map((l) => l.slug).filter((s) => !disabledSet.has(s)));
  }, [trackedLeagues, disabledLeagues]);

  const allTrackedSlugsSet = useMemo(() => {
    return new Set(trackedLeagues.map((l) => l.slug));
  }, [trackedLeagues]);

  // ── RESULTADOS DE BÚSQUEDA INTELIGENTE ──────────────────────────────────────
  const normalizedQuery = discoveryQuery.trim().toLowerCase();

  // 1. Equipos coincidentes
  const matchedTeams = useMemo(() => {
    if (!normalizedQuery || normalizedQuery.length < 2) return [];
    return popularTeams.filter((t) => {
      const nameMatch = t.name.toLowerCase().includes(normalizedQuery);
      const aliasMatch = t.aliases.some((a) => a.toLowerCase().includes(normalizedQuery));
      return nameMatch || aliasMatch;
    });
  }, [popularTeams, normalizedQuery]);

  // 2. Torneos / Países coincidentes del catálogo global
  const matchedSuggestedLeagues = useMemo(() => {
    if (!normalizedQuery || normalizedQuery.length < 2) return [];
    const filtered = suggestedLeagues.filter((l) => {
      const nameMatch = l.name.toLowerCase().includes(normalizedQuery);
      const countryMatch = l.country && l.country.toLowerCase().includes(normalizedQuery);
      const slugMatch = l.slug.toLowerCase().includes(normalizedQuery);
      const keywordsMatch = l.keywords?.some((k) => k.toLowerCase().includes(normalizedQuery));
      return nameMatch || countryMatch || slugMatch || keywordsMatch;
    });

    return filtered.sort((a, b) => {
      const getScore = (item: LeagueDefinition) => {
        const country = (item.country || '').toLowerCase();
        const name = item.name.toLowerCase();
        const slug = item.slug.toLowerCase();

        if (country === normalizedQuery || slug === normalizedQuery) return 100;
        if (country.startsWith(normalizedQuery)) return 80;
        if (name === normalizedQuery) return 75;
        if (name.startsWith(normalizedQuery)) return 70;
        if (slug.startsWith(normalizedQuery)) return 60;
        if (country.includes(normalizedQuery)) return 50;
        if (name.includes(normalizedQuery)) return 40;
        return 10;
      };
      return getScore(b) - getScore(a);
    });
  }, [suggestedLeagues, normalizedQuery]);

  // Añadir torneo sugerido con 1 clic
  const handleAddSuggestedLeague = (league: LeagueDefinition) => {
    if (disabledLeagues.includes(league.slug)) {
      // Si ya estaba en la lista pero apagado, lo encendemos
      setDisabledLeagues((prev) => prev.filter((s) => s !== league.slug));
      toast.success(`Torneo "${league.name}" reactivado. Recuerda guardar cambios.`);
      return;
    }

    if (allTrackedSlugsSet.has(league.slug)) {
      toast.info(`El torneo "${league.name}" ya está activo en tu lista.`);
      return;
    }

    setCustomLeagues((prev) => [...prev, league]);
    toast.success(`Torneo "${league.name}" añadido. Pulsa "Guardar Cambios" para sincronizar.`);
  };

  // Probar slug manual con ESPN
  const handleTestManualSlug = async () => {
    const slug = manualSlug.trim().toLowerCase();
    if (!slug) {
      toast.error('Ingresa un slug para probar');
      return;
    }

    setTestingManualSlug(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/admin/settings/torneos?testSlug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      setTestResult(data);
      if (data.valid) {
        if (!manualName.trim()) {
          setManualName(data.name || slug);
        }
        toast.success(`ESPN reconoció el torneo: ${data.name}`);
      } else {
        toast.error(data.message || 'No se pudo verificar el torneo');
      }
    } catch {
      toast.error('Error al conectar con ESPN');
    } finally {
      setTestingManualSlug(false);
    }
  };

  // Añadir torneo manual
  const handleAddManualLeague = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = manualSlug.trim().toLowerCase();
    const name = manualName.trim();

    if (!slug || !name) {
      toast.error('Slug y Nombre son obligatorios');
      return;
    }

    if (allTrackedSlugsSet.has(slug)) {
      toast.error(`El torneo con slug "${slug}" ya está registrado`);
      return;
    }

    const newLeague: LeagueDefinition = {
      slug,
      name,
      category: manualCategory,
      country: manualCountry.trim() || undefined,
    };

    setCustomLeagues((prev) => [...prev, newLeague]);
    setManualSlug('');
    setManualName('');
    setManualCountry('');
    setTestResult(null);
    toast.success(`Torneo "${name}" añadido a la lista.`);
  };

  // Eliminar torneo custom
  const handleDeleteCustom = (slug: string) => {
    setCustomLeagues((prev) => prev.filter((l) => l.slug !== slug));
    setDisabledLeagues((prev) => prev.filter((s) => s !== slug));
    toast.info('Torneo removido. Recuerda guardar cambios.');
  };

  // Alternar interruptor (On/Off)
  const toggleLeague = (slug: string) => {
    setDisabledLeagues((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      } else {
        return [...prev, slug];
      }
    });
  };

  // Guardar en Supabase
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings/torneos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          custom_leagues: customLeagues,
          disabled_leagues: disabledLeagues,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al guardar');
      }

      const data = await res.json();
      setUpdatedAt(data.updated_at || new Date().toISOString());
      toast.success('¡Torneos guardados en Supabase! Matchday sincronizado en vivo.');
    } catch (err: any) {
      console.error('Error saving torneos:', err);
      toast.error(err?.message || 'Error al guardar los torneos');
    } finally {
      setSaving(false);
    }
  };

  // Filtrado de la lista activa
  const filteredActiveLeagues = useMemo(() => {
    return trackedLeagues.filter((league) => {
      const matchesSearch =
        listSearch === '' ||
        league.name.toLowerCase().includes(listSearch.toLowerCase()) ||
        league.slug.toLowerCase().includes(listSearch.toLowerCase()) ||
        (league.country && league.country.toLowerCase().includes(listSearch.toLowerCase()));

      const matchesCat =
        categoryFilter === 'Todos' || league.category === categoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [trackedLeagues, listSearch, categoryFilter]);

  const activeCount = trackedLeagues.length - disabledLeagues.length;
  const copasCount = trackedLeagues.filter((l) => l.category === 'Copas Nacionales' && !disabledLeagues.includes(l.slug)).length;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* ── ENCABEZADO ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
              <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              Tiempo Real ESPN
            </span>
            <span className="text-gray-500 text-xs">• Sin necesidad de redeploy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Torneos & Copas Matchday
          </h1>
          <p className="text-gray-400 text-sm mt-1 max-w-2xl">
            Gestiona qué ligas y copas en vivo consulta el sistema en tiempo real. Busca por nombre de equipo (ej. <em>Boca, Real Madrid</em>) o por país/torneo (ej. <em>Colombia, Copa Argentina</em>) y agrégalos con 1 clic.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-neutral-900 border border-white/10 text-gray-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
            title="Recargar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving || loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-red-700 active:scale-[0.98] text-white font-bold text-sm shadow-[0_4px_20px_rgba(229,9,20,0.35)] transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>

      {/* ── KPIS RÁPIDOS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Torneos Monitoreados</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-white">{activeCount}</span>
            <span className="text-xs text-gray-500 font-medium">de {trackedLeagues.length}</span>
          </div>
        </div>

        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Copas Nacionales</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-amber-400">{copasCount}</span>
            <span className="text-xs text-gray-500 font-medium">activas</span>
          </div>
        </div>

        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Personalizados</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-blue-400">{customLeagues.length}</span>
            <span className="text-xs text-gray-500 font-medium">añadidos</span>
          </div>
        </div>

        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Última Sincro</span>
          <div className="mt-1.5 text-xs text-gray-300 font-medium truncate">
            {updatedAt ? new Date(updatedAt).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Por defecto'}
          </div>
        </div>
      </div>

      {/* ── 🌟 BUSCADOR PREDICTIVO INTELIGENTE (EQUIPOS O TORNEOS) ── */}
      <div className="bg-gradient-to-br from-[#121318] via-neutral-900/90 to-black border border-white/15 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-red-500/15 text-red-400 border border-red-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Buscador Inteligente de Torneos y Equipos
              </h2>
              <p className="text-xs text-gray-400">
                Escribe el nombre de un <strong>club</strong> (ej. <em>Boca, Racing, Flamengo</em>) o de un <strong>país/liga</strong> (ej. <em>Colombia, Copa Argentina, Arabia</em>). El sistema encuentra el torneo oficial automáticamente.
              </p>
            </div>
          </div>

          {/* Input de Búsqueda Predictiva */}
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={discoveryQuery}
              onChange={(e) => setDiscoveryQuery(e.target.value)}
              placeholder="Buscar por equipo, país o torneo (ej. Boca, Colombia, Copa Argentina, Real Madrid, Al Nassr)..."
              className="w-full bg-black/70 border border-white/20 focus:border-red-500/80 rounded-2xl pl-12 pr-4 py-3.5 text-sm sm:text-base text-white outline-none transition-all placeholder:text-gray-500 shadow-inner"
            />
            {discoveryQuery && (
              <button
                type="button"
                onClick={() => setDiscoveryQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-xs text-gray-400 hover:text-white bg-white/10"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Sugerencias Rápidas Populares */}
          {!discoveryQuery && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-gray-500 font-medium">Búsquedas populares:</span>
              {[
                'Boca Juniors',
                'Copa Argentina',
                'Colombia',
                'Flamengo',
                'Arabia Saudita',
                'Eredivisie',
                'Copa del Rey',
              ].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setDiscoveryQuery(term)}
                  className="px-2.5 py-1 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 text-xs text-gray-300 font-medium transition-all cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── RESULTADOS DINÁMICOS DE DESCUBRIMIENTO ── */}
        {discoveryQuery && (
          <div className="relative z-10 mt-6 pt-6 border-t border-white/10 space-y-6 animate-fadeIn">
            {/* 1. SECCIÓN: EQUIPOS DETECTADOS */}
            {matchedTeams.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <Shield className="w-3.5 h-3.5 text-red-400" />
                  <span>Equipos encontrados ({matchedTeams.length})</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {matchedTeams.map((team) => (
                    <div
                      key={team.name}
                      className="p-4 rounded-2xl bg-neutral-900/90 border border-white/15 space-y-3 shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{team.flag}</span>
                          <div>
                            <h3 className="text-sm font-black text-white">{team.name}</h3>
                            <span className="text-[11px] text-gray-400">{team.country}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-gray-300">
                          {team.leagueSlugs.length} torneos
                        </span>
                      </div>

                      {/* Lista de torneos en los que juega el equipo */}
                      <div className="space-y-1.5 pt-2 border-t border-white/5">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                          Torneos donde compite:
                        </span>
                        {team.leagueSlugs.map((slug) => {
                          const def = suggestedLeagues.find((s) => s.slug === slug);
                          const isAlreadyActive = activeSlugsSet.has(slug);
                          const isTracked = allTrackedSlugsSet.has(slug);

                          return (
                            <div
                              key={slug}
                              className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/5 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-base">{def?.flag || '🏆'}</span>
                                <span className="text-white font-medium">{def?.name || slug}</span>
                                <code className="text-[10px] text-gray-500 font-mono">({slug})</code>
                              </div>

                              {isAlreadyActive ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Activo</span>
                                </span>
                              ) : isTracked ? (
                                <button
                                  type="button"
                                  onClick={() => toggleLeague(slug)}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[11px] hover:bg-amber-500/30 transition-all cursor-pointer"
                                >
                                  Reactivar
                                </button>
                              ) : def ? (
                                <button
                                  type="button"
                                  onClick={() => handleAddSuggestedLeague(def)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Añadir</span>
                                </button>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. SECCIÓN: TORNEOS O PAÍSES DETECTADOS */}
            {matchedSuggestedLeagues.length > 0 && (
              <div className="space-y-3">
                {(normalizedQuery.includes('catar') || normalizedQuery.includes('qatar')) && (
                  <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2.5">
                    <span className="text-base">ℹ️</span>
                    <div>
                      <strong className="text-white block font-bold mb-0.5">Nota sobre el fútbol de Catar:</strong>
                      ESPN no cuenta con endpoint oficial para la liga local de Catar (<em>Qatar Stars League</em>). No obstante, los clubes y la selección de Catar compiten en los torneos continentales oficiales de ESPN mostrados abajo (<em>AFC Champions League, Arabian Gulf Cup y Copa Asiática AFC</em>).
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Torneos sugeridos ({matchedSuggestedLeagues.length})</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {matchedSuggestedLeagues.map((league) => {
                    const isAlreadyActive = activeSlugsSet.has(league.slug);
                    const isTracked = allTrackedSlugsSet.has(league.slug);

                    return (
                      <div
                        key={league.slug}
                        className="p-3.5 rounded-2xl bg-neutral-900/90 border border-white/10 flex flex-col justify-between gap-3 shadow-md"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{league.flag || '🏆'}</span>
                            <span className="text-sm font-bold text-white line-clamp-1">{league.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-gray-400">
                            <code className="text-gray-400 bg-white/5 px-1.5 py-0.5 rounded font-mono text-[10px]">
                              {league.slug}
                            </code>
                            {league.country && <span>• {league.country}</span>}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                          <span className="text-[10px] text-gray-500">{league.category}</span>

                          {isAlreadyActive ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>En seguimiento</span>
                            </span>
                          ) : isTracked ? (
                            <button
                              type="button"
                              onClick={() => toggleLeague(league.slug)}
                              className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs hover:bg-amber-500/30 transition-all cursor-pointer"
                            >
                              Reactivar
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddSuggestedLeague(league)}
                              className="px-3 py-1.5 rounded-xl bg-[#E50914] hover:bg-red-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Añadir a Matchday</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sin coincidencias en el diccionario predictivo */}
            {matchedTeams.length === 0 && matchedSuggestedLeagues.length === 0 && (
              <div className="p-6 rounded-2xl bg-neutral-900/50 border border-white/10 text-center space-y-3">
                <HelpCircle className="w-8 h-8 text-gray-500 mx-auto" />
                <p className="text-sm text-gray-300">
                  No se encontró un torneo o equipo predefinido para <strong>&ldquo;{discoveryQuery}&rdquo;</strong>.
                </p>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Si conoces el código de ESPN, puedes probarlo y añadirlo mediante el modo manual a continuación.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setManualSlug(discoveryQuery.toLowerCase().replace(/\s+/g, ''));
                    setShowManualForm(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Abrir formulario manual con &ldquo;{discoveryQuery}&rdquo;
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODO MANUAL AVANZADO (COLAPSABLE) ── */}
      <div className="bg-neutral-900/40 border border-white/10 rounded-2xl p-4 sm:p-5">
        <button
          type="button"
          onClick={() => setShowManualForm(!showManualForm)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-bold text-gray-300">
              Modo Avanzado: Ingresar slug técnico de ESPN manualmente
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showManualForm ? 'rotate-180' : ''}`} />
        </button>

        {showManualForm && (
          <form onSubmit={handleAddManualLeague} className="mt-5 pt-5 border-t border-white/10 space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Slug ESPN <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={manualSlug}
                  onChange={(e) => {
                    setManualSlug(e.target.value.toLowerCase().replace(/\s+/g, ''));
                    setTestResult(null);
                  }}
                  placeholder="ej. arg.copa, col.1, chi.1"
                  required
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-primary outline-none transition-all placeholder:text-gray-600"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Nombre en Tienda <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="ej. Copa Argentina"
                  required
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-primary outline-none transition-all placeholder:text-gray-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Categoría
                </label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value as any)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary outline-none transition-all"
                >
                  <option value="Copas Nacionales">Copas Nacionales</option>
                  <option value="Ligas Principales">Ligas Principales</option>
                  <option value="Torneos Continentales">Torneos Continentales</option>
                  <option value="Selecciones & FIFA">Selecciones & FIFA</option>
                  <option value="Personalizados">Personalizados</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  País (Opcional)
                </label>
                <input
                  type="text"
                  value={manualCountry}
                  onChange={(e) => setManualCountry(e.target.value)}
                  placeholder="ej. Argentina"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-primary outline-none transition-all placeholder:text-gray-600"
                />
              </div>
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                testResult.valid
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}>
                {testResult.valid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>Verificado con ESPN:</strong> Reconocido como <strong>{testResult.name}</strong> ({testResult.eventsCount} eventos registrados para hoy).
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{testResult.message || 'El slug no devolvió una cartelera válida en ESPN.'}</span>
                  </>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestManualSlug}
                disabled={testingManualSlug || !manualSlug.trim()}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer flex items-center gap-2"
              >
                {testingManualSlug ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5 text-red-400" />}
                <span>Probar con ESPN</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-white hover:bg-gray-100 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Añadir</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── LISTA DE TORNEOS ACTIVOS EN SEGUIMIENTO ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white tracking-tight">
              Torneos en Seguimiento ({trackedLeagues.length})
            </h2>
            <span className="text-xs text-gray-500">
              ({activeCount} activos, {disabledLeagues.length} pausados)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Categorías */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {(['Todos', 'Copas Nacionales', 'Ligas Principales', 'Torneos Continentales', 'Selecciones & FIFA', 'Personalizados'] as CategoryFilter[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-white text-black shadow-sm'
                      : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Buscador dentro de la lista */}
            <div className="relative w-48 hidden sm:block">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="Filtrar lista..."
                className="w-full bg-black/60 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:border-primary outline-none transition-all placeholder:text-gray-600"
              />
            </div>
          </div>
        </div>

        {/* Grid de Torneos */}
        {filteredActiveLeagues.length === 0 ? (
          <div className="bg-neutral-900/40 border border-white/10 rounded-2xl p-10 text-center text-gray-500">
            No se encontraron torneos en esta categoría.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredActiveLeagues.map((league) => {
              const isDisabled = disabledLeagues.includes(league.slug);
              const isCustom = customLeagues.some((c) => c.slug === league.slug);

              return (
                <div
                  key={league.slug}
                  className={`relative p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
                    isDisabled
                      ? 'bg-neutral-950/40 border-white/5 opacity-55'
                      : 'bg-neutral-900/70 border-white/10 hover:border-white/20 shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{league.flag || '🏆'}</span>
                        <span className="text-sm font-bold text-white leading-snug line-clamp-1">
                          {league.name}
                        </span>
                        {isCustom && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        <code className="text-gray-400 bg-white/5 px-1.5 py-0.5 rounded font-mono text-[10px]">
                          {league.slug}
                        </code>
                        {league.country && <span>• {league.country}</span>}
                      </div>
                    </div>

                    {/* Switch On/Off */}
                    <button
                      type="button"
                      onClick={() => toggleLeague(league.slug)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        !isDisabled ? 'bg-[#E50914]' : 'bg-neutral-700'
                      }`}
                      role="switch"
                      aria-checked={!isDisabled}
                      title={!isDisabled ? 'Pausar monitoreo' : 'Activar monitoreo'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          !isDisabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                    <span className="text-gray-500">{league.category}</span>

                    <div className="flex items-center gap-2">
                      <a
                        href={`https://site.api.espn.com/apis/site/v2/sports/soccer/${league.slug}/scoreboard`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-500 hover:text-white transition-colors flex items-center gap-1"
                        title="Ver JSON de ESPN"
                      >
                        <span>ESPN API</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustom(league.slug)}
                          className="text-red-400 hover:text-red-300 transition-colors p-1 cursor-pointer"
                          title="Eliminar torneo personalizado"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Botón flotante móvil */}
      <div className="fixed bottom-4 right-4 z-40 sm:hidden">
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving || loading}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#E50914] text-white font-bold text-sm shadow-[0_8px_30px_rgba(229,9,20,0.5)] active:scale-95 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Guardar Cambios</span>
        </button>
      </div>
    </div>
  );
}
