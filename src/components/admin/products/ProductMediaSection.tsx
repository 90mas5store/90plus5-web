import React from 'react';
import ImageUpload from '@/components/admin/ImageUpload';
import ProductGalleryManager, { GalleryImage } from '@/components/admin/ProductGalleryManager';

interface ProductMediaSectionProps {
    imageUrl: string;
    onImageUrlChange: (url: string) => void;
    galleryImages: GalleryImage[];
    onGalleryImagesChange: (images: GalleryImage[]) => void;
    disabled?: boolean;
}

export default function ProductMediaSection({
    imageUrl,
    onImageUrlChange,
    galleryImages,
    onGalleryImagesChange,
    disabled = false,
}: ProductMediaSectionProps) {
    return (
        <div className="space-y-6">
            {/* Imagen Principal */}
            <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                    Imagen Principal
                </h2>
                <ImageUpload
                    value={imageUrl}
                    onChange={onImageUrlChange}
                />
            </div>

            {/* Galería Adicional */}
            <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Galería de Imágenes
                </h2>
                <p className="text-[10px] text-gray-600 mb-4">
                    Fotos adicionales visibles en el producto
                </p>
                <ProductGalleryManager
                    images={galleryImages}
                    onChange={onGalleryImagesChange}
                    disabled={disabled}
                />
            </div>
        </div>
    );
}
