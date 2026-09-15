import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Redis } from '@upstash/redis';
import type { LiveMatchData, MatchEventDetail, MatchStats } from '@/hooks/useLiveMatches';

// ─────────────────────────────────────────────────────────────────────────────
// CACHÉ DISTRIBUIDA EN UPSTASH REDIS Y MEMORIA SERVERLESS
// ─────────────────────────────────────────────────────────────────────────────
const CACHE_KEY = 'live-matches:v6';
const STALE_CACHE_KEY = 'live-matches:last-known-good';
const CACHE_TTL_SECONDS = 30; // 30 segundos — suficiente para tiempo real
const STALE_CACHE_TTL_SECONDS = 86400; // 24 horas — respaldo ante caídas de ESPN
const MEMORY_CACHE_TTL_MS = 30_000;

// Caché en memoria para instancias Serverless cálidas
let memoryCache: { data: Record<string, LiveMatchData>; timestamp: number } | null = null;

let redis: Redis | null = null;
let redisDisabledUntil = 0;

function getRedis(): Redis | null {
  if (Date.now() < redisDisabledUntil) return null;
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

export const maxDuration = 30;
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
  'cd olimpia': ['olimpia', 'cd olimpia', 'club deportivo olimpia', 'c.d. olimpia', 'olimpia tegucigalpa', 'club olimpia deportivo', 'olimpia deportivo'],
  'motagua': ['cd motagua', 'motagua', 'futbol club motagua', 'fc motagua', 'c.d. motagua'],
  'real espana': ['real espana', 'real cd espana', 'real club deportivo espana', 'rcd espana', 'real españa', 'real cd españa'],
  'marathon': ['marathon', 'cd marathon', 'club deportivo marathon', 'marathón', 'cd marathón'],
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
  if (
    lower.includes('central_american_cup') ||
    lower.includes('central american cup') ||
    lower.includes('central.american.cup') ||
    lower.includes('copa centroamericana')
  ) {
    return 'Copa Centroamericana CONCACAF';
  }
  if (lower.includes('copa america') || lower.includes('copa américa') || lower.includes('conmebol.america')) return 'Copa América';
  if (lower.includes('uefa.euro') || lower.includes('eurocopa') || lower.includes('european championship')) return 'UEFA Eurocopa';
  if (lower.includes('uefa.nations') || lower.includes('uefa nations league')) return 'UEFA Nations League';
  if (lower.includes('worldq.conmebol') || (lower.includes('worldq') && lower.includes('conmebol'))) return 'Eliminatorias CONMEBOL';
  if (lower.includes('worldq.uefa') || (lower.includes('worldq') && lower.includes('uefa'))) return 'Eliminatorias UEFA';
  if (lower.includes('worldq') || lower.includes('qualifying') || lower.includes('eliminatoria')) return 'Eliminatorias CONCACAF';
  if (lower.includes('gold') || lower.includes('copa oro') || lower.includes('copa-oro')) return 'Copa Oro CONCACAF';
  if (lower.includes('nations.league') || lower.includes('nations league') || lower.includes('nations-league')) return 'CONCACAF Nations League';
  if (lower.includes('fifa.world') || lower.includes('world cup') || lower.includes('copa mundial') || lower.includes('mundial')) return 'Copa Mundial FIFA';
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
  if (lower.includes('champions_cup') || lower.includes('champions cup') || lower.includes('concacaf.champions')) return 'CONCACAF Champions Cup';
  if (lower.includes('concacaf')) return 'CONCACAF Champions Cup';
  if (lower.includes('libertadores')) return 'Copa Libertadores';
  if (lower.includes('sudamericana')) return 'Copa Sudamericana';
  if (lower.includes('fa cup') || lower.includes('fa-cup')) return 'FA Cup';
  if (lower.includes('carabao') || lower.includes('efl cup')) return 'Carabao Cup';
  if (lower.includes('coppa italia')) return 'Coppa Italia';
  if (lower.includes('dfb')) return 'Copa de Alemania';
  if (lower.includes('mls') || lower.includes('major league soccer')) return 'MLS';
  if (lower.includes('liga mx')) return 'Liga MX';
  if (lower.includes('friendly') || lower.includes('amistoso')) return 'Amistoso Internacional';

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

  // ── 0. Intentar responder desde caché en memoria local (ultrarrápido, ~0ms) ─
  if (process.env.NODE_ENV !== 'test' && !isDebug && memoryCache) {
    if (now - memoryCache.timestamp < MEMORY_CACHE_TTL_MS) {
      return NextResponse.json(memoryCache.data, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'X-Live-Cache': 'HIT-MEMORY',
        },
      });
    }
  }

  // ── 0.1 Intentar responder desde caché Redis (con timeout estricto de 1s) ───
  if (process.env.NODE_ENV !== 'test' && !isDebug && client && Date.now() >= redisDisabledUntil) {
    try {
      const getPromise = client.get<any>(CACHE_KEY);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis get timeout')), 1000)
      );
      let cached = await Promise.race([getPromise, timeoutPromise]);
      if (typeof cached === 'string') {
        try {
          cached = JSON.parse(cached);
        } catch {
          cached = null;
        }
      }
      if (cached && typeof cached === 'object' && Object.keys(cached).length > 0) {
        memoryCache = { data: cached, timestamp: now };
        return NextResponse.json(cached, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'X-Live-Cache': 'HIT-REDIS',
          },
        });
      }
    } catch (redisErr: any) {
      redisDisabledUntil = Date.now() + 60_000;
      console.warn('[live-matches] Redis cache read error/timeout, desactivando 60s:', redisErr?.message ?? redisErr);
    }
  }

  const result: Record<string, LiveMatchData> = {};
  let events: any[] = [];

  // ── 1. SUPABASE: equipos, logos, configuración manual de matchday ──────────
  let teamsData: any[] = [];
  const teamLogoByName = new Map<string, string>();

  try {
    let supabase: any = null;
    try {
      supabase = createAdminClient();
    } catch (adminErr) {
      console.warn('[live-matches] Admin client init failed, intentando con clave anon:', adminErr);
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (url && anon) {
        const { createClient } = await import('@supabase/supabase-js');
        supabase = createClient(url, anon, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
      }
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, logo_url, is_matchday_active, matchday_opponent, matchday_score, matchday_period')
        .is('deleted_at', null);

      if (error) throw error;
      teamsData = data || [];
    }

    for (const t of teamsData) {
      if (t.name) {
        const norm = normalizeTeamName(t.name);
        if (t.logo_url) teamLogoByName.set(norm, t.logo_url);
      }
    }

    // Garantizar que la Selección de Honduras esté siempre reconocida con su escudo oficial
    const hasHondurasInDb = teamsData.some(t => normalizeTeamName(t.name) === 'honduras');
    if (!hasHondurasInDb) {
      teamsData.push({
        id: 'honduras-national-team',
        name: 'Honduras',
        logo_url: '/logos/ligas/honduras-seleccion.svg',
      });
      teamLogoByName.set('honduras', '/logos/ligas/honduras-seleccion.svg');
    }
  } catch (e) {
    console.error('[live-matches] Error fetching teams from Supabase:', e);
  }

  // Respaldo garantizado con UUIDs REALES de Supabase si la BD estuviera temporalmente caída
  if (teamsData.length === 0) {
    teamsData = [
      { id: '671e730c-9a6f-43b0-9b22-6588926cfeca', name: 'FC Barcelona', logo_url: '/logos/equipos/barcelona.svg' },
      { id: '2e8c6793-c8e3-454f-a53d-452d46466503', name: 'Arsenal', logo_url: 'https://fhvxolslqrrkefsvbcrq.supabase.co/storage/v1/object/public/products/1775539836961-xxn1h7zcejb.svg' },
      { id: 'c3a6d6d9-6efc-4b8f-abc8-f980cb2ce246', name: 'Manchester City', logo_url: 'https://fhvxolslqrrkefsvbcrq.supabase.co/storage/v1/object/public/products/1776039237536-gua3daf4ltk.svg' },
      { id: '493fceb8-ee26-4c02-a664-c0556053c4e8', name: 'Real Madrid', logo_url: 'https://fhvxolslqrrkefsvbcrq.supabase.co/storage/v1/object/public/products/1768970531374-743yjjcb8j8.svg' },
      { id: '535b242f-6f50-482a-94aa-9524603e5972', name: 'CD Olimpia', logo_url: '/logos/equipos/Club Deportivo Olimpia.svg' },
      { id: '067d0186-17de-497d-9532-c90ad1e0effb', name: 'Liverpool', logo_url: 'https://fhvxolslqrrkefsvbcrq.supabase.co/storage/v1/object/public/products/1775544862903-ikkwx6vrri.svg' },
      { id: 'e39203c0-92cf-48e6-8429-bce20da45e13', name: 'Chelsea FC', logo_url: 'https://fhvxolslqrrkefsvbcrq.supabase.co/storage/v1/object/public/products/1776044510126-tfa4un9ng4.svg' },
      { id: '00bf32a5-db80-4fb6-88a8-cc5b84167987', name: 'Bayern Munich', logo_url: 'https://fhvxolslqrrkefsvbcrq.supabase.co/storage/v1/object/public/products/1775444175090-n450h73x5pg.svg' },
      { id: '734d3f3a-6fc6-4ce5-9116-8a7853de1907', name: 'Paris Saint-Germain', logo_url: 'https://fhvxolslqrrkefsvbcrq.supabase.co/storage/v1/object/public/products/1775542553886-vgunrf4jdva.svg' },
      { id: 'f2b0bc65-047d-49d0-b643-173dc4ec40c9', name: 'Inter Miami', logo_url: 'https://fhvxolslqrrkefsvbcrq.supabase.co/storage/v1/object/public/products/1775709971779-1rjvw2996jt.svg' },
      { id: '7adc38c5-f207-42d7-a716-12c1e02c93fb', name: 'Motagua', logo_url: 'https://fhvxolslqrrkefsvbcrq.supabase.co/storage/v1/object/public/products/1775885316983-tbcj46jswn.svg' },
      { id: '6f2b172f-9f4d-43e3-8619-71745e0d14ca', name: 'Real España' },
      { id: '9d0b0a07-a734-4897-971c-6c9ec24a9907', name: 'Manchester United', logo_url: 'https://fhvxolslqrrkefsvbcrq.supabase.co/storage/v1/object/public/products/1776042018072-x7jc5gwzvue.svg' },
      { id: '3d781df1-cc3b-4b7f-8135-9171128fae49', name: 'Atlético de Madrid', logo_url: 'https://fhvxolslqrrkefsvbcrq.supabase.co/storage/v1/object/public/products/1775544295185-t8jsvrk5gm.svg' },
      { id: '321b4200-0969-4c1e-bc68-bb835436769d', name: 'España', logo_url: 'https://fhvxolslqrrkefsvbcrq.supabase.co/storage/v1/object/public/products/1774740806567-zokm3f8scb.svg' },
      { id: '6c238d61-9ba4-4847-98a9-395a44731fd8', name: 'Argentina', logo_url: 'https://fhvxolslqrrkefsvbcrq.supabase.co/storage/v1/object/public/products/1768976768804-c67yaqe3x39.svg' },
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
      'conmebol.sudamericana',
      'arg.1',
      'fifa.world',
      'concacaf.central.american.cup',
      'concacaf.champions',
      'concacaf.nations.league',
      'concacaf.gold',
      'fifa.worldq.concacaf',
      'fifa.worldq.conmebol',
      'fifa.worldq.uefa',
      'conmebol.america',
      'uefa.euro',
      'uefa.nations',
      'uefa.euroq',
      'fifa.friendly',
    ];

    const ESPN_HEADERS = {
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Referer: 'https://www.espn.com/',
    };

    const fetchPromises = leagues.map(async league => {
      // Intentar primero con el endpoint web de ESPN (evita 403 en serverless/Vercel) y fallback a site.api
      const endpoints = [
        `https://site.web.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard`,
        `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard`,
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
        const leagueName = item.value.leagueName;
        const leagueSlug = item.value.leagueSlug;
        for (const evt of item.value.events) {
          events.push({ ...evt, _leagueName: leagueName, _leagueSlug: leagueSlug });
        }
      }
    }

    // ── Resiliencia: si ESPN no devolvió ningún evento (rate limit, outage, timeout)
    if (events.length === 0) {
      if (memoryCache?.data && Object.keys(memoryCache.data).length > 0) {
        console.warn('[live-matches] ESPN no devolvió eventos; sirviendo memoryCache como stale fallback');
        return NextResponse.json(memoryCache.data, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Live-Cache': 'STALE-MEMORY',
          },
        });
      }
      if (client && Date.now() >= redisDisabledUntil) {
        try {
          const stale = await client.get<string | Record<string, LiveMatchData>>(STALE_CACHE_KEY);
          if (stale) {
            const staleData = typeof stale === 'string' ? JSON.parse(stale) : stale;
            if (staleData && Object.keys(staleData).length > 0) {
              console.warn('[live-matches] ESPN no devolvió eventos; sirviendo Redis como stale fallback');
              return NextResponse.json(staleData, {
                headers: {
                  'Cache-Control': 'no-store, no-cache, must-revalidate',
                  'X-Live-Cache': 'STALE-REDIS',
                },
              });
            }
          }
        } catch (staleErr: any) {
          console.warn('[live-matches] Error al leer stale cache de Redis:', staleErr?.message ?? staleErr);
        }
      }
    }

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

      // Formatear reloj legible preservando tiempo añadido (ej: "45'+11'" -> "45+11'", "90'+6'" -> "90+6'")
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
          const tz = 'America/Tegucigalpa';
          const todayStr = new Date(now).toLocaleDateString('en-CA', { timeZone: tz });
          const eventDayStr = d.toLocaleDateString('en-CA', { timeZone: tz });
          isSameDayToday = eventDayStr === todayStr;
        }
      }

      const elapsedMinutes = eventTimestamp > 0 ? (now - eventTimestamp) / (60 * 1000) : 999;

      // Ventana de visibilidad: estrictamente partidos de HOY (horario Honduras) o en vivo en este momento
      const isLiveNow = state === 'in';
      const isUpcoming = state === 'pre' && isSameDayToday;
      const isFinishedToday = state === 'post' && (elapsedMinutes <= 12 * 60 || (isSameDayToday && elapsedMinutes <= 18 * 60));
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

      const homeRawName = homeComp.team?.displayName || homeComp.team?.name || '';
      const awayRawName = awayComp.team?.displayName || awayComp.team?.name || '';

      const homeShortName = homeComp.team?.shortDisplayName || homeComp.team?.name || homeRawName;
      const awayShortName = awayComp.team?.shortDisplayName || awayComp.team?.name || awayRawName;

      const homeAbbr = (homeComp.team?.abbreviation || homeShortName.slice(0, 3)).toUpperCase();
      const awayAbbr = (awayComp.team?.abbreviation || awayShortName.slice(0, 3)).toUpperCase();

      const homeScore = parseInt(homeComp.score ?? '0', 10);
      const awayScore = parseInt(awayComp.score ?? '0', 10);

      const homeNorm = normalizeTeamName(homeRawName);
      const awayNorm = normalizeTeamName(awayRawName);
      const homeUuid = nameToUuid.get(homeNorm);
      const awayUuid = nameToUuid.get(awayNorm);

      const homeTeamInDb = homeUuid ? teamsData.find(t => t.id === homeUuid) : null;
      const awayTeamInDb = awayUuid ? teamsData.find(t => t.id === awayUuid) : null;

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

      // Incidencias del partido (Goles, Penales, Tarjetas, VAR y Goles Anulados)
      const parsedEvents: MatchEventDetail[] = [];
      if (Array.isArray(competition.details)) {
        for (const d of competition.details) {
          const typeText = (d.type?.text || '').toLowerCase();
          const isOwnGoal = Boolean(d.ownGoal || typeText.includes('own goal') || typeText.includes('autogol'));
          const isPenaltyScored = Boolean(
            (d.penaltyKick && d.scoringPlay) ||
            typeText.includes('penalty - scored') ||
            typeText.includes('penalty scored') ||
            d.type?.id === '98'
          );
          const isPenaltyMissed = Boolean(
            (d.penaltyKick && !d.scoringPlay) ||
            typeText.includes('penalty - missed') ||
            typeText.includes('penalty - saved') ||
            typeText.includes('missed penalty')
          );
          const isDisallowed = Boolean(
            typeText.includes('disallowed') ||
            typeText.includes('anulado') ||
            typeText.includes('overturned') ||
            typeText.includes('cancelled') ||
            typeText.includes('no goal')
          );
          const isVar = Boolean(
            typeText.includes('var') ||
            typeText.includes('video assistant') ||
            isDisallowed
          );
          const isRed = Boolean(d.redCard || typeText.includes('red card') || d.type?.id === '93' || d.type?.id === '95');
          const isYellow = Boolean(d.yellowCard || typeText.includes('yellow card') || d.type?.id === '94');
          const isGoal = Boolean(!isOwnGoal && !isPenaltyScored && !isDisallowed && (d.scoringPlay || typeText.includes('goal') || d.type?.id === '70' || d.type?.id === '137' || d.type?.id === '173'));

          if (!isGoal && !isPenaltyScored && !isPenaltyMissed && !isOwnGoal && !isDisallowed && !isVar && !isRed && !isYellow) {
            continue;
          }

          let eventType: MatchEventDetail['type'] = 'goal';
          let eventText = 'Gol';

          if (isDisallowed) {
            eventType = 'disallowed-goal';
            eventText = 'Gol Anulado';
          } else if (isVar && !isGoal && !isRed && !isYellow) {
            eventType = 'var';
            eventText = 'Revisión VAR';
          } else if (isPenaltyScored) {
            eventType = 'penalty-goal';
            eventText = 'Gol de Penal';
          } else if (isPenaltyMissed) {
            eventType = 'penalty-miss';
            eventText = 'Penal Fallado';
          } else if (isOwnGoal) {
            eventType = 'own-goal';
            eventText = 'Autogol';
          } else if (isRed) {
            eventType = 'red-card';
            eventText = 'Tarjeta Roja';
          } else if (isYellow) {
            eventType = 'yellow-card';
            eventText = 'Tarjeta Amarilla';
          } else if (isGoal) {
            eventType = 'goal';
            eventText = 'Gol';
          }

          const athlete = d.athletesInvolved?.[0];
          const isHomeEvent = d.team?.id
            ? String(d.team.id) === String(homeComp.id || homeComp.team?.id)
            : false;

          parsedEvents.push({
            id: `${d.clock?.value || d.clock?.displayValue || Math.random()}-${athlete?.displayName || eventText}`,
            type: eventType,
            minute: d.clock?.displayValue || (d.clock?.value ? `${Math.floor(d.clock.value / 60)}'` : ''),
            text: eventText,
            teamId: d.team?.id ? String(d.team.id) : undefined,
            isHome: isHomeEvent,
            playerName: athlete?.displayName || athlete?.fullName || (isGoal ? 'Gol' : isDisallowed ? 'Gol Anulado' : isVar ? 'Decisión VAR' : 'Jugador'),
            playerShortName: athlete?.shortName,
            jersey: athlete?.jersey,
          });
        }
      }

      // Mapa de dorsales de atletas a partir de competition.details
      const athleteJerseyMap = new Map<string, string>();
      if (Array.isArray(competition.details)) {
        for (const d of competition.details) {
          if (Array.isArray(d.athletesInvolved)) {
            for (const a of d.athletesInvolved) {
              if (a.id && a.jersey) athleteJerseyMap.set(String(a.id), String(a.jersey));
              if (a.displayName && a.jersey) athleteJerseyMap.set(String(a.displayName), String(a.jersey));
              if (a.fullName && a.jersey) athleteJerseyMap.set(String(a.fullName), String(a.jersey));
            }
          }
        }
      }

      // Si el partido está en vivo o finalizado hoy, enriquecemos con summary endpoint de ESPN
      // para capturar penales fallados, revisiones de VAR y goles anulados que ESPN omite en scoreboard details
      if (event.id && (isLiveNow || isFinishedToday) && (homeUuid || awayUuid)) {
        try {
          const sumLeague = event._leagueSlug || 'mex.1';
          const sumUrl = `https://site.web.api.espn.com/apis/site/v2/sports/soccer/${sumLeague}/summary?event=${event.id}`;
          const sumRes = await fetch(sumUrl, {
            headers: ESPN_HEADERS,
            signal: AbortSignal.timeout(2200),
          });
          if (sumRes.ok) {
            const sumData = await sumRes.json();
            if (Array.isArray(sumData.keyEvents)) {
              for (const k of sumData.keyEvents) {
                const kType = (k.type?.text || '').toLowerCase();
                const isPenSaved = kType.includes('penalty - saved') || kType.includes('penalty saved') || k.type?.id === '114';
                const isPenMissed = kType.includes('penalty - missed') || kType.includes('penalty missed') || k.type?.id === '73';
                const isDisallow = kType.includes('disallowed') || kType.includes('anulado') || kType.includes('overturned') || kType.includes('no goal');
                const isVarCheck = kType.includes('var') || kType.includes('video assistant');
                const isPenScored = kType.includes('penalty - scored') || kType.includes('penalty scored') || k.type?.id === '98';

                if (!isPenSaved && !isPenMissed && !isDisallow && !isVarCheck && !isPenScored) {
                  continue;
                }

                const kClock = k.clock?.displayValue || (k.clock?.value ? `${Math.floor(k.clock.value / 60)}'` : '');
                // Evitar duplicados con parsedEvents
                const alreadyExists = parsedEvents.some(
                  pe => pe.minute === kClock && (
                    (isPenSaved || isPenMissed) ? (pe.type === 'penalty-miss' || pe.type === 'goal') : pe.text === k.type?.text
                  )
                );
                if (alreadyExists) continue;

                const athlete = k.participants?.[0]?.athlete;
                const pName = athlete?.displayName || k.text?.match(/([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+)/)?.[1] || (isPenSaved || isPenMissed ? 'Penal' : 'Incidencia');
                const jerseyFromMap = athlete?.id ? athleteJerseyMap.get(String(athlete.id)) : (pName ? athleteJerseyMap.get(pName) : undefined);

                const isHomeEvt = k.team?.displayName
                  ? k.team.displayName.toLowerCase().includes(homeRawName.toLowerCase()) || homeRawName.toLowerCase().includes(k.team.displayName.toLowerCase())
                  : true;

                let eType: MatchEventDetail['type'] = 'penalty-miss';
                let eText = 'Penal Fallado';
                if (isPenSaved) {
                  eType = 'penalty-miss';
                  eText = 'Penal Atajado';
                } else if (isPenMissed) {
                  eType = 'penalty-miss';
                  eText = 'Penal Fallado';
                } else if (isPenScored) {
                  eType = 'penalty-goal';
                  eText = 'Gol de Penal';
                } else if (isDisallow) {
                  eType = 'disallowed-goal';
                  eText = 'Gol Anulado (VAR)';
                } else if (isVarCheck) {
                  eType = 'var';
                  eText = 'Revisión VAR';
                }

                parsedEvents.push({
                  id: `key-${k.id || kClock}-${pName}`,
                  type: eType,
                  minute: kClock,
                  text: eText,
                  teamId: isHomeEvt ? (homeComp.id ? String(homeComp.id) : undefined) : (awayComp.id ? String(awayComp.id) : undefined),
                  isHome: isHomeEvt,
                  playerName: pName,
                  jersey: jerseyFromMap,
                });
              }
            }
          }
        } catch {
          // Continuar sin summary si falla
        }
      }

      // Ordenar incidencias cronológicamente por minuto de juego (19', 35', 43', 45', 45'+6'...)
      parsedEvents.sort((a, b) => {
        const getMinVal = (str?: string) => {
          if (!str) return 0;
          const m = str.match(/(\d+)(?:\+(\d+))?/);
          if (!m) return 0;
          return parseInt(m[1], 10) * 100 + parseInt(m[2] || '0', 10);
        };
        return getMinVal(a.minute) - getMinVal(b.minute);
      });

      // Estadísticas del partido (Posesión, Tiros)
      const getStat = (statsArr: any[], statName: string) => {
        const s = statsArr?.find((item: any) => item.name?.toLowerCase() === statName.toLowerCase());
        return s?.displayValue ? String(s.displayValue) : null;
      };
      const homeStatsList = homeComp.statistics || [];
      const awayStatsList = awayComp.statistics || [];
      const posH = getStat(homeStatsList, 'possessionPct');
      const posA = getStat(awayStatsList, 'possessionPct');
      const sotH = getStat(homeStatsList, 'shotsOnTarget');
      const sotA = getStat(awayStatsList, 'shotsOnTarget');
      const totH = getStat(homeStatsList, 'totalShots');
      const totA = getStat(awayStatsList, 'totalShots');
      const flsH = getStat(homeStatsList, 'foulsCommitted');
      const flsA = getStat(awayStatsList, 'foulsCommitted');
      const cnrH = getStat(homeStatsList, 'wonCorners');
      const cnrA = getStat(awayStatsList, 'wonCorners');

      let matchStats: MatchStats | undefined = undefined;
      if (posH || sotH || totH) {
        matchStats = {
          possession: posH && posA ? { home: posH, away: posA } : undefined,
          shotsOnTarget: sotH && sotA ? { home: sotH, away: sotA } : undefined,
          totalShots: totH && totA ? { home: totH, away: totA } : undefined,
          fouls: flsH && flsA ? { home: flsH, away: flsA } : undefined,
          corners: cnrH && cnrA ? { home: cnrH, away: cnrA } : undefined,
        };
      }

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

  // ── 5. Guardar en memoria local y en Redis si hay datos ──────────────────
  if (Object.keys(result).length > 0) {
    memoryCache = { data: result, timestamp: now };

    if (client && Date.now() >= redisDisabledUntil) {
      Promise.race([
        Promise.all([
          client.set(CACHE_KEY, JSON.stringify(result), { ex: CACHE_TTL_SECONDS }),
          client.set(STALE_CACHE_KEY, JSON.stringify(result), { ex: STALE_CACHE_TTL_SECONDS }),
        ]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis set timeout')), 1500)),
      ]).catch(err => {
        redisDisabledUntil = Date.now() + 60_000;
        console.warn('[live-matches] Redis cache write error/timeout, desactivando 60s:', err?.message ?? err);
      });
    }
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
