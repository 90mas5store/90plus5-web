'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from '@/lib/motion';
import { Search, X } from 'lucide-react';
import SearchBar from '@/components/ui/SearchBar';

interface SearchTriggerProps {
    className?: string;
}

export default function SearchTrigger({ className = '' }: SearchTriggerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Cmd+K / Ctrl+K to open, Escape to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
                setSearchValue('');
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Auto-focus input when opened
    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => {
                const input = document.querySelector<HTMLInputElement>(
                    '[data-search-overlay] #search-input'
                );
                input?.focus();
            });
        }
    }, [isOpen]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setSearchValue('');
    }, []);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                aria-label="Buscar productos"
                className={`relative p-3 rounded-2xl text-gray-400 hover:text-white transition-all duration-300 group cursor-pointer ${className}`}
            >
                <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Search className="w-5 h-5 relative z-10 group-hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.4)] transition-all duration-300" />
            </button>

            {/* Spotlight / Command-Center Overlay */}
            {mounted &&
                createPortal(
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="fixed inset-0 z-[200] flex flex-col justify-start md:items-center p-3 md:p-6 bg-black/75 backdrop-blur-md overflow-y-auto"
                                onClick={handleClose}
                            >
                                <motion.div
                                    data-search-overlay
                                    initial={{ y: -20, scale: 0.96, opacity: 0 }}
                                    animate={{ y: 0, scale: 1, opacity: 1 }}
                                    exit={{ y: -20, scale: 0.96, opacity: 0 }}
                                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                    className="relative w-full max-w-2xl mt-2 md:mt-[8vh]"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Mobile Close Button Header */}
                                    <div className="flex items-center justify-between pb-2 md:hidden">
                                        <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                                            <span>⚡</span> Explorador 90+5
                                        </span>
                                        <button
                                            onClick={handleClose}
                                            className="p-1 text-gray-400 hover:text-white"
                                            aria-label="Cerrar búsqueda"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <SearchBar
                                        value={searchValue}
                                        onChange={setSearchValue}
                                        onNavigate={handleClose}
                                        placeholder="Buscar por equipo, jugador (ej. Vini), liga..."
                                        enableLiveResults
                                        autoFocus
                                        className="w-full"
                                    />
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
        </>
    );
}
