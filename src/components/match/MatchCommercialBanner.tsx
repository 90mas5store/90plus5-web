"use client";

import React, { memo } from "react";
import Link from "next/link";
import { Shirt, ArrowRight } from "lucide-react";
import type { LiveMatchData } from "@/hooks/useLiveMatches";

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
  return (
    <div>
      {hasHomeInDb || hasAwayInDb ? (
        <div className="relative overflow-hidden rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] p-4 sm:p-5 shadow-lg space-y-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/15 border border-red-500/30 flex items-center justify-center shrink-0">
              <Shirt className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h5 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                Camisetas Oficiales del Partido
              </h5>
              <p className="text-[10px] text-gray-400">
                Personalización oficial disponible · Envíos a toda Honduras
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch gap-2.5 pt-0.5">
            {hasHomeInDb && (
              <Link
                href={
                  match.homeTeamId
                    ? `/catalogo?equipo=${encodeURIComponent(match.homeTeamId)}`
                    : `/catalogo?query=${encodeURIComponent(homeName)}`
                }
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-[#E50914] hover:bg-red-700 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-[0_4px_16px_rgba(229,9,20,0.35)] cursor-pointer"
              >
                <span>Camiseta {homeName}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            {hasAwayInDb && (
              <Link
                href={
                  match.awayTeamId
                    ? `/catalogo?equipo=${encodeURIComponent(match.awayTeamId)}`
                    : `/catalogo?query=${encodeURIComponent(awayName)}`
                }
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-[0.98] border border-white/15 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer backdrop-blur-md"
              >
                <span>Camiseta {awayName}</span>
                <ArrowRight className="w-4 h-4 text-gray-300" />
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-4 sm:p-5 shadow-lg flex items-center justify-between gap-4">
          <span className="text-xs text-gray-400 font-medium">
            Descubre miles de camisetas de las mejores ligas del mundo
          </span>
          <Link
            href="/catalogo"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#E50914] hover:bg-red-700 active:scale-[0.98] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 shadow-md"
          >
            <span>Ver Catálogo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

export const MatchCommercialBanner = memo(MatchCommercialBannerComponent);
