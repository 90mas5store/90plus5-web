import React from 'react';
import ImageUpload from '@/components/admin/ImageUpload';
import ProductGalleryManager, { GalleryImage } from '@/components/admin/ProductGalleryManager';
import { Image as ImageIcon, Images } from 'lucide-react';

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
            <div className="relative bg-[#0d0e12]/80 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-3xl p-6 sm:p-8 space-y-4 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-white uppercase tracking-wider">
                            Imagen Principal
                        </h2>
                        <p className="text-[11px] text-gray-500">
                            Portada destacada del producto en el catálogo y miniaturas
                        </p>
                    </div>
                </div>

                <ImageUpload
                    value={imageUrl}
                    onChange={onImageUrlChange}
                />
            </div>

            {/* Galería Adicional */}
            <div className="relative bg-[#0d0e12]/80 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-3xl p-6 sm:p-8 space-y-4 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Images className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-white uppercase tracking-wider">
                            Galería de Imágenes
                        </h2>
                        <p className="text-[11px] text-gray-500">
                            Fotos adicionales, ángulos y detalles visibles en la ficha del producto
                        </p>
                    </div>
                </div>

                <ProductGalleryManager
                    images={galleryImages}
                    onChange={onGalleryImagesChange}
                    disabled={disabled}
                />
            </div>
        </div>
    );
}
