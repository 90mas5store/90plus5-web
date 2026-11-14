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

const EXCLUDED_FROM_NATIONALS = new Set([
  'real espana',
  'rcd espana',
  'real cd espana',
  'cd real espana',
  'real club deportivo espana',
  'sporting cristal',
  'barcelona sc',
  'universidad de chile',
  'america de cali',
]);

/**
 * Diccionario de nombres cortos para clubes (especialmente en vista móvil).
 * Convierte nombres largos oficiales (ej. "Club Deportivo Olimpia") en su versión corta ("Olimpia").
 */
const CLUB_SHORT_NAMES: Record<string, string> = {
  // Liga Nacional de Honduras & Centroamérica
  'club deportivo olimpia': 'Olimpia',
  'cd olimpia': 'Olimpia',
  'c.d. olimpia': 'Olimpia',
  'club olimpia deportivo': 'Olimpia',
  'olimpia deportivo': 'Olimpia',
  'olimpia tegucigalpa': 'Olimpia',
  'olimpia': 'Olimpia',
  'futbol club motagua': 'Motagua',
  'fc motagua': 'Motagua',
  'cd motagua': 'Motagua',
  'c.d. motagua': 'Motagua',
  'motagua': 'Motagua',
  'club deportivo marathon': 'Marathón',
  'cd marathon': 'Marathón',
  'c.d. marathon': 'Marathón',
  'marathon': 'Marathón',
  'real club deportivo espana': 'Real España',
  'real cd espana': 'Real España',
  'rcd espana': 'Real España',
  'cd real espana': 'Real España',
  'real espana': 'Real España',
  'club deportivo victoria': 'Victoria',
  'cd victoria': 'Victoria',
  'club deportivo y social vida': 'Vida',
  'cds vida': 'Vida',
  'cd vida': 'Vida',
  'club deportivo genesis': 'Génesis',
  'cd genesis': 'Génesis',
  'genesis de comayagua': 'Génesis',
  'genesis fc': 'Génesis',
  'club deportivo real sociedad': 'Real Sociedad',
  'cd real sociedad': 'Real Sociedad',
  'real sociedad de tocoa': 'Real Sociedad',
  'olancho fc': 'Olancho',
  'potros de olancho': 'Olancho',
  'juticalpa fc': 'Juticalpa',
  'cd juticalpa': 'Juticalpa',
  'lobos upnfm': 'Lobos UPNFM',
  'upnfm': 'Lobos UPNFM',
  'platense fc': 'Platense',
  'cd platense': 'Platense',
  'cd choloma': 'Choloma',
  'club deportivo choloma': 'Choloma',
  'honduras progreso': 'Honduras Progreso',
  'cd honduras progreso': 'Honduras Progreso',
  'deportivo saprissa': 'Saprissa',
  'liga deportiva alajuelense': 'Alajuelense',
  'ld alajuelense': 'Alajuelense',
  'club sport herediano': 'Herediano',
  'cs herediano': 'Herediano',
  'club sport cartagines': 'Cartaginés',
  'cs cartagines': 'Cartaginés',
  'comunicaciones fc': 'Comunicaciones',
  'csd comunicaciones': 'Comunicaciones',
  'csd municipal': 'Municipal',
  'antigua gfc': 'Antigua',
  'real esteli fc': 'Real Estelí',
  'real esteli': 'Real Estelí',
  'diriangen fc': 'Diriangén',
  'cacique diriangen': 'Diriangén',
  'alianza fc': 'Alianza',
  'cd aguila': 'Águila',
  'club deportivo aguila': 'Águila',
  'cd fas': 'FAS',
  'club deportivo fas': 'FAS',
  'tauro fc': 'Tauro',
  'plaza amador': 'Plaza Amador',
  'cd plaza amador': 'Plaza Amador',
  'sporting san miguelito': 'San Miguelito',
  'cavalry fc': 'Cavalry',
  'forge fc': 'Forge',

  // Europa & Internacionales
  'fc barcelona': 'Barcelona',
  'futbol club barcelona': 'Barcelona',
  'barcelona': 'Barcelona',
  'real madrid cf': 'Real Madrid',
  'real madrid club de futbol': 'Real Madrid',
  'real madrid': 'Real Madrid',
  'club atletico de madrid': 'Atlético Madrid',
  'atletico de madrid': 'Atlético Madrid',
  'atletico madrid': 'Atlético Madrid',
  'real betis balompie': 'Real Betis',
  'real betis': 'Real Betis',
  'athletic club': 'Athletic',
  'athletic bilbao': 'Athletic',
  'paris saint-germain': 'PSG',
  'paris saint germain': 'PSG',
  'paris sg': 'PSG',
  'manchester united': 'Man United',
  'manchester united fc': 'Man United',
  'manchester city': 'Man City',
  'manchester city fc': 'Man City',
  'bayern munich': 'Bayern',
  'fc bayern munich': 'Bayern',
  'fc bayern munchen': 'Bayern',
  'bayern munchen': 'Bayern',
  'borussia dortmund': 'Dortmund',
  'bayer leverkusen': 'Leverkusen',
  'bayer 04 leverkusen': 'Leverkusen',
  'inter miami cf': 'Inter Miami',
  'club internacional de futbol miami': 'Inter Miami',
  'inter miami': 'Inter Miami',
  'chelsea fc': 'Chelsea',
  'arsenal fc': 'Arsenal',
  'liverpool fc': 'Liverpool',
  'tottenham hotspur': 'Tottenham',
  'tottenham hotspur fc': 'Tottenham',
  'newcastle united': 'Newcastle',
  'aston villa': 'Aston Villa',
  'juventus fc': 'Juventus',
  'ac milan': 'Milan',
  'a.c. milan': 'Milan',
  'inter milan': 'Inter',
  'fc internazionale milano': 'Inter',
  'internazionale': 'Inter',
  'ssc napoli': 'Napoli',
  'as roma': 'Roma',
  'ss lazio': 'Lazio',
  'sl benfica': 'Benfica',
  'fc porto': 'Porto',
  'sporting cp': 'Sporting CP',
  'sporting lisbon': 'Sporting CP',
  'ca boca juniors': 'Boca Juniors',
  'club atletico boca juniors': 'Boca Juniors',
  'boca juniors': 'Boca Juniors',
  'ca river plate': 'River Plate',
  'club atletico river plate': 'River Plate',
  'river plate': 'River Plate',
  'racing club de avellaneda': 'Racing',
  'ca independiente': 'Independiente',
  'san lorenzo de almagro': 'San Lorenzo',
  'cr flamengo': 'Flamengo',
  'se palmeiras': 'Palmeiras',
  'sc corinthians': 'Corinthians',
  'sao paulo fc': 'São Paulo',
  'club america': 'América',
  'cf america': 'América',
  'chivas guadalajara': 'Chivas',
  'cd guadalajara': 'Chivas',
  'cruz azul': 'Cruz Azul',
  'tigres uanl': 'Tigres',
  'cf monterrey': 'Monterrey',
  'rayados de monterrey': 'Monterrey',
  'pumas unam': 'Pumas',
  'al nassr fc': 'Al Nassr',
  'al-nassr': 'Al Nassr',
  'al hilal sfc': 'Al Hilal',
  'al-hilal': 'Al Hilal',
  'al ittihad': 'Al Ittihad',
};

/**
 * Acorta el nombre de un club eliminando prefijos institucionales largos
 * (ej. "Club Deportivo Olimpia" -> "Olimpia", "Fútbol Club Motagua" -> "Motagua").
 */
export function shortenClubName(rawName?: string | null): string {
  if (!rawName) return '';
  const clean = rawName.trim();
  if (!clean) return '';

  const norm = normalizeForLookup(clean);
  if (CLUB_SHORT_NAMES[norm]) {
    return CLUB_SHORT_NAMES[norm];
  }

  let shortened = clean;

  // Caso especial: "Real Club Deportivo X" / "Real CD X" / "RCD X" -> "Real X"
  if (/^(?:real\s+club\s+deportivo|real\s+c\.?d\.?|r\.?c\.?d\.?)\s+/i.test(shortened)) {
    shortened = shortened.replace(/^(?:real\s+club\s+deportivo|real\s+c\.?d\.?|r\.?c\.?d\.?)\s+/i, 'Real ');
  } else {
    // Eliminar prefijos institucionales largos
    shortened = shortened.replace(
      /^(?:club\s+deportivo\s+y\s+social|club\s+social\s+y\s+deportivo|club\s+deportivo|club\s+atl[eé]tico|club\s+olimpia|club\s+sport|f[uú]tbol\s+club|liga\s+deportiva|asociaci[oó]n\s+deportiva|sociedad\s+deportiva|uni[oó]n\s+deportiva|deportivo)\s+/i,
      ''
    );

    // Eliminar siglas de prefijo comunes (CD, FC, CF, CA, CSD, etc.)
    shortened = shortened.replace(
      /^(?:c\.?d\.?s\.?|c\.?s\.?d\.?|c\.?d\.?|f\.?c\.?|c\.?f\.?|c\.?a\.?|c\.?s\.?|a\.?d\.?|s\.?d\.?|u\.?d\.?|s\.?c\.?|a\.?c\.?|s\.?l\.?|c\.?r\.?|s\.?e\.?|l\.?d\.?)\s+/i,
      ''
    );

    // Si aún inicia con "Club " y tiene más palabras (ej. "Club América" -> "América")
    if (/^club\s+\S+/i.test(shortened)) {
      shortened = shortened.replace(/^club\s+/i, '');
    }
  }

  // Eliminar sufijos institucionales (FC, CF, SC, Deportivo, etc.)
  shortened = shortened.replace(
    /\s+(?:f\.?c\.?|c\.?f\.?|s\.?c\.?|a\.?c\.?|c\.?d\.?|s\.?a\.?d\.?|s\.?f\.?c\.?|g\.?f\.?c\.?|deportivo)$/i,
    ''
  );

  shortened = shortened.trim();

  // Verificar nuevamente en el diccionario tras limpiar prefijos/sufijos
  const normAfter = normalizeForLookup(shortened);
  if (CLUB_SHORT_NAMES[normAfter]) {
    return CLUB_SHORT_NAMES[normAfter];
  }

  return shortened || clean;
}

const CLUB_PREFIXES = [
  'real ', 'club ', 'deportivo ', 'atletico ', 'atlético ', 'sporting ',
  'racing ', 'cd ', 'cf ', 'fc ', 'ca ', 'sc ', 'csd ', 'rcd ', 'ad ',
];

const NATIONAL_TEAM_QUALIFIERS = new Set([
  'team', 'national team', 'national', 'nt', 'seleccion', 'selección',
  'u20', 'u23', 'u21', 'u19', 'u17', 'men', 'women', 'femenino', 'masculino',
]);

function isFuzzyNationalMatch(norm: string, key: string): boolean {
  if (norm === key) return true;
  // Nunca aplicar fuzzy match de selección si el nombre comienza con prefijos de club
  if (CLUB_PREFIXES.some(p => norm.startsWith(p))) return false;

  if (norm.startsWith(`${key} `)) {
    const rest = norm.slice(key.length + 1).trim();
    if (NATIONAL_TEAM_QUALIFIERS.has(rest)) return true;
  }

  if (norm.endsWith(` ${key}`)) {
    const prefix = norm.slice(0, norm.length - key.length - 1).trim();
    if (NATIONAL_TEAM_QUALIFIERS.has(prefix)) return true;
  }

  return false;
}

/**
 * Traduce el nombre completo de una selección nacional al español.
 * Si no es una selección en el diccionario o si es un club conocido (ej. Real España), retorna el nombre original intacto.
 */
export function translateTeamNameToSpanish(rawName?: string | null): string {
  if (!rawName) return '';
  const clean = rawName.trim();
  const norm = normalizeForLookup(clean);

  if (EXCLUDED_FROM_NATIONALS.has(norm) || norm.includes('real espana')) {
    return clean;
  }

  if (NATIONAL_TEAMS_ES[norm]) {
    // Si coincide exactamente pero es un club con prefijo, verificar
    if (!CLUB_PREFIXES.some(p => norm.startsWith(p))) {
      return NATIONAL_TEAMS_ES[norm].name;
    }
  }

  // Búsqueda por subcadena solo para variantes legítimas de selecciones ("Spain NT", "Team Spain", etc.)
  for (const [key, val] of Object.entries(NATIONAL_TEAMS_ES)) {
    if (isFuzzyNationalMatch(norm, key)) {
      return val.name;
    }
  }

  return clean;
}

/**
 * Traduce el nombre corto de una selección al español o acorta el nombre de un club
 * (ej. "Club Deportivo Olimpia" -> "Olimpia").
 */
export function translateTeamShortName(rawName?: string | null, fallbackShort?: string | null): string {
  if (!rawName && !fallbackShort) return '';

  const normRaw = normalizeForLookup(rawName || '');
  const normFallback = normalizeForLookup(fallbackShort || '');

  if (normRaw && CLUB_SHORT_NAMES[normRaw]) {
    return CLUB_SHORT_NAMES[normRaw];
  }
  if (normFallback && CLUB_SHORT_NAMES[normFallback]) {
    return CLUB_SHORT_NAMES[normFallback];
  }

  if (normRaw && (EXCLUDED_FROM_NATIONALS.has(normRaw) || normRaw.includes('real espana'))) {
    return shortenClubName(rawName || fallbackShort);
  }

  if (normRaw && NATIONAL_TEAMS_ES[normRaw] && !CLUB_PREFIXES.some(p => normRaw.startsWith(p))) {
    return NATIONAL_TEAMS_ES[normRaw].shortName;
  }

  if (normFallback && (EXCLUDED_FROM_NATIONALS.has(normFallback) || normFallback.includes('real espana'))) {
    return shortenClubName(fallbackShort || rawName);
  }

  if (normFallback && NATIONAL_TEAMS_ES[normFallback] && !CLUB_PREFIXES.some(p => normFallback.startsWith(p))) {
    return NATIONAL_TEAMS_ES[normFallback].shortName;
  }

  for (const [key, val] of Object.entries(NATIONAL_TEAMS_ES)) {
    if (normRaw && isFuzzyNationalMatch(normRaw, key)) {
      return val.shortName;
    }
    if (normFallback && isFuzzyNationalMatch(normFallback, key)) {
      return val.shortName;
    }
  }

  const shortRaw = rawName ? shortenClubName(rawName) : '';
  const shortFallback = fallbackShort ? shortenClubName(translateTeamNameToSpanish(fallbackShort)) : '';

  if (shortRaw && shortFallback) {
    return shortFallback.length <= shortRaw.length ? shortFallback : shortRaw;
  }

  return shortFallback || shortRaw || rawName || fallbackShort || '';
}

/**
 * Traduce o genera la abreviatura de 3 letras en español para selecciones.
 */
export function translateTeamAbbr(rawName?: string | null, fallbackAbbr?: string | null): string {
  if (!rawName && !fallbackAbbr) return '';

  const normRaw = normalizeForLookup(rawName || '');
  if (normRaw && (EXCLUDED_FROM_NATIONALS.has(normRaw) || normRaw.includes('real espana'))) {
    return (fallbackAbbr || rawName?.slice(0, 3) || '').toUpperCase();
  }

  if (normRaw && NATIONAL_TEAMS_ES[normRaw]?.abbr && !CLUB_PREFIXES.some(p => normRaw.startsWith(p))) {
    return NATIONAL_TEAMS_ES[normRaw].abbr;
  }

  const normFallback = normalizeForLookup(fallbackAbbr || '');
  if (normFallback && (EXCLUDED_FROM_NATIONALS.has(normFallback) || normFallback.includes('real espana'))) {
    return (fallbackAbbr || rawName?.slice(0, 3) || '').toUpperCase();
  }

  if (normFallback && NATIONAL_TEAMS_ES[normFallback]?.abbr && !CLUB_PREFIXES.some(p => normFallback.startsWith(p))) {
    return NATIONAL_TEAMS_ES[normFallback].abbr;
  }

  for (const [key, val] of Object.entries(NATIONAL_TEAMS_ES)) {
    if (val.abbr) {
      if (normRaw && isFuzzyNationalMatch(normRaw, key)) {
        return val.abbr;
      }
      if (normFallback && isFuzzyNationalMatch(normFallback, key)) {
        return val.abbr;
      }
    }
  }

  return (fallbackAbbr || rawName?.slice(0, 3) || '').toUpperCase();
}
