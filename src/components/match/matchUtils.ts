import type { LiveMatchData, MatchEventDetail } from "@/hooks/useLiveMatches";

// Limpiar y formatear el minuto de juego de forma precisa (ej. "90+7'")
export function formatMatchMinute(rawMinute?: string | null): string {
  if (!rawMinute) return "•";
  const clean = rawMinute.replace(/['"´`\s]+/g, '').trim();
  return clean ? `${clean}'` : "•";
}

export function getResolvedLeagueSlug(match: LiveMatchData | null): string {
  if (!match) return 'mex.1';
  if (match.leagueSlug && match.leagueSlug.trim()) return match.leagueSlug;
  const name = (match.leagueName || '').toLowerCase();
  if (name.includes('liga mx') || name.includes('mexic') || name.includes('apertura') || name.includes('clausura')) return 'mex.1';
  if (name.includes('la liga') || name.includes('laliga') || name.includes('españ') || name.includes('spain')) return 'esp.1';
  if (name.includes('premier') || name.includes('england') || name.includes('inglaterra')) return 'eng.1';
  if (name.includes('serie a') || name.includes('ital')) return 'ita.1';
  if (name.includes('bundesliga') || name.includes('aleman')) return 'ger.1';
  if (name.includes('ligue 1') || name.includes('francia')) return 'fra.1';
  if (name.includes('mls') || name.includes('major league')) return 'usa.1';
  if (name.includes('honduras') || name.includes('liga nacional')) return 'hon.1';
  if (name.includes('champions') || name.includes('ucl')) return 'uefa.champions';

  const combined = `${match.homeTeam || ''} ${match.awayTeam || ''}`.toLowerCase();
  if (combined.includes('america') || combined.includes('cruz azul') || combined.includes('chivas') || combined.includes('tigres') || combined.includes('monterrey') || combined.includes('toluca') || combined.includes('pumas') || combined.includes('atlas')) return 'mex.1';
  if (combined.includes('real madrid') || combined.includes('barcelona') || combined.includes('atletico') || combined.includes('sevilla') || combined.includes('betis')) return 'esp.1';
  if (combined.includes('arsenal') || combined.includes('city') || combined.includes('liverpool') || combined.includes('chelsea') || combined.includes('united') || combined.includes('tottenham')) return 'eng.1';
  if (combined.includes('olimpia') || combined.includes('motagua') || combined.includes('marathon') || combined.includes('real españa') || combined.includes('espana')) return 'hon.1';
  if (combined.includes('inter miami') || combined.includes('lafc') || combined.includes('galaxy') || combined.includes('nashville')) return 'usa.1';

  return 'mex.1';
}

export function getEventVisual(evt: MatchEventDetail): { icon: string; label: string } {
  switch (evt.type) {
    case 'goal':
      return {
        icon: '⚽',
        label: evt.disallowed ? (evt.text ? `${evt.text} (Anulado por VAR)` : 'Gol (Anulado por VAR)') : (evt.text || 'Gol')
      };
    case 'penalty-goal':
      return {
        icon: '🎯',
        label: evt.disallowed ? 'Gol de Penal (Anulado por VAR)' : 'Gol de Penal'
      };
    case 'penalty-miss':
      return { icon: '❌', label: 'Penal Fallado' };
    case 'own-goal':
      return { icon: '⚽', label: 'Autogol' };
    case 'disallowed-goal':
      return { icon: '🚫', label: evt.text || 'Gol Anulado (VAR)' };
    case 'var':
      return { icon: '📺', label: evt.text || 'Revisión VAR' };
    case 'red-card':
      return { icon: '🟥', label: 'Tarjeta Roja' };
    case 'yellow-card':
      return { icon: '🟨', label: 'Tarjeta Amarilla' };
    default:
      return { icon: '⚽', label: evt.text || 'Incidencia' };
  }
}

// Función de proyección de momentum física exacta de Apple (§6 apple-design skill)
export function projectMomentum(initialVelocity: number, decelerationRate = 0.998): number {
  return (initialVelocity / 1000) * decelerationRate / (1 - decelerationRate);
}
