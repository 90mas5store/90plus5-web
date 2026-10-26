'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Upload,
    X,
    Loader2,
    ArrowUp,
    ArrowDown,
    Sparkles,
    Wand2,
    Paintbrush,
    RotateCcw
} from 'lucide-react';
import useToastMessage from '@/hooks/useToastMessage';
import {
    removeImageBackground,
    blobToFile,
    BackgroundRemovalProgress
} from '@/lib/image/removeBackground';
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
    const [autoRemoveBg, setAutoRemoveBg] = useState(true);
    const [isWhiteShirt, setIsWhiteShirt] = useState(false);
    const [uploadStatusText, setUploadStatusText] = useState<string>('');

    // Estado para Retoque
    const [touchUpImage, setTouchUpImage] = useState<GalleryImage | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;
    const toast = useToastMessage();

    // Subir un archivo al bucket de Supabase
    const uploadFileToSupabase = async (file: File): Promise<string> => {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
        const contentType = file.type || (fileExt === 'webp' ? 'image/webp' : fileExt === 'png' ? 'image/png' : 'image/jpeg');
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, { cacheControl: '3600', upsert: false, contentType });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

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
            const currentItemNum = i + 1;
            setUploadStatusText(`Procesando ${currentItemNum} de ${validFiles.length}...`);

            try {
                let fileToUpload = file;
                let rawUploadedUrl = '';
                let isCutout = false;

                // Subir primero original de respaldo si está activo el recorte
                if (autoRemoveBg) {
                    try {
                        rawUploadedUrl = await uploadFileToSupabase(file);
                    } catch {
                        // ignore backup error
                    }

                    try {
                        setUploadStatusText(`IA Recortando fondo (${currentItemNum}/${validFiles.length})...`);
                        const cutoutBlob = await removeImageBackground(file, {
                            mode: isWhiteShirt ? 'white_shirt' : 'standard',
                            onProgress: (p: BackgroundRemovalProgress) => {
                                setUploadStatusText(`${p.message} (${currentItemNum}/${validFiles.length})`);
                            },
                        });
                        fileToUpload = blobToFile(cutoutBlob, file.name);
                        isCutout = true;
                    } catch (iaErr) {
                        console.error('Error al quitar fondo en galería:', iaErr);
                    }
                }

                const finalPublicUrl = await uploadFileToSupabase(fileToUpload);

                uploaded.push({
                    tempId: `new_${Date.now()}_${Math.random().toString(36).substring(2)}`,
                    image_url: finalPublicUrl,
                    original_url: rawUploadedUrl || finalPublicUrl,
                    is_cutout: isCutout,
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

    // Quitar fondo de una imagen ya presente en la galería
    const handleIndividualRemoveBg = async (tempId: string) => {
        const targetImg = images.find((img) => img.tempId === tempId);
        if (!targetImg || isUploading) return;

        try {
            setIsUploading(true);
            setUploadStatusText('Recortando fondo con IA...');

            // Respaldar original si aún no lo tiene
            const originalUrl = targetImg.original_url || targetImg.image_url;

            const response = await fetch(targetImg.image_url);
            const imageBlob = await response.blob();

            const cutoutBlob = await removeImageBackground(imageBlob, {
                mode: isWhiteShirt ? 'white_shirt' : 'standard',
                onProgress: (p) => setUploadStatusText(p.message),
            });

            const cutoutFile = blobToFile(cutoutBlob, 'recorte-galeria.png');
            const newUrl = await uploadFileToSupabase(cutoutFile);

            onChange(
                images.map((img) =>
                    img.tempId === tempId
                        ? {
                              ...img,
                              image_url: newUrl,
                              original_url: originalUrl,
                              is_cutout: true,
                          }
                        : img
                )
            );
            toast.success('Fondo eliminado de la imagen');
        } catch (error) {
            console.error('Error al recortar fondo individual:', error);
            toast.error('Error al eliminar fondo');
        } finally {
            setIsUploading(false);
            setUploadStatusText('');
        }
    };

    // Restaurar original de una imagen de la galería
    const handleRestoreIndividual = (tempId: string) => {
        onChange(
            images.map((img) => {
                if (img.tempId === tempId && img.original_url) {
                    return {
                        ...img,
                        image_url: img.original_url,
                        is_cutout: false,
                    };
                }
                return img;
            })
        );
        toast.info('Se restauró la imagen original');
    };

    // Guardar retoque desde el modal
    const handleTouchUpSave = async (editedBlob: Blob) => {
        if (!touchUpImage) return;

        try {
            setIsUploading(true);
            const retouchedFile = blobToFile(editedBlob, 'retocado-galeria.png');
            const newUrl = await uploadFileToSupabase(retouchedFile);

            onChange(
                images.map((img) =>
                    img.tempId === touchUpImage.tempId
                        ? {
                              ...img,
                              image_url: newUrl,
                              is_cutout: true,
                          }
                        : img
                )
            );
            toast.success('Retoque aplicado');
        } catch (error) {
            console.error('Error guardando retoque:', error);
            toast.error('Error al guardar retoque');
        } finally {
            setIsUploading(false);
            setTouchUpImage(null);
        }
    };

    const removeImage = (tempId: string) => {
        onChange(images.filter((img) => img.tempId !== tempId).map((img, i) => ({ ...img, sort_order: i })));
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
            {/* Barra de IA y Modos */}
            <div className="flex flex-col gap-2 p-2.5 bg-neutral-900/60 border border-white/5 rounded-2xl text-xs">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-300">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-medium">Quitar fondo con IA al subir fotos</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={autoRemoveBg}
                            onChange={(e) => setAutoRemoveBg(e.target.checked)}
                            disabled={disabled || isUploading}
                            className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>

                {autoRemoveBg && (
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                        <span className="text-gray-400">¿Fotos con camisa blanca o fondo claro?</span>
                        <button
                            type="button"
                            onClick={() => setIsWhiteShirt((prev) => !prev)}
                            className={`px-2.5 py-1 rounded-xl transition-all font-medium flex items-center gap-1.5 ${
                                isWhiteShirt
                                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                    : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                            }`}
                            title="Optimiza el contraste de costuras para fotos blancas"
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${isWhiteShirt ? 'bg-amber-400 animate-pulse' : 'bg-gray-500'}`} />
                            <span>{isWhiteShirt ? 'Modo Camisa Blanca: ON' : 'Modo Estándar'}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Grid de Imágenes de la Galería */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {images.map((img, index) => (
                        <div
                            key={img.tempId}
                            className="relative group aspect-square rounded-2xl overflow-hidden border border-white/10 transition-all"
                            style={{
                                backgroundImage: `
                                    linear-gradient(45deg, #18181b 25%, transparent 25%),
                                    linear-gradient(-45deg, #18181b 25%, transparent 25%),
                                    linear-gradient(45deg, transparent 75%, #18181b 75%),
                                    linear-gradient(-45deg, transparent 75%, #18181b 75%)
                                `,
                                backgroundSize: '16px 16px',
                                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                                backgroundColor: '#09090b',
                            }}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={img.image_url}
                                alt={`Imagen ${index + 1}`}
                                className="w-full h-full object-contain p-2 drop-shadow-md"
                            />

                            {/* Badge de Orden */}
                            <div className="absolute top-2 left-2 w-5 h-5 bg-black/75 backdrop-blur-md rounded-md flex items-center justify-center text-[10px] font-bold text-white border border-white/10">
                                {index + 1}
                            </div>

                            {/* Badge de Sin Fondo */}
                            {img.is_cutout && (
                                <div className="absolute top-2 right-2 p-1 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono font-bold backdrop-blur-md" title="Sin Fondo">
                                    <Sparkles className="w-3 h-3" />
                                </div>
                            )}

                            {/* Actions overlay */}
                            <div className="absolute inset-0 bg-black/80 sm:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2 backdrop-blur-sm">
                                <div className="flex items-center gap-1">
                                    {/* Quitar Fondo */}
                                    <button
                                        type="button"
                                        onClick={() => handleIndividualRemoveBg(img.tempId)}
                                        disabled={disabled || isUploading}
                                        className="p-1.5 bg-primary hover:bg-primary/90 rounded-lg text-white transition-colors"
                                        title="Quitar fondo con IA"
                                    >
                                        <Wand2 className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Retocar */}
                                    <button
                                        type="button"
                                        onClick={() => setTouchUpImage(img)}
                                        disabled={disabled || isUploading}
                                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                                        title="Retocar con pincel"
                                    >
                                        <Paintbrush className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Restaurar original si existe */}
                                    {img.original_url && img.original_url !== img.image_url && (
                                        <button
                                            type="button"
                                            onClick={() => handleRestoreIndividual(img.tempId)}
                                            disabled={disabled || isUploading}
                                            className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-amber-300 transition-colors"
                                            title="Restaurar foto original"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => moveUp(index)}
                                        disabled={index === 0 || disabled || isUploading}
                                        className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 text-white transition-colors disabled:opacity-30"
                                        title="Mover arriba"
                                    >
                                        <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => moveDown(index)}
                                        disabled={index === images.length - 1 || disabled || isUploading}
                                        className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 text-white transition-colors disabled:opacity-30"
                                        title="Mover abajo"
                                    >
                                        <ArrowDown className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeImage(img.tempId)}
                                        disabled={disabled || isUploading}
                                        className="p-1.5 bg-red-500/80 rounded-lg hover:bg-red-500 text-white transition-colors disabled:opacity-50"
                                        title="Eliminar"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Botón de Carga */}
            <label
                className={`flex flex-col items-center justify-center gap-2 w-full py-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                    isUploading || disabled
                        ? 'opacity-60 cursor-not-allowed border-white/10 bg-white/5'
                        : 'border-white/10 hover:border-primary/50 hover:bg-primary/5 text-gray-400 hover:text-white'
                }`}
            >
                {isUploading ? (
                    <div className="flex flex-col items-center gap-2 text-primary">
                        <Loader2 className="w-5 h-5 animate-spin" />
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
                <p className="text-[10px] text-gray-600 px-1 text-center">
                    Agrega fotos adicionales del producto (diferentes ángulos, detalles, tela, etiquetas)
                </p>
            )}
            <p className="text-[10px] text-gray-600 px-1">
                Formatos: JPG, PNG, WEBP, AVIF · Máx 15MB · Procesamiento inteligente en lote
            </p>

            {/* Modal de Retoque para la foto seleccionada de la galería */}
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
