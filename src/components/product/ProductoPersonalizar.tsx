'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from '@/lib/motion';
import { ArrowLeft } from 'lucide-react';
import HeatmapBackground from '@/components/HeatmapBackground';
import { ProductCustomizationSkeleton } from '@/components/skeletons/ProductSkeletons';
import { usePrefetch } from '@/hooks/usePrefetch';
import { useLiveMatches } from '@/hooks/useLiveMatches';
import { Product as LibProduct } from '@/lib/types';
import { CustomizerProduct } from '@/types/productCustomizer';

import { useProductCustomizer } from '@/hooks/useProductCustomizer';
import { useProductGallery } from '@/hooks/useProductGallery';

import ProductGalleryViewer from '@/components/product/ProductGalleryViewer';
import ProductHeaderInfo from '@/components/product/ProductHeaderInfo';
import ProductCustomizerOptions from '@/components/product/ProductCustomizerOptions';
import ProductActionButtons from '@/components/product/ProductActionButtons';
import StickyMobileBuyBar from '@/components/product/StickyMobileBuyBar';
import RelatedProductsSection from '@/components/product/RelatedProductsSection';

interface ProductoPersonalizarProps {
    product: CustomizerProduct;
    breadcrumb?: React.ReactNode;
    initialRelated?: LibProduct[];
}

export default function ProductoPersonalizar({
    product,
    breadcrumb,
    initialRelated = [],
}: ProductoPersonalizarProps) {
    const router = useRouter();
    usePrefetch();
    const liveMatches = useLiveMatches();

    // 1️⃣ Hook de Opciones, Precios, Dorsal, Carrito y Compartir
    const {
        producto,
        opciones,
        loading,
        precioOriginalActual,
        versionSeleccionada,
        setVersionSeleccionada,
        setPrecioActual,
        setPrecioOriginalActual,
        tallaSeleccionada,
        setTallaSeleccionada,
        showSizeRecommender,
        setShowSizeRecommender,
        parcheSeleccionado,
        setParcheSeleccionado,
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
    } = useProductCustomizer({ product });

    // 2️⃣ Hook de Galería de Imágenes, Zoom y Gestos Táctiles
    const {
        galleryImages,
        activeImageIdx,
        setActiveImageIdx,
        activeImage,
        goToPrev,
        goToNext,
        isHoveringImage,
        lensRef,
        blurRef,
        combinedContainerRef,
        handleZoomMove,
        handleEnter,
        handleLeave,
        imgScale,
        imgTranslate,
        isPinching,
        manualPauseUntilRef,
    } = useProductGallery(product);

    // Scroll to top en montaje
    useEffect(() => {
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    }, []);

    // Partido en vivo (API o manual)
    const liveMatch = product.team_id ? liveMatches[product.team_id] ?? null : null;
    const isLiveManual = !liveMatch && !!product.trending_until && new Date(product.trending_until) > new Date();
    const showLiveBanner = !!liveMatch || isLiveManual;

    const getAuraColors = (liga: string | undefined) => {
        if (!liga) return 'from-primary/20 via-black to-black';
        const map: Record<string, string> = {
            Barcelona: 'from-[#004D98]/30 via-black to-[#A50044]/30',
            'Real Madrid': 'from-white/5 via-black to-[#A899CA]/10',
            PSG: 'from-[#004170]/30 via-black to-[#DA291C]/30',
            'Manchester United': 'from-[#DA291C]/30 via-black to-[#FBE122]/20',
            Olimpia: 'from-white/10 via-black to-primary/30',
        };
        return map[liga] || 'from-primary/25 via-black to-black';
    };

    if (loading) return <ProductCustomizationSkeleton />;

    return (
        <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ paddingTop: 'calc(var(--header-height, 4.5rem) + 1.25rem)' }}
            className={`min-h-dvh text-white pb-20 px-4 md:px-8 relative overflow-hidden bg-gradient-to-b ${getAuraColors(
                producto.liga
            )}`}
        >
            <HeatmapBackground liga={producto.liga} opacity={0.1} />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* 🧭 Breadcrumb o botón Volver */}
                <div className="mb-6 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        aria-label="Regresar"
                        className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-all group shrink-0 cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    {breadcrumb ?? (
                        <span className="text-sm font-bold uppercase tracking-widest text-gray-400">
                            Regresar
                        </span>
                    )}
                </div>

                <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* 🖼️ SECCIÓN IZQUIERDA: GALERÍA DE IMÁGENES */}
                    <div className="lg:col-span-7 flex flex-col gap-3">
                        <ProductGalleryViewer
                            galleryImages={galleryImages}
                            activeImageIdx={activeImageIdx}
                            activeImage={activeImage}
                            producto={producto}
                            combinedContainerRef={combinedContainerRef}
                            handleZoomMove={handleZoomMove}
                            handleEnter={handleEnter}
                            handleLeave={handleLeave}
                            goToPrev={goToPrev}
                            goToNext={goToNext}
                            setActiveImageIdx={setActiveImageIdx}
                            lensRef={lensRef}
                            blurRef={blurRef}
                            imgScale={imgScale}
                            imgTranslate={imgTranslate}
                            isPinching={isPinching}
                            isHoveringImage={isHoveringImage}
                            manualPauseUntilRef={manualPauseUntilRef}
                        />

                        {/* Encabezado e Info de Producto — solo en móviles */}
                        <ProductHeaderInfo
                            producto={producto}
                            precioConRecargo={precioConRecargo}
                            precioOriginalActual={precioOriginalActual}
                            tallaSeleccionada={tallaSeleccionada}
                            liveMatch={liveMatch}
                            showLiveBanner={showLiveBanner}
                            isMobile={true}
                        />
                    </div>

                    {/* ⚙️ SECCIÓN DERECHA: PERSONALIZACIÓN */}
                    <div className="lg:col-span-5 flex flex-col gap-4">
                        {/* Encabezado e Info de Producto — solo en desktop */}
                        <ProductHeaderInfo
                            producto={producto}
                            precioConRecargo={precioConRecargo}
                            precioOriginalActual={precioOriginalActual}
                            tallaSeleccionada={tallaSeleccionada}
                            liveMatch={liveMatch}
                            showLiveBanner={showLiveBanner}
                            isMobile={false}
                        />

                        <div className="h-px bg-gradient-to-r from-white/10 to-transparent" />

                        {/* Selectores de Versión, Talla, Parche y Dorsal */}
                        <ProductCustomizerOptions
                            producto={producto}
                            productRaw={product}
                            opciones={opciones}
                            versionSeleccionada={versionSeleccionada}
                            setVersionSeleccionada={setVersionSeleccionada}
                            setPrecioActual={setPrecioActual}
                            setPrecioOriginalActual={setPrecioOriginalActual}
                            tallaSeleccionada={tallaSeleccionada}
                            setTallaSeleccionada={setTallaSeleccionada}
                            showSizeRecommender={showSizeRecommender}
                            setShowSizeRecommender={setShowSizeRecommender}
                            parcheSeleccionado={parcheSeleccionado}
                            setParcheSeleccionado={setParcheSeleccionado}
                            quiereDorsal={quiereDorsal}
                            setQuiereDorsal={setQuiereDorsal}
                            modoDorsal={modoDorsal}
                            setModoDorsal={setModoDorsal}
                            jugadorSeleccionado={jugadorSeleccionado}
                            setJugadorSeleccionado={setJugadorSeleccionado}
                            numeroPersonalizado={numeroPersonalizado}
                            setNumeroPersonalizado={setNumeroPersonalizado}
                            nombrePersonalizado={nombrePersonalizado}
                            setNombrePersonalizado={setNombrePersonalizado}
                        />

                        {/* Botones de Acción (Añadir al Carrito + Presumir / WhatsApp + Micro-tarjetas de Confianza) */}
                        <ProductActionButtons
                            precioConRecargo={precioConRecargo}
                            isAdding={isAdding}
                            copied={copied}
                            shareCount={shareCount}
                            onAddToCart={handleAddToCart}
                            onShare={handleShare}
                            onShareWhatsApp={handleShareWhatsApp}
                        />
                    </div>
                </div>

                {/* 🔗 PRODUCTOS RELACIONADOS (Poster Style) */}
                <RelatedProductsSection
                    products={initialRelated}
                    onProductClick={() => {}}
                />
            </div>

            {/* 📱 Barra Flotante de Compra Rápida en Móviles */}
            <StickyMobileBuyBar
                producto={producto}
                precioConRecargo={precioConRecargo}
                tallaSeleccionada={tallaSeleccionada}
                isAdding={isAdding}
                onAddToCart={handleAddToCart}
            />
        </motion.main>
    );
}
