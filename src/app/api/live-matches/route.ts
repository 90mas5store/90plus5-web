import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { LiveMatchData } from '@/hooks/useLiveMatches';
import { getManualMatchdayConfig } from '@/lib/matchdayStore';

// Caché en memoria ultrarrápida: 5 segundos para actualización instantánea
let liveCache: { data: Record<string, LiveMatchData>; ts: number } | null = null;
const CACHE_TTL = 5 * 1000; // 5 segundos

export const dynamic = 'force-dynamic';

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

  // Clubes
  'real madrid': ['real madrid cf', 'real madrid', 'rmadrid'],
  'atletico de madrid': ['atletico madrid', 'atletico de madrid', 'atl madrid', 'atletico'],
  'fc barcelona': ['barcelona', 'barca', 'fc barcelona'],
  'paris saint germain': ['psg', 'paris saint-germain', 'paris sg', 'paris saint germain'],
  'manchester united': ['man united', 'man utd', 'manchester utd', 'manchester united'],
  'manchester city': ['man city', 'manchester city'],
  'inter miami': ['inter miami cf', 'inter miami'],
  'chelsea fc': ['chelsea', 'chelsea fc'],
  'bayern munich': ['bayern munchen', 'bayern munich', 'fc bayern munchen', 'fc bayern munich'],
  'cd olimpia': ['olimpia', 'cd olimpia', 'club deportivo olimpia', 'c.d. olimpia', 'olimpia tegucigalpa'],
  'motagua': ['cd motagua', 'motagua', 'futbol club motagua', 'fc motagua'],
  'real espana': ['real espana', 'real cd espana', 'real club deportivo espana'],
  'marathon': ['marathon', 'cd marathon', 'club deportivo marathon'],
  'boca juniors': ['boca', 'boca juniors', 'ca boca juniors'],
  'america': ['club america', 'america', 'ca america'],
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

    const endpoints = [
      `https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${todayStr}`,
      `https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${tomorrowStr}`,
      `https://site.api.espn.com/apis/site/v2/sports/soccer/hon.1/scoreboard?dates=${todayStr}`,
      `https://site.api.espn.com/apis/site/v2/sports/soccer/hon.1/scoreboard?dates=${tomorrowStr}`,
      'https://site.api.espn.com/apis/site/v2/sports/soccer/concacaf.central_american_cup/scoreboard',
    ];

    const fetchPromises = endpoints.map(url =>
      fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(4000),
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

  liveCache = { data: result, ts: now };
  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
  });
}
