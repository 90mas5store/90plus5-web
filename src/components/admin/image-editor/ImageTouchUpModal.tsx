'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
    Loader2,
    Sparkles,
    Expand,
    Shrink,
    AlertCircle,
    RefreshCw,
    Eye,
    Layers,
    ShieldCheck,
} from 'lucide-react';
import useToastMessage from '@/hooks/useToastMessage';
import {
    removeImageBackground,
    loadImageCorsSafe,
    isAbortError,
    solidifySilhouetteOnImageData,
    BackgroundRemovalProgress,
    SegmentationMode,
} from '@/lib/image/removeBackground';

export interface ImageTouchUpModalProps {
    isOpen: boolean;
    originalSrc: string;
    currentCutoutSrc: string;
    onSave: (editedBlob: Blob) => void | Promise<void>;
    onClose: () => void;
    autoRunRemoval?: boolean;
    defaultMode?: SegmentationMode;
}

type ToolMode = 'restore_direct' | 'eraser' | 'smart_restore';
type StageBackground = 'checker' | 'dark' | 'light';
type ViewMode = 'result' | 'original';

const MAX_HISTORY = 20;

/**
 * Distancia al cuadrado de un punto (px, py) al segmento (ax, ay) -> (bx, by).
 * Garantiza trazos continuos sin huecos en movimientos rápidos del pincel IA.
 */
function distToSegmentSq(
    px: number,
    py: number,
    ax: number,
    ay: number,
    bx: number,
    by: number
): number {
    const abx = bx - ax;
    const aby = by - ay;
    const lenSq = abx * abx + aby * aby;
    if (lenSq === 0) {
        const dx = px - ax;
        const dy = py - ay;
        return dx * dx + dy * dy;
    }
    const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / lenSq));
    const projX = ax + t * abx;
    const projY = ay + t * aby;
    const dx = px - projX;
    const dy = py - projY;
    return dx * dx + dy * dy;
}

export default function ImageTouchUpModal({
    isOpen,
    originalSrc,
    currentCutoutSrc,
    onSave,
    onClose,
    autoRunRemoval = false,
    defaultMode = 'standard',
}: ImageTouchUpModalProps) {
    const toast = useToastMessage();

    // Portal SSR safety
    const [mounted, setMounted] = useState(false);

    // Canvas refs
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const originalDisplayCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const stageRef = useRef<HTMLDivElement | null>(null);

    // Dimensions for crisp zoom without scroll clipping
    const [canvasDims, setCanvasDims] = useState<{ w: number; h: number }>({ w: 800, h: 800 });
    const [fitDims, setFitDims] = useState<{ w: number; h: number } | null>(null);

    // Studio state
    const [isReady, setIsReady] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('result');
    const [stageBg, setStageBg] = useState<StageBackground>('checker');
    const [segMode, setSegMode] = useState<SegmentationMode>(defaultMode);
    const [tool, setTool] = useState<ToolMode>('restore_direct');
    const [brushSize, setBrushSize] = useState<number>(36);
    const [zoom, setZoom] = useState<number>(1);

    // Async states
    const [isSaving, setIsSaving] = useState(false);
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [aiProgress, setAiProgress] = useState<BackgroundRemovalProgress | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // History state + synchronous refs to prevent stale closures in async AI runs
    const historyRef = useRef<ImageData[]>([]);
    const historyIndexRef = useRef<number>(-1);
    const [historyMeta, setHistoryMeta] = useState<{ length: number; index: number }>({
        length: 0,
        index: -1,
    });

    // Pointer / brush tracking
    const isDrawingRef = useRef(false);
    const activePointerIdRef = useRef<number | null>(null);
    const lastPosRef = useRef<{ x: number; y: number } | null>(null);
    const detectedBgColorRef = useRef<{ r: number; g: number; b: number }>({
        r: 245,
        g: 245,
        b: 245,
    });
    const detectedBgTolRef = useRef<number>(6);
    const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

    // Guard so autoRunRemoval runs at most once per modal open
    const hasAutoRunRef = useRef(false);
    const isMountedRef = useRef(true);
    const aiAbortControllerRef = useRef<AbortController | null>(null);

    const handleCancelAI = useCallback(() => {
        if (aiAbortControllerRef.current) {
            aiAbortControllerRef.current.abort();
            aiAbortControllerRef.current = null;
        }
    }, []);

    useEffect(() => {
        setMounted(true);
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            aiAbortControllerRef.current?.abort();
            aiAbortControllerRef.current = null;
        };
    }, []);

    // Lock body scroll while Studio modal is open
    useEffect(() => {
        if (!isOpen || typeof document === 'undefined') return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    // Reset transient modal state whenever opened/closed
    useEffect(() => {
        if (isOpen) {
            setSegMode(defaultMode);
            setViewMode('result');
            setErrorMessage(null);
            setZoom(1);
            hasAutoRunRef.current = false;
        } else {
            aiAbortControllerRef.current?.abort();
            aiAbortControllerRef.current = null;
            setIsProcessingAI(false);
            setAiProgress(null);
            setErrorMessage(null);
            setCursorPos(null);
            hasAutoRunRef.current = false;
        }
    }, [isOpen, defaultMode]);

    // Snapshot helper (ref-backed, always fresh even after async calls)
    const saveSnapshot = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || canvas.width === 0 || canvas.height === 0) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const sliced = historyRef.current.slice(0, historyIndexRef.current + 1);
        if (sliced.length >= MAX_HISTORY) {
            sliced.shift();
        }
        sliced.push(snapshot);
        historyRef.current = sliced;
        historyIndexRef.current = sliced.length - 1;
        setHistoryMeta({ length: sliced.length, index: sliced.length - 1 });
    }, []);

    // Undo
    const handleUndo = useCallback(() => {
        if (isProcessingAI || isSaving) return;
        if (historyIndexRef.current <= 0) return;
        const nextIndex = historyIndexRef.current - 1;
        const snapshot = historyRef.current[nextIndex];
        const canvas = canvasRef.current;
        if (!canvas || !snapshot) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        ctx.putImageData(snapshot, 0, 0);
        historyIndexRef.current = nextIndex;
        setHistoryMeta({ length: historyRef.current.length, index: nextIndex });
        setViewMode('result');
    }, [isProcessingAI, isSaving]);

    // Redo
    const handleRedo = useCallback(() => {
        if (isProcessingAI || isSaving) return;
        if (historyIndexRef.current >= historyRef.current.length - 1) return;
        const nextIndex = historyIndexRef.current + 1;
        const snapshot = historyRef.current[nextIndex];
        const canvas = canvasRef.current;
        if (!canvas || !snapshot) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        ctx.putImageData(snapshot, 0, 0);
        historyIndexRef.current = nextIndex;
        setHistoryMeta({ length: historyRef.current.length, index: nextIndex });
        setViewMode('result');
    }, [isProcessingAI, isSaving]);

    // Reset to state when modal opened
    const handleReset = useCallback(() => {
        if (isProcessingAI || isSaving) return;
        const first = historyRef.current[0];
        const canvas = canvasRef.current;
        if (!canvas || !first) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        ctx.putImageData(first, 0, 0);
        saveSnapshot();
        setViewMode('result');
    }, [isProcessingAI, isSaving, saveSnapshot]);

    // Restore full original photo onto working canvas
    const handleRestoreOriginalToCanvas = useCallback(() => {
        if (isProcessingAI || isSaving) return;
        const canvas = canvasRef.current;
        const offscreen = originalCanvasRef.current;
        if (!canvas || !offscreen) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(offscreen, 0, 0, canvas.width, canvas.height);
        saveSnapshot();
        setViewMode('result');
        toast.info('Imagen original restaurada en el lienzo');
    }, [isProcessingAI, isSaving, saveSnapshot, toast]);

    // Keyboard shortcuts: Esc, Ctrl/Cmd+Z, Ctrl+Y / Cmd+Shift+Z
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (!isSaving && !isProcessingAI) {
                    e.preventDefault();
                    onClose();
                }
                return;
            }

            const isMod = e.metaKey || e.ctrlKey;
            if (!isMod) return;

            const key = e.key.toLowerCase();
            if (key === 'z' && !e.shiftKey) {
                e.preventDefault();
                handleUndo();
            } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
                e.preventDefault();
                handleRedo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isSaving, isProcessingAI, onClose, handleUndo, handleRedo]);

    // Initialize canvases with CORS-safe image loading
    useEffect(() => {
        if (!isOpen || !mounted || !currentCutoutSrc) return;

        let cancelled = false;
        setIsReady(false);
        setErrorMessage(null);
        historyRef.current = [];
        historyIndexRef.current = -1;
        setHistoryMeta({ length: 0, index: -1 });

        const loadImages = async () => {
            let cutoutResult: { img: HTMLImageElement; cleanup: () => void } | null = null;
            let originalResult: { img: HTMLImageElement; cleanup: () => void } | null = null;

            try {
                cutoutResult = await loadImageCorsSafe(currentCutoutSrc);
                const resolvedOrigSrc = originalSrc || currentCutoutSrc;
                if (resolvedOrigSrc === currentCutoutSrc) {
                    originalResult = cutoutResult;
                } else {
                    try {
                        originalResult = await loadImageCorsSafe(resolvedOrigSrc);
                    } catch {
                        originalResult = cutoutResult;
                    }
                }

                if (cancelled) return;

                const canvas = canvasRef.current;
                if (!canvas) return;

                const cutoutImg = cutoutResult.img;
                const origImg = originalResult.img;

                const width = cutoutImg.naturalWidth || cutoutImg.width || 800;
                const height = cutoutImg.naturalHeight || cutoutImg.height || 800;

                canvas.width = width;
                canvas.height = height;
                setCanvasDims({ w: width, h: height });

                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) return;

                ctx.clearRect(0, 0, width, height);
                ctx.drawImage(cutoutImg, 0, 0, width, height);

                // Offscreen original canvas at exact working resolution
                const offscreen = document.createElement('canvas');
                offscreen.width = width;
                offscreen.height = height;
                const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
                if (offCtx) {
                    offCtx.clearRect(0, 0, width, height);
                    offCtx.drawImage(origImg, 0, 0, width, height);

                    // Sample full 4-border median + adaptive tolerance for Smart Brush
                    try {
                        const fullData = offCtx.getImageData(0, 0, width, height).data;
                        const sR: number[] = [];
                        const sG: number[] = [];
                        const sB: number[] = [];
                        const stepX = Math.max(1, Math.floor(width / 120));
                        const stepY = Math.max(1, Math.floor(height / 120));
                        const addPx = (px: number, py: number) => {
                            const idx = (py * width + px) * 4;
                            if (fullData[idx + 3] < 200) return;
                            sR.push(fullData[idx]);
                            sG.push(fullData[idx + 1]);
                            sB.push(fullData[idx + 2]);
                        };
                        for (let x = 0; x < width; x += stepX) {
                            addPx(x, 0);
                            addPx(x, height - 1);
                        }
                        for (let y = 0; y < height; y += stepY) {
                            addPx(0, y);
                            addPx(width - 1, y);
                        }
                        if (sR.length > 0) {
                            const mid = Math.floor(sR.length / 2);
                            const bgR = [...sR].sort((a, b) => a - b)[mid];
                            const bgG = [...sG].sort((a, b) => a - b)[mid];
                            const bgB = [...sB].sort((a, b) => a - b)[mid];
                            const dists = sR
                                .map((r, i) =>
                                    Math.max(
                                        Math.abs(r - bgR),
                                        Math.abs(sG[i] - bgG),
                                        Math.abs(sB[i] - bgB)
                                    )
                                )
                                .sort((a, b) => a - b);
                            const mad75 = dists[Math.floor(dists.length * 0.75)] ?? 2;
                            detectedBgColorRef.current = { r: bgR, g: bgG, b: bgB };
                            detectedBgTolRef.current = Math.max(
                                4,
                                Math.min(14, Math.round(mad75 * 2 + 4))
                            );
                        }
                    } catch {
                        detectedBgColorRef.current = { r: 245, g: 245, b: 245 };
                        detectedBgTolRef.current = 6;
                    }
                }
                originalCanvasRef.current = offscreen;

                // Mirror onto display canvas for instant zero-flicker Original comparison
                const origDisplay = originalDisplayCanvasRef.current;
                if (origDisplay) {
                    origDisplay.width = width;
                    origDisplay.height = height;
                    const dispCtx = origDisplay.getContext('2d');
                    if (dispCtx) {
                        dispCtx.clearRect(0, 0, width, height);
                        dispCtx.drawImage(offscreen, 0, 0, width, height);
                    }
                }

                // Store initial snapshot
                const initialSnapshot = ctx.getImageData(0, 0, width, height);
                historyRef.current = [initialSnapshot];
                historyIndexRef.current = 0;
                setHistoryMeta({ length: 1, index: 0 });
                setIsReady(true);
            } catch (err) {
                if (cancelled) return;
                console.error('[ImageTouchUpModal] Error cargando imágenes:', err);
                setErrorMessage(
                    err instanceof Error
                        ? err.message
                        : 'No se pudo cargar la imagen en el estudio.'
                );
                setIsReady(true);
            } finally {
                if (cutoutResult) cutoutResult.cleanup();
                if (originalResult && originalResult !== cutoutResult) {
                    originalResult.cleanup();
                }
            }
        };

        loadImages();

        return () => {
            cancelled = true;
        };
    }, [isOpen, mounted, currentCutoutSrc, originalSrc]);

    // Compute exact fit dimensions inside stage so zoom & scroll never clip top/left
    useEffect(() => {
        if (!isOpen || !mounted) return;
        const stageEl = stageRef.current;
        if (!stageEl) return;

        const computeFit = () => {
            const rect = stageEl.getBoundingClientRect();
            const padX = window.innerWidth < 640 ? 32 : 72;
            const padY = window.innerWidth < 640 ? 92 : 120;
            const availW = Math.max(160, rect.width - padX);
            const availH = Math.max(160, rect.height - padY);
            const aspect = canvasDims.w / Math.max(1, canvasDims.h);

            let w = availW;
            let h = w / aspect;
            if (h > availH) {
                h = availH;
                w = h * aspect;
            }
            setFitDims({ w: Math.round(w), h: Math.round(h) });
        };

        computeFit();
        const observer = new ResizeObserver(computeFit);
        observer.observe(stageEl);
        return () => observer.disconnect();
    }, [isOpen, mounted, canvasDims]);

    // Run AI background removal
    const handleRunAIRemoval = useCallback(
        async (modeOverride?: SegmentationMode) => {
            const sourceToProcess = originalSrc || currentCutoutSrc;
            if (!sourceToProcess || isProcessingAI) return;

            const activeMode = modeOverride ?? segMode;
            const controller = new AbortController();
            aiAbortControllerRef.current = controller;

            try {
                setIsProcessingAI(true);
                setErrorMessage(null);
                setAiProgress({
                    stage: 'loading',
                    percent: 5,
                    message:
                        activeMode === 'high_precision'
                            ? 'Iniciando BiRefNet HD (MIT)...'
                            : activeMode === 'white_shirt'
                              ? 'Iniciando recorte en modo Camisa Blanca...'
                              : 'Iniciando recorte automático con IA...',
                });

                const cutoutBlob = await removeImageBackground(sourceToProcess, {
                    mode: activeMode,
                    signal: controller.signal,
                    onProgress: (p) => {
                        if (isMountedRef.current && !controller.signal.aborted) {
                            setAiProgress(p);
                        }
                    },
                });

                if (!isMountedRef.current || controller.signal.aborted) return;

                const { img: resultImg, cleanup } = await loadImageCorsSafe(cutoutBlob);
                try {
                    const canvas = canvasRef.current;
                    if (canvas) {
                        const ctx = canvas.getContext('2d', { willReadFrequently: true });
                        if (ctx) {
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(resultImg, 0, 0, canvas.width, canvas.height);
                            saveSnapshot();
                            setViewMode('result');
                        }
                    }
                } finally {
                    cleanup();
                }

                toast.success(
                    activeMode === 'high_precision'
                        ? 'Recorte completado con BiRefNet HD'
                        : activeMode === 'white_shirt'
                          ? 'Recorte completado (Modo Camisa Blanca)'
                          : 'Fondo eliminado con IA'
                );
            } catch (err) {
                if (isAbortError(err)) {
                    if (isMountedRef.current) {
                        toast.info('Recorte con IA cancelado');
                    }
                    return;
                }
                console.error('[ImageTouchUpModal] Error en recorte IA:', err);
                const msg =
                    err instanceof Error
                        ? err.message
                        : 'No se pudo completar el recorte automático con IA.';
                if (isMountedRef.current) {
                    setErrorMessage(msg);
                    toast.error(msg);
                }
            } finally {
                if (aiAbortControllerRef.current === controller) {
                    aiAbortControllerRef.current = null;
                }
                if (isMountedRef.current) {
                    setIsProcessingAI(false);
                    setAiProgress(null);
                }
            }
        },
        [originalSrc, currentCutoutSrc, isProcessingAI, segMode, saveSnapshot, toast]
    );

    // Auto-run AI removal once when requested via autoRunRemoval prop
    useEffect(() => {
        if (isOpen && autoRunRemoval && isReady && !hasAutoRunRef.current && !errorMessage) {
            hasAutoRunRef.current = true;
            void handleRunAIRemoval(defaultMode);
        }
    }, [isOpen, autoRunRemoval, isReady, errorMessage, defaultMode, handleRunAIRemoval]);

    // Canvas coordinate & scale helpers
    const getCanvasScale = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return 1;
        const rect = canvas.getBoundingClientRect();
        return rect.width > 0 ? canvas.width / rect.width : 1;
    }, []);

    const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
        const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };

    // Brush stroke renderer
    const drawStroke = useCallback(
        (from: { x: number; y: number }, to: { x: number; y: number }) => {
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
            } else if (tool === 'smart_restore' && offscreen) {
                const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
                if (offCtx) {
                    const minX = Math.max(0, Math.floor(Math.min(from.x, to.x) - canvasBrushRadius));
                    const minY = Math.max(0, Math.floor(Math.min(from.y, to.y) - canvasBrushRadius));
                    const maxX = Math.min(
                        canvas.width,
                        Math.ceil(Math.max(from.x, to.x) + canvasBrushRadius)
                    );
                    const maxY = Math.min(
                        canvas.height,
                        Math.ceil(Math.max(from.y, to.y) + canvasBrushRadius)
                    );
                    const width = maxX - minX;
                    const height = maxY - minY;

                    if (width > 0 && height > 0) {
                        const targetData = ctx.getImageData(minX, minY, width, height);
                        const sourceData = offCtx.getImageData(minX, minY, width, height);
                        const bg = detectedBgColorRef.current;
                        const bgTol = detectedBgTolRef.current;
                        const bgLum = (bg.r + bg.g + bg.b) / 3;
                        const radiusSq = canvasBrushRadius * canvasBrushRadius;
                        const boxSize = width * height;

                        // Detectar si la prenda existente bajo el pincel es blanca/clara
                        let opaqueLumSum = 0;
                        let opaqueCount = 0;
                        const inBrush = new Uint8Array(boxSize);

                        for (let py = 0; py < height; py++) {
                            const curY = minY + py;
                            const row = py * width;
                            for (let px = 0; px < width; px++) {
                                const curX = minX + px;
                                if (
                                    distToSegmentSq(curX, curY, from.x, from.y, to.x, to.y) <=
                                    radiusSq
                                ) {
                                    const bi = row + px;
                                    inBrush[bi] = 1;
                                    const p = bi * 4;
                                    if (targetData.data[p + 3] >= 180) {
                                        opaqueLumSum +=
                                            (sourceData.data[p] +
                                                sourceData.data[p + 1] +
                                                sourceData.data[p + 2]) /
                                            3;
                                        opaqueCount++;
                                    }
                                }
                            }
                        }

                        const isRestoringLightFabric =
                            opaqueCount > 0 && opaqueLumSum / opaqueCount >= bgLum - 4;

                        // Clasificar cada píxel dentro del pincel: rechaza fondo plano y sombras grises proyectadas
                        const canRestore = new Uint8Array(boxSize);
                        for (let bi = 0; bi < boxSize; bi++) {
                            if (!inBrush[bi]) continue;
                            const p = bi * 4;
                            const r = sourceData.data[p];
                            const g = sourceData.data[p + 1];
                            const b = sourceData.data[p + 2];

                            const maxBgDiff = Math.max(
                                Math.abs(r - bg.r),
                                Math.abs(g - bg.g),
                                Math.abs(b - bg.b)
                            );
                            if (maxBgDiff <= bgTol) continue;

                            // Si estamos restaurando tela clara/blanca, ignorar sombras grises neutras más oscuras que el fondo
                            if (isRestoringLightFabric) {
                                const sat = Math.max(r, g, b) - Math.min(r, g, b);
                                const lum = (r + g + b) / 3;
                                if (sat <= 12 && lum <= bgLum - 1 && lum >= bgLum - 38) {
                                    continue;
                                }
                            }

                            canRestore[bi] = 1;
                        }

                        // Crecimiento conectado local (BFS) desde la tela ya opaca -> no salta sobre el fondo hacia sombras flotantes
                        const visited = new Uint8Array(boxSize);
                        const queue = new Int32Array(boxSize);
                        let qh = 0;
                        let qt = 0;

                        if (opaqueCount > 0) {
                            for (let bi = 0; bi < boxSize; bi++) {
                                if (inBrush[bi] && targetData.data[bi * 4 + 3] >= 180) {
                                    visited[bi] = 1;
                                    queue[qt++] = bi;
                                }
                            }
                        } else {
                            // Si el pincel está en una zona completamente transparente, sembrar desde el centro si es prenda válida
                            const cx = Math.max(0, Math.min(width - 1, Math.round(to.x - minX)));
                            const cy = Math.max(0, Math.min(height - 1, Math.round(to.y - minY)));
                            const centerIdx = cy * width + cx;
                            if (canRestore[centerIdx]) {
                                visited[centerIdx] = 1;
                                queue[qt++] = centerIdx;
                            }
                        }

                        while (qh < qt) {
                            const cur = queue[qh++];
                            const cx = cur % width;
                            const cy = (cur - cx) / width;

                            if (cx > 0) {
                                const ni = cur - 1;
                                if (!visited[ni] && canRestore[ni]) {
                                    visited[ni] = 1;
                                    queue[qt++] = ni;
                                }
                            }
                            if (cx < width - 1) {
                                const ni = cur + 1;
                                if (!visited[ni] && canRestore[ni]) {
                                    visited[ni] = 1;
                                    queue[qt++] = ni;
                                }
                            }
                            if (cy > 0) {
                                const ni = cur - width;
                                if (!visited[ni] && canRestore[ni]) {
                                    visited[ni] = 1;
                                    queue[qt++] = ni;
                                }
                            }
                            if (cy < height - 1) {
                                const ni = cur + width;
                                if (!visited[ni] && canRestore[ni]) {
                                    visited[ni] = 1;
                                    queue[qt++] = ni;
                                }
                            }
                        }

                        for (let bi = 0; bi < boxSize; bi++) {
                            if (visited[bi] && canRestore[bi]) {
                                const p = bi * 4;
                                targetData.data[p] = sourceData.data[p];
                                targetData.data[p + 1] = sourceData.data[p + 1];
                                targetData.data[p + 2] = sourceData.data[p + 2];
                                targetData.data[p + 3] = 255;
                            }
                        }

                        ctx.putImageData(targetData, minX, minY);
                    }
                }
            }

            ctx.restore();
        },
        [brushSize, tool, getCanvasScale]
    );

    // Edge expansion (+2px via 2 smooth 1px dilation passes)
    const handleExpandEdges = useCallback(() => {
        if (isProcessingAI || isSaving) return;
        const canvas = canvasRef.current;
        const offscreen = originalCanvasRef.current;
        if (!canvas || !offscreen) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
        if (!ctx || !offCtx) return;

        const w = canvas.width;
        const h = canvas.height;
        const sourceData = offCtx.getImageData(0, 0, w, h);
        let currentData = ctx.getImageData(0, 0, w, h);

        for (let pass = 0; pass < 2; pass++) {
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
            currentData = outputData;
        }

        ctx.putImageData(currentData, 0, 0);
        saveSnapshot();
        setViewMode('result');
    }, [isProcessingAI, isSaving, saveSnapshot]);

    // Edge contraction (-1px erosion to clean stray halos)
    const handleContractEdges = useCallback(() => {
        if (isProcessingAI || isSaving) return;
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
        setViewMode('result');
    }, [isProcessingAI, isSaving, saveSnapshot]);

    // Sellar interior: recupera toda la tela encerrada dentro de la silueta de la camisa
    const handleFillInterior = useCallback(() => {
        if (isProcessingAI || isSaving) return;
        const canvas = canvasRef.current;
        const offscreen = originalCanvasRef.current;
        if (!canvas || !offscreen) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
        if (!ctx || !offCtx) return;

        const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const origData = offCtx.getImageData(0, 0, canvas.width, canvas.height);
        const solidified = solidifySilhouetteOnImageData(origData, currentData, {
            alphaThreshold: 18,
            closingRadius: 3,
        });

        ctx.putImageData(solidified, 0, 0);
        saveSnapshot();
        setViewMode('result');
        toast.success('Tela interior sellada con opacidad sólida');
    }, [isProcessingAI, isSaving, saveSnapshot, toast]);

    // Pointer Events (mouse, trackpad, stylus, touch)
    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (viewMode !== 'result' || isProcessingAI || isSaving || !isReady) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        e.preventDefault();
        try {
            e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
            // Ignorar si el navegador no permite captura
        }
        activePointerIdRef.current = e.pointerId;
        isDrawingRef.current = true;

        if (e.pointerType !== 'touch') {
            setCursorPos({ x: e.clientX, y: e.clientY });
        } else {
            setCursorPos(null);
        }

        const pos = getCanvasCoords(e);
        lastPosRef.current = pos;
        drawStroke(pos, pos);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (e.pointerType !== 'touch' && viewMode === 'result' && !isProcessingAI) {
            setCursorPos({ x: e.clientX, y: e.clientY });
        } else if (e.pointerType === 'touch') {
            setCursorPos(null);
        }

        if (!isDrawingRef.current || activePointerIdRef.current !== e.pointerId) return;
        e.preventDefault();

        const currentPos = getCanvasCoords(e);
        if (lastPosRef.current) {
            drawStroke(lastPosRef.current, currentPos);
        }
        lastPosRef.current = currentPos;
    };

    const finishStroke = (e?: React.PointerEvent<HTMLCanvasElement>) => {
        if (e && activePointerIdRef.current !== null) {
            try {
                if (e.currentTarget.hasPointerCapture(activePointerIdRef.current)) {
                    e.currentTarget.releasePointerCapture(activePointerIdRef.current);
                }
            } catch {
                // Ignorar
            }
        }
        if (isDrawingRef.current) {
            isDrawingRef.current = false;
            activePointerIdRef.current = null;
            lastPosRef.current = null;
            saveSnapshot();
        }
    };

    const handlePointerLeave = () => {
        if (!isDrawingRef.current) {
            setCursorPos(null);
        }
    };

    // Export PNG blob & save
    const handleSave = async () => {
        const canvas = canvasRef.current;
        if (!canvas || isSaving || isProcessingAI) return;

        setIsSaving(true);
        try {
            const blob = await new Promise<Blob | null>((resolve) =>
                canvas.toBlob((b) => resolve(b), 'image/png', 1.0)
            );
            if (!blob) {
                throw new Error('No se pudo generar el archivo PNG final.');
            }
            await Promise.resolve(onSave(blob));
            onClose();
        } catch (err) {
            console.error('[ImageTouchUpModal] Error guardando imagen:', err);
            toast.error('No se pudo guardar el recorte. Inténtalo de nuevo.');
        } finally {
            if (isMountedRef.current) {
                setIsSaving(false);
            }
        }
    };

    if (!isOpen || !mounted || typeof document === 'undefined') return null;

    const canUndo = historyMeta.index > 0 && !isProcessingAI && !isSaving;
    const canRedo = historyMeta.index < historyMeta.length - 1 && !isProcessingAI && !isSaving;
    const canReset = historyMeta.length > 0 && !isProcessingAI && !isSaving;

    const stageStyle: React.CSSProperties =
        stageBg === 'checker'
            ? {
                  backgroundImage: `
                      linear-gradient(45deg, #14171f 25%, transparent 25%),
                      linear-gradient(-45deg, #14171f 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #14171f 75%),
                      linear-gradient(-45deg, transparent 75%, #14171f 75%)
                  `,
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                  backgroundColor: '#090b10',
              }
            : stageBg === 'dark'
              ? { backgroundColor: '#07080a' }
              : { backgroundColor: '#f4f4f5' };

    const visualDotSize = Math.max(8, Math.min(28, Math.round((brushSize / 140) * 26 + 6)));

    const modalContent = (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-3 md:p-5 bg-black/85 backdrop-blur-xl motion-reduce:backdrop-blur-none"
            role="dialog"
            aria-modal="true"
            aria-label="Estudio de Recorte IA"
        >
            {/* Contenedor Principal del Estudio */}
            <div className="relative w-full h-full sm:h-[94vh] sm:max-w-[1440px] bg-[#0a0c10]/95 backdrop-blur-2xl sm:border sm:border-white/[0.1] sm:rounded-3xl flex flex-col shadow-[0_24px_80px_rgba(0,0,0,0.85)] overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:pointer-events-none">
                {/* 1. TOP BAR */}
                <header className="px-3.5 sm:px-5 py-3 border-b border-white/[0.08] bg-[#0a0c10]/90 flex items-center justify-between gap-2 sm:gap-4 shrink-0">
                    {/* Brand / Title */}
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                            <Wand2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                                Estudio de Recorte IA
                            </h2>
                            <p className="hidden md:block text-[11px] text-neutral-400 truncate">
                                Recorte neuronal y retoque manual con precisión de píxel
                            </p>
                        </div>
                    </div>

                    {/* Center Segmented View Toggle: Resultado | Original */}
                    <div className="inline-flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.06] shrink-0">
                        <button
                            type="button"
                            onClick={() => setViewMode('result')}
                            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs transition-all active:scale-[0.98] ${
                                viewMode === 'result'
                                    ? 'bg-white text-black font-extrabold shadow-xs'
                                    : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold'
                            }`}
                        >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Resultado</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('original')}
                            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs transition-all active:scale-[0.98] ${
                                viewMode === 'original'
                                    ? 'bg-white text-black font-extrabold shadow-xs'
                                    : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold'
                            }`}
                        >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Original</span>
                        </button>
                    </div>

                    {/* Right History & Close Controls */}
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        <button
                            type="button"
                            onClick={handleUndo}
                            disabled={!canUndo}
                            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/10 active:scale-[0.96] text-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-white/[0.06]"
                            title="Deshacer (Ctrl+Z)"
                            aria-label="Deshacer"
                        >
                            <Undo2 className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleRedo}
                            disabled={!canRedo}
                            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/10 active:scale-[0.96] text-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-white/[0.06]"
                            title="Rehacer (Ctrl+Y)"
                            aria-label="Rehacer"
                        >
                            <Redo2 className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            disabled={!canReset}
                            className="hidden sm:flex p-2 rounded-xl bg-white/[0.04] hover:bg-white/10 active:scale-[0.96] text-neutral-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-white/[0.06]"
                            title="Restablecer al estado inicial"
                            aria-label="Restablecer"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>

                        <div className="w-px h-5 bg-white/[0.08] mx-0.5 sm:mx-1" />

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving || isProcessingAI}
                            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/10 active:scale-[0.96] text-neutral-300 hover:text-white disabled:opacity-30 transition-all border border-white/[0.06]"
                            title="Cerrar (Esc)"
                            aria-label="Cerrar estudio"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* 2. MAIN WORKSPACE (Two-Pane on Desktop, Canvas + Compact Dock on Mobile) */}
                <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
                    {/* CENTER CANVAS STAGE */}
                    <div
                        ref={stageRef}
                        className="relative flex-1 min-h-0 flex flex-col overflow-hidden"
                        style={stageStyle}
                    >
                        {/* Scrollable Centered Canvas Area */}
                        <div className="flex-1 min-h-0 overflow-auto flex p-4 sm:p-8 pb-20 sm:pb-24 select-none">
                            <div
                                className="m-auto relative rounded-xl overflow-hidden shadow-[0_12px_48px_rgba(0,0,0,0.45)] ring-1 ring-white/10 shrink-0"
                                style={
                                    fitDims
                                        ? {
                                              width: `${Math.round(fitDims.w * zoom)}px`,
                                              height: `${Math.round(fitDims.h * zoom)}px`,
                                          }
                                        : undefined
                                }
                            >
                                {/* Working Cutout Canvas */}
                                <canvas
                                    ref={canvasRef}
                                    onPointerDown={handlePointerDown}
                                    onPointerMove={handlePointerMove}
                                    onPointerUp={finishStroke}
                                    onPointerCancel={finishStroke}
                                    onPointerLeave={handlePointerLeave}
                                    className={`block w-full h-full touch-none ${
                                        viewMode === 'result' && !isProcessingAI
                                            ? 'cursor-crosshair'
                                            : 'cursor-default'
                                    } ${!fitDims ? 'max-h-[55vh] max-w-[85vw] object-contain' : ''}`}
                                />

                                {/* Pixel-aligned Original Comparison Overlay */}
                                <canvas
                                    ref={originalDisplayCanvasRef}
                                    className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-150 ${
                                        viewMode === 'original' ? 'opacity-100' : 'opacity-0'
                                    }`}
                                />

                                {/* Subtle View Mode Indicator when comparing Original */}
                                {viewMode === 'original' && (
                                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-[10px] font-bold uppercase tracking-wider text-white pointer-events-none">
                                        Vista Original (solo lectura)
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Loading / AI Processing Overlay */}
                        {(!isReady || isProcessingAI) && (
                            <div className="absolute inset-0 z-30 bg-[#07080a]/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                                <div className="w-full max-w-xs p-5 rounded-2xl bg-[#0a0c10]/95 border border-white/[0.1] shadow-2xl flex flex-col items-center gap-3.5">
                                    <div className="relative flex items-center justify-center">
                                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                        <Sparkles className="w-4 h-4 text-white absolute" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-extrabold uppercase tracking-wider text-white">
                                            {isProcessingAI
                                                ? 'Recortando con IA'
                                                : 'Preparando lienzo'}
                                        </p>
                                        <p className="text-xs text-neutral-400">
                                            {aiProgress?.message || 'Cargando imagen en alta calidad...'}
                                        </p>
                                    </div>
                                    {aiProgress && (
                                        <div className="w-full space-y-1.5">
                                            <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-primary to-red-400 rounded-full transition-all duration-300 ease-out"
                                                    style={{ width: `${aiProgress.percent}%` }}
                                                />
                                            </div>
                                            <p className="text-[11px] font-mono font-bold text-neutral-300 tabular-nums">
                                                {aiProgress.percent}%
                                            </p>
                                        </div>
                                    )}
                                    {isProcessingAI && (
                                        <button
                                            type="button"
                                            onClick={handleCancelAI}
                                            className="mt-1 px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] active:scale-[0.97] text-neutral-300 hover:text-white border border-white/[0.08] text-xs font-bold transition-all cursor-pointer"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Inline Error Banner */}
                        {errorMessage && !isProcessingAI && (
                            <div className="absolute top-3 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 max-w-lg w-auto">
                                <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-2xl bg-[#160b0d]/95 backdrop-blur-xl border border-red-500/30 shadow-2xl text-xs">
                                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-red-200 leading-snug">
                                            {errorMessage}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => void handleRunAIRemoval()}
                                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 active:scale-[0.97] text-red-200 font-bold border border-red-500/30 transition-all"
                                        >
                                            <RefreshCw className="w-3 h-3" />
                                            <span>Reintentar</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setErrorMessage(null)}
                                            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                                            aria-label="Descartar aviso"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Floating Bottom Stage Pill: Background Preview + Zoom */}
                        <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-20 max-w-[calc(100%-1.5rem)]">
                            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 rounded-2xl bg-[#0a0c10]/85 backdrop-blur-xl border border-white/[0.1] shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-x-auto">
                                {/* Stage Background Switcher */}
                                <div className="inline-flex items-center gap-0.5 bg-white/[0.04] p-0.5 rounded-xl border border-white/[0.06]">
                                    <button
                                        type="button"
                                        onClick={() => setStageBg('checker')}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] transition-all active:scale-[0.98] ${
                                            stageBg === 'checker'
                                                ? 'bg-white text-black font-extrabold'
                                                : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold'
                                        }`}
                                    >
                                        Cuadrícula
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStageBg('dark')}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] transition-all active:scale-[0.98] ${
                                            stageBg === 'dark'
                                                ? 'bg-white text-black font-extrabold'
                                                : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold'
                                        }`}
                                    >
                                        Oscuro
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStageBg('light')}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] transition-all active:scale-[0.98] ${
                                            stageBg === 'light'
                                                ? 'bg-white text-black font-extrabold'
                                                : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold'
                                        }`}
                                    >
                                        Claro
                                    </button>
                                </div>

                                <div className="w-px h-4 bg-white/[0.1] shrink-0" />

                                {/* Zoom Controls */}
                                <div className="inline-flex items-center gap-0.5">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))
                                        }
                                        className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 active:scale-[0.95] transition-all"
                                        title="Alejar"
                                        aria-label="Alejar"
                                    >
                                        <ZoomOut className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setZoom(1)}
                                        className="px-2 py-1 rounded-lg text-[11px] font-mono font-bold text-neutral-200 hover:text-white hover:bg-white/10 transition-colors tabular-nums min-w-[44px]"
                                        title="Restablecer zoom al 100%"
                                    >
                                        {Math.round(zoom * 100)}%
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))
                                        }
                                        className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 active:scale-[0.95] transition-all"
                                        title="Acercar"
                                        aria-label="Acercar"
                                    >
                                        <ZoomIn className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT CONTROL PANEL (Desktop Sidebar / Mobile Compact Scrollable Dock) */}
                    <aside className="w-full lg:w-72 xl:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-white/[0.08] bg-[#0a0c10]/95 overflow-y-auto max-h-[36vh] lg:max-h-none p-4 sm:p-5 space-y-5">
                        {/* SECTION 1: Recorte Automático IA */}
                        <section className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                                    1. Recorte Automático IA
                                </span>
                                <span className="w-2 h-2 rounded-full bg-primary" />
                            </div>

                            {/* Segmented Mode Selector */}
                            <div className="grid grid-cols-3 gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.06]">
                                <button
                                    type="button"
                                    onClick={() => setSegMode('standard')}
                                    disabled={isProcessingAI}
                                    className={`px-1.5 py-1.5 rounded-lg text-[11px] transition-all active:scale-[0.98] cursor-pointer ${
                                        segMode === 'standard'
                                            ? 'bg-white text-black font-extrabold shadow-xs'
                                            : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold'
                                    }`}
                                >
                                    Estándar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSegMode('white_shirt')}
                                    disabled={isProcessingAI}
                                    className={`px-1.5 py-1.5 rounded-lg text-[11px] transition-all active:scale-[0.98] cursor-pointer ${
                                        segMode === 'white_shirt'
                                            ? 'bg-white text-black font-extrabold shadow-xs'
                                            : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold'
                                    }`}
                                >
                                    Blanca
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSegMode('high_precision')}
                                    disabled={isProcessingAI}
                                    className={`px-1.5 py-1.5 rounded-lg text-[11px] transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1 ${
                                        segMode === 'high_precision'
                                            ? 'bg-white text-black font-extrabold shadow-xs'
                                            : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold'
                                    }`}
                                    title="BiRefNet-Lite / BEN2 (MIT, gratis) — máxima precisión en bordes difíciles"
                                >
                                    <Sparkles className="w-3 h-3 shrink-0" />
                                    <span>BiRefNet</span>
                                </button>
                            </div>

                            <p className="text-[11px] text-neutral-500 leading-relaxed">
                                {segMode === 'high_precision'
                                    ? 'BiRefNet-Lite (MIT, gratis): máxima precisión nivel estudio en cualquier fondo y camisas blancas. La 1.ª vez descarga y guarda el modelo en caché.'
                                    : segMode === 'white_shirt'
                                      ? 'Modo estudio + sellado sólido: recorta fondos blancos o gris claro en <1s manteniendo la camisa 100% blanca y opaca.'
                                      : 'Ideal para camisetas con color y contraste natural frente al fondo.'}
                            </p>

                            {/* Primary AI Trigger */}
                            <button
                                type="button"
                                onClick={() => void handleRunAIRemoval()}
                                disabled={isProcessingAI || isSaving || !isReady}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm transition-all shadow-[0_8px_24px_rgba(229,9,20,0.28)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isProcessingAI ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Wand2 className="w-4 h-4" />
                                )}
                                <span>
                                    {isProcessingAI ? 'Procesando IA...' : 'Quitar Fondo con IA'}
                                </span>
                            </button>

                            {/* Restore Original to Canvas */}
                            <button
                                type="button"
                                onClick={handleRestoreOriginalToCanvas}
                                disabled={isProcessingAI || isSaving || !isReady}
                                className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] text-neutral-300 hover:text-white border border-white/[0.08] text-xs font-semibold transition-all disabled:opacity-40"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Restaurar Original</span>
                            </button>
                        </section>

                        <div className="h-px bg-white/[0.06]" />

                        {/* SECTION 2: Retoque Manual (Pincel) */}
                        <section className="space-y-3.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                                    2. Retoque Manual
                                </span>
                                <span
                                    className={`w-2 h-2 rounded-full ${
                                        tool === 'restore_direct'
                                            ? 'bg-emerald-400'
                                            : tool === 'eraser'
                                              ? 'bg-red-400'
                                              : 'bg-amber-400'
                                    }`}
                                />
                            </div>

                            {/* 3 Clean Segmented Brush Buttons */}
                            <div className="grid grid-cols-3 gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.06]">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTool('restore_direct');
                                        setViewMode('result');
                                    }}
                                    className={`flex flex-col items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-[11px] transition-all active:scale-[0.98] ${
                                        tool === 'restore_direct'
                                            ? 'bg-white text-black font-extrabold shadow-xs'
                                            : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold'
                                    }`}
                                    title="Restaura tela libremente donde pintes"
                                >
                                    <Paintbrush className="w-3.5 h-3.5" />
                                    <span>Restaurar</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setTool('eraser');
                                        setViewMode('result');
                                    }}
                                    className={`flex flex-col items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-[11px] transition-all active:scale-[0.98] ${
                                        tool === 'eraser'
                                            ? 'bg-white text-black font-extrabold shadow-xs'
                                            : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold'
                                    }`}
                                    title="Borra fondo o imperfecciones"
                                >
                                    <Eraser className="w-3.5 h-3.5" />
                                    <span>Borrador</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setTool('smart_restore');
                                        setViewMode('result');
                                    }}
                                    className={`flex flex-col items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-[11px] transition-all active:scale-[0.98] ${
                                        tool === 'smart_restore'
                                            ? 'bg-white text-black font-extrabold shadow-xs'
                                            : 'text-neutral-300 hover:text-white hover:bg-white/5 font-semibold'
                                    }`}
                                    title="Restaura tela filtrando el color del fondo"
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Pincel IA</span>
                                </button>
                            </div>

                            {/* Brush Size Slider with Visual Dot */}
                            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] space-y-2.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-neutral-400 font-medium">
                                        Tamaño de pincel
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="rounded-full border border-white/40 transition-all"
                                            style={{
                                                width: `${visualDotSize}px`,
                                                height: `${visualDotSize}px`,
                                                backgroundColor:
                                                    tool === 'eraser'
                                                        ? 'rgba(239, 68, 68, 0.35)'
                                                        : tool === 'restore_direct'
                                                          ? 'rgba(16, 185, 129, 0.35)'
                                                          : 'rgba(245, 158, 11, 0.35)',
                                            }}
                                        />
                                        <span className="font-mono font-bold text-white tabular-nums min-w-[36px] text-right">
                                            {brushSize}px
                                        </span>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min={10}
                                    max={140}
                                    value={brushSize}
                                    onChange={(e) => setBrushSize(Number(e.target.value))}
                                    className="w-full accent-primary cursor-pointer"
                                    aria-label="Tamaño de pincel"
                                />
                            </div>

                            {/* Edge Refinement */}
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-semibold text-neutral-500">
                                    Refinar bordes
                                </span>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={handleExpandEdges}
                                        disabled={isProcessingAI || isSaving || !isReady}
                                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] active:scale-[0.98] text-neutral-200 hover:text-white border border-white/[0.08] text-xs font-semibold transition-all disabled:opacity-40"
                                        title="Expande el contorno 2px para recuperar tela"
                                    >
                                        <Expand className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>+ Tela (+2px)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleContractEdges}
                                        disabled={isProcessingAI || isSaving || !isReady}
                                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] active:scale-[0.98] text-neutral-200 hover:text-white border border-white/[0.08] text-xs font-semibold transition-all disabled:opacity-40"
                                        title="Contrae 1px el borde para eliminar halos"
                                    >
                                        <Shrink className="w-3.5 h-3.5 text-sky-400" />
                                        <span>- Pulir (-1px)</span>
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleFillInterior}
                                    disabled={isProcessingAI || isSaving || !isReady}
                                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-[0.98] text-emerald-300 border border-emerald-500/20 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                                    title="Rellena al 100% cualquier zona blanca que haya quedado semi-transparente dentro de la silueta"
                                >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>Sellar Tela Interior</span>
                                </button>
                            </div>
                        </section>
                    </aside>
                </div>

                {/* 3. BOTTOM FOOTER */}
                <footer className="px-4 sm:px-6 py-3 border-t border-white/[0.08] bg-[#0a0c10]/95 flex items-center justify-between gap-3 shrink-0">
                    {/* Desktop Active Tool Hint */}
                    <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400 min-w-0">
                        <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                                viewMode === 'original'
                                    ? 'bg-neutral-400'
                                    : tool === 'restore_direct'
                                      ? 'bg-emerald-400'
                                      : tool === 'eraser'
                                        ? 'bg-red-400'
                                        : 'bg-amber-400'
                            }`}
                        />
                        <span className="truncate">
                            {viewMode === 'original' &&
                                'Viendo imagen original. Cambia a Resultado para retocar con pincel.'}
                            {viewMode === 'result' &&
                                tool === 'restore_direct' &&
                                'Restaurar libre: pinta sobre cualquier zona para recuperar píxeles originales.'}
                            {viewMode === 'result' &&
                                tool === 'eraser' &&
                                'Borrador: desliza para volver transparente cualquier resto de fondo.'}
                            {viewMode === 'result' &&
                                tool === 'smart_restore' &&
                                'Pincel IA: recupera la prenda ignorando el color plano del fondo.'}
                        </span>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center gap-2.5 ml-auto w-full sm:w-auto justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving || isProcessingAI}
                            className="bg-white/5 hover:bg-white/10 active:scale-[0.98] text-neutral-300 hover:text-white border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all disabled:opacity-40"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleSave()}
                            disabled={isSaving || isProcessingAI || !isReady}
                            className="flex items-center justify-center gap-2 bg-white text-black font-extrabold hover:bg-neutral-200 active:scale-[0.98] rounded-xl px-5 py-2.5 text-xs sm:text-sm transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Check className="w-4 h-4" />
                            )}
                            <span>{isSaving ? 'Guardando...' : 'Aplicar y Guardar'}</span>
                        </button>
                    </div>
                </footer>
            </div>

            {/* Precision Floating Brush Cursor (Mouse / Stylus only) */}
            {cursorPos && viewMode === 'result' && !isProcessingAI && (
                <div
                    className="fixed pointer-events-none rounded-full border-2 z-[10000] -translate-x-1/2 -translate-y-1/2 shadow-md"
                    style={{
                        left: cursorPos.x,
                        top: cursorPos.y,
                        width: `${brushSize}px`,
                        height: `${brushSize}px`,
                        backgroundColor:
                            tool === 'eraser'
                                ? 'rgba(239, 68, 68, 0.2)'
                                : tool === 'restore_direct'
                                  ? 'rgba(16, 185, 129, 0.2)'
                                  : 'rgba(245, 158, 11, 0.2)',
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
    );

    return createPortal(modalContent, document.body);
}
