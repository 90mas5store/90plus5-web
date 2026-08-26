import { describe, it, expect } from 'vitest';
import {
  calculateRecommendedSize,
  convertKgToLb,
  convertLbToKg,
  detectAudienceGender,
  isPlayerCut,
  KIDS_MEASUREMENTS_TABLE,
  SIZE_MEASUREMENTS_TABLE,
  WOMEN_MEASUREMENTS_TABLE,
} from '../../lib/utils/sizeRecommender';

describe('sizeRecommender Utility', () => {
  it('converts weight correctly between kg and lb', () => {
    expect(convertLbToKg(165)).toBe(74.8);
    expect(convertKgToLb(75)).toBe(165);
  });

  it('detects player cut versions correctly', () => {
    expect(isPlayerCut('Versión Jugador')).toBe(true);
    expect(isPlayerCut('Player Version')).toBe(true);
    expect(isPlayerCut('Match Shirt')).toBe(true);
    expect(isPlayerCut('Versión Fan')).toBe(false);
    expect(isPlayerCut(null)).toBe(false);
  });

  it('detects audience gender automatically', () => {
    expect(detectAudienceGender('Camiseta Dama Real Madrid', 'Futbol')).toBe('woman');
    expect(detectAudienceGender('Kit Niño Barcelona 2026', 'Niños')).toBe('kid');
    expect(detectAudienceGender('Camiseta Real Madrid Home', 'Futbol', ['16', '18', '20'])).toBe('kid');
    expect(detectAudienceGender('Camiseta Real Madrid Home', 'Futbol')).toBe('man');
  });

  it('recommends size M for standard height 175cm and weight 75kg in Fan version for Men', () => {
    const result = calculateRecommendedSize({
      heightCm: 175,
      weightValue: 75,
      weightUnit: 'kg',
      fitPreference: 'normal',
      audienceGender: 'man',
      brandName: 'Nike',
      versionName: 'Versión Fan',
    });

    expect(result.recommendedSize).toBe('M');
    expect(result.isPlayerVersion).toBe(false);
  });

  it('recommends women sizing correctly for 163cm and 58kg', () => {
    const result = calculateRecommendedSize({
      heightCm: 163,
      weightValue: 58,
      weightUnit: 'kg',
      fitPreference: 'normal',
      audienceGender: 'woman',
      brandName: 'Adidas',
      versionName: 'Versión Fan',
    });

    expect(result.recommendedSize).toBe('S');
    expect(result.audienceGender).toBe('woman');
  });

  it('recommends kids numeric size 24 for 8-9 years old child', () => {
    const result = calculateRecommendedSize({
      heightCm: 140,
      weightValue: 32,
      weightUnit: 'kg',
      fitPreference: 'normal',
      audienceGender: 'kid',
      childAgeYears: 8,
      brandName: 'Puma',
    });

    expect(result.recommendedSize).toBe('24');
    expect(result.audienceGender).toBe('kid');
  });

  it('contains valid size measurement tables for Men, Women and Kids', () => {
    expect(SIZE_MEASUREMENTS_TABLE.length).toBe(5);
    expect(WOMEN_MEASUREMENTS_TABLE.length).toBe(6);
    expect(KIDS_MEASUREMENTS_TABLE.length).toBe(7);
    expect(KIDS_MEASUREMENTS_TABLE[0].size).toBe('16');
  });
});
