import { describe, it, expect } from 'vitest';
import { matchPlayers, parsePlayerQuery, buildPlayerProductHref, PlayerLike } from '@/lib/search/playerMatch';

describe('Player Search Matcher', () => {
    const mockPlayers: PlayerLike[] = [
        { id: '1', name: 'LAMINE YAMAL', number: '19', productIds: ['prod-1', 'prod-2'] },
        { id: '2', name: 'ROBERT LEWANDOWSKI', number: '9', productIds: ['prod-1'] },
        { id: '3', name: 'PEDRI', number: '8', productIds: ['prod-1'] },
        { id: '4', name: 'VINICIUS JR', number: '7', productIds: ['prod-3'] },
        { id: '5', name: 'LUKA MODRIC', number: '10', productIds: [] }, // Sin camisas asignadas
    ];

    it('parses player query correctly separating tokens and numbers', () => {
        expect(parsePlayerQuery('yamal 19')).toEqual({
            nameTokens: ['yamal'],
            number: '19',
        });
        expect(parsePlayerQuery('10 messi')).toEqual({
            nameTokens: ['messi'],
            number: '10',
        });
        expect(parsePlayerQuery('lamine yamal')).toEqual({
            nameTokens: ['lamine', 'yamal'],
            number: null,
        });
    });

    it('matches players ignoring accents and case', () => {
        const matches = matchPlayers(mockPlayers, 'lamine');
        expect(matches.length).toBe(1);
        expect(matches[0].name).toBe('LAMINE YAMAL');

        const matchesAccented = matchPlayers(mockPlayers, 'pédri');
        expect(matchesAccented.length).toBe(1);
        expect(matchesAccented[0].name).toBe('PEDRI');
    });

    it('matches by partial word prefix', () => {
        const matches = matchPlayers(mockPlayers, 'yam');
        expect(matches.length).toBe(1);
        expect(matches[0].name).toBe('LAMINE YAMAL');
    });

    it('filters by number when provided in query', () => {
        const matches = matchPlayers(mockPlayers, 'yamal 19');
        expect(matches.length).toBe(1);
        expect(matches[0].number).toBe('19');

        const wrongNumber = matchPlayers(mockPlayers, 'yamal 10');
        expect(wrongNumber.length).toBe(0);
    });

    it('ignores players without associated products', () => {
        const matches = matchPlayers(mockPlayers, 'modric');
        expect(matches.length).toBe(0);
    });

    it('requires minimum length of 3 chars', () => {
        const matches = matchPlayers(mockPlayers, 'ya');
        expect(matches.length).toBe(0);
    });

    it('generates product url with preselected player dorsal parameter', () => {
        expect(buildPlayerProductHref('barca-local-2026', '19')).toBe('/producto/barca-local-2026?d=j&ji=19');
        expect(buildPlayerProductHref('barca-local-2026', '')).toBe('/producto/barca-local-2026');
    });
});
