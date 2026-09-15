'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { SearchBarProps, SearchResult } from '@/types/search';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useSearchCatalog } from '@/hooks/useSearchCatalog';
import SearchResultsDropdown from '@/components/search/SearchResultsDropdown';
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
}: SearchBarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [shortcutKey, setShortcutKey] = useState('Ctrl');

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    const { recentSearches, saveSearch, removeSearch, clearSearches } = useRecentSearches();
    const { results, trendingSuggestions, topClubs, allClubs, loadCatalogData } =
        useSearchCatalog(value, enableLiveResults);

    useEffect(() => {
        setShortcutKey(getShortcutKey());
    }, []);

    // Auto-focus if requested
    useEffect(() => {
        if (autoFocus) {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [autoFocus]);

    // Auto-open when inside an overlay or when active
    useEffect(() => {
        const isInsideOverlay = containerRef.current?.closest('[data-search-overlay]');
        if (isInsideOverlay) {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, []);

    // Close on click outside with safe element connection checks
    useEffect(() => {
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
    }, [onClose]);

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
        onChange('');
        setActiveIndex(-1);
        inputRef.current?.focus();
    };

    const handleFocus = () => {
        loadCatalogData();
        setIsOpen(true);
    };

    const handleSelectTerm = (term: string, href?: string) => {
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
    const showPanel = isOpen && (hasQuery || recentSearches.length > 0 || trendingSuggestions.length > 0 || topClubs.length > 0);

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            {/* ─── Input Form ─── */}
            <form onSubmit={handleSubmit} className="relative z-50" role="search">
                <label htmlFor="search-input" className="sr-only">
                    Buscar productos
                </label>

                {/* Glass Background */}
                <div
                    className={`absolute inset-0 rounded-2xl transition-all duration-300 pointer-events-none ${
                        isOpen
                            ? 'bg-[#141414] border border-primary/40 ring-2 ring-primary/30 shadow-[0_0_30px_rgba(229,9,20,0.18)]'
                            : 'bg-white/5 border border-white/10 hover:border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.2)]'
                    }`}
                />

                <div className="relative flex items-center">
                    <button
                        type="submit"
                        aria-label="Buscar"
                        className="absolute left-3 md:left-4 p-1 text-gray-400 hover:text-white transition-colors duration-200 z-10 cursor-pointer"
                    >
                        <Search
                            className={`w-[18px] h-[18px] md:w-5 md:h-5 transition-colors duration-200 ${
                                isOpen ? 'text-primary drop-shadow-[0_0_6px_rgba(229,9,20,0.6)]' : ''
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
                        className="relative w-full py-3.5 md:py-4 pl-10 md:pl-12 pr-20 md:pr-32 bg-transparent text-[15px] md:text-base text-white placeholder-gray-500 outline-none rounded-2xl font-medium"
                    />

                    <div className="absolute right-3 md:right-4 flex items-center gap-1.5 z-10">
                        {value && (
                            <button
                                type="button"
                                onClick={handleClear}
                                aria-label="Limpiar búsqueda"
                                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
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

            {/* ─── Results Panel Docked Under Search Bar (NO full-screen blur) ─── */}
            <AnimatePresence>
                {showPanel && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed top-[calc(4rem+env(safe-area-inset-top,0px))] left-0 right-0 bottom-0 md:absolute md:top-full md:right-0 md:left-auto md:bottom-auto md:w-[480px] lg:w-[560px] md:max-w-[94vw] md:mt-2 bg-[#0a0a0a] md:bg-[#0e0e0e]/98 backdrop-blur-2xl border-t md:border border-white/10 md:rounded-2xl shadow-[0_24px_70px_rgba(0,0,0,0.85)] overflow-hidden z-[100]"
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
