/**
 * Utilidad modular para eliminación de fondos con IA del lado del cliente.
 * - Ejecuta @imgly/background-removal (WebGPU / WebAssembly + ONNX) dentro de un
 *   Web Worker dedicado para no congelar nunca el hilo principal del navegador.
 * - En modo 'white_shirt' (Camisa Blanca) utiliza un motor híbrido:
 *   1. Si detecta fondo uniforme de estudio (blanco/gris claro/neutro), aplica recorte
 *      de precisión por contorno + limpieza de sombra proyectada y anti-aliasing en <100ms,
 *      preservando el 100% de la tela blanca sólida sin transparencias fantasma.
 *   2. Si el fondo es complejo o heterogéneo, ejecuta ISNet FP16 en el Web Worker y
 *      reconstruye el interior sólido mediante cierre de silueta + relleno desde bordes.
 * - En modo 'standard' también sella agujeros interiores para proteger franjas y logos blancos.
 */

import { runBiRefNetRemoval } from './birefnetWorker';

export interface BackgroundRemovalProgress {
    stage: 'loading' | 'inference' | 'encoding' | 'complete';
    percent: number;
    message: string;
}

export type SegmentationMode = 'standard' | 'white_shirt' | 'high_precision';

export interface RemoveBackgroundOptions {
    onProgress?: (progress: BackgroundRemovalProgress) => void;
    quality?: number; // 0.1 a 1.0 (defecto: 1.0 para máxima fidelidad)
    mode?: SegmentationMode; // 'white_shirt' optimizado para prendas blancas / claras
    signal?: AbortSignal; // Permite cancelar la operación y liberar el Worker al instante
}

interface ImglyBackgroundRemovalModule {
    removeBackground: (image: Blob | string, config?: Record<string, unknown>) => Promise<Blob>;
}

const IMGLY_CDN_URL = 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm';

// Caché de módulo para fallback en hilo principal
let cachedImglyModulePromise: Promise<ImglyBackgroundRemovalModule> | null = null;

// Worker persistente para mantener en caché los modelos ONNX entre recortes sin congelar la UI
let sharedWorker: Worker | null = null;
let sharedWorkerUrl: string | null = null;
let workerUnavailable = false;
let workerJobCounter = 0;

function createAbortError(): Error {
    const err = new Error('Recorte con IA cancelado por el usuario.');
    err.name = 'AbortError';
    return err;
}

export function isAbortError(err: unknown): boolean {
    return err instanceof Error && err.name === 'AbortError';
}

function disposeSharedWorker(): void {
    if (sharedWorker) {
        try {
            sharedWorker.terminate();
        } catch {
            // Ignorar
        }
        sharedWorker = null;
    }
    if (sharedWorkerUrl) {
        try {
            URL.revokeObjectURL(sharedWorkerUrl);
        } catch {
            // Ignorar
        }
        sharedWorkerUrl = null;
    }
}

/**
 * Código fuente del ES Module Web Worker dedicado.
 * Aísla toda la inferencia ONNX / WebAssembly / WebGPU fuera del hilo de interfaz.
 */
function buildWorkerSource(): string {
    return `
if (typeof self.window === 'undefined') {
    self.window = self;
}

const IMGLY_URL = ${JSON.stringify(IMGLY_CDN_URL)};
let cachedModule = null;
let cachedWebGPU = null;

async function getImgly() {
    if (!cachedModule) {
        cachedModule = await import(IMGLY_URL);
    }
    return cachedModule;
}

async function hasWebGPU() {
    if (cachedWebGPU !== null) return cachedWebGPU;
    try {
        if (!self.navigator || !self.navigator.gpu) {
            cachedWebGPU = false;
            return false;
        }
        const adapter = await self.navigator.gpu.requestAdapter();
        cachedWebGPU = Boolean(adapter);
        return cachedWebGPU;
    } catch {
        cachedWebGPU = false;
        return false;
    }
}

function createProgressHandler(id, mode) {
    return (key, current, total) => {
        const ratio = total > 0 ? Math.min(1, current / total) : 0;
        const percent = Math.round(ratio * 100);

        if (key.includes('fetch') || key.includes('download')) {
            self.postMessage({
                id,
                type: 'progress',
                progress: {
                    stage: 'loading',
                    percent: Math.min(60, 22 + Math.round(percent * 0.38)),
                    message: 'Descargando modelo de IA (' + percent + '%)...',
                },
            });
        } else if (key.includes('inference') || key.includes('decode') || key.includes('mask')) {
            self.postMessage({
                id,
                type: 'progress',
                progress: {
                    stage: 'inference',
                    percent: Math.min(88, 60 + Math.round(percent * 0.28)),
                    message:
                        mode === 'white_shirt'
                            ? 'Detectando silueta de prenda blanca con precisión...'
                            : 'Segmentando prenda y recortando fondo...',
                },
            });
        } else if (key.includes('encode')) {
            self.postMessage({
                id,
                type: 'progress',
                progress: {
                    stage: 'encoding',
                    percent: Math.min(94, 88 + Math.round(percent * 0.06)),
                    message: 'Preparando máscara transparente...',
                },
            });
        }
    };
}

async function runWithFallback(imgly, normalizedBlob, mode, quality, progress) {
    const useGpu = await hasWebGPU();

    // En modo camisa blanca priorizamos isnet_fp16 (mayor fidelidad en bordes blanco-sobre-claro).
    // En modo estándar en CPU usamos isnet_quint8 (2-3x más rápido).
    const attempts =
        mode === 'white_shirt'
            ? useGpu
                ? [
                      { device: 'gpu', model: 'isnet_fp16' },
                      { device: 'cpu', model: 'isnet_fp16' },
                      { device: 'cpu', model: 'isnet_quint8' },
                  ]
                : [
                      { device: 'cpu', model: 'isnet_fp16' },
                      { device: 'cpu', model: 'isnet_quint8' },
                      { device: 'cpu', model: 'isnet' },
                  ]
            : useGpu
              ? [
                    { device: 'gpu', model: 'isnet_fp16' },
                    { device: 'cpu', model: 'isnet_quint8' },
                    { device: 'cpu', model: 'isnet_fp16' },
                ]
              : [
                    { device: 'cpu', model: 'isnet_quint8' },
                    { device: 'cpu', model: 'isnet_fp16' },
                    { device: 'cpu', model: 'isnet' },
                ];

    let lastError = null;

    for (const attempt of attempts) {
        const config = {
            device: attempt.device,
            model: attempt.model,
            proxyToWorker: false,
            rescale: true,
            output: {
                format: 'image/png',
                quality,
            },
            progress,
        };

        try {
            return await imgly.removeBackground(normalizedBlob, config);
        } catch (err) {
            lastError = err;
            if (attempt.device === 'gpu') {
                cachedWebGPU = false;
            }
        }
    }

    throw lastError || new Error('No se pudo ejecutar el modelo de segmentación.');
}

self.onmessage = async (event) => {
    const { id, normalizedBlob, mode, quality } = event.data || {};
    try {
        self.postMessage({
            id,
            type: 'progress',
            progress: {
                stage: 'loading',
                percent: 16,
                message: 'Iniciando motor de IA en segundo plano...',
            },
        });

        const imgly = await getImgly();

        self.postMessage({
            id,
            type: 'progress',
            progress: {
                stage: 'loading',
                percent: 22,
                message:
                    mode === 'white_shirt'
                        ? 'Cargando modelo de alta precisión para tela blanca...'
                        : 'Preparando modelos de segmentación...',
            },
        });

        const progress = createProgressHandler(id, mode);
        const blob = await runWithFallback(imgly, normalizedBlob, mode, quality, progress);

        self.postMessage({ id, type: 'result', blob });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err || 'Error en Worker de IA');
        self.postMessage({ id, type: 'error', message });
    }
};
`;
}

function getOrCreateWorker(): Worker | null {
    if (
        workerUnavailable ||
        typeof Worker === 'undefined' ||
        typeof OffscreenCanvas === 'undefined'
    ) {
        return null;
    }

    if (sharedWorker) return sharedWorker;

    try {
        const source = buildWorkerSource();
        const blob = new Blob([source], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const worker = new Worker(url, { type: 'module' });
        sharedWorker = worker;
        sharedWorkerUrl = url;
        return worker;
    } catch (err) {
        console.warn('[removeBackground] No se pudo crear Web Worker, usando fallback:', err);
        workerUnavailable = true;
        disposeSharedWorker();
        return null;
    }
}

function runRemovalInWorker(params: {
    normalizedBlob: Blob;
    mode: SegmentationMode;
    quality: number;
    onProgress?: (progress: BackgroundRemovalProgress) => void;
    signal?: AbortSignal;
}): Promise<Blob> {
    const worker = getOrCreateWorker();
    if (!worker) {
        return Promise.reject(new Error('WORKER_UNAVAILABLE'));
    }

    if (params.signal?.aborted) {
        return Promise.reject(createAbortError());
    }

    const jobId = ++workerJobCounter;

    return new Promise<Blob>((resolve, reject) => {
        const cleanupListeners = () => {
            worker.removeEventListener('message', handleMessage);
            worker.removeEventListener('error', handleWorkerError);
            params.signal?.removeEventListener('abort', handleAbort);
        };

        const handleAbort = () => {
            cleanupListeners();
            disposeSharedWorker();
            reject(createAbortError());
        };

        const handleWorkerError = (event: ErrorEvent) => {
            cleanupListeners();
            disposeSharedWorker();
            workerUnavailable = true;
            reject(new Error(event.message || 'WORKER_RUNTIME_ERROR'));
        };

        const handleMessage = (event: MessageEvent) => {
            const data = event.data;
            if (!data || data.id !== jobId) return;

            if (data.type === 'progress' && data.progress) {
                params.onProgress?.(data.progress as BackgroundRemovalProgress);
            } else if (data.type === 'result' && data.blob) {
                cleanupListeners();
                resolve(data.blob as Blob);
            } else if (data.type === 'error') {
                cleanupListeners();
                reject(new Error(data.message || 'Error en el motor de IA'));
            }
        };

        worker.addEventListener('message', handleMessage);
        worker.addEventListener('error', handleWorkerError);
        params.signal?.addEventListener('abort', handleAbort, { once: true });

        worker.postMessage({
            id: jobId,
            normalizedBlob: params.normalizedBlob,
            mode: params.mode,
            quality: params.quality,
        });
    });
}

function loadImglyModule(): Promise<ImglyBackgroundRemovalModule> {
    if (!cachedImglyModulePromise) {
        const moduleUrl: string = IMGLY_CDN_URL;
        cachedImglyModulePromise = (
            import(/* webpackIgnore: true */ moduleUrl) as Promise<ImglyBackgroundRemovalModule>
        ).catch((err: unknown) => {
            cachedImglyModulePromise = null;
            throw err;
        });
    }
    return cachedImglyModulePromise;
}

async function detectMainThreadWebGPU(): Promise<boolean> {
    try {
        const nav = navigator as Navigator & {
            gpu?: { requestAdapter: () => Promise<unknown | null> };
        };
        if (!nav.gpu) return false;
        const adapter = await nav.gpu.requestAdapter();
        return Boolean(adapter);
    } catch {
        return false;
    }
}

/**
 * Carga un HTMLImageElement desde File, Blob o URL de forma segura frente a CORS.
 */
export async function loadImageCorsSafe(
    imageSource: File | Blob | string
): Promise<{ img: HTMLImageElement; cleanup: () => void }> {
    let objectUrl: string | null = null;

    const cleanup = () => {
        if (objectUrl) {
            try {
                URL.revokeObjectURL(objectUrl);
            } catch {
                // Ignorar
            }
            objectUrl = null;
        }
    };

    const loadFromSrc = (src: string, useCrossOrigin: boolean): Promise<HTMLImageElement> =>
        new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            if (useCrossOrigin) {
                img.crossOrigin = 'anonymous';
            }
            img.onload = () => resolve(img);
            img.onerror = () =>
                reject(
                    new Error(
                        'No se pudo cargar o decodificar la imagen. Verifica que el archivo no esté corrupto o bloqueado por CORS.'
                    )
                );
            img.src = src;
        });

    if (typeof imageSource === 'string') {
        if (/^https?:\/\//i.test(imageSource)) {
            try {
                const res = await fetch(imageSource, { mode: 'cors' });
                if (res.ok) {
                    const fetchedBlob = await res.blob();
                    objectUrl = URL.createObjectURL(fetchedBlob);
                    const img = await loadFromSrc(objectUrl, false);
                    return { img, cleanup };
                }
            } catch {
                cleanup();
            }
        }

        const img = await loadFromSrc(imageSource, true);
        return { img, cleanup };
    }

    objectUrl = URL.createObjectURL(imageSource);
    try {
        const img = await loadFromSrc(objectUrl, false);
        return { img, cleanup };
    } catch (err) {
        cleanup();
        throw err;
    }
}

interface NormalizedImage {
    blob: Blob;
    width: number;
    height: number;
    imageData: ImageData;
}

/**
 * Normaliza cualquier fuente de imagen a PNG estándar (máx. 1600px) y devuelve sus píxeles RGBA.
 */
async function normalizeImageSource(imageSource: File | Blob | string): Promise<NormalizedImage> {
    const { img, cleanup } = await loadImageCorsSafe(imageSource);

    try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        if (!width || !height) {
            throw new Error('La imagen no tiene dimensiones válidas.');
        }

        const MAX_DIM = 1600;
        let targetWidth = width;
        let targetHeight = height;

        if (width > MAX_DIM || height > MAX_DIM) {
            if (width >= height) {
                targetWidth = MAX_DIM;
                targetHeight = Math.max(1, Math.round((height * MAX_DIM) / width));
            } else {
                targetHeight = MAX_DIM;
                targetWidth = Math.max(1, Math.round((width * MAX_DIM) / height));
            }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
            throw new Error('No se pudo inicializar contexto 2D de canvas.');
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((b) => {
                if (b) resolve(b);
                else reject(new Error('Fallo al exportar imagen normalizada en formato PNG.'));
            }, 'image/png');
        });

        return { blob, width: targetWidth, height: targetHeight, imageData };
    } finally {
        cleanup();
    }
}

/**
 * Analiza el perímetro exterior de la imagen para detectar fondos uniformes de estudio
 * (típico en fotos oficiales de camisas blancas sobre gris claro o blanco).
 */
function analyzeStudioBorder(imageData: ImageData): {
    isUniformStudio: boolean;
    bgR: number;
    bgG: number;
    bgB: number;
    mad75: number;
} {
    const { data, width: w, height: h } = imageData;
    const samplesR: number[] = [];
    const samplesG: number[] = [];
    const samplesB: number[] = [];

    const stepX = Math.max(1, Math.floor(w / 180));
    const stepY = Math.max(1, Math.floor(h / 180));

    const pushPixel = (x: number, y: number) => {
        const p = (y * w + x) * 4;
        if (data[p + 3] < 200) return; // Ignorar píxeles ya transparentes
        samplesR.push(data[p]);
        samplesG.push(data[p + 1]);
        samplesB.push(data[p + 2]);
    };

    for (let x = 0; x < w; x += stepX) {
        pushPixel(x, 0);
        pushPixel(x, h - 1);
    }
    for (let y = 0; y < h; y += stepY) {
        pushPixel(0, y);
        pushPixel(w - 1, y);
    }

    if (samplesR.length < 24) {
        return { isUniformStudio: false, bgR: 255, bgG: 255, bgB: 255, mad75: 255 };
    }

    const sortedR = [...samplesR].sort((a, b) => a - b);
    const sortedG = [...samplesG].sort((a, b) => a - b);
    const sortedB = [...samplesB].sort((a, b) => a - b);
    const mid = Math.floor(samplesR.length / 2);
    const bgR = sortedR[mid];
    const bgG = sortedG[mid];
    const bgB = sortedB[mid];

    const dists = samplesR
        .map((r, i) =>
            Math.max(Math.abs(r - bgR), Math.abs(samplesG[i] - bgG), Math.abs(samplesB[i] - bgB))
        )
        .sort((a, b) => a - b);

    const mad75 = dists[Math.floor(dists.length * 0.75)];
    const matchingCount = dists.filter((d) => d <= Math.max(8, mad75 * 2 + 4)).length;
    const matchRatio = matchingCount / dists.length;

    return {
        isUniformStudio: mad75 <= 6 && matchRatio >= 0.78,
        bgR,
        bgG,
        bgB,
        mad75,
    };
}

/**
 * Recorte ultra-preciso para camisas blancas sobre fondo uniforme de estudio (ej. #e1e1e1, #f4f4f4, #ffffff).
 * Ejecuta flood-fill adaptativo desde los 4 bordes, limpia sombras proyectadas de 1-2px, elimina
 * artefactos JPEG en el borde y aplica anti-aliasing suave preservando 100% la tela blanca sólida.
 * Retorna null si el fondo no permite separación limpia (para derivar automáticamente a ISNet FP16).
 */
async function tryStudioWhiteShirtCutout(normalized: NormalizedImage): Promise<Blob | null> {
    const borderInfo = analyzeStudioBorder(normalized.imageData);
    if (!borderInfo.isUniformStudio) return null;

    const { data, width: w, height: h } = normalized.imageData;
    const { bgR, bgG, bgB, mad75 } = borderInfo;
    const n = w * h;

    // Tolerancia ajustada al ruido real del fondo (si es plano mad75=0..1 -> tol=3..5)
    const tol = Math.max(3, Math.min(12, Math.round(mad75 * 2 + 3)));

    const ext = new Uint8Array(n);
    const queue = new Int32Array(n);
    let head = 0;
    let tail = 0;

    const isBgLike = (idx: number): boolean => {
        const p = idx * 4;
        if (data[p + 3] < 20) return true;
        return (
            Math.abs(data[p] - bgR) <= tol &&
            Math.abs(data[p + 1] - bgG) <= tol &&
            Math.abs(data[p + 2] - bgB) <= tol
        );
    };

    const seed = (idx: number) => {
        if (!ext[idx] && isBgLike(idx)) {
            ext[idx] = 1;
            queue[tail++] = idx;
        }
    };

    for (let x = 0; x < w; x++) {
        seed(x);
        seed((h - 1) * w + x);
    }
    for (let y = 0; y < h; y++) {
        seed(y * w);
        seed(y * w + (w - 1));
    }

    while (head < tail) {
        const cur = queue[head++];
        const x = cur % w;
        const y = (cur - x) / w;

        if (x > 0) {
            const ni = cur - 1;
            if (!ext[ni] && isBgLike(ni)) {
                ext[ni] = 1;
                queue[tail++] = ni;
            }
        }
        if (x < w - 1) {
            const ni = cur + 1;
            if (!ext[ni] && isBgLike(ni)) {
                ext[ni] = 1;
                queue[tail++] = ni;
            }
        }
        if (y > 0) {
            const ni = cur - w;
            if (!ext[ni] && isBgLike(ni)) {
                ext[ni] = 1;
                queue[tail++] = ni;
            }
        }
        if (y < h - 1) {
            const ni = cur + w;
            if (!ext[ni] && isBgLike(ni)) {
                ext[ni] = 1;
                queue[tail++] = ni;
            }
        }
    }

    // Limpiar hasta 2px de sombra proyectada neutra (más oscura que el fondo) y halos JPEG en bordes oscuros
    const bgLum = (bgR + bgG + bgB) / 3;
    for (let pass = 0; pass < 2; pass++) {
        const toPeel: number[] = [];
        for (let y = 1; y < h - 1; y++) {
            const row = y * w;
            for (let x = 1; x < w - 1; x++) {
                const i = row + x;
                if (ext[i]) continue;
                if (!ext[i - 1] && !ext[i + 1] && !ext[i - w] && !ext[i + w]) continue;

                const p = i * 4;
                const r = data[p];
                const g = data[p + 1];
                const b = data[p + 2];
                const sat = Math.max(r, g, b) - Math.min(r, g, b);
                const lum = (r + g + b) / 3;

                // 1. Sombra gris neutra estrictamente más oscura que el fondo (nunca muerde tela blanca)
                const isShadow = sat <= 9 && lum <= bgLum - 2 && lum >= bgLum - 22;

                // 2. Halo JPEG pegado a un borde oscuro real (ej. franjas/puños azul marino)
                let isDarkRinging = false;
                if (!isShadow && sat <= 10 && Math.abs(lum - bgLum) <= 14) {
                    for (let dy = -2; dy <= 2 && !isDarkRinging; dy++) {
                        const ny = y + dy;
                        if (ny < 0 || ny >= h) continue;
                        const nr = ny * w;
                        for (let dx = -2; dx <= 2; dx++) {
                            const nx = x + dx;
                            if (nx < 0 || nx >= w) continue;
                            const np = (nr + nx) * 4;
                            if ((data[np] + data[np + 1] + data[np + 2]) / 3 < 115) {
                                isDarkRinging = true;
                                break;
                            }
                        }
                    }
                }

                if (isShadow || isDarkRinging) {
                    toPeel.push(i);
                }
            }
        }
        for (let k = 0; k < toPeel.length; k++) {
            ext[toPeel[k]] = 1;
        }
    }

    // Descartar fragmentos exteriores desconectados (ej. finas líneas de sombra flotantes debajo del dobladillo)
    const compVisited = new Uint8Array(n);
    const compQueue = new Int32Array(n);
    const components: { pixels: number[]; size: number }[] = [];
    for (let i = 0; i < n; i++) {
        if (ext[i] || compVisited[i]) continue;
        let ch = 0;
        let ct = 0;
        compVisited[i] = 1;
        compQueue[ct++] = i;
        const pixels: number[] = [];
        while (ch < ct) {
            const cur = compQueue[ch++];
            pixels.push(cur);
            const cx = cur % w;
            const cy = (cur - cx) / w;
            if (cx > 0 && !ext[cur - 1] && !compVisited[cur - 1]) {
                compVisited[cur - 1] = 1;
                compQueue[ct++] = cur - 1;
            }
            if (cx < w - 1 && !ext[cur + 1] && !compVisited[cur + 1]) {
                compVisited[cur + 1] = 1;
                compQueue[ct++] = cur + 1;
            }
            if (cy > 0 && !ext[cur - w] && !compVisited[cur - w]) {
                compVisited[cur - w] = 1;
                compQueue[ct++] = cur - w;
            }
            if (cy < h - 1 && !ext[cur + w] && !compVisited[cur + w]) {
                compVisited[cur + w] = 1;
                compQueue[ct++] = cur + w;
            }
        }
        components.push({ pixels, size: pixels.length });
    }
    if (components.length > 1) {
        let maxSize = 0;
        for (const c of components) {
            if (c.size > maxSize) maxSize = c.size;
        }
        const minKeepSize = Math.max(80, Math.floor(maxSize * 0.02));
        for (const c of components) {
            if (c.size < minKeepSize) {
                for (let k = 0; k < c.pixels.length; k++) {
                    ext[c.pixels[k]] = 1;
                }
            }
        }
    }

    // Validar que el recorte sea coherente (evitar si se filtró a toda la prenda o no borró nada)
    let fgCount = 0;
    for (let i = 0; i < n; i++) {
        if (!ext[i]) fgCount++;
    }
    const fgRatio = fgCount / n;
    if (fgRatio < 0.1 || fgRatio > 0.94) {
        return null;
    }

    // Suavizado de contorno estilo Photoshop: 3 pasadas de Gaussiana separable 5-tap [1,4,6,4,1]/16
    // + re-perfilado smoothstep [120..215] para eliminar dientes de sierra en diagonales (hombros/mangas)
    const maskA = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        maskA[i] = ext[i] ? 0 : 255;
    }
    const maskB = new Float32Array(n);
    const tmp = new Float32Array(n);

    const blurPass = (src: Float32Array, dst: Float32Array) => {
        for (let y = 0; y < h; y++) {
            const row = y * w;
            for (let x = 0; x < w; x++) {
                const xm2 = x >= 2 ? x - 2 : 0;
                const xm1 = x >= 1 ? x - 1 : 0;
                const xp1 = x + 1 < w ? x + 1 : w - 1;
                const xp2 = x + 2 < w ? x + 2 : w - 1;
                tmp[row + x] =
                    (src[row + xm2] +
                        4 * src[row + xm1] +
                        6 * src[row + x] +
                        4 * src[row + xp1] +
                        src[row + xp2]) *
                    0.0625;
            }
        }
        for (let y = 0; y < h; y++) {
            const ym2 = (y >= 2 ? y - 2 : 0) * w;
            const ym1 = (y >= 1 ? y - 1 : 0) * w;
            const y0 = y * w;
            const yp1 = (y + 1 < h ? y + 1 : h - 1) * w;
            const yp2 = (y + 2 < h ? y + 2 : h - 1) * w;
            for (let x = 0; x < w; x++) {
                dst[y0 + x] =
                    (tmp[ym2 + x] +
                        4 * tmp[ym1 + x] +
                        6 * tmp[y0 + x] +
                        4 * tmp[yp1 + x] +
                        tmp[yp2 + x]) *
                    0.0625;
            }
        }
    };

    blurPass(maskA, maskB);
    blurPass(maskB, maskA);
    blurPass(maskA, maskB);

    // Reconstruir imagen PNG final con interior 100% sólido + anti-aliasing sub-píxel en bordes
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const outData = ctx.createImageData(w, h);
    const out = outData.data;
    const low = 120;
    const high = 215;
    const invRange = 1 / (high - low);

    for (let i = 0; i < n; i++) {
        const p = i * 4;
        const m = maskB[i];
        if (m <= low) {
            out[p] = 0;
            out[p + 1] = 0;
            out[p + 2] = 0;
            out[p + 3] = 0;
        } else if (m >= high) {
            out[p] = data[p];
            out[p + 1] = data[p + 1];
            out[p + 2] = data[p + 2];
            out[p + 3] = 255;
        } else {
            const t = (m - low) * invRange;
            const smoothAlpha = t * t * (3 - 2 * t);
            out[p] = data[p];
            out[p + 1] = data[p + 1];
            out[p + 2] = data[p + 2];
            out[p + 3] = Math.round(smoothAlpha * 255);
        }
    }

    ctx.putImageData(outData, 0, 0);

    return await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
}

/**
 * Sella agujeros interiores semi-transparentes (ej. tela blanca, franjas o escudos claros)
 * sobre un recorte generado por la red neuronal, preservando el contorno exterior intacto.
 */
export function solidifySilhouetteOnImageData(
    origData: ImageData,
    cutoutData: ImageData,
    options: { alphaThreshold?: number; closingRadius?: number } = {}
): ImageData {
    const w = cutoutData.width;
    const h = cutoutData.height;
    const n = w * h;
    const thresh = options.alphaThreshold ?? 22;
    const radius = options.closingRadius ?? 2;

    const srcCut = cutoutData.data;
    const srcOrig = origData.data;

    // 1. Barrera inicial de píxeles con señal de prenda
    const rawBar = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
        if (srcCut[i * 4 + 3] >= thresh) {
            rawBar[i] = 1;
        }
    }

    // 2. Dilatación separable por `radius` para cerrar micro-cortes de 1-2px en bordes claros
    let dil: Uint8Array = rawBar;
    if (radius > 0) {
        const dilH = new Uint8Array(n);
        for (let y = 0; y < h; y++) {
            const row = y * w;
            let run = 0;
            for (let x = 0; x < w; x++) {
                if (rawBar[row + x]) run = radius + 1;
                if (run > 0) {
                    dilH[row + x] = 1;
                    run--;
                }
            }
            run = 0;
            for (let x = w - 1; x >= 0; x--) {
                if (rawBar[row + x]) run = radius + 1;
                if (run > 0) {
                    dilH[row + x] = 1;
                    run--;
                }
            }
        }
        const dilV = new Uint8Array(n);
        for (let x = 0; x < w; x++) {
            let run = 0;
            for (let y = 0; y < h; y++) {
                if (dilH[y * w + x]) run = radius + 1;
                if (run > 0) {
                    dilV[y * w + x] = 1;
                    run--;
                }
            }
            run = 0;
            for (let y = h - 1; y >= 0; y--) {
                if (dilH[y * w + x]) run = radius + 1;
                if (run > 0) {
                    dilV[y * w + x] = 1;
                    run--;
                }
            }
        }
        dil = dilV;
    }

    // 3. BFS desde los 4 bordes para identificar el fondo exterior real
    const ext = new Uint8Array(n);
    const queue = new Int32Array(n);
    let head = 0;
    let tail = 0;
    const push = (i: number) => {
        if (!ext[i] && !dil[i]) {
            ext[i] = 1;
            queue[tail++] = i;
        }
    };

    for (let x = 0; x < w; x++) {
        push(x);
        push((h - 1) * w + x);
    }
    for (let y = 0; y < h; y++) {
        push(y * w);
        push(y * w + (w - 1));
    }

    while (head < tail) {
        const cur = queue[head++];
        const x = cur % w;
        const y = (cur - x) / w;
        if (x > 0) push(cur - 1);
        if (x < w - 1) push(cur + 1);
        if (y > 0) push(cur - w);
        if (y < h - 1) push(cur + w);
    }

    // 4. Reclamamos el margen exterior de `radius` píxeles (sin invadir el interior encerrado)
    if (radius > 0) {
        let frontier: number[] = [];
        for (let i = 0; i < n; i++) {
            if (ext[i]) frontier.push(i);
        }
        for (let step = 0; step < radius; step++) {
            const next: number[] = [];
            for (let k = 0; k < frontier.length; k++) {
                const cur = frontier[k];
                const x = cur % w;
                const y = (cur - x) / w;
                if (x > 0 && !ext[cur - 1] && !rawBar[cur - 1]) {
                    ext[cur - 1] = 1;
                    next.push(cur - 1);
                }
                if (x < w - 1 && !ext[cur + 1] && !rawBar[cur + 1]) {
                    ext[cur + 1] = 1;
                    next.push(cur + 1);
                }
                if (y > 0 && !ext[cur - w] && !rawBar[cur - w]) {
                    ext[cur - w] = 1;
                    next.push(cur - w);
                }
                if (y < h - 1 && !ext[cur + w] && !rawBar[cur + w]) {
                    ext[cur + w] = 1;
                    next.push(cur + w);
                }
            }
            frontier = next;
        }
    }

    // 5. Reconstruir salida: interior sólido con RGB original, bordes suaves de la IA, exterior limpio
    const out = new ImageData(w, h);
    const dst = out.data;

    for (let y = 0; y < h; y++) {
        const row = y * w;
        for (let x = 0; x < w; x++) {
            const i = row + x;
            const p = i * 4;
            const aiAlpha = srcCut[p + 3];

            if (ext[i]) {
                if (aiAlpha < 14) {
                    dst[p] = 0;
                    dst[p + 1] = 0;
                    dst[p + 2] = 0;
                    dst[p + 3] = 0;
                } else {
                    dst[p] = srcOrig[p];
                    dst[p + 1] = srcOrig[p + 1];
                    dst[p + 2] = srcOrig[p + 2];
                    dst[p + 3] = aiAlpha;
                }
            } else {
                const nearExt =
                    (x > 0 && ext[i - 1]) ||
                    (x < w - 1 && ext[i + 1]) ||
                    (y > 0 && ext[i - w]) ||
                    (y < h - 1 && ext[i + w]);

                dst[p] = srcOrig[p];
                dst[p + 1] = srcOrig[p + 1];
                dst[p + 2] = srcOrig[p + 2];
                dst[p + 3] = nearExt ? Math.max(aiAlpha, aiAlpha >= 140 ? 255 : aiAlpha) : 255;
            }
        }
    }

    return out;
}

/**
 * Aplica solidificación de silueta sobre un Blob generado por la IA comparándolo con el original.
 */
async function postProcessAiCutout(
    normalized: NormalizedImage,
    aiBlob: Blob,
    mode: SegmentationMode
): Promise<Blob> {
    const { img, cleanup } = await loadImageCorsSafe(aiBlob);
    try {
        const canvas = document.createElement('canvas');
        canvas.width = normalized.width;
        canvas.height = normalized.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return aiBlob;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const aiData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const solidified = solidifySilhouetteOnImageData(normalized.imageData, aiData, {
            alphaThreshold: mode === 'white_shirt' ? 18 : 26,
            closingRadius: mode === 'white_shirt' ? 2 : 1,
        });

        ctx.putImageData(solidified, 0, 0);

        return await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b || aiBlob), 'image/png');
        });
    } finally {
        cleanup();
    }
}

function formatRemovalError(err: unknown): Error {
    if (isAbortError(err)) {
        return err as Error;
    }

    const rawMsg = err instanceof Error ? err.message : String(err ?? '');
    const lower = rawMsg.toLowerCase();

    if (lower.includes('content security policy') || lower.includes('csp') || lower.includes('wasm')) {
        return new Error(
            'El navegador bloqueó el motor WebAssembly de IA (CSP). Recarga la página e inténtalo de nuevo.'
        );
    }

    if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('load failed')) {
        return new Error(
            'No se pudieron descargar los modelos de IA. Verifica tu conexión a internet e inténtalo de nuevo.'
        );
    }

    return err instanceof Error ? err : new Error(rawMsg || 'Error inesperado al recortar el fondo.');
}

async function runRemovalOnMainThread(params: {
    normalizedBlob: Blob;
    mode: SegmentationMode;
    quality: number;
    onProgress?: (progress: BackgroundRemovalProgress) => void;
}): Promise<Blob> {
    const { normalizedBlob, mode, quality, onProgress } = params;

    onProgress?.({
        stage: 'loading',
        percent: 16,
        message: 'Iniciando motor de IA en el navegador...',
    });

    const imglyModule = await loadImglyModule();
    const { removeBackground } = imglyModule;
    const useGpu = await detectMainThreadWebGPU();

    onProgress?.({
        stage: 'loading',
        percent: 24,
        message:
            mode === 'white_shirt'
                ? 'Cargando modelo de alta precisión para tela blanca...'
                : 'Preparando modelos de segmentación...',
    });

    const baseConfig = {
        device: useGpu ? ('gpu' as const) : ('cpu' as const),
        model:
            mode === 'white_shirt' || useGpu
                ? ('isnet_fp16' as const)
                : ('isnet_quint8' as const),
        rescale: true,
        output: {
            format: 'image/png' as const,
            quality,
        },
        progress: (key: string, current: number, total: number) => {
            const ratio = total > 0 ? Math.min(1, current / total) : 0;
            const percent = Math.round(ratio * 100);

            if (key.includes('fetch') || key.includes('download')) {
                onProgress?.({
                    stage: 'loading',
                    percent: Math.min(60, 24 + Math.round(percent * 0.36)),
                    message: `Descargando modelo de IA (${percent}%)...`,
                });
            } else if (key.includes('inference') || key.includes('decode') || key.includes('mask')) {
                onProgress?.({
                    stage: 'inference',
                    percent: Math.min(88, 60 + Math.round(percent * 0.28)),
                    message:
                        mode === 'white_shirt'
                            ? 'Detectando silueta de prenda blanca con precisión...'
                            : 'Segmentando prenda y recortando fondo...',
                });
            } else if (key.includes('encode')) {
                onProgress?.({
                    stage: 'encoding',
                    percent: Math.min(94, 88 + Math.round(percent * 0.06)),
                    message: 'Preparando máscara transparente...',
                });
            }
        },
    };

    try {
        return await removeBackground(normalizedBlob, baseConfig);
    } catch (err) {
        console.warn('[removeBackground] Reintentando en CPU con isnet_fp16:', err);
        return await removeBackground(normalizedBlob, {
            ...baseConfig,
            device: 'cpu' as const,
            model: 'isnet_fp16' as const,
        });
    }
}

/**
 * Elimina el fondo de una imagen (File, Blob o URL) y retorna un Blob PNG transparente.
 */
export async function removeImageBackground(
    imageSource: File | Blob | string,
    options: RemoveBackgroundOptions = {}
): Promise<Blob> {
    if (typeof window === 'undefined') {
        throw new Error('removeImageBackground solo puede ejecutarse en el navegador (cliente).');
    }

    const { onProgress, quality = 1.0, mode = 'standard', signal } = options;

    try {
        if (signal?.aborted) throw createAbortError();

        onProgress?.({
            stage: 'loading',
            percent: 5,
            message: 'Optimizando imagen para recorte...',
        });

        await new Promise((r) => setTimeout(r, 0));

        const normalized = await normalizeImageSource(imageSource);
        if (signal?.aborted) throw createAbortError();

        // 🚀 RUTA ALTA PRECISIÓN (BiRefNet-Lite / BEN2 — MIT, WebGPU/WASM en Worker dedicado)
        if (mode === 'high_precision') {
            const biRefBlob = await runBiRefNetRemoval({
                normalizedBlob: normalized.blob,
                onProgress,
                signal,
            });
            if (signal?.aborted) throw createAbortError();

            onProgress?.({
                stage: 'encoding',
                percent: 96,
                message: 'Refinando interior y conservando bordes suaves...',
            });
            await new Promise((r) => setTimeout(r, 0));

            const finalBiRefBlob = await postProcessAiCutout(normalized, biRefBlob, 'standard');
            if (signal?.aborted) throw createAbortError();

            onProgress?.({
                stage: 'complete',
                percent: 100,
                message: '¡Recorte BiRefNet HD completado!',
            });
            return finalBiRefBlob;
        }

        // 🚀 RUTA RÁPIDA DE PRECISIÓN PARA CAMISAS BLANCAS EN FONDO DE ESTUDIO
        if (mode === 'white_shirt') {
            onProgress?.({
                stage: 'inference',
                percent: 40,
                message: 'Analizando fondo de estudio y contornos de tela blanca...',
            });
            await new Promise((r) => setTimeout(r, 0));

            const studioCutout = await tryStudioWhiteShirtCutout(normalized);
            if (signal?.aborted) throw createAbortError();

            if (studioCutout) {
                onProgress?.({
                    stage: 'complete',
                    percent: 100,
                    message: '¡Recorte de estudio completado!',
                });
                return studioCutout;
            }
        }

        // 🧠 RUTA IA (Web Worker dedicado -> 0 bloqueo en el hilo de UI)
        let aiBlob: Blob;

        try {
            aiBlob = await runRemovalInWorker({
                normalizedBlob: normalized.blob,
                mode,
                quality,
                onProgress,
                signal,
            });
        } catch (workerErr) {
            if (isAbortError(workerErr)) {
                throw workerErr;
            }
            const errMsg = workerErr instanceof Error ? workerErr.message : String(workerErr);
            const shouldFallbackToMain =
                errMsg === 'WORKER_UNAVAILABLE' ||
                errMsg === 'WORKER_RUNTIME_ERROR' ||
                /offscreencanvas|document is not defined|window is not defined/i.test(errMsg);

            if (!shouldFallbackToMain) {
                throw workerErr;
            }

            console.warn('[removeBackground] Worker no disponible, usando hilo principal:', errMsg);
            aiBlob = await runRemovalOnMainThread({
                normalizedBlob: normalized.blob,
                mode,
                quality,
                onProgress,
            });
        }

        if (signal?.aborted) throw createAbortError();

        // 🛡️ Post-procesado: sella zonas blancas interiores para evitar transparencias fantasma
        onProgress?.({
            stage: 'encoding',
            percent: 96,
            message: 'Sellando tela interior y refinando bordes...',
        });
        await new Promise((r) => setTimeout(r, 0));

        const finalBlob = await postProcessAiCutout(normalized, aiBlob, mode);
        if (signal?.aborted) throw createAbortError();

        onProgress?.({
            stage: 'complete',
            percent: 100,
            message: '¡Recorte completado!',
        });

        return finalBlob;
    } catch (err) {
        const formatted = formatRemovalError(err);
        if (!isAbortError(formatted)) {
            console.error('[removeImageBackground] Error:', err);
        }
        throw formatted;
    }
}

/**
 * Convierte un Blob o URL a un objeto File listo para subir a Supabase Storage.
 */
export function blobToFile(blob: Blob, originalFileName: string): File {
    const baseName = originalFileName.replace(/\.[^/.]+$/, '');
    const newFileName = `${baseName}-sin-fondo-${Date.now()}.png`;
    return new File([blob], newFileName, { type: 'image/png' });
}
