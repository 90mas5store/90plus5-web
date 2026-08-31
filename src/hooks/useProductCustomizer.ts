'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCart } from '@/context/CartContext';
import useToastMessage from '@/hooks/useToastMessage';
import { getProductOptionsFromSupabase, getPlayersByTeam } from '@/lib/api';
import {
    CustomizerProduct,
    ProductOptionsState,
    SelectedOption,
} from '@/types/productCustomizer';

interface UseProductCustomizerProps {
    product: CustomizerProduct;
}

export function useProductCustomizer({ product }: UseProductCustomizerProps) {
    const { addItem, openCart } = useCart();
    const toast = useToastMessage();

    const mapProduct = (p: CustomizerProduct) => ({
        ...p,
        modelo: p.name,
        equipo: p.teams?.name || p.brands?.name || 'Sin equipo',
        liga: 'Desconocida',
        imagen: p.image_url,
        logoEquipo: p.teams?.logo_url || p.brands?.logo_url || undefined,
        precio: p.product_variants?.[0]?.price || 0,
        descripcion: p.description,
        season: p.season || null,
    });

    const [producto, setProducto] = useState(mapProduct(product));
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

    // Dorsal
    const [quiereDorsal, setQuiereDorsal] = useState(false);
    const [modoDorsal, setModoDorsal] = useState('');
    const [jugadorSeleccionado, setJugadorSeleccionado] = useState<{
        id: string;
        numero: string;
        nombre: string;
    } | null>(null);
    const [numeroPersonalizado, setNumeroPersonalizado] = useState('');
    const [nombrePersonalizado, setNombrePersonalizado] = useState('');

    const [isAdding, setIsAdding] = useState(false);
    const [copied, setCopied] = useState(false);
    const [shareCount, setShareCount] = useState<number | null>(null);

    // 📊 Analytics de vista y shares
    useEffect(() => {
        if (!producto.slug) return;
        fetch(`/api/analytics/share?slug=${encodeURIComponent(producto.slug)}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.count > 0) setShareCount(data.count);
            })
            .catch(() => {});

        if (typeof window !== 'undefined' && (window as unknown as { trackEvent?: (type: string, data: Record<string, unknown>) => void }).trackEvent) {
            (window as unknown as { trackEvent: (type: string, data: Record<string, unknown>) => void }).trackEvent('product_view', {
                slug: producto.slug,
                productName: producto.modelo || product.name,
                teamName: producto.equipo || null,
                imageUrl: producto.imagen || null,
                price: precioActual || producto.precio || 0,
            });
        }
    }, [producto.slug, producto.modelo, producto.equipo, producto.imagen, precioActual, product.name, producto.precio]);

    // 📥 Cargar Opciones de BD y URL params
    useEffect(() => {
        async function cargarOpciones() {
            setLoading(true);
            const mappedProduct = mapProduct(product);
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
            if (product.team_id) {
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

    const handleAddToCart = () => {
        if (!versionSeleccionada || !tallaSeleccionada) {
            toast.warning('Por favor, selecciona versión y talla');
            return;
        }

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

        setIsAdding(true);

        setTimeout(() => {
            addItem({
                id: producto.id,
                modelo: producto.modelo,
                equipo: producto.equipo,
                liga: producto.liga || '',
                version: versionSeleccionada.label,
                talla: tallaSeleccionada.label,
                parche: parcheSeleccionado?.label || null,
                variant_id: versionSeleccionada.id,
                size_id: tallaSeleccionada.id,
                patch_id: parcheSeleccionado?.id || null,
                player_id: playerId,
                dorsalNumero,
                dorsalNombre,
                imagen: producto.imagen,
                precio: precioConRecargo,
                cantidad: 1,
            });

            const customization = dorsalNombre ? `${dorsalNumero} · ${dorsalNombre}` : null;
            toast.cartSuccess(`${producto.equipo} ${producto.modelo}`, tallaSeleccionada.label, customization);

            setIsAdding(false);
            openCart();
        }, 600);
    };

    const buildShareUrl = useCallback(() => {
        if (typeof window === 'undefined') return '';
        const base = `${window.location.origin}${window.location.pathname}`;
        const params = new URLSearchParams();
        if (versionSeleccionada) params.set('v', versionSeleccionada.label);
        if (tallaSeleccionada) params.set('t', tallaSeleccionada.label);
        if (parcheSeleccionado) params.set('p', parcheSeleccionado.label);
        if (quiereDorsal) {
            if (modoDorsal === 'jugador' && jugadorSeleccionado) {
                params.set('d', 'j');
                params.set('ji', jugadorSeleccionado.numero);
            } else if (modoDorsal === 'personalizado') {
                params.set('d', 'c');
                if (numeroPersonalizado) params.set('cn', numeroPersonalizado);
                if (nombrePersonalizado) params.set('cno', encodeURIComponent(nombrePersonalizado));
            }
        }
        const qs = params.toString();
        return qs ? `${base}?${qs}` : base;
    }, [versionSeleccionada, tallaSeleccionada, parcheSeleccionado, quiereDorsal, modoDorsal, jugadorSeleccionado, numeroPersonalizado, nombrePersonalizado]);

    const trackShare = () => {
        if (typeof window !== 'undefined' && (window as unknown as { gtag?: (type: string, action: string, data: Record<string, unknown>) => void }).gtag) {
            (window as unknown as { gtag: (type: string, action: string, data: Record<string, unknown>) => void }).gtag('event', 'share_kit', {
                product_slug: producto.slug,
                product_name: producto.modelo,
                team_name: producto.equipo,
            });
        }
        fetch('/api/analytics/share', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product_slug: producto.slug,
                product_name: producto.modelo,
                team_name: producto.equipo,
            }),
        }).catch(() => {});
    };

    const copyToClipboard = (text: string) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleShare = async () => {
        const shareUrl = buildShareUrl();
        trackShare();

        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({
                    title: `${producto.equipo} – ${producto.modelo}`,
                    text: `Encontré esto en 90+5, está brutal 👀`,
                    url: shareUrl,
                });
                return;
            } catch {
                return;
            }
        }

        try {
            await navigator.clipboard.writeText(shareUrl);
            trackShare();
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            trackShare();
            copyToClipboard(shareUrl);
        }
    };

    const handleShareWhatsApp = () => {
        trackShare();
        const shareUrl = buildShareUrl();
        const precio = precioConRecargo || producto.precio || 0;

        const E = {
            fire: '\u{1F525}',
            shirt: '\u{1F455}',
            ruler: '\u{1F4CF}',
            medal: '\u{1F3C5}',
            numbers: '\u{1F522}',
            money: '\u{1F4B0}',
            down: '\u{1F447}',
        };

        const lines: string[] = [
            `${E.fire} *${producto.equipo} – ${producto.modelo}*`,
            `_La encontré en 90+5 y está brutal_`,
            '',
        ];

        const config: string[] = [];
        if (
            versionSeleccionada &&
            versionSeleccionada.label.toLowerCase() !== 'estándar' &&
            versionSeleccionada.label.toLowerCase() !== 'estandar'
        ) {
            config.push(`• ${E.shirt} Versión: ${versionSeleccionada.label}`);
        }
        if (tallaSeleccionada) config.push(`• ${E.ruler} Talla: ${tallaSeleccionada.label}`);
        if (parcheSeleccionado) config.push(`• ${E.medal} Parche: ${parcheSeleccionado.label}`);
        if (quiereDorsal) {
            if (modoDorsal === 'jugador' && jugadorSeleccionado) {
                config.push(`• ${E.numbers} Dorsal: ${jugadorSeleccionado.numero} – ${jugadorSeleccionado.nombre}`);
            } else if (modoDorsal === 'personalizado' && (numeroPersonalizado || nombrePersonalizado)) {
                const dorsal = [numeroPersonalizado, nombrePersonalizado].filter(Boolean).join(' – ');
                config.push(`• ${E.numbers} Dorsal: ${dorsal}`);
            }
        }

        if (config.length > 0) {
            lines.push(`*Mi configuración:*`);
            lines.push(...config);
            lines.push('');
        }

        if (precio > 0) lines.push(`${E.money} *L${precio.toLocaleString('es-HN')}*`);
        lines.push('');
        lines.push(`${E.down} Miralo acá:`);
        lines.push(shareUrl);

        const text = encodeURIComponent(lines.join('\n'));
        window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    };

    return {
        producto,
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
        isAdding,
        copied,
        shareCount,
        handleAddToCart,
        handleShare,
        handleShareWhatsApp,
    };
}
