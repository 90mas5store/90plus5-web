import { damerauLevenshtein, maxTyposForLength, SPANISH_STOPWORDS } from './textUtils';

/**
 * Coincidencia de jugadores para la búsqueda (cliente y servidor).
 * Insensible a mayúsculas/tildes, soporta prefijo de palabra, tolerancia a errores
 * ortográficos (Damerau-Levenshtein) y dorsal opcional (ej. "yamal", "bellingam", "yamal 19", "19 yamal").
 */

export interface PlayerLike {
    id: string;
    name: string;
    number: string;
    productIds: string[];
}

export const normalizeSearchText = (s: string) =>
    (s || '')
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim();

export const PLAYER_MIN_QUERY_LENGTH = 3;

/** Separa la consulta en palabras de nombre y un posible dorsal. */
export function parsePlayerQuery(query: string): { nameTokens: string[]; number: string | null } {
    const tokens = normalizeSearchText(query)
        .replace(/[^a-z0-9\s]+/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
    const numberToken = tokens.find((t) => /^\d{1,2}$/.test(t)) ?? null;
    const rawNameTokens = tokens.filter((t) => t !== numberToken);
    const meaningful = rawNameTokens.filter((t) => !SPANISH_STOPWORDS.has(t));
    const nameTokens = meaningful.length > 0 ? meaningful : rawNameTokens;
    return { nameTokens, number: numberToken };
}

function tokenMatchesPlayerWord(token: string, word: string): number {
    if (word === token) return 3;
    if (word.startsWith(token)) return 2;
    if (token.length >= 4 && word.length >= 4) {
        const maxDist = Math.min(maxTyposForLength(token.length), 1);
        if (maxDist > 0 && damerauLevenshtein(token, word, maxDist) <= maxDist) {
            return 1.2;
        }
    }
    return 0;
}

/** Devuelve los jugadores que coinciden, ordenados por relevancia. */
export function matchPlayers<T extends PlayerLike>(players: T[], query: string, limit = 3): T[] {
    const { nameTokens, number } = parsePlayerQuery(query);
    const nameQuery = nameTokens.join(' ');
    if (nameQuery.length < PLAYER_MIN_QUERY_LENGTH) return [];

    const scored: { player: T; score: number }[] = [];

    for (const player of players) {
        if (player.productIds.length === 0) continue;
        if (number && player.number !== number) continue;

        const name = normalizeSearchText(player.name);
        const words = name.split(/\s+/).filter(Boolean);

        // Evaluar qué tokens coinciden con alguna palabra del nombre del jugador
        let tokenMatchSum = 0;
        let matchedCount = 0;

        for (const t of nameTokens) {
            let bestWordScore = 0;
            for (const w of words) {
                const s = tokenMatchesPlayerWord(t, w);
                if (s > bestWordScore) bestWordScore = s;
            }
            if (bestWordScore > 0) {
                matchedCount++;
                tokenMatchSum += bestWordScore;
            }
        }

        // Exigir que coincidan todos los tokens de nombre escritos
        // (o si escribió 2+ palabras, ej. "barcelona yamal", aceptar si coincide un apellido exacto >= 5 letras)
        const allTokensMatch = matchedCount === nameTokens.length;
        const strongExactSurnameInMultiWord =
            !allTokensMatch &&
            nameTokens.length >= 2 &&
            nameTokens.some((t) => t.length >= 5 && words.some((w) => w === t));

        if (!allTokensMatch && !strongExactSurnameInMultiWord) continue;

        let score = tokenMatchSum;
        if (name === nameQuery) score += 4;
        else if (name.startsWith(nameQuery)) score += 3;
        else if (allTokensMatch) score += 1.5;
        if (number) score += 1.5;

        scored.push({ player, score });
    }

    return scored
        .sort((a, b) => b.score - a.score || b.player.productIds.length - a.player.productIds.length)
        .slice(0, limit)
        .map((s) => s.player);
}

/** Link al producto con el jugador preseleccionado en el personalizador. */
export function buildPlayerProductHref(productSlugOrId: string, playerNumber: string): string {
    const base = `/producto/${productSlugOrId}`;
    return playerNumber ? `${base}?d=j&ji=${encodeURIComponent(playerNumber)}` : base;
}
