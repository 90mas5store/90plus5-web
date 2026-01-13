'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Hook para prefetching inteligente de rutas
 * Precarga rutas cuando el usuario pasa el mouse por encima de un elemento
 */
export function usePrefetch() {
    const router = useRouter();
    const prefetchedRef = useRef<Set<string>>(new Set());

    /**
     * Prefetch una ruta específica
     */
    const prefetch = useCallback((href: string) => {
        if (prefetchedRef.current.has(href)) return;

        router.prefetch(href);
        prefetchedRef.current.add(href);
    }, [router]);

    /**
     * Handler para onMouseEnter que prefetcha la ruta
     */
    const handlePrefetch = useCallback((href: string) => {
        return () => prefetch(href);
    }, [prefetch]);

    /**
     * Navegar a una ruta (con prefetch ya hecho)
     */
    const navigate = useCallback((href: string) => {
        router.push(href);
    }, [router]);

    return { prefetch, handlePrefetch, navigate };
}

/**
 * Hook para precargar imágenes
 * Útil para precargar imágenes antes de que el usuario las vea
 */
export function useImagePreloader() {
    const preloadedRef = useRef<Set<string>>(new Set());

    const preloadImage = useCallback((src: string) => {
        if (!src || preloadedRef.current.has(src)) return;

        const img = new window.Image();
        img.src = src;
        preloadedRef.current.add(src);
    }, []);

    const preloadImages = useCallback((srcs: string[]) => {
        srcs.forEach(preloadImage);
    }, [preloadImage]);

    return { preloadImage, preloadImages };
}

/**
 * Hook para Intersection Observer con prefetch
 * Prefetcha rutas cuando un elemento está cerca de entrar al viewport
 */
export function usePrefetchOnVisible(href: string, options?: IntersectionObserverInit) {
    const elementRef = useRef<HTMLElement>(null);
    const { prefetch } = usePrefetch();

    useEffect(() => {
        const element = elementRef.current;
        if (!element || !href) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        prefetch(href);
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                rootMargin: '200px', // Prefetch cuando está a 200px del viewport
                ...options,
            }
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, [href, prefetch, options]);

    return elementRef;
}

/**
 * Hook para precargar datos al idle
 * Ejecuta una función cuando el navegador está idle
 */
export function useIdleCallback(callback: () => void, dependencies: any[] = []) {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Usar requestIdleCallback si está disponible, sino setTimeout
        if ('requestIdleCallback' in window) {
            const id = window.requestIdleCallback(callback, { timeout: 2000 });
            return () => window.cancelIdleCallback(id);
        } else {
            const id = setTimeout(callback, 100);
            return () => clearTimeout(id);
        }
    }, dependencies);
}

/**
 * Hook para precargar productos relacionados
 */
export function useProductPrefetch(products: { id: string; slug?: string; imagen?: string }[]) {
    const { prefetch } = usePrefetch();
    const { preloadImages } = useImagePreloader();

    useEffect(() => {
        if (!products.length) return;

        // Esperar a que el navegador esté idle para precargar
        const timeoutId = setTimeout(() => {
            // Precargar las primeras 4 imágenes de productos
            const imagesToPreload = products.slice(0, 4)
                .map(p => p.imagen)
                .filter(Boolean) as string[];

            preloadImages(imagesToPreload);

            // Prefetch las rutas de los primeros 2 productos
            products.slice(0, 2).forEach(p => {
                prefetch(`/producto/${p.slug || p.id}`);
            });
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [products, prefetch, preloadImages]);
}
// requestIdleCallback types are built-in to modern TypeScript
