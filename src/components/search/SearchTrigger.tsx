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
                                        className={`xl:hidden relative p-2.5 sm:p-3 rounded-2xl text-gray-400 hover:text-white transition-all duration-300 group cursor-pointer ${className}`}
                                    >
                                        <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <Search className="w-5 h-5 relative z-10 group-hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.4)] transition-all duration-300" />
                                    </button>

                                    {/* Pill en escritorio grande (≥1280px) */}
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(true)}
                                        aria-label="Buscar productos"
                                        className={`hidden xl:flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-primary/40 text-gray-400 hover:text-white transition-all duration-300 group cursor-pointer shadow-inner w-[240px] 2xl:w-[280px] ${className}`}
                                    >
                                        <Search className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors duration-300 shrink-0" />
                                        <span className="text-xs text-gray-400 group-hover:text-gray-200 transition-colors truncate flex-1 text-left">
                                            {placeholder}
                                        </span>
                                        <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-gray-400 bg-white/5 group-hover:bg-primary/20 group-hover:text-primary border border-white/10 group-hover:border-primary/40 rounded transition-all">
                                            {shortcutKey}
                                        </kbd>
                                    </button>
                                </>
                            ) : isPill ? (
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(true)}
                                    aria-label="Buscar productos"
                                    className={`flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-primary/40 text-gray-400 hover:text-white transition-all duration-300 group cursor-pointer shadow-inner ${className}`}
                                >
                                    <Search className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors duration-300 shrink-0" />
                                    <span className="text-xs text-gray-400 group-hover:text-gray-200 transition-colors truncate flex-1 text-left">
                                        {placeholder}
                                    </span>
                                    <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-gray-400 bg-white/5 border border-white/10 rounded">
                                        {shortcutKey}
                                    </kbd>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(true)}
                                    aria-label="Buscar productos"
                                    className={`relative p-2.5 sm:p-3 rounded-2xl text-gray-400 hover:text-white transition-all duration-300 group cursor-pointer ${className}`}
                                >
                                    <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <Search className="w-5 h-5 relative z-10 group-hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.4)] transition-all duration-300" />
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
                className={`md:hidden relative p-2.5 rounded-2xl text-gray-400 hover:text-white transition-all duration-300 group cursor-pointer ${className}`}
            >
                <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Search className="w-5 h-5 relative z-10 group-hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.4)] transition-all duration-300" />
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
                                className="md:hidden fixed top-0 left-0 right-0 z-[120] bg-[#0a0a0a] border-b border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.85)]"
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
                                        className="p-2 -ml-1 text-gray-400 hover:text-white active:scale-95 transition-all rounded-xl cursor-pointer"
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
                                        className="px-2.5 py-1.5 text-xs font-bold text-gray-400 hover:text-white active:scale-95 transition-all uppercase tracking-wider shrink-0 cursor-pointer"
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
