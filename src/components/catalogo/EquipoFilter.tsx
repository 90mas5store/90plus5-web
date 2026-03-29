"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "@/lib/motion";
import { X } from "lucide-react";

interface TeamItem {
  id: string;
  name: string;
  logo_url: string | null;
}

interface EquipoFilterProps {
  teams: TeamItem[];
  selected: string | null; // team id
  onSelect: (id: string | null) => void;
  leagueName?: string;
}

export default function EquipoFilter({ teams, selected, onSelect, leagueName }: EquipoFilterProps) {
  if (!teams.length) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="equipo-filter"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="px-4 pb-5 max-w-7xl mx-auto"
      >
        {/* Label */}
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-white/5" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            {leagueName ? `Equipos · ${leagueName}` : "Equipos"}
          </span>
          <div className="h-px flex-1 bg-white/5" />
        </div>

        {/* Pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {teams.map((team) => {
            const isSelected = selected === team.id;
            return (
              <motion.button
                key={team.id}
                onClick={() => onSelect(isSelected ? null : team.id)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className={`
                  flex-shrink-0 flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border
                  transition-colors duration-200 text-xs font-semibold whitespace-nowrap
                  ${isSelected
                    ? "bg-[#E50914]/15 border-[#E50914]/50 text-white shadow-[0_0_14px_rgba(229,9,20,0.25)]"
                    : "bg-white/5 border-white/10 text-gray-400 hover:border-white/25 hover:text-white"
                  }
                `}
              >
                {/* Logo */}
                <div className="relative w-5 h-5 flex-shrink-0">
                  {team.logo_url ? (
                    <Image
                      src={team.logo_url}
                      alt={team.name}
                      fill
                      className="object-contain"
                      unoptimized={team.logo_url.endsWith(".svg")}
                      sizes="20px"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-white/10" />
                  )}
                </div>
                {/* Name */}
                <span>{team.name}</span>
                {/* X para deseleccionar */}
                {isSelected && (
                  <X className="w-3 h-3 text-[#E50914] ml-0.5" />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
