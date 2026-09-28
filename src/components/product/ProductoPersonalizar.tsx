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

    const getAuraGlow = (liga: string | undefined) => {
        if (!liga) return 'bg-primary/20';
        const map: Record<string, string> = {
            Barcelona: 'bg-[#004D98]/25',
            'Real Madrid': 'bg-[#A899CA]/15',
            PSG: 'bg-[#004170]/25',
            'Manchester United': 'bg-[#DA291C]/25',
            Olimpia: 'bg-primary/20',
        };
        return map[liga] || 'bg-primary/20';
    };

    if (loading) return <ProductCustomizationSkeleton />;

    return (
        <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{ paddingTop: 'calc(var(--header-height, 4.5rem) + 1.25rem)' }}
            className="min-h-dvh text-white pb-24 px-4 sm:px-6 md:px-8 relative overflow-hidden bg-[#07080b]"
        >
            {/* 🌟 Apple Atmospheric Ambient Glows (§12 Materials & Depth) */}
            <div className={`absolute top-0 left-1/4 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none opacity-40 ${getAuraGlow(producto.liga)}`} />
            <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-20 bg-primary/25" />
            <div className="absolute bottom-1/4 left-0 w-[450px] h-[450px] rounded-full blur-[150px] pointer-events-none opacity-15 bg-white/10" />

            <HeatmapBackground liga={producto.liga} opacity={0.06} />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* 🧭 Navegación Apple Frosted Pill */}
                <div className="mb-6 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        aria-label="Regresar"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] active:scale-95 border border-white/10 text-white/80 hover:text-white transition-all backdrop-blur-md cursor-pointer text-xs font-semibold shadow-sm group shrink-0"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                        <span>Volver</span>
                    </button>
                    {breadcrumb && (
                        <>
                            <div className="h-4 w-px bg-white/10 shrink-0" />
                            <div className="overflow-hidden min-w-0">{breadcrumb}</div>
                        </>
                    )}
                </div>

                <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-start">
                    {/* 🖼️ SECCIÓN IZQUIERDA: GALERÍA DE IMÁGENES (Sticky en Desktop) */}
                    <div className="lg:col-span-7 lg:sticky lg:top-24 flex flex-col gap-4">
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

                    {/* ⚙️ SECCIÓN DERECHA: APPLE STUDIO CONFIGURATOR */}
                    <div className="lg:col-span-5 flex flex-col gap-5 p-5 sm:p-7 rounded-[2.2rem] bg-gradient-to-b from-[#13151c]/90 via-[#0e0f14]/90 to-[#090a0d]/90 backdrop-blur-2xl border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.6)] relative overflow-hidden">
                        {/* 🌟 Specular Top Highlight */}
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

                        {/* Ambient Subtle Glow */}
                        <div className="absolute -top-24 -right-24 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

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

                        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

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

                {/* 🔗 PRODUCTOS RELACIONADOS (Official Apple ProductCard Grid) */}
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

