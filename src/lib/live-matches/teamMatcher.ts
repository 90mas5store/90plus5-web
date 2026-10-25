import { createAdminClient } from '@/lib/supabase/admin';

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZACIÓN DE NOMBRES
// ─────────────────────────────────────────────────────────────────────────────
export function normalizeTeamName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[øØ]/g, 'o')
    .replace(/[æÆ]/g, 'ae')
    .replace(/[åÅ]/g, 'a')
    .replace(/[ß]/g, 'ss')
    .replace(/[łŁ]/g, 'l')
    .replace(/[đĐ]/g, 'd')
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
export const TEAM_ALIASES: Record<string, string[]> = {
  'bodo glimt': ['bodo glimt', 'bodo/glimt', 'fk bodo/glimt', 'bodoglimt', 'fk bodo glimt'],
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
  'portugal': ['portugal', 'seleccion portuguesa', 'seleccao das quinas'],
  'gales': ['wales', 'cymru', 'seleccion de gales'],
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
  'racing club': ['racing club', 'racing', 'racing club de avellaneda'],
  'independiente': ['independiente', 'ca independiente'],
  'san lorenzo': ['san lorenzo', 'san lorenzo de almagro'],
  'flamengo': ['flamengo', 'cr flamengo'],
  'palmeiras': ['palmeiras', 'se palmeiras'],
  'corinthians': ['corinthians', 'sc corinthians'],
  'sao paulo': ['sao paulo', 'sao paulo fc', 'são paulo'],
  'america': ['club america', 'america', 'ca america'],
  'chivas': ['guadalajara', 'chivas', 'chivas guadalajara'],
  'al nassr': ['al nassr', 'al-nassr', 'al nassr fc'],
  'al hilal': ['al hilal', 'al-hilal', 'al hilal sfc'],
  'sporting cp': ['sporting cp', 'sporting lisbon', 'sporting'],
  'benfica': ['benfica', 'sl benfica'],
  'porto': ['porto', 'fc porto'],
};

// ─────────────────────────────────────────────────────────────────────────────
// RESPALDO DE EQUIPOS EN MEMORIA (UUIDs reales de Supabase)
// ─────────────────────────────────────────────────────────────────────────────
export const DEFAULT_FALLBACK_TEAMS = [
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
  { id: '48d948a9-247a-4470-9d37-aaf96e3117f5', name: 'Al Nassr' },
];

export function formatCompetitionName(rawName?: string | null): string | null {
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
  if (lower.includes('copa argentina') || lower.includes('arg.copa')) return 'Copa Argentina';
  if (lower.includes('copa del rey') || lower.includes('copa-del-rey') || lower.includes('esp.copa_del_rey')) return 'Copa del Rey';
  if (lower.includes('laliga') || lower.includes('la liga') || lower.includes('spanish primera')) return 'LaLiga Española';
  if (lower.includes('premier league') || lower.includes('premier-league') || lower.includes('epl')) return 'Premier League';
  if (lower.includes('serie a') || lower.includes('serie-a')) return 'Serie A Italia';
  if (lower.includes('bundesliga')) return 'Bundesliga Alemania';
  if (lower.includes('ligue 1') || lower.includes('ligue-1')) return 'Ligue 1 Francia';
  if (lower.includes('primeira liga') || lower.includes('por.1') || lower.includes('portuguese')) return 'Liga Portugal';
  if (lower.includes('brasileirao') || lower.includes('bra.1') || lower.includes('brazilian')) return 'Brasileirão';
  if (lower.includes('champions_cup') || lower.includes('champions cup') || lower.includes('concacaf.champions')) return 'CONCACAF Champions Cup';
  if (lower.includes('concacaf')) return 'CONCACAF Champions Cup';
  if (lower.includes('libertadores')) return 'Copa Libertadores';
  if (lower.includes('sudamericana')) return 'Copa Sudamericana';
  if (lower.includes('fa cup') || lower.includes('fa-cup') || lower.includes('eng.fa')) return 'FA Cup';
  if (lower.includes('carabao') || lower.includes('efl cup') || lower.includes('eng.league_cup')) return 'Carabao Cup';
  if (lower.includes('coppa italia') || lower.includes('ita.coppa_italia')) return 'Coppa Italia';
  if (lower.includes('dfb') || lower.includes('ger.dfb_pokal')) return 'Copa de Alemania (DFB-Pokal)';
  if (lower.includes('coupe de france') || lower.includes('fra.coupe_de_france')) return 'Copa de Francia';
  if (lower.includes('cwc') || lower.includes('club world cup') || lower.includes('fifa.cwc')) return 'Mundial de Clubes FIFA';
  if (lower.includes('super cup') || lower.includes('supercup') || lower.includes('uefa.super_cup')) return 'Supercopa de Europa';
  if (lower.includes('saudi') || lower.includes('ksa.1') || lower.includes('saudi pro league')) return 'Saudi Pro League';
  if (lower.includes('king cup') || lower.includes('kings cup') || lower.includes('ksa.kings_cup')) return 'Copa del Rey de Campeones';
  if (lower.includes('afc champions') || lower.includes('afc.champions')) return 'AFC Champions League Elite';
  if (lower.includes('mls') || lower.includes('major league soccer')) return 'MLS';
  if (lower.includes('liga mx')) return 'Liga MX';
  if (lower.includes('friendly') || lower.includes('amistoso')) return 'Amistoso Internacional';

  return name;
}

export function formatMatchTime(dateStr?: string | null): string {
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

export async function fetchTeamsFromSupabase(): Promise<any[]> {
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
      const teams = data || [];

      // Garantizar que la Selección de Honduras esté siempre reconocida con su escudo oficial
      const hasHondurasInDb = teams.some((t: any) => normalizeTeamName(t.name) === 'honduras');
      if (!hasHondurasInDb) {
        teams.push({
          id: 'honduras-national-team',
          name: 'Honduras',
          logo_url: '/logos/ligas/honduras-seleccion.svg',
        });
      }

      return teams;
    }
  } catch (e) {
    console.error('[live-matches] Error fetching teams from Supabase:', e);
  }

  return DEFAULT_FALLBACK_TEAMS;
}

export function buildTeamResolver(teamsData: any[]) {
  const teamLogoByName = new Map<string, string>();
  const nameToUuid = new Map<string, string>();

  for (const t of teamsData) {
    if (!t.name) continue;
    const norm = normalizeTeamName(t.name);
    if (!norm) continue;

    if (t.logo_url) teamLogoByName.set(norm, t.logo_url);

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

  return { nameToUuid, teamLogoByName, getTeamLogo };
}
