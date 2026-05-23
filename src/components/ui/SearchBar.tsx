"use client";

import { Search, X, ArrowRight, Clock, TrendingUp, Sparkles, Shirt } from "lucide-react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { getCatalog, getConfig } from "../../lib/api";
import { Product, Category, League } from "../../lib/types";
import ProductImage from "../ProductImage";
import Image from "next/image";
import { motion, AnimatePresence } from "@/lib/motion";
import { useRouter, usePathname } from "next/navigation";

// ─── Types ───
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (e: React.FormEvent) => void;
  placeholder?: string;
  className?: string;
  enableLiveResults?: boolean;
}

interface SearchResult {
  type: "product" | "category" | "league";
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  price?: number;
  href: string;
}

// ─── LocalStorage helpers ───
const RECENT_KEY = "90plus5_recent_searches";
const MAX_RECENT = 6;

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecentSearch(term: string) {
  if (typeof window === "undefined" || !term.trim()) return;
  const recent = getRecentSearches().filter(
    (s) => s.toLowerCase() !== term.toLowerCase()
  );
  recent.unshift(term.trim());
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

function clearRecentSearches() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RECENT_KEY);
}

// ─── Normalize for fuzzy matching ───
const normalize = (s: string) =>
  (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

// ─── Highlight matched text ───
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 2) return <>{text}</>;
  const normalizedText = normalize(text);
  const normalizedQuery = normalize(query);
  const idx = normalizedText.indexOf(normalizedQuery);
  if (idx === -1) return <>{text}</>;

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length);

  return (
    <>
      {before}
      <span className="text-primary font-bold">{match}</span>
      {after}
    </>
  );
}

// ─── Trending suggestions (static) ───
const TRENDING_SUGGESTIONS = [
  "Real Madrid",
  "Barcelona",
  "Liverpool",
  "Retro",
  "PSG",
  "Jordan",
];

// ─── Main Component ───
export default function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = "Buscar equipos, ligas, productos...",
  className = "",
  enableLiveResults = true,
}: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load catalog + config for live results
  useEffect(() => {
    if (!enableLiveResults) return;
    getCatalog().then(setCatalog).catch(console.error);
    getConfig().then((cfg) => {
      if (cfg) {
        setCategories(cfg.categorias || []);
        setLeagues(cfg.ligas || []);
      }
    }).catch(console.error);
  }, [enableLiveResults]);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Auto-open when inside an overlay (SearchTrigger)
  useEffect(() => {
    const isInsideOverlay = containerRef.current?.closest("[data-search-overlay]");
    if (isInsideOverlay) {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, []);

  // Close on click outside (only when standalone, not inside overlay)
  useEffect(() => {
    const isInsideOverlay = containerRef.current?.closest("[data-search-overlay]");
    if (isInsideOverlay) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cmd+K / Ctrl+K — only register when SearchBar is standalone (not inside SearchTrigger overlay)
  useEffect(() => {
    const isInsideOverlay = containerRef.current?.closest("[data-search-overlay]");
    if (isInsideOverlay) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Build search results
  const results = useMemo((): SearchResult[] => {
    if (!value || value.length < 2 || !enableLiveResults) return [];
    const q = normalize(value);
    const items: SearchResult[] = [];

    // Categories
    categories
      .filter((c) => normalize(c.nombre).includes(q))
      .slice(0, 2)
      .forEach((c) => {
        items.push({
          type: "category",
          id: `cat-${c.id}`,
          title: c.nombre,
          subtitle: "Categoría",
          image: c.icon_url,
          href: `/catalogo?categoria=${encodeURIComponent(c.slug)}`,
        });
      });

    // Leagues
    leagues
      .filter((l) => normalize(l.nombre).includes(q))
      .slice(0, 2)
      .forEach((l) => {
        items.push({
          type: "league",
          id: `league-${l.id}`,
          title: l.nombre,
          subtitle: "Liga",
          image: l.imagen,
          href: `/catalogo?liga=${encodeURIComponent(l.slug)}`,
        });
      });

    // Products
    catalog
      .filter(
        (p) => normalize(p.equipo).includes(q) || normalize(p.modelo).includes(q)
      )
      .slice(0, 5)
      .forEach((p) => {
        items.push({
          type: "product",
          id: p.id,
          title: p.equipo,
          subtitle: p.modelo,
          image: p.imagen,
          price: p.precio,
          href: `/producto/${p.slug || p.id}`,
        });
      });

    return items;
  }, [value, catalog, categories, leagues, enableLiveResults]);

  // Flat list for keyboard nav
  const allItems = useMemo(() => {
    if (value.length >= 2 && results.length > 0) return results;
    return [];
  }, [value, results]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [value]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
        return;
      }

      const itemCount = allItems.length + (value.length >= 2 ? 1 : 0); // +1 for "view all"
      if (itemCount === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % itemCount);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + itemCount) % itemCount);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < allItems.length) {
          const item = allItems[activeIndex];
          navigateToResult(item);
        } else {
          handleSubmit(e as unknown as React.FormEvent);
        }
      }
    },
    [allItems, activeIndex, value]
  );

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !resultsRef.current) return;
    const items = resultsRef.current.querySelectorAll("[data-search-item]");
    items[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const navigateToResult = (item: SearchResult) => {
    saveRecentSearch(item.title);
    setRecentSearches(getRecentSearches());
    setIsOpen(false);
    onChange("");
    router.push(item.href);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    saveRecentSearch(value.trim());
    setRecentSearches(getRecentSearches());
    setIsOpen(false);
    if (onSearch) {
      onSearch(e);
    } else {
      router.push(`/catalogo?query=${encodeURIComponent(value.trim())}`);
    }
  };

  const handleClear = () => {
    onChange("");
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleRecentClick = (term: string) => {
    onChange(term);
    saveRecentSearch(term);
    setRecentSearches(getRecentSearches());
    if (pathname?.includes("/catalogo")) {
      // On catalog page, just set the search term — debounce will handle the rest
    } else {
      setIsOpen(false);
      router.push(`/catalogo?query=${encodeURIComponent(term)}`);
    }
  };

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  const handleTrendingClick = (term: string) => {
    onChange(term);
    saveRecentSearch(term);
    setRecentSearches(getRecentSearches());
    if (!pathname?.includes("/catalogo")) {
      setIsOpen(false);
      router.push(`/catalogo?query=${encodeURIComponent(term)}`);
    }
  };

  const isCatalogPage = pathname?.includes("/catalogo");
  const hasQuery = value.length >= 2;
  const hasResults = results.length > 0;
  const hasRecent = recentSearches.length > 0;
  const showPanel = isOpen && (hasQuery || hasRecent || !isCatalogPage);

  return (
    <div ref={containerRef} className={`relative w-full max-w-xl ${className}`}>
      {/* ─── Input ─── */}
      <form onSubmit={handleSubmit} className="relative z-50" role="search">
        <label htmlFor="search-input" className="sr-only">
          Buscar productos
        </label>

        {/* Glass background */}
        <div
          className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
            isOpen
              ? "bg-white/10 backdrop-blur-2xl border border-white/20 ring-2 ring-primary/40 shadow-[0_0_40px_rgba(229,9,20,0.15)]"
              : "bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
          }`}
        />

        <div className="relative flex items-center">
          <button
            type="submit"
            aria-label="Buscar"
            className="absolute left-3 md:left-4 p-1 text-gray-400 hover:text-white transition-colors duration-200 z-10"
          >
            <Search
              className={`w-[18px] h-[18px] md:w-5 md:h-5 transition-colors duration-200 ${
                isOpen ? "text-primary" : ""
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
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-gray-500 font-mono">
              <span className="text-[11px]">⌘</span>K
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
            <div
              ref={resultsRef}
              className="max-h-[min(60vh,480px)] overflow-y-auto overscroll-contain"
            >
              {/* ─── Search Results ─── */}
              {hasQuery && hasResults && (
                <>
                  {/* Categories & Leagues */}
                  {results.some((r) => r.type === "category" || r.type === "league") && (
                    <div className="px-3 pt-3 pb-1">
                      <span className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                        Categorías y Ligas
                      </span>
                      <div className="mt-2 space-y-0.5">
                        {results
                          .filter((r) => r.type === "category" || r.type === "league")
                          .map((item, i) => {
                            const globalIdx = results.indexOf(item);
                            const isActive = activeIndex === globalIdx;
                            return (
                              <button
                                key={item.id}
                                data-search-item
                                onClick={() => navigateToResult(item)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left group ${
                                  isActive
                                    ? "bg-primary/10 ring-1 ring-primary/20"
                                    : "hover:bg-white/5"
                                }`}
                              >
                                <div
                                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                    item.type === "category"
                                      ? "bg-primary/10"
                                      : "bg-blue-500/10"
                                  }`}
                                >
                                  {item.image ? (
                                    <Image
                                      src={item.image}
                                      alt=""
                                      width={20}
                                      height={20}
                                      className="object-contain brightness-0 invert opacity-80"
                                    />
                                  ) : (
                                    <Sparkles className="w-4 h-4 text-primary" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-white truncate">
                                    <HighlightMatch text={item.title} query={value} />
                                  </p>
                                  <p className="text-[11px] text-gray-500 uppercase tracking-wider">
                                    {item.subtitle}
                                  </p>
                                </div>
                                <ArrowRight
                                  className={`w-4 h-4 flex-shrink-0 transition-all duration-200 ${
                                    isActive
                                      ? "text-primary translate-x-0"
                                      : "text-gray-600 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
                                  }`}
                                />
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Products */}
                  {results.some((r) => r.type === "product") && (
                    <div className="px-3 pt-3 pb-1">
                      <span className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                        Productos
                      </span>
                      <div className="mt-2 space-y-0.5">
                        {results
                          .filter((r) => r.type === "product")
                          .map((item) => {
                            const globalIdx = results.indexOf(item);
                            const isActive = activeIndex === globalIdx;
                            return (
                              <button
                                key={item.id}
                                data-search-item
                                onClick={() => navigateToResult(item)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left group ${
                                  isActive
                                    ? "bg-primary/10 ring-1 ring-primary/20"
                                    : "hover:bg-white/5"
                                }`}
                              >
                                <div className="w-10 h-13 rounded-lg overflow-hidden flex-shrink-0 border border-white/5 bg-neutral-800">
                                  <ProductImage
                                    src={item.image || ""}
                                    alt={item.title}
                                    width={40}
                                    height={52}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-white truncate">
                                    <HighlightMatch text={item.title} query={value} />
                                  </p>
                                  <p className="text-[11px] text-gray-500 truncate uppercase tracking-wider">
                                    <HighlightMatch
                                      text={item.subtitle || ""}
                                      query={value}
                                    />
                                  </p>
                                </div>
                                {item.price != null && (
                                  <span className="text-sm font-black text-primary flex-shrink-0">
                                    L {item.price.toLocaleString("es-HN")}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* "View all results" footer */}
                  {!isCatalogPage && (
                    <div className="p-2 mt-1 border-t border-white/5">
                      <button
                        data-search-item
                        onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
                        className={`w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold rounded-xl transition-colors uppercase tracking-[0.15em] ${
                          activeIndex === allItems.length
                            ? "bg-primary/10 text-white ring-1 ring-primary/20"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <Search className="w-3.5 h-3.5" />
                        Ver todos los resultados para &quot;{value}&quot;
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ─── No results ─── */}
              {hasQuery && !hasResults && (
                <div className="px-4 py-8 text-center">
                  <Shirt className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">
                    No encontramos resultados para{" "}
                    <span className="text-white font-semibold">&quot;{value}&quot;</span>
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Prueba con otro término o revisa la ortografía
                  </p>
                </div>
              )}

              {/* ─── Empty state: recent + trending ─── */}
              {!hasQuery && (
                <div className="py-2">
                  {/* Recent searches */}
                  {hasRecent && (
                    <div className="px-3 pt-2 pb-1">
                      <div className="flex items-center justify-between px-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          Recientes
                        </span>
                        <button
                          onClick={handleClearRecent}
                          className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors uppercase tracking-wider"
                        >
                          Borrar
                        </button>
                      </div>
                      <div className="space-y-0.5">
                        {recentSearches.map((term) => (
                          <button
                            key={term}
                            onClick={() => handleRecentClick(term)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 text-left group transition-colors"
                          >
                            <Clock className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors truncate">
                              {term}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-gray-700 ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trending */}
                  <div className="px-3 pt-3 pb-2">
                    <span className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3" />
                      Populares
                    </span>
                    <div className="mt-2 flex flex-wrap gap-1.5 px-1">
                      {TRENDING_SUGGESTIONS.map((term) => (
                        <button
                          key={term}
                          onClick={() => handleTrendingClick(term)}
                          className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs text-gray-400 hover:text-white hover:bg-white/10 hover:border-primary/20 transition-all"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Backdrop (mobile) ─── */}
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

// ─── Compact trigger for header ───
export function SearchTrigger({ className = "" }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [mounted, setMounted] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Cmd+K to open, Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setSearchValue("");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Auto-focus input when overlay opens
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
    setSearchValue("");
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Buscar (⌘K)"
        className={`relative p-3 rounded-2xl text-gray-400 hover:text-white transition-all duration-300 group ${className}`}
      >
        <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Search className="w-5 h-5 relative z-10 group-hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.4)] transition-all duration-300" />
      </button>

      {/* Overlay — rendered via portal to escape header stacking context */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
                  onClick={handleClose}
                />
                <motion.div
                  data-search-overlay
                  initial={{ opacity: 0, y: -20, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed top-[10vh] md:top-[15vh] left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg z-[201]"
                >
                  <SearchBar
                    value={searchValue}
                    onChange={setSearchValue}
                    placeholder="Buscar equipos, ligas, productos..."
                    enableLiveResults
                    className="w-full"
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
