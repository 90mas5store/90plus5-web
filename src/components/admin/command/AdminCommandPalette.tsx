'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
    Search,
    X,
    Package,
    Shirt,
    User,
    ArrowRight,
    MessageCircle,
    Loader2,
    DollarSign,
    Activity,
    FileSpreadsheet,
    CreditCard,
    LayoutTemplate,
    Radio,
    Tag,
    Clock,
    Plus,
    CheckCircle2,
    Truck,
    Factory,
    CornerDownLeft,
    Layers,
} from 'lucide-react';
import { getStatusColor, getStatusLabel } from '@/components/admin/OrderStatusBadge';
import { formatDate } from '@/lib/utils';
import type {
    AdminSearchOrderResult,
    AdminSearchProductResult,
    AdminSearchCustomerResult,
} from '@/app/api/admin/search/route';

interface QuickActionItem {
    id: string;
    title: string;
    subtitle: string;
    href: string;
    category: 'Operaciones' | 'Catálogo' | 'Finanzas' | 'Configuración' | 'Tienda';
    icon: any;
    keywords: string[];
}

const STATIC_QUICK_ACTIONS: QuickActionItem[] = [
    {
        id: 'new-product',
        title: 'Crear Nueva Camiseta',
        subtitle: 'Subir nuevo producto, tallas y variantes',
        href: '/admin/productos/nuevo',
        category: 'Catálogo',
        icon: Plus,
        keywords: ['nueva', 'crear', 'camiseta', 'producto', 'jersey', 'agregar'],
    },
    {
        id: 'catalogo-hub',
        title: 'Estructura del Catálogo (5 en 1)',
        subtitle: 'Gestionar Equipos, Ligas, Categorías, Marcas y Personalización',
        href: '/admin/catalogo',
        category: 'Catálogo',
        icon: Layers,
        keywords: ['catalogo', 'equipos', 'ligas', 'categorias', 'marcas', 'personalizacion', 'parches', 'tallas', 'dorsales'],
    },
    {
        id: 'verify-payments',
        title: 'Verificar Comprobantes (50%)',
        subtitle: 'Pedidos en espera de confirmación de transferencia',
        href: '/admin/orders?status=pending_payment_50',
        category: 'Operaciones',
        icon: CheckCircle2,
        keywords: ['verificar', 'transferencia', 'comprobante', 'banco', 'anticipo', '50%'],
    },
    {
        id: 'factory-orders',
        title: 'Pedidos para Fábrica',
        subtitle: 'Anticipos pagados listos para encargar al proveedor',
        href: '/admin/orders?status=deposit_paid',
        category: 'Operaciones',
        icon: Factory,
        keywords: ['fabrica', 'proveedor', 'encargar', 'china', 'lista', 'ordenar'],
    },
    {
        id: 'transit-orders',
        title: 'Pedidos en Tránsito',
        subtitle: 'Paquetes despachados en camino a Honduras',
        href: '/admin/orders?status=in_transit',
        category: 'Operaciones',
        icon: Truck,
        keywords: ['transito', 'aduana', 'envio', 'camino', 'viaje'],
    },
    {
        id: 'ready-orders',
        title: 'Por Cobrar Saldo (50%)',
        subtitle: 'Pedidos listos en tienda para cobrar restante y entregar',
        href: '/admin/orders?status=ready_for_delivery',
        category: 'Operaciones',
        icon: DollarSign,
        keywords: ['saldo', 'cobrar', 'restante', 'entrega', 'listo'],
    },
    {
        id: 'coupons',
        title: 'Descuentos & Cupones',
        subtitle: 'Administrar promociones y códigos de descuento',
        href: '/admin/descuentos',
        category: 'Finanzas',
        icon: Tag,
        keywords: ['descuento', 'cupon', 'promocion', 'codigo', 'rebaja'],
    },
    {
        id: 'analytics',
        title: 'Analíticas & Visitas',
        subtitle: 'Métricas de tráfico, conversión y mapa horario',
        href: '/admin/orders?tab=analiticas',
        category: 'Operaciones',
        icon: Activity,
        keywords: ['analiticas', 'visitas', 'metricas', 'graficos', 'trafico', 'estadisticas'],
    },
    {
        id: 'accounting',
        title: 'Contabilidad & Utilidades',
        subtitle: 'Reporte de ingresos, costos y margen neto',
        href: '/admin/contabilidad',
        category: 'Finanzas',
        icon: DollarSign,
        keywords: ['contabilidad', 'utilidad', 'ganancia', 'margen', 'costo', 'ingresos'],
    },
    {
        id: 'reports',
        title: 'Lista Fábrica (Exportador)',
        subtitle: 'Exportar órdenes pagadas a Excel / WhatsApp proveedor',
        href: '/admin/orders?tab=fabrica',
        category: 'Operaciones',
        icon: FileSpreadsheet,
        keywords: ['reportes', 'fabrica', 'exportar', 'excel', 'lista'],
    },
    {
        id: 'vip-crm',
        title: 'Clientes VIP & Lealtad',
        subtitle: 'Ranking de compradores top y fidelización',
        href: '/admin/orders?tab=clientes',
        category: 'Operaciones',
        icon: User,
        keywords: ['clientes', 'crm', 'vip', 'lealtad', 'compradores'],
    },
    {
        id: 'settings-banks',
        title: 'Cuentas de Banco & Pagos',
        subtitle: 'Configuración de Ficohsa, BAC, Atlántida y PixelPay',
        href: '/admin/settings/bancos',
        category: 'Finanzas',
        icon: CreditCard,
        keywords: ['bancos', 'cuentas', 'bac', 'ficohsa', 'atlantida', 'pixelpay', 'transferencia'],
    },
    {
        id: 'settings-system',
        title: 'Sistema & Seguridad (4 en 1)',
        subtitle: 'Administradores, Auditoría, Tasa de Cambio y Papelera',
        href: '/admin/settings',
        category: 'Configuración',
        icon: Clock,
        keywords: ['configuracion', 'sistema', 'admins', 'auditoria', 'tasa', 'dolar', 'papelera'],
    },
    {
        id: 'escaparate-studio',
        title: 'Escaparate & Home Studio',
        subtitle: 'Control total de la portada: banners, avisos y matchday',
        href: '/admin/escaparate',
        category: 'Tienda',
        icon: LayoutTemplate,
        keywords: ['escaparate', 'home', 'portada', 'tienda', 'studio'],
    },
    {
        id: 'settings-banners',
        title: 'Banners de Inicio (Hero)',
        subtitle: 'Carrusel principal y llamadas a la acción',
        href: '/admin/escaparate?tab=banners',
        category: 'Tienda',
        icon: LayoutTemplate,
        keywords: ['banners', 'hero', 'slider', 'inicio', 'portada'],
    },
    {
        id: 'settings-marquee',
        title: 'Marquesina de Avisos',
        subtitle: 'Avisos de envíos CAEX y fechas de corte',
        href: '/admin/escaparate?tab=marquesina',
        category: 'Tienda',
        icon: Tag,
        keywords: ['marquesina', 'avisos', 'envios', 'corte', 'banner superior'],
    },
    {
        id: 'settings-matchday',
        title: 'Fútbol en Vivo & Matchday',
        subtitle: 'Resultados en directo, torneos ESPN y partidos activos',
        href: '/admin/escaparate?tab=matchday',
        category: 'Tienda',
        icon: Radio,
        keywords: ['matchday', 'espn', 'partidos', 'en vivo', 'torneos'],
    },
];

type SearchCategoryTab = 'all' | 'orders' | 'products' | 'customers' | 'actions';

export default function AdminCommandPalette() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState<SearchCategoryTab>('all');
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState<AdminSearchOrderResult[]>([]);
    const [products, setProducts] = useState<AdminSearchProductResult[]>([]);
    const [customers, setCustomers] = useState<AdminSearchCustomerResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);
    const resultsContainerRef = useRef<HTMLDivElement>(null);

    // Escuchar atajos de teclado globales y evento personalizado
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+K o Ctrl+K
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsOpen((prev) => !prev);
                return;
            }

            // Tecla "/" cuando no se está escribiendo en ningún input
            if (
                e.key === '/' &&
                !['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement?.tagName || ''))
            ) {
                e.preventDefault();
                setIsOpen(true);
                return;
            }

            // Escape para cerrar
            if (e.key === 'Escape' && isOpen) {
                e.preventDefault();
                setIsOpen(false);
            }
        };

        const handleCustomOpen = () => {
            setIsOpen(true);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('open-admin-command-palette', handleCustomOpen);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('open-admin-command-palette', handleCustomOpen);
        };
    }, [isOpen]);

    // Enfocar input automáticamente al abrir
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        } else {
            document.body.style.overflow = '';
            setQuery('');
            setOrders([]);
            setProducts([]);
            setCustomers([]);
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Debounced search query
    useEffect(() => {
        const trimmed = query.trim();
        if (trimmed.length < 2) {
            setOrders([]);
            setProducts([]);
            setCustomers([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/admin/search?q=${encodeURIComponent(trimmed)}`);
                if (!res.ok) throw new Error('Error al buscar');
                const data = await res.json();
                setOrders(data.orders || []);
                setProducts(data.products || []);
                setCustomers(data.customers || []);
            } catch (err) {
                console.error('Error buscando:', err);
            } finally {
                setLoading(false);
            }
        }, 180);

        return () => clearTimeout(timer);
    }, [query]);

    // Filtrar acciones estáticas por búsqueda
    const filteredActions = useMemo(() => {
        const q = query.toLowerCase().trim();
        if (!q) return STATIC_QUICK_ACTIONS.slice(0, 6);
        return STATIC_QUICK_ACTIONS.filter(
            (action) =>
                action.title.toLowerCase().includes(q) ||
                action.subtitle.toLowerCase().includes(q) ||
                action.keywords.some((kw) => kw.includes(q))
        );
    }, [query]);

    // Lista consolidada de resultados para navegación por flechas
    const flatItems = useMemo(() => {
        const items: { type: 'order' | 'product' | 'customer' | 'action'; data: any; href: string }[] = [];

        if (activeTab === 'all' || activeTab === 'actions') {
            filteredActions.forEach((a) => items.push({ type: 'action', data: a, href: a.href }));
        }
        if (activeTab === 'all' || activeTab === 'orders') {
            orders.forEach((o) => items.push({ type: 'order', data: o, href: `/admin/orders/${o.id}` }));
        }
        if (activeTab === 'all' || activeTab === 'products') {
            products.forEach((p) => items.push({ type: 'product', data: p, href: `/admin/productos/editar/${p.id}` }));
        }
        if (activeTab === 'all' || activeTab === 'customers') {
            customers.forEach((c) => items.push({ type: 'customer', data: c, href: `/admin/orders?q=${encodeURIComponent(c.phone || c.name)}` }));
        }

        return items;
    }, [activeTab, filteredActions, orders, products, customers]);

    // Manejar navegación con teclado
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1 < flatItems.length ? prev + 1 : 0));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : flatItems.length - 1));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (flatItems[selectedIndex]) {
                    const target = flatItems[selectedIndex];
                    setIsOpen(false);
                    router.push(target.href);
                }
            }
        },
        [flatItems, selectedIndex, router]
    );

    // Formatear mensaje de WhatsApp para pedidos
    const getOrderWhatsAppUrl = (order: AdminSearchOrderResult) => {
        const rawPhone = order.customer_phone.replace(/\D/g, '');
        const phone = rawPhone.length === 8 ? `504${rawPhone}` : rawPhone;
        const shortId = order.id.slice(0, 8).toUpperCase();
        const text = encodeURIComponent(
            `¡Hola ${order.customer_name}! Te saludamos de 90+5 Store sobre tu pedido #${shortId}. ¿Cómo podemos ayudarte?`
        );
        return `https://wa.me/${phone}?text=${text}`;
    };

    const getCustomerWhatsAppUrl = (customer: AdminSearchCustomerResult) => {
        const rawPhone = customer.phone.replace(/\D/g, '');
        const phone = rawPhone.length === 8 ? `504${rawPhone}` : rawPhone;
        const text = encodeURIComponent(`¡Hola ${customer.name}! Te saludamos de 90+5 Store. ¿Cómo podemos colaborarte hoy?`);
        return `https://wa.me/${phone}?text=${text}`;
    };

    if (!isOpen) return null;

    const hasResults = orders.length > 0 || products.length > 0 || customers.length > 0 || filteredActions.length > 0;
    const isSearching = query.trim().length >= 2;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col md:items-center md:justify-start md:pt-16 lg:pt-20">
            {/* BACKDROP */}
            <div
                className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity duration-200"
                onClick={() => setIsOpen(false)}
            />

            {/* MODAL PALETTE CONTAINER */}
            <div
                className={`
                    relative z-10 w-full flex flex-col bg-[#07080a] border-white/15 text-white overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.95)]
                    h-full md:h-auto md:max-h-[85vh] md:max-w-3xl md:rounded-3xl md:border
                    before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent
                `}
                onKeyDown={handleKeyDown}
            >
                {/* 🔍 TOP SEARCH BAR (Alta ergonomía táctil en móvil) */}
                <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-white/10 bg-black/60 shrink-0">
                    <div className="p-2 rounded-xl bg-white/5 text-gray-400">
                        {loading ? (
                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        ) : (
                            <Search className="w-5 h-5 text-gray-300" />
                        )}
                    </div>

                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                        placeholder="Buscar pedido (#REF o cliente), camiseta, teléfono o acción..."
                        className="flex-1 bg-transparent text-base sm:text-sm text-white placeholder:text-gray-500 outline-none font-medium"
                    />

                    {query && (
                        <button
                            type="button"
                            onClick={() => {
                                setQuery('');
                                inputRef.current?.focus();
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white bg-white/5 active:scale-95 transition-transform"
                            aria-label="Limpiar búsqueda"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 transition-colors cursor-pointer active:scale-95 shrink-0"
                    >
                        Cerrar
                    </button>
                </div>

                {/* 🏷️ FILTER TABS (Apple Segmented Control Limpio) */}
                <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/[0.06] overflow-x-auto no-scrollbar bg-black/40 shrink-0">
                    <button
                        type="button"
                        onClick={() => setActiveTab('all')}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                            activeTab === 'all'
                                ? 'bg-white text-black shadow-sm font-bold'
                                : 'text-neutral-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        Todo
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('orders')}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'orders'
                                ? 'bg-white text-black shadow-sm font-bold'
                                : 'text-neutral-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Package className="w-3.5 h-3.5" />
                        <span>Pedidos</span>
                        {orders.length > 0 && (
                            <span className="text-[10px] font-mono opacity-80">
                                {orders.length}
                            </span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('products')}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'products'
                                ? 'bg-white text-black shadow-sm font-bold'
                                : 'text-neutral-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Shirt className="w-3.5 h-3.5" />
                        <span>Camisetas</span>
                        {products.length > 0 && (
                            <span className="text-[10px] font-mono opacity-80">
                                {products.length}
                            </span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('customers')}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'customers'
                                ? 'bg-white text-black shadow-sm font-bold'
                                : 'text-neutral-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <User className="w-3.5 h-3.5" />
                        <span>Clientes</span>
                        {customers.length > 0 && (
                            <span className="text-[10px] font-mono opacity-80">
                                {customers.length}
                            </span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('actions')}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                            activeTab === 'actions'
                                ? 'bg-white text-black shadow-sm font-bold'
                                : 'text-neutral-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        Acciones
                    </button>
                </div>

                {/* 📜 LISTA DE RESULTADOS (Scroll táctil fluido) */}
                <div
                    ref={resultsContainerRef}
                    className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar"
                    style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
                >
                    {/* ESTADO VACÍO (Sin resultados tras buscar) */}
                    {isSearching && !loading && !hasResults && (
                        <div className="py-12 text-center space-y-3">
                            <div className="w-12 h-12 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500">
                                <Search className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-bold text-gray-300">
                                No se encontraron resultados para &quot;{query}&quot;
                            </p>
                            <p className="text-xs text-gray-500 max-w-sm mx-auto">
                                Intenta buscar por los primeros caracteres del código de pedido, el nombre del cliente o equipo.
                            </p>
                        </div>
                    )}

                    {/* 1. SECCIÓN DE ACCIONES RÁPIDAS (Visible siempre o filtrada) */}
                    {(activeTab === 'all' || activeTab === 'actions') && filteredActions.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between px-2 mb-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                                    {isSearching ? 'Acciones Coincidentes' : 'Atajos Más Usados'}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {filteredActions.map((action) => {
                                    const ActionIcon = action.icon;
                                    return (
                                        <Link
                                            key={action.id}
                                            href={action.href}
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 transition-all active:scale-[0.98] group"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-white/5 group-hover:bg-primary/20 border border-white/10 group-hover:border-primary/30 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors shrink-0">
                                                <ActionIcon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="block text-xs font-bold text-white group-hover:text-primary transition-colors truncate">
                                                    {action.title}
                                                </span>
                                                <span className="block text-[11px] text-gray-500 truncate mt-0.5">
                                                    {action.subtitle}
                                                </span>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 2. SECCIÓN DE PEDIDOS COINCIDENTES */}
                    {(activeTab === 'all' || activeTab === 'orders') && orders.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between px-2 mb-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                                    <Package className="w-3 h-3" /> Pedidos ({orders.length})
                                </span>
                            </div>
                            <div className="space-y-2">
                                {orders.map((order) => {
                                    const shortRef = order.id.slice(0, 8).toUpperCase();
                                    const statusColor = getStatusColor(order.status);
                                    const statusLabel = getStatusLabel(order.status);

                                    return (
                                        <div
                                            key={order.id}
                                            className="p-3 sm:p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group relative"
                                        >
                                            <Link
                                                href={`/admin/orders/${order.id}`}
                                                onClick={() => setIsOpen(false)}
                                                className="flex-1 min-w-0 flex items-start gap-3"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col items-center justify-center shrink-0">
                                                    <span className="text-[9px] font-mono font-bold text-cyan-400">#</span>
                                                    <span className="text-[10px] font-mono font-black text-white">{shortRef.slice(0, 4)}</span>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
                                                            {order.customer_name}
                                                        </span>
                                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${statusColor}`}>
                                                            {statusLabel}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-1 flex-wrap">
                                                        <span className="font-mono text-gray-400">#{shortRef}</span>
                                                        {order.customer_city && <span>📍 {order.customer_city}</span>}
                                                        <span suppressHydrationWarning>{formatDate(order.created_at)}</span>
                                                    </div>
                                                </div>
                                            </Link>

                                            <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                                                <span className="text-xs font-black font-mono text-white">
                                                    L {order.total_amount.toLocaleString('es-HN')}
                                                </span>

                                                {order.customer_phone && (
                                                    <a
                                                        href={getOrderWhatsAppUrl(order)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold active:scale-95 transition-all"
                                                        title="Contactar al cliente por WhatsApp"
                                                    >
                                                        <MessageCircle className="w-3.5 h-3.5 fill-current" />
                                                        <span className="hidden sm:inline">WhatsApp</span>
                                                    </a>
                                                )}

                                                <Link
                                                    href={`/admin/orders/${order.id}`}
                                                    onClick={() => setIsOpen(false)}
                                                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                                >
                                                    <ArrowRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 3. SECCIÓN DE CAMISETAS COINCIDENTES */}
                    {(activeTab === 'all' || activeTab === 'products') && products.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between px-2 mb-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                                    <Shirt className="w-3 h-3" /> Camisetas del Catálogo ({products.length})
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {products.map((product) => (
                                    <Link
                                        key={product.id}
                                        href={`/admin/productos/editar/${product.id}`}
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 transition-all active:scale-[0.98] group"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-black border border-white/10 overflow-hidden relative shrink-0 flex items-center justify-center">
                                            {product.image_url ? (
                                                <Image
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    fill
                                                    sizes="48px"
                                                    className="object-cover group-hover:scale-105 transition-transform"
                                                />
                                            ) : (
                                                <Shirt className="w-5 h-5 text-gray-600" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-bold text-white group-hover:text-primary transition-colors truncate">
                                                    {product.name}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                                                {product.team_name && <span className="truncate">{product.team_name}</span>}
                                                {product.season && (
                                                    <span className="font-mono bg-white/10 px-1.5 py-0.2 rounded text-gray-300">
                                                        {product.season}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-xs font-mono font-bold text-white">
                                                    {product.price > 0 ? `L ${product.price.toLocaleString('es-HN')}` : 'Sin precio'}
                                                </span>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                                    product.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                                }`}>
                                                    {product.active ? 'Activa' : 'Inactiva'}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 4. SECCIÓN DE CLIENTES (CRM Rápido) */}
                    {(activeTab === 'all' || activeTab === 'customers') && customers.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between px-2 mb-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                    <User className="w-3 h-3" /> Clientes Encontrados ({customers.length})
                                </span>
                            </div>
                            <div className="space-y-2">
                                {customers.map((customer, idx) => (
                                    <div
                                        key={customer.phone || customer.email || idx}
                                        className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 flex items-center justify-between gap-3 group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 font-bold text-xs">
                                                {customer.name.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <span className="block text-xs font-bold text-white truncate">
                                                    {customer.name}
                                                </span>
                                                <span className="block text-[11px] font-mono text-gray-500 truncate">
                                                    {customer.phone || customer.email || 'Sin contacto'}
                                                    {customer.city ? ` • ${customer.city}` : ''}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-2 py-1 rounded-lg">
                                                {customer.totalOrders} {customer.totalOrders === 1 ? 'pedido' : 'pedidos'}
                                            </span>

                                            {customer.phone && (
                                                <a
                                                    href={getCustomerWhatsAppUrl(customer)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold active:scale-95 transition-all"
                                                >
                                                    <MessageCircle className="w-3.5 h-3.5 fill-current" />
                                                    <span className="hidden sm:inline">Chat</span>
                                                </a>
                                            )}

                                            <Link
                                                href={`/admin/orders?q=${encodeURIComponent(customer.phone || customer.name)}`}
                                                onClick={() => setIsOpen(false)}
                                                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                                title="Ver todos los pedidos de este cliente"
                                            >
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ⌨️ FOOTER CON ATAJOS (Solo desktop) */}
                <div className="hidden sm:flex items-center justify-between px-4 py-2.5 border-t border-white/[0.06] bg-black/80 text-[11px] text-neutral-400 shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5">
                            <kbd className="px-2 py-0.5 rounded bg-white/10 text-neutral-300 font-mono text-[10px]">Ctrl + K</kbd>
                            <span>Abrir</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 font-mono text-[10px]">↑↓</kbd>
                            <span>Navegar</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 font-mono text-[10px]">↵</kbd>
                            <span>Seleccionar</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 font-mono text-[10px]">ESC</kbd>
                            <span>Cerrar</span>
                        </span>
                    </div>

                    <span className="font-mono text-neutral-500">
                        90+5 Admin Console
                    </span>
                </div>
            </div>
        </div>
    );
}

