'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { CustomizerProduct } from '@/types/productCustomizer';

export function useProductGallery(product: CustomizerProduct) {
    const galleryImages = useMemo(() => {
        const imgs: string[] = [];
        if (product.image_url) imgs.push(product.image_url);
        if (product.product_images?.length) {
            const sorted = [...product.product_images].sort((a, b) => a.sort_order - b.sort_order);
            sorted.forEach((img) => {
                if (img.image_url) imgs.push(img.image_url);
            });
        }
        return imgs.length ? imgs : [product.image_url ?? ''];
    }, [product.image_url, product.product_images]);

    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const [isHoveringImage, setIsHoveringImage] = useState(false);
    const autoRotateRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const manualPauseUntilRef = useRef(0);
    const galleryLengthRef = useRef(galleryImages.length);

    const activeImage = galleryImages[activeImageIdx] ?? galleryImages[0] ?? '';

    const goToPrev = useCallback(() => {
        setActiveImageIdx((prev) => (prev <= 0 ? galleryImages.length - 1 : prev - 1));
        manualPauseUntilRef.current = Date.now() + 8000;
    }, [galleryImages.length]);

    const goToNext = useCallback(() => {
        setActiveImageIdx((prev) => (prev >= galleryImages.length - 1 ? 0 : prev + 1));
        manualPauseUntilRef.current = Date.now() + 8000;
    }, [galleryImages.length]);

    // Zoom Refs (Desktop)
    const containerRef = useRef<HTMLDivElement>(null);
    const lensRef = useRef<HTMLDivElement>(null);
    const blurRef = useRef<HTMLDivElement>(null);

    // Mobile Pinch-to-zoom & Pan
    const [imgScale, setImgScale] = useState(1);
    const [imgTranslate, setImgTranslate] = useState({ x: 0, y: 0 });
    const [isPinching, setIsPinching] = useState(false);
    const imgScaleRef = useRef(1);
    const imgTranslateRef = useRef({ x: 0, y: 0 });
    const pinchStartDistRef = useRef<number | null>(null);
    const pinchStartScaleRef = useRef(1);
    const panStartRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
    const lastTapRef = useRef(0);
    const pinchElRef = useRef<HTMLDivElement | null>(null);
    const pinchListenersRef = useRef<{ s: EventListener; m: EventListener; e: EventListener } | null>(null);
    const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

    // Auto-rotación
    useEffect(() => {
        galleryLengthRef.current = galleryImages.length;
        if (galleryImages.length <= 1 || isHoveringImage || imgScale > 1) {
            if (autoRotateRef.current) {
                clearInterval(autoRotateRef.current);
                autoRotateRef.current = null;
            }
            return;
        }
        autoRotateRef.current = setInterval(() => {
            if (Date.now() < manualPauseUntilRef.current) return;
            setActiveImageIdx((prev) => (prev >= galleryImages.length - 1 ? 0 : prev + 1));
        }, 5000);
        return () => {
            if (autoRotateRef.current) clearInterval(autoRotateRef.current);
        };
    }, [galleryImages.length, isHoveringImage, imgScale]);

    const resetZoomPan = useCallback(() => {
        imgScaleRef.current = 1;
        imgTranslateRef.current = { x: 0, y: 0 };
        setImgScale(1);
        setImgTranslate({ x: 0, y: 0 });
    }, []);

    useEffect(() => {
        resetZoomPan();
    }, [activeImageIdx, resetZoomPan]);

    // Touch Event Listeners Callback Ref
    const combinedContainerRef = useCallback((el: HTMLDivElement | null) => {
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;

        if (pinchElRef.current && pinchListenersRef.current) {
            const { s, m: mv, e } = pinchListenersRef.current;
            pinchElRef.current.removeEventListener('touchstart', s);
            pinchElRef.current.removeEventListener('touchmove', mv);
            pinchElRef.current.removeEventListener('touchend', e);
            pinchListenersRef.current = null;
        }
        pinchElRef.current = el;
        if (!el) return;

        const getDist = (t: TouchList) =>
            Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

        const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

        const onStart = (ev: TouchEvent) => {
            if (ev.touches.length === 2) {
                ev.preventDefault();
                swipeStartRef.current = null;
                panStartRef.current = null;
                pinchStartDistRef.current = getDist(ev.touches);
                pinchStartScaleRef.current = imgScaleRef.current;
                setIsPinching(true);
            } else if (ev.touches.length === 1 && imgScaleRef.current > 1) {
                swipeStartRef.current = null;
                panStartRef.current = {
                    x: ev.touches[0].clientX,
                    y: ev.touches[0].clientY,
                    tx: imgTranslateRef.current.x,
                    ty: imgTranslateRef.current.y,
                };
            } else if (ev.touches.length === 1) {
                swipeStartRef.current = { x: ev.touches[0].clientX, y: ev.touches[0].clientY };
            }
        };

        const onMove = (ev: TouchEvent) => {
            if (ev.touches.length === 2 && pinchStartDistRef.current !== null) {
                ev.preventDefault();
                const ratio = getDist(ev.touches) / pinchStartDistRef.current;
                const next = clamp(pinchStartScaleRef.current * ratio, 1, 4);
                imgScaleRef.current = next;
                setImgScale(next);
            } else if (ev.touches.length === 1 && panStartRef.current && imgScaleRef.current > 1) {
                ev.preventDefault();
                const s = imgScaleRef.current;
                const dx = ev.touches[0].clientX - panStartRef.current.x;
                const dy = ev.touches[0].clientY - panStartRef.current.y;
                const maxX = ((s - 1) * el.offsetWidth) / 2;
                const maxY = ((s - 1) * el.offsetHeight) / 2;
                const newX = clamp(panStartRef.current.tx + dx, -maxX, maxX);
                const newY = clamp(panStartRef.current.ty + dy, -maxY, maxY);
                imgTranslateRef.current = { x: newX, y: newY };
                setImgTranslate({ x: newX, y: newY });
            }
        };

        const onEnd = (ev: TouchEvent) => {
            if (ev.touches.length === 0) panStartRef.current = null;
            if (ev.touches.length < 2) {
                setIsPinching(false);
                pinchStartDistRef.current = null;
                if (imgScaleRef.current < 1.15) {
                    imgScaleRef.current = 1;
                    imgTranslateRef.current = { x: 0, y: 0 };
                    setImgScale(1);
                    setImgTranslate({ x: 0, y: 0 });
                }
                if (ev.changedTouches.length === 1 && ev.touches.length === 0) {
                    const now = Date.now();
                    if (now - lastTapRef.current < 300) {
                        const next = imgScaleRef.current > 1 ? 1 : 2;
                        imgScaleRef.current = next;
                        if (next === 1) {
                            imgTranslateRef.current = { x: 0, y: 0 };
                            setImgTranslate({ x: 0, y: 0 });
                        }
                        setImgScale(next);
                    } else if (swipeStartRef.current && imgScaleRef.current <= 1) {
                        const dx = ev.changedTouches[0].clientX - swipeStartRef.current.x;
                        const dy = ev.changedTouches[0].clientY - swipeStartRef.current.y;
                        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                            if (dx < 0) {
                                setActiveImageIdx((prev) =>
                                    prev >= galleryLengthRef.current - 1 ? 0 : prev + 1
                                );
                            } else {
                                setActiveImageIdx((prev) =>
                                    prev <= 0 ? galleryLengthRef.current - 1 : prev - 1
                                );
                            }
                            manualPauseUntilRef.current = Date.now() + 8000;
                        }
                    }
                    lastTapRef.current = now;
                }
                swipeStartRef.current = null;
            }
        };

        pinchListenersRef.current = {
            s: onStart as EventListener,
            m: onMove as EventListener,
            e: onEnd as EventListener,
        };
        el.addEventListener('touchstart', onStart, { passive: false });
        el.addEventListener('touchmove', onMove, { passive: false });
        el.addEventListener('touchend', onEnd, { passive: false });
    }, []);

    // Desktop Lens Zoom Move
    const isTouchDevice = () =>
        typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

    const handleZoomMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (isTouchDevice()) return;
        if (!containerRef.current || !lensRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        let clientX: number;
        let clientY: number;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
            handleLeave();
            return;
        }

        const lensWidth = lensRef.current.offsetWidth;
        const lensHeight = lensRef.current.offsetHeight;

        window.requestAnimationFrame(() => {
            if (lensRef.current) {
                lensRef.current.style.left = `${x - lensWidth / 2}px`;
                lensRef.current.style.top = `${y - lensHeight / 2}px`;
                lensRef.current.style.backgroundSize = `${rect.width * 2}px ${rect.height * 2}px`;
                const bgX = -(x * 2 - lensWidth / 2);
                const bgY = -(y * 2 - lensHeight / 2);
                lensRef.current.style.backgroundPosition = `${bgX}px ${bgY}px`;
            }
        });
    };

    const handleEnter = () => {
        if (isTouchDevice()) return;
        if (lensRef.current) lensRef.current.style.opacity = '1';
        if (blurRef.current) blurRef.current.style.opacity = '1';
        setIsHoveringImage(true);
    };

    const handleLeave = () => {
        if (lensRef.current) lensRef.current.style.opacity = '0';
        if (blurRef.current) blurRef.current.style.opacity = '0';
        setIsHoveringImage(false);
    };

    return {
        galleryImages,
        activeImageIdx,
        setActiveImageIdx,
        activeImage,
        goToPrev,
        goToNext,
        isHoveringImage,
        lensRef,
        blurRef,
        combinedContainerRef,
        handleZoomMove,
        handleEnter,
        handleLeave,
        imgScale,
        imgTranslate,
        isPinching,
        manualPauseUntilRef,
    };
}
