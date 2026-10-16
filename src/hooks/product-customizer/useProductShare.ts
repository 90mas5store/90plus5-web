'use client';

import { useState, useEffect, useCallback } from 'react';
import { SelectedOption } from '@/types/productCustomizer';

interface ProductShareInfo {
    slug?: string;
    modelo: string;
    equipo: string;
    precio?: number;
}

interface UseProductShareProps {
    producto: ProductShareInfo;
    versionSeleccionada: SelectedOption | null;
    tallaSeleccionada: SelectedOption | null;
    parcheSeleccionado: SelectedOption | null;
    quiereDorsal: boolean;
    modoDorsal: string;
    jugadorSeleccionado: { id: string; numero: string; nombre: string } | null;
    numeroPersonalizado: string;
    nombrePersonalizado: string;
    precioConRecargo: number;
}

export function useProductShare({
    producto,
    versionSeleccionada,
    tallaSeleccionada,
    parcheSeleccionado,
    quiereDorsal,
    modoDorsal,
    jugadorSeleccionado,
    numeroPersonalizado,
    nombrePersonalizado,
    precioConRecargo,
}: UseProductShareProps) {
    const [copied, setCopied] = useState(false);
    const [shareCount, setShareCount] = useState<number | null>(null);

    // 📊 Cargar contador de compartidos
    useEffect(() => {
        if (!producto.slug) return;
        fetch(`/api/analytics/share?slug=${encodeURIComponent(producto.slug)}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.count > 0) setShareCount(data.count);
            })
            .catch(() => {});
    }, [producto.slug]);

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
    }, [
        versionSeleccionada,
        tallaSeleccionada,
        parcheSeleccionado,
        quiereDorsal,
        modoDorsal,
        jugadorSeleccionado,
        numeroPersonalizado,
        nombrePersonalizado,
    ]);

    const trackShare = () => {
        if (
            typeof window !== 'undefined' &&
            (window as unknown as { gtag?: (type: string, action: string, data: Record<string, unknown>) => void }).gtag
        ) {
            (window as unknown as { gtag: (type: string, action: string, data: Record<string, unknown>) => void }).gtag(
                'event',
                'share_kit',
                {
                    product_slug: producto.slug,
                    product_name: producto.modelo,
                    team_name: producto.equipo,
                }
            );
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
        copied,
        shareCount,
        buildShareUrl,
        handleShare,
        handleShareWhatsApp,
    };
}
