'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import useToastMessage from '@/hooks/useToastMessage';
import { AdminPlayer } from '@/types/adminProduct';

export function useProductPlayersManager(teamId: string) {
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;
    const toast = useToastMessage();

    const [teamPlayers, setTeamPlayers] = useState<AdminPlayer[]>([]);
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set<string>());
    const [newPlayer, setNewPlayer] = useState({ name: '', number: '' });
    const [addingPlayer, setAddingPlayer] = useState(false);

    // Cargar Jugadores cuando se selecciona o cambia un equipo
    useEffect(() => {
        if (!teamId) {
            setTeamPlayers([]);
            return;
        }

        const loadPlayers = async () => {
            try {
                const { data, error } = await supabase
                    .from('players')
                    .select('id, name, number, active')
                    .eq('team_id', teamId)
                    .eq('active', true)
                    .order('number');

                if (error) throw error;
                setTeamPlayers(data || []);
            } catch (error) {
                console.error('Error cargando jugadores del equipo:', error);
            }
        };

        loadPlayers();
    }, [teamId, supabase]);

    const togglePlayer = (playerId: string) => {
        setSelectedPlayerIds((prev) => {
            const next = new Set(prev);
            if (next.has(playerId)) next.delete(playerId);
            else next.add(playerId);
            return next;
        });
    };

    const selectAllPlayers = () => {
        setSelectedPlayerIds(new Set(teamPlayers.filter((p) => p.active !== false).map((p) => p.id)));
    };

    const deselectAllPlayers = () => {
        setSelectedPlayerIds(new Set());
    };

    const handleAddPlayer = async () => {
        if (!teamId || !newPlayer.name || !newPlayer.number) return;
        setAddingPlayer(true);
        try {
            const { data, error } = await supabase
                .from('players')
                .insert({
                    team_id: teamId,
                    name: newPlayer.name.trim().toUpperCase(),
                    number: parseInt(newPlayer.number),
                    active: true,
                })
                .select('id, name, number, active')
                .single();

            if (error) throw error;
            setTeamPlayers((prev) => [...prev, data]);
            setSelectedPlayerIds((prev) => new Set(prev).add(data.id));
            setNewPlayer({ name: '', number: '' });
            toast.success('Jugador agregado a la plantilla y asignado');
        } catch (error) {
            console.error('Error agregando jugador:', error);
            toast.error('Error al agregar jugador');
        } finally {
            setAddingPlayer(false);
        }
    };

    return {
        teamPlayers,
        setTeamPlayers,
        selectedPlayerIds,
        setSelectedPlayerIds,
        newPlayer,
        setNewPlayer,
        addingPlayer,
        togglePlayer,
        selectAllPlayers,
        deselectAllPlayers,
        handleAddPlayer,
    };
}
