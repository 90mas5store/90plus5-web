import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Redis } from '@upstash/redis';
import type { LiveMatchData } from '@/hooks/useLiveMatches';

// ─────────────────────────────────────────────────────────────────────────────
// CACHÉ DISTRIBUIDA EN UPSTASH REDIS
// Vercel ejecuta cada request en una función serverless efímera distinta.
// Las variables en memoria se resetean en cada instancia → usar Redis.
// ─────────────────────────────────────────────────────────────────────────────
const CACHE_KEY = 'live-matches:v1';
const CACHE_TTL_SECONDS = 30; // 30 segundos — suficiente para tiempo real

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

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZACIÓN DE NOMBRES
// ─────────────────────────────────────────────────────────────────────────────
function normalizeTeamName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    // Compatible con todos los runtimes (sin Unicode property escapes)
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-_]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// ALIAS: DB Supabase ↔ ESPN API
// ─────────────────────────────────────────────────────────────────────────────
const TEAM_ALIASES: Record<string, string[]> = {
  // Selecciones Nacionales
  'espana': ['spain', 'seleccion espanola'],
  'alemania': ['germany', 'dfb team'],
  'inglaterra': ['england', 'three lions'],
  'brasil': ['brazil', 'selecao'],
  'francia': ['france', 'les bleus'],
  'estados unidos': ['united states', 'usa', 'usmnt'],
  'paises bajos': ['netherlands', 'holland'],
  'belgica': ['belgium', 'red devils'],
  'japon': ['japan', 'samurai blue'],
  'italia': ['italy', 'azzurri'],
  'noruega': ['norway'],
  'mexico': ['mexico', 'el tri'],
  'canada': ['canada'],
  'colombia': ['colombia', 'los cafeteros'],
  'panama': ['panama', 'los canaleros'],
  'uruguay': ['uruguay', 'la celeste'],
  'argentina': ['argentina', 'la albiceleste'],
  'jamaica': ['jamaica'],
  'honduras': ['honduras', 'la h', 'los catrachos'],
  // Clubes
  'real madrid': ['real madrid cf', 'real madrid', 'rmadrid', 'r madrid'],
  'atletico de madrid': ['atletico madrid', 'atletico de madrid', 'atl madrid', 'atletico', 'atl. madrid'],
  'fc barcelona': ['barcelona', 'barca', 'fc barcelona'],
  'paris saint germain': ['psg', 'paris saint-germain', 'paris sg', 'paris saint germain'],
  'manchester united': ['man united', 'man utd', 'manchester utd', 'manchester united', 'manchester u.'],
  'manchester city': ['man city', 'manchester city', 'man. city'],
  'arsenal': ['arsenal', 'arsenal fc', 'the gunners'],
  'liverpool': ['liverpool', 'liverpool fc', 'the reds'],
  'chelsea fc': ['chelsea', 'chelsea fc'],
  'tottenham hotspur': ['tottenham', 'tottenham hotspur', 'spurs'],
  'inter miami': ['inter miami cf', 'inter miami', 'inter miami fc'],
  'bayern munich': ['bayern munchen', 'bayern munich', 'fc bayern munchen', 'fc bayern munich', 'bayern'],
  'borussia dortmund': ['borussia dortmund', 'dortmund', 'bvb', 'bvb dortmund'],
  'bayer leverkusen': ['bayer leverkusen', 'leverkusen', 'bayer 04 leverkusen'],
  'juventus': ['juventus', 'juventus fc', 'juve'],
  'inter': ['inter milan', 'internazionale', 'inter milano', 'inter'],
  'ac milan': ['milan', 'ac milan', 'a.c. milan', 'rossoneri'],
  'cd olimpia': ['olimpia', 'cd olimpia', 'club deportivo olimpia', 'c.d. olimpia', 'olimpia tegucigalpa'],
  'motagua': ['cd motagua', 'motagua', 'futbol club motagua', 'fc motagua'],
  'real espana': ['real espana', 'real cd espana', 'real club deportivo espana'],
  'marathon': ['marathon', 'cd marathon', 'club deportivo marathon'],
  'boca juniors': ['boca', 'boca juniors', 'ca boca juniors'],
  'river plate': ['river plate', 'river', 'ca river plate'],
  'america': ['club america', 'america', 'ca america'],
  'chivas': ['guadalajara', 'chivas', 'chivas guadalajara'],
  'al nassr': ['al nassr', 'al-nassr', 'al nassr fc'],
  'al hilal': ['al hilal', 'al-hilal', 'al hilal sfc'],
  'sporting cp': ['sporting cp', 'sporting lisbon', 'sporting'],
  'benfica': ['benfica', 'sl benfica'],
  'porto': ['porto', 'fc porto'],
};

// ─────────────────────────────────────────────────────────────────────────────
// FORMATEADORES
// ─────────────────────────────────────────────────────────────────────────────
function formatCompetitionName(rawName?: string | null): string | null {
  if (!rawName) return null;
  const name = rawName.trim();
  const lower = name.toLowerCase();

  if (lower.includes('honduras') || lower.includes('honduran') || lower.includes('hon.1') || lower.includes('liga nacional')) return 'Liga Nacional Honduras';
  if (lower.includes('central_american_cup') || lower.includes('central american cup')) return 'Copa Centroamericana CONCACAF';
  if (lower.includes('liga f') || lower.includes('liga-f') || lower.includes('spanish-liga-f') || lower.includes('primera iberdrola')) return 'Liga F (Femenina)';
  if (lower.includes("women's champions league") || lower.includes('uwcl') || lower.includes('women-champions')) return 'UEFA Champions League Femenina';
  if (lower.includes('champions league') || lower.includes('champions-league') || lower.includes('ucl')) return 'UEFA Champions League';
  if (lower.includes('europa league') || lower.includes('europa-league') || lower.includes('uel')) return 'UEFA Europa League';
  if (lower.includes('conference league') || lower.includes('conference-league')) return 'UEFA Conference League';
  if (lower.includes('copa del rey') || lower.includes('copa-del-rey')) return 'Copa del Rey';
  if (lower.includes('laliga') || lower.includes('la liga') || lower.includes('spanish primera')) return 'LaLiga Española';
  if (lower.includes('premier league') || lower.includes('premier-league') || lower.includes('epl')) return 'Premier League';
  if (lower.includes('serie a') || lower.includes('serie-a')) return 'Serie A Italia';
  if (lower.includes('bundesliga')) return 'Bundesliga Alemania';
  if (lower.includes('ligue 1') || lower.includes('ligue-1')) return 'Ligue 1 Francia';
  if (lower.includes('concacaf')) return 'CONCACAF Champions Cup';
  if (lower.includes('libertadores')) return 'Copa Libertadores';
  if (lower.includes('sudamericana')) return 'Copa Sudamericana';
  if (lower.includes('fa cup') || lower.includes('fa-cup')) return 'FA Cup';
  if (lower.includes('carabao') || lower.includes('efl cup')) return 'Carabao Cup';
  if (lower.includes('coppa italia')) return 'Coppa Italia';
  if (lower.includes('dfb')) return 'Copa de Alemania';
  if (lower.includes('mls') || lower.includes('major league soccer')) return 'MLS';
  if (lower.includes('liga mx')) return 'Liga MX';
  if (lower.includes('friendly') || lower.includes('amistoso')) return 'Amistoso';

  return name;
}

function formatMatchTime(dateStr?: string | null): string {
  if (!dateStr) return 'HOY';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'HOY';

    const tz = 'America/Tegucigalpa';
    const now = new Date();

    const dStr = d.toLocaleDateString('en-CA', { timeZone: tz });
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: tz });
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = tomorrow.toLocaleDateString('en-CA', { timeZone: tz });

    let dayPrefix = 'HOY';
    if (dStr === todayStr) {
      dayPrefix = 'HOY';
    } else if (dStr === tomorrowStr) {
      dayPrefix = 'MAÑANA';
    } else {
      const dayName = d.toLocaleDateString('es-HN', { weekday: 'short', timeZone: tz }).toUpperCase().replace('.', '');
      dayPrefix = dayName;
    }

    const timeFormatted = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: tz,
    });

    return `${dayPrefix} ${timeFormatted}`;
  } catch {
    return 'HOY';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req?: NextRequest) {
  const now = Date.now();
  const isDebug = req ? req.nextUrl.searchParams.get('debug') === '1' : false;
  const client = getRedis();

  // ── 0. Intentar responder desde caché Redis (skip en test y debug) ──────────
  if (process.env.NODE_ENV !== 'test' && !isDebug && client) {
    try {
      const cached = await client.get<Record<string, LiveMatchData>>(CACHE_KEY);
      if (cached && typeof cached === 'object') {
        return NextResponse.json(cached, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'X-Live-Cache': 'HIT',
          },
        });
      }
    } catch (redisErr) {
      // Redis no disponible → seguir sin caché (degradado, no crash)
      console.warn('[live-matches] Redis cache read error:', redisErr);
    }
  }

  const result: Record<string, LiveMatchData> = {};
  let events: any[] = [];

  // ── 1. SUPABASE: equipos, logos, configuración manual de matchday ──────────
  let teamsData: any[] = [];
  const teamLogoByName = new Map<string, string>();

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, logo_url, is_matchday_active, matchday_opponent, matchday_score, matchday_period')
      .is('deleted_at', null);

    if (error) throw error;

    teamsData = data || [];

    for (const t of teamsData) {
      if (t.name) {
        const norm = normalizeTeamName(t.name);
        if (t.logo_url) teamLogoByName.set(norm, t.logo_url);
      }
    }
  } catch (e) {
    console.error('[live-matches] Error fetching teams from Supabase:', e);
  }

  // Respaldo garantizado si la BD estuviera temporalmente caída
  if (teamsData.length === 0) {
    teamsData = [
      { id: '671e730c-9a6f-43b0-9b22-6588926cfeca', name: 'FC Barcelona' },
      { id: '2e8c6793-c8e3-454f-a53d-452d46466503', name: 'Arsenal' },
      { id: 'c3a6d6d9-6efc-4b8f-abc8-f980cb2ce246', name: 'Manchester City' },
      { id: '493fceb8-ee26-4c02-a664-c0556053c4e8', name: 'Real Madrid' },
      { id: '535b242f-6f50-482a-94aa-9524603e5972', name: 'Club Deportivo Olimpia' },
      { id: 'b0a1c2d3-e4f5-6789-0123-456789abcdef', name: 'Liverpool' },
      { id: 'c1d2e3f4-a5b6-7890-1234-567890abcdef', name: 'Chelsea FC' },
      { id: 'd2e3f4a5-b6c7-8901-2345-678901abcdef', name: 'Bayern Munich' },
      { id: 'e3f4a5b6-c7d8-9012-3456-789012abcdef', name: 'Paris Saint Germain' },
      { id: 'f4a5b6c7-d8e9-0123-4567-890123abcdef', name: 'Inter Miami' },
      { id: '05b6c7d8-e9f0-1234-5678-901234abcdef', name: 'Motagua' },
      { id: '16c7d8e9-f0a1-2345-6789-012345abcdef', name: 'Real España' },
      { id: '27d8e9f0-a1b2-3456-7890-123456abcdef', name: 'Marathón' },
    ];
  }

  // ── Mapa robusto: nombre normalizado → UUID ────────────────────────────────
  const nameToUuid = new Map<string, string>();
  for (const t of teamsData) {
    if (!t.name) continue;
    const norm = normalizeTeamName(t.name);
    if (!norm) continue;

    nameToUuid.set(norm, t.id);
    const noSpaceVariant = norm.replace(/\s+/g, '');
    if (noSpaceVariant && !nameToUuid.has(noSpaceVariant)) {
      nameToUuid.set(noSpaceVariant, t.id);
    }

    const cleanVariant = norm
      .replace(/\bfc\b|\bcf\b|\bcd\b|\bclub\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleanVariant && !nameToUuid.has(cleanVariant)) {
      nameToUuid.set(cleanVariant, t.id);
      const cleanNoSpace = cleanVariant.replace(/\s+/g, '');
      if (cleanNoSpace && !nameToUuid.has(cleanNoSpace)) {
        nameToUuid.set(cleanNoSpace, t.id);
      }
    }

    for (const [key, aliases] of Object.entries(TEAM_ALIASES)) {
      const allVariants = [key, ...aliases].map(a => normalizeTeamName(a));
      const cleanVariants = allVariants.map(a =>
        a.replace(/\bfc\b|\bcf\b|\bcd\b|\bclub\b/g, '').replace(/\s+/g, ' ').trim()
      );

      const isMatch =
        allVariants.includes(norm) ||
        cleanVariants.includes(norm) ||
        cleanVariants.includes(cleanVariant);

      if (isMatch) {
        for (const variant of allVariants) {
          if (variant && !nameToUuid.has(variant)) nameToUuid.set(variant, t.id);
          const noSpace = variant.replace(/\s+/g, '');
          if (noSpace && !nameToUuid.has(noSpace)) nameToUuid.set(noSpace, t.id);
        }
      }
    }
  }

  const getTeamLogo = (name: string, espnLogo?: string | null): string | null => {
    if (espnLogo) return espnLogo;
    const norm = normalizeTeamName(name);
    const uuid = nameToUuid.get(norm);
    if (uuid) {
      const foundTeam = teamsData.find(t => t.id === uuid);
      if (foundTeam?.logo_url) return foundTeam.logo_url;
    }
    return teamLogoByName.get(norm) || null;
  };

  // ── 2. ESPN: partidos en tiempo real ──────────────────────────────────────
  try {
    const leagues = [
      'esp.1',
      'eng.1',
      'uefa.champions',
      'ita.1',
      'ger.1',
      'fra.1',
      'hon.1',
      'mex.1',
      'usa.1',
      'uefa.europa',
      'conmebol.libertadores',
      'fifa.world',
    ];

    const fetchPromises = leagues.map(league =>
      fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'ESPN-Scoreboard/1.0',
        },
        cache: 'no-store',
        // Aumentado de 6s → 8s para evitar abortos prematuros en Vercel
        signal: AbortSignal.timeout(8000),
      })
        .then(res => {
          if (!res.ok) {
            console.warn(`[live-matches] ESPN fetch failed for ${league}: ${res.status}`);
            return null;
          }
          return res.json();
        })
        .catch(err => {
          console.warn(`[live-matches] ESPN fetch error for ${league}:`, err?.message ?? err);
          return null;
        })
    );

    const responses = await Promise.allSettled(fetchPromises);
    events = [];

    for (const item of responses) {
      if (item.status === 'fulfilled' && item.value?.events) {
        events = events.concat(item.value.events);
      }
    }

    for (const event of events) {
      const competition = event.competitions?.[0];
      if (!competition) continue;

      const state = event.status?.type?.state;
      const clockDisplay = event.status?.displayClock || event.status?.type?.shortDetail || null;

      const eventDateStr = event.date || competition.date || null;
      const eventTimestamp = eventDateStr ? new Date(eventDateStr).getTime() : 0;
      const elapsedMinutes = eventTimestamp > 0 ? (now - eventTimestamp) / (60 * 1000) : 999;

      // Ventana de visibilidad: próximos 36h, en vivo, o finalizado en las últimas 4h
      const isUpcoming = state === 'pre';
      const isLiveNow = state === 'in';
      const isFinishedToday = state === 'post' && elapsedMinutes <= 4 * 60;
      if (!isUpcoming && !isLiveNow && !isFinishedToday) continue;

      const rawComp =
        competition.altGameNote ||
        event.season?.slug ||
        competition.league?.name ||
        event.league?.name ||
        null;
      const competitionName = formatCompetitionName(rawComp);

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

      const homeLogoUrl = getTeamLogo(homeName, homeComp.team?.logo);
      const awayLogoUrl = getTeamLogo(awayName, awayComp.team?.logo);

      const minuteNum = isLiveNow && clockDisplay ? parseInt(clockDisplay, 10) || null : null;
      const startTimeText = isUpcoming ? formatMatchTime(eventDateStr) : null;

      const saveMatch = (uuid: string, isHomeTeam: boolean) => {
        const payload: LiveMatchData = {
          homeTeam: homeName,
          awayTeam: awayName,
          homeScore: isNaN(homeScore) ? 0 : homeScore,
          awayScore: isNaN(awayScore) ? 0 : awayScore,
          minute: minuteNum,
          isHome: isHomeTeam,
          isManual: false,
          leagueName: competitionName || null,
          isFinished: isFinishedToday,
          isUpcoming,
          startTime: startTimeText,
          homeLogo: homeLogoUrl,
          awayLogo: awayLogoUrl,
          hasHomeTeamInDb: !!homeUuid,
          hasAwayTeamInDb: !!awayUuid,
        };

        const existing = result[uuid];
        if (!existing) {
          result[uuid] = payload;
        } else {
          // Prioridad: EN VIVO > PRÓXIMO > FINALIZADO
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

  // ── 3. RESPALDO MANUAL: equipos con is_matchday_active = true en Supabase ──
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

      const matchDataPayload: LiveMatchData = {
        homeTeam: team.name,
        awayTeam: opponentName,
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
      };

      result[team.id] = matchDataPayload;

      // Si el rival también está en BD, activar su badge Live también
      if (awayUuid && !result[awayUuid]) {
        result[awayUuid] = { ...matchDataPayload, isHome: false };
      }
    }
  }

  // ── 4. DEBUG ─────────────────────────────────────────────────────────────
  if (isDebug) {
    return NextResponse.json({
      supabaseDataCount: teamsData.length,
      nameToUuidSize: nameToUuid.size,
      eventsFetched: events.length,
      redisAvailable: !!client,
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

  // ── 5. Guardar en Redis si hay datos ──────────────────────────────────────
  if (Object.keys(result).length > 0 && client) {
    client
      .set(CACHE_KEY, JSON.stringify(result), { ex: CACHE_TTL_SECONDS })
      .catch(err => console.warn('[live-matches] Redis cache write error:', err));
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
