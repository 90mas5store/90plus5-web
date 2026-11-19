/**
 * Utilidades lingüísticas y algorítmicas para el motor de búsqueda unificado.
 * Sin listas hardcodeadas de productos ni frases: solo normalización Unicode,
 * stopwords gramaticales del español, stemming morfológico regular y distancia Damerau-Levenshtein.
 */

export const SPANISH_STOPWORDS = new Set([
    'el', 'la', 'los', 'las',
    'un', 'una', 'unos', 'unas',
    'de', 'del', 'al', 'a',
    'en', 'con', 'por', 'para', 'sin',
    'y', 'o', 'e', 'u',
    'que', 'su', 'sus', 'mi', 'tu',
    'lo', 'le', 'se', 'es', 'son',
]);

/**
 * Normaliza texto eliminando mayúsculas, tildes/diacríticos y puntuación.
 * Convierte guiones, barras y separadores en espacios para tokenizar slugs y temporadas.
 */
export function normalizeSearchText(input: string | null | undefined): string {
    if (!input) return '';
    return String(input)
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

/**
 * Separa automáticamente fronteras entre letras y dígitos:
 * "formula1" -> "formula 1", "mundial2026" -> "mundial 2026", "cr7" -> "cr 7"
 */
export function splitLetterDigitBoundaries(text: string): string {
    return text
        .replace(/([a-z])(\d)/g, '$1 $2')
        .replace(/(\d)([a-z])/g, '$1 $2');
}

/**
 * Stemmer morfológico ligero para español.
 * Unifica género y plurales regulares (ej: femenino/femenina/femenil -> "femen",
 * niño/niña/niños -> "nin", gorras/gorra -> "gorr", camisetas/camiseta -> "camiset")
 * aplicándose simétricamente a documentos y consultas.
 */
export function stemSpanish(rawWord: string): string {
    const word = rawWord;
    if (!word || word.length < 4 || /^\d+$/.test(word)) return word;

    let stem = word;

    // 1. Plurales regulares
    if (stem.length >= 6 && stem.endsWith('ces')) {
        stem = stem.slice(0, -3) + 'z';
    } else if (
        stem.length >= 5 &&
        stem.endsWith('es') &&
        /[bcdfghjklmnpqrstvwxyz]$/.test(stem.slice(0, -2))
    ) {
        stem = stem.slice(0, -2);
    } else if (stem.length >= 4 && stem.endsWith('s') && !stem.endsWith('ss')) {
        stem = stem.slice(0, -1);
    }

    // 2. Sufijos adjetivales / de género (-ino/-ina/-il)
    if (stem.length >= 6 && (stem.endsWith('ino') || stem.endsWith('ina'))) {
        stem = stem.slice(0, -3);
    } else if (stem.length >= 6 && stem.endsWith('il')) {
        stem = stem.slice(0, -2);
    }

    // 3. Vocal de género final (-o / -a)
    if (stem.length >= 4 && (stem.endsWith('o') || stem.endsWith('a'))) {
        stem = stem.slice(0, -1);
    }

    return stem.length >= 3 ? stem : word;
}

/**
 * Tokeniza una consulta humana: normaliza, separa letra↔número y limpia conectores gramaticales.
 */
export function tokenizeQuery(raw: string): string[] {
    const normalized = normalizeSearchText(raw);
    if (!normalized) return [];

    const split = splitLetterDigitBoundaries(normalized);
    const allTokens = split.split(/\s+/).filter(Boolean);
    if (allTokens.length === 0) return [];

    const meaningful = allTokens.filter((t) => !SPANISH_STOPWORDS.has(t));
    return meaningful.length > 0 ? meaningful : allTokens;
}

/**
 * Tokeniza texto de un documento del catálogo conservando tanto formas unidas
 * (ej. "f1", "cr7") como separadas (ej. "f", "1", "cr", "7").
 */
export function tokenizeDocument(raw: string | null | undefined): string[] {
    const normalized = normalizeSearchText(raw);
    if (!normalized) return [];

    const baseTokens = normalized.split(/\s+/).filter(Boolean);
    const expanded = splitLetterDigitBoundaries(normalized).split(/\s+/).filter(Boolean);

    const unique = new Set<string>();
    for (const t of baseTokens) {
        if (!SPANISH_STOPWORDS.has(t)) unique.add(t);
    }
    for (const t of expanded) {
        if (!SPANISH_STOPWORDS.has(t)) unique.add(t);
    }

    return Array.from(unique);
}

/**
 * Máximo número de errores ortográficos permitidos según la longitud del token.
 */
export function maxTyposForLength(len: number): number {
    if (len <= 3) return 0;
    if (len <= 6) return 1;
    return 2;
}

/**
 * Distancia Damerau-Levenshtein (Optimal String Alignment) con corte temprano.
 * Tolera omisiones ("amerca"), inserciones ("barceloona"), sustituciones ("barza")
 * y transposiciones adyacentes ("amercia", "mardid").
 */
export function damerauLevenshtein(a: string, b: string, maxDist = 2): number {
    if (a === b) return 0;
    const lenA = a.length;
    const lenB = b.length;

    if (Math.abs(lenA - lenB) > maxDist) return maxDist + 1;
    if (lenA === 0) return lenB;
    if (lenB === 0) return lenA;

    let prevPrev = new Array<number>(lenB + 1);
    let prev = new Array<number>(lenB + 1);
    let curr = new Array<number>(lenB + 1);

    for (let j = 0; j <= lenB; j++) prev[j] = j;

    for (let i = 1; i <= lenA; i++) {
        curr[0] = i;
        let rowMin = curr[0];

        for (let j = 1; j <= lenB; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            let val = Math.min(
                prev[j] + 1,       // eliminación
                curr[j - 1] + 1,   // inserción
                prev[j - 1] + cost // sustitución
            );

            // Transposición adyacente
            if (
                i > 1 &&
                j > 1 &&
                a[i - 1] === b[j - 2] &&
                a[i - 2] === b[j - 1]
            ) {
                val = Math.min(val, prevPrev[j - 2] + 1);
            }

            curr[j] = val;
            if (val < rowMin) rowMin = val;
        }

        if (rowMin > maxDist) return maxDist + 1;

        const tmp = prevPrev;
        prevPrev = prev;
        prev = curr;
        curr = tmp;
    }

    return prev[lenB];
}

/**
 * Genera formas pegadas sin espacios a partir de una lista de tokens de un nombre
 * (ej: ["real", "madrid"] -> ["realmadrid"], ["paris", "saint", "germain"] -> ["parissaint", "saintgermain", "parissaintgermain"]).
 * Permite que búsquedas sin espacio ("realmadrid", "intermiami", "mangalarga") coincidan algorítmicamente.
 */
export function extractJoinedCompounds(tokens: string[]): string[] {
    if (tokens.length < 2) return [];
    const compounds = new Set<string>();

    for (let i = 0; i < tokens.length - 1; i++) {
        const a = tokens[i];
        const b = tokens[i + 1];
        if (/^[a-z0-9]+$/.test(a) && /^[a-z0-9]+$/.test(b)) {
            const pair = a + b;
            if (pair.length >= 6) compounds.add(pair);
        }
    }

    if (tokens.length >= 2 && tokens.length <= 4) {
        const all = tokens.join('');
        if (all.length >= 6 && all.length <= 28) compounds.add(all);
    }

    return Array.from(compounds);
}

export interface AdjacentCompound {
    joined: string;
    startIndex: number;
    endIndex: number;
    original: string;
}

/**
 * Genera candidatos uniendo pares de tokens alfabéticos adyacentes.
 * Resuelve errores humanos de espacio accidental (ej: "mota gua" -> "motagua").
 */
export function buildAdjacentCompounds(tokens: string[]): AdjacentCompound[] {
    const compounds: AdjacentCompound[] = [];
    for (let i = 0; i < tokens.length - 1; i++) {
        const a = tokens[i];
        const b = tokens[i + 1];
        if (!/^[a-z]+$/.test(a) || !/^[a-z]+$/.test(b)) continue;
        const joined = a + b;
        if (joined.length < 5) continue;
        compounds.push({
            joined,
            startIndex: i,
            endIndex: i + 1,
            original: `${a} ${b}`,
        });
    }
    return compounds;
}
