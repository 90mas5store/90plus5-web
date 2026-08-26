export type WeightUnit = 'kg' | 'lb';
export type FitPreference = 'tight' | 'normal' | 'loose';
export type AudienceGender = 'man' | 'woman' | 'kid';

export interface SizeRecommendationInput {
  heightCm: number;
  weightValue: number;
  weightUnit: WeightUnit;
  fitPreference: FitPreference;
  audienceGender?: AudienceGender;
  childAgeYears?: number;
  brandName?: string | null;
  versionName?: string | null;
}

export interface SizeRecommendationResult {
  recommendedSize: string;
  explanation: string;
  isPlayerVersion: boolean;
  brandName: string;
  sizeIndex: number;
  audienceGender: AudienceGender;
}

export interface SizeMeasurement {
  size: string;
  fanPecho: number;
  fanLargo: number;
  playerPecho: number;
  playerLargo: number;
}

export interface KidsSizeMeasurement {
  size: string;
  approxAge: string;
  heightRange: string;
  pecho: number;
  largo: number;
}

export const SIZE_ORDER = ['S', 'M', 'L', 'XL', '2XL', '3XL'];

export const SIZE_MEASUREMENTS_TABLE: SizeMeasurement[] = [
  { size: 'S', fanPecho: 48, fanLargo: 70, playerPecho: 45, playerLargo: 69 },
  { size: 'M', fanPecho: 51, fanLargo: 72, playerPecho: 48, playerLargo: 71 },
  { size: 'L', fanPecho: 54, fanLargo: 75, playerPecho: 51, playerLargo: 74 },
  { size: 'XL', fanPecho: 57, fanLargo: 78, playerPecho: 54, playerLargo: 77 },
  { size: '2XL', fanPecho: 60, fanLargo: 81, playerPecho: 57, playerLargo: 80 },
];

export const WOMEN_MEASUREMENTS_TABLE: SizeMeasurement[] = [
  { size: 'XS', fanPecho: 40, fanLargo: 61, playerPecho: 38, playerLargo: 60 },
  { size: 'S', fanPecho: 43, fanLargo: 63, playerPecho: 41, playerLargo: 62 },
  { size: 'M', fanPecho: 46, fanLargo: 65, playerPecho: 44, playerLargo: 64 },
  { size: 'L', fanPecho: 49, fanLargo: 67, playerPecho: 47, playerLargo: 66 },
  { size: 'XL', fanPecho: 52, fanLargo: 69, playerPecho: 50, playerLargo: 68 },
  { size: '2XL', fanPecho: 55, fanLargo: 71, playerPecho: 53, playerLargo: 70 },
];

export const KIDS_MEASUREMENTS_TABLE: KidsSizeMeasurement[] = [
  { size: '16', approxAge: '2-3 años', heightRange: '90-105 cm', pecho: 33, largo: 44 },
  { size: '18', approxAge: '3-4 años', heightRange: '105-115 cm', pecho: 35, largo: 47 },
  { size: '20', approxAge: '4-5 años', heightRange: '115-125 cm', pecho: 37, largo: 50 },
  { size: '22', approxAge: '6-7 años', heightRange: '125-135 cm', pecho: 39, largo: 53 },
  { size: '24', approxAge: '8-9 años', heightRange: '135-145 cm', pecho: 41, largo: 56 },
  { size: '26', approxAge: '10-11 años', heightRange: '145-155 cm', pecho: 43, largo: 59 },
  { size: '28', approxAge: '12-13 años', heightRange: '155-165 cm', pecho: 45, largo: 62 },
];

export function detectAudienceGender(
  productName?: string | null,
  categoryName?: string | null,
  availableSizes?: string[],
  genderRaw?: string | null
): AudienceGender {
  if (genderRaw) {
    const g = genderRaw.toLowerCase().trim();
    if (g === 'woman' || g === 'mujer' || g === 'women' || g === 'dama') return 'woman';
    if (g === 'kid' || g === 'nino' || g === 'ninos' || g === 'kids' || g === 'infantil') return 'kid';
    if (g === 'man' || g === 'hombre' || g === 'men') return 'man';
  }
  const text = `${productName || ''} ${categoryName || ''}`.toLowerCase().trim();
  if (text.includes('mujer') || text.includes('dama') || text.includes('women') || text.includes('woman')) {
    return 'woman';
  }
  if (
    text.includes('niño') ||
    text.includes('nino') ||
    text.includes('kid') ||
    text.includes('infantil') ||
    text.includes('juvenil')
  ) {
    return 'kid';
  }
  if (availableSizes && availableSizes.some((s) => ['16', '18', '20', '22', '24', '26', '28'].includes(s.trim()))) {
    return 'kid';
  }
  return 'man';
}

export function isPlayerCut(versionName?: string | null): boolean {
  if (!versionName) return false;
  const v = versionName.toLowerCase().trim();
  return (
    v.includes('jugador') ||
    v.includes('player') ||
    v.includes('match') ||
    v.includes('pro') ||
    v.includes('authentic')
  );
}

export function convertLbToKg(lbs: number): number {
  return Math.round(lbs * 0.453592 * 10) / 10;
}

export function convertKgToLb(kg: number): number {
  return Math.round(kg * 2.20462);
}

export function calculateRecommendedSize(
  input: SizeRecommendationInput
): SizeRecommendationResult {
  const {
    heightCm,
    weightValue,
    weightUnit,
    fitPreference,
    audienceGender = 'man',
    childAgeYears = 8,
    brandName,
    versionName,
  } = input;

  const weightKg = weightUnit === 'lb' ? convertLbToKg(weightValue) : weightValue;
  const isPlayer = isPlayerCut(versionName);
  const brand = (brandName || 'Genérico').trim();

  // 1. CASO ESPECIAL: NIÑOS (KIDS)
  if (audienceGender === 'kid') {
    let kidSize = '24';
    let approx = '8-9 años';

    if (childAgeYears <= 3 || heightCm <= 105) {
      kidSize = '16';
      approx = '2-3 años';
    } else if (childAgeYears === 4 || heightCm <= 115) {
      kidSize = '18';
      approx = '3-4 años';
    } else if (childAgeYears === 5 || heightCm <= 125) {
      kidSize = '20';
      approx = '4-5 años';
    } else if (childAgeYears <= 7 || heightCm <= 135) {
      kidSize = '22';
      approx = '6-7 años';
    } else if (childAgeYears <= 9 || heightCm <= 145) {
      kidSize = '24';
      approx = '8-9 años';
    } else if (childAgeYears <= 11 || heightCm <= 155) {
      kidSize = '26';
      approx = '10-11 años';
    } else {
      kidSize = '28';
      approx = '12-13 años';
    }

    const explanation = `Para un niño/a de ${childAgeYears} años (estatura aprox. ${heightCm} cm), la **Talla ${kidSize}** (${approx}) brindará un calce cómodo e ideal para jugar.`;

    return {
      recommendedSize: kidSize,
      explanation,
      isPlayerVersion: false,
      brandName: brand,
      sizeIndex: 0,
      audienceGender: 'kid',
    };
  }

  // 2. CASO MUJER (WOMAN)
  if (audienceGender === 'woman') {
    let womanIndex = 1; // Default 'M'
    const womanOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL'];

    if (heightCm < 160) {
      if (weightKg < 48) womanIndex = 0; // XS
      else if (weightKg <= 58) womanIndex = 1; // S
      else if (weightKg <= 68) womanIndex = 2; // M
      else womanIndex = 3; // L
    } else if (heightCm <= 170) {
      if (weightKg < 52) womanIndex = 0; // XS
      else if (weightKg <= 62) womanIndex = 1; // S
      else if (weightKg <= 72) womanIndex = 2; // M
      else if (weightKg <= 82) womanIndex = 3; // L
      else womanIndex = 4; // XL
    } else {
      // > 170 cm
      if (weightKg < 58) womanIndex = 1; // S
      else if (weightKg <= 68) womanIndex = 2; // M
      else if (weightKg <= 78) womanIndex = 3; // L
      else if (weightKg <= 88) womanIndex = 4; // XL
      else womanIndex = 5; // 2XL
    }

    if (fitPreference === 'tight') {
      womanIndex = Math.max(0, womanIndex - 1);
    } else if (fitPreference === 'loose') {
      womanIndex = Math.min(womanOrder.length - 1, womanIndex + 1);
    }

    if (isPlayer && fitPreference !== 'tight') {
      womanIndex = Math.min(womanOrder.length - 1, womanIndex + 1);
    }

    const finalSize = womanOrder[womanIndex] || 'M';
    let explanation = `Para silueta femenina (${heightCm} cm y ${weightValue} ${weightUnit})`;
    if (isPlayer) {
      explanation += ` en versión **Dama Jugador (Slim Fit)** de ${brand}, recomendamos **Talla ${finalSize}** para mayor comodidad en el busto y cintura.`;
    } else {
      explanation += ` en versión **Dama (Corte Entallado)** de ${brand}, la **Talla ${finalSize}** te brindará el ajuste perfecto.`;
    }

    return {
      recommendedSize: finalSize,
      explanation,
      isPlayerVersion: isPlayer,
      brandName: brand,
      sizeIndex: womanIndex,
      audienceGender: 'woman',
    };
  }

  // 3. CASO HOMBRE / UNISEX (MAN)
  let baseIndex = 1; // Default 'M'

  if (heightCm < 160) {
    if (weightKg < 55) baseIndex = 0; // S
    else if (weightKg <= 68) baseIndex = 1; // M
    else if (weightKg <= 80) baseIndex = 2; // L
    else baseIndex = 3; // XL
  } else if (heightCm <= 172) {
    if (weightKg < 60) baseIndex = 0; // S
    else if (weightKg <= 72) baseIndex = 1; // M
    else if (weightKg <= 85) baseIndex = 2; // L
    else if (weightKg <= 98) baseIndex = 3; // XL
    else baseIndex = 4; // 2XL
  } else if (heightCm <= 183) {
    if (weightKg < 65) baseIndex = 0; // S
    else if (weightKg <= 77) baseIndex = 1; // M
    else if (weightKg <= 90) baseIndex = 2; // L
    else if (weightKg <= 105) baseIndex = 3; // XL
    else baseIndex = 4; // 2XL
  } else if (heightCm <= 192) {
    if (weightKg < 72) baseIndex = 1; // M
    else if (weightKg <= 84) baseIndex = 2; // L
    else if (weightKg <= 98) baseIndex = 3; // XL
    else if (weightKg <= 112) baseIndex = 4; // 2XL
    else baseIndex = 5; // 3XL
  } else {
    if (weightKg < 80) baseIndex = 2; // L
    else if (weightKg <= 92) baseIndex = 3; // XL
    else if (weightKg <= 108) baseIndex = 4; // 2XL
    else baseIndex = 5; // 3XL
  }

  let currentIndex = baseIndex;
  if (fitPreference === 'tight') {
    currentIndex = Math.max(0, currentIndex - 1);
  } else if (fitPreference === 'loose') {
    currentIndex = Math.min(SIZE_ORDER.length - 1, currentIndex + 1);
  }

  if (isPlayer && fitPreference !== 'tight') {
    currentIndex = Math.min(SIZE_ORDER.length - 1, currentIndex + 1);
  }

  const finalSize = SIZE_ORDER[currentIndex] || 'M';

  let explanation = `Para tu contextura (${heightCm} cm y ${weightValue} ${weightUnit})`;

  if (isPlayer) {
    explanation += `, al tratarse de una versión **Jugador (Slim Fit)** de ${brand}, las prendas vienen más ajustadas al cuerpo.`;
    if (fitPreference === 'tight') {
      explanation += ` Al preferir un ajuste entallado, la talla **${finalSize}** te quedará perfecta.`;
    } else {
      explanation += ` Hemos incrementado una talla a **${finalSize}** para que te quede cómoda sin apretar.`;
    }
  } else {
    explanation += ` en versión **Fan (Corte Estándar)** de ${brand}`;
    if (fitPreference === 'tight') {
      explanation += `, la talla **${finalSize}** te brindará un ajuste al cuerpo.`;
    } else if (fitPreference === 'loose') {
      explanation += `, la talla **${finalSize}** te brindará un ajuste holgado y cómodo.`;
    } else {
      explanation += `, la talla **${finalSize}** te dará un calce regular ideal.`;
    }
  }

  return {
    recommendedSize: finalSize,
    explanation,
    isPlayerVersion: isPlayer,
    brandName: brand,
    sizeIndex: currentIndex,
    audienceGender: 'man',
  };
}
