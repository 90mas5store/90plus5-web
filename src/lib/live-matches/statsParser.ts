import type { MatchStats } from '@/hooks/useLiveMatches';

function getStat(statsArr: any[], statName: string): string | null {
  const s = statsArr?.find((item: any) => item.name?.toLowerCase() === statName.toLowerCase());
  return s?.displayValue ? String(s.displayValue) : null;
}

export function parseMatchStats(homeComp: any, awayComp: any): MatchStats | undefined {
  const homeStatsList = homeComp?.statistics || [];
  const awayStatsList = awayComp?.statistics || [];

  const posH = getStat(homeStatsList, 'possessionPct');
  const posA = getStat(awayStatsList, 'possessionPct');
  const sotH = getStat(homeStatsList, 'shotsOnTarget');
  const sotA = getStat(awayStatsList, 'shotsOnTarget');
  const totH = getStat(homeStatsList, 'totalShots');
  const totA = getStat(awayStatsList, 'totalShots');
  const flsH = getStat(homeStatsList, 'foulsCommitted');
  const flsA = getStat(awayStatsList, 'foulsCommitted');
  const cnrH = getStat(homeStatsList, 'wonCorners');
  const cnrA = getStat(awayStatsList, 'wonCorners');

  if (posH || sotH || totH) {
    return {
      possession: posH && posA ? { home: posH, away: posA } : undefined,
      shotsOnTarget: sotH && sotA ? { home: sotH, away: sotA } : undefined,
      totalShots: totH && totA ? { home: totH, away: totA } : undefined,
      fouls: flsH && flsA ? { home: flsH, away: flsA } : undefined,
      corners: cnrH && cnrA ? { home: cnrH, away: cnrA } : undefined,
    };
  }

  return undefined;
}
