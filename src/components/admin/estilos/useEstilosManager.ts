import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import useToastMessage from "@/hooks/useToastMessage";
import { clearProductCache } from "@/lib/api";
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
            if (error) {
                // FK violation (23503 o 409 Conflict) → en uso en order_items, desactivar en lugar de romper integridad
                if (
                    error.code === "23503" ||
                    (error as any).status === 409 ||
                    error.message?.toLowerCase().includes("foreign key") ||
                    error.message?.toLowerCase().includes("violates foreign key constraint")
                ) {
                    const { error: updateError } = await supabase
                        .from("patches")
                        .update({ active: false })
                        .eq("id", id);
                    if (updateError) throw updateError;
                    toast.success("Parche desactivado — está vinculado a pedidos históricos");
                } else {
                    throw error;
                }
            } else {
                toast.success("Parche eliminado");
            }
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
        const trimmedLabel = sizeForm.label.trim();
        if (!trimmedLabel) {
            toast.error("La etiqueta es obligatoria");
            return;
        }

        // 🛡️ Detección preventiva de duplicados por etiqueta
        if (!editingSize) {
            const isDuplicate = sizes.some(
                (s) =>
                    s.active &&
                    s.label.trim().toLowerCase() === trimmedLabel.toLowerCase()
            );
            if (isDuplicate) {
                toast.error(`Ya existe la talla "${trimmedLabel}" en el catálogo. No necesitas duplicarla.`);
                return;
            }
        }

        setSizeSaving(true);
        try {
            const payload = {
                label: trimmedLabel,
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

    // ⚡ Generación de Presets Oficiales sin duplicación
    const handleGeneratePreset = async (
        presetType: 'clothing' | 'kids' | 'shoes_us' | 'shoes_eu' | 'adult' | 'woman' | 'shoes_man' | 'shoes_woman' | 'shoes_kids'
    ) => {
        setSizeSaving(true);
        try {
            const PRESET_DEFINITIONS: Record<
                string,
                Array<{ label: string; sort_order: number; additional_cost: number; gender: string | null }>
            > = {
                // 👕 Escala Universal de Ropa (Hombre, Mujer y Unisex: XS a 4XL)
                clothing: [
                    { label: 'XS', sort_order: 1, additional_cost: 0, gender: null },
                    { label: 'S', sort_order: 2, additional_cost: 0, gender: null },
                    { label: 'M', sort_order: 3, additional_cost: 0, gender: null },
                    { label: 'L', sort_order: 4, additional_cost: 0, gender: null },
                    { label: 'XL', sort_order: 5, additional_cost: 0, gender: null },
                    { label: '2XL', sort_order: 6, additional_cost: 0, gender: null },
                    { label: '3XL', sort_order: 7, additional_cost: 100, gender: null },
                    { label: '4XL', sort_order: 8, additional_cost: 100, gender: null },
                ],
                adult: [
                    { label: 'XS', sort_order: 1, additional_cost: 0, gender: null },
                    { label: 'S', sort_order: 2, additional_cost: 0, gender: null },
                    { label: 'M', sort_order: 3, additional_cost: 0, gender: null },
                    { label: 'L', sort_order: 4, additional_cost: 0, gender: null },
                    { label: 'XL', sort_order: 5, additional_cost: 0, gender: null },
                    { label: '2XL', sort_order: 6, additional_cost: 0, gender: null },
                    { label: '3XL', sort_order: 7, additional_cost: 100, gender: null },
                    { label: '4XL', sort_order: 8, additional_cost: 100, gender: null },
                ],
                woman: [
                    { label: 'XS', sort_order: 1, additional_cost: 0, gender: null },
                    { label: 'S', sort_order: 2, additional_cost: 0, gender: null },
                    { label: 'M', sort_order: 3, additional_cost: 0, gender: null },
                    { label: 'L', sort_order: 4, additional_cost: 0, gender: null },
                    { label: 'XL', sort_order: 5, additional_cost: 0, gender: null },
                ],
                // 👶 Escala de Ropa Infantil
                kids: [
                    { label: '2 años', sort_order: 1, additional_cost: 0, gender: 'kid' },
                    { label: '4 años', sort_order: 2, additional_cost: 0, gender: 'kid' },
                    { label: '6 años', sort_order: 3, additional_cost: 0, gender: 'kid' },
                    { label: '8 años', sort_order: 4, additional_cost: 0, gender: 'kid' },
                    { label: '10 años', sort_order: 5, additional_cost: 0, gender: 'kid' },
                    { label: '12 años', sort_order: 6, additional_cost: 0, gender: 'kid' },
                    { label: '14 años', sort_order: 7, additional_cost: 0, gender: 'kid' },
                    { label: '16 años', sort_order: 8, additional_cost: 0, gender: 'kid' },
                ],
                // 👟 Calzado Numeración US
                shoes_us: [
                    { label: '5', sort_order: 1, additional_cost: 0, gender: 'woman' },
                    { label: '5.5', sort_order: 2, additional_cost: 0, gender: 'woman' },
                    { label: '6', sort_order: 3, additional_cost: 0, gender: 'woman' },
                    { label: '6.5', sort_order: 4, additional_cost: 0, gender: 'woman' },
                    { label: '7', sort_order: 5, additional_cost: 0, gender: null },
                    { label: '7.5', sort_order: 6, additional_cost: 0, gender: null },
                    { label: '8', sort_order: 7, additional_cost: 0, gender: null },
                    { label: '8.5', sort_order: 8, additional_cost: 0, gender: null },
                    { label: '9', sort_order: 9, additional_cost: 0, gender: 'man' },
                    { label: '9.5', sort_order: 10, additional_cost: 0, gender: 'man' },
                    { label: '10', sort_order: 11, additional_cost: 0, gender: 'man' },
                    { label: '10.5', sort_order: 12, additional_cost: 0, gender: 'man' },
                    { label: '11', sort_order: 13, additional_cost: 0, gender: 'man' },
                    { label: '12', sort_order: 14, additional_cost: 0, gender: 'man' },
                ],
                shoes_man: [
                    { label: '7.5', sort_order: 6, additional_cost: 0, gender: null },
                    { label: '8', sort_order: 7, additional_cost: 0, gender: null },
                    { label: '8.5', sort_order: 8, additional_cost: 0, gender: null },
                    { label: '9', sort_order: 9, additional_cost: 0, gender: 'man' },
                    { label: '9.5', sort_order: 10, additional_cost: 0, gender: 'man' },
                    { label: '10', sort_order: 11, additional_cost: 0, gender: 'man' },
                    { label: '11', sort_order: 13, additional_cost: 0, gender: 'man' },
                    { label: '12', sort_order: 14, additional_cost: 0, gender: 'man' },
                ],
                // 👟 Calzado Numeración EU
                shoes_eu: [
                    { label: '35 EU', sort_order: 1, additional_cost: 0, gender: 'woman' },
                    { label: '36 EU', sort_order: 2, additional_cost: 0, gender: 'woman' },
                    { label: '37 EU', sort_order: 3, additional_cost: 0, gender: 'woman' },
                    { label: '38 EU', sort_order: 4, additional_cost: 0, gender: null },
                    { label: '39 EU', sort_order: 5, additional_cost: 0, gender: null },
                    { label: '40 EU', sort_order: 6, additional_cost: 0, gender: null },
                    { label: '41 EU', sort_order: 7, additional_cost: 0, gender: null },
                    { label: '42 EU', sort_order: 8, additional_cost: 0, gender: 'man' },
                    { label: '43 EU', sort_order: 9, additional_cost: 0, gender: 'man' },
                    { label: '44 EU', sort_order: 10, additional_cost: 0, gender: 'man' },
                    { label: '45 EU', sort_order: 11, additional_cost: 0, gender: 'man' },
                ],
                shoes_woman: [
                    { label: '5', sort_order: 1, additional_cost: 0, gender: 'woman' },
                    { label: '5.5', sort_order: 2, additional_cost: 0, gender: 'woman' },
                    { label: '6', sort_order: 3, additional_cost: 0, gender: 'woman' },
                    { label: '6.5', sort_order: 4, additional_cost: 0, gender: 'woman' },
                    { label: '7', sort_order: 5, additional_cost: 0, gender: null },
                    { label: '7.5', sort_order: 6, additional_cost: 0, gender: null },
                    { label: '8', sort_order: 7, additional_cost: 0, gender: null },
                ],
                shoes_kids: [
                    { label: '28 EU', sort_order: 1, additional_cost: 0, gender: 'kid' },
                    { label: '29 EU', sort_order: 2, additional_cost: 0, gender: 'kid' },
                    { label: '30 EU', sort_order: 3, additional_cost: 0, gender: 'kid' },
                    { label: '31 EU', sort_order: 4, additional_cost: 0, gender: 'kid' },
                    { label: '32 EU', sort_order: 5, additional_cost: 0, gender: 'kid' },
                    { label: '33 EU', sort_order: 6, additional_cost: 0, gender: 'kid' },
                    { label: '34 EU', sort_order: 7, additional_cost: 0, gender: 'kid' },
                    { label: '35 EU', sort_order: 8, additional_cost: 0, gender: 'kid' },
                ],
            };

            const targetDefs = PRESET_DEFINITIONS[presetType] || [];
            const shoeCat = categories.find((c) => /tenis|calzado|zapato/i.test(c.name));
            const isShoePreset = presetType.startsWith('shoes');
            const targetCatId = isShoePreset && shoeCat ? shoeCat.id : null;
            let createdCount = 0;

            for (const item of targetDefs) {
                // Verificar si ya existe con esa etiqueta
                const existing = sizes.find(
                    (s) => s.label.trim().toLowerCase() === item.label.toLowerCase()
                );

                if (existing) {
                    // Si existe pero está inactiva o con campos desactualizados
                    if (!existing.active || (isShoePreset && existing.category_id !== targetCatId)) {
                        await supabase
                            .from('sizes')
                            .update({
                                active: true,
                                gender: item.gender,
                                category_id: targetCatId,
                                additional_cost: item.additional_cost,
                                sort_order: item.sort_order,
                            })
                            .eq('id', existing.id);
                        createdCount++;
                    }
                } else {
                    // Si no existe, la creamos
                    const { error } = await supabase.from('sizes').insert({
                        label: item.label,
                        sort_order: item.sort_order,
                        additional_cost: item.additional_cost,
                        gender: item.gender,
                        category_id: targetCatId,
                        active: true,
                    });
                    if (error) console.error('Error insertando talla de preset:', error);
                    else createdCount++;
                }
            }

            toast.success(
                createdCount > 0
                    ? `Se agregaron/activaron ${createdCount} tallas del preset`
                    : 'Las tallas de este preset ya estaban completas'
            );
            fetchSizes();
        } catch (err: unknown) {
            toast.error(`Error: ${(err as Error).message}`);
        } finally {
            setSizeSaving(false);
        }
    };

    // 🧹 Herramienta de Limpieza de Duplicados en Base de Datos
    const handleCleanupDuplicates = async () => {
        setSizeSaving(true);
        try {
            const seen = new Map<string, Size>();
            const toDeactivate: { duplicateId: string; canonicalId: string }[] = [];

            // Identificar duplicados redundantes
            for (const s of sizes) {
                if (!s.active) continue;
                const labelNorm = s.label.trim().toLowerCase();
                // Normalizar género: si es adult clothing (XS-4XL), 'man' y 'null/universal' son equivalentes
                const isAdultStandard = ['xs', 's', 'm', 'l', 'xl', '2xl', '3xl', '4xl'].includes(labelNorm);
                const genderKey =
                    isAdultStandard && (s.gender === 'man' || !s.gender)
                        ? 'adult_unisex'
                        : s.gender || 'universal';
                const key = `${labelNorm}_${genderKey}`;

                if (seen.has(key)) {
                    const canonical = seen.get(key)!;
                    // Preferir el universal (sin category_id) como canónico
                    if (s.category_id === null && canonical.category_id !== null) {
                        toDeactivate.push({ duplicateId: canonical.id, canonicalId: s.id });
                        seen.set(key, s);
                    } else {
                        toDeactivate.push({ duplicateId: s.id, canonicalId: canonical.id });
                    }
                } else {
                    seen.set(key, s);
                }
            }

            if (toDeactivate.length === 0) {
                toast.info('No se detectaron tallas duplicadas activas.');
                return;
            }

            for (const pair of toDeactivate) {
                // Re-apuntar variant_sizes si existen al canónico
                await supabase
                    .from('variant_sizes')
                    .update({ size_id: pair.canonicalId })
                    .eq('size_id', pair.duplicateId);

                // Desactivar el duplicado
                await supabase.from('sizes').update({ active: false }).eq('id', pair.duplicateId);
            }

            toast.success(`Se consolidaron y desactivaron ${toDeactivate.length} tallas duplicadas.`);
            fetchSizes();
        } catch (err: unknown) {
            toast.error(`Error al limpiar duplicados: ${(err as Error).message}`);
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
            clearProductCache('catalog');
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
            clearProductCache('catalog');
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
            clearProductCache('catalog');
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
            clearProductCache('catalog');
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
        handleGeneratePreset,
        handleCleanupDuplicates,

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
