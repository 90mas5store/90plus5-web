/**
 * Mapeo de logos locales optimizados para ligas.
 * Evita descargar SVGs pesados (>1MB) de storage remoto y aprovecha
 * vectores limpios y ultraligeros (<3KB) servidos con caché inmutable.
 */

const KNOWN_LOCAL_LEAGUE_LOGOS: Record<string, string> = {
  'la-liga': '/logos/ligas/LaLiga.svg',
  'laliga': '/logos/ligas/LaLiga.svg',
  'liga-espanola': '/logos/ligas/LaLiga.svg',
  'premier-league': '/logos/ligas/PremierLeague.svg',
  'premier': '/logos/ligas/PremierLeague.svg',
  'serie-a': '/logos/ligas/SerieA.svg',
  'bundesliga': '/logos/ligas/Bundesliga.svg',
  'ligue-1': '/logos/ligas/Ligue1.svg',
  'mls': '/logos/ligas/MLS.svg',
  'liga-mx': '/logos/ligas/LigaMX.svg',
  'liga-hondubet': '/logos/ligas/LigaHondubet.svg',
  'hondubet': '/logos/ligas/LigaHondubet.svg',
  'ucl': '/logos/ligas/UCL.svg',
  'champions-league': '/logos/ligas/UCL.svg',
  'uefa-champions-league': '/logos/ligas/UCL.svg',
  'concacaf': '/logos/ligas/concacaf.svg',
  'conmebol': '/logos/ligas/conmebol.svg',
  'uefa': '/logos/ligas/uefa.svg',
  'mundial-2026': '/logos/ligas/Mundial2026.webp',
  'mundial2026': '/logos/ligas/Mundial2026.webp',
};

export function getLeagueLogoUrl(slug?: string | null, name?: string | null, fallbackUrl?: string | null): string {
  const cleanSlug = (slug || '').toLowerCase().trim();
  if (KNOWN_LOCAL_LEAGUE_LOGOS[cleanSlug]) {
    return KNOWN_LOCAL_LEAGUE_LOGOS[cleanSlug];
  }
  const cleanName = (name || '')
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, '-');
  if (KNOWN_LOCAL_LEAGUE_LOGOS[cleanName]) {
    return KNOWN_LOCAL_LEAGUE_LOGOS[cleanName];
  }
  return fallbackUrl || '/logos/ligas/placeholder.svg';
}
