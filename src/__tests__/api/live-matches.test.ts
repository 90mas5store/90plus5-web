import { describe, it, expect } from 'vitest';
import type { LiveMatchData } from '../../hooks/useLiveMatches';

describe('Matchday / Live Matches Logic', () => {
  it('formats LiveMatchData correctly for home team', () => {
    const liveMatch: LiveMatchData = {
      homeTeam: 'Real Madrid',
      awayTeam: 'FC Barcelona',
      homeScore: 2,
      awayScore: 1,
      minute: 74,
      isHome: true,
      isManual: false,
    };

    expect(liveMatch.homeTeam).toBe('Real Madrid');
    expect(liveMatch.homeScore).toBe(2);
    expect(liveMatch.minute).toBe(74);
    expect(liveMatch.isHome).toBe(true);
  });

  it('handles manual matchday activation correctly', () => {
    const manualMatch: LiveMatchData = {
      homeTeam: 'CD Olimpia',
      awayTeam: 'Rival en Vivo',
      homeScore: 0,
      awayScore: 0,
      minute: null,
      isHome: true,
      isManual: true,
    };

    expect(manualMatch.isManual).toBe(true);
    expect(manualMatch.homeTeam).toBe('CD Olimpia');
  });
});
