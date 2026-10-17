'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from '@/lib/motion';
import { Search, X } from 'lucide-react';
import SearchBar from '@/components/ui/SearchBar';
import { triggerHaptic } from '@/components/header/haptics';
import { usePrefersReducedMotion } from '@/hooks/useOptimization';
import { useSearchCatalog } from '@/hooks/useSearchCatalog';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import SearchResultsDropdown from '@/components/search/SearchResultsDropdown';
import { SearchResult } from '@/types/search';

interface SearchTriggerProps {
    className?: string;
    variant?: 'icon' | 'pill' | 'responsive';
    placeholder?: string;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export default function SearchTrigger({
    className = '',
    variant = 'icon',
    placeholder = 'Buscar camiseta, equipo, liga...',
    isOpen: propIsOpen,
    onOpenChange,
}: SearchTriggerProps) {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isControlled = propIsOpen !== undefined;
    const isOpen = isControlled ? propIsOpen : internalIsOpen;

    const setIsOpen = useCallback(
        (v: boolean) => {
            if (isControlled) {
                onOpenChange?.(v);
            } else {
                setInternalIsOpen(v);
            }
        },
        [isControlled, onOpenChange]
    );

    const [searchValue, setSearchValue] = useState('');
    const [mounted, setMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [shortcutKey, setShortcutKey] = useState('Ctrl K');
    const desktopContainerRef = useRef<HTMLDivElement>(null);

    const prefersReducedMotion = usePrefersReducedMotion();

    useEffect(() => {
        setMounted(true);
        if (typeof navigator !== 'undefined') {
            const isMac = navigator.platform?.toLowerCase().includes('mac') || navigator.userAgent?.toLowerCase().includes('mac');
            setShortcutKey(isMac ? '⌘K' : 'Ctrl K');
        }
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Bloquear scroll de fondo en móvil mientras la búsqueda esté activa
    useEffect(() => {
        if (isOpen && isMobile) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isOpen, isMobile]);

    // Cmd+K / Ctrl+K to open, Escape to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsOpen(!isOpen);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
                setSearchValue('');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, setIsOpen]);

    const router = useRouter();
    const mobileInputRef = useRef<HTMLInputElement>(null);
    const mobileResultsRef = useRef<HTMLDivElement>(null);

    const { recentSearches, saveSearch, removeSearch, clearSearches } = useRecentSearches();
    const { results, trendingSuggestions, topClubs, allClubs, loadCatalogData, isLoading } =
        useSearchCatalog(searchValue, isOpen && isMobile);

    useEffect(() => {
        if (isOpen && isMobile) {
            loadCatalogData();
            const timer = setTimeout(() => {
                mobileInputRef.current?.focus();
            }, 60);
            return () => clearTimeout(timer);
        }
    }, [isOpen, isMobile, loadCatalogData]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setSearchValue('');
    }, [setIsOpen]);

    const navigateToResult = useCallback(
        (item: SearchResult) => {
            triggerHaptic(12);
            saveSearch(item.title);
            handleClose();
            router.push(item.href);
        },
        [handleClose, router, saveSearch]
    );

    const handleSubmitSearch = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (!searchValue.trim()) return;
            triggerHaptic(10);
            saveSearch(searchValue.trim());
            handleClose();
            router.push(`/catalogo?query=${encodeURIComponent(searchValue.trim())}`);
        },
        [searchValue, handleClose, router, saveSearch]
    );

    const handleSelectTerm = useCallback(
        (term: string, href?: string) => {
            triggerHaptic(8);
            setSearchValue(term);
            saveSearch(term);
            if (href) {
                handleClose();
                router.push(href);
            } else {
                mobileInputRef.current?.focus();
            }
        },
        [handleClose, router, saveSearch]
    );

    const isPill = variant === 'pill';
    const isResponsive = variant === 'responsive';

    return (
        <div ref={desktopContainerRef} className="relative flex items-center">
            {/* ═══════════════════════════════════════════════════════════════
                DESKTOP IN-HEADER ORGANIC SEARCH (≥768px)
                Se expande fluidamente sin desplazar bruscamente los elementos
            ═══════════════════════════════════════════════════════════════ */}
            <div className="hidden md:flex items-center">
                <AnimatePresence initial={false} mode="wait">
                    {isOpen && !isMobile ? (
                        <motion.div
                            key="expanded-search"
                            initial={{ width: 220, opacity: 0 }}
                            animate={{ width: isResponsive ? 460 : 380, opacity: 1 }}
                            exit={{ width: 220, opacity: 0 }}
                            transition={
                                prefersReducedMotion
                                    ? { duration: 0.15 }
                                    : { type: 'spring', damping: 30, stiffness: 350, mass: 0.8 }
                            }
                            className="relative z-50 w-[340px] lg:w-[460px] xl:w-[540px]"
                        >
                            <SearchBar
                                value={searchValue}
                                onChange={setSearchValue}
                                onNavigate={handleClose}
                                onClose={handleClose}
                                showCloseButton
                                placeholder={placeholder}
                                enableLiveResults
                                autoFocus
                                className="w-full"
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="trigger-button"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            {isResponsive ? (
                                <>
                                    {/* Icono en tablet (768px a 1279px) */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            triggerHaptic(10);
                                            setIsOpen(true);
                                        }}
                                        aria-label="Buscar productos"
                                        className={`xl:hidden relative w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/[0.12] active:scale-90 border border-white/10 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-all shadow-sm cursor-pointer ${className}`}
                                    >
                                        <Search className="w-4 h-4" />
                                    </button>

                                    {/* Pill Spotlight en escritorio grande (≥1280px) */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            triggerHaptic(10);
                                            setIsOpen(true);
                                        }}
                                        aria-label="Buscar productos"
                                        className={`hidden xl:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.10] active:scale-98 border border-white/10 hover:border-white/25 text-white/60 hover:text-white transition-all duration-200 backdrop-blur-md shadow-sm cursor-pointer w-[240px] 2xl:w-[270px] ${className}`}
                                    >
                                        <Search className="w-3.5 h-3.5 text-white/50 group-hover:text-white transition-colors shrink-0" />
                                        <span className="text-xs text-white/50 group-hover:text-white/80 transition-colors truncate flex-1 text-left tracking-tight">
                                            {placeholder}
                                        </span>
                                        <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded-md bg-white/10 text-white/70 border border-white/15 shadow-sm">
                                            {shortcutKey}
                                        </kbd>
                                    </button>
                                </>
                            ) : isPill ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        triggerHaptic(10);
                                        setIsOpen(true);
                                    }}
                                    aria-label="Buscar productos"
                                    className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.10] active:scale-98 border border-white/10 hover:border-white/25 text-white/60 hover:text-white transition-all duration-200 backdrop-blur-md shadow-sm cursor-pointer ${className}`}
                                >
                                    <Search className="w-3.5 h-3.5 text-white/50 group-hover:text-white transition-colors shrink-0" />
                                    <span className="text-xs text-white/50 group-hover:text-white/80 transition-colors truncate flex-1 text-left tracking-tight">
                                        {placeholder}
                                    </span>
                                    <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded-md bg-white/10 text-white/70 border border-white/15 shadow-sm">
                                        {shortcutKey}
                                    </kbd>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => {
                                        triggerHaptic(10);
                                        setIsOpen(true);
                                    }}
                                    aria-label="Buscar productos"
                                    className={`relative w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/[0.12] active:scale-90 border border-white/10 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-all shadow-sm cursor-pointer ${className}`}
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                MOBILE SEARCH TRIGGER BUTTON (<768px)
            ═══════════════════════════════════════════════════════════════ */}
            <button
                type="button"
                onClick={() => {
                    triggerHaptic(12);
                    setIsOpen(true);
                }}
                aria-label="Buscar productos"
                className={`md:hidden relative w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] active:scale-90 border border-white/10 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-all shadow-sm cursor-pointer ${className}`}
            >
                <Search className="w-4 h-4" />
            </button>

            {/* ═══════════════════════════════════════════════════════════════
                MOBILE FULL SCREEN SPOTLIGHT SEARCH TAKEOVER (<768px)
                Apple Fluid Interface Standard: Translúcido, física de resorte,
                specular hairline y control gestual limpio.
            ═══════════════════════════════════════════════════════════════ */}
            {mounted && isMobile &&
                createPortal(
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                                transition={
                                    prefersReducedMotion
                                        ? { duration: 0.15 }
                                        : { type: 'spring', damping: 30, stiffness: 350, mass: 0.8 }
                                }
                                className="md:hidden fixed inset-0 z-[120] bg-[#090a0f] flex flex-col h-[100dvh] w-screen"
                            >
                                {/* Header bar con specular hairline */}
                                <div
                                    className="relative flex items-center gap-2.5 px-3.5 shrink-0 border-b border-white/[0.08] bg-[#0c0d12]/95 backdrop-blur-2xl"
                                    style={{
                                        paddingTop: 'env(safe-area-inset-top, 0px)',
                                        height: 'calc(4rem + env(safe-area-inset-top, 0px))',
                                    }}
                                >
                                    {/* Specular light hairline catching light across the bottom */}
                                    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                                    {/* Input de Búsqueda Integrado Spotlight */}
                                    <form onSubmit={handleSubmitSearch} className="flex-1 relative" role="search">
                                        <div className="relative flex items-center">
                                            <Search className="absolute left-3 w-[17px] h-[17px] text-white/45 pointer-events-none" />
                                            <input
                                                ref={mobileInputRef}
                                                type="text"
                                                placeholder={placeholder}
                                                value={searchValue}
                                                onChange={(e) => setSearchValue(e.target.value)}
                                                autoComplete="off"
                                                className="w-full py-2 pl-9 pr-9 bg-white/[0.08] text-[16px] text-white placeholder-white/40 outline-none rounded-xl font-medium tracking-tight border border-white/12 shadow-[0_2px_12px_rgba(0,0,0,0.25)] focus:border-white/30 transition-all"
                                            />
                                            {searchValue && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        triggerHaptic(6);
                                                        setSearchValue('');
                                                        mobileInputRef.current?.focus();
                                                    }}
                                                    aria-label="Limpiar búsqueda"
                                                    className="absolute right-2.5 w-5 h-5 rounded-full bg-white/15 hover:bg-white/25 active:scale-90 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </form>

                                    {/* Botón Cancelar Estilo iOS Spotlight (Single intuitive action) */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            triggerHaptic(6);
                                            handleClose();
                                        }}
                                        aria-label="Cancelar búsqueda"
                                        className="px-2 py-1 text-[15px] font-medium text-white/70 hover:text-white active:scale-95 active:text-white/40 transition-all tracking-tight shrink-0 cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                </div>

                                {/* Body con Sugerencias y Resultados en el flujo natural de flexbox */}
                                <div className="flex-1 min-h-0 w-full overflow-hidden bg-[#090a0f]">
                                    <SearchResultsDropdown
                                        value={searchValue}
                                        results={results}
                                        activeIndex={-1}
                                        recentSearches={recentSearches}
                                        trendingSuggestions={trendingSuggestions}
                                        topClubs={topClubs}
                                        allClubs={allClubs}
                                        resultsRef={mobileResultsRef}
                                        isLoading={isLoading}
                                        onNavigateResult={navigateToResult}
                                        onSubmitSearch={handleSubmitSearch}
                                        onSelectTerm={handleSelectTerm}
                                        onClearRecent={clearSearches}
                                        onRemoveRecent={removeSearch}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
        </div>
    );
}
