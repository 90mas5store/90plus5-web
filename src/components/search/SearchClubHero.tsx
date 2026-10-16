import React from 'react';
import { ArrowRight, Shield } from 'lucide-react';
import TeamLogo from '@/components/TeamLogo';
import { QuickClub } from '@/types/search';

interface SearchClubHeroProps {
    matchedClub: QuickClub;
    onSelectClub: (term: string, href?: string) => void;
}

export default function SearchClubHero({ matchedClub, onSelectClub }: SearchClubHeroProps) {
    return (
        <div
            className="p-3 bg-gradient-to-r from-red-950/30 via-neutral-900/60 to-transparent border-b border-white/5"
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectClub(matchedClub.name, `/catalogo?query=${encodeURIComponent(matchedClub.name)}`);
                }}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-primary/40 cursor-pointer transition-all group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0 p-1.5 group-hover:scale-105 transition-transform">
                        {matchedClub.logoUrl ? (
                            <TeamLogo src={matchedClub.logoUrl} alt={matchedClub.name} size={30} />
                        ) : (
                            <Shield className="w-5 h-5 text-primary" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase text-white tracking-wide">
                                {matchedClub.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-primary/20 text-primary border border-primary/30 uppercase">
                                Club Oficial
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                            {matchedClub.count
                                ? `Explorar ${matchedClub.count} ${matchedClub.count === 1 ? 'modelo' : 'modelos'} disponibles de ${matchedClub.name}`
                                : `Explorar todas las camisetas y ediciones de ${matchedClub.name}`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                    <span>Ver todo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </div>
            </div>
        </div>
    );
}
