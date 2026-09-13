import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (redis) return redis;
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;
    redis = new Redis({ url, token });
    return redis;
  } catch {
    return null;
  }
}

const standingsMemoryCache: Record<string, { groups: StandingGroup[]; timestamp: number }> = {};

export const maxDuration = 15;
export const dynamic = 'force-dynamic';

export interface StandingRow {
  rank: number;
  teamId: string;
  teamName: string;
  teamShort: string;
  logo: string | null;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  pointDifferential: string;
  points: number;
}

export interface StandingGroup {
  name: string;
  standings: StandingRow[];
}

function parseAndSortEntries(entries: any[]): StandingRow[] {
  if (!Array.isArray(entries)) return [];

  const rows: StandingRow[] = entries.map((entry: any) => {
    const getStat = (name: string) =>
      entry.stats?.find((s: any) => s.name === name)?.value ?? 0;
    const getStatDisplay = (name: string) =>
      entry.stats?.find((s: any) => s.name === name)?.displayValue ?? '0';

    return {
      rank: Number(getStat('rank') || 0),
      teamId: String(entry.team?.id || ''),
      teamName: entry.team?.displayName || entry.team?.name || 'Club',
      teamShort: entry.team?.shortDisplayName || entry.team?.abbreviation || 'Club',
      logo: entry.team?.logos?.[0]?.href || null,
      gamesPlayed: Number(getStat('gamesPlayed') || 0),
      wins: Number(getStat('wins') || 0),
      draws: Number(getStat('ties') || 0),
      losses: Number(getStat('losses') || 0),
      pointDifferential: String(getStatDisplay('pointDifferential') || '0'),
      points: Number(getStat('points') || 0),
    };
  });

  // Orden estricto: posición oficial ascendente (1, 2, 3...) con fallback por puntos y diferencia
  return rows.sort((a, b) => {
    if (a.rank > 0 && b.rank > 0 && a.rank !== b.rank) {
      return a.rank - b.rank;
    }
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    const diffA = parseInt(a.pointDifferential, 10) || 0;
    const diffB = parseInt(b.pointDifferential, 10) || 0;
    return diffB - diffA;
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const league = searchParams.get('league') || 'esp.1';
  const teamParam = (searchParams.get('team') || '').toLowerCase().trim();

  // Cache v3 con orden garantizado, soporte para conferencias/grupos y multi-endpoint ESPN
  const cacheKey = `standings:v3:${league}`;
  const client = getRedis();

  let groups: StandingGroup[] = [];

  // 1. Intentar memoria de la instancia cálida
  const memCached = standingsMemoryCache[league];
  if (memCached && (Date.now() - memCached.timestamp) < 5 * 60 * 1000) {
    groups = memCached.groups;
  }

  // 2. Intentar Redis si no hay en memoria
  if (groups.length === 0 && client) {
    try {
      const cached = await client.get<StandingGroup[]>(cacheKey);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        groups = cached;
        standingsMemoryCache[league] = { groups, timestamp: Date.now() };
      }
    } catch {
      // ignore cache read error
    }
  }

  // 3. Consultar ESPN con endpoints resilientes (site.web.api.espn.com NUNCA es bloqueado por Akamai)
  if (groups.length === 0) {
    const endpoints = [
      `https://site.web.api.espn.com/apis/v2/sports/soccer/${league}/standings`,
      `https://site.api.espn.com/apis/v2/sports/soccer/${league}/standings`,
    ];

    const ESPN_HEADERS = {
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Referer: 'https://www.espn.com/',
    };

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          headers: ESPN_HEADERS,
          cache: 'no-store',
          signal: AbortSignal.timeout(6500),
        });

        if (!res.ok) {
          console.warn(`[standings] ESPN fetch status ${res.status} from ${url}`);
          continue;
        }

        const data = await res.json();

        if (Array.isArray(data.children) && data.children.length > 0) {
          for (const child of data.children) {
            const childEntries = child.standings?.entries || [];
            const parsed = parseAndSortEntries(childEntries);
            if (parsed.length > 0) {
              groups.push({
                name: child.name || data.name || 'General',
                standings: parsed,
              });
            }
          }
        } else if (Array.isArray(data.standings)) {
          const parsed = parseAndSortEntries(data.standings[0]?.entries || []);
          if (parsed.length > 0) {
            groups.push({
              name: data.name || 'General',
              standings: parsed,
            });
          }
        }

        if (groups.length > 0) {
          break; // Éxito con este endpoint
        }
      } catch (err: any) {
        console.warn(`[standings] Error fetching from ${url}:`, err?.message ?? err);
      }
    }

    if (groups.length > 0) {
      standingsMemoryCache[league] = { groups, timestamp: Date.now() };

      if (client) {
        try {
          await client.set(cacheKey, groups, { ex: 300 }); // 5 minutos
        } catch {
          // ignore cache write error
        }
      }
    }
  }

  if (groups.length === 0) {
    return NextResponse.json({ league, standings: [], groups: [] });
  }

  // Si se envió un equipo de consulta, seleccionar la conferencia o grupo donde juega dicho equipo
  let activeGroup = groups[0];
  if (teamParam) {
    const matched = groups.find((g) =>
      g.standings.some(
        (s) =>
          s.teamName.toLowerCase().includes(teamParam) ||
          s.teamShort.toLowerCase().includes(teamParam) ||
          teamParam.includes(s.teamName.toLowerCase())
      )
    );
    if (matched) {
      activeGroup = matched;
    }
  }

  return NextResponse.json({
    league,
    groupName: activeGroup.name,
    groups,
    standings: activeGroup.standings,
    cached: false,
  });
}
