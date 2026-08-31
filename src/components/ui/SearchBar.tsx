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
}: SearchBarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [shortcutKey, setShortcutKey] = useState('Ctrl');

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    const { recentSearches, saveSearch, clearSearches } = useRecentSearches();
    const { results, trendingSuggestions, topClubs, loadCatalogData } =
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

    // Auto-open when inside an overlay
    useEffect(() => {
        const isInsideOverlay = containerRef.current?.closest('[data-search-overlay]');
        if (isInsideOverlay) {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, []);

    // Close on click outside (standalone mode)
    useEffect(() => {
        const isInsideOverlay = containerRef.current?.closest('[data-search-overlay]');
        if (isInsideOverlay) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset active index when query changes
    useEffect(() => {
        setActiveIndex(-1);
    }, [value]);

    const navigateToResult = useCallback(
        (item: SearchResult) => {
            saveSearch(item.title);
            setIsOpen(false);
            onChange('');
            onNavigate?.();
            router.push(item.href);
        },
        [onNavigate, onChange, router, saveSearch]
    );

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (!value.trim()) return;
            saveSearch(value.trim());
            setIsOpen(false);
            onNavigate?.();
            if (onSearch) {
                onSearch(e);
            } else {
                router.push(`/catalogo?query=${encodeURIComponent(value.trim())}`);
            }
        },
        [value, onNavigate, onSearch, router, saveSearch]
    );

    // Keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
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
        [results, value, activeIndex, navigateToResult, handleSubmit]
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
        if (href && !pathname?.includes('/catalogo')) {
            setIsOpen(false);
            router.push(href);
        } else if (!pathname?.includes('/catalogo')) {
            setIsOpen(false);
            router.push(`/catalogo?query=${encodeURIComponent(term)}`);
        }
    };

    const hasQuery = value.trim().length >= 2;
    const showPanel = isOpen && (hasQuery || recentSearches.length > 0 || trendingSuggestions.length > 0 || topClubs.length > 0);

    return (
        <div ref={containerRef} className={`relative w-full max-w-xl ${className}`}>
            {/* ─── Input ─── */}
            <form onSubmit={handleSubmit} className="relative z-50" role="search">
                <label htmlFor="search-input" className="sr-only">
                    Buscar productos
                </label>

                {/* Glass Background */}
                <div
                    className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                        isOpen
                            ? 'bg-white/10 backdrop-blur-2xl border border-white/20 ring-2 ring-primary/40 shadow-[0_0_40px_rgba(229,9,20,0.15)]'
                            : 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.2)]'
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
                                isOpen ? 'text-primary' : ''
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
                        className="relative w-full py-3.5 md:py-4 pl-10 md:pl-12 pr-20 md:pr-24 bg-transparent text-[15px] md:text-base text-white placeholder-gray-500 outline-none rounded-2xl"
                    />

                    <div className="absolute right-3 md:right-4 flex items-center gap-1.5">
                        {value && (
                            <button
                                type="button"
                                onClick={handleClear}
                                aria-label="Limpiar búsqueda"
                                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-all duration-200 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                        <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-gray-500 font-mono">
                            {shortcutKey === '⌘' ? (
                                <span className="text-[11px]">⌘</span>
                            ) : (
                                <span className="text-[10px]">Ctrl</span>
                            )}
                            <span>K</span>
                        </kbd>
                    </div>
                </div>
            </form>

            {/* ─── Results Panel ─── */}
            <AnimatePresence>
                {showPanel && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute top-full left-0 right-0 mt-2 bg-[#111111] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] overflow-hidden z-[100]"
                    >
                        <SearchResultsDropdown
                            value={value}
                            results={results}
                            activeIndex={activeIndex}
                            recentSearches={recentSearches}
                            trendingSuggestions={trendingSuggestions}
                            topClubs={topClubs}
                            resultsRef={resultsRef}
                            onNavigateResult={navigateToResult}
                            onSubmitSearch={handleSubmit}
                            onSelectTerm={handleSelectTerm}
                            onClearRecent={clearSearches}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Mobile Backdrop ─── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
