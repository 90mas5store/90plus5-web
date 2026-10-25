'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    Eraser,
    Paintbrush,
    Wand2,
    Undo2,
    Redo2,
    RotateCcw,
    Check,
    X,
    ZoomIn,
    ZoomOut,
    Maximize2,
    Sliders,
    Loader2,
    Sparkles,
    Expand,
    Shrink,
    Shirt
} from 'lucide-react';
import { removeImageBackground } from '@/lib/image/removeBackground';

interface ImageTouchUpModalProps {
    isOpen: boolean;
    originalSrc: string;
    currentCutoutSrc: string;
    onSave: (editedBlob: Blob) => void;
    onClose: () => void;
}

type ToolMode = 'restore_direct' | 'smart_restore' | 'eraser';

export default function ImageTouchUpModal({
    isOpen,
    originalSrc,
    currentCutoutSrc,
    onSave,
    onClose,
}: ImageTouchUpModalProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [isReady, setIsReady] = useState(false);
    // Modo inicial: Restaurar Tela Directo (pinta libremente sin bloquear blancos)
    const [tool, setTool] = useState<ToolMode>('restore_direct');
    const [brushSize, setBrushSize] = useState<number>(36);
    const [zoom, setZoom] = useState<number>(1);
    const [isSaving, setIsSaving] = useState(false);
    const [isReSegmenting, setIsReSegmenting] = useState(false);
    const [reSegmentText, setReSegmentText] = useState('');

    // Color de fondo detectado
    const detectedBgColorRef = useRef<{ r: number; g: number; b: number }>({ r: 255, g: 255, b: 255 });

    // Historial para Deshacer / Rehacer
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);

    // Estado del puntero / dibujo
    const isDrawingRef = useRef(false);
    const lastPosRef = useRef<{ x: number; y: number } | null>(null);

    // Cursor flotante del pincel
    const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

    // Inicializar Canvas
    useEffect(() => {
        if (!isOpen || !currentCutoutSrc) return;

        setIsReady(false);
        setHistory([]);
        setHistoryIndex(-1);
        setZoom(1);

        const cutoutImg = new Image();
        cutoutImg.crossOrigin = 'anonymous';
        const originalImg = new Image();
        originalImg.crossOrigin = 'anonymous';

        let isMounted = true;

        Promise.all([
            new Promise<void>((resolve, reject) => {
                cutoutImg.onload = () => resolve();
                cutoutImg.onerror = reject;
                cutoutImg.src = currentCutoutSrc;
            }),
            new Promise<void>((resolve) => {
                originalImg.onload = () => resolve();
                originalImg.onerror = () => resolve();
                originalImg.src = originalSrc || currentCutoutSrc;
            }),
        ])
            .then(() => {
                if (!isMounted) return;
                const canvas = canvasRef.current;
                if (!canvas) return;

                const width = cutoutImg.naturalWidth || cutoutImg.width || 800;
                const height = cutoutImg.naturalHeight || cutoutImg.height || 800;

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) return;

                ctx.clearRect(0, 0, width, height);
                ctx.drawImage(cutoutImg, 0, 0, width, height);

                // Canvas oculto con la foto original a la misma escala exacta
                const offscreen = document.createElement('canvas');
                offscreen.width = width;
                offscreen.height = height;
                const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
                if (offCtx) {
                    offCtx.drawImage(originalImg, 0, 0, width, height);

                    // Detectar fondo en las esquinas
                    try {
                        const cornerSamples = [
                            offCtx.getImageData(0, 0, 1, 1).data,
                            offCtx.getImageData(Math.max(0, width - 1), 0, 1, 1).data,
                            offCtx.getImageData(0, Math.max(0, height - 1), 1, 1).data,
                            offCtx.getImageData(Math.max(0, width - 1), Math.max(0, height - 1), 1, 1).data,
                        ];
                        const avgR = Math.round(cornerSamples.reduce((acc, c) => acc + c[0], 0) / 4);
                        const avgG = Math.round(cornerSamples.reduce((acc, c) => acc + c[1], 0) / 4);
                        const avgB = Math.round(cornerSamples.reduce((acc, c) => acc + c[2], 0) / 4);
                        detectedBgColorRef.current = { r: avgR, g: avgG, b: avgB };
                    } catch {
                        detectedBgColorRef.current = { r: 245, g: 245, b: 245 };
                    }
                }
                originalCanvasRef.current = offscreen;

                // Guardar estado inicial en historial
                const initialSnapshot = ctx.getImageData(0, 0, width, height);
                setHistory([initialSnapshot]);
                setHistoryIndex(0);
                setIsReady(true);
            })
            .catch((err) => {
                console.error('Error cargando imágenes en editor:', err);
                setIsReady(true);
            });

        return () => {
            isMounted = false;
        };
    }, [isOpen, currentCutoutSrc, originalSrc]);

    // Guardar paso en el historial
    const saveSnapshot = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory((prev) => {
            const nextHistory = prev.slice(0, historyIndex + 1);
            if (nextHistory.length >= 15) {
                nextHistory.shift();
            }
            return [...nextHistory, snapshot];
        });
        setHistoryIndex((prev) => Math.min(prev + 1, 14));
    }, [historyIndex]);

    // Deshacer
    const handleUndo = () => {
        if (historyIndex <= 0) return;
        const nextIndex = historyIndex - 1;
        const snapshot = history[nextIndex];
        const canvas = canvasRef.current;
        if (!canvas || !snapshot) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.putImageData(snapshot, 0, 0);
        setHistoryIndex(nextIndex);
    };

    // Rehacer
    const handleRedo = () => {
        if (historyIndex >= history.length - 1) return;
        const nextIndex = historyIndex + 1;
        const snapshot = history[nextIndex];
        const canvas = canvasRef.current;
        if (!canvas || !snapshot) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.putImageData(snapshot, 0, 0);
        setHistoryIndex(nextIndex);
    };

    // Reiniciar
    const handleReset = () => {
        if (history.length === 0) return;
        const first = history[0];
        const canvas = canvasRef.current;
        if (!canvas || !first) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.putImageData(first, 0, 0);
        saveSnapshot();
    };

    // Escala del canvas en pantalla
    const getCanvasScale = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return 1;
        const rect = canvas.getBoundingClientRect();
        return rect.width > 0 ? canvas.width / rect.width : 1;
    }, []);

    // Convertir coordenadas del mouse
    const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };

    // Función de trazado del pincel
    const drawStroke = (from: { x: number; y: number }, to: { x: number; y: number }) => {
        const canvas = canvasRef.current;
        const offscreen = originalCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const scale = getCanvasScale();
        const canvasBrushRadius = (brushSize * scale) / 2;
        const canvasLineWidth = brushSize * scale;

        ctx.save();

        if (tool === 'eraser') {
            // 🧽 BORRADOR
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = 'rgba(0,0,0,1)';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
            ctx.lineWidth = canvasLineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            ctx.arc(from.x, from.y, canvasBrushRadius, 0, Math.PI * 2);
            ctx.fill();

            if (from.x !== to.x || from.y !== to.y) {
                ctx.beginPath();
                ctx.moveTo(from.x, from.y);
                ctx.lineTo(to.x, to.y);
                ctx.stroke();
            }
        } else if (tool === 'restore_direct') {
            // 🖌️ RESTAURAR TELA DIRECTO:
            // Restaura exactamente lo que pintes sin filtrar por color (ideal para camisas blancas o con blanco)
            ctx.globalCompositeOperation = 'source-over';
            if (offscreen) {
                const pattern = ctx.createPattern(offscreen, 'no-repeat');
                if (pattern) {
                    ctx.fillStyle = pattern;
                    ctx.strokeStyle = pattern;
                    ctx.lineWidth = canvasLineWidth;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';

                    ctx.beginPath();
                    ctx.arc(from.x, from.y, canvasBrushRadius, 0, Math.PI * 2);
                    ctx.fill();

                    if (from.x !== to.x || from.y !== to.y) {
                        ctx.beginPath();
                        ctx.moveTo(from.x, from.y);
                        ctx.lineTo(to.x, to.y);
                        ctx.stroke();
                    }
                }
            }
        } else if (tool === 'smart_restore') {
            // 🪄 PINCEL IA CON DETECCIÓN DE TEXTURA:
            // Permite restaurar partes blancas si tienen costura/sombra/relieve
            if (offscreen) {
                const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
                if (offCtx) {
                    const minX = Math.max(0, Math.floor(Math.min(from.x, to.x) - canvasBrushRadius));
                    const minY = Math.max(0, Math.floor(Math.min(from.y, to.y) - canvasBrushRadius));
                    const maxX = Math.min(canvas.width, Math.ceil(Math.max(from.x, to.x) + canvasBrushRadius));
                    const maxY = Math.min(canvas.height, Math.ceil(Math.max(from.y, to.y) + canvasBrushRadius));
                    const width = maxX - minX;
                    const height = maxY - minY;

                    if (width > 0 && height > 0) {
                        const targetData = ctx.getImageData(minX, minY, width, height);
                        const sourceData = offCtx.getImageData(minX, minY, width, height);
                        const bg = detectedBgColorRef.current;
                        const radiusSq = canvasBrushRadius * canvasBrushRadius;

                        for (let py = 0; py < height; py++) {
                            const curY = minY + py;
                            for (let px = 0; px < width; px++) {
                                const curX = minX + px;
                                const dx = curX - to.x;
                                const dy = curY - to.y;
                                if (dx * dx + dy * dy <= radiusSq) {
                                    const idx = (py * width + px) * 4;
                                    const r = sourceData.data[idx];
                                    const g = sourceData.data[idx + 1];
                                    const b = sourceData.data[idx + 2];

                                    // Calcular diferencia de color con el fondo
                                    const colorDist = Math.sqrt(
                                        Math.pow(r - bg.r, 2) +
                                        Math.pow(g - bg.g, 2) +
                                        Math.pow(b - bg.b, 2)
                                    );

                                    // Si no es exactamente el fondo plano (umbral bajo de 12 para permitir telas blancas con textura/sombra)
                                    if (colorDist >= 12) {
                                        targetData.data[idx] = r;
                                        targetData.data[idx + 1] = g;
                                        targetData.data[idx + 2] = b;
                                        targetData.data[idx + 3] = 255;
                                    }
                                }
                            }
                        }

                        ctx.putImageData(targetData, minX, minY);
                    }
                }
            }
        }

        ctx.restore();
    };

    // Re-ejecutar algoritmo con Modo Camisa Blanca
    const handleReSegmentWhiteShirt = async () => {
        if (!originalSrc || isReSegmenting) return;

        try {
            setIsReSegmenting(true);
            setReSegmentText('Iniciando IA en Modo Camisa Blanca...');

            const cutoutBlob = await removeImageBackground(originalSrc, {
                mode: 'white_shirt',
                onProgress: (p) => setReSegmentText(p.message),
            });

            // Cargar nuevo resultado en el canvas
            const newImg = new Image();
            newImg.crossOrigin = 'anonymous';
            const blobUrl = URL.createObjectURL(cutoutBlob);

            await new Promise<void>((resolve) => {
                newImg.onload = () => resolve();
                newImg.src = blobUrl;
            });

            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(newImg, 0, 0, canvas.width, canvas.height);
                    saveSnapshot();
                }
            }

            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error('Error al re-segmentar:', err);
        } finally {
            setIsReSegmenting(false);
            setReSegmentText('');
        }
    };

    // Acción rápida: Expandir bordes de tela (+2px)
    const handleExpandEdges = () => {
        const canvas = canvasRef.current;
        const offscreen = originalCanvasRef.current;
        if (!canvas || !offscreen) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
        if (!ctx || !offCtx) return;

        const w = canvas.width;
        const h = canvas.height;
        const currentData = ctx.getImageData(0, 0, w, h);
        const sourceData = offCtx.getImageData(0, 0, w, h);
        const outputData = ctx.createImageData(w, h);
        outputData.data.set(currentData.data);

        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const i = (y * w + x) * 4;
                if (currentData.data[i + 3] < 128) {
                    const hasOpaqueNeighbor =
                        currentData.data[((y - 1) * w + x) * 4 + 3] > 180 ||
                        currentData.data[((y + 1) * w + x) * 4 + 3] > 180 ||
                        currentData.data[(y * w + (x - 1)) * 4 + 3] > 180 ||
                        currentData.data[(y * w + (x + 1)) * 4 + 3] > 180;

                    if (hasOpaqueNeighbor) {
                        outputData.data[i] = sourceData.data[i];
                        outputData.data[i + 1] = sourceData.data[i + 1];
                        outputData.data[i + 2] = sourceData.data[i + 2];
                        outputData.data[i + 3] = 255;
                    }
                }
            }
        }

        ctx.putImageData(outputData, 0, 0);
        saveSnapshot();
    };

    // Acción rápida: Pulir bordes (-1px)
    const handleContractEdges = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        const currentData = ctx.getImageData(0, 0, w, h);
        const outputData = ctx.createImageData(w, h);
        outputData.data.set(currentData.data);

        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const i = (y * w + x) * 4;
                if (currentData.data[i + 3] > 128) {
                    const hasTransparentNeighbor =
                        currentData.data[((y - 1) * w + x) * 4 + 3] === 0 ||
                        currentData.data[((y + 1) * w + x) * 4 + 3] === 0 ||
                        currentData.data[(y * w + (x - 1)) * 4 + 3] === 0 ||
                        currentData.data[(y * w + (x + 1)) * 4 + 3] === 0;

                    if (hasTransparentNeighbor) {
                        outputData.data[i + 3] = 0;
                    }
                }
            }
        }

        ctx.putImageData(outputData, 0, 0);
        saveSnapshot();
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (e.button !== 0) return;
        isDrawingRef.current = true;
        const pos = getCanvasCoords(e);
        lastPosRef.current = pos;
        drawStroke(pos, pos);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setCursorPos({ x: e.clientX, y: e.clientY });
        if (!isDrawingRef.current) return;
        const currentPos = getCanvasCoords(e);
        if (lastPosRef.current) {
            drawStroke(lastPosRef.current, currentPos);
        }
        lastPosRef.current = currentPos;
    };

    const handleMouseUp = () => {
        if (isDrawingRef.current) {
            isDrawingRef.current = false;
            lastPosRef.current = null;
            saveSnapshot();
        }
    };

    const handleMouseLeave = () => {
        setCursorPos(null);
        if (isDrawingRef.current) {
            isDrawingRef.current = false;
            lastPosRef.current = null;
            saveSnapshot();
        }
    };

    // Guardar cambios
    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setIsSaving(true);
        canvas.toBlob(
            (blob) => {
                setIsSaving(false);
                if (blob) {
                    onSave(blob);
                    onClose();
                }
            },
            'image/png',
            1.0
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
            {/* Contenedor Modal */}
            <div className="relative w-full max-w-5xl h-[92vh] bg-neutral-950 border border-white/10 rounded-3xl flex flex-col shadow-2xl overflow-hidden">
                
                {/* 1. Header */}
                <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between gap-4 bg-neutral-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <Wand2 className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                                Retoque de Camisas y Detalles
                                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    Pincel Libre
                                </span>
                            </h3>
                            <p className="text-xs text-gray-400">
                                Con <strong className="text-emerald-400">Restaurar Tela</strong> puedes pintar cualquier parte blanca o clara sin que el sistema la bloquee.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                        title="Cerrar sin guardar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 2. Barra de herramientas */}
                <div className="px-5 py-3 border-b border-white/5 bg-neutral-900/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                    {/* Modos de Pincel */}
                    <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-white/10 rounded-2xl">
                        {/* 🖌️ Restaurar Tela Directo (Para camisas blancas o cualquier color) */}
                        <button
                            type="button"
                            onClick={() => setTool('restore_direct')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-medium transition-all ${
                                tool === 'restore_direct'
                                    ? 'bg-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/20'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                            title="Restaura la tela exactamente donde pintes (ideal para partes blancas, hombros, cuello o mangas)"
                        >
                            <Paintbrush className="w-3.5 h-3.5" />
                            <span>Restaurar Tela (Libre)</span>
                        </button>

                        {/* 🧽 Borrador */}
                        <button
                            type="button"
                            onClick={() => setTool('eraser')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-medium transition-all ${
                                tool === 'eraser'
                                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                            title="Vuelve transparente cualquier imperfección o fondo sobrante"
                        >
                            <Eraser className="w-3.5 h-3.5" />
                            <span>Borrador</span>
                        </button>

                        {/* 🪄 Pincel IA */}
                        <button
                            type="button"
                            onClick={() => setTool('smart_restore')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-medium transition-all ${
                                tool === 'smart_restore'
                                    ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/20'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                            title="Filtro anti-fondo automático para prendas con contraste"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Pincel con Filtro</span>
                        </button>
                    </div>

                    {/* Tamaño de Pincel */}
                    <div className="flex items-center gap-3 bg-black/40 border border-white/10 px-3.5 py-1.5 rounded-2xl">
                        <Sliders className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-400 text-[11px] whitespace-nowrap">Grosor: {brushSize}px</span>
                        <input
                            type="range"
                            min="10"
                            max="140"
                            value={brushSize}
                            onChange={(e) => setBrushSize(Number(e.target.value))}
                            className="w-24 sm:w-28 accent-primary cursor-pointer"
                        />
                    </div>

                    {/* Acciones Rápidas: Re-recorte Camisa Blanca & Bordes */}
                    <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 p-1 rounded-2xl">
                        <button
                            type="button"
                            onClick={handleReSegmentWhiteShirt}
                            disabled={isReSegmenting}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 transition-colors text-[11px] font-bold"
                            title="Re-ejecuta la IA con contraste de micro-sombras optimizado para prendas blancas sobre fondo claro"
                        >
                            {isReSegmenting ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <Shirt className="w-3 h-3" />
                            )}
                            <span>{isReSegmenting ? 'Procesando...' : 'IA Camisa Blanca'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleExpandEdges}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-amber-300 transition-colors text-[11px] font-medium"
                            title="Recupera 2px de tela en todos los bordes"
                        >
                            <Expand className="w-3 h-3" />
                            <span>+ Tela</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleContractEdges}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-300 transition-colors text-[11px] font-medium"
                            title="Pule 1px de borde para quitar halos"
                        >
                            <Shrink className="w-3 h-3" />
                            <span>- Pulir</span>
                        </button>
                    </div>

                    {/* Deshacer, Rehacer y Reset */}
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={handleUndo}
                            disabled={historyIndex <= 0}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Deshacer (Ctrl+Z)"
                        >
                            <Undo2 className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleRedo}
                            disabled={historyIndex >= history.length - 1}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Rehacer"
                        >
                            <Redo2 className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                            title="Reiniciar al corte original"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Zoom */}
                    <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-1 rounded-2xl">
                        <button
                            type="button"
                            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                            className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors"
                            title="Alejar"
                        >
                            <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[11px] font-mono text-gray-300 px-1">{Math.round(zoom * 100)}%</span>
                        <button
                            type="button"
                            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                            className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors"
                            title="Acercar"
                        >
                            <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setZoom(1)}
                            className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors"
                            title="Ajustar 100%"
                        >
                            <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* 3. Área de Lienzo (Canvas) */}
                <div
                    ref={containerRef}
                    className="flex-1 relative overflow-auto p-6 flex items-center justify-center select-none"
                    style={{
                        backgroundImage: `
                            linear-gradient(45deg, #18181b 25%, transparent 25%),
                            linear-gradient(-45deg, #18181b 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, #18181b 75%),
                            linear-gradient(-45deg, transparent 75%, #18181b 75%)
                        `,
                        backgroundSize: '24px 24px',
                        backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0px',
                        backgroundColor: '#09090b',
                    }}
                >
                    {(!isReady || isReSegmenting) && (
                        <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-white">
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                            <span className="text-xs font-bold uppercase tracking-wider">
                                {reSegmentText || 'Cargando lienzo de edición...'}
                            </span>
                        </div>
                    )}

                    <div
                        style={{
                            transform: `scale(${zoom})`,
                            transformOrigin: 'center center',
                            transition: 'transform 0.15s ease-out',
                        }}
                        className="relative shadow-2xl rounded-lg overflow-hidden border border-white/10"
                    >
                        <canvas
                            ref={canvasRef}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseLeave}
                            className="max-h-[62vh] max-w-[80vw] object-contain cursor-crosshair block"
                        />
                    </div>

                    {/* Cursor visual del pincel con tamaño exacto */}
                    {cursorPos && (
                        <div
                            className="fixed pointer-events-none rounded-full border-2 z-50 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 shadow-lg"
                            style={{
                                left: cursorPos.x,
                                top: cursorPos.y,
                                width: `${brushSize}px`,
                                height: `${brushSize}px`,
                                backgroundColor:
                                    tool === 'eraser'
                                        ? 'rgba(239, 68, 68, 0.25)'
                                        : tool === 'restore_direct'
                                        ? 'rgba(16, 185, 129, 0.25)'
                                        : 'rgba(245, 158, 11, 0.25)',
                                borderColor:
                                    tool === 'eraser'
                                        ? '#ef4444'
                                        : tool === 'restore_direct'
                                        ? '#10b981'
                                        : '#f59e0b',
                            }}
                        />
                    )}
                </div>

                {/* 4. Footer */}
                <div className="px-5 py-3.5 border-t border-white/5 bg-neutral-900/60 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>
                            {tool === 'restore_direct' && 'Modo Libre activo: Restaura inmediatamente cualquier zona (blanca, oscura o estampada) sin restricciones.'}
                            {tool === 'eraser' && 'Modo Borrador: Vuelve transparente cualquier imperfección.'}
                            {tool === 'smart_restore' && 'Modo Filtro: Restaura descartando el fondo cuando hay buen contraste.'}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving || !isReady}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-primary/20 disabled:opacity-50 cursor-pointer"
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Check className="w-4 h-4" />
                            )}
                            <span>Guardar Recorte</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
