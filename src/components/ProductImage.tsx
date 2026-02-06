'use client';

import Image from "next/image";
import { useState, memo } from "react";
import { motion } from "@/lib/motion";

type ProductImageProps = {
  src?: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  /** Calidad de la imagen (1-100) */
  quality?: number;
  /** Atributo sizes para optimización de responsive */
  sizes?: string;
  /** Mostrar skeleton mientras carga */
  showSkeleton?: boolean;
  /** Callback cuando la imagen carga */
  onLoad?: () => void;
};

// Skeleton loader para imágen de producto
function ImageSkeleton({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}

function ProductImageComponent({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  quality = 85,
  sizes,
  showSkeleton = true,
  onLoad,
}: ProductImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`bg-neutral-900 flex items-center justify-center text-gray-500 ${className}`}
        style={!className?.includes('h-full') ? { width, height } : {}}
      >
        <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  // Si no se pasan width/height, asumimos que debe usar fill
  const useFill = !width || !height || className?.includes('h-full');

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className={`relative overflow-hidden ${useFill ? 'w-full h-full' : ''}`}>
      {/* Skeleton mientras carga */}
      {showSkeleton && isLoading && (
        <ImageSkeleton className="absolute inset-0 z-10" />
      )}

      <Image
        src={src}
        alt={alt}
        fill={useFill}
        width={!useFill ? width : undefined}
        height={!useFill ? height : undefined}
        quality={quality}
        className={`${className} ${useFill && !className?.includes('object-') ? 'object-cover' : ''} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
        sizes={sizes || "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        onLoad={handleLoad}
        onError={handleError}
        // Blur placeholder para imágenes externas
        placeholder="empty"
      />
    </div>
  );
}

// Memoizar el componente para evitar re-renders innecesarios
const ProductImage = memo(ProductImageComponent);
export default ProductImage;
