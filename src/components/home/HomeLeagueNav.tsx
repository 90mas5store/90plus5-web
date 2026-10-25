"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import { League } from "@/lib/types";
import { getLeagueLogoUrl } from "@/lib/leagueLogos";

interface HomeLeagueNavProps {
    ligas?: League[];
}

export default function HomeLeagueNav({ ligas = [] }: HomeLeagueNavProps) {
    // Lista curada de ligas principales para acceso rápido
    const defaultLeagues = [
        { name: "Champions League", slug: "ucl", logo: "/logos/ligas/UCL.svg" },
        { name: "Premier League", slug: "premier-league", logo: "/logos/ligas/PremierLeague.svg" },
        { name: "LaLiga", slug: "la-liga", logo: "/logos/ligas/LaLiga.svg" },
        { name: "Serie A", slug: "serie-a", logo: "/logos/ligas/SerieA.svg" },
        { name: "Liga Hondubet", slug: "liga-hondubet", logo: "/logos/ligas/LigaHondubet.svg" },
        { name: "Bundesliga", slug: "bundesliga", logo: "/logos/ligas/Bundesliga.svg" },
        { name: "Mundial 2026", slug: "mundial-2026", logo: "/logos/ligas/Mundial2026.webp" },
    ];

    // Combinar ligas de la base de datos con los logos optimizados
    const displayLeagues = (ligas && ligas.length > 0)
        ? ligas
            .filter((l) => l.active !== false)
            .map((l) => ({
                id: l.id,
                name: l.nombre,
                slug: l.slug,
                logo: getLeagueLogoUrl(l.slug, l.nombre, l.imagen),
            }))
        : defaultLeagues;

    return (
        <section aria-label="Explorar por ligas y competiciones" className="py-6 sm:py-8 border-b border-white/[0.06] bg-[#090a0e]/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                
                {/* Header de la sección */}
                <div className="flex items-center justify-between mb-4 sm:mb-5">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-white/80">
                            <Trophy className="w-3.5 h-3.5" />
                        </div>
                        <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-white">
                            Explora por Competición
                        </h2>
                    </div>

                    <Link
                        href="/catalogo"
                        className="text-xs font-bold text-white/50 hover:text-white flex items-center gap-1 transition-colors group"
                    >
                        <span>Todas las ligas</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>

                {/* Tira deslizante de ligas */}
                <div className="flex items-center gap-2.5 sm:gap-3.5 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
                    {displayLeagues.map((league) => (
                        <Link
                            key={league.slug || league.name}
                            href={`/catalogo?liga=${encodeURIComponent(league.slug)}`}
                            className="group snap-start shrink-0 flex items-center gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-[#121319] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 transition-all duration-200 active:scale-95 shadow-sm hover:shadow-lg hover:shadow-black/50"
                        >
                            <div className="relative w-7 h-7 sm:w-8 sm:h-8 shrink-0 flex items-center justify-center">
                                <Image
                                    src={league.logo}
                                    alt={league.name}
                                    width={32}
                                    height={32}
                                    className="object-contain w-full h-full filter drop-shadow-md group-hover:scale-110 transition-transform duration-200"
                                />
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-white/80 group-hover:text-white whitespace-nowrap transition-colors">
                                {league.name}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
