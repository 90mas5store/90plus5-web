import { useMemo } from 'react';
import { FOOTBALL_ALIASES } from '@/constants/footballAliases';
import { SearchResult, QuickClub } from '@/types/search';

const normalize = (s: string) =>
    (s || '')
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');

/**
 * Hook to detect if search term or alias matches ANY club in the catalog for the Club Hero Card.
 * Uses 4 matching layers:
 * 1. Direct name match in club pool
 * 2. Football alias / nickname match (e.g. merengues -> Real Madrid)
 * 3. Matched player's club from active results
 * 4. Matched product's club from active results
 */
export function useMatchedClub(
    value: string,
    results: SearchResult[],
    topClubs: QuickClub[],
    allClubs: QuickClub[] = []
): QuickClub | null {
    const hasQuery = value.trim().length >= 2;
    const clubPool = useMemo(() => (allClubs && allClubs.length > 0 ? allClubs : topClubs), [allClubs, topClubs]);

    return useMemo(() => {
        if (!hasQuery) return null;
        const q = normalize(value.trim());

        // 1. Direct match with club name (e.g. "liverpool", "arsenal", "motagua", "chelsea", "milan")
        const direct = clubPool.find((c) => {
            const cNorm = normalize(c.name);
            return cNorm.includes(q) || q.includes(cNorm);
        });
        if (direct) return direct;

        // 2. Alias match (e.g. "merengues", "vini", "bellingham", "albos", "culés", "cr7", "messi")
        const matchingAlias = FOOTBALL_ALIASES.find((a) => {
            const aNorm = normalize(a.alias);
            return aNorm === q || aNorm.includes(q) || q.includes(aNorm);
        });

        if (matchingAlias) {
            const targetNorm = normalize(matchingAlias.targetTeam);
            const aliasClub = clubPool.find((c) => {
                const cNorm = normalize(c.name);
                return cNorm.includes(targetNorm) || targetNorm.includes(cNorm);
            });
            if (aliasClub) return aliasClub;
            return {
                name: matchingAlias.targetTeam,
                query: matchingAlias.targetTeam,
            };
        }

        // 3. Match from player in results
        const firstPlayerWithClub = results.find((r) => r.type === 'player' && r.teamName);
        if (firstPlayerWithClub?.teamName) {
            const teamNorm = normalize(firstPlayerWithClub.teamName);
            const teamClub = clubPool.find((c) => {
                const cNorm = normalize(c.name);
                return cNorm.includes(teamNorm) || teamNorm.includes(cNorm);
            });
            if (teamClub) return teamClub;
            return {
                name: firstPlayerWithClub.teamName,
                query: firstPlayerWithClub.teamName,
                logoUrl: firstPlayerWithClub.teamLogo,
            };
        }

        // 4. Match from products in results
        const firstProductWithClub = results.find((r) => r.type === 'product' && r.title);
        if (firstProductWithClub) {
            const prodNorm = normalize(firstProductWithClub.title);
            const prodClub = clubPool.find((c) => {
                const cNorm = normalize(c.name);
                return cNorm.includes(prodNorm) || prodNorm.includes(cNorm);
            });
            if (prodClub) return prodClub;
        }

        return null;
    }, [hasQuery, value, clubPool, results]);
}
