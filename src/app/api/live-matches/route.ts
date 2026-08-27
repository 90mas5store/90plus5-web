import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { LiveMatchData } from '@/hooks/useLiveMatches';

// Caché en memoria: 1 minuto para respuestas en tiempo real
let liveCache: { data: Record<string, LiveMatchData>; ts: number } | null = null;
const CACHE_TTL = 60 * 1000; // 1 minuto

export const dynamic = 'force-dynamic';

function normalizeTeamName(name: string): string {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/fc|cf|club|de|futbol|soccer|real|atletico|sporting|cd/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

export async function GET() {
  const now = Date.now();

  // Devolver respuesta en caché si está dentro del TTL (1 min)
  if (liveCache && now - liveCache.ts < CACHE_TTL) {
    return NextResponse.json(liveCache.data, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  }

  const result: Record<string, LiveMatchData> = {};
  const supabase = createAdminClient();

  // 1. OBTENER LISTADO DE EQUIPOS REGISTRADOS EN SUPABASE
  let teamsData: { id: string; name: string; is_matchday_active?: boolean }[] = [];
  try {
    const { data } = await supabase.from('teams').select('id, name, is_matchday_active');
    teamsData = data || [];
  } catch (e) {
    console.warn('[live-matches] Error fetching teams from Supabase:', e);
  }

  const nameToUuid = new Map<string, string>();
  for (const t of teamsData) {
    if (t.name) {
      const norm = normalizeTeamName(t.name);
      if (norm) nameToUuid.set(norm, t.id);
    }
  }

  // 2. CONSULTAR LA API PÚBLICA EN TIEMPO REAL DE ESPN SPORTS
  try {
    const espnRes = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (espnRes.ok) {
      const json = await espnRes.json();
      const events: any[] = json.events ?? [];

      for (const event of events) {
        const competition = event.competitions?.[0];
        if (!competition) continue;

        const state = event.status?.type?.state; // 'in' = en vivo, 'post' = finalizado hoy
        const clockDisplay = event.status?.displayClock || event.status?.type?.shortDetail || null;

        // Extraer competidores (local / visitante)
        const homeComp = competition.competitors?.find((c: any) => c.homeAway === 'home');
        const awayComp = competition.competitors?.find((c: any) => c.homeAway === 'away');

        if (!homeComp || !awayComp) continue;

        const homeName = homeComp.team?.name || homeComp.team?.displayName || '';
        const awayName = awayComp.team?.name || awayComp.team?.displayName || '';

        const homeScore = parseInt(homeComp.score ?? '0', 10);
        const awayScore = parseInt(awayComp.score ?? '0', 10);

        const homeNorm = normalizeTeamName(homeName);
        const awayNorm = normalizeTeamName(awayName);

        const homeUuid = nameToUuid.get(homeNorm);
        const awayUuid = nameToUuid.get(awayNorm);

        // Procesar si está en vivo ('in') o si finalizó hoy ('post')
        const isCurrentlyLive = state === 'in' || state === 'post';

        if (isCurrentlyLive) {
          const minuteNum = clockDisplay ? parseInt(clockDisplay, 10) || null : null;

          if (homeUuid) {
            result[homeUuid] = {
              homeTeam: homeName,
              awayTeam: awayName,
              homeScore: isNaN(homeScore) ? 0 : homeScore,
              awayScore: isNaN(awayScore) ? 0 : awayScore,
              minute: minuteNum,
              isHome: true,
              isManual: false,
            };
          }

          if (awayUuid) {
            result[awayUuid] = {
              homeTeam: homeName,
              awayTeam: awayName,
              homeScore: isNaN(homeScore) ? 0 : homeScore,
              awayScore: isNaN(awayScore) ? 0 : awayScore,
              minute: minuteNum,
              isHome: false,
              isManual: false,
            };
          }
        }
      }
    }
  } catch (err) {
    console.error('[live-matches] ESPN API Error:', err);
  }

  // 3. RESPALDO MANUAL: ACTIVACIONES DESDE EL ADMIN (is_matchday_active = true)
  for (const team of teamsData) {
    if (team.is_matchday_active && !result[team.id]) {
      result[team.id] = {
        homeTeam: team.name,
        awayTeam: 'Rival',
        homeScore: 0,
        awayScore: 0,
        minute: null,
        isHome: true,
        isManual: true,
      };
    }
  }

  liveCache = { data: result, ts: now };
  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, max-age=60' },
  });
}
