'use client';

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getProductOptionsFromSupabase, getPlayersByTeam, getRelatedProducts } from "@/lib/api";
import HeatmapBackground from "@/components/HeatmapBackground";
import TeamLogo from "@/components/TeamLogo";
import ProductImage from "@/components/ProductImage";
import Button from "@/components/ui/MainButton";
import { useCart } from "@/context/CartContext";
import useToastMessage from "@/hooks/useToastMessage";
import { ArrowLeft, Shirt, CheckCircle2, Info } from "lucide-react";
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
    description: string;
    image_url: string;
    team_id: string;
    teams?: Team;
    product_variants?: ProductVariant[];
    modelo?: string;
    equipo?: string;
    liga?: string;
    imagen?: string;
    logoEquipo?: string;
    precio?: number;
    descripcion?: string;
    slug?: string;
    league_id?: string;
    category_id?: string;
}

interface ProductoPersonalizarProps {
    product: Product;
}

export default function ProductoPersonalizar({ product }: ProductoPersonalizarProps) {
    const router = useRouter();
    const { addItem, openCart } = useCart();
    const toast = useToastMessage();
    const { prefetch, navigate } = usePrefetch();
    const prefersReducedMotion = usePrefersReducedMotion();

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
        parches?: { id: string; label: string }[]
    }>({ dorsales: [], preciosPorVersion: {}, originalesPorVersion: {} });
    const [relatedProducts, setRelatedProducts] = useState<LibProduct[]>([]);
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


    // Referencias para zoom
    const containerRef = useRef<HTMLDivElement>(null);
    const lensRef = useRef<HTMLDivElement>(null);
    const blurRef = useRef<HTMLDivElement>(null);

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
                dorsales = players.map((p: any) => ({
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

            const related = await getRelatedProducts(product.id, product.league_id, product.category_id);
            setRelatedProducts(related);
            setLoading(false);
        }
        cargarOpciones();
    }, [product.id]);

    // === MANEJO DEL ZOOM (Mouse + Touch) ===
    const handleZoomMove = (e: React.MouseEvent | React.TouchEvent) => {
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
        if (lensRef.current) lensRef.current.style.opacity = "1";
        if (blurRef.current) blurRef.current.style.opacity = "1";
    };

    const handleLeave = () => {
        if (lensRef.current) lensRef.current.style.opacity = "0";
        if (blurRef.current) blurRef.current.style.opacity = "0";
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
            className={`min-h-screen text-white pt-24 pb-20 px-4 md:px-8 relative overflow-hidden bg-gradient-to-b ${getAuraColors(producto.liga)}`}
        >
            <HeatmapBackground liga={producto.liga} opacity={0.1} />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* 🔙 Botón Volver */}
                <button
                    onClick={() => router.back()}
                    className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-all group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-widest">Regresar</span>
                </button>

                <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">

                    {/* 🖼️ SECCIÓN IMAGEN */}
                    <div className="lg:col-span-7">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            className="relative aspect-[4/5] md:aspect-square rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl group cursor-crosshair p-0"
                            ref={containerRef}
                            onMouseMove={handleZoomMove}
                            onTouchMove={handleZoomMove}
                            onMouseEnter={handleEnter}
                            onTouchStart={handleEnter}
                            onMouseLeave={handleLeave}
                            onTouchEnd={handleLeave}
                        >
                            <ProductImage
                                src={producto.imagen}
                                alt={producto.modelo || "Producto"}
                                width={800}
                                height={800}
                                priority
                                quality={95}
                                sizes="(max-width: 1024px) 100vw, 60vw"
                                className="w-full h-full object-contain transition-transform duration-1000 group-hover:scale-105"
                            />

                            {/* Blur Overlay */}
                            <div
                                ref={blurRef}
                                className="absolute inset-0 backdrop-blur-[6px] opacity-0 transition-opacity duration-300 pointer-events-none"
                            />

                            {/* Lens Zoom */}
                            <div
                                ref={lensRef}
                                className="absolute w-48 h-48 md:w-64 md:h-64 rounded-full pointer-events-none border-2 border-primary/50 shadow-[0_0_30px_rgba(229,9,20,0.4)] opacity-0 transition-opacity duration-300 z-20 will-change-transform"
                                style={{
                                    backgroundImage: `url(${producto.imagen})`,
                                }}
                            />

                            {/* Badge de Zoom */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                <Info className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-bold uppercase tracking-tighter">Pasa el mouse o toca para zoom</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* ⚙️ SECCIÓN PERSONALIZACIÓN */}
                    <div className="lg:col-span-5 flex flex-col gap-4">

                        {/* Header Info */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-start gap-4">
                                <TeamLogo src={producto.logoEquipo} alt={producto.equipo} size={56} />
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-none text-white">
                                        {producto.equipo}
                                    </h1>
                                    <p className="text-primary font-semibold text-sm tracking-wide mt-2">
                                        {producto.modelo}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-baseline gap-3 mt-2">
                                {precioActual > 0 ? (
                                    <>
                                        <span className="text-4xl font-bold text-white tracking-tight">L {precioActual.toLocaleString()}</span>
                                        {precioOriginalActual?.active && precioOriginalActual.price > 0 && (
                                            <span className="text-gray-500 line-through text-lg opacity-50">
                                                L {precioOriginalActual.price.toLocaleString()}
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

                        {/* Opciones de Versión */}
                        {opciones?.versiones && opciones.versiones.length > 0 && (
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
                                            <span className="text-[10px] text-gray-500 mt-1 block">L {opciones.preciosPorVersion?.[v.label]?.toLocaleString()}</span>
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
                                    {opciones.tallas.map((t) => (
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
                        <div className="space-y-2 p-5 rounded-3xl bg-white/5 border border-white/5">
                            <h3 className="text-sm font-semibold text-gray-300">Personalización de Dorsal</h3>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setQuiereDorsal(true); setModoDorsal("jugador"); }}
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

                                        {modoDorsal === "jugador" && (
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
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <input
                                                    type="text"
                                                    placeholder="Nº"
                                                    value={numeroPersonalizado}
                                                    onChange={handleNumeroChange}
                                                    maxLength={2}
                                                    className="w-full sm:w-16 bg-black/40 border border-white/10 rounded-xl px-2 py-3 text-center font-black text-primary focus:border-primary outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Ej. L. PALMA"
                                                    value={nombrePersonalizado}
                                                    onChange={handleNombreChange}
                                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:border-primary outline-none uppercase"
                                                />
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Botón Final */}
                        <div className="pt-4">
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
                                                    <Shirt className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                                    <span className="font-bold tracking-wide">AÑADIR AL CARRITO</span>
                                                </>
                                            ) : (
                                                <span className="font-bold">NO DISPONIBLE</span>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Button>
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
                                                    L {item.precio.toLocaleString()}
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
