'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Upload,
    X,
    Loader2,
    Image as ImageIcon,
    Wand2,
    Paintbrush,
    RotateCcw,
    Sparkles
} from 'lucide-react';
import useToastMessage from '@/hooks/useToastMessage';
import {
    removeImageBackground,
    blobToFile,
    BackgroundRemovalProgress
} from '@/lib/image/removeBackground';
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
    const [isProcessingBg, setIsProcessingBg] = useState(false);
    const [bgProgress, setBgProgress] = useState<BackgroundRemovalProgress | null>(null);

    const [preview, setPreview] = useState(value || '');
    const [originalBackupUrl, setOriginalBackupUrl] = useState<string>('');
    const [isCutout, setIsCutout] = useState(false);

    // Modal de retoque manual
    const [isTouchUpOpen, setIsTouchUpOpen] = useState(false);

    // Toggle de auto-remoción al subir
    const [autoRemoveBg, setAutoRemoveBg] = useState(true);
    // Modo optimizado para prendas blancas sobre fondo claro
    const [isWhiteShirt, setIsWhiteShirt] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;
    const toast = useToastMessage();

    useEffect(() => {
        setPreview(value || '');
    }, [value]);

    // Subir un archivo al bucket de Supabase
    const uploadFileToSupabase = async (file: File): Promise<string> => {
        const fileExt = file.name.split('.').pop() || 'png';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    // Manejar selección de archivo
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validaciones: soporta JPG, PNG, WEBP, AVIF
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

            let fileToUpload = file;
            let rawUploadedUrl = '';

            // Si la remoción automática está activa
            if (enableBackgroundRemoval && autoRemoveBg) {
                setIsProcessingBg(true);

                // Subir primero la original como respaldo en segundo plano o guardar URL local
                try {
                    rawUploadedUrl = await uploadFileToSupabase(file);
                    setOriginalBackupUrl(rawUploadedUrl);
                } catch (bErr) {
                    console.warn('No se pudo respaldar original:', bErr);
                }

                // Ejecutar eliminación de fondo con IA
                try {
                    const cutoutBlob = await removeImageBackground(file, {
                        mode: isWhiteShirt ? 'white_shirt' : 'standard',
                        onProgress: (p) => setBgProgress(p),
                    });
                    fileToUpload = blobToFile(cutoutBlob, file.name);
                    setIsCutout(true);
                } catch (iaError) {
                    console.error('Error al remover fondo:', iaError);
                    toast.error('No se pudo remover el fondo automáticamente. Se subirá original.');
                    setIsCutout(false);
                } finally {
                    setIsProcessingBg(false);
                    setBgProgress(null);
                }
            } else {
                setIsCutout(false);
            }

            // Subida final
            const finalPublicUrl = await uploadFileToSupabase(fileToUpload);
            setPreview(finalPublicUrl);
            onChange(finalPublicUrl);

            if (!rawUploadedUrl) {
                setOriginalBackupUrl(finalPublicUrl);
            }

            toast.success(isCutout ? 'Imagen procesada y subida sin fondo' : 'Imagen subida correctamente');

        } catch (error: unknown) {
            console.error('Upload error:', error);
            toast.error('Error al subir la imagen');
        } finally {
            setIsUploading(false);
            setIsProcessingBg(false);
            setBgProgress(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Ejecutar remoción de fondo manual sobre la imagen actual
    const handleManualRemoveBg = async () => {
        if (!preview || isProcessingBg) return;

        try {
            setIsProcessingBg(true);
            // Guardar respaldo de la versión previa si aún no hay
            if (!originalBackupUrl) {
                setOriginalBackupUrl(preview);
            }

            // Descargar la imagen actual para procesarla
            const response = await fetch(preview);
            const imageBlob = await response.blob();

            const cutoutBlob = await removeImageBackground(imageBlob, {
                mode: isWhiteShirt ? 'white_shirt' : 'standard',
                onProgress: (p) => setBgProgress(p),
            });

            const cutoutFile = blobToFile(cutoutBlob, 'recorte.png');
            const newUrl = await uploadFileToSupabase(cutoutFile);

            setPreview(newUrl);
            onChange(newUrl);
            setIsCutout(true);
            toast.success('Fondo eliminado exitosamente');
        } catch (error) {
            console.error('Error en remoción manual:', error);
            toast.error('Error al eliminar fondo de la imagen');
        } finally {
            setIsProcessingBg(false);
            setBgProgress(null);
        }
    };

    // Restaurar imagen original
    const handleRestoreOriginal = () => {
        if (!originalBackupUrl) return;
        setPreview(originalBackupUrl);
        onChange(originalBackupUrl);
        setIsCutout(false);
        toast.info('Se restauró la imagen original');
    };

    // Guardar cambios desde el modal de retoque
    const handleTouchUpSave = async (editedBlob: Blob) => {
        try {
            setIsUploading(true);
            const retouchedFile = blobToFile(editedBlob, 'retocado.png');
            const newUrl = await uploadFileToSupabase(retouchedFile);

            setPreview(newUrl);
            onChange(newUrl);
            setIsCutout(true);
            toast.success('Retoque aplicado y guardado');
        } catch (error) {
            console.error('Error guardando retoque:', error);
            toast.error('Error al guardar retoque');
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

    return (
        <div className="w-full space-y-3">
            {/* Barra de IA y Modos */}
            {enableBackgroundRemoval && (
                <div className="flex flex-col gap-2 p-2.5 bg-neutral-900/60 border border-white/5 rounded-2xl text-xs">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-300">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span className="font-medium">Quitar fondo con IA al subir</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoRemoveBg}
                                onChange={(e) => setAutoRemoveBg(e.target.checked)}
                                disabled={disabled || isUploading || isProcessingBg}
                                className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    {/* Selector de Modo Camisa Blanca / Fondo Claro */}
                    {autoRemoveBg && (
                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                            <span className="text-gray-400">¿La camisa es blanca o fondo claro?</span>
                            <button
                                type="button"
                                onClick={() => setIsWhiteShirt((prev) => !prev)}
                                className={`px-2.5 py-1 rounded-xl transition-all font-medium flex items-center gap-1.5 ${
                                    isWhiteShirt
                                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                        : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                                }`}
                                title="Optimiza el contraste de costuras para no borrar partes blancas"
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${isWhiteShirt ? 'bg-amber-400 animate-pulse' : 'bg-gray-500'}`} />
                                <span>{isWhiteShirt ? 'Modo Camisa Blanca: ON' : 'Modo Estándar'}</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Contenedor de Vista Previa / Carga */}
            <div
                className={`
                    relative w-full aspect-square rounded-2xl overflow-hidden border-2 transition-all
                    ${preview ? 'border-primary/40' : 'border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'}
                `}
                style={
                    preview
                        ? {
                              backgroundImage: `
                                  linear-gradient(45deg, #18181b 25%, transparent 25%),
                                  linear-gradient(-45deg, #18181b 25%, transparent 25%),
                                  linear-gradient(45deg, transparent 75%, #18181b 75%),
                                  linear-gradient(-45deg, transparent 75%, #18181b 75%)
                              `,
                              backgroundSize: '20px 20px',
                              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                              backgroundColor: '#09090b',
                          }
                        : undefined
                }
            >
                {/* 🖼️ PREVIEW ACTIVA */}
                {preview ? (
                    <div className="relative w-full h-full group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-contain p-3 drop-shadow-xl"
                        />

                        {/* Badge de estado sin fondo */}
                        {isCutout && (
                            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1 backdrop-blur-md">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>SIN FONDO</span>
                            </div>
                        )}

                        {/* Overlay de acciones */}
                        <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2.5 p-4 backdrop-blur-sm">
                            <div className="flex items-center gap-2">
                                {/* Botón Quitar Fondo Manual (si no se ha quitado o para reintentar) */}
                                {enableBackgroundRemoval && (
                                    <button
                                        type="button"
                                        onClick={handleManualRemoveBg}
                                        disabled={disabled || isProcessingBg || isUploading}
                                        className="p-2.5 bg-primary hover:bg-primary/90 rounded-xl text-white transition-all shadow-lg shadow-primary/30 flex items-center gap-1.5 text-xs font-bold"
                                        title="Recortar fondo con IA"
                                    >
                                        <Wand2 className="w-4 h-4" />
                                        <span>Quitar Fondo</span>
                                    </button>
                                )}

                                {/* Botón Retocar con pincel */}
                                {enableBackgroundRemoval && (
                                    <button
                                        type="button"
                                        onClick={() => setIsTouchUpOpen(true)}
                                        disabled={disabled || isProcessingBg || isUploading}
                                        className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors flex items-center gap-1.5 text-xs font-bold"
                                        title="Retocar con borrador / restaurador"
                                    >
                                        <Paintbrush className="w-4 h-4" />
                                        <span>Retocar</span>
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Restaurar original si existe */}
                                {originalBackupUrl && originalBackupUrl !== preview && (
                                    <button
                                        type="button"
                                        onClick={handleRestoreOriginal}
                                        disabled={disabled || isProcessingBg || isUploading}
                                        className="p-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-xl text-amber-300 transition-colors flex items-center gap-1 text-[11px] font-medium"
                                        title="Restaurar foto original con fondo"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>Original</span>
                                    </button>
                                )}

                                {/* Ver tamaño completo */}
                                <a
                                    href={preview}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-white/10 rounded-xl hover:bg-white/20 text-white transition-colors"
                                    title="Ver imagen original"
                                >
                                    <ImageIcon className="w-4 h-4" />
                                </a>

                                {/* Eliminar */}
                                <button
                                    type="button"
                                    onClick={handleRemove}
                                    disabled={disabled || isUploading || isProcessingBg}
                                    className="p-2 bg-red-500/80 rounded-xl hover:bg-red-500 text-white transition-colors"
                                    title="Eliminar imagen"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* 📥 UPLOAD STATE */
                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-6">
                        {isProcessingBg || isUploading ? (
                            <div className="flex flex-col items-center gap-3 text-center px-4">
                                <div className="relative">
                                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                    {isProcessingBg && (
                                        <Sparkles className="w-4 h-4 text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white uppercase tracking-wider">
                                        {isProcessingBg ? 'IA Removiendo Fondo...' : 'Subiendo imagen...'}
                                    </p>
                                    <p className="text-[11px] text-gray-400 mt-1 max-w-[200px]">
                                        {bgProgress?.message || 'Procesando archivo...'}
                                    </p>
                                    {bgProgress?.percent !== undefined && (
                                        <div className="w-36 h-1.5 bg-white/10 rounded-full overflow-hidden mt-2 mx-auto">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary to-amber-400 transition-all duration-300"
                                                style={{ width: `${bgProgress.percent}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3 text-gray-500 hover:text-white transition-colors">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-300">
                                        Subir Imagen
                                    </p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">
                                        Arrastra o haz clic para seleccionar
                                    </p>
                                </div>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/avif"
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={disabled || isUploading || isProcessingBg}
                        />
                    </label>
                )}

                {/* Banner flotante de procesamiento si ocurre mientras hay preview */}
                {isProcessingBg && preview && (
                    <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                        <p className="text-xs font-bold text-white">
                            {bgProgress?.message || 'Removiendo fondo con IA...'}
                        </p>
                        {bgProgress?.percent !== undefined && (
                            <div className="w-40 h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
                                <div
                                    className="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${bgProgress.percent}%` }}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Helper de formatos y estado */}
            <div className="flex flex-wrap justify-between items-center gap-2 text-[10px] text-gray-500 px-1">
                <p className="leading-tight">Formatos: JPG, PNG, WEBP, AVIF (Max 15MB)</p>
                {preview && (
                    <span className="text-emerald-400 font-bold uppercase flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Listo
                    </span>
                )}
            </div>

            {/* Modal de Retoque Manual */}
            <ImageTouchUpModal
                isOpen={isTouchUpOpen}
                originalSrc={originalBackupUrl || preview}
                currentCutoutSrc={preview}
                onSave={handleTouchUpSave}
                onClose={() => setIsTouchUpOpen(false)}
            />
        </div>
    );
}
