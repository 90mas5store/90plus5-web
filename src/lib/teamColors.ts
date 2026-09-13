/**
 * Utilidad para normalización y resolución inteligente de colores de equipos.
 * - Respeta fielmente el color blanco (#FFFFFF) para clubes icónicos (Real Madrid, CD Olimpia, etc.).
 * - Detecta colisiones cromáticas (ej. Sunderland rojo vs Arsenal rojo) y asigna automáticamente
 *   el kit alternativo (awayAltColor) a la visita para evitar que ambos luzcan idénticos.
 */

// Diccionario de colores oficiales y alternativos conocidos (fallback enriquecido)
const KNOWN_TEAM_COLORS: Record<string, { primary: string; alternate: string }> = {
  'real madrid': { primary: '#FFFFFF', alternate: '#00529F' },
  'cd olimpia': { primary: '#FFFFFF', alternate: '#003882' },
  'olimpia': { primary: '#FFFFFF', alternate: '#003882' },
  'club deportivo olimpia': { primary: '#FFFFFF', alternate: '#003882' },
  'motagua': { primary: '#003882', alternate: '#00A3E0' },
  'real espana': { primary: '#FCD116', alternate: '#111111' },
  'marathon': { primary: '#00843D', alternate: '#DA291C' },
  'arsenal': { primary: '#EF0107', alternate: '#063672' },
  'sunderland': { primary: '#EB172B', alternate: '#1D4ED8' },
  'liverpool': { primary: '#D00027', alternate: '#00A398' },
  'manchester united': { primary: '#DA020E', alternate: '#FFE500' },
  'manchester city': { primary: '#6CABDD', alternate: '#001838' },
  'chelsea': { primary: '#034694', alternate: '#DBA111' },
  'tottenham hotspur': { primary: '#FFFFFF', alternate: '#132257' },
  'tottenham': { primary: '#FFFFFF', alternate: '#132257' },
  'fc barcelona': { primary: '#A50044', alternate: '#EDBB00' },
  'barcelona': { primary: '#A50044', alternate: '#EDBB00' },
  'atletico de madrid': { primary: '#CB3524', alternate: '#0B1726' },
  'bayern munich': { primary: '#DC052D', alternate: '#1F2937' },
  'borussia dortmund': { primary: '#FDE100', alternate: '#111111' },
  'juventus': { primary: '#FFFFFF', alternate: '#E50914' },
  'inter milan': { primary: '#0066B2', alternate: '#E50914' },
  'inter': { primary: '#0066B2', alternate: '#E50914' },
  'ac milan': { primary: '#FB090B', alternate: '#111111' },
  'paris saint germain': { primary: '#004170', alternate: '#DA291C' },
  'psg': { primary: '#004170', alternate: '#DA291C' },
};

export function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return [r, g, b];
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return [r, g, b];
  }
  return null;
}

/**
 * Calcula la distancia Euclidiana entre 2 colores en espacio RGB.
 * Retorna un valor entre 0 y 441. Valores < 90 indican choque visual directo.
 */
export function calculateColorDistance(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 999;

  const [r1, g1, b1] = rgb1;
  const [r2, g2, b2] = rgb2;

  return Math.sqrt(
    Math.pow(r1 - r2, 2) +
    Math.pow(g1 - g2, 2) +
    Math.pow(b1 - b2, 2)
  );
}

function normalizeHex(color?: string | null): string | null {
  if (!color) return null;
  const clean = color.replace('#', '').trim();
  if (!clean || (clean.length !== 3 && clean.length !== 6)) return null;
  return `#${clean.toUpperCase()}`;
}

export function isNearWhite(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const [r, g, b] = rgb;
  return r > 230 && g > 230 && b > 230;
}

export function isNearBlack(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const [r, g, b] = rgb;
  return r < 30 && g < 30 && b < 30;
}

function getTeamMetaColor(teamName?: string): { primary?: string; alternate?: string } {
  if (!teamName) return {};
  const norm = teamName.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
  for (const [key, value] of Object.entries(KNOWN_TEAM_COLORS)) {
    if (norm.includes(key) || key.includes(norm)) {
      return value;
    }
  }
  return {};
}

export interface ResolveColorsParams {
  homeColor?: string | null;
  awayColor?: string | null;
  homeAltColor?: string | null;
  awayAltColor?: string | null;
  homeTeamName?: string;
  awayTeamName?: string;
}

export interface ResolvedMatchColors {
  homeColor: string;
  awayColor: string;
  isHomeWhite: boolean;
  isAwayWhite: boolean;
  isClashingResolved: boolean;
}

/**
 * Resuelve los colores definitivos del partido:
 * 1. Garantiza que equipos blancos (Real Madrid, Olimpia) se mantengan #FFFFFF.
 * 2. Si ambos equipos tienen colores idénticos o muy similares (distancia < 90),
 *    la visita utiliza su color alternativo para máxima claridad visual.
 */
export function resolveMatchColors({
  homeColor: rawHome,
  awayColor: rawAway,
  homeAltColor: rawHomeAlt,
  awayAltColor: rawAwayAlt,
  homeTeamName,
  awayTeamName,
}: ResolveColorsParams): ResolvedMatchColors {
  const homeMeta = getTeamMetaColor(homeTeamName);
  const awayMeta = getTeamMetaColor(awayTeamName);

  // 1. Color base local
  let home = normalizeHex(rawHome) || homeMeta.primary || '#E50914';
  // Si el local es near-black, darle un tono sutil visible o su alternate
  if (isNearBlack(home)) {
    home = normalizeHex(rawHomeAlt) || homeMeta.alternate || '#374151';
  }

  // 2. Color base visitante
  let away = normalizeHex(rawAway) || awayMeta.primary || '#2563EB';
  if (isNearBlack(away)) {
    away = normalizeHex(rawAwayAlt) || awayMeta.alternate || '#1D4ED8';
  }

  // 3. Chequeo de colisión cromática (ej. Sunderland rojo vs Arsenal rojo)
  let isClashingResolved = false;
  const dist = calculateColorDistance(home, away);

  if (dist < 90) {
    // Buscar color alternativo para la visita
    const candidateAlt =
      normalizeHex(rawAwayAlt) ||
      awayMeta.alternate;

    if (candidateAlt && !isNearBlack(candidateAlt)) {
      const altDist = calculateColorDistance(home, candidateAlt);
      if (altDist >= 80) {
        away = candidateAlt;
        isClashingResolved = true;
      }
    }

    // Si aún colisiona o no había alternate válido, buscar alternativa de alto contraste
    if (calculateColorDistance(home, away) < 90) {
      if (isNearWhite(home)) {
        away = awayMeta.alternate || '#003882'; // Azul marino de contraste
      } else if (home.startsWith('#E') || home.startsWith('#D') || home.startsWith('#C') || home.startsWith('#F')) {
        // Local es rojizo/amarillento -> visita azul marino elegante
        away = candidateAlt || '#063672';
      } else {
        // Local es azulado/oscuro -> visita amarillo/dorado o blanco
        away = candidateAlt || '#FCD116';
      }
      isClashingResolved = true;
    }
  }

  return {
    homeColor: home,
    awayColor: away,
    isHomeWhite: isNearWhite(home),
    isAwayWhite: isNearWhite(away),
    isClashingResolved,
  };
}
