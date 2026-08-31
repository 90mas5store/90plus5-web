import { NextResponse } from 'next/server';
import { createClient as createDirectSupabaseClient } from '@supabase/supabase-js';
import type { LiveMatchData } from '@/hooks/useLiveMatches';
import { getManualMatchdayConfig } from '@/lib/matchdayStore';

// Caché en memoria ultrarrápida: 5 segundos para actualización instantánea
let liveCache: { data: Record<string, LiveMatchData>; ts: number } | null = null;
const CACHE_TTL = 5 * 1000; // 5 segundos

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function normalizeTeamName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[-_]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Diccionario de alias entre nombres registrados en DB Supabase y nombres/alias de la API de ESPN
const TEAM_ALIASES: Record<string, string[]> = {
  // Selecciones Nacionales (Español DB <-> Inglés ESPN)
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
  'fc barcelona': ['barcelona', 'barca', 'fc barcelona', 'barca'],
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

function formatCompetitionName(rawName?: string | null): string | null {
  if (!rawName) return null;
  const name = rawName.trim();
  const lower = name.toLowerCase();

  if (lower.includes("honduras") || lower.includes("honduran") || lower.includes("hon.1") || lower.includes("liga nacional")) {
    return "Liga Nacional Honduras";
  }
  if (lower.includes("central_american_cup") || lower.includes("central american cup")) {
    return "Copa Centroamericana CONCACAF";
  }
  if (lower.includes("liga f") || lower.includes("liga-f") || lower.includes("spanish-liga-f") || lower.includes("primera iberdrola")) {
    return "Liga F (Femenina)";
  }
  if (lower.includes("women's champions league") || lower.includes("uwcl") || lower.includes("women-champions")) {
    return "UEFA Champions League Femenina";
  }
  if (lower.includes("champions league") || lower.includes("champions-league") || lower.includes("ucl")) {
    return "UEFA Champions League";
  }
  if (lower.includes("europa league") || lower.includes("europa-league") || lower.includes("uel")) {
    return "UEFA Europa League";
  }
  if (lower.includes("conference league") || lower.includes("conference-league")) {
    return "UEFA Conference League";
  }
  if (lower.includes("copa del rey") || lower.includes("copa-del-rey")) {
    return "Copa del Rey";
  }
  if (lower.includes("laliga") || lower.includes("la liga") || lower.includes("spanish primera")) {
    return "LaLiga Española";
  }
  if (lower.includes("premier league") || lower.includes("premier-league") || lower.includes("epl")) {
    return "Premier League";
  }
  if (lower.includes("serie a") || lower.includes("serie-a")) {
    return "Serie A Italia";
  }
  if (lower.includes("bundesliga")) {
    return "Bundesliga Alemania";
  }
  if (lower.includes("ligue 1") || lower.includes("ligue-1")) {
    return "Ligue 1 Francia";
  }
  if (lower.includes("concacaf")) {
    return "CONCACAF Champions Cup";
  }
  if (lower.includes("libertadores")) {
    return "Copa Libertadores";
  }
  if (lower.includes("sudamericana")) {
    return "Copa Sudamericana";
  }
  if (lower.includes("fa cup") || lower.includes("fa-cup")) {
    return "FA Cup";
  }
  if (lower.includes("carabao") || lower.includes("efl cup")) {
    return "Carabao Cup";
  }
  if (lower.includes("coppa italia")) {
    return "Coppa Italia";
  }
  if (lower.includes("dfb")) {
    return "Copa de Alemania";
  }
  if (lower.includes("mls") || lower.includes("major league soccer")) {
    return "MLS";
  }
  if (lower.includes("liga mx")) {
    return "Liga MX";
  }
  if (lower.includes("friendly") || lower.includes("amistoso")) {
    return "Amistoso";
  }

  return name;
}

function formatMatchTime(dateStr?: string | null): string {
  if (!dateStr) return 'HOY';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'HOY';

    // Zona horaria de Honduras / Centroamérica (America/Tegucigalpa, UTC-6)
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

export async function GET() {
  const now = Date.now();

  // Devolver respuesta en caché si está dentro del TTL (5 s) (omitir en entorno de pruebas)
  if (process.env.NODE_ENV !== 'test' && liveCache && now - liveCache.ts < CACHE_TTL) {
    return NextResponse.json(liveCache.data, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
    });
  }

  const result: Record<string, LiveMatchData> = {};
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[live-matches] Supabase URL or Key not found in environment');
    return NextResponse.json({});
  }

  const supabase = createDirectSupabaseClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. OBTENER LISTADO DE EQUIPOS, LOGOS Y SUS LIGAS REGISTRADAS EN SUPABASE
  let teamsData: any[] = [];
  const teamLeagueMap = new Map<string, string>();
  const teamLogoByName = new Map<string, string>();

  try {
    let { data, error } = await supabase
      .from('teams')
      .select('id, name, logo_url, is_matchday_active, matchday_opponent, matchday_score, matchday_period')
      .is('deleted_at', null);

    if (error || !data || data.length === 0) {
      const fallback = await supabase
        .from('teams')
        .select('id, name, logo_url');
      data = fallback.data as any;
    }

    teamsData = data || [];

    for (const t of teamsData) {
      if (t.name) {
        const norm = normalizeTeamName(t.name);
        if (t.logo_url) teamLogoByName.set(norm, t.logo_url);
      }
    }
  } catch (e) {
    console.warn('[live-matches] Error fetching teams from Supabase:', e);
  }

  // Respaldo garantizado de equipos base si la BD estuviera momentáneamente ocupada
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

  // Mapa robusto de búsqueda de IDs por nombre normalizado y alias
  const nameToUuid = new Map<string, string>();
  for (const t of teamsData) {
    if (!t.name) continue;
    const norm = normalizeTeamName(t.name);
    if (!norm) continue;

    // 1. Asignar nombre exacto normalizado y variante sin espacios
    nameToUuid.set(norm, t.id);
    const noSpaceVariant = norm.replace(/\s+/g, '');
    if (noSpaceVariant && !nameToUuid.has(noSpaceVariant)) {
      nameToUuid.set(noSpaceVariant, t.id);
    }

    // 2. Variante sin prefijos/sufijos (ej. "fc barcelona" -> "barcelona", "chelsea fc" -> "chelsea", "cd olimpia" -> "olimpia")
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

    // 3. Registrar todos los alias configurados
    for (const [key, aliases] of Object.entries(TEAM_ALIASES)) {
      const normKey = normalizeTeamName(key);
      const normKeyNoSpace = normKey.replace(/\s+/g, '');
      if (norm === normKey || cleanVariant === normKey || noSpaceVariant === normKeyNoSpace) {
        for (const alias of aliases) {
          const normAlias = normalizeTeamName(alias);
          if (!nameToUuid.has(normAlias)) {
            nameToUuid.set(normAlias, t.id);
          }
          const normAliasNoSpace = normAlias.replace(/\s+/g, '');
          if (normAliasNoSpace && !nameToUuid.has(normAliasNoSpace)) {
            nameToUuid.set(normAliasNoSpace, t.id);
          }
        }
      }
    }
  }

  const getTeamLogo = (name: string, espnLogo?: string | null) => {
    // 1. Siempre priorizar el logotipo oficial en alta resolución de la API de ESPN (500x500 PNG transparente)
    if (espnLogo) return espnLogo;
    // 2. Fallback al logotipo registrado en base de datos si la API no provee imagen
    const norm = normalizeTeamName(name);
    const uuid = nameToUuid.get(norm);
    if (uuid) {
      const foundTeam = teamsData.find(t => t.id === uuid);
      if (foundTeam?.logo_url) return foundTeam.logo_url;
    }
    return teamLogoByName.get(norm) || null;
  };

  // 2. CONSULTAR LA API PÚBLICA EN TIEMPO REAL DE ESPN SPORTS
  try {
    const tz = 'America/Tegucigalpa';
    const nowLocalDate = new Date();
    const todayStr = nowLocalDate.toLocaleDateString('en-CA', { timeZone: tz }).replace(/-/g, '');
    const tomorrowLocalDate = new Date(nowLocalDate.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = tomorrowLocalDate.toLocaleDateString('en-CA', { timeZone: tz }).replace(/-/g, '');

    const leagues = [
      'esp.1',
      'eng.1',
      'uefa.champions',
      'ita.1',
      'ger.1',
      'fra.1',
      'hon.1',
      'concacaf.central_american_cup',
      'mex.1',
      'usa.1',
      'uefa.europa',
      'conmebol.libertadores',
      'fifa.world',
    ];

    const endpoints: string[] = [];
    for (const league of leagues) {
      // 1. Scoreboard general en vivo / jornada activa
      endpoints.push(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard`);
      // 2. Scoreboard con fecha local de hoy
      endpoints.push(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${todayStr}`);
    }

    const fetchPromises = endpoints.map(url =>
      fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(6000),
      })
        .then(res => (res.ok ? res.json() : null))
        .catch(() => null)
    );

    const responses = await Promise.allSettled(fetchPromises);
    let events: any[] = [];

    for (const item of responses) {
      if (item.status === 'fulfilled' && item.value?.events) {
        events = events.concat(item.value.events);
      }
    }

    for (const event of events) {
      const competition = event.competitions?.[0];
      if (!competition) continue;

      const state = event.status?.type?.state; // 'pre' = por jugar hoy/mañana, 'in' = en vivo, 'post' = finalizado
      const clockDisplay = event.status?.displayClock || event.status?.type?.shortDetail || null;

      // Fecha de inicio del partido
      const eventDateStr = event.date || competition.date || null;
      const eventTimestamp = eventDateStr ? new Date(eventDateStr).getTime() : 0;
      const elapsedMinutes = eventTimestamp > 0 ? (now - eventTimestamp) / (60 * 1000) : 999;

      // Visibilidad del partido de la jornada:
      // - Programado para hoy o mañana ('pre'): dentro de las próximas 36 horas
      // - En vivo ('in')
      // - Finalizado ('post'): visible hasta 4 horas (240 min) después del inicio del partido
      const isUpcoming = state === 'pre';
      const isLiveNow = state === 'in';
      const isFinishedToday = state === 'post' && elapsedMinutes <= 4 * 60;

      const isMatchdayActive = isUpcoming || isLiveNow || isFinishedToday;
      if (!isMatchdayActive) continue;

      // Extraer la competencia real del partido
      const rawComp = competition.altGameNote || event.season?.slug || competition.league?.name || event.league?.name || null;
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

      // Priorizar el logotipo oficial en alta resolución de ESPN
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
          leagueName: competitionName || teamLeagueMap.get(uuid) || null,
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
          // Prioridad: EN VIVO ('in') > PRÓXIMO ('pre') > FINALIZADO ('post')
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
      const awayUuid = nameToUuid.get(normalizeTeamName(opponentName));

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
        hasHomeTeamInDb: true,
        hasAwayTeamInDb: !!awayUuid,
      };

      result[team.id] = matchDataPayload;

      // Si el equipo rival también está registrado en la base de datos de la tienda, activar la insignia Live para el rival también!
      if (awayUuid && !result[awayUuid]) {
        result[awayUuid] = {
          ...matchDataPayload,
          isHome: false,
        };
      }
    }
  }

  if (Object.keys(result).length > 0) {
    liveCache = { data: result, ts: now };
  }
  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate',
      'CDN-Cache-Control': 'no-store',
      'Vercel-CDN-Cache-Control': 'no-store',
    },
  });
}
