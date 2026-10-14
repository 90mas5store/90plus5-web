import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import useToastMessage from "@/hooks/useToastMessage";
import { Patch, Size, Team, Player, League, Category, EMPTY_PATCH, EMPTY_SIZE } from "./types";

export function useEstilosManager() {
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;
    const toast = useToastMessage();

    const [activeTab, setActiveTab] = useState<"parches" | "tallas" | "plantillas">("parches");

    // ── Parches ──────────────────────────────────────────
    const [patches, setPatches] = useState<Patch[]>([]);
    const [patchesLoading, setPatchesLoading] = useState(true);
    const [patchSaving, setPatchSaving] = useState(false);
    const [editingPatch, setEditingPatch] = useState<Patch | null>(null);
    const [patchForm, setPatchForm] = useState(EMPTY_PATCH);
    const [patchDeleteTarget, setPatchDeleteTarget] = useState<string | null>(null);
    const [leagues, setLeagues] = useState<League[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    // ── Tallas ────────────────────────────────────────────
    const [sizes, setSizes] = useState<Size[]>([]);
    const [sizesLoading, setSizesLoading] = useState(true);
    const [sizeSaving, setSizeSaving] = useState(false);
    const [editingSize, setEditingSize] = useState<Size | null>(null);
    const [sizeForm, setSizeForm] = useState(EMPTY_SIZE);
    const [sizeDeleteTarget, setSizeDeleteTarget] = useState<string | null>(null);

    // ── Plantillas ────────────────────────────────────────
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState("");
    const [players, setPlayers] = useState<Player[]>([]);
    const [playersLoading, setPlayersLoading] = useState(false);
    const [newPlayer, setNewPlayer] = useState({ name: "", number: "" });
    const [addingPlayer, setAddingPlayer] = useState(false);
    const [playerDeleteTarget, setPlayerDeleteTarget] = useState<string | null>(null);
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
    const [editPlayerForm, setEditPlayerForm] = useState({ name: "", number: "" });
    const [savingPlayer, setSavingPlayer] = useState(false);
    const [showInactive, setShowInactive] = useState(false);

    // ── Carga inicial ─────────────────────────────────────
    const fetchPatches = useCallback(async () => {
        setPatchesLoading(true);
        const { data, error } = await supabase
            .from("patches")
            .select("*")
            .order("name");
        if (error) toast.error("Error al cargar parches");
        else setPatches(data || []);
        setPatchesLoading(false);
    }, [supabase, toast]);

    const fetchLeagues = useCallback(async () => {
        const { data } = await supabase
            .from("leagues")
            .select("id, name")
            .order("name");
        setLeagues(data || []);
    }, [supabase]);

    const fetchCategories = useCallback(async () => {
        const { data } = await supabase
            .from("categories")
            .select("id, name")
            .is("deleted_at", null)
            .order("name");
        setCategories(data || []);
    }, [supabase]);

    const fetchSizes = useCallback(async () => {
        setSizesLoading(true);
        const { data, error } = await supabase
            .from("sizes")
            .select("*")
            .order("sort_order", { ascending: true, nullsFirst: false });
        if (error) toast.error("Error al cargar tallas");
        else setSizes(data || []);
        setSizesLoading(false);
    }, [supabase, toast]);

    const fetchTeams = useCallback(async () => {
        const { data } = await supabase
            .from("teams")
            .select("id, name")
            .order("name");
        setTeams(data || []);
    }, [supabase]);

    useEffect(() => {
        fetchPatches();
        fetchLeagues();
        fetchCategories();
        fetchSizes();
        fetchTeams();
    }, [fetchPatches, fetchLeagues, fetchCategories, fetchSizes, fetchTeams]);

    // Jugadores al cambiar equipo
    useEffect(() => {
        if (!selectedTeamId) {
            setPlayers([]);
            return;
        }
        setPlayersLoading(true);
        supabase
            .from("players")
            .select("*")
            .eq("team_id", selectedTeamId)
            .order("number", { ascending: true })
            .then(({ data }) => {
                setPlayers(data || []);
                setPlayersLoading(false);
            });
    }, [selectedTeamId, supabase]);

    // ── Patches CRUD ──────────────────────────────────────
    const openEditPatch = (p: Patch) => {
        setEditingPatch(p);
        setPatchForm({
            name: p.name,
            competition_id: p.competition_id || "",
            category_id: p.category_id || "",
            active: p.active,
        });
    };

    const openNewPatch = () => {
        setEditingPatch(null);
        setPatchForm(EMPTY_PATCH);
    };

    const handleSavePatch = async () => {
        if (!patchForm.name.trim()) {
            toast.error("El nombre es obligatorio");
            return;
        }
        setPatchSaving(true);
        try {
            const payload = {
                name: patchForm.name.trim(),
                active: patchForm.active,
                competition_id: patchForm.competition_id || null,
                category_id: patchForm.category_id || null,
            };
            if (editingPatch) {
                const { error } = await supabase
                    .from("patches")
                    .update(payload)
                    .eq("id", editingPatch.id);
                if (error) throw error;
                toast.success("Parche actualizado");
            } else {
                const { error } = await supabase
                    .from("patches")
                    .insert(payload);
                if (error) throw error;
                toast.success("Parche creado");
            }
            openNewPatch();
            fetchPatches();
        } catch (err: unknown) {
            toast.error(`Error: ${(err as Error).message}`);
        } finally {
            setPatchSaving(false);
        }
    };

    const handleDeletePatch = async (id: string) => {
        try {
            await supabase.from("product_patches").delete().eq("patch_id", id);
            const { error } = await supabase.from("patches").delete().eq("id", id);
            if (error) throw error;
            toast.success("Parche eliminado");
            fetchPatches();
        } catch (err: unknown) {
            toast.error(`Error: ${(err as Error).message}`);
        } finally {
            setPatchDeleteTarget(null);
        }
    };

    // ── Sizes CRUD ────────────────────────────────────────
    const openEditSize = (s: Size) => {
        setEditingSize(s);
        setSizeForm({
            label: s.label,
            sort_order: s.sort_order?.toString() ?? "",
            category_id: s.category_id || "",
            gender: s.gender || "",
            active: s.active,
            additional_cost: s.additional_cost?.toString() ?? "",
        });
    };

    const openNewSize = () => {
        setEditingSize(null);
        setSizeForm(EMPTY_SIZE);
    };

    const handleSaveSize = async () => {
        if (!sizeForm.label.trim()) {
            toast.error("La etiqueta es obligatoria");
            return;
        }
        setSizeSaving(true);
        try {
            const payload = {
                label: sizeForm.label.trim(),
                sort_order: sizeForm.sort_order !== "" ? parseInt(sizeForm.sort_order) : null,
                category_id: sizeForm.category_id || null,
                gender: sizeForm.gender || null,
                active: sizeForm.active,
                additional_cost: sizeForm.additional_cost !== "" ? parseFloat(sizeForm.additional_cost) : 0,
            };
            if (editingSize) {
                const { error } = await supabase
                    .from("sizes")
                    .update(payload)
                    .eq("id", editingSize.id);
                if (error) throw error;
                toast.success("Talla actualizada");
            } else {
                const { error } = await supabase
                    .from("sizes")
                    .insert(payload);
                if (error) throw error;
                toast.success("Talla creada");
            }
            openNewSize();
            fetchSizes();
        } catch (err: unknown) {
            toast.error(`Error: ${(err as Error).message}`);
        } finally {
            setSizeSaving(false);
        }
    };

    const handleDeleteSize = async (id: string) => {
        try {
            const { error } = await supabase.from("sizes").delete().eq("id", id);
            if (error) {
                // FK violation (23503) → en uso, desactivar en lugar de eliminar
                if (error.code === "23503") {
                    const { error: updateError } = await supabase
                        .from("sizes")
                        .update({ active: false })
                        .eq("id", id);
                    if (updateError) throw updateError;
                    toast.success("Talla desactivada — estaba en uso por productos existentes");
                } else {
                    throw error;
                }
            } else {
                toast.success("Talla eliminada");
            }
            fetchSizes();
        } catch (err: unknown) {
            toast.error(`Error: ${(err as Error).message}`);
        } finally {
            setSizeDeleteTarget(null);
        }
    };

    // ── Players CRUD ──────────────────────────────────────
    const handleAddPlayer = async () => {
        if (!newPlayer.name.trim() || !newPlayer.number || !selectedTeamId) return;
        const num = parseInt(newPlayer.number);
        if (players.filter(p => p.active).some(p => p.number === num)) {
            toast.error(`Ya existe un jugador con el dorsal ${num}`);
            return;
        }
        setAddingPlayer(true);
        try {
            const { data, error } = await supabase
                .from("players")
                .insert({
                    name: newPlayer.name.trim(),
                    number: num,
                    team_id: selectedTeamId,
                    active: true,
                })
                .select()
                .single();
            if (error) throw error;
            setPlayers(prev => [...prev, data].sort((a, b) => a.number - b.number));
            setNewPlayer({ name: "", number: "" });
            toast.success("Jugador agregado");
        } catch (err: unknown) {
            toast.error(`Error: ${(err as Error).message}`);
        } finally {
            setAddingPlayer(false);
        }
    };

    const handleDeletePlayer = async (id: string) => {
        try {
            const { error } = await supabase
                .from("players")
                .update({ active: false })
                .eq("id", id);
            if (error) throw error;
            setPlayers(prev => prev.map(p => p.id === id ? { ...p, active: false } : p));
            toast.success("Jugador desactivado");
        } catch (err: unknown) {
            toast.error(`Error: ${(err as Error).message}`);
        } finally {
            setPlayerDeleteTarget(null);
        }
    };

    const handleRestorePlayer = async (id: string) => {
        try {
            const { error } = await supabase
                .from("players")
                .update({ active: true })
                .eq("id", id);
            if (error) throw error;
            setPlayers(prev => prev.map(p => p.id === id ? { ...p, active: true } : p));
            toast.success("Jugador restaurado");
        } catch (err: unknown) {
            toast.error(`Error: ${(err as Error).message}`);
        }
    };

    const openEditPlayer = (p: Player) => {
        setEditingPlayer(p);
        setEditPlayerForm({ name: p.name, number: String(p.number) });
    };

    const handleSavePlayer = async () => {
        if (!editingPlayer || !editPlayerForm.name.trim() || !editPlayerForm.number) return;
        const num = parseInt(editPlayerForm.number);
        if (players.filter(p => p.active && p.id !== editingPlayer.id).some(p => p.number === num)) {
            toast.error(`Ya existe un jugador con el dorsal ${num}`);
            return;
        }
        setSavingPlayer(true);
        try {
            const { error } = await supabase
                .from("players")
                .update({ name: editPlayerForm.name.trim(), number: num })
                .eq("id", editingPlayer.id);
            if (error) throw error;
            setPlayers(prev =>
                prev.map(p => p.id === editingPlayer.id ? { ...p, name: editPlayerForm.name.trim(), number: num } : p)
                    .sort((a, b) => a.number - b.number)
            );
            setEditingPlayer(null);
            toast.success("Jugador actualizado");
        } catch (err: unknown) {
            toast.error(`Error: ${(err as Error).message}`);
        } finally {
            setSavingPlayer(false);
        }
    };

    return {
        activeTab,
        setActiveTab,

        // Parches
        patches,
        patchesLoading,
        patchSaving,
        editingPatch,
        patchForm,
        setPatchForm,
        patchDeleteTarget,
        setPatchDeleteTarget,
        leagues,
        categories,
        openEditPatch,
        openNewPatch,
        handleSavePatch,
        handleDeletePatch,

        // Tallas
        sizes,
        sizesLoading,
        sizeSaving,
        editingSize,
        sizeForm,
        setSizeForm,
        sizeDeleteTarget,
        setSizeDeleteTarget,
        openEditSize,
        openNewSize,
        handleSaveSize,
        handleDeleteSize,

        // Plantillas
        teams,
        selectedTeamId,
        setSelectedTeamId,
        players,
        playersLoading,
        newPlayer,
        setNewPlayer,
        addingPlayer,
        playerDeleteTarget,
        setPlayerDeleteTarget,
        editingPlayer,
        setEditingPlayer,
        editPlayerForm,
        setEditPlayerForm,
        savingPlayer,
        showInactive,
        setShowInactive,
        handleAddPlayer,
        handleDeletePlayer,
        handleRestorePlayer,
        openEditPlayer,
        handleSavePlayer,
    };
}
