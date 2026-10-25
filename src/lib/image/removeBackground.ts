/**
 * Utilidad modular para eliminación de fondos con IA del lado del cliente.
 * Utiliza @imgly/background-removal (WebAssembly + ONNX) dentro del navegador.
 * Seguro para SSR en Next.js gracias a carga dinámica diferida.
 */

export interface BackgroundRemovalProgress {
    stage: 'loading' | 'inference' | 'encoding' | 'complete';
    percent: number;
    message: string;
}

export type SegmentationMode = 'standard' | 'white_shirt';

export interface RemoveBackgroundOptions {
    onProgress?: (progress: BackgroundRemovalProgress) => void;
    quality?: number; // 0.1 a 1.0 (defecto: 1.0 para máxima fidelidad)
    mode?: SegmentationMode; // 'white_shirt' optimiza contraste para prendas blancas en fondo claro
}

/**
 * Pre-procesa una imagen para amplificar el contraste de costuras y sombras de telas blancas,
 * permitiendo que la red neuronal distinga la prenda blanca del fondo blanco plano.
 */
async function createContrastEnhancedBlob(imageSource: File | Blob | string): Promise<Blob> {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const objectUrl =
        typeof imageSource === 'string'
            ? imageSource
            : URL.createObjectURL(imageSource);

    await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = objectUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        if (typeof imageSource !== 'string') URL.revokeObjectURL(objectUrl);
        return typeof imageSource === 'string' ? (await fetch(imageSource)).blob() : imageSource;
    }

    // Dibujar original
    ctx.drawImage(img, 0, 0);

    // Aplicar filtro de contraste y curvas para acentuar pliegues y sombras de la tela
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;

    // Contraste dinámico: expande sombras leves de la tela para que no parezcan fondo blanco
    for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        const brightness = (r + g + b) / 3;

        // Si es muy blanco pero no 100% puro (típico de tela blanca con relieve/sombra)
        // oscurecemos ligeramente los tonos medios para que la IA detecte los bordes
        if (brightness < 252 && brightness > 140) {
            d[i] = Math.max(0, r - 30);
            d[i + 1] = Math.max(0, g - 30);
            d[i + 2] = Math.max(0, b - 30);
        }
    }

    ctx.putImageData(imgData, 0, 0);

    if (typeof imageSource !== 'string') URL.revokeObjectURL(objectUrl);

    return new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob || (imageSource as Blob)), 'image/png');
    });
}

/**
 * Elimina el fondo de una imagen (File, Blob o URL) y retorna un Blob PNG transparente.
 * Preserva 100% de los píxeles originales de la prenda/objeto (solo altera canal alfa).
 */
export async function removeImageBackground(
    imageSource: File | Blob | string,
    options: RemoveBackgroundOptions = {}
): Promise<Blob> {
    if (typeof window === 'undefined') {
        throw new Error('removeImageBackground solo puede ejecutarse en el navegador (cliente).');
    }

    const { onProgress, quality = 1.0, mode = 'standard' } = options;

    onProgress?.({
        stage: 'loading',
        percent: 10,
        message: 'Iniciando IA en el navegador...',
    });

    // Carga dinámica nativa vía CDN ESM para aislar WebAssembly y modelos ONNX del empaquetador Next.js/Webpack,
    // garantizando compatibilidad total con 'import.meta' y reduciendo el bundle de producción
    const imglyModule = await (new Function(
        'return import("https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm")'
    )() as Promise<{
        removeBackground: (image: any, config?: any) => Promise<Blob>;
        alphamask: (image: any, config?: any) => Promise<Blob>;
        applySegmentationMask: (image: any, mask: any, config?: any) => Promise<Blob>;
    }>);

    const { removeBackground, alphamask, applySegmentationMask } = imglyModule;

    onProgress?.({
        stage: 'loading',
        percent: 25,
        message: mode === 'white_shirt' ? 'Optimizando contraste para camisa blanca...' : 'Preparando modelos de segmentación...',
    });

    const config = {
        model: 'isnet_fp16' as const,
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
                    percent: Math.min(60, 25 + Math.round(percent * 0.35)),
                    message: `Cargando recursos de IA (${percent}%)...`,
                });
            } else if (key.includes('inference') || key.includes('decode') || key.includes('mask')) {
                onProgress?.({
                    stage: 'inference',
                    percent: Math.min(90, 60 + Math.round(percent * 0.3)),
                    message: mode === 'white_shirt' ? 'Detectando silueta y bordes de tela clara...' : 'Segmentando camisa y recortando fondo...',
                });
            } else if (key.includes('encode')) {
                onProgress?.({
                    stage: 'encoding',
                    percent: Math.min(99, 90 + Math.round(percent * 0.09)),
                    message: 'Generando imagen PNG transparente...',
                });
            }
        },
    };

    let resultBlob: Blob;

    if (mode === 'white_shirt') {
        try {
            // 1. Crear versión con contraste de micro-sombras acentuadas
            const enhancedBlob = await createContrastEnhancedBlob(imageSource);
            // 2. Extraer máscara de segmentación sobre la imagen acentuada
            const maskBlob = await alphamask(enhancedBlob, config);
            // 3. Aplicar la máscara sobre la imagen ORIGINAL intacta a resolución completa
            resultBlob = await applySegmentationMask(imageSource, maskBlob, config);
        } catch (err) {
            console.warn('Fallo en modo camisa blanca, usando método estándar:', err);
            resultBlob = await removeBackground(imageSource, config);
        }
    } else {
        resultBlob = await removeBackground(imageSource, config);
    }

    onProgress?.({
        stage: 'complete',
        percent: 100,
        message: '¡Recorte completado!',
    });

    return resultBlob;
}

/**
 * Convierte un Blob o URL a un objeto File listo para subir a Supabase Storage.
 */
export function blobToFile(blob: Blob, originalFileName: string): File {
    const baseName = originalFileName.replace(/\.[^/.]+$/, '');
    const newFileName = `${baseName}-sin-fondo-${Date.now()}.png`;
    return new File([blob], newFileName, { type: 'image/png' });
}
