'use client';

import { useState, useCallback } from 'react';

export interface SelectedPlayer {
    id: string;
    numero: string;
    nombre: string;
}

export interface DorsalOption {
    id: string;
    jugador: string;
    numero: string;
}

export function useProductDorsal() {
    const [quiereDorsal, setQuiereDorsal] = useState(false);
    const [modoDorsal, setModoDorsal] = useState('');
    const [jugadorSeleccionado, setJugadorSeleccionado] = useState<SelectedPlayer | null>(null);
    const [numeroPersonalizado, setNumeroPersonalizado] = useState('');
    const [nombrePersonalizado, setNombrePersonalizado] = useState('');

    const initDorsalFromParams = useCallback(
        (
            paramD: string | null,
            paramJ: string | null,
            paramCN: string | null,
            paramCNO: string | null,
            dorsales: DorsalOption[]
        ) => {
            if (paramD === 'j' && paramJ) {
                const preJugador = dorsales.find((d) => d.numero === paramJ);
                if (preJugador) {
                    setQuiereDorsal(true);
                    setModoDorsal('jugador');
                    setJugadorSeleccionado({
                        id: preJugador.id,
                        numero: preJugador.numero,
                        nombre: preJugador.jugador,
                    });
                }
            } else if (paramD === 'c') {
                setQuiereDorsal(true);
                setModoDorsal('personalizado');
                if (paramCN) setNumeroPersonalizado(paramCN);
                if (paramCNO) setNombrePersonalizado(decodeURIComponent(paramCNO));
            }
        },
        []
    );

    const getDorsalDetails = useCallback(() => {
        let dorsalNumero = '';
        let dorsalNombre = '';
        let playerId: string | null = null;

        if (quiereDorsal && modoDorsal === 'jugador' && jugadorSeleccionado) {
            dorsalNumero = jugadorSeleccionado.numero;
            dorsalNombre = jugadorSeleccionado.nombre;
            playerId = jugadorSeleccionado.id;
        } else if (quiereDorsal && modoDorsal === 'personalizado') {
            dorsalNumero = numeroPersonalizado;
            dorsalNombre = nombrePersonalizado;
        }

        return { dorsalNumero, dorsalNombre, playerId };
    }, [quiereDorsal, modoDorsal, jugadorSeleccionado, numeroPersonalizado, nombrePersonalizado]);

    return {
        quiereDorsal,
        setQuiereDorsal,
        modoDorsal,
        setModoDorsal,
        jugadorSeleccionado,
        setJugadorSeleccionado,
        numeroPersonalizado,
        setNumeroPersonalizado,
        nombrePersonalizado,
        setNombrePersonalizado,
        initDorsalFromParams,
        getDorsalDetails,
    };
}
