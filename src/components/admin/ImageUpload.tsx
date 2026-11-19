'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Upload,
    X,
    Loader2,
    ExternalLink,
    Wand2,
    Paintbrush,
    RotateCcw,
} from 'lucide-react';
import useToastMessage from '@/hooks/useToastMessage';
import { blobToFile } from '@/lib/image/removeBackground';
import ImageTouchUpModal from './image-editor/ImageTouchUpModal';

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    disabled?: boolean;
    bucket?: string;
    enableBackgroundRemoval?: boolean;
}

export default function ImageUpload({
    value,
    onChange,
    disabled = false,
    bucket = 'products',
    enableBackgroundRemoval = true,
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const [preview, setPreview] = useState(value || '');
    const [originalBackupUrl, setOriginalBackupUrl] = useState<string>('');
    const [isCutout, setIsCutout] = useState(false);

    // Estudio de Recorte IA (modal fullscreen vía Portal)
    const [studioState, setStudioState] = useState<{ open: boolean; autoRun: boolean }>({
        open: false,
        autoRun: false,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;
    const toast = useToastMessage();

    useEffect(() => {
        setPreview(value || '');
    }, [value]);

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
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
                contentType,
            });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return data.publicUrl;
    };

    // Procesar y subir archivo directamente (rápido, sin congelar la UI)
    const processSelectedFile = async (file: File) => {
        const isSupportedImage =
            file.type.startsWith('image/') ||
            /\.(jpe?g|png|webp|avif)$/i.test(file.name);

        if (!isSupportedImage) {
            toast.error('Formato no soportado. Usa JPG, PNG, WEBP o AVIF');
            return;
        }

        if (file.size > 15 * 1024 * 1024) {
            toast.error('La imagen no debe superar los 15MB');
            return;
        }

        try {
            setIsUploading(true);
            const publicUrl = await uploadFileToSupabase(file);
            setPreview(publicUrl);
            setOriginalBackupUrl(publicUrl);
            setIsCutout(false);
            onChange(publicUrl);
            toast.success('Imagen subida correctamente');
        } catch (error: unknown) {
            console.error('Upload error:', error);
            toast.error('Error al subir la imagen');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await processSelectedFile(file);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled || isUploading) return;
        const file = e.dataTransfer.files?.[0];
        if (file) {
            await processSelectedFile(file);
        }
    };

    const handleRestoreOriginal = () => {
        if (!originalBackupUrl) return;
        setPreview(originalBackupUrl);
        onChange(originalBackupUrl);
        setIsCutout(false);
        toast.info('Se restauró la imagen original');
    };

    // Guardar cambios desde el Estudio de Recorte IA
    const handleTouchUpSave = async (editedBlob: Blob) => {
        setIsUploading(true);
        try {
            if (!originalBackupUrl && preview) {
                setOriginalBackupUrl(preview);
            }

            const retouchedFile = blobToFile(editedBlob, 'recorte.png');
            const newUrl = await uploadFileToSupabase(retouchedFile);

            setPreview(newUrl);
            onChange(newUrl);
            setIsCutout(true);
            toast.success('Recorte aplicado y guardado');
        } catch (error) {
            console.error('Error guardando recorte:', error);
            toast.error('Error al guardar la imagen recortada');
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = () => {
        setPreview('');
        setOriginalBackupUrl('');
        setIsCutout(false);
        onChange('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const canRestoreOriginal = Boolean(originalBackupUrl && originalBackupUrl !== preview);

    return (
        <div className="w-full space-y-3">
            {/* Input oculto siempre montado para que "Cambiar" funcione con preview activa */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                className="hidden"
                onChange={handleFileChange}
                disabled={disabled || isUploading}
            />

            {/* Contenedor Cuadrado de Vista Previa / Dropzone */}
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    if (!disabled && !isUploading) setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative w-full aspect-square rounded-2xl overflow-hidden border transition-all ${
                    preview
                        ? 'border-white/[0.1]'
                        : isDragging
                          ? 'border-primary/60 bg-primary/5 border-dashed border-2'
                          : 'border-dashed border-2 border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20'
                }`}
                style={
                    preview
                        ? {
                              backgroundImage: `
                                  linear-gradient(45deg, #14171f 25%, transparent 25%),
                                  linear-gradient(-45deg, #14171f 25%, transparent 25%),
                                  linear-gradient(45deg, transparent 75%, #14171f 75%),
                                  linear-gradient(-45deg, transparent 75%, #14171f 75%)
                              `,
                              backgroundSize: '18px 18px',
                              backgroundPosition: '0 0, 0 9px, 9px -9px, -9px 0px',
                              backgroundColor: '#090b10',
                          }
                        : undefined
                }
            >
                {preview ? (
                    <div className="relative w-full h-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={preview}
                            alt="Vista previa del producto"
                            className="w-full h-full object-contain p-4 drop-shadow-xl select-none"
                        />

                        {/* Badge de estado SIN FONDO */}
                        {isCutout && (
                            <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span>Sin Fondo</span>
                            </div>
                        )}

                        {/* Botones limpios en esquina superior derecha */}
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                            <a
                                href={preview}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 rounded-xl bg-black/65 hover:bg-black/85 active:scale-[0.95] text-neutral-300 hover:text-white border border-white/[0.1] backdrop-blur-md flex items-center justify-center transition-all"
                                title="Abrir imagen en nueva pestaña"
                                aria-label="Abrir imagen en nueva pestaña"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                                type="button"
                                onClick={handleRemove}
                                disabled={disabled || isUploading}
                                className="w-8 h-8 rounded-xl bg-black/65 hover:bg-red-500 active:scale-[0.95] text-neutral-300 hover:text-white border border-white/[0.1] backdrop-blur-md flex items-center justify-center transition-all disabled:opacity-40"
                                title="Eliminar imagen"
                                aria-label="Eliminar imagen"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Overlay de carga al reemplazar o guardar recorte */}
                        {isUploading && (
                            <div className="absolute inset-0 bg-[#07080a]/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-10">
                                <Loader2 className="w-7 h-7 animate-spin text-primary" />
                                <span className="text-xs font-bold text-white">
                                    Subiendo imagen...
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled || isUploading}
                        className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-6 disabled:cursor-not-allowed"
                    >
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-2.5 text-center">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="text-xs font-bold text-white uppercase tracking-wider">
                                    Subiendo imagen...
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3 text-neutral-400 hover:text-white transition-colors">
                                <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center border border-white/[0.08]">
                                    <Upload className="w-5 h-5" />
                                </div>
                                <div className="text-center space-y-0.5">
                                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                                        Subir Imagen
                                    </p>
                                    <p className="text-[11px] text-neutral-500">
                                        Arrastra o haz clic para seleccionar
                                    </p>
                                </div>
                            </div>
                        )}
                    </button>
                )}
            </div>

            {/* Barra de Acciones limpia debajo de la vista previa (nunca sobrepuesta ni desbordada) */}
            {preview && (
                <div className="space-y-2">
                    {enableBackgroundRemoval && (
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setStudioState({ open: true, autoRun: true })}
                                disabled={disabled || isUploading}
                                className="flex items-center justify-center gap-1.5 bg-white text-black font-extrabold hover:bg-neutral-200 active:scale-[0.98] rounded-xl px-3 py-2.5 text-xs transition-all shadow-sm disabled:opacity-40 cursor-pointer min-w-0"
                                title="Abrir Estudio IA y recortar fondo automáticamente"
                            >
                                <Wand2 className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">Quitar Fondo IA</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setStudioState({ open: true, autoRun: false })}
                                disabled={disabled || isUploading}
                                className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 active:scale-[0.98] text-neutral-200 hover:text-white border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer min-w-0"
                                title="Abrir Estudio IA para retocar con pincel"
                            >
                                <Paintbrush className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">Retocar</span>
                            </button>
                        </div>
                    )}

                    <div
                        className={`grid gap-2 ${
                            canRestoreOriginal ? 'grid-cols-2' : 'grid-cols-1'
                        }`}
                    >
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={disabled || isUploading}
                            className="flex items-center justify-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] text-neutral-300 hover:text-white border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer min-w-0"
                        >
                            <Upload className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Cambiar</span>
                        </button>

                        {canRestoreOriginal && (
                            <button
                                type="button"
                                onClick={handleRestoreOriginal}
                                disabled={disabled || isUploading}
                                className="flex items-center justify-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 active:scale-[0.98] text-amber-300 border border-amber-500/20 rounded-xl px-3 py-2 text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer min-w-0"
                                title="Restaurar imagen original con fondo"
                            >
                                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">Original</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Helper de formatos y estado */}
            <div className="flex flex-wrap justify-between items-center gap-2 text-[10px] text-neutral-500 px-1">
                <p className="leading-tight">Formatos: JPG, PNG, WEBP, AVIF · Máx 15MB</p>
                {preview && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Listo
                    </span>
                )}
            </div>

            {/* Estudio de Recorte IA (Fullscreen Portal Modal) */}
            {preview && enableBackgroundRemoval && (
                <ImageTouchUpModal
                    isOpen={studioState.open}
                    originalSrc={originalBackupUrl || preview}
                    currentCutoutSrc={preview}
                    autoRunRemoval={studioState.autoRun}
                    onSave={handleTouchUpSave}
                    onClose={() => setStudioState({ open: false, autoRun: false })}
                />
            )}
        </div>
    );
}
