// src/lib/aura.js
export function getAura(liga) {
  if (!liga) return "from-[#E50914]/20 via-black/70 to-black";

  const map = {
    "Barcelona": "from-[#004D98]/50 via-black/70 to-[#A50044]/40",
    "Real Madrid": "from-[#FFFFFF]/15 via-[#A899CA]/20 to-black",
    "PSG": "from-[#004170]/40 via-black/70 to-[#DA291C]/40",
    "Manchester United": "from-[#DA291C]/40 via-black/70 to-[#FBE122]/25",
    "Olimpia": "from-[#FFFFFF]/10 via-black/70 to-[#E50914]/40",
    "Liga Nacional": "from-[#E50914]/25 via-black/70 to-[#111]/80",
  };

  return map[liga] || "from-[#E50914]/25 via-black/70 to-black";
}
