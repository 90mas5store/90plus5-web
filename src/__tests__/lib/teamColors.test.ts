import { describe, it, expect } from 'vitest';
import { resolveMatchColors, calculateColorDistance, isNearWhite } from '@/lib/teamColors';

describe('teamColors resolution & clash detection', () => {
  it('preserves authentic white color for Real Madrid and CD Olimpia', () => {
    const result = resolveMatchColors({
      homeColor: '#FFFFFF',
      awayColor: '#A50044',
      homeTeamName: 'Real Madrid',
      awayTeamName: 'FC Barcelona',
    });

    expect(result.homeColor).toBe('#FFFFFF');
    expect(result.isHomeWhite).toBe(true);
    expect(result.awayColor).toBe('#A50044');
  });

  it('detects color clash and uses awayAltColor (Sunderland vs Arsenal)', () => {
    const result = resolveMatchColors({
      homeColor: '#EB172B', // Sunderland rojo
      awayColor: '#EF0107', // Arsenal rojo
      awayAltColor: '#063672', // Arsenal azul marino alternativo
      homeTeamName: 'Sunderland',
      awayTeamName: 'Arsenal',
    });

    expect(result.isClashingResolved).toBe(true);
    expect(result.homeColor).toBe('#EB172B');
    expect(result.awayColor).toBe('#063672');
  });

  it('resolves clash when both teams are white (Real Madrid vs Olimpia)', () => {
    const result = resolveMatchColors({
      homeColor: '#FFFFFF',
      awayColor: '#FFFFFF',
      awayAltColor: '#003882',
      homeTeamName: 'Real Madrid',
      awayTeamName: 'CD Olimpia',
    });

    expect(result.homeColor).toBe('#FFFFFF');
    expect(result.awayColor).toBe('#003882');
    expect(result.isClashingResolved).toBe(true);
  });
});
