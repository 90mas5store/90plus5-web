"use client";

import React, { memo, useState, useEffect } from "react";
import Link from "next/link";
import { Shirt, Sparkles, ChevronRight, Tag } from "lucide-react";
import type { LiveMatchData } from "@/hooks/useLiveMatches";
import type { Product } from "@/lib/types";
import ProductImage from "@/components/ProductImage";

interface MatchCommercialBannerProps {
  match: LiveMatchData;
  homeName: string;
  awayName: string;
  hasHomeInDb: boolean;
  hasAwayInDb: boolean;
  onClose: () => void;
}

function MatchCommercialBannerComponent({
  match,
  homeName,
  awayName,
  hasHomeInDb,
  hasAwayInDb,
  onClose,
}: MatchCommercialBannerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<"home" | "away">(hasHomeInDb ? "home" : "away");

  const currentTeamName = selectedTeam === "home" ? homeName : awayName;
  const currentTeamId = selectedTeam === "home" ? match.homeTeamId : match.awayTeamId;

  useEffect(() => {
    let isCancelled = false;

    async function loadProducts() {
      if (!currentTeamId && !currentTeamName) return;
      setLoading(true);

      try {
        const queryParams = new URLSearchParams();
        if (currentTeamId) queryParams.set("teamId", currentTeamId);
        if (currentTeamName) queryParams.set("query", currentTeamName);
        queryParams.set("limit", "4");

        const res = await fetch(`/api/match-products?${queryParams.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();

        if (!isCancelled) {
          setProducts(data.products || []);
        }
      } catch {
        if (!isCancelled) setProducts([]);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      isCancelled = true;
    };
  }, [currentTeamId, currentTeamName]);

  const hasAnyInDb = hasHomeInDb || hasAwayInDb;

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] bg-[#101117] border border-white/[0.08] p-3.5 sm:p-5 shadow-xl">
      {/* 🏷️ Cabecera limpia y estilizada */}
      <div className="flex items-center justify-between gap-3 mb-3 pb-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center shrink-0">
            <Shirt className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
          </div>
          <div className="min-w-0">
            <h5 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
              {match.isUpcoming ? "Viste los Colores del Partido" : "Camisetas Oficiales"}
            </h5>
            <p className="text-[10px] text-white/50 truncate hidden sm:block">
              {match.isUpcoming
                ? `Prepárate para el juego con 10% OFF usando el código `
                : `10% OFF automático con el código `}
              <span className="text-amber-300 font-mono font-bold">MATCHDAY</span>
            </p>
          </div>
        </div>

        {/* Selector de club (solo si ambos equipos tienen camisetas) */}
        {hasHomeInDb && hasAwayInDb ? (
          <div className="flex items-center p-0.5 rounded-full bg-white/[0.06] border border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedTeam("home")}
              className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                selectedTeam === "home"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {homeName.split(" ")[0]}
            </button>
            <button
              type="button"
              onClick={() => setSelectedTeam("away")}
              className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                selectedTeam === "away"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {awayName.split(" ")[0]}
            </button>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-300 text-[10px] font-mono font-bold shrink-0">
            <Tag className="w-2.5 h-2.5" />
            10% OFF
          </span>
        )}
      </div>

      {/* 🛍️ Contenido de Productos */}
      {hasAnyInDb ? (
        <div>
          {loading ? (
            /* Skeleton limpio con proporciones nativas */
            <div className="flex sm:grid sm:grid-cols-4 gap-2.5 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 scrollbar-none">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-[130px] sm:w-auto shrink-0 rounded-2xl bg-white/[0.03] border border-white/[0.05] p-2 flex flex-col gap-2"
                >
                  <div className="w-full aspect-[4/5] bg-white/[0.05] rounded-xl animate-pulse" />
                  <div className="h-3 w-3/4 bg-white/10 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-white/10 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            /* Carrusel horizontal en móviles (touch natural) / Grid en desktop */
            <div className="flex sm:grid sm:grid-cols-4 gap-2.5 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 scrollbar-none snap-x snap-mandatory sm:snap-none">
              {products.map((p) => {
                const discountedPrice = Math.round(p.precio * 0.9);
                return (
                  <Link
                    key={p.id}
                    href={`/producto/${p.slug || p.id}`}
                    onClick={onClose}
                    className="w-[135px] sm:w-auto shrink-0 snap-start group flex flex-col justify-between p-2 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/20 active:scale-[0.98] transition-all cursor-pointer relative"
                  >
                    {/* Badge 10% OFF */}
                    <span className="absolute top-3 right-3 z-10 px-1.5 py-0.2 rounded-full bg-amber-500/25 border border-amber-500/35 text-amber-300 font-mono font-bold text-[9px]">
                      -10%
                    </span>

                    {/* Imagen de la Camiseta con marco limpio */}
                    <div className="relative w-full aspect-[4/5] rounded-xl bg-black/40 overflow-hidden flex items-center justify-center p-2 border border-white/[0.04]">
                      <ProductImage
                        src={p.imagen}
                        alt={`${p.equipo} ${p.modelo}`}
                        width={200}
                        height={250}
                        className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Título y Precios */}
                    <div className="pt-2">
                      <h6 className="text-[11px] font-bold text-white tracking-tight leading-tight line-clamp-1 group-hover:text-red-400 transition-colors">
                        {p.modelo || p.equipo}
                      </h6>
                      <p className="text-[10px] text-white/50 truncate mt-0.5">
                        {p.equipo}
                      </p>

                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-xs font-black font-mono text-emerald-400 tabular-nums">
                          L {discountedPrice.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-white/40 line-through font-mono tabular-nums">
                          L {p.precio.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-xs text-white/60">
                Camisetas disponibles en el catálogo oficial
              </p>
            </div>
          )}

          {/* Pie: Enlace directo con flecha */}
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-white/50 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Cupón <strong className="text-amber-300 font-mono">MATCHDAY</strong></span>
            </span>

            <Link
              href={
                currentTeamId
                  ? `/catalogo?equipo=${encodeURIComponent(currentTeamId)}`
                  : `/catalogo?query=${encodeURIComponent(currentTeamName)}`
              }
              onClick={onClose}
              className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
            >
              <span>Ver todo de {currentTeamName.split(" ")[0]}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        /* Fallback si ninguno de los equipos tiene camisetas en tienda */
        <div className="flex items-center justify-between gap-3 py-1">
          <div>
            <span className="text-xs text-white font-bold block">
              Explora camisetas oficiales en 90+5
            </span>
            <span className="text-[10px] text-white/50 block">
              Cientos de modelos con 10% OFF
            </span>
          </div>
          <Link
            href="/catalogo"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold shrink-0 transition-colors"
          >
            Ver Catálogo
          </Link>
        </div>
      )}
    </div>
  );
}

export const MatchCommercialBanner = memo(MatchCommercialBannerComponent);

