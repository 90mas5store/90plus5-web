'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Upload,
    X,
    Loader2,
    ArrowUp,
    ArrowDown,
    Wand2,
} from 'lucide-react';
import useToastMessage from '@/hooks/useToastMessage';
import { blobToFile } from '@/lib/image/removeBackground';
import ImageTouchUpModal from './image-editor/ImageTouchUpModal';

export interface GalleryImage {
    tempId: string;
    id?: string;
    image_url: string;
    original_url?: string;
    is_cutout?: boolean;
    sort_order: number;
}

interface ProductGalleryManagerProps {
    images: GalleryImage[];
    onChange: (images: GalleryImage[]) => void;
    disabled?: boolean;
    bucket?: string;
}

export default function ProductGalleryManager({
    images,
    onChange,
    disabled = false,
    bucket = 'products',
}: ProductGalleryManagerProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatusText, setUploadStatusText] = useState<string>('');
    const [touchUpImage, setTouchUpImage] = useState<GalleryImage | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;
    const toast = useToastMessage();

    // Subir un archivo al bucket de Supabase Storage
    const uploadFileToSupabase = async (file: File): Promise<string> => {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
        const contentType =
            file.type ||
            (fileExt === 'webp'
                ? 'image/webp'
                : fileExt === 'png'
                  ? 'image/png'
                  : 'image/jpeg');
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, { cacheControl: '3600', upsert: false, contentType });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return data.publicUrl;
    };

    // Subir fotos directamente y rápido sin congelar el navegador
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const validFiles = files.filter((f) => {
            const isSupported =
                f.type.startsWith('image/') ||
                /\.(jpe?g|png|webp|avif)$/i.test(f.name);
            if (!isSupported) {
                toast.error(`${f.name}: Formato no soportado (usa JPG, PNG, WEBP o AVIF)`);
                return false;
            }
            if (f.size > 15 * 1024 * 1024) {
                toast.error(`${f.name} supera el límite de 15MB`);
                return false;
            }
            return true;
        });

        if (!validFiles.length) return;

        setIsUploading(true);
        const uploaded: GalleryImage[] = [];

        for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i];
            setUploadStatusText(`Subiendo ${i + 1} de ${validFiles.length}...`);

            try {
                const publicUrl = await uploadFileToSupabase(file);
                uploaded.push({
                    tempId: `new_${Date.now()}_${Math.random().toString(36).substring(2)}`,
                    image_url: publicUrl,
                    original_url: publicUrl,
                    is_cutout: false,
                    sort_order: images.length + uploaded.length,
                });
            } catch (err) {
                console.error(`Error al subir ${file.name}:`, err);
                toast.error(`Error al subir ${file.name}`);
            }
        }

        if (uploaded.length) {
            onChange([...images, ...uploaded]);
            toast.success(`${uploaded.length} imagen(es) agregada(s)`);
        }

        setIsUploading(false);
        setUploadStatusText('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Guardar resultado desde el Estudio de Recorte IA
    const handleTouchUpSave = async (editedBlob: Blob) => {
        if (!touchUpImage) return;

        setIsUploading(true);
        try {
            const retouchedFile = blobToFile(editedBlob, 'recorte-galeria.png');
            const newUrl = await uploadFileToSupabase(retouchedFile);

            onChange(
                images.map((img) =>
                    img.tempId === touchUpImage.tempId
                        ? {
                              ...img,
                              original_url: img.original_url || img.image_url,
                              image_url: newUrl,
                              is_cutout: true,
                          }
                        : img
                )
            );
            toast.success('Recorte aplicado a la galería');
        } catch (error) {
            console.error('Error guardando recorte de galería:', error);
            toast.error('Error al guardar el recorte');
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    const removeImage = (tempId: string) => {
        onChange(
            images
                .filter((img) => img.tempId !== tempId)
                .map((img, i) => ({ ...img, sort_order: i }))
        );
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
        <div className="space-y-3.5">
            {/* Grid de Miniaturas */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                    {images.map((img, index) => (
                        <div
                            key={img.tempId}
                            className="rounded-2xl overflow-hidden bg-[#0a0c10]/80 border border-white/[0.08] flex flex-col"
                        >
                            {/* Stage de Vista Previa */}
                            <div
                                className="relative aspect-square w-full overflow-hidden"
                                style={{
                                    backgroundImage: `
                                        linear-gradient(45deg, #14171f 25%, transparent 25%),
                                        linear-gradient(-45deg, #14171f 25%, transparent 25%),
                                        linear-gradient(45deg, transparent 75%, #14171f 75%),
                                        linear-gradient(-45deg, transparent 75%, #14171f 75%)
                                    `,
                                    backgroundSize: '14px 14px',
                                    backgroundPosition: '0 0, 0 7px, 7px -7px, -7px 0px',
                                    backgroundColor: '#090b10',
                                }}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={img.image_url}
                                    alt={`Imagen ${index + 1}`}
                                    className="w-full h-full object-contain p-2.5 drop-shadow-md select-none"
                                />

                                {/* Número de orden */}
                                <div className="absolute top-2 left-2 min-w-[22px] h-[22px] px-1.5 bg-black/70 backdrop-blur-md rounded-lg flex items-center justify-center text-[10px] font-mono font-bold text-white border border-white/[0.1]">
                                    {index + 1}
                                </div>

                                {/* Botón Eliminar limpio en esquina superior derecha */}
                                <button
                                    type="button"
                                    onClick={() => removeImage(img.tempId)}
                                    disabled={disabled || isUploading}
                                    className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-black/70 hover:bg-red-500 active:scale-[0.95] text-neutral-300 hover:text-white border border-white/[0.1] backdrop-blur-md flex items-center justify-center transition-all disabled:opacity-40"
                                    title="Eliminar foto"
                                    aria-label={`Eliminar imagen ${index + 1}`}
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>

                                {/* Badge sutil Sin Fondo */}
                                {img.is_cutout && (
                                    <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 backdrop-blur-md text-[9px] font-bold uppercase tracking-wider">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        <span>Sin Fondo</span>
                                    </div>
                                )}
                            </div>

                            {/* Barra inferior compacta (Estudio IA + Ordenar) */}
                            <div className="p-1.5 bg-white/[0.03] border-t border-white/[0.06] flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setTouchUpImage(img)}
                                    disabled={disabled || isUploading}
                                    className="flex-1 min-w-0 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] active:scale-[0.98] text-[11px] font-bold text-white border border-white/[0.08] transition-all disabled:opacity-40 cursor-pointer"
                                    title="Abrir Estudio IA para recortar o retocar"
                                >
                                    <Wand2 className="w-3 h-3 text-primary shrink-0" />
                                    <span className="truncate">Estudio IA</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => moveUp(index)}
                                    disabled={index === 0 || disabled || isUploading}
                                    className="w-7 h-7 shrink-0 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] active:scale-[0.95] text-neutral-300 hover:text-white flex items-center justify-center transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                                    title="Mover antes"
                                    aria-label="Mover imagen hacia arriba"
                                >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => moveDown(index)}
                                    disabled={index === images.length - 1 || disabled || isUploading}
                                    className="w-7 h-7 shrink-0 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] active:scale-[0.95] text-neutral-300 hover:text-white flex items-center justify-center transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                                    title="Mover después"
                                    aria-label="Mover imagen hacia abajo"
                                >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Botón de Carga */}
            <label
                className={`flex flex-col items-center justify-center gap-2 w-full py-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                    isUploading || disabled
                        ? 'opacity-60 cursor-not-allowed border-white/[0.08] bg-white/[0.03]'
                        : 'border-white/[0.1] bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.05] text-neutral-400 hover:text-white'
                }`}
            >
                {isUploading ? (
                    <div className="flex items-center gap-2 text-primary">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                            {uploadStatusText || 'Subiendo imágenes...'}
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wide">
                            Agregar Fotos a la Galería
                        </span>
                    </div>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/avif"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading || disabled}
                />
            </label>

            {images.length === 0 && (
                <p className="text-[11px] text-neutral-500 px-1 text-center">
                    Agrega fotos adicionales (ángulos, detalles de tela, parches o dorsales) y edítalas en el Estudio IA.
                </p>
            )}
            <p className="text-[10px] text-neutral-500 px-1">
                Formatos: JPG, PNG, WEBP, AVIF · Máx 15MB por foto
            </p>

            {/* Estudio de Recorte IA (Fullscreen Portal Modal) */}
            {touchUpImage && (
                <ImageTouchUpModal
                    isOpen={Boolean(touchUpImage)}
                    originalSrc={touchUpImage.original_url || touchUpImage.image_url}
                    currentCutoutSrc={touchUpImage.image_url}
                    onSave={handleTouchUpSave}
                    onClose={() => setTouchUpImage(null)}
                />
            )}
        </div>
    );
}
