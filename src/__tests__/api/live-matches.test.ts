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
              { id: 'real-espana-id', name: 'Real España', logo_url: 'https://example.com/re.png', is_matchday_active: false, leagues: { name: 'Liga Nacional Honduras' } },
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
    expect(data['spain-id'].homeTeam).toBe('España');
    expect(data['spain-id'].homeTeamDbName).toBe('España');
    expect(data['spain-id'].homeScore).toBe(1);
  });

  it('correctly matches Real España without confusing it with Spain national team', async () => {
    const mockEspnEvents = {
      events: [
        {
          name: 'Real España vs CD Olimpia',
          date: new Date().toISOString(),
          status: {
            displayClock: "30'",
            type: { state: 'in', shortDetail: "30'" }
          },
          competitions: [
            {
              competitors: [
                { homeAway: 'home', team: { displayName: 'Real España' }, score: '1' },
                { homeAway: 'away', team: { displayName: 'CD Olimpia' }, score: '0' },
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

    expect(data['real-espana-id']).toBeDefined();
    expect(data['olimpia-id']).toBeDefined();
    expect(data['spain-id']).toBeUndefined();

    expect(data['real-espana-id'].homeTeam).toBe('Real España');
    expect(data['real-espana-id'].homeTeamDbName).toBe('Real España');
  });

  it('supports upcoming matches scheduled for today (state: pre)', async () => {
    const mockEspnEvents = {
      events: [
        {
          name: 'FC Barcelona vs PSG',
          date: new Date().toISOString(),
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

  it('extracts enriched ESPN data (goals with scorers, cards, possession stats, venue and colors)', async () => {
    const mockEspnEvents = {
      events: [
        {
          name: 'Real Madrid vs Atlético Madrid',
          date: new Date().toISOString(),
          status: {
            displayClock: "68'",
            type: { state: 'in', shortDetail: "68'" }
          },
          competitions: [
            {
              venue: {
                fullName: 'Santiago Bernabéu',
                address: { city: 'Madrid' }
              },
              details: [
                {
                  type: { id: '70', text: 'Goal' },
                  scoringPlay: true,
                  clock: { displayValue: "23'" },
                  team: { id: 'real-madrid-espn' },
                  athletesInvolved: [{ displayName: 'Vinicius Jr', jersey: '7' }]
                },
                {
                  type: { id: '94', text: 'Yellow Card' },
                  yellowCard: true,
                  clock: { displayValue: "41'" },
                  team: { id: 'atletico-espn' },
                  athletesInvolved: [{ displayName: 'Koke', jersey: '6' }]
                }
              ],
              competitors: [
                {
                  id: 'real-madrid-espn',
                  homeAway: 'home',
                  score: '1',
                  team: { displayName: 'Real Madrid', color: 'ffffff', alternateColor: 'febe10' },
                  statistics: [
                    { name: 'possessionPct', displayValue: '57' },
                    { name: 'shotsOnTarget', displayValue: '5' }
                  ]
                },
                {
                  id: 'atletico-espn',
                  homeAway: 'away',
                  score: '0',
                  team: { displayName: 'Atlético Madrid', color: 'cb3524', alternateColor: 'ffffff' },
                  statistics: [
                    { name: 'possessionPct', displayValue: '43' },
                    { name: 'shotsOnTarget', displayValue: '2' }
                  ]
                }
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

    const rmMatch = data['real-madrid-id'];
    expect(rmMatch).toBeDefined();
    expect(rmMatch.homeColor).toBe('#ffffff');
    expect(rmMatch.awayColor).toBe('#cb3524');
    expect(rmMatch.venueName).toBe('Santiago Bernabéu');
    expect(rmMatch.venueCity).toBe('Madrid');
    expect(rmMatch.events).toHaveLength(2);
    expect(rmMatch.events[0].playerName).toBe('Vinicius Jr');
    expect(rmMatch.events[0].type).toBe('goal');
    expect(rmMatch.events[1].playerName).toBe('Koke');
    expect(rmMatch.events[1].type).toBe('yellow-card');
    expect(rmMatch.stats?.possession?.home).toBe('57');
    expect(rmMatch.stats?.possession?.away).toBe('43');
    expect(rmMatch.stats?.shotsOnTarget?.home).toBe('5');
    expect(rmMatch.stats?.shotsOnTarget?.away).toBe('2');
  });

  it('preserves strict Home (left) and Away (right) order even when the DB team is playing as away visitor', async () => {
    // Escenario: Atlético de Madrid es Local y Barcelona es Visitante
    const mockEspnEvents = {
      events: [
        {
          name: 'Atlético Madrid vs Barcelona',
          date: new Date().toISOString(),
          status: {
            displayClock: "55'",
            type: { state: 'in', shortDetail: "55'" }
          },
          competitions: [
            {
              competitors: [
                { homeAway: 'home', team: { displayName: 'Atlético Madrid' }, score: '2' },
                { homeAway: 'away', team: { displayName: 'Barcelona' }, score: '1' },
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

    // Consultamos la entrada de Barcelona (que es el visitante)
    const barcaMatch = data['barcelona-id'];
    expect(barcaMatch).toBeDefined();
    expect(barcaMatch.isHome).toBe(false); // Es visitante
    // Local SIEMPRE debe ser Atlético Madrid con score 2
    expect(barcaMatch.homeTeam).toBe('Atlético Madrid');
    expect(barcaMatch.homeScore).toBe(2);
    // Visitante SIEMPRE debe ser Barcelona con score 1
    expect(barcaMatch.awayTeam).toBe('Barcelona');
    expect(barcaMatch.awayScore).toBe(1);
  });

  it('correctly detects halftime (isHalftime: true) and preserves stoppage added time (displayClock: "45+11\'")', async () => {
    const mockEspnEvents = {
      events: [
        {
          name: 'Real Madrid vs FC Barcelona',
          date: new Date().toISOString(),
          status: {
            clock: 2700,
            displayClock: "45'+11'",
            period: 1,
            type: {
              id: '23',
              name: 'STATUS_HALFTIME',
              state: 'in',
              completed: false,
              description: 'Halftime',
              detail: 'HT',
              shortDetail: 'HT'
            }
          },
          competitions: [
            {
              competitors: [
                { homeAway: 'home', team: { displayName: 'Real Madrid' }, score: '1' },
                { homeAway: 'away', team: { displayName: 'FC Barcelona' }, score: '1' },
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

    const rm = data['real-madrid-id'];
    expect(rm).toBeDefined();
    expect(rm.isHalftime).toBe(true);
    expect(rm.displayClock).toBe("45+11'");
    expect(rm.minute).toBe(45);
  });

  it('serves stale memory cache as fallback when ESPN fetch returns empty events', async () => {
    // 1er llamado: genera datos en memoria
    const mockEspnEvents = {
      events: [
        {
          name: 'Motagua vs Olimpia',
          date: new Date().toISOString(),
          status: {
            displayClock: "35'",
            type: { state: 'in', shortDetail: "35'" }
          },
          competitions: [
            {
              competitors: [
                { homeAway: 'home', team: { displayName: 'Motagua' }, score: '1' },
                { homeAway: 'away', team: { displayName: 'CD Olimpia' }, score: '0' },
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
    const res1 = await GET();
    const data1 = await res1.json();
    expect(data1['motagua-id']).toBeDefined();

    // 2do llamado: ESPN falla y devuelve vacío
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 503,
      })
    ) as any;

    const res2 = await GET();
    const data2 = await res2.json();
    // Debe entregar los datos previos desde el stale memoryCache
    expect(data2['motagua-id']).toBeDefined();
    expect(data2['motagua-id'].homeScore).toBe(1);
  });

  it('deduplicates penalty goals when reported by both details and keyEvents', async () => {
    const mockEspnEvents = {
      events: [
        {
          id: 'test-event-pen',
          name: 'Real Madrid vs FC Barcelona',
          date: new Date().toISOString(),
          status: {
            displayClock: "60'",
            type: { state: 'in', shortDetail: "60'" }
          },
          competitions: [
            {
              id: 'comp-1',
              competitors: [
                { id: 'rm-team-1', homeAway: 'home', team: { id: 'rm-team-1', displayName: 'Real Madrid' }, score: '1' },
                { id: 'fcb-team-2', homeAway: 'away', team: { id: 'fcb-team-2', displayName: 'FC Barcelona' }, score: '0' },
              ],
              details: [
                {
                  clock: { displayValue: "23'", value: 1380 },
                  type: { id: '98', text: 'Penalty - Scored' },
                  scoringPlay: true,
                  team: { id: 'rm-team-1' },
                  athletesInvolved: [{ displayName: 'Kylian Mbappé', jersey: '9' }]
                }
              ]
            }
          ]
        }
      ]
    };

    const mockSummary = {
      keyEvents: [
        {
          id: 'key-pen-1',
          clock: { displayValue: "23'" },
          type: { id: '98', text: 'Penalty - Scored' },
          team: { displayName: 'Real Madrid' },
          participants: [{ athlete: { displayName: 'Kylian Mbappé', id: '123' } }]
        }
      ],
      commentary: []
    };

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('summary')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSummary),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockEspnEvents),
      });
    }) as any;

    const { GET } = await import('@/app/api/live-matches/route');
    const res = await GET();
    const data = await res.json();
    const match = data['real-madrid-id'];

    expect(match).toBeDefined();
    expect(match.events).toBeDefined();
    // Debe haber exactamente 1 evento de penal, NO 2
    const penEvents = match.events.filter((e: any) => e.type === 'penalty-goal');
    expect(penEvents.length).toBe(1);
    expect(penEvents[0].minute).toBe("23'");
    expect(penEvents[0].playerName).toBe('Kylian Mbappé');
  });

  it('unconfuses VAR disallowed goals into exactly one clear disallowed-goal event', async () => {
    const mockEspnEvents = {
      events: [
        {
          id: 'test-event-var',
          name: 'Real Madrid vs FC Barcelona',
          date: new Date().toISOString(),
          status: {
            displayClock: "55'",
            type: { state: 'in', shortDetail: "55'" }
          },
          competitions: [
            {
              id: 'comp-var',
              competitors: [
                { id: 'rm-team-1', homeAway: 'home', team: { id: 'rm-team-1', displayName: 'Real Madrid' }, score: '0' },
                { id: 'fcb-team-2', homeAway: 'away', team: { id: 'fcb-team-2', displayName: 'FC Barcelona' }, score: '0' },
              ],
              details: [
                {
                  clock: { displayValue: "42'", value: 2520 },
                  type: { id: '16', text: 'Goal' },
                  scoringPlay: true,
                  team: { id: 'rm-team-1' },
                  athletesInvolved: [{ displayName: 'Vinicius Jr', jersey: '7' }]
                }
              ]
            }
          ]
        }
      ]
    };

    const mockSummary = {
      keyEvents: [
        {
          id: 'var-key-1',
          clock: { displayValue: "42'" },
          type: { text: 'Video Assistant Referee' },
          team: { displayName: 'Real Madrid' }
        }
      ],
      commentary: [
        {
          play: {
            type: { id: '175', type: 'deleted-after-review' },
            clock: { displayValue: "42'" },
            team: { displayName: 'Real Madrid' },
            participants: [{ athlete: { displayName: 'Vinicius Jr' } }]
          },
          text: 'Goal overturned by VAR: Offside by Vinicius Jr.'
        }
      ]
    };

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('summary')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSummary),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockEspnEvents),
      });
    }) as any;

    const { GET } = await import('@/app/api/live-matches/route');
    const res = await GET();
    const data = await res.json();
    const match = data['real-madrid-id'];

    expect(match).toBeDefined();
    expect(match.events).toBeDefined();

    // Solo debe haber 1 evento de gol anulado, NINGÚN gol fantasma válido y NINGÚN evento var redundante en el min 42
    const goalsAt42 = match.events.filter((e: any) => e.minute === "42'");
    expect(goalsAt42.length).toBe(1);
    expect(goalsAt42[0].type).toBe('disallowed-goal');
    expect(goalsAt42[0].text).toContain('Fuera de Juego');
    expect(goalsAt42[0].disallowed).toBe(true);
    expect(goalsAt42[0].playerName).toBe('Vinicius Jr');
  });
});
