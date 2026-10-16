/**
 * Coincidencia de jugadores para la búsqueda (cliente y servidor).
 * Insensible a mayúsculas/tildes, por prefijo de palabra, con dorsal opcional
 * (ej. "yamal", "lamine y", "yamal 19", "19 yamal").
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
    const tokens = normalizeSearchText(query).split(/\s+/).filter(Boolean);
    const numberToken = tokens.find((t) => /^\d{1,2}$/.test(t)) ?? null;
    const nameTokens = tokens.filter((t) => t !== numberToken);
    return { nameTokens, number: numberToken };
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
        const words = name.split(/\s+/);

        // Cada palabra escrita debe ser prefijo de alguna palabra del nombre
        const allTokensMatch = nameTokens.every((t) => words.some((w) => w.startsWith(t)));
        if (!allTokensMatch) continue;

        let score = 1;
        if (name === nameQuery) score = 4;
        else if (name.startsWith(nameQuery)) score = 3;
        else if (words.some((w) => w === nameTokens[0])) score = 2;
        if (number) score += 1;

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
