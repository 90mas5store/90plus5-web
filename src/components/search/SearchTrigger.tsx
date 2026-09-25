'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from '@/lib/motion';
import { Search, ArrowLeft } from 'lucide-react';
import SearchBar from '@/components/ui/SearchBar';

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

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setSearchValue('');
    }, [setIsOpen]);

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
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
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
                                        onClick={() => setIsOpen(true)}
                                        aria-label="Buscar productos"
                                        className={`xl:hidden relative w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/[0.12] active:scale-90 border border-white/10 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-all shadow-sm cursor-pointer ${className}`}
                                    >
                                        <Search className="w-4 h-4" />
                                    </button>

                                    {/* Pill Spotlight en escritorio grande (≥1280px) */}
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(true)}
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
                                    onClick={() => setIsOpen(true)}
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
                                    onClick={() => setIsOpen(true)}
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
                onClick={() => setIsOpen(true)}
                aria-label="Buscar productos"
                className={`md:hidden relative w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] active:scale-90 border border-white/10 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-all shadow-sm cursor-pointer ${className}`}
            >
                <Search className="w-4 h-4" />
            </button>

            {/* ═══════════════════════════════════════════════════════════════
                MOBILE ORGANIC HEADER SEARCH TAKEOVER (<768px)
                Con Safe-Area Inset nativo para iPhones con Notch/Dynamic Island
            ═══════════════════════════════════════════════════════════════ */}
            {mounted && isMobile &&
                createPortal(
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{ y: -80, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -80, opacity: 0 }}
                                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                                className="md:hidden fixed top-0 left-0 right-0 z-[120] bg-[#0c0d12]/95 backdrop-blur-3xl border-b border-white/12 shadow-[0_16px_40px_rgba(0,0,0,0.85)]"
                                style={{
                                    paddingTop: 'env(safe-area-inset-top, 0px)',
                                }}
                            >
                                <div className="flex items-center gap-2 px-3 h-16">
                                    {/* Botón de Retroceso Orgánico */}
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        aria-label="Volver y cerrar búsqueda"
                                        className="p-2 text-white/60 hover:text-white active:scale-90 transition-all rounded-full cursor-pointer"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>

                                    {/* Input de Búsqueda Integrado */}
                                    <div className="flex-1 min-w-0">
                                        <SearchBar
                                            value={searchValue}
                                            onChange={setSearchValue}
                                            onNavigate={handleClose}
                                            onClose={handleClose}
                                            showCloseButton={false}
                                            placeholder="Buscar camiseta, equipo, liga..."
                                            enableLiveResults
                                            autoFocus
                                            className="w-full"
                                        />
                                    </div>

                                    {/* Botón de Cancelar Único */}
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        aria-label="Cancelar búsqueda"
                                        className="px-2.5 py-1.5 text-xs font-semibold text-white/60 hover:text-white active:scale-95 transition-all tracking-tight shrink-0 cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
        </div>
    );
}
