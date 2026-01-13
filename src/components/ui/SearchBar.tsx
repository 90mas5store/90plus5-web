"use client";

import { Search, X, Shirt, ArrowRight } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { getCatalog } from "../../lib/api";
import { Product } from "../../lib/types";
import ProductImage from "../ProductImage";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    onSearch?: (e: React.FormEvent) => void;
    placeholder?: string;
    className?: string;
    /** Si es true, muestra un dropdown con resultados rápidos mientras escribes */
    enableLiveResults?: boolean;
}

export default function SearchBar({
    value,
    onChange,
    onSearch,
    placeholder = "Buscar...",
    className = "",
    enableLiveResults = true,
}: SearchBarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [catalog, setCatalog] = useState<Product[]>([]);
    const [isFocused, setIsFocused] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Cargar catálogo para resultados en vivo
    useEffect(() => {
        if (enableLiveResults) {
            getCatalog().then(setCatalog).catch(console.error);
        }
    }, [enableLiveResults]);

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const normalize = (s: string) =>
        (s || "")
            .toString()
            .toLowerCase()
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "");

    const results = useMemo(() => {
        if (!value || value.length < 2 || !enableLiveResults) return [];
        const q = normalize(value);
        return catalog
            .filter((p) =>
                normalize(p.equipo).includes(q) ||
                normalize(p.modelo).includes(q)
            )
            .slice(0, 5); // Mostrar máximo 5 resultados rápidos
    }, [value, catalog, enableLiveResults]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsFocused(false);
        if (onSearch) {
            onSearch(e);
        } else if (value.trim()) {
            router.push(`/catalogo?query=${encodeURIComponent(value.trim())}`);
        }
    };

    const handleClear = () => {
        onChange("");
        inputRef.current?.focus();
    };

    const handleResultClick = (product: Product) => {
        setIsFocused(false);
        router.push(`/producto/${product.slug || product.id}`);
    };

    // No mostrar resultados si estamos en la página de catálogo (allí ya se filtran los productos del grid)
    const isCatalogPage = pathname?.includes("/catalogo");
    const showDropdown = isFocused && value.length >= 2 && results.length > 0 && !isCatalogPage;

    return (
        <div ref={containerRef} className={`relative w-full max-w-xl ${className}`}>
            <form onSubmit={handleSubmit} className="relative z-50">
                <div className={`absolute inset-0 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 transition-all duration-300 ${isFocused ? 'ring-2 ring-primary/50 border-primary/30 shadow-[0_0_30px_rgba(229,9,20,0.15)]' : 'shadow-[0_0_25px_rgba(255,255,255,0.05)]'}`} />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onFocus={() => setIsFocused(true)}
                    onChange={(e) => onChange(e.target.value)}
                    className="relative w-full py-3 md:py-4 pl-10 md:pl-12 pr-10 md:pr-12 bg-transparent text-xs md:text-sm text-white placeholder-gray-400 outline-none rounded-2xl"
                />
                <Search
                    onClick={handleSubmit}
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${isFocused ? 'text-primary' : 'text-gray-400'} cursor-pointer hover:text-white`}
                />

                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </form>

            {/* Dropdown de resultados rápidos */}
            <AnimatePresence>
                {showDropdown && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-neutral-900/95 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[100]"
                    >
                        <div className="p-2">
                            {results.map((product) => (
                                <button
                                    key={product.id}
                                    onClick={() => handleResultClick(product)}
                                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 group transition-colors text-left"
                                >
                                    <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/5 bg-neutral-800">
                                        <ProductImage
                                            src={product.imagen}
                                            alt={product.modelo}
                                            width={50}
                                            height={60}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">
                                            {product.equipo}
                                        </h4>
                                        <p className="text-xs text-gray-400 truncate uppercase tracking-wider">
                                            {product.modelo}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-primary">
                                            L {product.precio.toLocaleString()}
                                        </p>
                                        <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all ml-auto mt-1" />
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="p-3 bg-white/5 border-t border-white/5">
                            <button
                                onClick={handleSubmit}
                                className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-[0.2em]"
                            >
                                <Search className="w-3 h-3" />
                                Ver todos los resultados para "{value}"
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
