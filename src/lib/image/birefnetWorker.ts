/**
 * Motor de Alta Precisión (BiRefNet-Lite 512 — Licencia MIT, 100% comercial y gratuito).
 * Usa `studioludens/birefnet-lite-512` (re-exportación optimizada 512×512 de ZhengPeng7/BiRefNet_lite)
 * diseñada específicamente para navegadores, evitando el crash OOM (`std::bad_alloc`) de las versiones
 * 1024×1024 en WASM y el límite de 8 storage buffers de WebGPU en Chrome/Windows.
 */

import type { BackgroundRemovalProgress } from './removeBackground';

const TRANSFORMERS_CDN_URL =
    'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3/+esm';

let sharedBiRefNetWorker: Worker | null = null;
let sharedBiRefNetWorkerUrl: string | null = null;
let biRefNetJobCounter = 0;

function createAbortError(): Error {
    const err = new Error('Recorte con BiRefNet cancelado por el usuario.');
    err.name = 'AbortError';
    return err;
}

export function disposeBiRefNetWorker(): void {
    if (sharedBiRefNetWorker) {
        try {
            sharedBiRefNetWorker.terminate();
        } catch {
            // Ignorar
        }
        sharedBiRefNetWorker = null;
    }
    if (sharedBiRefNetWorkerUrl) {
        try {
            URL.revokeObjectURL(sharedBiRefNetWorkerUrl);
        } catch {
            // Ignorar
        }
        sharedBiRefNetWorkerUrl = null;
    }
}

function buildBiRefNetWorkerSource(): string {
    return `
if (typeof self.window === 'undefined') {
    self.window = self;
}

const TRANSFORMERS_URL = ${JSON.stringify(TRANSFORMERS_CDN_URL)};
let cachedTransformers = null;
let cachedSegmenter = null;
let cachedModelLabel = '';
let cacheCleaned = false;

// Limpia modelos 1024x1024 pesados previos de la Cache API para liberar cuota (evita QuotaExceededError)
async function pruneHeavyModelsFromCache() {
    if (cacheCleaned || typeof caches === 'undefined') return;
    cacheCleaned = true;
    try {
        const cache = await caches.open('transformers-cache');
        const keys = await cache.keys();
        for (const req of keys) {
            if (/BiRefNet_lite-ONNX|BEN2-ONNX/i.test(req.url)) {
                await cache.delete(req);
            }
        }
    } catch {
        // Ignorar si Cache API no está disponible
    }
}

// Modelos optimizados para navegador (MIT / uso comercial libre)
const CANDIDATES = [
    {
        task: 'background-removal',
        modelId: 'studioludens/birefnet-lite-512',
        label: 'BiRefNet-Lite 512 (MIT)',
        device: 'wasm',
        dtype: 'fp16',
    },
    {
        task: 'image-segmentation',
        modelId: 'studioludens/birefnet-lite-512',
        label: 'BiRefNet-Lite 512 (MIT)',
        device: 'wasm',
        dtype: 'fp16',
    },
    {
        task: 'background-removal',
        modelId: 'studioludens/birefnet-lite-512',
        label: 'BiRefNet-Lite 512 (MIT)',
        device: 'wasm',
        dtype: 'fp32',
    },
];

async function getTransformers() {
    if (!cachedTransformers) {
        await pruneHeavyModelsFromCache();
        cachedTransformers = await import(TRANSFORMERS_URL);
        if (cachedTransformers.env) {
            cachedTransformers.env.allowLocalModels = false;
            cachedTransformers.env.useBrowserCache = true;
            if (cachedTransformers.env.backends && cachedTransformers.env.backends.onnx) {
                cachedTransformers.env.backends.onnx.logLevel = 'error';
            }
        }
    }
    return cachedTransformers;
}

function makeProgressCallback(id, modelLabel) {
    return (info) => {
        if (!info) return;
        if (info.status === 'progress' || info.status === 'downloading') {
            const rawPct = typeof info.progress === 'number'
                ? info.progress
                : (info.total > 0 ? (info.loaded / info.total) * 100 : 0);
            const pct = Math.max(0, Math.min(100, Math.round(rawPct)));
            self.postMessage({
                id,
                type: 'progress',
                progress: {
                    stage: 'loading',
                    percent: Math.min(68, 14 + Math.round(pct * 0.54)),
                    message: 'Descargando ' + modelLabel + ' (' + pct + '%) — solo la 1.ª vez...',
                },
            });
        } else if (info.status === 'initiate') {
            self.postMessage({
                id,
                type: 'progress',
                progress: {
                    stage: 'loading',
                    percent: 16,
                    message: 'Preparando ' + modelLabel + '...',
                },
            });
        } else if (info.status === 'ready') {
            self.postMessage({
                id,
                type: 'progress',
                progress: {
                    stage: 'inference',
                    percent: 72,
                    message: 'Ejecutando ' + modelLabel + '...',
                },
            });
        }
    };
}

async function runWithCandidateFallback(id, rawInput) {
    const { pipeline } = await getTransformers();

    if (cachedSegmenter) {
        try {
            self.postMessage({
                id,
                type: 'progress',
                progress: {
                    stage: 'inference',
                    percent: 72,
                    message: 'Segmentando bordes con ' + cachedModelLabel + '...',
                },
            });
            return await cachedSegmenter(rawInput);
        } catch {
            cachedSegmenter = null;
            cachedModelLabel = '';
        }
    }

    let lastErr = null;
    for (let i = 0; i < CANDIDATES.length; i++) {
        const c = CANDIDATES[i];
        try {
            const seg = await pipeline(c.task, c.modelId, {
                device: c.device,
                dtype: c.dtype,
                progress_callback: makeProgressCallback(id, c.label),
            });

            self.postMessage({
                id,
                type: 'progress',
                progress: {
                    stage: 'inference',
                    percent: 76,
                    message: 'Segmentando bordes en alta precisión con ' + c.label + '...',
                },
            });

            const output = await seg(rawInput);
            cachedSegmenter = seg;
            cachedModelLabel = c.label;
            return output;
        } catch (err) {
            lastErr = err;
            cachedSegmenter = null;
            cachedModelLabel = '';
        }
    }

    throw lastErr || new Error('No se pudo ejecutar BiRefNet-Lite 512 en este navegador.');
}

async function rawImageOutputToPngBlob(rawInput, output) {
    const item = Array.isArray(output) ? output[0] : output;
    const candidate = item && item.mask ? item.mask : item;

    if (!candidate || !candidate.data || !candidate.width || !candidate.height) {
        throw new Error('La salida del modelo BiRefNet no contiene píxeles válidos.');
    }

    const w = rawInput.width;
    const h = rawInput.height;
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('No se pudo inicializar OffscreenCanvas en el Worker.');
    }

    if (candidate.channels === 4) {
        const resized = (candidate.width !== w || candidate.height !== h)
            ? await candidate.resize(w, h)
            : candidate;
        const imgData = new ImageData(new Uint8ClampedArray(resized.data), w, h);
        ctx.putImageData(imgData, 0, 0);
        return await canvas.convertToBlob({ type: 'image/png' });
    }

    const resizedMask = (candidate.width !== w || candidate.height !== h)
        ? await candidate.resize(w, h)
        : candidate;

    const rgbaInput = rawInput.channels === 4 ? rawInput : rawInput.rgba();
    const outPixels = new Uint8ClampedArray(w * h * 4);
    const inData = rgbaInput.data;
    const maskData = resizedMask.data;
    const maskCh = resizedMask.channels || 1;

    for (let i = 0; i < w * h; i++) {
        const p = i * 4;
        outPixels[p] = inData[p];
        outPixels[p + 1] = inData[p + 1];
        outPixels[p + 2] = inData[p + 2];
        outPixels[p + 3] = maskData[i * maskCh];
    }

    const imgData = new ImageData(outPixels, w, h);
    ctx.putImageData(imgData, 0, 0);
    return await canvas.convertToBlob({ type: 'image/png' });
}

self.onmessage = async (event) => {
    const { id, normalizedBlob } = event.data || {};
    try {
        self.postMessage({
            id,
            type: 'progress',
            progress: {
                stage: 'loading',
                percent: 10,
                message: 'Iniciando BiRefNet-Lite 512 (MIT) en segundo plano...',
            },
        });

        const { RawImage } = await getTransformers();
        const rawInput = await RawImage.fromBlob(normalizedBlob);
        const output = await runWithCandidateFallback(id, rawInput);

        self.postMessage({
            id,
            type: 'progress',
            progress: {
                stage: 'encoding',
                percent: 92,
                message: 'Generando recorte PNG transparente de alta precisión...',
            },
        });

        const blob = await rawImageOutputToPngBlob(rawInput, output);
        self.postMessage({ id, type: 'result', blob });
    } catch (err) {
        const message =
            err instanceof Error ? err.message : String(err || 'Error en Worker BiRefNet');
        self.postMessage({ id, type: 'error', message });
    }
};
`;
}

function getOrCreateBiRefNetWorker(): Worker {
    if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') {
        throw new Error(
            'Tu navegador no soporta Web Workers con OffscreenCanvas para BiRefNet HD.'
        );
    }

    if (sharedBiRefNetWorker) return sharedBiRefNetWorker;

    const source = buildBiRefNetWorkerSource();
    const blob = new Blob([source], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url, { type: 'module' });
    sharedBiRefNetWorker = worker;
    sharedBiRefNetWorkerUrl = url;
    return worker;
}

/**
 * Ejecuta recorte de fondo de alta precisión con BiRefNet-Lite 512 (licencia MIT)
 * dentro de un Web Worker dedicado sin congelar el hilo de UI.
 */
export function runBiRefNetRemoval(params: {
    normalizedBlob: Blob;
    onProgress?: (progress: BackgroundRemovalProgress) => void;
    signal?: AbortSignal;
}): Promise<Blob> {
    if (params.signal?.aborted) {
        return Promise.reject(createAbortError());
    }

    const worker = getOrCreateBiRefNetWorker();
    const jobId = ++biRefNetJobCounter;

    return new Promise<Blob>((resolve, reject) => {
        const cleanupListeners = () => {
            worker.removeEventListener('message', handleMessage);
            worker.removeEventListener('error', handleWorkerError);
            params.signal?.removeEventListener('abort', handleAbort);
        };

        const handleAbort = () => {
            cleanupListeners();
            disposeBiRefNetWorker();
            reject(createAbortError());
        };

        const handleWorkerError = (event: ErrorEvent) => {
            cleanupListeners();
            disposeBiRefNetWorker();
            reject(
                new Error(
                    event.message ||
                        'Error al ejecutar BiRefNet 512 en segundo plano. Intenta recargar o usar modo Blanca.'
                )
            );
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
                reject(new Error(data.message || 'Error al procesar con BiRefNet 512.'));
            }
        };

        worker.addEventListener('message', handleMessage);
        worker.addEventListener('error', handleWorkerError);
        params.signal?.addEventListener('abort', handleAbort, { once: true });

        worker.postMessage({
            id: jobId,
            normalizedBlob: params.normalizedBlob,
        });
    });
}
