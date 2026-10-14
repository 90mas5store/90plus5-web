import { useState, useEffect, useCallback, useMemo } from "react";
import useToastMessage from "@/hooks/useToastMessage";
import { LeagueDefinition, TeamDiscoveryMapping, CategoryFilter, ManualTestResult } from "./types";

export function useTorneosManager() {
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
    const [discoveryQuery, setDiscoveryQuery] = useState("");

    // Modo manual avanzado (colapsable)
    const [showManualForm, setShowManualForm] = useState(false);
    const [manualSlug, setManualSlug] = useState("");
    const [manualName, setManualName] = useState("");
    const [manualCategory, setManualCategory] = useState<LeagueDefinition["category"]>("Personalizados");
    const [manualCountry, setManualCountry] = useState("");
    const [testingManualSlug, setTestingManualSlug] = useState(false);
    const [testResult, setTestResult] = useState<ManualTestResult | null>(null);

    // Filtros de la lista activa
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("Todos");
    const [listSearch, setListSearch] = useState("");

    // Cargar configuración desde el backend
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/settings/torneos");
            if (!res.ok) throw new Error("Error al consultar configuración");
            const data = await res.json();

            setDefaultLeagues(data.default_leagues || []);
            setCustomLeagues(data.custom_leagues || []);
            setDisabledLeagues(data.disabled_leagues || []);
            setSuggestedLeagues(data.suggested_leagues || []);
            setPopularTeams(data.popular_teams || []);
            setUpdatedAt(data.updated_at || null);
        } catch (err) {
            console.error("Error al cargar torneos:", err);
            toast.error("Error al cargar la lista de torneos");
        } finally {
            setLoading(false);
        }
    }, [toast]);

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

    // Búsqueda predictiva
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
                const country = (item.country || "").toLowerCase();
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
            toast.error("Ingresa un slug para probar");
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
                toast.error(data.message || "No se pudo verificar el torneo");
            }
        } catch {
            toast.error("Error al conectar con ESPN");
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
            toast.error("Slug y Nombre son obligatorios");
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
        setManualSlug("");
        setManualName("");
        setManualCountry("");
        setTestResult(null);
        toast.success(`Torneo "${name}" añadido a la lista.`);
    };

    // Eliminar torneo custom
    const handleDeleteCustom = (slug: string) => {
        setCustomLeagues((prev) => prev.filter((l) => l.slug !== slug));
        setDisabledLeagues((prev) => prev.filter((s) => s !== slug));
        toast.info("Torneo removido. Recuerda guardar cambios.");
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
            const res = await fetch("/api/admin/settings/torneos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    custom_leagues: customLeagues,
                    disabled_leagues: disabledLeagues,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "Error al guardar");
            }

            const data = await res.json();
            setUpdatedAt(data.updated_at || new Date().toISOString());
            toast.success("¡Torneos guardados en Supabase! Matchday sincronizado en vivo.");
        } catch (err: unknown) {
            const error = err as { message?: string };
            console.error("Error saving torneos:", err);
            toast.error(error?.message || "Error al guardar los torneos");
        } finally {
            setSaving(false);
        }
    };

    // Filtrado de la lista activa
    const filteredActiveLeagues = useMemo(() => {
        return trackedLeagues.filter((league) => {
            const matchesSearch =
                listSearch === "" ||
                league.name.toLowerCase().includes(listSearch.toLowerCase()) ||
                league.slug.toLowerCase().includes(listSearch.toLowerCase()) ||
                (league.country && league.country.toLowerCase().includes(listSearch.toLowerCase()));

            const matchesCat = categoryFilter === "Todos" || league.category === categoryFilter;

            return matchesSearch && matchesCat;
        });
    }, [trackedLeagues, listSearch, categoryFilter]);

    const activeCount = trackedLeagues.length - disabledLeagues.length;
    const copasCount = trackedLeagues.filter(
        (l) => l.category === "Copas Nacionales" && !disabledLeagues.includes(l.slug)
    ).length;

    const handleOpenManualWithQuery = (q: string) => {
        setManualSlug(q.toLowerCase().replace(/\s+/g, ""));
        setShowManualForm(true);
    };

    return {
        loading,
        saving,
        updatedAt,
        loadData,
        handleSaveAll,

        // Descubrimiento
        discoveryQuery,
        setDiscoveryQuery,
        matchedTeams,
        matchedSuggestedLeagues,
        suggestedLeagues,
        activeSlugsSet,
        allTrackedSlugsSet,
        handleAddSuggestedLeague,
        handleOpenManualWithQuery,

        // Manual
        showManualForm,
        setShowManualForm,
        manualSlug,
        setManualSlug,
        manualName,
        setManualName,
        manualCategory,
        setManualCategory,
        manualCountry,
        setManualCountry,
        testingManualSlug,
        testResult,
        handleTestManualSlug,
        handleAddManualLeague,

        // Lista y filtros
        trackedLeagues,
        filteredActiveLeagues,
        activeCount,
        copasCount,
        disabledLeagues,
        customLeagues,
        categoryFilter,
        setCategoryFilter,
        listSearch,
        setListSearch,
        toggleLeague,
        handleDeleteCustom,
    };
}
