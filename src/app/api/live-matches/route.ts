import { NextRequest, NextResponse } from 'next/server';
import type { LiveMatchData } from '@/hooks/useLiveMatches';
import { translateTeamNameToSpanish, translateTeamShortName, translateTeamAbbr } from '@/lib/teamNames';
import { getActiveLeagueSlugs } from '@/lib/matchdayLeagues';

import {
  getMemoryCache,
  getStaleMemoryCache,
  setMemoryCache,
  getRedisCache,
  getStaleRedisCache,
  saveToDistributedCache,
  isRedisAvailable,
} from '@/lib/live-matches/cache';

import {
  normalizeTeamName,
  formatCompetitionName,
  formatMatchTime,
  fetchTeamsFromSupabase,
  buildTeamResolver,
} from '@/lib/live-matches/teamMatcher';

import { parseMatchEvents } from '@/lib/live-matches/eventsParser';
import { parseMatchStats } from '@/lib/live-matches/statsParser';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ESPN_HEADERS = {
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Referer: 'https://www.espn.com/',
};

export async function GET(req?: NextRequest) {
  const now = Date.now();
  const tz = 'America/Tegucigalpa';
  const todayDateStr = new Date(now).toLocaleDateString('en-CA', { timeZone: tz });
  const todayYmd = todayDateStr.replace(/-/g, '');
  const CACHE_KEY = `live-matches:v12:${todayYmd}`;
  const STALE_CACHE_KEY = `live-matches:stale:${todayYmd}`;

  const isDebug = req ? req.nextUrl.searchParams.get('debug') === '1' : false;

  // ── 0. Caché Local en Memoria (0ms) ────────────────────────────────────────
  if (process.env.NODE_ENV !== 'test' && !isDebug) {
    const mem = getMemoryCache(todayDateStr);
    if (mem) {
      return NextResponse.json(mem, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'X-Live-Cache': 'HIT-MEMORY',
        },
      });
    }
  }

  // ── 0.1 Caché Distribuida Redis (<1s) ──────────────────────────────────────
  if (process.env.NODE_ENV !== 'test' && !isDebug) {
    const cached = await getRedisCache(CACHE_KEY);
    if (cached) {
      setMemoryCache(cached, todayDateStr);
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'X-Live-Cache': 'HIT-REDIS',
        },
      });
    }
  }

  // ── 1. Cargar equipos desde Supabase / Respaldo ────────────────────────────
  const teamsData = await fetchTeamsFromSupabase();
  const { nameToUuid, getTeamLogo } = buildTeamResolver(teamsData);

  const result: Record<string, LiveMatchData> = {};
  let events: any[] = [];

  // ── 2. Consultar partidos en tiempo real de ESPN ──────────────────────────
  try {
    const leagues = await getActiveLeagueSlugs();

    const fetchPromises = leagues.map(async league => {
      const endpoints = [
        `https://site.web.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${todayYmd}`,
        `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${todayYmd}`,
      ];

      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            headers: ESPN_HEADERS,
            cache: 'no-store',
            signal: AbortSignal.timeout(4500),
          });

          if (res.ok) {
            const data = await res.json();
            return {
              leagueSlug: league,
              leagueName: data.leagues?.[0]?.name || null,
              events: data.events || [],
            };
          }
          console.warn(`[live-matches] ESPN fetch failed for ${league} (${url}): ${res.status}`);
        } catch (err: any) {
          console.warn(`[live-matches] ESPN fetch error for ${league} (${url}):`, err?.message ?? err);
        }
      }
      return null;
    });

    const responses = await Promise.allSettled(fetchPromises);
    events = [];

    for (const item of responses) {
      if (item.status === 'fulfilled' && item.value?.events) {
        const { leagueName, leagueSlug } = item.value;
        for (const evt of item.value.events) {
          events.push({ ...evt, _leagueName: leagueName, _leagueSlug: leagueSlug });
        }
      }
    }

    // Respaldo de contingencia: si ESPN cayó o está en rate limit
    if (events.length === 0) {
      const staleMem = getStaleMemoryCache();
      if (staleMem) {
        console.warn('[live-matches] ESPN no devolvió eventos; sirviendo memoryCache como stale fallback');
        return NextResponse.json(staleMem, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Live-Cache': 'STALE-MEMORY',
          },
        });
      }

      const staleRedis = await getStaleRedisCache(STALE_CACHE_KEY);
      if (staleRedis) {
        console.warn('[live-matches] ESPN no devolvió eventos; sirviendo Redis como stale fallback');
        return NextResponse.json(staleRedis, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Live-Cache': 'STALE-REDIS',
          },
        });
      }
    }

    // ── 3. Procesar partidos y mapear a base de datos de la tienda ──────────
    for (const event of events) {
      const competition = event.competitions?.[0];
      if (!competition) continue;

      const state = event.status?.type?.state;
      const statusTypeName = (event.status?.type?.name || '').toUpperCase();
      const statusDesc = (event.status?.type?.description || '').toLowerCase();
      const statusDetail = (event.status?.type?.detail || '').toUpperCase();
      const statusShortDetail = (event.status?.type?.shortDetail || '').toUpperCase();

      const isHalftime =
        statusTypeName === 'STATUS_HALFTIME' ||
        statusDesc.includes('halftime') ||
        statusDetail === 'HT' ||
        statusShortDetail === 'HT' ||
        statusDesc.includes('entretiempo') ||
        statusDesc.includes('medio tiempo');

      let cleanDisplayClock: string | null = null;
      const rawClockCandidate = event.status?.displayClock || event.status?.type?.shortDetail || null;
      if (rawClockCandidate && typeof rawClockCandidate === 'string') {
        const stripped = rawClockCandidate.replace(/['"´`\s]/g, '');
        if (stripped && /\d/.test(stripped) && stripped !== 'HT' && stripped !== 'FT') {
          cleanDisplayClock = stripped.endsWith("'") ? stripped : `${stripped}'`;
        }
      }
      if (!cleanDisplayClock && event.status?.clock != null && !isNaN(event.status.clock) && event.status.clock > 0) {
        cleanDisplayClock = `${Math.floor(event.status.clock / 60)}'`;
      }

      const clockDisplay = cleanDisplayClock || event.status?.type?.shortDetail || null;

      const eventDateStr = event.date || competition.date || null;
      let isSameDayToday = false;
      let eventTimestamp = 0;
      if (eventDateStr) {
        const d = new Date(eventDateStr);
        if (!isNaN(d.getTime())) {
          eventTimestamp = d.getTime();
          const todayStr = new Date(now).toLocaleDateString('en-CA', { timeZone: tz });
          const eventDayStr = d.toLocaleDateString('en-CA', { timeZone: tz });
          isSameDayToday = eventDayStr === todayStr;
        }
      }

      const elapsedMinutes = eventTimestamp > 0 ? (now - eventTimestamp) / (60 * 1000) : 999;
      const isLiveNow = state === 'in';
      const isUpcoming = state === 'pre' && isSameDayToday;
      const isFinishedToday = state === 'post' && (
        (isSameDayToday && elapsedMinutes <= 18 * 60) ||
        (!isSameDayToday && elapsedMinutes <= 90)
      );
      if (!isUpcoming && !isLiveNow && !isFinishedToday) continue;

      const rawComp =
        competition.altGameNote ||
        event._leagueName ||
        event._leagueSlug ||
        event.season?.slug ||
        competition.league?.name ||
        event.league?.name ||
        null;
      const competitionName = formatCompetitionName(rawComp);

      const homeComp = competition.competitors?.find((c: any) => c.homeAway === 'home');
      const awayComp = competition.competitors?.find((c: any) => c.homeAway === 'away');
      if (!homeComp || !awayComp) continue;

      const rawHomeOriginal = homeComp.team?.displayName || homeComp.team?.name || '';
      const rawAwayOriginal = awayComp.team?.displayName || awayComp.team?.name || '';

      const homeRawName = translateTeamNameToSpanish(rawHomeOriginal);
      const awayRawName = translateTeamNameToSpanish(rawAwayOriginal);

      const homeShortName = translateTeamShortName(homeRawName, homeComp.team?.shortDisplayName || homeComp.team?.name);
      const awayShortName = translateTeamShortName(awayRawName, awayComp.team?.shortDisplayName || awayComp.team?.name);

      const homeAbbr = translateTeamAbbr(homeRawName, homeComp.team?.abbreviation);
      const awayAbbr = translateTeamAbbr(awayRawName, awayComp.team?.abbreviation);

      const homeScore = parseInt(homeComp.score ?? '0', 10);
      const awayScore = parseInt(awayComp.score ?? '0', 10);

      const homeNorm = normalizeTeamName(homeRawName);
      const awayNorm = normalizeTeamName(awayRawName);
      const homeNormOrig = normalizeTeamName(rawHomeOriginal);
      const awayNormOrig = normalizeTeamName(rawAwayOriginal);

      const homeUuid = nameToUuid.get(homeNorm) || nameToUuid.get(homeNormOrig);
      const awayUuid = nameToUuid.get(awayNorm) || nameToUuid.get(awayNormOrig);

      if (!homeUuid && !awayUuid) continue;

      const homeTeamInDb = homeUuid ? teamsData.find((t: any) => t.id === homeUuid) : null;
      const awayTeamInDb = awayUuid ? teamsData.find((t: any) => t.id === awayUuid) : null;

      const homeLogoUrl = getTeamLogo(homeRawName, homeComp.team?.logo);
      const awayLogoUrl = getTeamLogo(awayRawName, awayComp.team?.logo);

      const formatColor = (c?: string | null) => {
        if (!c) return null;
        const clean = c.replace('#', '').trim();
        return clean ? `#${clean}` : null;
      };
      const homeColor = formatColor(homeComp.team?.color);
      const awayColor = formatColor(awayComp.team?.color);
      const homeAltColor = formatColor(homeComp.team?.alternateColor);
      const awayAltColor = formatColor(awayComp.team?.alternateColor);

      const venueName = competition.venue?.fullName || null;
      const venueCity = competition.venue?.address?.city || null;

      let matchCurrentMinute: number | null = null;
      if (cleanDisplayClock) {
        const m = cleanDisplayClock.match(/^(\d+)/);
        if (m) matchCurrentMinute = parseInt(m[1], 10);
      } else if (event.status?.clock != null && !isNaN(event.status.clock) && event.status.clock > 0) {
        matchCurrentMinute = Math.floor(event.status.clock / 60);
      }

      // Parsear incidencias y enriquecer con summary
      const parsedEvents = await parseMatchEvents({
        competition,
        event,
        homeRawName,
        homeComp,
        awayComp,
        matchCurrentMinute,
        isLiveNow,
        isUpcoming,
        isFinishedToday,
        espnHeaders: ESPN_HEADERS,
      });

      // Parsear estadísticas del partido
      const matchStats = parseMatchStats(homeComp, awayComp);

      const minuteNum = (isLiveNow || isHalftime) && clockDisplay ? parseInt(clockDisplay, 10) || null : null;
      const startTimeText = isUpcoming ? formatMatchTime(eventDateStr) : null;

      const saveMatch = (uuid: string, isHomeTeam: boolean) => {
        const payload: LiveMatchData = {
          homeTeam: homeRawName,
          awayTeam: awayRawName,
          homeShortTeam: homeShortName,
          awayShortTeam: awayShortName,
          homeAbbr,
          awayAbbr,
          homeTeamDbName: homeTeamInDb?.name || null,
          awayTeamDbName: awayTeamInDb?.name || null,
          homeScore: isNaN(homeScore) ? 0 : homeScore,
          awayScore: isNaN(awayScore) ? 0 : awayScore,
          minute: minuteNum,
          displayClock: cleanDisplayClock,
          isHalftime,
          isHome: isHomeTeam,
          isManual: false,
          leagueName: competitionName || null,
          isFinished: isFinishedToday,
          isUpcoming,
          startTime: startTimeText,
          rawDate: eventDateStr,
          eventTimestamp: eventTimestamp || (eventDateStr ? new Date(eventDateStr).getTime() : null),
          homeLogo: homeLogoUrl,
          awayLogo: awayLogoUrl,
          hasHomeTeamInDb: !!homeUuid,
          hasAwayTeamInDb: !!awayUuid,
          homeTeamId: homeUuid || null,
          awayTeamId: awayUuid || null,
          homeColor,
          awayColor,
          homeAltColor,
          awayAltColor,
          venueName,
          venueCity,
          leagueSlug: event._leagueSlug || null,
          events: parsedEvents.length > 0 ? parsedEvents : undefined,
          stats: matchStats,
        };

        const existing = result[uuid];
        if (!existing) {
          result[uuid] = payload;
        } else {
          if (isLiveNow) {
            result[uuid] = payload;
          } else if (isUpcoming && existing.isFinished) {
            result[uuid] = payload;
          }
        }
      };

      if (homeUuid) saveMatch(homeUuid, true);
      if (awayUuid) saveMatch(awayUuid, false);
    }
  } catch (err) {
    console.error('[live-matches] ESPN API Error:', err);
  }

  // ── 4. Respaldo Manual desde Supabase (is_matchday_active = true) ───────────
  for (const team of teamsData) {
    if (team.is_matchday_active && !result[team.id]) {
      const opponentName = team.matchday_opponent || 'Rival';
      const scoreStr = team.matchday_score || '0-0';
      const periodStr = team.matchday_period || 'En Vivo';

      let hScore = 0;
      let aScore = 0;
      if (scoreStr.includes('-')) {
        const parts = scoreStr.split('-').map((s: string) => parseInt(s.trim(), 10));
        if (!isNaN(parts[0])) hScore = parts[0];
        if (!isNaN(parts[1])) aScore = parts[1];
      }

      const isFinished = periodStr.toLowerCase().includes('final');
      const awayUuid = nameToUuid.get(normalizeTeamName(opponentName));

      const homeAbbr = team.name.slice(0, 3).toUpperCase();
      const awayAbbr = opponentName.slice(0, 3).toUpperCase();

      const matchDataPayload: LiveMatchData = {
        homeTeam: team.name,
        awayTeam: opponentName,
        homeShortTeam: team.name,
        awayShortTeam: opponentName,
        homeAbbr,
        awayAbbr,
        homeTeamDbName: team.name,
        awayTeamDbName: null,
        homeScore: hScore,
        awayScore: aScore,
        minute: null,
        isHome: true,
        isManual: true,
        leagueName: periodStr !== 'En Vivo' ? periodStr : 'MATCHDAY EN VIVO',
        isFinished,
        homeLogo: team.logo_url || null,
        awayLogo: getTeamLogo(opponentName),
        hasHomeTeamInDb: true,
        hasAwayTeamInDb: !!awayUuid,
        homeTeamId: team.id,
        awayTeamId: awayUuid || null,
      };

      result[team.id] = matchDataPayload;

      if (awayUuid && !result[awayUuid]) {
        result[awayUuid] = { ...matchDataPayload, isHome: false };
      }
    }
  }

  // ── 5. Modo Debug ──────────────────────────────────────────────────────────
  if (isDebug) {
    return NextResponse.json({
      supabaseDataCount: teamsData.length,
      nameToUuidSize: nameToUuid.size,
      eventsFetched: events.length,
      redisAvailable: isRedisAvailable(),
      sampleEvents: events.slice(0, 5).map((e: any) => ({
        name: e.name,
        competitors: e.competitions?.[0]?.competitors?.map((c: any) => ({
          name: c.team?.name,
          homeAway: c.homeAway,
        })),
        state: e.status?.type?.state,
        date: e.date,
      })),
      resultKeys: Object.keys(result),
      result,
    });
  }

  // ── 6. Guardar en memoria y Redis ──────────────────────────────────────────
  if (Object.keys(result).length > 0) {
    setMemoryCache(result, todayDateStr);
    saveToDistributedCache(CACHE_KEY, STALE_CACHE_KEY, result);
  }

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate',
      'CDN-Cache-Control': 'no-store',
      'Vercel-CDN-Cache-Control': 'no-store',
      'X-Live-Cache': 'MISS',
    },
  });
}
