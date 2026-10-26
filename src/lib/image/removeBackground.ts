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
 * Normaliza cualquier fuente de imagen (File, Blob, WebP, AVIF, URL remota) a un Blob PNG estándar.
 * Resuelve:
 * 1. Archivos .webp con MIME type vacío o ausente (típico en Windows: file.type === "").
 * 2. Formatos WebP con perfiles de color o compresión que fallan en createImageBitmap nativo.
 * 3. Formatos como AVIF o HEIC no soportados directamente por la librería de IA.
 * 4. Control de dimensiones máximas para prevenir colapsos de memoria WebAssembly.
 */
async function normalizeImageSourceToPngBlob(imageSource: File | Blob | string): Promise<Blob> {
    return new Promise<Blob>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

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

        if (typeof imageSource === 'string') {
            img.src = imageSource;
        } else {
            // Incluso si el archivo no tiene MIME type o es .webp, URL.createObjectURL
            // permite al decodificador nativo del navegador parsear los bytes reales.
            objectUrl = URL.createObjectURL(imageSource);
            img.src = objectUrl;
        }

        img.onload = () => {
            try {
                const width = img.naturalWidth || img.width;
                const height = img.naturalHeight || img.height;

                if (!width || !height) {
                    cleanup();
                    reject(new Error('La imagen no tiene dimensiones válidas.'));
                    return;
                }

                // Limitar dimensión máxima a 2560px para garantizar estabilidad de WebAssembly
                const MAX_DIM = 2560;
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
                    cleanup();
                    // Fallback directo si no hay contexto canvas
                    if (imageSource instanceof Blob) {
                        resolve(new Blob([imageSource], { type: 'image/png' }));
                    } else {
                        reject(new Error('No se pudo inicializar contexto 2D de canvas.'));
                    }
                    return;
                }

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

                cleanup();

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Fallo al exportar imagen normalizada en formato PNG.'));
                    }
                }, 'image/png');
            } catch (err) {
                cleanup();
                reject(err);
            }
        };

        img.onerror = () => {
            cleanup();
            reject(new Error('No se pudo cargar o decodificar el archivo .webp / imagen. Verifica que el archivo no esté corrupto.'));
        };
    });
}

/**
 * Pre-procesa una imagen para amplificar el contraste de costuras y sombras de telas blancas,
 * permitiendo que la red neuronal distinga la prenda blanca del fondo blanco plano.
 */
async function createContrastEnhancedBlob(imageSource: File | Blob | string): Promise<Blob> {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let objectUrl: string | null = null;
    if (typeof imageSource === 'string') {
        img.src = imageSource;
    } else {
        objectUrl = URL.createObjectURL(imageSource);
        img.src = objectUrl;
    }

    await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Error al cargar imagen para realce de contraste'));
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
    }

    if (!ctx) {
        return imageSource instanceof Blob ? imageSource : (await fetch(imageSource)).blob();
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

    return new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob || (imageSource as Blob)), 'image/png');
    });
}

/**
 * Elimina el fondo de una imagen (File, Blob o URL) y retorna un Blob PNG transparente.
 * Preserva 100% de los píxeles originales de la prenda/objeto (solo altera canal alfa).
 * Compatible con archivos WebP, JPG, PNG, AVIF y URLs remotas.
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
        percent: 5,
        message: 'Normalizando imagen para compatibilidad (.webp / .png)...',
    });

    // 1. Normalizar cualquier formato (.webp, .avif, .jpg, .png o sin mime-type) a PNG estándar
    const normalizedSource = await normalizeImageSourceToPngBlob(imageSource);

    onProgress?.({
        stage: 'loading',
        percent: 15,
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
            const enhancedBlob = await createContrastEnhancedBlob(normalizedSource);
            // 2. Extraer máscara de segmentación sobre la imagen acentuada
            const maskBlob = await alphamask(enhancedBlob, config);
            // 3. Aplicar la máscara sobre la imagen normalizada
            resultBlob = await applySegmentationMask(normalizedSource, maskBlob, config);
        } catch (err) {
            console.warn('Fallo en modo camisa blanca, usando método estándar:', err);
            try {
                resultBlob = await removeBackground(normalizedSource, config);
            } catch (retryErr) {
                console.warn('Fallo con isnet_fp16, intentando con modelo isnet estándar:', retryErr);
                resultBlob = await removeBackground(normalizedSource, { ...config, model: 'isnet' as const });
            }
        }
    } else {
        try {
            resultBlob = await removeBackground(normalizedSource, config);
        } catch (err) {
            console.warn('Fallo con isnet_fp16, intentando con modelo isnet estándar:', err);
            resultBlob = await removeBackground(normalizedSource, { ...config, model: 'isnet' as const });
        }
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
