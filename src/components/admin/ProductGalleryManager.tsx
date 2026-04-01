'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Upload, X, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import useToastMessage from '@/hooks/useToastMessage';

export interface GalleryImage {
    tempId: string;
    id?: string;
    image_url: string;
    sort_order: number;
}

interface ProductGalleryManagerProps {
    images: GalleryImage[];
    onChange: (images: GalleryImage[]) => void;
    disabled?: boolean;
}

export default function ProductGalleryManager({ images, onChange, disabled }: ProductGalleryManagerProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;
    const toast = useToastMessage();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const validFiles = files.filter(f => {
            if (!f.type.startsWith('image/')) { toast.error(`${f.name} no es una imagen`); return false; }
            if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name} supera el límite de 5MB`); return false; }
            return true;
        });

        if (!validFiles.length) return;

        setIsUploading(true);
        const uploaded: GalleryImage[] = [];

        for (const file of validFiles) {
            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file);
                if (uploadError) throw uploadError;
                const { data } = supabase.storage.from('products').getPublicUrl(fileName);
                uploaded.push({
                    tempId: `new_${Date.now()}_${Math.random().toString(36).substring(2)}`,
                    image_url: data.publicUrl,
                    sort_order: images.length + uploaded.length,
                });
            } catch {
                toast.error(`Error al subir ${file.name}`);
            }
        }

        if (uploaded.length) {
            onChange([...images, ...uploaded]);
            toast.success(`${uploaded.length} imagen(es) agregada(s)`);
        }

        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (tempId: string) => {
        onChange(images.filter(img => img.tempId !== tempId).map((img, i) => ({ ...img, sort_order: i })));
    };

    const moveUp = (index: number) => {
        if (index === 0) return;
        const next = [...images];
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
        onChange(next.map((img, i) => ({ ...img, sort_order: i })));
    };

    const moveDown = (index: number) => {
        if (index === images.length - 1) return;
        const next = [...images];
        [next[index], next[index + 1]] = [next[index + 1], next[index]];
        onChange(next.map((img, i) => ({ ...img, sort_order: i })));
    };

    return (
        <div className="space-y-4">
            {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {images.map((img, index) => (
                        <div key={img.tempId} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10 bg-black">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.image_url} alt={`Imagen ${index + 1}`} className="w-full h-full object-contain p-1" />

                            {/* Order badge */}
                            <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-black/70 rounded-md flex items-center justify-center text-[10px] font-bold text-white">
                                {index + 1}
                            </div>

                            {/* Actions overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => moveUp(index)}
                                    disabled={index === 0 || disabled}
                                    className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 text-white transition-colors disabled:opacity-30"
                                    title="Mover arriba"
                                >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => moveDown(index)}
                                    disabled={index === images.length - 1 || disabled}
                                    className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 text-white transition-colors disabled:opacity-30"
                                    title="Mover abajo"
                                >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeImage(img.tempId)}
                                    disabled={disabled}
                                    className="p-1.5 bg-red-500/80 rounded-lg hover:bg-red-500 text-white transition-colors disabled:opacity-50"
                                    title="Eliminar"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <label className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed transition-all cursor-pointer ${isUploading || disabled ? 'opacity-50 cursor-not-allowed border-white/10' : 'border-white/10 hover:border-primary/50 hover:bg-primary/5 text-gray-400 hover:text-white'}`}>
                {isUploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin text-primary" /><span className="text-xs font-bold">Subiendo...</span></>
                ) : (
                    <><Upload className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-wide">Agregar Imágenes</span></>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading || disabled}
                />
            </label>

            {images.length === 0 && (
                <p className="text-[10px] text-gray-600 px-1 text-center">
                    Agrega fotos adicionales del producto (varios ángulos, detalles, etc.)
                </p>
            )}
            <p className="text-[10px] text-gray-600 px-1">Formatos: JPG, PNG, WEBP · Máx 5MB por imagen · Puedes subir varias a la vez</p>
        </div>
    );
}
