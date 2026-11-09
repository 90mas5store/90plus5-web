'use client';

import React, { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Upload, X, Loader2, Image as ImageIcon, Shield, Link as LinkIcon } from 'lucide-react';
import useToastMessage from '@/hooks/useToastMessage';

interface LogoUploadProps {
    value?: string;
    onChange: (url: string) => void;
    disabled?: boolean;
    folder?: 'teams' | 'brands' | 'general';
    label?: string;
    description?: string;
}

export default function LogoUpload({
    value = '',
    onChange,
    disabled = false,
    folder = 'teams',
    label = 'Escudo Oficial',
    description = 'Sube un archivo PNG, SVG o pega una URL directa',
}: LogoUploadProps) {
    const supabase = createClient();
    const toast = useToastMessage();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isUploading, setIsUploading] = useState(false);
    const [urlInput, setUrlInput] = useState(value || '');

    // Sincronizar input si el valor externo cambia
    React.useEffect(() => {
        setUrlInput(value || '');
    }, [value]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validaciones: soporta PNG, SVG, WEBP, JPG, AVIF
        const isSupported =
            file.type.startsWith('image/') ||
            /\.(png|svg|webp|jpe?g|avif)$/i.test(file.name);

        if (!isSupported) {
            toast.error('Formato no soportado. Usa PNG, SVG, WEBP o JPG');
            return;
        }

        // Límite de tamaño: 5MB para logos es más que suficiente
        if (file.size > 5 * 1024 * 1024) {
            toast.error('El archivo es demasiado grande (máximo 5MB)');
            return;
        }

        setIsUploading(true);
        try {
            const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
            const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: file.type || 'image/png',
                });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('products')
                .getPublicUrl(fileName);

            onChange(data.publicUrl);
            setUrlInput(data.publicUrl);
            toast.success('Logo subido exitosamente');
        } catch (err: any) {
            console.error('Error subiendo logo:', err);
            toast.error(err?.message || 'Error al subir el logo');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newUrl = e.target.value;
        setUrlInput(newUrl);
        onChange(newUrl);
    };

    const handleClear = () => {
        onChange('');
        setUrlInput('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase text-zinc-300 tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    <span>{label}</span>
                </label>
                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        disabled={disabled}
                        className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                        <X className="w-3 h-3" /> Quitar
                    </button>
                )}
            </div>

            <div className="relative overflow-hidden bg-[#14151b] border border-white/[0.08] rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 shadow-inner">
                {/* Specular highlight */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

                {/* Previsualizador de Escudo */}
                <div
                    className="relative w-20 h-20 shrink-0 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden shadow-lg group"
                    style={{
                        backgroundImage: `
                            linear-gradient(45deg, #18181b 25%, transparent 25%),
                            linear-gradient(-45deg, #18181b 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, #18181b 75%),
                            linear-gradient(-45deg, transparent 75%, #18181b 75%)
                        `,
                        backgroundSize: '12px 12px',
                        backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
                        backgroundColor: '#0c0d12',
                    }}
                >
                    {value ? (
                        <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={value}
                                alt="Escudo preview"
                                className="w-full h-full object-contain p-2 drop-shadow-md transition-transform group-hover:scale-105"
                                onError={(e) => {
                                    // Si la URL falla, mostrar icono roto
                                    (e.target as HTMLElement).style.display = 'none';
                                }}
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors cursor-pointer"
                                    title="Cambiar escudo"
                                >
                                    <Upload className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-zinc-500 gap-1">
                            <ImageIcon className="w-6 h-6 stroke-1 text-zinc-600" />
                            <span className="text-[9px] uppercase font-bold tracking-wider">Vacío</span>
                        </div>
                    )}

                    {isUploading && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-1">
                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                            <span className="text-[9px] text-zinc-300 font-bold">Subiendo...</span>
                        </div>
                    )}
                </div>

                {/* Controles de Carga y URL */}
                <div className="flex-1 w-full space-y-2.5">
                    <div className="flex items-center gap-2">
                        {/* Input archivo oculto */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/svg+xml,image/webp,image/jpeg,image/avif"
                            onChange={handleFileSelect}
                            disabled={disabled || isUploading}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={disabled || isUploading}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/10 text-white transition-all cursor-pointer disabled:opacity-50"
                        >
                            <Upload className="w-3.5 h-3.5 text-primary" />
                            <span>{value ? 'Reemplazar Archivo' : 'Subir Archivo'}</span>
                        </button>
                        <span className="text-[11px] text-zinc-500">PNG transparente recomendado</span>
                    </div>

                    {/* Input URL directa */}
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                            <LinkIcon className="w-3.5 h-3.5" />
                        </div>
                        <input
                            type="url"
                            value={urlInput}
                            onChange={handleUrlChange}
                            placeholder="O pega una URL directa (https://...)"
                            disabled={disabled || isUploading}
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white placeholder-zinc-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-xs transition-all font-mono"
                        />
                    </div>

                    <p className="text-[10px] text-zinc-500">
                        {description}
                    </p>
                </div>
            </div>
        </div>
    );
}

