'use client';

import { motion } from '@/lib/motion';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import ProductImage from '@/components/ProductImage';
import { CustomizerProduct } from '@/types/productCustomizer';

interface ProductGalleryViewerProps {
    galleryImages: string[];
    activeImageIdx: number;
    activeImage: string;
    producto: CustomizerProduct;
    combinedContainerRef: (el: HTMLDivElement | null) => void;
    handleZoomMove: (e: React.MouseEvent | React.TouchEvent) => void;
    handleEnter: () => void;
    handleLeave: () => void;
    goToPrev: () => void;
    goToNext: () => void;
    setActiveImageIdx: (idx: number) => void;
    lensRef: React.RefObject<HTMLDivElement | null>;
    blurRef: React.RefObject<HTMLDivElement | null>;
    imgScale: number;
    imgTranslate: { x: number; y: number };
    isPinching: boolean;
    isHoveringImage: boolean;
    manualPauseUntilRef: React.MutableRefObject<number>;
}

export default function ProductGalleryViewer({
    galleryImages,
    activeImageIdx,
    activeImage,
    producto,
    combinedContainerRef,
    handleZoomMove,
    handleEnter,
    handleLeave,
    goToPrev,
    goToNext,
    setActiveImageIdx,
    lensRef,
    blurRef,
    imgScale,
    imgTranslate,
    isPinching,
    isHoveringImage,
    manualPauseUntilRef,
}: ProductGalleryViewerProps) {
    return (
        <div className="flex flex-col gap-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative w-full aspect-[4/5] max-w-lg lg:max-w-none mx-auto rounded-[2.2rem] sm:rounded-[2.6rem] overflow-hidden border border-white/[0.08] bg-[#0b0c10]/90 shadow-[0_20px_60px_rgba(0,0,0,0.7)] group cursor-crosshair select-none"
                ref={combinedContainerRef}
                onMouseMove={handleZoomMove}
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
                style={{ touchAction: 'none' }}
            >
                {/* 🌟 Specular Top Highlight (§12 Apple Design) */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent z-20 pointer-events-none" />

                {/* Ambient Subtle Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none z-[2]" />

                {/* Todas las imágenes pre-cargadas en el DOM */}
                {galleryImages.map((imgSrc, idx) => (
                    <div
                        key={imgSrc || idx}
                        className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                            activeImageIdx === idx ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'
                        }`}
                    >
                        <div
                            style={
                                activeImageIdx === idx
                                    ? {
                                          width: '100%',
                                          height: '100%',
                                          transform: `scale(${imgScale}) translate(${imgTranslate.x / imgScale}px, ${imgTranslate.y / imgScale}px)`,
                                          transformOrigin: 'center center',
                                          transition: isPinching ? 'none' : 'transform 0.2s ease-out',
                                          willChange: 'transform',
                                      }
                                    : { width: '100%', height: '100%' }
                            }
                        >
                            <ProductImage
                                src={imgSrc}
                                alt={idx === 0 ? producto.modelo || 'Producto' : `Vista ${idx + 1}`}
                                width={900}
                                height={1125}
                                priority={idx === 0}
                                loading="eager"
                                quality={95}
                                sizes="(max-width: 1024px) 100vw, 60vw"
                                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                            />
                        </div>
                    </div>
                ))}

                {/* Blur Overlay */}
                <div
                    ref={blurRef}
                    className="absolute inset-0 z-[2] backdrop-blur-[6px] opacity-0 transition-opacity duration-300 pointer-events-none"
                />

                {/* Lens Zoom */}
                <div
                    ref={lensRef}
                    className="absolute w-48 h-48 md:w-64 md:h-64 rounded-full pointer-events-none border-2 border-white/60 shadow-[0_0_35px_rgba(229,9,20,0.5)] opacity-0 transition-opacity duration-300 z-20 will-change-transform"
                    style={{
                        backgroundImage: `url(${activeImage})`,
                    }}
                />

                {/* Badge de Zoom — solo desktop */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 bg-black/60 backdrop-blur-xl rounded-full border border-white/15 hidden md:flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-all duration-300 shadow-lg">
                    <Info className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">Pasa el mouse para zoom</span>
                </div>

                {/* Image counter badge — solo desktop */}
                {galleryImages.length > 1 && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-xl rounded-full border border-white/15 text-xs font-mono font-bold text-white/90 hidden md:flex shadow-lg">
                        {activeImageIdx + 1} / {galleryImages.length}
                    </div>
                )}

                {/* Flechas de navegación Apple Style */}
                {galleryImages.length > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                goToPrev();
                            }}
                            aria-label="Imagen anterior"
                            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-11 md:h-11 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white/90 hover:text-white hover:bg-black/80 hover:border-white/40 transition-all duration-200 opacity-80 md:opacity-0 md:group-hover:opacity-100 active:scale-90 cursor-pointer shadow-xl"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                goToNext();
                            }}
                            aria-label="Imagen siguiente"
                            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-11 md:h-11 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white/90 hover:text-white hover:bg-black/80 hover:border-white/40 transition-all duration-200 opacity-80 md:opacity-0 md:group-hover:opacity-100 active:scale-90 cursor-pointer shadow-xl"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </>
                )}

                {/* Hint de gestos — solo mobile */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1 bg-black/70 backdrop-blur-md rounded-full border border-white/15 flex md:hidden items-center pointer-events-none shadow-md">
                    <span className="text-[10px] text-white/80 font-medium tracking-tight whitespace-nowrap">
                        {imgScale > 1 ? '↕ Arrastra para moverte · doble tap para salir' : 'Desliza · pellizca · doble tap'}
                    </span>
                </div>

                {/* Dot indicators en Cápsula Apple — solo mobile */}
                {galleryImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 px-2.5 py-1.5 rounded-full bg-black/55 backdrop-blur-xl border border-white/15 flex md:hidden gap-1.5 shadow-lg">
                        {galleryImages.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveImageIdx(idx);
                                    manualPauseUntilRef.current = Date.now() + 8000;
                                }}
                                aria-label={`Imagen ${idx + 1}`}
                                className={`rounded-full transition-all duration-300 ${
                                    activeImageIdx === idx
                                        ? 'w-5 h-2 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                                        : 'w-2 h-2 bg-white/40 hover:bg-white/60'
                                }`}
                            />
                        ))}
                    </div>
                )}

                {/* Barra de progreso auto-rotate */}
                {galleryImages.length > 1 && !isHoveringImage && (
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/10 z-30">
                        <div
                            key={activeImageIdx}
                            className="h-full bg-primary/70 rounded-full"
                            style={{
                                animation: 'gallery-progress 5s linear infinite',
                            }}
                        />
                    </div>
                )}
            </motion.div>

            {/* Thumbnails con Estilo Apple Focus — solo desktop */}
            {galleryImages.length > 1 && (
                <div className="hidden md:flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
                    {galleryImages.map((imgSrc, idx) => {
                        const isSelected = activeImageIdx === idx;
                        return (
                            <button
                                key={idx}
                                onClick={() => setActiveImageIdx(idx)}
                                className={`relative shrink-0 w-20 h-20 rounded-2xl overflow-hidden border transition-all duration-300 active:scale-95 cursor-pointer ${
                                    isSelected
                                        ? 'border-primary ring-2 ring-primary/40 shadow-[0_4px_16px_rgba(229,9,20,0.35)] scale-105'
                                        : 'border-white/10 hover:border-white/30 hover:scale-[1.02] opacity-70 hover:opacity-100'
                                }`}
                                aria-label={`Ver imagen ${idx + 1}`}
                            >
                                {isSelected && (
                                    <div className="absolute inset-x-0 top-0 h-px bg-white/50 z-10 pointer-events-none" />
                                )}
                                <ProductImage
                                    src={imgSrc}
                                    alt={`Vista ${idx + 1}`}
                                    width={80}
                                    height={80}
                                    quality={75}
                                    loading="eager"
                                    className="w-full h-full object-cover bg-black/40"
                                />
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

