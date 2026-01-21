'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import useToastMessage from '@/hooks/useToastMessage';

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    disabled?: boolean;
}

export default function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState(value);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();
    const toast = useToastMessage();

    useEffect(() => {
        setPreview(value);
    }, [value]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validaciones
        if (!file.type.startsWith('image/')) {
            toast.error('Solo se permiten archivos de imagen');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error('La imagen no debe pesar más de 5MB');
            return;
        }

        try {
            setIsUploading(true);

            // 1. Nombre único para evitar colisiones
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            // 2. Subir a Supabase
            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 3. Obtener URL pública
            const { data } = supabase.storage
                .from('products')
                .getPublicUrl(filePath);

            // 4. Actualizar estado
            setPreview(data.publicUrl);
            onChange(data.publicUrl);
            toast.success('Imagen subida correctamente');

        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error('Error al subir la imagen');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Reset input
            }
        }
    };

    const handleRemove = () => {
        setPreview('');
        onChange('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="w-full space-y-4">
            <div className={`
                relative w-full aspect-square rounded-xl overflow-hidden border-2 border-dashed transition-all
                ${preview ? 'border-primary/50 bg-black' : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'}
            `}>

                {/* 🖼️ PREVIEW */}
                {preview ? (
                    <div className="relative w-full h-full group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-contain p-2"
                        />
                        {/* Overlay de acciones */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <a
                                href={preview}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors"
                                title="Ver imagen original"
                            >
                                <ImageIcon className="w-5 h-5" />
                            </a>
                            <button
                                type="button"
                                onClick={handleRemove}
                                disabled={disabled || isUploading}
                                className="p-2 bg-red-500/80 rounded-full hover:bg-red-500 text-white transition-colors"
                                title="Eliminar imagen"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ) : (
                    /* 📥 UPLOAD STATE */
                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-4">
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-2 text-primary">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <span className="text-xs font-bold uppercase tracking-widest">Subiendo...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3 text-gray-500 hover:text-white transition-colors">
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                    <Upload className="w-5 h-5" />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-bold uppercase tracking-wide">Subir Imagen</p>
                                </div>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={disabled || isUploading}
                        />
                    </label>
                )}
            </div>

            {/* Info Helper */}
            <div className="flex flex-wrap justify-between items-center gap-2 text-[10px] text-gray-500 px-1 mt-1">
                <p className="leading-tight">Formatos: JPG, PNG, WEBP (Max 5MB)</p>
                {preview && (
                    <span className="text-green-500 font-bold uppercase flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Imagen Cargada
                    </span>
                )}
            </div>
        </div>
    );
}
