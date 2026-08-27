import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { LiveMatchData } from '@/hooks/useLiveMatches';
import { getManualMatchdayConfig } from '@/lib/matchdayStore';

// Caché en memoria ultrarrápida: 5 segundos para actualización instantánea
let liveCache: { data: Record<string, LiveMatchData>; ts: number } | null = null;
const CACHE_TTL = 5 * 1000; // 5 segundos

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

function formatCompetitionName(rawName?: string | null): string | null {
  if (!rawName) return null;
  const name = rawName.trim();

  if (name.includes("Women's Champions League") || name.includes("UWCL") || name.includes("women-champions")) {
    return "UEFA Champions League Femenina";
  }
  if (name.includes("Champions League") || name.includes("champions-league")) {
    return "UEFA Champions League";
  }
  if (name.includes("LALIGA") || name.includes("laliga") || name.includes("La Liga")) {
    return "LaLiga Española";
  }
  if (name.includes("Premier League") || name.includes("premier-league")) {
    return "Premier League";
  }
  if (name.includes("Serie A") || name.includes("serie-a")) {
    return "Serie A Italia";
  }
  if (name.includes("Bundesliga") || name.includes("bundesliga")) {
    return "Bundesliga Alemania";
  }
  if (name.includes("Ligue 1") || name.includes("ligue-1")) {
    return "Ligue 1 Francia";
  }
  if (name.includes("CONCACAF") || name.includes("concacaf")) {
    return "CONCACAF Champions Cup";
  }
  if (name.includes("Libertadores") || name.includes("libertadores")) {
    return "Copa Libertadores";
  }
  if (name.includes("Copa del Rey")) {
    return "Copa del Rey";
  }

  return name;
}

export async function GET() {
  const now = Date.now();

  // Devolver respuesta en caché si está dentro del TTL (5 s)
  if (liveCache && now - liveCache.ts < CACHE_TTL) {
    return NextResponse.json(liveCache.data, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
    });
  }

  const result: Record<string, LiveMatchData> = {};
  const supabase = createAdminClient();

  // 1. OBTENER LISTADO DE EQUIPOS, LOGOS Y SUS LIGAS REGISTRADAS EN SUPABASE
  let teamsData: any[] = [];
  const teamLeagueMap = new Map<string, string>();
  const teamLogoByName = new Map<string, string>();

  try {
    let { data, error } = await supabase
      .from('teams')
      .select('id, name, logo_url, is_matchday_active, matchday_opponent, matchday_score, matchday_period, leagues (name)');

    // Fallback a columnas estándar si las columnas extendidas no existen en la BD aún
    if (error) {
      const fallback = await supabase
        .from('teams')
        .select('id, name, logo_url, is_matchday_active, leagues (name)');
      data = fallback.data as any;
    }

    teamsData = data || [];

    for (const t of teamsData) {
      if (t.name) {
        const norm = normalizeTeamName(t.name);
        if (t.logo_url) teamLogoByName.set(norm, t.logo_url);
      }
      const l = Array.isArray(t.leagues) ? t.leagues[0] : t.leagues;
      if (l?.name) {
        teamLeagueMap.set(t.id, l.name);
      }
    }
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

  const getTeamLogo = (name: string, espnLogo?: string | null) => {
    const norm = normalizeTeamName(name);
    return teamLogoByName.get(norm) || espnLogo || null;
  };

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

        const state = event.status?.type?.state; // 'in' = en vivo, 'post' = finalizado
        const clockDisplay = event.status?.displayClock || event.status?.type?.shortDetail || null;

        // Fecha de inicio del partido
        const eventDateStr = event.date || competition.date || null;
        const eventTimestamp = eventDateStr ? new Date(eventDateStr).getTime() : 0;
        const elapsedMinutes = eventTimestamp > 0 ? (now - eventTimestamp) / (60 * 1000) : 999;

        // Un partido dura ~110 min. 1 hora adicional post-partido = 170 min desde el pitazo inicial.
        const isFinishedRecently = state === 'post' && elapsedMinutes <= 170;
        const isCurrentlyLive = state === 'in' || isFinishedRecently;

        // Extraer la competencia real del partido
        const rawComp = competition.altGameNote || event.season?.slug || null;
        const competitionName = formatCompetitionName(rawComp);

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

        // Priorizar el logotipo configurado en Admin > Equipos de Supabase, o fallback a ESPN CDN
        const homeLogoUrl = getTeamLogo(homeName, homeComp.team?.logo);
        const awayLogoUrl = getTeamLogo(awayName, awayComp.team?.logo);

        if (isCurrentlyLive) {
          const minuteNum = state === 'in' && clockDisplay ? parseInt(clockDisplay, 10) || null : null;
          const isFinished = state === 'post';

          if (homeUuid) {
            result[homeUuid] = {
              homeTeam: homeName,
              awayTeam: awayName,
              homeScore: isNaN(homeScore) ? 0 : homeScore,
              awayScore: isNaN(awayScore) ? 0 : awayScore,
              minute: minuteNum,
              isHome: true,
              isManual: false,
              leagueName: competitionName || teamLeagueMap.get(homeUuid) || null,
              isFinished,
              homeLogo: homeLogoUrl,
              awayLogo: awayLogoUrl,
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
              leagueName: competitionName || teamLeagueMap.get(awayUuid) || null,
              isFinished,
              homeLogo: homeLogoUrl,
              awayLogo: awayLogoUrl,
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
      const storedConfig = getManualMatchdayConfig(team.id);

      const opponentName = storedConfig?.matchday_opponent || team.matchday_opponent || 'Rival';
      const scoreStr = storedConfig?.matchday_score || team.matchday_score || '0-0';
      const periodStr = storedConfig?.matchday_period || team.matchday_period || 'En Vivo';

      let hScore = 0;
      let aScore = 0;
      if (scoreStr.includes('-')) {
        const parts = scoreStr.split('-').map((s: string) => parseInt(s.trim(), 10));
        if (!isNaN(parts[0])) hScore = parts[0];
        if (!isNaN(parts[1])) aScore = parts[1];
      }

      const isFinished = periodStr.toLowerCase().includes('final');

      const matchDataPayload: LiveMatchData = {
        homeTeam: team.name,
        awayTeam: opponentName,
        homeScore: hScore,
        awayScore: aScore,
        minute: null,
        isHome: true,
        isManual: true,
        leagueName: periodStr !== 'En Vivo' ? periodStr : (teamLeagueMap.get(team.id) || 'MATCHDAY EN VIVO'),
        isFinished: isFinished,
        homeLogo: team.logo_url || null,
        awayLogo: getTeamLogo(opponentName),
      };

      result[team.id] = matchDataPayload;

      // Si el equipo rival también está registrado en la base de datos de la tienda, activar la insignia Live para el rival también!
      const awayUuid = nameToUuid.get(normalizeTeamName(opponentName));
      if (awayUuid && !result[awayUuid]) {
        result[awayUuid] = {
          ...matchDataPayload,
          isHome: false,
        };
      }
    }
  }

  liveCache = { data: result, ts: now };
  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
  });
}
