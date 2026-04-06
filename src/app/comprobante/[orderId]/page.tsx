'use client';

import { useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from '@/lib/motion';
import { Upload, CheckCircle2, AlertCircle, ImageIcon, X, Loader2 } from 'lucide-react';
import Image from 'next/image';

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 10;

export default function ComprobantePage() {
    const params = useParams();
    const orderId = params.orderId as string;

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [state, setState] = useState<UploadState>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback((selected: File) => {
        if (!ALLOWED_TYPES.includes(selected.type)) {
            setErrorMsg('Formato no permitido. Usa JPG, PNG o WEBP.');
            return;
        }
        if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
            setErrorMsg(`La imagen no debe superar ${MAX_SIZE_MB} MB.`);
            return;
        }
        setErrorMsg('');
        setFile(selected);
        setPreview(URL.createObjectURL(selected));
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) handleFile(dropped);
    }, [handleFile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) handleFile(selected);
    };

    const handleRemove = () => {
        setFile(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async () => {
        if (!file) return;
        setState('uploading');
        setErrorMsg('');

        try {
            const formData = new FormData();
            formData.append('orderId', orderId);
            formData.append('file', file);

            const res = await fetch('/api/payments/proof', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Error desconocido');
            }

            setState('success');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al subir. Intenta de nuevo.';
            setErrorMsg(msg);
            setState('error');
        }
    };

    if (state === 'success') {
        return (
            <main className="min-h-dvh bg-black text-white flex items-center justify-center px-6 py-20">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full text-center space-y-6"
                >
                    <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center border-2 border-green-500 mx-auto">
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">
                        ¡Comprobante recibido!
                    </h1>
                    <p className="text-gray-400 text-base leading-relaxed">
                        Gracias, ya recibimos tu captura de pago.<br />
                        Vamos a verificarlo y te avisamos en menos de <strong className="text-white">24 horas</strong>.
                    </p>
                    <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-gray-400">
                        Pedido: <span className="font-black text-primary">#{orderId.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <a
                        href={`/rastreo?order=${orderId}`}
                        className="inline-block mt-4 bg-white text-black font-black uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors text-sm"
                    >
                        Seguir mi pedido
                    </a>
                </motion.div>
            </main>
        );
    }

    return (
        <main className="min-h-dvh bg-black text-white flex items-center justify-center px-6 py-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full space-y-8"
            >
                {/* Header */}
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 text-primary text-xs font-bold uppercase tracking-widest mb-5">
                        Pedido #{orderId.slice(0, 8).toUpperCase()}
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tight mb-3">
                        Sube tu comprobante
                    </h1>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Adjunta la captura o foto de tu transferencia bancaria para que podamos verificar tu pago.
                    </p>
                </div>

                {/* Drop Zone */}
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`
                        relative rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden
                        ${isDragging ? 'border-primary bg-primary/10' : preview ? 'border-white/20 bg-white/5' : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'}
                    `}
                    style={{ minHeight: '260px' }}
                >
                    <AnimatePresence mode="wait">
                        {preview ? (
                            <motion.div
                                key="preview"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="relative w-full h-64 group"
                            >
                                <Image
                                    src={preview}
                                    alt="Vista previa del comprobante"
                                    fill
                                    className="object-contain p-4"
                                    unoptimized
                                />
                                <button
                                    onClick={handleRemove}
                                    className="absolute top-3 right-3 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center hover:bg-red-500/80 transition-colors"
                                    aria-label="Eliminar imagen"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </motion.div>
                        ) : (
                            <motion.label
                                key="upload"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center gap-4 p-10 cursor-pointer w-full h-full absolute inset-0"
                                htmlFor="proof-file-input"
                            >
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center border transition-colors ${isDragging ? 'bg-primary/20 border-primary' : 'bg-white/5 border-white/10'}`}>
                                    {isDragging ? (
                                        <ImageIcon className="w-6 h-6 text-primary" />
                                    ) : (
                                        <Upload className="w-6 h-6 text-gray-400" />
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-white">
                                        {isDragging ? 'Suelta aquí' : 'Arrastra o haz clic para subir'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP · Máx. {MAX_SIZE_MB} MB</p>
                                </div>
                            </motion.label>
                        )}
                    </AnimatePresence>
                </div>

                <input
                    id="proof-file-input"
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleInputChange}
                />

                {/* Error */}
                {(errorMsg || state === 'error') && (
                    <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{errorMsg || 'Ocurrió un error. Intenta de nuevo.'}</span>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={!file || state === 'uploading'}
                    className="w-full bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all flex items-center justify-center gap-3 text-sm"
                >
                    {state === 'uploading' ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Subiendo...
                        </>
                    ) : (
                        <>
                            <Upload className="w-5 h-5" />
                            Enviar comprobante
                        </>
                    )}
                </button>

                <p className="text-center text-xs text-gray-600">
                    Tu imagen se guarda de forma segura y solo es visible para nuestro equipo.
                </p>
            </motion.div>
        </main>
    );
}
