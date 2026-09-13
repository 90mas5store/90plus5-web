import { describe, it, expect, vi } from 'vitest';
import { GET } from '@/app/api/standings/route';
import { NextRequest } from 'next/server';

describe('Standings API (/api/standings)', () => {
  it('sorts standings strictly by rank ascending', async () => {
    const mockEspnResponse = {
      children: [
        {
          name: 'Eastern Conference',
          standings: {
            entries: [
              {
                team: { id: '1', displayName: 'New York City FC' },
                stats: [{ name: 'rank', value: 9 }, { name: 'points', value: 29 }],
              },
              {
                team: { id: '2', displayName: 'Nashville SC' },
                stats: [{ name: 'rank', value: 1 }, { name: 'points', value: 53 }],
              },
              {
                team: { id: '3', displayName: 'Inter Miami CF' },
                stats: [{ name: 'rank', value: 2 }, { name: 'points', value: 44 }],
              },
              {
                team: { id: '4', displayName: 'Atlanta United FC' },
                stats: [{ name: 'rank', value: 14 }, { name: 'points', value: 22 }],
              },
              {
                team: { id: '5', displayName: 'Charlotte FC' },
                stats: [{ name: 'rank', value: 5 }, { name: 'points', value: 39 }],
              },
            ],
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockEspnResponse,
    });

    const req = new NextRequest('http://localhost:3000/api/standings?league=usa.1&team=Miami');
    const res = await GET(req);
    const data = await res.json();

    expect(data.standings).toBeDefined();
    expect(data.standings.length).toBe(5);

    // Verificación de orden numérico estricto: 1, 2, 5, 9, 14
    expect(data.standings[0].rank).toBe(1);
    expect(data.standings[0].teamName).toBe('Nashville SC');

    expect(data.standings[1].rank).toBe(2);
    expect(data.standings[1].teamName).toBe('Inter Miami CF');

    expect(data.standings[2].rank).toBe(5);
    expect(data.standings[2].teamName).toBe('Charlotte FC');

    expect(data.standings[3].rank).toBe(9);
    expect(data.standings[3].teamName).toBe('New York City FC');

    expect(data.standings[4].rank).toBe(14);
    expect(data.standings[4].teamName).toBe('Atlanta United FC');
  });

  it('supports Liga MX standings from site.web.api.espn.com even if site.api fails', async () => {
    const mockMexStandings = {
      name: 'Mexican Liga BBVA MX',
      children: [
        {
          name: '2026 Torneo Apertura',
          standings: {
            entries: [
              {
                team: { id: '1', displayName: 'Cruz Azul' },
                stats: [{ name: 'rank', value: 2 }, { name: 'points', value: 15 }],
              },
              {
                team: { id: '2', displayName: 'América' },
                stats: [{ name: 'rank', value: 1 }, { name: 'points', value: 18 }],
              },
            ],
          },
        },
      ],
    };

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('site.web.api.espn.com')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockMexStandings,
        });
      }
      return Promise.resolve({
        ok: false,
        status: 403,
      });
    }) as any;

    const req = new NextRequest('http://localhost:3000/api/standings?league=mex.1&team=América');
    const res = await GET(req);
    const data = await res.json();

    expect(data.standings).toBeDefined();
    expect(data.standings.length).toBe(2);
    expect(data.standings[0].teamName).toBe('América');
    expect(data.standings[0].rank).toBe(1);
    expect(data.standings[1].teamName).toBe('Cruz Azul');
    expect(data.standings[1].rank).toBe(2);
  });
});
