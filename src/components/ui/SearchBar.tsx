'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { SearchBarProps, SearchResult } from '@/types/search';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useSearchCatalog } from '@/hooks/useSearchCatalog';
import SearchResultsDropdown from '@/components/search/SearchResultsDropdown';
import { triggerHaptic } from '@/components/header/haptics';
import { usePrefersReducedMotion } from '@/hooks/useOptimization';
export { default as SearchTrigger } from '@/components/search/SearchTrigger';

function getShortcutKey(): string {
    if (typeof navigator === 'undefined') return 'Ctrl';
    return navigator.platform?.toLowerCase().includes('mac') ? '⌘' : 'Ctrl';
}

export default function SearchBar({
    value,
    onChange,
    onSearch,
    onNavigate,
    placeholder = 'Buscar por equipo, jugador (ej. Vini), liga...',
    className = '',
    enableLiveResults = true,
    autoFocus = false,
    onClose,
    showCloseButton = false,
    isMobileModal = false,
}: SearchBarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(autoFocus || isMobileModal || false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [shortcutKey, setShortcutKey] = useState('Ctrl');

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    const { recentSearches, saveSearch, removeSearch, clearSearches } = useRecentSearches();
    const { results, trendingSuggestions, topClubs, allClubs, loadCatalogData, isLoading } =
        useSearchCatalog(value, enableLiveResults);

    const prefersReducedMotion = usePrefersReducedMotion();

    useEffect(() => {
        setShortcutKey(getShortcutKey());
    }, []);

    // Auto-focus and pre-load catalog if requested or in mobile takeover
    useEffect(() => {
        if (autoFocus || isMobileModal) {
            setIsOpen(true);
            loadCatalogData();
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [autoFocus, isMobileModal, loadCatalogData]);

    // Auto-open when inside an overlay or when active
    useEffect(() => {
        const isInsideOverlay = containerRef.current?.closest('[data-search-overlay]');
        if (isInsideOverlay) {
            setIsOpen(true);
            loadCatalogData();
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [loadCatalogData]);

    // Close on click outside with safe element connection checks
    useEffect(() => {
        if (isMobileModal) return; // In mobile takeover, closing is handled by back/cancel buttons
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node | null;
            // Ignore if event was already handled or target is detached from DOM
            if (event.defaultPrevented || !target || !target.isConnected) return;

            const isInsideContainer = containerRef.current?.contains(target);
            const isInsideResults = resultsRef.current?.contains(target);

            if (!isInsideContainer && !isInsideResults) {
                setIsOpen(false);
                onClose?.();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose, isMobileModal]);

    // Reset active index when query changes
    useEffect(() => {
        setActiveIndex(-1);
    }, [value]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        onClose?.();
    }, [onClose]);

    const navigateToResult = useCallback(
        (item: SearchResult) => {
            triggerHaptic(12);
            saveSearch(item.title);
            setIsOpen(false);
            onChange('');
            onNavigate?.();
            onClose?.();
            router.push(item.href);
        },
        [onNavigate, onClose, onChange, router, saveSearch]
    );

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (!value.trim()) return;
            triggerHaptic(10);
            saveSearch(value.trim());
            setIsOpen(false);
            onNavigate?.();
            onClose?.();
            if (onSearch) {
                onSearch(e);
            } else {
                router.push(`/catalogo?query=${encodeURIComponent(value.trim())}`);
            }
        },
        [value, onNavigate, onClose, onSearch, router, saveSearch]
    );

    // Keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
                inputRef.current?.blur();
                return;
            }

            const itemCount = results.length + (value.trim().length >= 2 ? 1 : 0);
            if (itemCount === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((prev) => (prev + 1) % itemCount);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((prev) => (prev - 1 + itemCount) % itemCount);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (activeIndex >= 0 && activeIndex < results.length) {
                    navigateToResult(results[activeIndex]);
                } else {
                    handleSubmit(e as unknown as React.FormEvent);
                }
            }
        },
        [results, value, activeIndex, navigateToResult, handleSubmit, handleClose]
    );

    // Scroll active item into view
    useEffect(() => {
        if (activeIndex < 0 || !resultsRef.current) return;
        const items = resultsRef.current.querySelectorAll('[data-search-item]');
        items[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

    const handleClear = () => {
        triggerHaptic(6);
        onChange('');
        setActiveIndex(-1);
        inputRef.current?.focus();
    };

    const handleFocus = () => {
        loadCatalogData();
        setIsOpen(true);
    };

    const handleSelectTerm = (term: string, href?: string) => {
        triggerHaptic(8);
        onChange(term);
        saveSearch(term);
        // If an explicit href is specified (like a direct filter link), navigate
        if (href && !pathname?.includes('/catalogo')) {
            setIsOpen(false);
            onClose?.();
            router.push(href);
        } else {
            // Keep search open and focused so user sees the live results in the search dropdown!
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    };

    const hasQuery = value.trim().length >= 2;
    const showPanel =
        (isOpen && (hasQuery || recentSearches.length > 0 || trendingSuggestions.length > 0 || topClubs.length > 0)) ||
        (isMobileModal && isOpen);

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            {/* ─── Input Form con Estética Apple Glass ─── */}
            <form onSubmit={handleSubmit} className="relative z-50" role="search">
                <label htmlFor="search-input" className="sr-only">
                    Buscar productos
                </label>

                {/* Glass Background */}
                <div
                    className={`absolute inset-0 transition-all duration-200 pointer-events-none ${
                        isMobileModal
                            ? 'rounded-xl bg-white/[0.08] border border-white/12 shadow-[0_2px_12px_rgba(0,0,0,0.25)]'
                            : isOpen
                            ? 'rounded-2xl bg-[#141414] border border-primary/40 ring-2 ring-primary/30 shadow-[0_0_30px_rgba(229,9,20,0.18)]'
                            : 'rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.2)]'
                    }`}
                />

                <div className="relative flex items-center">
                    <button
                        type="submit"
                        aria-label="Buscar"
                        className="absolute left-3 md:left-4 p-1 text-white/45 hover:text-white transition-colors duration-200 z-10 cursor-pointer"
                    >
                        <Search
                            className={`w-[17px] h-[17px] md:w-5 md:h-5 transition-colors duration-200 ${
                                isOpen ? 'text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]' : ''
                            }`}
                        />
                    </button>

                    <input
                        ref={inputRef}
                        id="search-input"
                        type="text"
                        placeholder={placeholder}
                        value={value}
                        onFocus={handleFocus}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoComplete="off"
                        className={
                            isMobileModal
                                ? "relative w-full py-2.5 pl-9 pr-9 bg-transparent text-[16px] text-white placeholder-white/40 outline-none rounded-xl font-medium tracking-tight"
                                : "relative w-full py-3.5 md:py-4 pl-10 md:pl-12 pr-20 md:pr-32 bg-transparent text-[15px] md:text-base text-white placeholder-gray-500 outline-none rounded-2xl font-medium"
                        }
                    />

                    <div className="absolute right-2.5 md:right-4 flex items-center gap-1.5 z-10">
                        {value && (
                            <button
                                type="button"
                                onClick={handleClear}
                                aria-label="Limpiar búsqueda"
                                className="w-5 h-5 rounded-full bg-white/15 hover:bg-white/25 active:scale-90 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}

                        {/* Botón Orgánico de Cerrar (Solo Desktop cuando showCloseButton es true) */}
                        {showCloseButton ? (
                            <button
                                type="button"
                                onClick={handleClose}
                                aria-label="Cerrar búsqueda"
                                className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/15 border border-white/10 transition-all cursor-pointer active:scale-95"
                            >
                                <span>Cerrar</span>
                                <kbd className="text-[10px] text-gray-400 font-mono">Esc</kbd>
                            </button>
                        ) : (
                            <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-gray-500 font-mono">
                                {shortcutKey === '⌘' ? (
                                    <span className="text-[11px]">⌘</span>
                                ) : (
                                    <span className="text-[10px]">Ctrl</span>
                                )}
                                <span>K</span>
                            </kbd>
                        )}
                    </div>
                </div>
            </form>

            {/* ─── Results Panel Docked Under Search Bar (Apple Translucent Sheet) ─── */}
            <AnimatePresence>
                {showPanel && (
                    <motion.div
                        initial={
                            prefersReducedMotion
                                ? { opacity: 0 }
                                : { opacity: 0, y: isMobileModal ? 0 : -6, scale: isMobileModal ? 1 : 0.98 }
                        }
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={
                            prefersReducedMotion
                                ? { opacity: 0 }
                                : { opacity: 0, y: isMobileModal ? 0 : -6, scale: isMobileModal ? 1 : 0.98 }
                        }
                        transition={
                            prefersReducedMotion
                                ? { duration: 0.15 }
                                : { type: 'spring', damping: 32, stiffness: 360, mass: 0.85 }
                        }
                        className={
                            isMobileModal
                                ? "fixed top-[calc(4rem+env(safe-area-inset-top,0px))] left-0 right-0 bottom-0 bg-[#090a0f] border-t border-white/[0.08] overflow-hidden z-[110]"
                                : "fixed top-[calc(4rem+env(safe-area-inset-top,0px))] left-0 right-0 bottom-0 md:absolute md:top-full md:right-0 md:left-auto md:bottom-auto md:w-[480px] lg:w-[560px] md:max-w-[94vw] md:mt-2 bg-[#090a0f]/95 md:bg-[#0e0e0e]/98 backdrop-blur-3xl border-t md:border border-white/[0.08] md:rounded-2xl shadow-[0_24px_70px_rgba(0,0,0,0.85)] overflow-hidden z-[100]"
                        }
                    >
                        <SearchResultsDropdown
                            value={value}
                            results={results}
                            activeIndex={activeIndex}
                            recentSearches={recentSearches}
                            trendingSuggestions={trendingSuggestions}
                            topClubs={topClubs}
                            allClubs={allClubs}
                            resultsRef={resultsRef}
                            isLoading={isLoading}
                            onNavigateResult={navigateToResult}
                            onSubmitSearch={handleSubmit}
                            onSelectTerm={handleSelectTerm}
                            onClearRecent={clearSearches}
                            onRemoveRecent={removeSearch}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
