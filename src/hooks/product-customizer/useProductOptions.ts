'use client';

import { useState, useEffect } from 'react';
import { getProductOptionsFromSupabase, getPlayersByTeam, getPlayersByProduct } from '@/lib/api';
import {
    CustomizerProduct,
    ProductOptionsState,
    SelectedOption,
} from '@/types/productCustomizer';

export function mapCustomizerProduct(p: CustomizerProduct) {
    return {
        ...p,
        modelo: p.name,
        equipo: p.teams?.name || p.brands?.name || 'Sin equipo',
        liga: 'Desconocida',
        imagen: p.image_url,
        logoEquipo: p.teams?.logo_url || p.brands?.logo_url || undefined,
        precio: p.product_variants?.[0]?.price || 0,
        descripcion: p.description,
        season: p.season || null,
    };
}

interface UseProductOptionsProps {
    product: CustomizerProduct;
    onDorsalParamsFound?: (
        paramD: string | null,
        paramJ: string | null,
        paramCN: string | null,
        paramCNO: string | null,
        dorsales: { id: string; jugador: string; numero: string }[]
    ) => void;
}

export function useProductOptions({ product, onDorsalParamsFound }: UseProductOptionsProps) {
    const [producto, setProducto] = useState(mapCustomizerProduct(product));
    const [opciones, setOpciones] = useState<ProductOptionsState>({
        dorsales: [],
        preciosPorVersion: {},
        originalesPorVersion: {},
        variantSizesMap: {},
    });
    const [loading, setLoading] = useState(true);

    const [precioActual, setPrecioActual] = useState(0);
    const [precioOriginalActual, setPrecioOriginalActual] = useState<{
        price: number;
        active: boolean;
    } | null>(null);
    const [versionSeleccionada, setVersionSeleccionada] = useState<SelectedOption | null>(null);
    const [tallaSeleccionada, setTallaSeleccionada] = useState<SelectedOption | null>(null);
    const [parcheSeleccionado, setParcheSeleccionado] = useState<SelectedOption | null>(null);
    const [showSizeRecommender, setShowSizeRecommender] = useState(false);

    const precioConRecargo = precioActual + (tallaSeleccionada?.additional_cost || 0);

    // 📥 Cargar Opciones de BD y URL params
    useEffect(() => {
        async function cargarOpciones() {
            setLoading(true);
            const mappedProduct = mapCustomizerProduct(product);
            setProducto(mappedProduct);

            const opcionesProducto = await getProductOptionsFromSupabase(product.id);

            const preciosPorVersion: Record<string, number> = {};
            const originalesPorVersion: Record<string, { price: number; active: boolean }> = {};

            product.product_variants?.forEach((v) => {
                if (v.active) {
                    preciosPorVersion[v.version] = v.price;
                    originalesPorVersion[v.version] = {
                        price: v.original_price || 0,
                        active: !!v.active_original_price,
                    };
                }
            });

            const precios = Object.values(preciosPorVersion);
            const precioInicial = precios.length ? Math.min(...precios) : 0;
            setPrecioActual(precioInicial);

            let dorsales: { id: string; jugador: string; numero: string }[] = [];
            // 1. Intentar cargar los jugadores específicos de esta camisa (product_players)
            const shirtPlayers = await getPlayersByProduct(product.id);
            if (shirtPlayers.length > 0) {
                dorsales = shirtPlayers.map((p) => ({
                    id: p.id,
                    jugador: p.name,
                    numero: p.number?.toString() || '',
                }));
            } else if (product.team_id) {
                // Fallback de retrocompatibilidad: plantilla del equipo si aún no se configuró product_players
                const players = await getPlayersByTeam(product.team_id);
                dorsales = players.map((p: Record<string, unknown>) => ({
                    id: p.id as string,
                    jugador: p.name as string,
                    numero: p.number?.toString() || '',
                }));
            }

            setOpciones({
                ...opcionesProducto,
                dorsales,
                preciosPorVersion,
                originalesPorVersion,
            });

            // Pre-selección desde URL params
            const urlParams = new URLSearchParams(window.location.search);
            const paramV = urlParams.get('v');
            const paramT = urlParams.get('t');
            const paramP = urlParams.get('p');
            const paramD = urlParams.get('d');
            const paramJ = urlParams.get('ji');
            const paramCN = urlParams.get('cn');
            const paramCNO = urlParams.get('cno');

            const preVersion = paramV
                ? opcionesProducto.versiones?.find((v) => v.label === paramV)
                : null;
            if (preVersion) {
                setVersionSeleccionada(preVersion);
                setPrecioActual(preciosPorVersion[preVersion.label] ?? 0);
                setPrecioOriginalActual(originalesPorVersion[preVersion.label] ?? null);
            } else if (opcionesProducto.versiones?.length) {
                const firstVersion = opcionesProducto.versiones[0];
                setVersionSeleccionada(firstVersion);
                setPrecioActual(preciosPorVersion[firstVersion.label] ?? product.precio);
                setPrecioOriginalActual(originalesPorVersion[firstVersion.label] ?? null);
            }

            if (paramT) {
                const preTalla = opcionesProducto.tallas?.find((t) => t.label === paramT);
                if (preTalla) setTallaSeleccionada(preTalla);
            }

            if (paramP) {
                const preParche = opcionesProducto.parches?.find((p) => p.label === paramP);
                if (preParche) setParcheSeleccionado(preParche);
            }

            onDorsalParamsFound?.(paramD, paramJ, paramCN, paramCNO, dorsales);

            setLoading(false);
        }
        cargarOpciones();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product.id]);

    // Limpieza de talla si no está disponible para la nueva versión
    useEffect(() => {
        if (versionSeleccionada && tallaSeleccionada && opciones.variantSizesMap) {
            const availableSizes = opciones.variantSizesMap[versionSeleccionada.id] || [];
            if (!availableSizes.includes(tallaSeleccionada.id)) {
                const id = setTimeout(() => setTallaSeleccionada(null), 0);
                return () => clearTimeout(id);
            }
        }
    }, [versionSeleccionada, tallaSeleccionada, opciones.variantSizesMap]);

    return {
        producto,
        setProducto,
        opciones,
        loading,
        precioActual,
        setPrecioActual,
        precioOriginalActual,
        setPrecioOriginalActual,
        versionSeleccionada,
        setVersionSeleccionada,
        tallaSeleccionada,
        setTallaSeleccionada,
        parcheSeleccionado,
        setParcheSeleccionado,
        showSizeRecommender,
        setShowSizeRecommender,
        precioConRecargo,
    };
}
