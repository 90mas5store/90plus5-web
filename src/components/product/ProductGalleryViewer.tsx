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
        <div className="flex flex-col gap-3">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="relative w-full h-[50vh] md:h-auto md:aspect-square rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl group cursor-crosshair p-0"
                ref={combinedContainerRef}
                onMouseMove={handleZoomMove}
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
                style={{ touchAction: 'none' }}
            >
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
                                width={800}
                                height={800}
                                priority={idx === 0}
                                loading="eager"
                                quality={95}
                                sizes="(max-width: 1024px) 100vw, 60vw"
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
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
                    className="absolute w-48 h-48 md:w-64 md:h-64 rounded-full pointer-events-none border-2 border-primary/50 shadow-[0_0_30px_rgba(229,9,20,0.4)] opacity-0 transition-opacity duration-300 z-20 will-change-transform"
                    style={{
                        backgroundImage: `url(${activeImage})`,
                    }}
                />

                {/* Badge de Zoom — solo desktop */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hidden md:flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                    <Info className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Pasa el mouse para zoom</span>
                </div>

                {/* Image counter badge — solo desktop */}
                {galleryImages.length > 1 && (
                    <div className="absolute top-4 right-4 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-bold text-gray-300 hidden md:flex">
                        {activeImageIdx + 1} / {galleryImages.length}
                    </div>
                )}

                {/* Flechas de navegación */}
                {galleryImages.length > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                goToPrev();
                            }}
                            aria-label="Imagen anterior"
                            className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 hover:border-primary/40 transition-all duration-200 opacity-70 md:opacity-0 md:group-hover:opacity-100 active:scale-90 cursor-pointer"
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
                            className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 hover:border-primary/40 transition-all duration-200 opacity-70 md:opacity-0 md:group-hover:opacity-100 active:scale-90 cursor-pointer"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </>
                )}

                {/* Hint de gestos — solo mobile */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-black/65 backdrop-blur-sm rounded-full border border-white/10 flex md:hidden items-center pointer-events-none">
                    <span className="text-[9px] text-white/70 font-medium tracking-tight whitespace-nowrap">
                        {imgScale > 1 ? '↕ Arrastra para moverte · doble tap para salir' : 'Desliza · pellizca · doble tap para zoom'}
                    </span>
                </div>

                {/* Dot indicators — solo mobile */}
                {galleryImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex md:hidden gap-2">
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
                                        ? 'w-5 h-2 bg-primary shadow-[0_0_8px_rgba(229,9,20,0.8)]'
                                        : 'w-2 h-2 bg-white/50'
                                }`}
                            />
                        ))}
                    </div>
                )}

                {/* Barra de progreso auto-rotate */}
                {galleryImages.length > 1 && !isHoveringImage && (
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5 z-30">
                        <div
                            key={activeImageIdx}
                            className="h-full bg-primary/60 rounded-full"
                            style={{
                                animation: 'gallery-progress 5s linear infinite',
                            }}
                        />
                    </div>
                )}
            </motion.div>

            {/* Thumbnails — solo desktop */}
            {galleryImages.length > 1 && (
                <div className="hidden md:flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    {galleryImages.map((imgSrc, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveImageIdx(idx)}
                            className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
                                activeImageIdx === idx
                                    ? 'border-primary shadow-[0_0_10px_rgba(229,9,20,0.4)]'
                                    : 'border-white/10 hover:border-white/30'
                            }`}
                            aria-label={`Ver imagen ${idx + 1}`}
                        >
                            <ProductImage
                                src={imgSrc}
                                alt={`Vista ${idx + 1}`}
                                width={80}
                                height={80}
                                quality={70}
                                loading="eager"
                                className="w-full h-full object-contain bg-black/40"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
