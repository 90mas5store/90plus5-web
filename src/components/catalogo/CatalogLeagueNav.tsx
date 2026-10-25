"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { m as motion, AnimatePresence } from "@/lib/motion";
import { getLeagueLogoUrl } from "@/lib/leagueLogos";
import { ExtendedLeague } from "@/hooks/useCatalogMetadata";

export interface TeamItem {
    id: string;
    name: string;
    logo_url: string | null;
}

interface CatalogLeagueNavProps {
    ligas: ExtendedLeague[];
    ligaSeleccionada: string | null;
    onSelectLeague: (leagueName: string) => void;
    teams?: TeamItem[];
    equipoSeleccionado?: string | null;
    onSelectTeam?: (teamId: string | null) => void;
    categoryName?: string | null;
    categorySlug?: string | null;
}

export default function CatalogLeagueNav({
    ligas = [],
    ligaSeleccionada,
    onSelectLeague,
    teams = [],
    equipoSeleccionado,
    onSelectTeam,
    categoryName,
    categorySlug,
}: CatalogLeagueNavProps) {
    const leaguesScrollRef = useRef<HTMLDivElement>(null);
    const teamsScrollRef = useRef<HTMLDivElement>(null);

    const [canScrollLeaguesLeft, setCanScrollLeaguesLeft] = useState(false);
    const [canScrollLeaguesRight, setCanScrollLeaguesRight] = useState(false);
    const [canScrollTeamsLeft, setCanScrollTeamsLeft] = useState(false);
    const [canScrollTeamsRight, setCanScrollTeamsRight] = useState(false);

    const defaultLeagues = [
        { nombre: "Champions League", slug: "ucl", imagen: "/logos/ligas/UCL.svg" },
        { nombre: "Premier League", slug: "premier-league", imagen: "/logos/ligas/PremierLeague.svg" },
        { nombre: "LaLiga", slug: "la-liga", imagen: "/logos/ligas/LaLiga.svg" },
        { nombre: "Serie A", slug: "serie-a", imagen: "/logos/ligas/SerieA.svg" },
        { nombre: "Liga Hondubet", slug: "liga-hondubet", imagen: "/logos/ligas/LigaHondubet.svg" },
        { nombre: "Bundesliga", slug: "bundesliga", imagen: "/logos/ligas/Bundesliga.svg" },
        { nombre: "Mundial 2026", slug: "mundial-2026", imagen: "/logos/ligas/Mundial2026.webp" },
    ];

    const isGeneralOrFutbol = !categoryName || !categorySlug || categorySlug.toLowerCase() === 'futbol';
    const displayLeagues = ligas.length > 0 ? ligas : (isGeneralOrFutbol ? defaultLeagues : []);

    const updateLeaguesScroll = useCallback(() => {
        if (!leaguesScrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = leaguesScrollRef.current;
        setCanScrollLeaguesLeft(scrollLeft > 10);
        setCanScrollLeaguesRight(scrollLeft < scrollWidth - clientWidth - 10);
    }, []);

    const updateTeamsScroll = useCallback(() => {
        if (!teamsScrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = teamsScrollRef.current;
        setCanScrollTeamsLeft(scrollLeft > 10);
        setCanScrollTeamsRight(scrollLeft < scrollWidth - clientWidth - 10);
    }, []);

    useEffect(() => {
        updateLeaguesScroll();
        const el = leaguesScrollRef.current;
        if (el) {
            el.addEventListener("scroll", updateLeaguesScroll, { passive: true });
            window.addEventListener("resize", updateLeaguesScroll);
            return () => {
                el.removeEventListener("scroll", updateLeaguesScroll);
                window.removeEventListener("resize", updateLeaguesScroll);
            };
        }
    }, [displayLeagues, updateLeaguesScroll]);

    useEffect(() => {
        updateTeamsScroll();
        const el = teamsScrollRef.current;
        if (el) {
            el.addEventListener("scroll", updateTeamsScroll, { passive: true });
            window.addEventListener("resize", updateTeamsScroll);
            return () => {
                el.removeEventListener("scroll", updateTeamsScroll);
                window.removeEventListener("resize", updateTeamsScroll);
            };
        }
    }, [teams, updateTeamsScroll]);

    const scrollLeagues = (direction: "left" | "right") => {
        if (!leaguesScrollRef.current) return;
        const amount = leaguesScrollRef.current.clientWidth * 0.7;
        leaguesScrollRef.current.scrollBy({
            left: direction === "left" ? -amount : amount,
            behavior: "smooth",
        });
    };

    const scrollTeams = (direction: "left" | "right") => {
        if (!teamsScrollRef.current) return;
        const amount = teamsScrollRef.current.clientWidth * 0.7;
        teamsScrollRef.current.scrollBy({
            left: direction === "left" ? -amount : amount,
            behavior: "smooth",
        });
    };

    if (displayLeagues.length === 0 && teams.length === 0) {
        return null;
    }

    return (
        <section aria-label="Navegación de Competiciones" className="border-b border-white/[0.08] bg-[#07080a] select-none">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                
                {/* 🌟 OPCIÓN A: APPLE STORE ICON RAIL (CERO PÍLDORAS, LOGOS FLOTANTES LIMPIOS) */}
                <div className="relative group/leagues">
                    {/* Flecha Izquierda flotante */}
                    {canScrollLeaguesLeft && (
                        <button
                            onClick={() => scrollLeagues("left")}
                            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-[#121319]/90 border border-white/20 items-center justify-center text-white hover:bg-white/20 transition-all shadow-xl cursor-pointer"
                            aria-label="Desplazar a la izquierda"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    )}

                    {/* Flecha Derecha flotante */}
                    {canScrollLeaguesRight && (
                        <button
                            onClick={() => scrollLeagues("right")}
                            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-[#121319]/90 border border-white/20 items-center justify-center text-white hover:bg-white/20 transition-all shadow-xl cursor-pointer"
                            aria-label="Desplazar a la derecha"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    )}

                    {/* Máscara de desvanecimiento suave Apple en los bordes */}
                    <div
                        className={`absolute left-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-r from-[#07080a] to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
                            canScrollLeaguesLeft ? "opacity-100" : "opacity-0"
                        }`}
                    />
                    <div
                        className={`absolute right-0 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-l from-[#07080a] to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
                            canScrollLeaguesRight ? "opacity-100" : "opacity-0"
                        }`}
                    />

                    {/* Riel horizontal con items sin bordes de cápsula */}
                    <div
                        ref={leaguesScrollRef}
                        className="flex items-start gap-4 sm:gap-7 overflow-x-auto scrollbar-none py-3.5 px-3 pr-12 overscroll-x-contain"
                        role="tablist"
                    >
                        {/* Opción 'Todas' */}
                        <button
                            role="tab"
                            aria-selected={!ligaSeleccionada}
                            onClick={() => onSelectLeague("")}
                            className="group shrink-0 flex flex-col items-center cursor-pointer transition-transform active:scale-95 focus:outline-none"
                        >
                            <div className={`relative w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                                !ligaSeleccionada
                                    ? "bg-white/[0.08] text-amber-400 border border-white/15 shadow-[0_0_16px_rgba(251,191,36,0.18)] ring-1 ring-amber-400/25 scale-105"
                                    : "bg-white/[0.03] text-white/50 group-hover:bg-white/[0.08] group-hover:text-white"
                            }`}>
                                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <span className={`mt-2 text-[11px] sm:text-xs font-bold tracking-tight text-center whitespace-nowrap transition-colors ${
                                !ligaSeleccionada ? "text-white" : "text-white/50 group-hover:text-white"
                            }`}>
                                Todas
                            </span>
                            {/* Barra indicadora sutil Apple en la base */}
                            {!ligaSeleccionada && (
                                <motion.div
                                    layoutId="activeRailIndicator"
                                    className="h-0.5 w-6 rounded-full bg-white mt-1.5 shadow-[0_0_8px_white]"
                                    transition={{ type: "spring", damping: 25, stiffness: 350 }}
                                />
                            )}
                        </button>

                        {/* Competiciones como Iconos Flotantes Puros (estilo Apple Store) */}
                        {displayLeagues.map((liga) => {
                            const nombre = liga.nombre;
                            if (!nombre) return null;
                            const isSelected = ligaSeleccionada === nombre;
                            const logoUrl = getLeagueLogoUrl(liga.slug, liga.nombre, liga.imagen);

                            return (
                                <button
                                    key={liga.slug || nombre}
                                    role="tab"
                                    aria-selected={isSelected}
                                    onClick={() => onSelectLeague(nombre)}
                                    className="group shrink-0 flex flex-col items-center cursor-pointer transition-transform active:scale-95 focus:outline-none"
                                >
                                    {/* Icono flotante con sombra limpia, sin caja de píldora */}
                                    <div className={`relative w-11 h-11 sm:w-13 sm:h-13 flex items-center justify-center transition-all duration-300 ${
                                        isSelected
                                            ? "scale-110 filter drop-shadow-[0_0_16px_rgba(229,9,20,0.5)]"
                                            : "opacity-60 group-hover:opacity-100 group-hover:scale-105 filter drop-shadow-md"
                                    }`}>
                                        <Image
                                            src={logoUrl}
                                            alt={nombre}
                                            width={44}
                                            height={44}
                                            className="object-contain w-full h-full"
                                        />
                                    </div>

                                    {/* Nombre limpio debajo */}
                                    <span className={`mt-2 text-[11px] sm:text-xs font-bold tracking-tight text-center max-w-[85px] sm:max-w-[100px] truncate transition-colors ${
                                        isSelected ? "text-white" : "text-white/50 group-hover:text-white"
                                    }`}>
                                        {nombre}
                                    </span>

                                    {/* Barra indicadora inferior física Apple */}
                                    {isSelected && (
                                        <motion.div
                                            layoutId="activeRailIndicator"
                                            className="h-0.5 w-6 rounded-full bg-primary mt-1.5 shadow-[0_0_10px_rgba(229,9,20,0.8)]"
                                            transition={{ type: "spring", damping: 25, stiffness: 350 }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 🌟 RIEL DE CLUBES: Escudos Circulares Flotantes (Cero Píldoras) */}
                <AnimatePresence>
                    {teams.length > 0 && onSelectTeam && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            className="pt-4 overflow-hidden border-t border-white/[0.06] mt-3 relative group/teams"
                        >
                            {/* Flecha Scroll Clubes Izquierda */}
                            {canScrollTeamsLeft && (
                                <button
                                    onClick={() => scrollTeams("left")}
                                    className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-[#121319]/90 border border-white/20 items-center justify-center text-white hover:bg-white/20 transition-all shadow-md cursor-pointer"
                                    aria-label="Desplazar clubes a la izquierda"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                            )}

                            {/* Flecha Scroll Clubes Derecha */}
                            {canScrollTeamsRight && (
                                <button
                                    onClick={() => scrollTeams("right")}
                                    className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-[#121319]/90 border border-white/20 items-center justify-center text-white hover:bg-white/20 transition-all shadow-md cursor-pointer"
                                    aria-label="Desplazar clubes a la derecha"
                                >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            )}

                            <div
                                ref={teamsScrollRef}
                                className="flex items-center gap-3 sm:gap-4 overflow-x-auto scrollbar-none py-2.5 px-2 pr-12 overscroll-x-contain"
                            >
                                {/* Opción 'Todos los Clubes' */}
                                <button
                                    onClick={() => onSelectTeam(null)}
                                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                                        !equipoSeleccionado
                                            ? "bg-white/20 text-white shadow-sm"
                                            : "text-white/50 hover:text-white"
                                    }`}
                                >
                                    <span>Todos</span>
                                </button>

                                {/* Escudos de Clubes Circulares Puros (Sin Cajas de Píldoras) */}
                                {teams.map((team) => {
                                    const isTeamSelected = equipoSeleccionado === team.id;

                                    return (
                                        <button
                                            key={team.id}
                                            onClick={() => onSelectTeam(isTeamSelected ? null : team.id)}
                                            className="group shrink-0 flex items-center gap-2 cursor-pointer transition-transform active:scale-95 focus:outline-none"
                                        >
                                            <div className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center p-1 transition-all duration-200 ${
                                                isTeamSelected
                                                    ? "bg-primary/20 ring-2 ring-primary shadow-[0_0_12px_rgba(229,9,20,0.5)] scale-110"
                                                    : "bg-white/[0.04] group-hover:bg-white/[0.08] opacity-75 group-hover:opacity-100"
                                            }`}>
                                                {team.logo_url ? (
                                                    <Image
                                                        src={team.logo_url}
                                                        alt={team.name}
                                                        width={26}
                                                        height={26}
                                                        className="object-contain w-full h-full filter drop-shadow-sm"
                                                    />
                                                ) : (
                                                    <div className="w-4 h-4 rounded-full bg-white/20" />
                                                )}
                                            </div>
                                            <span className={`text-xs font-semibold whitespace-nowrap transition-colors ${
                                                isTeamSelected ? "text-white" : "text-white/60 group-hover:text-white"
                                            }`}>
                                                {team.name}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </section>
    );
}
