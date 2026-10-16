'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import useToastMessage from '@/hooks/useToastMessage';
import { CustomizerProduct } from '@/types/productCustomizer';
import { trackMetaAddToCart } from '@/lib/analytics/metaPixel';
import { useProductDorsal } from '@/hooks/product-customizer/useProductDorsal';
import { useProductOptions } from '@/hooks/product-customizer/useProductOptions';
import { useProductShare } from '@/hooks/product-customizer/useProductShare';

interface UseProductCustomizerProps {
    product: CustomizerProduct;
}

export function useProductCustomizer({ product }: UseProductCustomizerProps) {
    const { addItem, openCart } = useCart();
    const toast = useToastMessage();
    const [isAdding, setIsAdding] = useState(false);

    // 1️⃣ Gestión de dorsal y personalización
    const {
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
    } = useProductDorsal();

    // 2️⃣ Gestión de opciones, variantes, precios y restricciones de talla
    const {
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
    } = useProductOptions({
        product,
        onDorsalParamsFound: (paramD, paramJ, paramCN, paramCNO, dorsales) => {
            initDorsalFromParams(paramD, paramJ, paramCN, paramCNO, dorsales);
        },
    });

    // 3️⃣ Mecánicas de compartir (WhatsApp, Web Share API, Clipboard)
    const {
        copied,
        shareCount,
        handleShare,
        handleShareWhatsApp,
    } = useProductShare({
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
    });

    // 📊 Analytics de vista de producto
    useEffect(() => {
        if (!producto.slug) return;
        if (
            typeof window !== 'undefined' &&
            (window as unknown as { trackEvent?: (type: string, data: Record<string, unknown>) => void }).trackEvent
        ) {
            (window as unknown as { trackEvent: (type: string, data: Record<string, unknown>) => void }).trackEvent(
                'product_view',
                {
                    slug: producto.slug,
                    productName: producto.modelo || product.name,
                    teamName: producto.equipo || null,
                    imageUrl: producto.imagen || null,
                    price: precioActual || producto.precio || 0,
                }
            );
        }
    }, [producto.slug, producto.modelo, producto.equipo, producto.imagen, precioActual, product.name, producto.precio]);

    // 🛒 Añadir al carrito
    const handleAddToCart = () => {
        if (!versionSeleccionada || !tallaSeleccionada) {
            toast.warning('Por favor, selecciona versión y talla');
            return;
        }

        const { dorsalNumero, dorsalNombre, playerId } = getDorsalDetails();

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

            // 🎯 Meta Pixel: AddToCart event
            trackMetaAddToCart({
                id: producto.id,
                name: `${producto.equipo} — ${producto.modelo}`,
                price: precioConRecargo,
                currency: 'HNL',
            });

            setIsAdding(false);
            openCart();
        }, 600);
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
