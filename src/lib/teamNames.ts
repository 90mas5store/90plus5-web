/**
 * Diccionario y utilidades de traducción y localización al español
 * para selecciones nacionales y equipos internacionales provenientes de APIs externas (ej. ESPN).
 */

interface TeamLocalization {
  name: string;
  shortName: string;
  abbr: string;
}

const RAW_NATIONAL_TEAMS: Record<string, TeamLocalization> = {
  // Europa
  wales: { name: 'Gales', shortName: 'Gales', abbr: 'GAL' },
  cymru: { name: 'Gales', shortName: 'Gales', abbr: 'GAL' },
  spain: { name: 'España', shortName: 'España', abbr: 'ESP' },
  germany: { name: 'Alemania', shortName: 'Alemania', abbr: 'ALE' },
  england: { name: 'Inglaterra', shortName: 'Inglaterra', abbr: 'ING' },
  france: { name: 'Francia', shortName: 'Francia', abbr: 'FRA' },
  italy: { name: 'Italia', shortName: 'Italia', abbr: 'ITA' },
  netherlands: { name: 'Países Bajos', shortName: 'Países Bajos', abbr: 'NED' },
  holland: { name: 'Países Bajos', shortName: 'Países Bajos', abbr: 'NED' },
  belgium: { name: 'Bélgica', shortName: 'Bélgica', abbr: 'BEL' },
  portugal: { name: 'Portugal', shortName: 'Portugal', abbr: 'POR' },
  croatia: { name: 'Croacia', shortName: 'Croacia', abbr: 'CRO' },
  switzerland: { name: 'Suiza', shortName: 'Suiza', abbr: 'SUI' },
  sweden: { name: 'Suecia', shortName: 'Suecia', abbr: 'SUE' },
  denmark: { name: 'Dinamarca', shortName: 'Dinamarca', abbr: 'DIN' },
  norway: { name: 'Noruega', shortName: 'Noruega', abbr: 'NOR' },
  poland: { name: 'Polonia', shortName: 'Polonia', abbr: 'POL' },
  scotland: { name: 'Escocia', shortName: 'Escocia', abbr: 'ESC' },
  ireland: { name: 'Irlanda', shortName: 'Irlanda', abbr: 'IRL' },
  'republic of ireland': { name: 'Irlanda', shortName: 'Irlanda', abbr: 'IRL' },
  'northern ireland': { name: 'Irlanda del Norte', shortName: 'Irlanda del N.', abbr: 'NIR' },
  austria: { name: 'Austria', shortName: 'Austria', abbr: 'AUT' },
  'czech republic': { name: 'República Checa', shortName: 'Rep. Checa', abbr: 'CZE' },
  czechia: { name: 'República Checa', shortName: 'Rep. Checa', abbr: 'CZE' },
  turkey: { name: 'Turquía', shortName: 'Turquía', abbr: 'TUR' },
  turkiye: { name: 'Turquía', shortName: 'Turquía', abbr: 'TUR' },
  greece: { name: 'Grecia', shortName: 'Grecia', abbr: 'GRE' },
  hungary: { name: 'Hungría', shortName: 'Hungría', abbr: 'HUN' },
  ukraine: { name: 'Ucrania', shortName: 'Ucrania', abbr: 'UKR' },
  romania: { name: 'Rumania', shortName: 'Rumania', abbr: 'ROU' },
  serbia: { name: 'Serbia', shortName: 'Serbia', abbr: 'SRB' },
  slovakia: { name: 'Eslovaquia', shortName: 'Eslovaquia', abbr: 'SVK' },
  slovenia: { name: 'Eslovenia', shortName: 'Eslovenia', abbr: 'SVN' },
  finland: { name: 'Finlandia', shortName: 'Finlandia', abbr: 'FIN' },
  iceland: { name: 'Islandia', shortName: 'Islandia', abbr: 'ISL' },
  'bosnia and herzegovina': { name: 'Bosnia y Herzegovina', shortName: 'Bosnia', abbr: 'BIH' },
  albania: { name: 'Albania', shortName: 'Albania', abbr: 'ALB' },
  georgia: { name: 'Georgia', shortName: 'Georgia', abbr: 'GEO' },
  cyprus: { name: 'Chipre', shortName: 'Chipre', abbr: 'CYP' },
  luxembourg: { name: 'Luxemburgo', shortName: 'Luxemburgo', abbr: 'LUX' },

  // América
  'united states': { name: 'Estados Unidos', shortName: 'EE. UU.', abbr: 'USA' },
  usa: { name: 'Estados Unidos', shortName: 'EE. UU.', abbr: 'USA' },
  brazil: { name: 'Brasil', shortName: 'Brasil', abbr: 'BRA' },
  argentina: { name: 'Argentina', shortName: 'Argentina', abbr: 'ARG' },
  colombia: { name: 'Colombia', shortName: 'Colombia', abbr: 'COL' },
  uruguay: { name: 'Uruguay', shortName: 'Uruguay', abbr: 'URU' },
  chile: { name: 'Chile', shortName: 'Chile', abbr: 'CHI' },
  mexico: { name: 'México', shortName: 'México', abbr: 'MEX' },
  canada: { name: 'Canadá', shortName: 'Canadá', abbr: 'CAN' },
  honduras: { name: 'Honduras', shortName: 'Honduras', abbr: 'HON' },
  'costa rica': { name: 'Costa Rica', shortName: 'Costa Rica', abbr: 'CRC' },
  panama: { name: 'Panamá', shortName: 'Panamá', abbr: 'PAN' },
  jamaica: { name: 'Jamaica', shortName: 'Jamaica', abbr: 'JAM' },
  peru: { name: 'Perú', shortName: 'Perú', abbr: 'PER' },
  ecuador: { name: 'Ecuador', shortName: 'Ecuador', abbr: 'ECU' },
  paraguay: { name: 'Paraguay', shortName: 'Paraguay', abbr: 'PAR' },
  venezuela: { name: 'Venezuela', shortName: 'Venezuela', abbr: 'VEN' },
  bolivia: { name: 'Bolivia', shortName: 'Bolivia', abbr: 'BOL' },
  'el salvador': { name: 'El Salvador', shortName: 'El Salvador', abbr: 'SLV' },
  guatemala: { name: 'Guatemala', shortName: 'Guatemala', abbr: 'GUA' },
  nicaragua: { name: 'Nicaragua', shortName: 'Nicaragua', abbr: 'NCA' },
  haiti: { name: 'Haití', shortName: 'Haití', abbr: 'HAI' },

  // África
  morocco: { name: 'Marruecos', shortName: 'Marruecos', abbr: 'MAR' },
  senegal: { name: 'Senegal', shortName: 'Senegal', abbr: 'SEN' },
  egypt: { name: 'Egipto', shortName: 'Egipto', abbr: 'EGY' },
  'ivory coast': { name: 'Costa de Marfil', shortName: 'Costa de Marfil', abbr: 'CIV' },
  "cote d'ivoire": { name: 'Costa de Marfil', shortName: 'Costa de Marfil', abbr: 'CIV' },
  nigeria: { name: 'Nigeria', shortName: 'Nigeria', abbr: 'NGA' },
  cameroon: { name: 'Camerún', shortName: 'Camerún', abbr: 'CMR' },
  ghana: { name: 'Ghana', shortName: 'Ghana', abbr: 'GHA' },
  algeria: { name: 'Argelia', shortName: 'Argelia', abbr: 'ALG' },
  tunisia: { name: 'Túnez', shortName: 'Túnez', abbr: 'TUN' },
  'south africa': { name: 'Sudáfrica', shortName: 'Sudáfrica', abbr: 'RSA' },

  // Asia / Oceanía
  japan: { name: 'Japón', shortName: 'Japón', abbr: 'JPN' },
  'south korea': { name: 'Corea del Sur', shortName: 'Corea del Sur', abbr: 'KOR' },
  'korea republic': { name: 'Corea del Sur', shortName: 'Corea del Sur', abbr: 'KOR' },
  'saudi arabia': { name: 'Arabia Saudita', shortName: 'Arabia Saudita', abbr: 'KSA' },
  australia: { name: 'Australia', shortName: 'Australia', abbr: 'AUS' },
  'new zealand': { name: 'Nueva Zelanda', shortName: 'Nueva Zelanda', abbr: 'NZL' },
  iran: { name: 'Irán', shortName: 'Irán', abbr: 'IRN' },
  qatar: { name: 'Catar', shortName: 'Catar', abbr: 'QAT' },
};

function normalizeForLookup(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Diccionario bidireccional exhaustivo: indexado tanto por nombres en inglés como en español y abreviaturas
const NATIONAL_TEAMS_ES: Record<string, TeamLocalization> = { ...RAW_NATIONAL_TEAMS };

for (const val of Object.values(RAW_NATIONAL_TEAMS)) {
  const normName = normalizeForLookup(val.name);
  if (normName && !NATIONAL_TEAMS_ES[normName]) {
    NATIONAL_TEAMS_ES[normName] = val;
  }
  const normShort = normalizeForLookup(val.shortName);
  if (normShort && !NATIONAL_TEAMS_ES[normShort]) {
    NATIONAL_TEAMS_ES[normShort] = val;
  }
  const normAbbr = normalizeForLookup(val.abbr);
  if (normAbbr && !NATIONAL_TEAMS_ES[normAbbr]) {
    NATIONAL_TEAMS_ES[normAbbr] = val;
  }
}

// Variantes y alias comunes
NATIONAL_TEAMS_ES['wal'] = RAW_NATIONAL_TEAMS.wales;
NATIONAL_TEAMS_ES['gal'] = RAW_NATIONAL_TEAMS.wales;
NATIONAL_TEAMS_ES['gales'] = RAW_NATIONAL_TEAMS.wales;
NATIONAL_TEAMS_ES['esp'] = RAW_NATIONAL_TEAMS.spain;
NATIONAL_TEAMS_ES['espana'] = RAW_NATIONAL_TEAMS.spain;
NATIONAL_TEAMS_ES['ger'] = RAW_NATIONAL_TEAMS.germany;
NATIONAL_TEAMS_ES['ale'] = RAW_NATIONAL_TEAMS.germany;
NATIONAL_TEAMS_ES['alemania'] = RAW_NATIONAL_TEAMS.germany;
NATIONAL_TEAMS_ES['eng'] = RAW_NATIONAL_TEAMS.england;
NATIONAL_TEAMS_ES['ing'] = RAW_NATIONAL_TEAMS.england;
NATIONAL_TEAMS_ES['inglaterra'] = RAW_NATIONAL_TEAMS.england;
NATIONAL_TEAMS_ES['fra'] = RAW_NATIONAL_TEAMS.france;
NATIONAL_TEAMS_ES['francia'] = RAW_NATIONAL_TEAMS.france;
NATIONAL_TEAMS_ES['ita'] = RAW_NATIONAL_TEAMS.italy;
NATIONAL_TEAMS_ES['italia'] = RAW_NATIONAL_TEAMS.italy;
NATIONAL_TEAMS_ES['ned'] = RAW_NATIONAL_TEAMS.netherlands;
NATIONAL_TEAMS_ES['hol'] = RAW_NATIONAL_TEAMS.netherlands;
NATIONAL_TEAMS_ES['paises bajos'] = RAW_NATIONAL_TEAMS.netherlands;
NATIONAL_TEAMS_ES['bel'] = RAW_NATIONAL_TEAMS.belgium;
NATIONAL_TEAMS_ES['belgica'] = RAW_NATIONAL_TEAMS.belgium;
NATIONAL_TEAMS_ES['cro'] = RAW_NATIONAL_TEAMS.croatia;
NATIONAL_TEAMS_ES['croacia'] = RAW_NATIONAL_TEAMS.croatia;
NATIONAL_TEAMS_ES['sui'] = RAW_NATIONAL_TEAMS.switzerland;
NATIONAL_TEAMS_ES['suiza'] = RAW_NATIONAL_TEAMS.switzerland;
NATIONAL_TEAMS_ES['swe'] = RAW_NATIONAL_TEAMS.sweden;
NATIONAL_TEAMS_ES['sue'] = RAW_NATIONAL_TEAMS.sweden;
NATIONAL_TEAMS_ES['suecia'] = RAW_NATIONAL_TEAMS.sweden;
NATIONAL_TEAMS_ES['den'] = RAW_NATIONAL_TEAMS.denmark;
NATIONAL_TEAMS_ES['din'] = RAW_NATIONAL_TEAMS.denmark;
NATIONAL_TEAMS_ES['dinamarca'] = RAW_NATIONAL_TEAMS.denmark;
NATIONAL_TEAMS_ES['nor'] = RAW_NATIONAL_TEAMS.norway;
NATIONAL_TEAMS_ES['noruega'] = RAW_NATIONAL_TEAMS.norway;
NATIONAL_TEAMS_ES['pol'] = RAW_NATIONAL_TEAMS.poland;
NATIONAL_TEAMS_ES['polonia'] = RAW_NATIONAL_TEAMS.poland;
NATIONAL_TEAMS_ES['sco'] = RAW_NATIONAL_TEAMS.scotland;
NATIONAL_TEAMS_ES['esc'] = RAW_NATIONAL_TEAMS.scotland;
NATIONAL_TEAMS_ES['escocia'] = RAW_NATIONAL_TEAMS.scotland;
NATIONAL_TEAMS_ES['irl'] = RAW_NATIONAL_TEAMS.ireland;
NATIONAL_TEAMS_ES['irlanda'] = RAW_NATIONAL_TEAMS.ireland;
NATIONAL_TEAMS_ES['nir'] = RAW_NATIONAL_TEAMS['northern ireland'];
NATIONAL_TEAMS_ES['irlanda del norte'] = RAW_NATIONAL_TEAMS['northern ireland'];
NATIONAL_TEAMS_ES['cze'] = RAW_NATIONAL_TEAMS['czech republic'];
NATIONAL_TEAMS_ES['republica checa'] = RAW_NATIONAL_TEAMS['czech republic'];
NATIONAL_TEAMS_ES['tur'] = RAW_NATIONAL_TEAMS.turkey;
NATIONAL_TEAMS_ES['turquia'] = RAW_NATIONAL_TEAMS.turkey;
NATIONAL_TEAMS_ES['gre'] = RAW_NATIONAL_TEAMS.greece;
NATIONAL_TEAMS_ES['grecia'] = RAW_NATIONAL_TEAMS.greece;
NATIONAL_TEAMS_ES['hun'] = RAW_NATIONAL_TEAMS.hungary;
NATIONAL_TEAMS_ES['hungria'] = RAW_NATIONAL_TEAMS.hungary;
NATIONAL_TEAMS_ES['ukr'] = RAW_NATIONAL_TEAMS.ukraine;
NATIONAL_TEAMS_ES['ucrania'] = RAW_NATIONAL_TEAMS.ukraine;
NATIONAL_TEAMS_ES['rou'] = RAW_NATIONAL_TEAMS.romania;
NATIONAL_TEAMS_ES['rumania'] = RAW_NATIONAL_TEAMS.romania;
NATIONAL_TEAMS_ES['svk'] = RAW_NATIONAL_TEAMS.slovakia;
NATIONAL_TEAMS_ES['eslovaquia'] = RAW_NATIONAL_TEAMS.slovakia;
NATIONAL_TEAMS_ES['svn'] = RAW_NATIONAL_TEAMS.slovenia;
NATIONAL_TEAMS_ES['slo'] = RAW_NATIONAL_TEAMS.slovenia;
NATIONAL_TEAMS_ES['eslovenia'] = RAW_NATIONAL_TEAMS.slovenia;
NATIONAL_TEAMS_ES['fin'] = RAW_NATIONAL_TEAMS.finland;
NATIONAL_TEAMS_ES['finlandia'] = RAW_NATIONAL_TEAMS.finland;
NATIONAL_TEAMS_ES['isl'] = RAW_NATIONAL_TEAMS.iceland;
NATIONAL_TEAMS_ES['islandia'] = RAW_NATIONAL_TEAMS.iceland;
NATIONAL_TEAMS_ES['bih'] = RAW_NATIONAL_TEAMS['bosnia and herzegovina'];
NATIONAL_TEAMS_ES['bosnia'] = RAW_NATIONAL_TEAMS['bosnia and herzegovina'];
NATIONAL_TEAMS_ES['cyp'] = RAW_NATIONAL_TEAMS.cyprus;
NATIONAL_TEAMS_ES['chipre'] = RAW_NATIONAL_TEAMS.cyprus;
NATIONAL_TEAMS_ES['lux'] = RAW_NATIONAL_TEAMS.luxembourg;
NATIONAL_TEAMS_ES['luxemburgo'] = RAW_NATIONAL_TEAMS.luxembourg;
NATIONAL_TEAMS_ES['eeuu'] = RAW_NATIONAL_TEAMS['united states'];
NATIONAL_TEAMS_ES['estados unidos'] = RAW_NATIONAL_TEAMS['united states'];
NATIONAL_TEAMS_ES['bra'] = RAW_NATIONAL_TEAMS.brazil;
NATIONAL_TEAMS_ES['brasil'] = RAW_NATIONAL_TEAMS.brazil;
NATIONAL_TEAMS_ES['mar'] = RAW_NATIONAL_TEAMS.morocco;
NATIONAL_TEAMS_ES['marruecos'] = RAW_NATIONAL_TEAMS.morocco;
NATIONAL_TEAMS_ES['egy'] = RAW_NATIONAL_TEAMS.egypt;
NATIONAL_TEAMS_ES['egipto'] = RAW_NATIONAL_TEAMS.egypt;
NATIONAL_TEAMS_ES['civ'] = RAW_NATIONAL_TEAMS['ivory coast'];
NATIONAL_TEAMS_ES['costa de marfil'] = RAW_NATIONAL_TEAMS['ivory coast'];
NATIONAL_TEAMS_ES['cmr'] = RAW_NATIONAL_TEAMS.cameroon;
NATIONAL_TEAMS_ES['camerun'] = RAW_NATIONAL_TEAMS.cameroon;
NATIONAL_TEAMS_ES['alg'] = RAW_NATIONAL_TEAMS.algeria;
NATIONAL_TEAMS_ES['argelia'] = RAW_NATIONAL_TEAMS.algeria;
NATIONAL_TEAMS_ES['tun'] = RAW_NATIONAL_TEAMS.tunisia;
NATIONAL_TEAMS_ES['tunez'] = RAW_NATIONAL_TEAMS.tunisia;
NATIONAL_TEAMS_ES['rsa'] = RAW_NATIONAL_TEAMS['south africa'];
NATIONAL_TEAMS_ES['sudafrica'] = RAW_NATIONAL_TEAMS['south africa'];
NATIONAL_TEAMS_ES['jpn'] = RAW_NATIONAL_TEAMS.japan;
NATIONAL_TEAMS_ES['japon'] = RAW_NATIONAL_TEAMS.japan;
NATIONAL_TEAMS_ES['kor'] = RAW_NATIONAL_TEAMS['south korea'];
NATIONAL_TEAMS_ES['corea del sur'] = RAW_NATIONAL_TEAMS['south korea'];
NATIONAL_TEAMS_ES['ksa'] = RAW_NATIONAL_TEAMS['saudi arabia'];
NATIONAL_TEAMS_ES['arabia saudita'] = RAW_NATIONAL_TEAMS['saudi arabia'];
NATIONAL_TEAMS_ES['aus'] = RAW_NATIONAL_TEAMS.australia;
NATIONAL_TEAMS_ES['nzl'] = RAW_NATIONAL_TEAMS['new zealand'];
NATIONAL_TEAMS_ES['nueva zelanda'] = RAW_NATIONAL_TEAMS['new zealand'];
NATIONAL_TEAMS_ES['irn'] = RAW_NATIONAL_TEAMS.iran;
NATIONAL_TEAMS_ES['iran'] = RAW_NATIONAL_TEAMS.iran;
NATIONAL_TEAMS_ES['qat'] = RAW_NATIONAL_TEAMS.qatar;
NATIONAL_TEAMS_ES['catar'] = RAW_NATIONAL_TEAMS.qatar;

/**
 * Traduce el nombre completo de una selección nacional al español.
 * Si no es una selección en el diccionario, retorna el nombre original intacto.
 */
export function translateTeamNameToSpanish(rawName?: string | null): string {
  if (!rawName) return '';
  const clean = rawName.trim();
  const norm = normalizeForLookup(clean);

  if (NATIONAL_TEAMS_ES[norm]) {
    return NATIONAL_TEAMS_ES[norm].name;
  }

  // Búsqueda por subcadena para variantes como "Wales National Team", "Spain NT", etc.
  for (const [key, val] of Object.entries(NATIONAL_TEAMS_ES)) {
    if (norm === key || norm.startsWith(`${key} `) || norm.endsWith(` ${key}`)) {
      return val.name;
    }
  }

  return clean;
}

/**
 * Traduce el nombre corto de una selección al español.
 */
export function translateTeamShortName(rawName?: string | null, fallbackShort?: string | null): string {
  if (!rawName && !fallbackShort) return '';

  const normRaw = normalizeForLookup(rawName || '');
  if (normRaw && NATIONAL_TEAMS_ES[normRaw]) {
    return NATIONAL_TEAMS_ES[normRaw].shortName;
  }

  const normFallback = normalizeForLookup(fallbackShort || '');
  if (normFallback && NATIONAL_TEAMS_ES[normFallback]) {
    return NATIONAL_TEAMS_ES[normFallback].shortName;
  }

  for (const [key, val] of Object.entries(NATIONAL_TEAMS_ES)) {
    if (normRaw && (normRaw === key || normRaw.startsWith(`${key} `) || normRaw.endsWith(` ${key}`))) {
      return val.shortName;
    }
    if (normFallback && (normFallback === key || normFallback.startsWith(`${key} `) || normFallback.endsWith(` ${key}`))) {
      return val.shortName;
    }
  }

  if (fallbackShort) {
    const translatedFallback = translateTeamNameToSpanish(fallbackShort);
    if (translatedFallback && translatedFallback !== fallbackShort) {
      return translatedFallback;
    }
    return fallbackShort;
  }

  return rawName || '';
}

/**
 * Traduce o genera la abreviatura de 3 letras en español para selecciones.
 */
export function translateTeamAbbr(rawName?: string | null, fallbackAbbr?: string | null): string {
  if (!rawName && !fallbackAbbr) return '';

  const normRaw = normalizeForLookup(rawName || '');
  if (normRaw && NATIONAL_TEAMS_ES[normRaw]?.abbr) {
    return NATIONAL_TEAMS_ES[normRaw].abbr;
  }

  const normFallback = normalizeForLookup(fallbackAbbr || '');
  if (normFallback && NATIONAL_TEAMS_ES[normFallback]?.abbr) {
    return NATIONAL_TEAMS_ES[normFallback].abbr;
  }

  for (const [key, val] of Object.entries(NATIONAL_TEAMS_ES)) {
    if (val.abbr) {
      if (normRaw && (normRaw === key || normRaw.startsWith(`${key} `) || normRaw.endsWith(` ${key}`))) {
        return val.abbr;
      }
      if (normFallback && (normFallback === key || normFallback.startsWith(`${key} `) || normFallback.endsWith(` ${key}`))) {
        return val.abbr;
      }
    }
  }

  return (fallbackAbbr || rawName?.slice(0, 3) || '').toUpperCase();
}
