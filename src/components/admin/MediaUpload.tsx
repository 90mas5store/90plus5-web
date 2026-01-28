"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { createClient } from "@/lib/supabase/client";
import { Loader2, UploadCloud, X, Image as ImageIcon, Film } from "lucide-react";
import Image from "next/image";
import { toast } from "react-hot-toast";

interface MediaUploadProps {
    value?: string;
    type?: 'image' | 'video' | 'both';
    onChange: (url: string) => void;
    onRemove: () => void;
    className?: string;
    disabled?: boolean;
}

export default function MediaUpload({ value, onChange, onRemove, type = 'both', className = "", disabled = false }: MediaUploadProps) {
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        try {
            setLoading(true);
            const file = acceptedFiles[0];
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `banners/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('products') // Usamos el bucket de products o creamos uno de 'banners'? Por simplicidad products funciona si es público.
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(filePath);

            onChange(publicUrl);
        } catch (error) {
            toast.error('Error al subir archivo');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [onChange, supabase]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: type === 'video' ? { 'video/*': [] } : type === 'image' ? { 'image/*': [] } : { 'image/*': [], 'video/*': [] },
        maxFiles: 1,
        disabled: loading || disabled
    });

    if (value) {
        const isVideo = value.match(/\.(mp4|webm|mov)$/i);

        return (
            <div className={`relative w-full h-full min-h-[200px] rounded-xl overflow-hidden border border-white/10 group ${className}`}>
                {isVideo ? (
                    <video src={value} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                ) : (
                    <Image fill src={value} alt="Upload" className="object-cover" />
                )}

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                        type="button"
                        onClick={onRemove}
                        className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            {...getRootProps()}
            className={`
        border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all h-full min-h-[160px]
        ${isDragActive ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
        >
            <input {...getInputProps()} />
            {loading ? (
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            ) : (
                <>
                    <div className="bg-white/10 p-3 rounded-full mb-3 text-gray-400">
                        {type === 'video' ? <Film size={24} /> : <UploadCloud size={24} />}
                    </div>
                    <p className="text-sm font-bold text-gray-300">
                        {isDragActive ? "Sueltalo aquí" : "Clic o arrastra"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {type === 'image' ? "JPG, PNG, WEBP" : type === 'video' ? "MP4, WEBM" : "Imagen o Video"}
                    </p>
                </>
            )}
        </div>
    );
}
