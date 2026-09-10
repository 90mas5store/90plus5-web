import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase admin client
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      select: () => {
        if (table === 'teams') {
          const response = {
            data: [
              { id: 'real-madrid-id', name: 'Real Madrid', logo_url: 'https://example.com/rm.png', is_matchday_active: false, leagues: { name: 'LaLiga Española' } },
              { id: 'atletico-madrid-id', name: 'Atlético de Madrid', logo_url: 'https://example.com/atleti.png', is_matchday_active: false, leagues: { name: 'LaLiga Española' } },
              { id: 'spain-id', name: 'España', logo_url: 'https://example.com/spain.png', is_matchday_active: false, leagues: { name: 'Selecciones' } },
              { id: 'barcelona-id', name: 'FC Barcelona', logo_url: 'https://example.com/barca.png', is_matchday_active: false, leagues: { name: 'LaLiga Española' } },
              { id: 'psg-id', name: 'Paris Saint-Germain', logo_url: 'https://example.com/psg.png', is_matchday_active: false, leagues: { name: 'Ligue 1 Francia' } },
              { id: 'motagua-id', name: 'Motagua', logo_url: 'https://example.com/motagua.png', is_matchday_active: false, leagues: { name: 'Liga Nacional Honduras' } },
              { id: 'olimpia-id', name: 'CD Olimpia', logo_url: 'https://example.com/olimpia.png', is_matchday_active: false, leagues: { name: 'Liga Nacional Honduras' } },
            ],
            error: null,
          };
          return { is: () => Promise.resolve(response) };
        }
        return { is: () => Promise.resolve({ data: [], error: null }) };
      },
    }),
  }),
}));

// Mock Upstash Redis — simula caché vacía (MISS) para que los tests siempre
// llamen a ESPN y no dependan de Redis real
vi.mock('@upstash/redis', () => ({
  Redis: class {
    // get → null = caché MISS
    async get() { return null; }
    // set → no-op
    async set() { return 'OK'; }
  },
}));

describe('Live Matches API Endpoint (/api/live-matches)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('matches teams correctly without name collisions (Real Madrid vs Atlético Madrid)', async () => {
    const mockEspnEvents = {
      events: [
        {
          name: 'Real Madrid vs Atlético Madrid',
          date: new Date().toISOString(),
          status: {
            displayClock: "45'",
            type: { state: 'in', shortDetail: "45'" }
          },
          competitions: [
            {
              competitors: [
                { homeAway: 'home', team: { displayName: 'Real Madrid' }, score: '2' },
                { homeAway: 'away', team: { displayName: 'Atlético Madrid' }, score: '1' },
              ]
            }
          ]
        }
      ]
    };

    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockEspnEvents),
      })
    ) as any;

    const { GET } = await import('@/app/api/live-matches/route');
    const response = await GET();
    const data = await response.json();

    expect(data).toBeDefined();
    expect(data['real-madrid-id']).toBeDefined();
    expect(data['atletico-madrid-id']).toBeDefined();

    expect(data['real-madrid-id'].homeTeam).toBe('Real Madrid');
    expect(data['real-madrid-id'].awayTeam).toBe('Atlético Madrid');
    expect(data['real-madrid-id'].homeTeamDbName).toBe('Real Madrid');
    expect(data['real-madrid-id'].awayTeamDbName).toBe('Atlético de Madrid');
    expect(data['real-madrid-id'].homeScore).toBe(2);

    expect(data['atletico-madrid-id'].isHome).toBe(false);
  });

  it('matches national teams in Spanish DB with English ESPN names (España -> Spain)', async () => {
    const mockEspnEvents = {
      events: [
        {
          name: 'Spain vs Germany',
          date: new Date().toISOString(),
          status: {
            displayClock: "75'",
            type: { state: 'in', shortDetail: "75'" }
          },
          competitions: [
            {
              competitors: [
                { homeAway: 'home', team: { displayName: 'Spain' }, score: '1' },
                { homeAway: 'away', team: { displayName: 'Germany' }, score: '0' },
              ]
            }
          ]
        }
      ]
    };

    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockEspnEvents),
      })
    ) as any;

    const { GET } = await import('@/app/api/live-matches/route');
    const response = await GET();
    const data = await response.json();

    expect(data['spain-id']).toBeDefined();
    expect(data['spain-id'].homeTeam).toBe('Spain');
    expect(data['spain-id'].homeTeamDbName).toBe('España');
    expect(data['spain-id'].homeScore).toBe(1);
  });

  it('supports upcoming matches scheduled for today (state: pre)', async () => {
    const mockEspnEvents = {
      events: [
        {
          name: 'FC Barcelona vs PSG',
          date: new Date(Date.now() + 3600 * 1000).toISOString(),
          status: {
            type: { state: 'pre', shortDetail: '15:00' }
          },
          competitions: [
            {
              competitors: [
                { homeAway: 'home', team: { displayName: 'Barcelona' }, score: '0' },
                { homeAway: 'away', team: { displayName: 'PSG' }, score: '0' },
              ]
            }
          ]
        }
      ]
    };

    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockEspnEvents),
      })
    ) as any;

    const { GET } = await import('@/app/api/live-matches/route');
    const response = await GET();
    const data = await response.json();

    expect(data['barcelona-id']).toBeDefined();
    expect(data['barcelona-id'].isUpcoming).toBe(true);
    expect(data['psg-id']).toBeDefined();
    expect(data['psg-id'].isUpcoming).toBe(true);
  });

  it('detects and formats Copa Centroamericana CONCACAF matches (FC Motagua vs Alianza FC)', async () => {
    const mockEspnEvents = {
      events: [
        {
          name: 'Alianza FC at FC Motagua',
          date: new Date().toISOString(),
          status: {
            displayClock: "75'",
            type: { state: 'in', shortDetail: "75'" }
          },
          competitions: [
            {
              altGameNote: 'Concacaf Central American Cup, Quarterfinals - 1st Leg',
              competitors: [
                { homeAway: 'home', team: { displayName: 'FC Motagua' }, score: '2' },
                { homeAway: 'away', team: { displayName: 'Alianza FC' }, score: '0' },
              ]
            }
          ]
        }
      ]
    };

    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockEspnEvents),
      })
    ) as any;

    const { GET } = await import('@/app/api/live-matches/route');
    const response = await GET();
    const data = await response.json();

    expect(data['motagua-id']).toBeDefined();
    expect(data['motagua-id'].homeTeam).toBe('FC Motagua');
    expect(data['motagua-id'].awayTeam).toBe('Alianza FC');
    expect(data['motagua-id'].leagueName).toBe('Copa Centroamericana CONCACAF');
    expect(data['motagua-id'].minute).toBe(75);
    expect(data['motagua-id'].homeScore).toBe(2);
    expect(data['motagua-id'].awayScore).toBe(0);
  });

  it('detects and formats Honduras national team matches in CONCACAF Qualifiers', async () => {
    const mockEspnEvents = {
      events: [
        {
          name: 'Honduras vs Costa Rica',
          date: new Date().toISOString(),
          status: {
            displayClock: "30'",
            type: { state: 'in', shortDetail: "30'" }
          },
          competitions: [
            {
              altGameNote: 'FIFA World Cup Qualifying - Concacaf',
              competitors: [
                { homeAway: 'home', team: { displayName: 'Honduras' }, score: '1' },
                { homeAway: 'away', team: { displayName: 'Costa Rica' }, score: '0' },
              ]
            }
          ]
        }
      ]
    };

    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockEspnEvents),
      })
    ) as any;

    const { GET } = await import('@/app/api/live-matches/route');
    const response = await GET();
    const data = await response.json();

    const hondurasMatch = data['honduras-national-team'];
    expect(hondurasMatch).toBeDefined();
    expect(hondurasMatch.homeTeam).toBe('Honduras');
    expect(hondurasMatch.awayTeam).toBe('Costa Rica');
    expect(hondurasMatch.leagueName).toBe('Eliminatorias CONCACAF');
    expect(hondurasMatch.homeScore).toBe(1);
    expect(hondurasMatch.homeLogo).toBe('/logos/ligas/honduras-seleccion.svg');
  });
});
