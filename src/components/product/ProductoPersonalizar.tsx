'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "@/lib/motion";
import { getProductOptionsFromSupabase, getPlayersByTeam } from "@/lib/api";
import HeatmapBackground from "@/components/HeatmapBackground";
import TeamLogo from "@/components/TeamLogo";
import ProductImage from "@/components/ProductImage";
import Button from "@/components/ui/MainButton";
import { useCart } from "@/context/CartContext";
import useToastMessage from "@/hooks/useToastMessage";
import { ArrowLeft, ChevronLeft, ChevronRight, Shirt, CheckCircle2, Info, Share2 } from "lucide-react";
import { useLiveMatches } from "@/hooks/useLiveMatches";
import { ProductCustomizationSkeleton } from "@/components/skeletons/ProductSkeletons";
import { usePrefetch } from "@/hooks/usePrefetch";
import { usePrefersReducedMotion } from "@/hooks/useOptimization";

import { Product as LibProduct } from "@/lib/types";



interface ProductVariant {
    version: string;
    price: number;
    active: boolean;
    original_price?: number;
    active_original_price?: boolean;
}

interface Team {
    name: string;
    logo_url: string;
}

interface Product {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    team_id: string | null;
    teams?: Team | null;
    product_variants?: ProductVariant[] | null;
    product_images?: { id: string; image_url: string; sort_order: number }[] | null;
    modelo?: string;
    equipo?: string;
    liga?: string;
    imagen?: string;
    logoEquipo?: string;
    precio?: number;
    descripcion?: string;
    slug?: string;
    league_id?: string | null;
    category_id?: string | null;
    allows_customization?: boolean;
    trending_until?: string | null;
}

interface ProductoPersonalizarProps {
    product: Product;
    breadcrumb?: React.ReactNode;
    initialRelated?: LibProduct[];
}

export default function ProductoPersonalizar({ product, breadcrumb, initialRelated = [] }: ProductoPersonalizarProps) {
    const router = useRouter();
    const { addItem, openCart } = useCart();
    const toast = useToastMessage();
    const { prefetch, navigate } = usePrefetch();
    const prefersReducedMotion = usePrefersReducedMotion();
    const liveMatches = useLiveMatches();

    // Partido en vivo: via API (si el equipo tiene football_data_id) o manual (trending_until)
    const liveMatch = product.team_id ? liveMatches[product.team_id] ?? null : null;
    const isLiveManual = !liveMatch && !!product.trending_until && new Date(product.trending_until) > new Date();
    const showLiveBanner = !!liveMatch || isLiveManual;

    const mapProduct = (p: Product) => ({
        ...p,
        modelo: p.name,
        equipo: p.teams?.name || "Equipo Desconocido",
        liga: "Desconocida",
        imagen: p.image_url,
        logoEquipo: p.teams?.logo_url,
        precio: p.product_variants?.[0]?.price || 0,
        descripcion: p.description,
    });

    const [producto, setProducto] = useState(mapProduct(product));
    const [opciones, setOpciones] = useState<{
        dorsales: { id: string; jugador: string; numero: string }[];
        preciosPorVersion: Record<string, number>;
        originalesPorVersion: Record<string, { price: number, active: boolean }>;
        versiones?: { id: string; label: string }[];
        tallas?: { id: string; label: string }[];
        parches?: { id: string; label: string }[];
        variantSizesMap?: Record<string, string[]>;
    }>({ dorsales: [], preciosPorVersion: {}, originalesPorVersion: {}, variantSizesMap: {} });
    const [relatedProducts] = useState<LibProduct[]>(initialRelated);
    const [loading, setLoading] = useState(true);

    // Personalización - ahora guardamos {id, label} donde aplica
    const [precioActual, setPrecioActual] = useState(0);
    const [precioOriginalActual, setPrecioOriginalActual] = useState<{ price: number, active: boolean } | null>(null);
    const [versionSeleccionada, setVersionSeleccionada] = useState<{ id: string; label: string } | null>(null);
    const [tallaSeleccionada, setTallaSeleccionada] = useState<{ id: string; label: string } | null>(null);
    const [parcheSeleccionado, setParcheSeleccionado] = useState<{ id: string; label: string } | null>(null);

    // Dorsal
    const [quiereDorsal, setQuiereDorsal] = useState(false);
    const [modoDorsal, setModoDorsal] = useState("");
    const [jugadorSeleccionado, setJugadorSeleccionado] = useState<{ id: string; numero: string; nombre: string } | null>(null);
    const [numeroPersonalizado, setNumeroPersonalizado] = useState("");
    const [nombrePersonalizado, setNombrePersonalizado] = useState("");

    // Estado de carga para el botón de añadir
    const [isAdding, setIsAdding] = useState(false);
    const [copied, setCopied] = useState(false);

    // Galería de imágenes
    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const [isHoveringImage, setIsHoveringImage] = useState(false);
    const autoRotateRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Todas las imágenes: imagen principal + imágenes adicionales ordenadas
    const galleryImages = useMemo(() => {
        const imgs: string[] = [];
        if (product.image_url) imgs.push(product.image_url);
        if (product.product_images?.length) {
            const sorted = [...product.product_images].sort((a, b) => a.sort_order - b.sort_order);
            sorted.forEach(img => { if (img.image_url) imgs.push(img.image_url); });
        }
        return imgs.length ? imgs : [product.image_url ?? ""];
    }, [product.image_url, product.product_images]);

    const activeImage = galleryImages[activeImageIdx] ?? galleryImages[0] ?? "";

    // Navegación manual
    const goToPrev = useCallback(() => {
        setActiveImageIdx(prev => prev <= 0 ? galleryImages.length - 1 : prev - 1);
        manualPauseUntilRef.current = Date.now() + 8000;
    }, [galleryImages.length]);

    const goToNext = useCallback(() => {
        setActiveImageIdx(prev => prev >= galleryImages.length - 1 ? 0 : prev + 1);
        manualPauseUntilRef.current = Date.now() + 8000;
    }, [galleryImages.length]);

    // Referencias para zoom de lente (mouse — desktop)
    const containerRef = useRef<HTMLDivElement>(null);
    const lensRef = useRef<HTMLDivElement>(null);
    const blurRef = useRef<HTMLDivElement>(null);

    // Pinch-to-zoom + pan (táctil — mobile)
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
    const manualPauseUntilRef = useRef(0);
    const galleryLengthRef = useRef(galleryImages.length);
    const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

    // Auto-rotación: avanza cada 5s, pausa al hacer hover/zoom de lente o zoom táctil
    useEffect(() => {
        galleryLengthRef.current = galleryImages.length;
        if (galleryImages.length <= 1 || isHoveringImage || imgScale > 1) {
            if (autoRotateRef.current) { clearInterval(autoRotateRef.current); autoRotateRef.current = null; }
            return;
        }
        autoRotateRef.current = setInterval(() => {
            if (Date.now() < manualPauseUntilRef.current) return;
            setActiveImageIdx(prev => (prev >= galleryImages.length - 1 ? 0 : prev + 1));
        }, 5000);
        return () => { if (autoRotateRef.current) clearInterval(autoRotateRef.current); };
    }, [galleryImages.length, isHoveringImage, imgScale]);

    const resetZoomPan = useCallback(() => {
        imgScaleRef.current = 1;
        imgTranslateRef.current = { x: 0, y: 0 };
        setImgScale(1);
        setImgTranslate({ x: 0, y: 0 });
    }, []);

    // Resetear zoom + pan al cambiar de imagen
    useEffect(() => { resetZoomPan(); }, [activeImageIdx, resetZoomPan]);

    // Callback ref — se ejecuta exactamente cuando el DOM element monta/desmonta
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
                // Iniciar pan con un dedo cuando hay zoom activo
                swipeStartRef.current = null;
                panStartRef.current = {
                    x: ev.touches[0].clientX,
                    y: ev.touches[0].clientY,
                    tx: imgTranslateRef.current.x,
                    ty: imgTranslateRef.current.y,
                };
            } else if (ev.touches.length === 1) {
                // Posible swipe de navegación (sin zoom)
                swipeStartRef.current = { x: ev.touches[0].clientX, y: ev.touches[0].clientY };
            }
        };

        const onMove = (ev: TouchEvent) => {
            if (ev.touches.length === 2 && pinchStartDistRef.current !== null) {
                // Pinch zoom
                ev.preventDefault();
                const ratio = getDist(ev.touches) / pinchStartDistRef.current;
                const next = clamp(pinchStartScaleRef.current * ratio, 1, 4);
                imgScaleRef.current = next;
                setImgScale(next);
            } else if (ev.touches.length === 1 && panStartRef.current && imgScaleRef.current > 1) {
                // Pan con un dedo
                ev.preventDefault();
                const s = imgScaleRef.current;
                const dx = ev.touches[0].clientX - panStartRef.current.x;
                const dy = ev.touches[0].clientY - panStartRef.current.y;
                const maxX = (s - 1) * el.offsetWidth / 2;
                const maxY = (s - 1) * el.offsetHeight / 2;
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
                // Doble toque o swipe de navegación
                if (ev.changedTouches.length === 1 && ev.touches.length === 0) {
                    const now = Date.now();
                    if (now - lastTapRef.current < 300) {
                        // Doble toque: alterna 1x ↔ 2x
                        const next = imgScaleRef.current > 1 ? 1 : 2;
                        imgScaleRef.current = next;
                        if (next === 1) {
                            imgTranslateRef.current = { x: 0, y: 0 };
                            setImgTranslate({ x: 0, y: 0 });
                        }
                        setImgScale(next);
                    } else if (swipeStartRef.current && imgScaleRef.current <= 1) {
                        // Swipe horizontal para navegar entre imágenes
                        const dx = ev.changedTouches[0].clientX - swipeStartRef.current.x;
                        const dy = ev.changedTouches[0].clientY - swipeStartRef.current.y;
                        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                            if (dx < 0) {
                                setActiveImageIdx(prev => prev >= galleryLengthRef.current - 1 ? 0 : prev + 1);
                            } else {
                                setActiveImageIdx(prev => prev <= 0 ? galleryLengthRef.current - 1 : prev - 1);
                            }
                            manualPauseUntilRef.current = Date.now() + 8000;
                        }
                    }
                    lastTapRef.current = now;
                }
                swipeStartRef.current = null;
            }
        };

        pinchListenersRef.current = { s: onStart as EventListener, m: onMove as EventListener, e: onEnd as EventListener };
        el.addEventListener('touchstart', onStart, { passive: false });
        el.addEventListener('touchmove', onMove, { passive: false });
        el.addEventListener('touchend', onEnd, { passive: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
    }, []);

    useEffect(() => {
        async function cargarOpciones() {
            setLoading(true);
            const mappedProduct = mapProduct(product);
            setProducto(mappedProduct);

            const opcionesProducto = await getProductOptionsFromSupabase(product.id);

            const preciosPorVersion: Record<string, number> = {};
            const originalesPorVersion: Record<string, { price: number, active: boolean }> = {};

            product.product_variants?.forEach((v) => {
                if (v.active) {
                    preciosPorVersion[v.version] = v.price;
                    originalesPorVersion[v.version] = {
                        price: v.original_price || 0,
                        active: !!v.active_original_price
                    };
                }
            });

            const precios = Object.values(preciosPorVersion);
            const precioInicial = precios.length ? Math.min(...precios) : 0;
            setPrecioActual(precioInicial);

            let dorsales: { id: string; jugador: string; numero: string }[] = [];
            if (product.team_id) {
                const players = await getPlayersByTeam(product.team_id);
                dorsales = players.map((p: Record<string, unknown>) => ({
                    id: p.id,
                    jugador: p.name,
                    numero: p.number?.toString() || '',
                }));
            }

            setOpciones({
                ...opcionesProducto,
                dorsales,
                preciosPorVersion,
                originalesPorVersion,
            });

            // Pre-seleccionar desde URL params (link compartido) o auto-seleccionar primera versión
            const urlParams = new URLSearchParams(window.location.search);
            const paramV = urlParams.get('v');
            const paramT = urlParams.get('t');
            const paramP = urlParams.get('p');
            const paramD = urlParams.get('d');
            const paramJ = urlParams.get('ji');
            const paramCN = urlParams.get('cn');
            const paramCNO = urlParams.get('cno');

            // Versión (buscar por label)
            const preVersion = paramV ? opcionesProducto.versiones?.find(v => v.label === paramV) : null;
            if (preVersion) {
                setVersionSeleccionada(preVersion);
                setPrecioActual(preciosPorVersion[preVersion.label] ?? 0);
                setPrecioOriginalActual(originalesPorVersion[preVersion.label] ?? null);
            } else if (opcionesProducto.versiones?.length) {
                const firstVersion = opcionesProducto.versiones[0];
                setVersionSeleccionada(firstVersion);
                setPrecioActual(preciosPorVersion[firstVersion.label] ?? product.precio);
                setPrecioOriginalActual(originalesPorVersion[firstVersion.label] ?? null);
            }

            // Talla (buscar por label)
            if (paramT) {
                const preTalla = opcionesProducto.tallas?.find(t => t.label === paramT);
                if (preTalla) setTallaSeleccionada(preTalla);
            }

            // Parche (buscar por label)
            if (paramP) {
                const preParche = opcionesProducto.parches?.find(p => p.label === paramP);
                if (preParche) setParcheSeleccionado(preParche);
            }

            // Dorsal
            if (paramD === 'j' && paramJ) {
                const preJugador = dorsales.find(d => d.numero === paramJ); // buscar por número
                if (preJugador) {
                    setQuiereDorsal(true);
                    setModoDorsal('jugador');
                    setJugadorSeleccionado({ id: preJugador.id, numero: preJugador.numero, nombre: preJugador.jugador });
                }
            } else if (paramD === 'c') {
                setQuiereDorsal(true);
                setModoDorsal('personalizado');
                if (paramCN) setNumeroPersonalizado(paramCN);
                if (paramCNO) setNombrePersonalizado(decodeURIComponent(paramCNO));
            }

            setLoading(false);
        }
        cargarOpciones();
    // Only re-run when product id changes; full product/version objects intentionally omitted
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product.id]);

    // Cleanup talla si cambia versión y no está disponible
    useEffect(() => {
        if (versionSeleccionada && tallaSeleccionada && opciones.variantSizesMap) {
            const availableSizes = opciones.variantSizesMap[versionSeleccionada.id] || [];
            if (!availableSizes.includes(tallaSeleccionada.id)) {
                // Deferir setState para no llamarlo síncronamente en el body del effect
                const id = setTimeout(() => setTallaSeleccionada(null), 0);
                return () => clearTimeout(id);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [versionSeleccionada]);

    // === MANEJO DEL ZOOM DE LENTE (solo mouse — desktop) ===
    const isTouchDevice = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

    const handleZoomMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (isTouchDevice()) return;
        if (!containerRef.current || !lensRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        // Limitar dentro del contenedor
        if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
            handleLeave();
            return;
        }

        const lensWidth = lensRef.current.offsetWidth;
        const lensHeight = lensRef.current.offsetHeight;

        window.requestAnimationFrame(() => {
            if (lensRef.current) {
                // Posición de la lente
                lensRef.current.style.left = `${x - lensWidth / 2}px`;
                lensRef.current.style.top = `${y - lensHeight / 2}px`;

                // Zoom 2x: La imagen de fondo debe ser el doble del contenedor
                lensRef.current.style.backgroundSize = `${rect.width * 2}px ${rect.height * 2}px`;

                // Posición del fondo para que coincida con el punto x,y
                const bgX = -(x * 2 - lensWidth / 2);
                const bgY = -(y * 2 - lensHeight / 2);
                lensRef.current.style.backgroundPosition = `${bgX}px ${bgY}px`;
            }
        });
    };

    const handleEnter = () => {
        if (isTouchDevice()) return;
        if (lensRef.current) lensRef.current.style.opacity = "1";
        if (blurRef.current) blurRef.current.style.opacity = "1";
        setIsHoveringImage(true);
    };

    const handleLeave = () => {
        if (lensRef.current) lensRef.current.style.opacity = "0";
        if (blurRef.current) blurRef.current.style.opacity = "0";
        setIsHoveringImage(false);
    };

    const handleNumeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, "");
        if (parseInt(val) <= 99 || val === "") setNumeroPersonalizado(val);
    };
    const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toUpperCase().slice(0, 12);
        setNombrePersonalizado(val);
    };

    const handleAddToCart = () => {
        if (!versionSeleccionada || !tallaSeleccionada) {
            toast.warning("Por favor, selecciona versión y talla");
            return;
        }

        // Determinar datos del dorsal según el modo
        let dorsalNumero = '';
        let dorsalNombre = '';
        let playerId: string | null = null;

        if (quiereDorsal && modoDorsal === 'jugador' && jugadorSeleccionado) {
            dorsalNumero = jugadorSeleccionado.numero;
            dorsalNombre = jugadorSeleccionado.nombre;
            playerId = jugadorSeleccionado.id;
        } else if (quiereDorsal && modoDorsal === 'personalizado') {
            dorsalNumero = numeroPersonalizado;
            dorsalNombre = nombrePersonalizado;
        }

        setIsAdding(true);

        // Simulamos un pequeño delay para que se vea la animación
        setTimeout(() => {
            addItem({
                id: producto.id,
                modelo: producto.modelo,
                equipo: producto.equipo,
                liga: producto.liga || "",
                // Labels para UI
                version: versionSeleccionada.label,
                talla: tallaSeleccionada.label,
                parche: parcheSeleccionado?.label || null,
                // UUIDs para Supabase
                variant_id: versionSeleccionada.id,
                size_id: tallaSeleccionada.id,
                patch_id: parcheSeleccionado?.id || null,
                player_id: playerId,
                dorsalNumero,
                dorsalNombre,
                imagen: producto.imagen,
                precio: precioActual,
                cantidad: 1,
            });

            // Mostrar toast con info del producto
            const customization = dorsalNombre ? `${dorsalNumero} · ${dorsalNombre}` : null;
            toast.cartSuccess(`${producto.equipo} ${producto.modelo}`, tallaSeleccionada.label, customization);

            setIsAdding(false);
            openCart();
        }, 600);
    };

    const copyToClipboard = (text: string) => {
        // Fallback robusto: crea textarea temporal, lo enfoca y usa execCommand
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleShare = async () => {
        const base = `${window.location.origin}${window.location.pathname}`;
        const params = new URLSearchParams();

        if (versionSeleccionada) params.set('v', versionSeleccionada.label);
        if (tallaSeleccionada) params.set('t', tallaSeleccionada.label);
        if (parcheSeleccionado) params.set('p', parcheSeleccionado.label);

        if (quiereDorsal) {
            if (modoDorsal === 'jugador' && jugadorSeleccionado) {
                params.set('d', 'j');
                params.set('ji', jugadorSeleccionado.numero); // número de camiseta, no UUID
            } else if (modoDorsal === 'personalizado') {
                params.set('d', 'c');
                if (numeroPersonalizado) params.set('cn', numeroPersonalizado);
                if (nombrePersonalizado) params.set('cno', encodeURIComponent(nombrePersonalizado));
            }
        }

        const shareUrl = `${base}?${params.toString()}`;

        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({
                    title: `${producto.equipo} – ${producto.modelo} | 90+5 Store`,
                    text: `Mirá el kit que armé: ${producto.equipo} ${producto.modelo}`,
                    url: shareUrl,
                });
                return;
            } catch {
                // Usuario canceló — no copiar al portapapeles automáticamente
                return;
            }
        }

        // Desktop: copiar al portapapeles con fallback robusto
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            copyToClipboard(shareUrl);
        }
    };

    if (loading) return <ProductCustomizationSkeleton />;

    const getAuraColors = (liga: string | undefined) => {
        if (!liga) return "from-primary/20 via-black to-black";
        const map: Record<string, string> = {
            "Barcelona": "from-[#004D98]/30 via-black to-[#A50044]/30",
            "Real Madrid": "from-white/5 via-black to-[#A899CA]/10",
            "PSG": "from-[#004170]/30 via-black to-[#DA291C]/30",
            "Manchester United": "from-[#DA291C]/30 via-black to-[#FBE122]/20",
            "Olimpia": "from-white/10 via-black to-primary/30",
        };
        return map[liga] || "from-primary/25 via-black to-black";
    };

    return (
        <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`min-h-dvh text-white pt-24 pb-20 px-4 md:px-8 relative overflow-hidden bg-gradient-to-b ${getAuraColors(producto.liga)}`}
        >
            <HeatmapBackground liga={producto.liga} opacity={0.1} />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* 🧭 Breadcrumb (opcional) o botón Volver */}
                <div className="mb-6 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        aria-label="Regresar"
                        className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-all group shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    {breadcrumb ?? (
                        <span className="text-sm font-bold uppercase tracking-widest text-gray-400">
                            Regresar
                        </span>
                    )}
                </div>

                <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">

                    {/* 🖼️ SECCIÓN IMAGEN */}
                    <div className="lg:col-span-7 flex flex-col gap-3">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            className="relative w-full h-[50vh] md:h-auto md:aspect-square rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl group cursor-crosshair p-0"
                            ref={combinedContainerRef}
                            onMouseMove={handleZoomMove}
                            onMouseEnter={handleEnter}
                            onMouseLeave={handleLeave}
                            style={{ touchAction: 'none' }}
                        >
                            {/* Todas las imágenes pre-cargadas en el DOM — switching instantáneo sin re-fetch */}
                            {galleryImages.map((imgSrc, idx) => (
                                <div
                                    key={imgSrc || idx}
                                    className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                                        activeImageIdx === idx ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'
                                    }`}
                                >
                                    <div
                                        style={activeImageIdx === idx ? {
                                            width: '100%',
                                            height: '100%',
                                            transform: `scale(${imgScale}) translate(${imgTranslate.x / imgScale}px, ${imgTranslate.y / imgScale}px)`,
                                            transformOrigin: 'center center',
                                            transition: isPinching ? 'none' : 'transform 0.2s ease-out',
                                            willChange: 'transform',
                                        } : { width: '100%', height: '100%' }}
                                    >
                                        <ProductImage
                                            src={imgSrc}
                                            alt={idx === 0 ? (producto.modelo || "Producto") : `Vista ${idx + 1}`}
                                            width={800}
                                            height={800}
                                            priority={idx === 0}
                                            loading="eager"
                                            quality={95}
                                            sizes="(max-width: 1024px) 100vw, 60vw"
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                        />
                                    </div>
                                </div>
                            ))}

                            {/* Blur Overlay */}
                            <div
                                ref={blurRef}
                                className="absolute inset-0 z-[2] backdrop-blur-[6px] opacity-0 transition-opacity duration-300 pointer-events-none"
                            />

                            {/* Lens Zoom */}
                            <div
                                ref={lensRef}
                                className="absolute w-48 h-48 md:w-64 md:h-64 rounded-full pointer-events-none border-2 border-primary/50 shadow-[0_0_30px_rgba(229,9,20,0.4)] opacity-0 transition-opacity duration-300 z-20 will-change-transform"
                                style={{
                                    backgroundImage: `url(${activeImage})`,
                                }}
                            />

                            {/* Badge de Zoom — solo desktop */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hidden md:flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                <Info className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-bold uppercase tracking-tighter">Pasa el mouse para zoom</span>
                            </div>

                            {/* Image counter badge — solo desktop */}
                            {galleryImages.length > 1 && (
                                <div className="absolute top-4 right-4 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-bold text-gray-300 hidden md:flex">
                                    {activeImageIdx + 1} / {galleryImages.length}
                                </div>
                            )}

                            {/* Flechas de navegación — solo cuando hay varias imágenes */}
                            {galleryImages.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                                        aria-label="Imagen anterior"
                                        className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 hover:border-primary/40 transition-all duration-200 opacity-70 md:opacity-0 md:group-hover:opacity-100 active:scale-90"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); goToNext(); }}
                                        aria-label="Imagen siguiente"
                                        className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 hover:border-primary/40 transition-all duration-200 opacity-70 md:opacity-0 md:group-hover:opacity-100 active:scale-90"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </>
                            )}

                            {/* Hint de gestos — solo mobile */}
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-black/65 backdrop-blur-sm rounded-full border border-white/10 flex md:hidden items-center pointer-events-none">
                                <span className="text-[9px] text-white/70 font-medium tracking-tight whitespace-nowrap">
                                    {imgScale > 1 ? '↕ Arrastra para moverte · doble tap para salir' : 'Desliza · pellizca · doble tap para zoom'}
                                </span>
                            </div>

                            {/* Dot indicators — solo mobile, sobre la imagen */}
                            {galleryImages.length > 1 && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex md:hidden gap-2">
                                    {galleryImages.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={(e) => { e.stopPropagation(); setActiveImageIdx(idx); manualPauseUntilRef.current = Date.now() + 8000; }}
                                            aria-label={`Imagen ${idx + 1}`}
                                            className={`rounded-full transition-all duration-300 ${activeImageIdx === idx ? 'w-5 h-2 bg-primary shadow-[0_0_8px_rgba(229,9,20,0.8)]' : 'w-2 h-2 bg-white/50'}`}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Barra de progreso auto-rotate */}
                            {galleryImages.length > 1 && !isHoveringImage && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5 z-30">
                                    <div
                                        key={activeImageIdx}
                                        className="h-full bg-primary/60 rounded-full"
                                        style={{
                                            animation: 'gallery-progress 5s linear infinite',
                                        }}
                                    />
                                </div>
                            )}
                        </motion.div>

                        {/* Título del producto — solo mobile */}
                        <div className="flex lg:hidden flex-col gap-2 pt-1">
                            <div className="flex items-center gap-3">
                                <TeamLogo src={producto.logoEquipo} alt={producto.equipo} size={52} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-2xl font-black tracking-tight text-white leading-none truncate">
                                        {producto.equipo}
                                    </p>
                                    <p className="text-primary font-bold text-xs uppercase tracking-widest mt-1.5 truncate">
                                        {producto.modelo}
                                    </p>
                                </div>
                                {showLiveBanner && (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary text-white shrink-0 animate-pulse shadow-[0_0_12px_rgba(229,9,20,0.6)]">
                                        ⚡ EN VIVO
                                    </span>
                                )}
                            </div>
                            <div className="flex items-baseline gap-2.5">
                                {precioActual > 0 ? (
                                    <>
                                        <span className="text-3xl font-black text-white tracking-tight">
                                            L {precioActual.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                        {precioOriginalActual?.active && precioOriginalActual.price > 0 && (
                                            <span className="text-gray-500 line-through text-base opacity-50">
                                                L {precioOriginalActual.price.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-2xl font-bold text-white">Consultar precio</span>
                                )}
                            </div>
                        </div>

                        {/* Thumbnails — solo desktop, múltiples imágenes */}
                        {galleryImages.length > 1 && (
                            <div className="hidden md:flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                                {galleryImages.map((imgSrc, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImageIdx(idx)}
                                        className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${activeImageIdx === idx ? 'border-primary shadow-[0_0_10px_rgba(229,9,20,0.4)]' : 'border-white/10 hover:border-white/30'}`}
                                        aria-label={`Ver imagen ${idx + 1}`}
                                    >
                                        <ProductImage
                                            src={imgSrc}
                                            alt={`Vista ${idx + 1}`}
                                            width={80}
                                            height={80}
                                            quality={70}
                                            loading="eager"
                                            className="w-full h-full object-contain bg-black/40"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}

                    </div>

                    {/* ⚙️ SECCIÓN PERSONALIZACIÓN */}
                    <div className="lg:col-span-5 flex flex-col gap-4">

                        {/* Header Info — solo desktop (en mobile se muestra debajo de la imagen) */}
                        <div className="hidden lg:flex flex-col gap-4">
                            <div className="flex items-start gap-4">
                                <TeamLogo src={producto.logoEquipo} alt={producto.equipo} size={56} />
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-none text-white">
                                            {producto.equipo}
                                        </h1>
                                        {showLiveBanner && (
                                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary text-white shadow-[0_0_12px_rgba(229,9,20,0.6)] animate-pulse shrink-0">
                                                ⚡ EN VIVO
                                            </span>
                                        )}
                                    </div>
                                    {liveMatch && (
                                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-primary/40 text-sm font-bold text-white">
                                            <span className="text-white">{liveMatch.homeTeam}</span>
                                            <span className="text-primary text-base">{liveMatch.homeScore} - {liveMatch.awayScore}</span>
                                            <span className="text-white">{liveMatch.awayTeam}</span>
                                            {liveMatch.minute && (
                                                <span className="text-gray-400 text-xs font-normal">{liveMatch.minute}&apos;</span>
                                            )}
                                        </div>
                                    )}
                                    <p className="text-primary font-semibold text-sm tracking-wide mt-2">
                                        {producto.modelo}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-baseline gap-3 mt-2">
                                {precioActual > 0 ? (
                                    <>
                                        <span className="text-4xl font-bold text-white tracking-tight">L {precioActual.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        {precioOriginalActual?.active && precioOriginalActual.price > 0 && (
                                            <span className="text-gray-500 line-through text-lg opacity-50">
                                                L {precioOriginalActual.price.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-3xl font-bold text-white tracking-wide">Consultar</span>
                                )}
                            </div>

                            <p className="text-gray-400 leading-relaxed text-sm md:text-base border-l-2 border-primary/30 pl-4 italic">
                                {producto.descripcion || "Diseño exclusivo con materiales de alta calidad para el máximo rendimiento y estilo."}
                            </p>
                        </div>

                        <div className="h-px bg-gradient-to-r from-white/10 to-transparent" />

                        {/* Opciones de Versión — ocultar si es única versión "Estándar" (precio único) */}
                        {opciones?.versiones && opciones.versiones.length > 0 &&
                         !(opciones.versiones.length === 1 && opciones.versiones[0].label === 'Estandar') && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-semibold text-gray-300">Versión</h3>
                                    {versionSeleccionada && <span className="text-xs text-primary font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Seleccionado</span>}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {opciones.versiones.map((v) => (
                                        <button
                                            key={v.id}
                                            onClick={() => {
                                                setVersionSeleccionada(v);
                                                setPrecioActual(opciones.preciosPorVersion?.[v.label] ?? producto.precio);
                                                setPrecioOriginalActual(opciones.originalesPorVersion?.[v.label] ?? null);
                                            }}
                                            className={`p-4 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group ${versionSeleccionada?.id === v.id
                                                ? "border-primary bg-primary/10"
                                                : "border-white/5 bg-white/5 hover:border-white/20"
                                                }`}
                                        >
                                            <span className={`block font-bold ${versionSeleccionada?.id === v.id ? "text-white" : "text-gray-400"}`}>{v.label}</span>
                                            <span className="text-[10px] text-gray-500 mt-1 block">L {opciones.preciosPorVersion?.[v.label]?.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            {versionSeleccionada?.id === v.id && <div className="absolute top-0 right-0 w-8 h-8 bg-primary flex items-center justify-center rounded-bl-xl"><CheckCircle2 className="w-4 h-4 text-white" /></div>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Opciones de Talla */}
                        {opciones?.tallas && opciones.tallas.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-gray-300">Talla</h3>
                                <div className="flex flex-wrap gap-2">
                                    {opciones.tallas
                                        .filter(t => {
                                            if (!versionSeleccionada || !opciones.variantSizesMap) return true;
                                            const allowedSizes = opciones.variantSizesMap[versionSeleccionada.id];
                                            return allowedSizes ? allowedSizes.includes(t.id) : true;
                                        })
                                        .map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => setTallaSeleccionada(t)}
                                                className={`w-12 h-12 md:w-14 md:h-14 rounded-xl border flex items-center justify-center font-bold transition-all duration-300 ${tallaSeleccionada?.id === t.id
                                                    ? "border-primary bg-primary text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]"
                                                    : "border-white/10 bg-white/5 hover:border-white/30 text-gray-400"
                                                    }`}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    {versionSeleccionada && opciones.variantSizesMap && (!opciones.variantSizesMap[versionSeleccionada.id] || opciones.variantSizesMap[versionSeleccionada.id].length === 0) && (
                                        <p className="text-xs text-red-400 italic">No hay tallas disponibles para esta versión.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Opciones de Parche */}
                        {opciones?.parches && opciones.parches.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-gray-300">Parche Oficial</h3>
                                <div className="flex flex-wrap gap-3">
                                    {opciones.parches.map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => setParcheSeleccionado(parcheSeleccionado?.id === p.id ? null : p)}
                                            className={`px-5 py-3 rounded-xl border text-sm font-bold transition-all duration-300 ${parcheSeleccionado?.id === p.id
                                                ? "border-primary bg-primary/10 text-white"
                                                : "border-white/10 bg-white/5 hover:border-white/30 text-gray-400"
                                                }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sección Dorsal */}
                        {producto.allows_customization !== false && (
                            <div className="space-y-4 p-5 rounded-3xl bg-white/5 border border-white/5">
                                <h3 className="text-sm font-semibold text-gray-300">Personalización de Dorsal</h3>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setQuiereDorsal(true);
                                            const hasPlayers = (opciones?.dorsales?.filter(d => d.jugador !== "Personalizado")?.length || 0) > 0;
                                            setModoDorsal(hasPlayers ? "jugador" : "personalizado");
                                        }}
                                        className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${quiereDorsal ? "border-primary bg-primary/20" : "border-white/10 hover:border-white/20 text-gray-500"}`}
                                    >
                                        SÍ, AGREGAR
                                    </button>
                                    <button
                                        onClick={() => { setQuiereDorsal(false); setModoDorsal(""); setJugadorSeleccionado(null); setNombrePersonalizado(""); setNumeroPersonalizado(""); }}
                                        className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${!quiereDorsal ? "border-white/40 bg-white/10" : "border-white/10 hover:border-white/20 text-gray-500"}`}
                                    >
                                        NO, GRACIAS
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {quiereDorsal && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-4 pt-4 overflow-hidden"
                                        >
                                            {(() => {
                                                const hasPlayers = (opciones?.dorsales?.filter(d => d.jugador !== "Personalizado")?.length || 0) > 0;
                                                return (
                                                    <>
                                                        {hasPlayers && (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => setModoDorsal("jugador")}
                                                                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${modoDorsal === "jugador" ? "border-primary text-primary" : "border-white/10 text-gray-500"}`}
                                                                >
                                                                    Jugador Real
                                                                </button>
                                                                <button
                                                                    onClick={() => setModoDorsal("personalizado")}
                                                                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${modoDorsal === "personalizado" ? "border-primary text-primary" : "border-white/10 text-gray-500"}`}
                                                                >
                                                                    Mi Nombre
                                                                </button>
                                                            </div>
                                                        )}

                                                        {modoDorsal === "jugador" && hasPlayers && (
                                                            <select
                                                                value={jugadorSeleccionado ? jugadorSeleccionado.id : ''}
                                                                onChange={(e) => {
                                                                    const selectedPlayer = opciones?.dorsales?.find(d => d.id === e.target.value);
                                                                    if (selectedPlayer) {
                                                                        setJugadorSeleccionado({
                                                                            id: selectedPlayer.id,
                                                                            numero: selectedPlayer.numero,
                                                                            nombre: selectedPlayer.jugador
                                                                        });
                                                                    } else {
                                                                        setJugadorSeleccionado(null);
                                                                    }
                                                                }}
                                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-primary outline-none"
                                                            >
                                                                <option value="">Selecciona una estrella...</option>
                                                                {opciones?.dorsales?.filter(d => d.jugador !== "Personalizado").map((d) => (
                                                                    <option key={d.id} value={d.id}>
                                                                        {d.numero ? `${d.numero}. ${d.jugador}` : d.jugador}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        )}

                                                        {modoDorsal === "personalizado" && (
                                                            <div className="flex flex-row gap-2 sm:gap-3">
                                                                <label htmlFor="numero-dorsal" className="sr-only">Número de dorsal</label>
                                                                <input
                                                                    id="numero-dorsal"
                                                                    type="text"
                                                                    placeholder="Nº"
                                                                    value={numeroPersonalizado}
                                                                    onChange={handleNumeroChange}
                                                                    maxLength={2}
                                                                    className="w-16 shrink-0 bg-black/40 border border-white/10 rounded-xl px-2 py-3 text-center font-black text-primary focus:border-primary outline-none"
                                                                />
                                                                <label htmlFor="nombre-dorsal" className="sr-only">Nombre de dorsal</label>
                                                                <input
                                                                    id="nombre-dorsal"
                                                                    type="text"
                                                                    placeholder="Ej. L. PALMA"
                                                                    value={nombrePersonalizado}
                                                                    onChange={handleNombreChange}
                                                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:border-primary outline-none uppercase"
                                                                />
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Botones: Añadir + Compartir */}
                        <div className="pt-4 space-y-2">
                            <p className="text-center text-[10px] text-gray-400 mb-3 uppercase tracking-[0.1em] font-medium">
                                {(() => {
                                    const now = new Date();
                                    const day = now.getDate();
                                    const month = now.getMonth();
                                    const year = now.getFullYear();

                                    let cutoffDate = new Date(year, month, day);

                                    // Determinar siguiente fecha de corte
                                    if (day <= 6) {
                                        cutoffDate = new Date(year, month, 6);
                                    } else if (day <= 16) {
                                        cutoffDate = new Date(year, month, 16);
                                    } else if (day <= 26) {
                                        cutoffDate = new Date(year, month, 26);
                                    } else {
                                        // Pasa al siguiente mes
                                        cutoffDate = new Date(year, month + 1, 6);
                                    }

                                    // Calcular rango de entrega (21 a 30 días después del corte)
                                    const start = new Date(cutoffDate);
                                    start.setDate(cutoffDate.getDate() + 21);

                                    const end = new Date(cutoffDate);
                                    end.setDate(cutoffDate.getDate() + 30);

                                    const fmt = new Intl.DateTimeFormat('es-HN', { day: 'numeric', month: 'long' });

                                    return `Entrega: ${fmt.format(start)} - ${fmt.format(end)}`;
                                })()}
                            </p>
                            <Button
                                onClick={handleAddToCart}
                                disabled={isAdding || precioActual <= 0}
                                className="w-full py-4 bg-primary hover:bg-primary-dark disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-[0_10px_30px_rgba(229,9,20,0.2)] flex items-center justify-center gap-2 text-base group relative overflow-hidden transition-all"
                            >
                                <AnimatePresence mode="wait">
                                    {isAdding ? (
                                        <motion.div
                                            key="loading"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="flex items-center gap-2"
                                        >
                                            <CheckCircle2 className="w-5 h-5 animate-pulse" />
                                            <span>AGREGANDO...</span>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="idle"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="flex items-center gap-2"
                                        >
                                            {precioActual > 0 ? (
                                                <>
                                                    <Shirt className="w-5 h-5 group-hover:rotate-12 transition-transform hidden md:block" />
                                                    <span className="font-bold tracking-wide">AÑADIR AL CARRITO</span>
                                                </>
                                            ) : (
                                                <span className="font-bold">NO DISPONIBLE</span>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Button>
                            <button
                                type="button"
                                onClick={handleShare}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/10 hover:border-white/25 text-gray-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
                            >
                                {copied ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        <span className="text-green-500">¡Link copiado!</span>
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="w-4 h-4" />
                                        <span>Compartir este kit</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 🔗 PRODUCTOS RELACIONADOS (Poster Style) */}
                {relatedProducts.length > 0 && (
                    <section className="mt-16">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center px-4">
                                También te podría interesar
                            </h2>
                            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
                            {relatedProducts.map((item) => (
                                <motion.div
                                    key={item.id}
                                    whileHover={{ y: -10 }}
                                    className="group relative bg-[#0a0a0a] rounded-[2rem] overflow-hidden border border-white/5 hover:border-primary/40 transition-all duration-700 cursor-pointer aspect-[4/5] shadow-xl"
                                    onMouseEnter={() => prefetch(`/producto/${item.slug || item.id}`)}
                                    onClick={() => {
                                        setLoading(true);
                                        navigate(`/producto/${item.slug || item.id}`);
                                    }}
                                >
                                    <div className="absolute inset-0">
                                        <ProductImage
                                            src={item.imagen}
                                            alt={item.modelo}
                                            width={300}
                                            height={400}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                                    </div>

                                    {item.logoEquipo && (
                                        <div className="absolute top-4 left-4 z-20">
                                            <TeamLogo src={item.logoEquipo} alt={item.equipo} size={36} />
                                        </div>
                                    )}

                                    <div className="absolute inset-0 z-10 flex flex-col justify-end p-4 sm:p-5">
                                        <div className="transform transition-transform duration-500 group-hover:-translate-y-2">
                                            <h3 className="text-sm sm:text-base font-black text-white leading-tight truncate">
                                                {item.equipo}
                                            </h3>
                                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70 truncate">
                                                {item.modelo}
                                            </p>
                                            <div className="mt-2 inline-block px-3 py-0.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-full">
                                                <p className="text-primary font-black text-xs sm:text-sm">
                                                    L {item.precio.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )}
            </div>


        </motion.main>
    );
}
