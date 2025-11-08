"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ShoppingCart, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { getConfig } from "../lib/api";

export default function Header() {
  const { items, openCart } = useCart();
  const pathname = usePathname();

  const [categorias, setCategorias] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    async function fetchCategorias() {
      try {
        const configData = await getConfig();
        if (configData?.productos?.length) {
          const unicas = [
            ...new Set(configData.productos.map((p) => p.Categoria)),
          ].filter(Boolean);
          setCategorias(unicas);
        }
      } catch (err) {
        console.error("Error cargando categorías:", err);
      }
    }
    fetchCategorias();
  }, []);

  // Link active detection (soporte /catalogo and /catalogo?categoria=...)
  const isActiveSimple = (href) => {
    if (href === "/") return pathname === "/";
    if (href === "/catalogo") return pathname.startsWith("/catalogo");
    return pathname === href;
  };

  const LinkItem = ({ href, children, onClick }) => {
    const active = isActiveSimple(href);
    return (
      <Link
        href={href}
        onClick={onClick}
        className={`relative px-1 py-0.5 transition-all duration-300 ${
          active
            ? "text-white font-semibold drop-shadow-[0_0_12px_rgba(229,9,20,0.85)]"
            : "text-gray-300 hover:text-white"
        }`}
      >
        {children}
        {/* underline + aura when active */}
        {active && (
          <span
            aria-hidden
            className="absolute left-0 -bottom-2 w-full h-1 rounded-full bg-gradient-to-r from-[#E50914] to-white shadow-[0_0_14px_rgba(229,9,20,0.35)]"
          />
        )}
      </Link>
    );
  };

  return (
    <>
      <header className="fixed top-0 left-0 w-full flex items-center justify-between px-6 py-3 z-50 backdrop-blur-lg bg-black/70 border-b border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.06)]">
        {/* LOGO + NOMBRE (Satoshi applied globally) */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <Image
                src="/logo.png"
                alt="90+5"
                width={42}
                height={42}
                className="object-contain transition-all duration-300 group-hover:scale-105"
              />
            </div>

            <div className="flex flex-col leading-none">
              <span className="text-white text-[1.15rem] font-satoshi font-extrabold tracking-tight">
                90<span className="text-[#E50914]">+</span>5
              </span>
              <span className="text-gray-300 text-xs -mt-1 font-medium">Store</span>
            </div>
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-6 text-sm font-satoshi">
          <LinkItem href="/">Inicio</LinkItem>
          <LinkItem href="/catalogo">Catálogo</LinkItem>

          {/* dinámicas */}
          {categorias.length > 0
            ? categorias
                .filter((c) => c.toLowerCase() !== "caballero")
                .map((c) => (
                  <LinkItem
                    key={c}
                    href={`/catalogo?categoria=${encodeURIComponent(c)}`}
                  >
                    {c}
                  </LinkItem>
                ))
            : (
              // fallback fijo
              <>
                <LinkItem href={`/catalogo?categoria=Femenino`}>Femenino</LinkItem>
                <LinkItem href={`/catalogo?categoria=Tenis`}>Tenis</LinkItem>
                <LinkItem href={`/catalogo?categoria=Retro`}>Retro</LinkItem>
                <LinkItem href={`/catalogo?categoria=Formula1`}>Fórmula 1</LinkItem>
              </>
            )}

          <LinkItem href="/contacto">Contacto</LinkItem>
        </nav>

        {/* Right: cart + mobile button */}
        <div className="flex items-center gap-3">
          <button
            onClick={openCart}
            aria-label="Abrir carrito"
            className="relative p-2 rounded-md hover:bg-white/5 transition"
          >
            <ShoppingCart className="w-5 h-5 text-white" />
            {items.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#E50914] text-xs font-semibold text-white rounded-full w-5 h-5 flex items-center justify-center shadow-[0_0_8px_rgba(229,9,20,0.6)]">
                {items.length}
              </span>
            )}
          </button>

          {/* mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            className="sm:hidden p-2 rounded-md hover:bg-white/5 transition"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>
        </div>
      </header>

      {/* Spacer so page content isn't under header */}
      <div className="h-[64px] sm:h-[56px]" />

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />

            {/* drawer */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-full max-w-xs z-50 bg-gradient-to-b from-black/80 via-black/70 to-black/80 shadow-lg border-l border-white/6 p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3">
                  <Image src="/logo.png" alt="logo" width={36} height={36} />
                  <div className="flex flex-col leading-none">
                    <span className="text-white text-lg font-satoshi font-bold tracking-tight">90<span className="text-[#E50914]">+</span>5</span>
                    <span className="text-gray-300 text-xs -mt-1">Store</span>
                  </div>
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    onClick={openCart}
                    aria-label="Abrir carrito"
                    className="relative p-2 rounded-md hover:bg-white/5 transition"
                  >
                    <ShoppingCart className="w-5 h-5 text-white" />
                    {items.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-[#E50914] text-xs font-semibold text-white rounded-full w-5 h-5 flex items-center justify-center shadow-[0_0_8px_rgba(229,9,20,0.6)]">
                        {items.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setMobileOpen(false)}
                    aria-label="Cerrar menú"
                    className="p-2 rounded-md hover:bg-white/5 transition"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>

              {/* links */}
              <nav className="flex flex-col gap-3 mt-2">
                <Link href="/" onClick={() => setMobileOpen(false)} className={`px-3 py-2 rounded-md ${isActiveSimple("/") ? "bg-white/5 text-white" : "text-gray-300 hover:bg-white/3"}`}>
                  Inicio
                </Link>
                <Link href="/catalogo" onClick={() => setMobileOpen(false)} className={`px-3 py-2 rounded-md ${isActiveSimple("/catalogo") ? "bg-white/5 text-white" : "text-gray-300 hover:bg-white/3"}`}>
                  Catálogo
                </Link>

                {/* categories */}
                <div className="mt-2">
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Categorías</div>
                  <div className="flex flex-col gap-2">
                    {categorias.length > 0
                      ? categorias
                          .filter((c) => c.toLowerCase() !== "caballero")
                          .map((c) => (
                            <Link
                              key={c}
                              href={`/catalogo?categoria=${encodeURIComponent(c)}`}
                              onClick={() => setMobileOpen(false)}
                              className="px-3 py-2 rounded-md text-gray-300 hover:bg-white/3"
                            >
                              {c}
                            </Link>
                          ))
                      : (
                        <>
                          <Link href={`/catalogo?categoria=Femenino`} onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-gray-300 hover:bg-white/3">Femenino</Link>
                          <Link href={`/catalogo?categoria=Tenis`} onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-gray-300 hover:bg-white/3">Tenis</Link>
                          <Link href={`/catalogo?categoria=Retro`} onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-gray-300 hover:bg-white/3">Retro</Link>
                          <Link href={`/catalogo?categoria=Formula1`} onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-gray-300 hover:bg-white/3">Fórmula 1</Link>
                        </>
                      )}
                  </div>
                </div>

                <Link href="/contacto" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-gray-300 hover:bg-white/3">Contacto</Link>
              </nav>

              {/* small footer inside drawer */}
              <div className="mt-auto pt-4 border-t border-white/6 text-sm text-gray-400">
                © {new Date().getFullYear()} 90+5 Store
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

