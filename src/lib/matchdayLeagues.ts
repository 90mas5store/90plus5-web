import { createAdminClient } from '@/lib/supabase/admin';
import { ESPN_GLOBAL_LEAGUES_CATALOG } from './espnGlobalCatalog';

export interface LeagueDefinition {
  slug: string;
  name: string;
  category: 'Ligas Principales' | 'Copas Nacionales' | 'Torneos Continentales' | 'Selecciones & FIFA' | 'Personalizados';
  country?: string;
  flag?: string;
  keywords?: string[];
}

export interface MatchdayLeaguesConfig {
  custom_leagues: LeagueDefinition[];
  disabled_leagues: string[];
  updated_at?: string | null;
}

export interface TeamDiscoveryMapping {
  name: string;
  country: string;
  flag: string;
  aliases: string[];
  leagueSlugs: string[];
}

export const DEFAULT_LEAGUES: LeagueDefinition[] = [
  // ── Ligas Principales ───────────────────────────────────────────────────────
  { slug: 'esp.1', name: 'LaLiga Española', category: 'Ligas Principales', country: 'España', flag: '🇪🇸' },
  { slug: 'eng.1', name: 'Premier League', category: 'Ligas Principales', country: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { slug: 'ita.1', name: 'Serie A Italia', category: 'Ligas Principales', country: 'Italia', flag: '🇮🇹' },
  { slug: 'ger.1', name: 'Bundesliga Alemania', category: 'Ligas Principales', country: 'Alemania', flag: '🇩🇪' },
  { slug: 'fra.1', name: 'Ligue 1 Francia', category: 'Ligas Principales', country: 'Francia', flag: '🇫🇷' },
  { slug: 'hon.1', name: 'Liga Hondubet (Nacional)', category: 'Ligas Principales', country: 'Honduras', flag: '🇭🇳' },
  { slug: 'mex.1', name: 'Liga MX', category: 'Ligas Principales', country: 'México', flag: '🇲🇽' },
  { slug: 'usa.1', name: 'Major League Soccer (MLS)', category: 'Ligas Principales', country: 'Estados Unidos', flag: '🇺🇸' },
  { slug: 'arg.1', name: 'Liga Profesional Argentina', category: 'Ligas Principales', country: 'Argentina', flag: '🇦🇷' },
  { slug: 'por.1', name: 'Primeira Liga Portugal', category: 'Ligas Principales', country: 'Portugal', flag: '🇵🇹' },
  { slug: 'bra.1', name: 'Brasileirão Serie A', category: 'Ligas Principales', country: 'Brasil', flag: '🇧🇷' },

  // ── Copas Nacionales Domésticas ─────────────────────────────────────────────
  { slug: 'arg.copa', name: 'Copa Argentina', category: 'Copas Nacionales', country: 'Argentina', flag: '🇦🇷' },
  { slug: 'esp.copa_del_rey', name: 'Copa del Rey', category: 'Copas Nacionales', country: 'España', flag: '🇪🇸' },
  { slug: 'eng.fa', name: 'The Emirates FA Cup', category: 'Copas Nacionales', country: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { slug: 'eng.league_cup', name: 'Carabao Cup (EFL Cup)', category: 'Copas Nacionales', country: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { slug: 'ita.coppa_italia', name: 'Coppa Italia', category: 'Copas Nacionales', country: 'Italia', flag: '🇮🇹' },
  { slug: 'ger.dfb_pokal', name: 'DFB-Pokal (Copa de Alemania)', category: 'Copas Nacionales', country: 'Alemania', flag: '🇩🇪' },
  { slug: 'fra.coupe_de_france', name: 'Coupe de France', category: 'Copas Nacionales', country: 'Francia', flag: '🇫🇷' },

  // ── Torneos Continentales de Clubes ────────────────────────────────────────
  { slug: 'uefa.champions', name: 'UEFA Champions League', category: 'Torneos Continentales', flag: '🏆' },
  { slug: 'uefa.europa', name: 'UEFA Europa League', category: 'Torneos Continentales', flag: '🏆' },
  { slug: 'uefa.super_cup', name: 'Supercopa de la UEFA', category: 'Torneos Continentales', flag: '🏆' },
  { slug: 'conmebol.libertadores', name: 'CONMEBOL Libertadores', category: 'Torneos Continentales', flag: '🏆' },
  { slug: 'conmebol.sudamericana', name: 'CONMEBOL Sudamericana', category: 'Torneos Continentales', flag: '🏆' },
  { slug: 'concacaf.champions', name: 'CONCACAF Champions Cup', category: 'Torneos Continentales', flag: '🏆' },
  { slug: 'concacaf.central.american.cup', name: 'Copa Centroamericana CONCACAF', category: 'Torneos Continentales', flag: '🏆' },
  { slug: 'fifa.cwc', name: 'Copa Mundial de Clubes FIFA', category: 'Torneos Continentales', flag: '🌐' },

  // ── Selecciones y Torneos FIFA ─────────────────────────────────────────────
  { slug: 'fifa.world', name: 'Copa Mundial FIFA', category: 'Selecciones & FIFA', flag: '🌍' },
  { slug: 'conmebol.america', name: 'Copa América', category: 'Selecciones & FIFA', flag: '🌎' },
  { slug: 'uefa.euro', name: 'UEFA Eurocopa', category: 'Selecciones & FIFA', flag: '🇪🇺' },
  { slug: 'concacaf.gold', name: 'Copa Oro CONCACAF', category: 'Selecciones & FIFA', flag: '🏆' },
  { slug: 'concacaf.nations.league', name: 'CONCACAF Nations League', category: 'Selecciones & FIFA', flag: '🏆' },
  { slug: 'uefa.nations', name: 'UEFA Nations League', category: 'Selecciones & FIFA', flag: '🇪🇺' },
  { slug: 'fifa.worldq.concacaf', name: 'Eliminatorias CONCACAF', category: 'Selecciones & FIFA', flag: '🌎' },
  { slug: 'fifa.worldq.conmebol', name: 'Eliminatorias CONMEBOL', category: 'Selecciones & FIFA', flag: '🌎' },
  { slug: 'fifa.worldq.uefa', name: 'Eliminatorias UEFA', category: 'Selecciones & FIFA', flag: '🇪🇺' },
  { slug: 'uefa.euroq', name: 'Clasificación a la Eurocopa', category: 'Selecciones & FIFA', flag: '🇪🇺' },
  { slug: 'fifa.friendly', name: 'Amistosos Internacionales FIFA', category: 'Selecciones & FIFA', flag: '⚽' },
];

/**
 * 🌟 Directorio Global Completo de Torneos ESPN para sugerencia predictiva
 * Integra las 219 ligas y competiciones oficiales de ESPN Scoreboard API con
 * nombres traducidos al español, banderas y palabras clave multilingües.
 */
const defaultSlugSet = new Set(DEFAULT_LEAGUES.map((l) => l.slug));
export const DISCOVERY_LEAGUES_CATALOG: LeagueDefinition[] = [
  ...DEFAULT_LEAGUES,
  ...ESPN_GLOBAL_LEAGUES_CATALOG.filter((l) => !defaultSlugSet.has(l.slug)),
];


/**
 * ⚽ Directorio de Equipos Populares vinculados a sus torneos ESPN
 * Permite buscar "Boca" o "Real Madrid" y ver qué torneos le corresponden
 */
export const POPULAR_TEAMS_DIRECTORY: TeamDiscoveryMapping[] = [
  {
    name: 'Boca Juniors',
    country: 'Argentina',
    flag: '🇦🇷',
    aliases: ['boca', 'boca juniors', 'xeneize'],
    leagueSlugs: ['arg.1', 'arg.copa', 'conmebol.sudamericana', 'conmebol.libertadores', 'fifa.cwc'],
  },
  {
    name: 'River Plate',
    country: 'Argentina',
    flag: '🇦🇷',
    aliases: ['river', 'river plate', 'millonario'],
    leagueSlugs: ['arg.1', 'arg.copa', 'conmebol.libertadores', 'conmebol.sudamericana', 'fifa.cwc'],
  },
  {
    name: 'Racing Club',
    country: 'Argentina',
    flag: '🇦🇷',
    aliases: ['racing', 'racing club', 'la academia'],
    leagueSlugs: ['arg.1', 'arg.copa', 'conmebol.sudamericana'],
  },
  {
    name: 'Real Madrid',
    country: 'España',
    flag: '🇪🇸',
    aliases: ['madrid', 'real madrid', 'merengue'],
    leagueSlugs: ['esp.1', 'esp.copa_del_rey', 'esp.super_cup', 'uefa.champions', 'uefa.super_cup', 'fifa.cwc'],
  },
  {
    name: 'FC Barcelona',
    country: 'España',
    flag: '🇪🇸',
    aliases: ['barcelona', 'barca', 'culer', 'blaugrana'],
    leagueSlugs: ['esp.1', 'esp.copa_del_rey', 'esp.super_cup', 'uefa.champions'],
  },
  {
    name: 'Atlético de Madrid',
    country: 'España',
    flag: '🇪🇸',
    aliases: ['atletico', 'atletico de madrid', 'atleti', 'colchonero'],
    leagueSlugs: ['esp.1', 'esp.copa_del_rey', 'uefa.champions', 'fifa.cwc'],
  },
  {
    name: 'Manchester City',
    country: 'Inglaterra',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    aliases: ['man city', 'manchester city', 'city'],
    leagueSlugs: ['eng.1', 'eng.fa', 'eng.league_cup', 'uefa.champions', 'fifa.cwc'],
  },
  {
    name: 'Arsenal',
    country: 'Inglaterra',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    aliases: ['arsenal', 'gunners'],
    leagueSlugs: ['eng.1', 'eng.fa', 'eng.league_cup', 'uefa.champions'],
  },
  {
    name: 'Liverpool',
    country: 'Inglaterra',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    aliases: ['liverpool', 'reds'],
    leagueSlugs: ['eng.1', 'eng.fa', 'eng.league_cup', 'uefa.champions'],
  },
  {
    name: 'Manchester United',
    country: 'Inglaterra',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    aliases: ['man united', 'man utd', 'manchester united'],
    leagueSlugs: ['eng.1', 'eng.fa', 'eng.league_cup', 'uefa.europa'],
  },
  {
    name: 'Chelsea',
    country: 'Inglaterra',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    aliases: ['chelsea', 'blues'],
    leagueSlugs: ['eng.1', 'eng.fa', 'eng.league_cup', 'fifa.cwc'],
  },
  {
    name: 'Bayern Munich',
    country: 'Alemania',
    flag: '🇩🇪',
    aliases: ['bayern', 'bayern munich', 'munich'],
    leagueSlugs: ['ger.1', 'ger.dfb_pokal', 'uefa.champions', 'fifa.cwc'],
  },
  {
    name: 'Borussia Dortmund',
    country: 'Alemania',
    flag: '🇩🇪',
    aliases: ['dortmund', 'bvb', 'borussia dortmund'],
    leagueSlugs: ['ger.1', 'ger.dfb_pokal', 'uefa.champions', 'fifa.cwc'],
  },
  {
    name: 'Paris Saint-Germain (PSG)',
    country: 'Francia',
    flag: '🇫🇷',
    aliases: ['psg', 'paris', 'paris saint germain'],
    leagueSlugs: ['fra.1', 'fra.coupe_de_france', 'uefa.champions', 'fifa.cwc'],
  },
  {
    name: 'Inter de Milán',
    country: 'Italia',
    flag: '🇮🇹',
    aliases: ['inter', 'inter milan', 'internazionale'],
    leagueSlugs: ['ita.1', 'ita.coppa_italia', 'uefa.champions', 'fifa.cwc'],
  },
  {
    name: 'AC Milan',
    country: 'Italia',
    flag: '🇮🇹',
    aliases: ['milan', 'ac milan', 'rossoneri'],
    leagueSlugs: ['ita.1', 'ita.coppa_italia', 'uefa.champions'],
  },
  {
    name: 'Juventus',
    country: 'Italia',
    flag: '🇮🇹',
    aliases: ['juve', 'juventus'],
    leagueSlugs: ['ita.1', 'ita.coppa_italia', 'uefa.champions', 'fifa.cwc'],
  },
  {
    name: 'CD Olimpia',
    country: 'Honduras',
    flag: '🇭🇳',
    aliases: ['olimpia', 'leones', 'albo'],
    leagueSlugs: ['hon.1', 'concacaf.central.american.cup', 'concacaf.champions'],
  },
  {
    name: 'FC Motagua',
    country: 'Honduras',
    flag: '🇭🇳',
    aliases: ['motagua', 'aguilas', 'azul'],
    leagueSlugs: ['hon.1', 'concacaf.central.american.cup', 'concacaf.champions'],
  },
  {
    name: 'Real España',
    country: 'Honduras',
    flag: '🇭🇳',
    aliases: ['real espana', 'la maquina', 'aurinegro'],
    leagueSlugs: ['hon.1', 'concacaf.central.american.cup', 'concacaf.champions'],
  },
  {
    name: 'CD Marathón',
    country: 'Honduras',
    flag: '🇭🇳',
    aliases: ['marathon', 'monstruo verde'],
    leagueSlugs: ['hon.1', 'concacaf.central.american.cup', 'concacaf.champions'],
  },
  {
    name: 'Inter Miami',
    country: 'Estados Unidos',
    flag: '🇺🇸',
    aliases: ['inter miami', 'messi', 'miami'],
    leagueSlugs: ['usa.1', 'concacaf.champions', 'fifa.cwc'],
  },
  {
    name: 'Al Nassr',
    country: 'Arabia Saudita',
    flag: '🇸🇦',
    aliases: ['al nassr', 'cristiano', 'ronaldo'],
    leagueSlugs: ['ksa.1', 'fifa.cwc'],
  },
  {
    name: 'Al Hilal',
    country: 'Arabia Saudita',
    flag: '🇸🇦',
    aliases: ['al hilal', 'neymar'],
    leagueSlugs: ['ksa.1', 'fifa.cwc'],
  },
  {
    name: 'Flamengo',
    country: 'Brasil',
    flag: '🇧🇷',
    aliases: ['flamengo', 'mengao'],
    leagueSlugs: ['bra.1', 'conmebol.libertadores', 'conmebol.recopa', 'fifa.cwc'],
  },
  {
    name: 'Palmeiras',
    country: 'Brasil',
    flag: '🇧🇷',
    aliases: ['palmeiras', 'verdao'],
    leagueSlugs: ['bra.1', 'conmebol.libertadores', 'fifa.cwc'],
  },
  {
    name: 'Club América',
    country: 'México',
    flag: '🇲🇽',
    aliases: ['america', 'las aguilas', 'club america'],
    leagueSlugs: ['mex.1', 'mex.copa_mx', 'concacaf.champions'],
  },
  {
    name: 'Chivas de Guadalajara',
    country: 'México',
    flag: '🇲🇽',
    aliases: ['chivas', 'guadalajara', 'rebano sagrado'],
    leagueSlugs: ['mex.1', 'mex.copa_mx', 'concacaf.champions'],
  },
  {
    name: 'Sporting CP',
    country: 'Portugal',
    flag: '🇵🇹',
    aliases: ['sporting', 'sporting lisboa', 'sporting cp'],
    leagueSlugs: ['por.1', 'uefa.champions'],
  },
  {
    name: 'SL Benfica',
    country: 'Portugal',
    flag: '🇵🇹',
    aliases: ['benfica'],
    leagueSlugs: ['por.1', 'uefa.champions', 'fifa.cwc'],
  },
  {
    name: 'FC Porto',
    country: 'Portugal',
    flag: '🇵🇹',
    aliases: ['porto'],
    leagueSlugs: ['por.1', 'uefa.europa', 'fifa.cwc'],
  },
  {
    name: 'Millonarios FC',
    country: 'Colombia',
    flag: '🇨🇴',
    aliases: ['millonarios', 'embajador'],
    leagueSlugs: ['col.1', 'col.copa', 'conmebol.libertadores', 'conmebol.sudamericana'],
  },
  {
    name: 'Atlético Nacional',
    country: 'Colombia',
    flag: '🇨🇴',
    aliases: ['atletico nacional', 'nacional colombia', 'verdolaga'],
    leagueSlugs: ['col.1', 'col.copa', 'conmebol.libertadores', 'conmebol.sudamericana'],
  },
  {
    name: 'AFC Ajax',
    country: 'Países Bajos',
    flag: '🇳🇱',
    aliases: ['ajax', 'amsterdam'],
    leagueSlugs: ['ned.1', 'uefa.champions', 'uefa.europa'],
  },
];

export const SETTINGS_KEY = 'matchday_espn_leagues';

let cachedConfig: { data: MatchdayLeaguesConfig; timestamp: number } | null = null;
const CACHE_TTL_MS = 60_000;

export function invalidateMatchdayLeaguesCache(): void {
  cachedConfig = null;
}

export async function getMatchdayLeaguesConfig(): Promise<MatchdayLeaguesConfig> {
  const now = Date.now();
  if (cachedConfig && now - cachedConfig.timestamp < CACHE_TTL_MS) {
    return cachedConfig.data;
  }

  try {
    const adminDb = createAdminClient();
    const { data, error } = await adminDb
      .from('store_settings')
      .select('value, updated_at')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();

    if (!error && data?.value) {
      const val = data.value as any;
      const config: MatchdayLeaguesConfig = {
        custom_leagues: Array.isArray(val.custom_leagues) ? val.custom_leagues : [],
        disabled_leagues: Array.isArray(val.disabled_leagues) ? val.disabled_leagues : [],
        updated_at: data.updated_at,
      };
      cachedConfig = { data: config, timestamp: now };
      return config;
    }
  } catch (err) {
    console.warn('[matchdayLeagues] Error al consultar store_settings, usando defaults:', err);
  }

  const fallback: MatchdayLeaguesConfig = {
    custom_leagues: [],
    disabled_leagues: [],
    updated_at: null,
  };
  return fallback;
}

export async function getActiveLeagueSlugs(): Promise<string[]> {
  const config = await getMatchdayLeaguesConfig();
  const disabledSet = new Set(config.disabled_leagues || []);

  const allSlugs = [
    ...DEFAULT_LEAGUES.map(l => l.slug),
    ...(config.custom_leagues || []).map(l => l.slug),
  ];

  const uniqueActive = Array.from(new Set(allSlugs)).filter(slug => !disabledSet.has(slug));
  return uniqueActive;
}
