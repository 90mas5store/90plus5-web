import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { LiveMatchData } from '@/hooks/useLiveMatches';

// Caché en memoria: 2 minutos (respeta el free tier de football-data.org)
let liveCache: { data: Record<string, LiveMatchData>; ts: number } | null = null;
const CACHE_TTL = 2 * 60 * 1000;

export const dynamic = 'force-dynamic';

function normalizeTeamName(name: string): string {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/fc|cf|club|de|futbol|soccer|real|atletico/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

export async function GET() {
  const now = Date.now();

  // Devolver respuesta en caché si está vigente
  if (liveCache && now - liveCache.ts < CACHE_TTL) {
    return NextResponse.json(liveCache.data, {
      headers: { 'Cache-Control': 'public, max-age=120' },
    });
  }

  const result: Record<string, LiveMatchData> = {};
  const supabase = createAdminClient();

  // 1. OBTENER MATCHDAYS MANUALES DESDE SUPABASE (Equipos con is_matchday_active = true)
  try {
    const { data: manualTeams } = await supabase
      .from('teams')
      .select('id, name')
      .eq('is_matchday_active', true);

    if (manualTeams && manualTeams.length > 0) {
      for (const team of manualTeams) {
        result[team.id] = {
          homeTeam: team.name,
          awayTeam: 'Rival en Vivo',
          homeScore: 0,
          awayScore: 0,
          minute: null,
          isHome: true,
          isManual: true,
        };
      }
    }
  } catch (e) {
    console.warn('[live-matches] Warning fetching manual matchday teams:', e);
  }

  // 2. OBTENER PARTIDOS EN VIVO DESDE LA API (football-data.org)
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (apiKey) {
    try {
      const matchRes = await fetch('https://api.football-data.org/v4/matches?status=IN_PLAY', {
        headers: { 'X-Auth-Token': apiKey },
        signal: AbortSignal.timeout(5000),
      });

      if (matchRes.ok) {
        const json = await matchRes.json();
        const matches: Record<string, unknown>[] = json.matches ?? [];

        if (matches.length > 0) {
          const fdIds = new Set<number>();
          for (const m of matches) {
            fdIds.add((m.homeTeam as { id: number }).id);
            fdIds.add((m.awayTeam as { id: number }).id);
          }

          // Cargar equipos de la base de datos por football_data_id y por lista general para fuzzy matching
          const { data: teamsData } = await supabase
            .from('teams')
            .select('id, name, football_data_id');

          const fdToUuid = new Map<number, string>();
          const nameToUuid = new Map<string, string>();

          for (const t of teamsData ?? []) {
            if (t.football_data_id) {
              fdToUuid.set(t.football_data_id, t.id);
            }
            if (t.name) {
              const norm = normalizeTeamName(t.name);
              if (norm) nameToUuid.set(norm, t.id);
            }
          }

          for (const m of matches) {
            const home = m.homeTeam as { id: number; name: string };
            const away = m.awayTeam as { id: number; name: string };
            const score = m.score as {
              fullTime?: { home: number | null; away: number | null };
              halfTime?: { home: number | null; away: number | null };
            };

            const homeScore = score?.fullTime?.home ?? score?.halfTime?.home ?? 0;
            const awayScore = score?.fullTime?.away ?? score?.halfTime?.away ?? 0;
            const minute = (m.minute as number | null) ?? null;

            // Intentar por football_data_id primero, fallback a fuzzy name matching
            let homeUuid = fdToUuid.get(home.id);
            if (!homeUuid && home.name) {
              homeUuid = nameToUuid.get(normalizeTeamName(home.name));
            }

            let awayUuid = fdToUuid.get(away.id);
            if (!awayUuid && away.name) {
              awayUuid = nameToUuid.get(normalizeTeamName(away.name));
            }

            if (homeUuid) {
              result[homeUuid] = {
                homeTeam: home.name,
                awayTeam: away.name,
                homeScore: homeScore ?? 0,
                awayScore: awayScore ?? 0,
                minute,
                isHome: true,
                isManual: false,
              };
            }
            if (awayUuid) {
              result[awayUuid] = {
                homeTeam: home.name,
                awayTeam: away.name,
                homeScore: homeScore ?? 0,
                awayScore: awayScore ?? 0,
                minute,
                isHome: false,
                isManual: false,
              };
            }
          }
        }
      }
    } catch (err) {
      console.error('[live-matches] API Error:', err);
    }
  }

  liveCache = { data: result, ts: now };
  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, max-age=120' },
  });
}
