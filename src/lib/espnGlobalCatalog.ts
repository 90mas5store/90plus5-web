import type { LeagueDefinition } from './matchdayLeagues';

/**
 * Catálogo Mundial Completo de ESPN Scoreboard API (219 Ligas y Torneos)
 * Obtenido directamente del directorio de ESPN.
 * Incluye traducción de países al español, banderas y palabras clave multilingües.
 */
export const ESPN_GLOBAL_LEAGUES_CATALOG: LeagueDefinition[] = [
  {
    "slug": "fifa.world",
    "name": "FIFA World Cup",
    "category": "Selecciones & FIFA",
    "country": "FIFA / Internacional",
    "flag": "🌍",
    "keywords": [
      "fifa",
      "mundial",
      "world cup",
      "eliminatorias",
      "selecciones",
      "fifa.world",
      "fifa world cup"
    ]
  },
  {
    "slug": "fifa.wwc",
    "name": "FIFA Women's World Cup",
    "category": "Selecciones & FIFA",
    "country": "FIFA / Internacional",
    "flag": "🌍",
    "keywords": [
      "fifa",
      "mundial",
      "world cup",
      "eliminatorias",
      "selecciones",
      "fifa.wwc",
      "fifa women's world cup"
    ]
  },
  {
    "slug": "uefa.champions",
    "name": "UEFA Champions League",
    "category": "Torneos Continentales",
    "country": "UEFA / Europa",
    "flag": "🇪🇺",
    "keywords": [
      "uefa",
      "europa",
      "europe",
      "champions league",
      "eurocopa",
      "nations league",
      "uefa.champions",
      "uefa champions league"
    ]
  },
  {
    "slug": "eng.1",
    "name": "English Premier League",
    "category": "Ligas Principales",
    "country": "Inglaterra",
    "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "keywords": [
      "inglaterra",
      "england",
      "premier league",
      "fa cup",
      "arsenal",
      "chelsea",
      "liverpool",
      "manchester",
      "eng.1",
      "english premier league"
    ]
  },
  {
    "slug": "eng.fa",
    "name": "English FA Cup",
    "category": "Ligas Principales",
    "country": "Inglaterra",
    "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "keywords": [
      "inglaterra",
      "england",
      "premier league",
      "fa cup",
      "arsenal",
      "chelsea",
      "liverpool",
      "manchester",
      "eng.fa",
      "english fa cup"
    ]
  },
  {
    "slug": "eng.league_cup",
    "name": "English Carabao Cup",
    "category": "Copas Nacionales",
    "country": "Inglaterra",
    "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "keywords": [
      "inglaterra",
      "england",
      "premier league",
      "fa cup",
      "arsenal",
      "chelsea",
      "liverpool",
      "manchester",
      "eng.league_cup",
      "english carabao cup",
      "carabao cup"
    ]
  },
  {
    "slug": "esp.1",
    "name": "Spanish LALIGA",
    "category": "Ligas Principales",
    "country": "España",
    "flag": "🇪🇸",
    "keywords": [
      "españa",
      "espana",
      "spain",
      "laliga",
      "copa del rey",
      "real madrid",
      "barcelona",
      "atletico",
      "esp.1",
      "spanish laliga"
    ]
  },
  {
    "slug": "eng.charity",
    "name": "English FA Community Shield",
    "category": "Ligas Principales",
    "country": "Inglaterra",
    "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "keywords": [
      "inglaterra",
      "england",
      "premier league",
      "fa cup",
      "arsenal",
      "chelsea",
      "liverpool",
      "manchester",
      "eng.charity",
      "english fa community shield",
      "community shield"
    ]
  },
  {
    "slug": "uefa.nations",
    "name": "UEFA Nations League",
    "category": "Torneos Continentales",
    "country": "UEFA / Europa",
    "flag": "🇪🇺",
    "keywords": [
      "uefa",
      "europa",
      "europe",
      "champions league",
      "eurocopa",
      "nations league",
      "uefa.nations",
      "uefa nations league"
    ]
  },
  {
    "slug": "fifa.friendly",
    "name": "International Friendly",
    "category": "Selecciones & FIFA",
    "country": "FIFA / Internacional",
    "flag": "🌍",
    "keywords": [
      "fifa",
      "mundial",
      "world cup",
      "eliminatorias",
      "selecciones",
      "fifa.friendly",
      "international friendly",
      "men's international friendly"
    ]
  },
  {
    "slug": "usa.1",
    "name": "MLS",
    "category": "Ligas Principales",
    "country": "Estados Unidos",
    "flag": "🇺🇸",
    "keywords": [
      "estados unidos",
      "usa",
      "mls",
      "inter miami",
      "messi",
      "nwsl",
      "usa.1"
    ]
  },
  {
    "slug": "usa.nwsl",
    "name": "NWSL",
    "category": "Ligas Principales",
    "country": "Estados Unidos",
    "flag": "🇺🇸",
    "keywords": [
      "estados unidos",
      "usa",
      "mls",
      "inter miami",
      "messi",
      "nwsl",
      "usa.nwsl"
    ]
  },
  {
    "slug": "esp.super_cup",
    "name": "Spanish Supercopa",
    "category": "Copas Nacionales",
    "country": "España",
    "flag": "🇪🇸",
    "keywords": [
      "españa",
      "espana",
      "spain",
      "laliga",
      "copa del rey",
      "real madrid",
      "barcelona",
      "atletico",
      "esp.super_cup",
      "spanish supercopa"
    ]
  },
  {
    "slug": "esp.copa_del_rey",
    "name": "Spanish Copa del Rey",
    "category": "Copas Nacionales",
    "country": "España",
    "flag": "🇪🇸",
    "keywords": [
      "españa",
      "espana",
      "spain",
      "laliga",
      "copa del rey",
      "real madrid",
      "barcelona",
      "atletico",
      "esp.copa_del_rey",
      "spanish copa del rey"
    ]
  },
  {
    "slug": "concacaf.leagues.cup",
    "name": "Leagues Cup",
    "category": "Torneos Continentales",
    "country": "CONCACAF / Norte-Centroamérica",
    "flag": "🏆",
    "keywords": [
      "concacaf",
      "norteamerica",
      "centroamerica",
      "copa oro",
      "champions cup",
      "concacaf.leagues.cup",
      "leagues cup"
    ]
  },
  {
    "slug": "campeones.cup",
    "name": "Campeones Cup",
    "category": "Torneos Continentales",
    "country": "Norteamérica (MLS vs Liga MX)",
    "flag": "🏆",
    "keywords": [
      "campeones cup",
      "mexico",
      "usa",
      "campeones.cup"
    ]
  },
  {
    "slug": "usa.nwsl.cup",
    "name": "NWSL Challenge Cup",
    "category": "Copas Nacionales",
    "country": "Estados Unidos",
    "flag": "🇺🇸",
    "keywords": [
      "estados unidos",
      "usa",
      "mls",
      "inter miami",
      "messi",
      "nwsl",
      "usa.nwsl.cup",
      "nwsl challenge cup"
    ]
  },
  {
    "slug": "fifa.shebelieves",
    "name": "SheBelieves Cup",
    "category": "Selecciones & FIFA",
    "country": "FIFA / Internacional",
    "flag": "🌍",
    "keywords": [
      "fifa",
      "mundial",
      "world cup",
      "eliminatorias",
      "selecciones",
      "fifa.shebelieves",
      "shebelieves cup"
    ]
  },
  {
    "slug": "fifa.w.champions_cup",
    "name": "FIFA Women's Champions Cup",
    "category": "Selecciones & FIFA",
    "country": "FIFA / Internacional",
    "flag": "🌍",
    "keywords": [
      "fifa",
      "mundial",
      "world cup",
      "eliminatorias",
      "selecciones",
      "fifa.w.champions_cup",
      "fifa women's champions cup",
      "women's champions cup"
    ]
  },
  {
    "slug": "uefa.wchampions",
    "name": "UEFA Women's Champions League",
    "category": "Torneos Continentales",
    "country": "UEFA / Europa",
    "flag": "🇪🇺",
    "keywords": [
      "uefa",
      "europa",
      "europe",
      "champions league",
      "eurocopa",
      "nations league",
      "uefa.wchampions",
      "uefa women's champions league"
    ]
  },
  {
    "slug": "uefa.europa",
    "name": "UEFA Europa League",
    "category": "Torneos Continentales",
    "country": "UEFA / Europa",
    "flag": "🇪🇺",
    "keywords": [
      "uefa",
      "europa",
      "europe",
      "champions league",
      "eurocopa",
      "nations league",
      "uefa.europa",
      "uefa europa league"
    ]
  },
  {
    "slug": "uefa.europa.conf",
    "name": "UEFA Conference League",
    "category": "Torneos Continentales",
    "country": "UEFA / Europa",
    "flag": "🇪🇺",
    "keywords": [
      "uefa",
      "europa",
      "europe",
      "champions league",
      "eurocopa",
      "nations league",
      "uefa.europa.conf",
      "uefa conference league"
    ]
  },
  {
    "slug": "mex.1",
    "name": "Mexican Liga BBVA MX",
    "category": "Ligas Principales",
    "country": "México",
    "flag": "🇲🇽",
    "keywords": [
      "mexico",
      "mexicano",
      "liga mx",
      "america",
      "chivas",
      "cruz azul",
      "tigres",
      "monterrey",
      "mex.1",
      "mexican liga bbva mx"
    ]
  },
  {
    "slug": "ger.1",
    "name": "German Bundesliga",
    "category": "Ligas Principales",
    "country": "Alemania",
    "flag": "🇩🇪",
    "keywords": [
      "alemania",
      "germany",
      "bundesliga",
      "bayern",
      "dortmund",
      "ger.1",
      "german bundesliga"
    ]
  },
  {
    "slug": "ger.playoff.relegation",
    "name": "German Bundesliga Promotion/Relegation Playoff",
    "category": "Ligas Principales",
    "country": "Alemania",
    "flag": "🇩🇪",
    "keywords": [
      "alemania",
      "germany",
      "bundesliga",
      "bayern",
      "dortmund",
      "ger.playoff.relegation",
      "german bundesliga promotion/relegation playoff",
      "bundesliga pro/rel"
    ]
  },
  {
    "slug": "ger.dfb_pokal",
    "name": "German Cup",
    "category": "Copas Nacionales",
    "country": "Alemania",
    "flag": "🇩🇪",
    "keywords": [
      "alemania",
      "germany",
      "bundesliga",
      "bayern",
      "dortmund",
      "ger.dfb_pokal",
      "german cup"
    ]
  },
  {
    "slug": "ita.1",
    "name": "Italian Serie A",
    "category": "Ligas Principales",
    "country": "Italia",
    "flag": "🇮🇹",
    "keywords": [
      "italia",
      "italy",
      "serie a",
      "juventus",
      "milan",
      "inter",
      "ita.1",
      "italian serie a"
    ]
  },
  {
    "slug": "ita.coppa_italia",
    "name": "Coppa Italia",
    "category": "Ligas Principales",
    "country": "Italia",
    "flag": "🇮🇹",
    "keywords": [
      "italia",
      "italy",
      "serie a",
      "juventus",
      "milan",
      "inter",
      "ita.coppa_italia",
      "coppa italia"
    ]
  },
  {
    "slug": "fra.1",
    "name": "French Ligue 1",
    "category": "Ligas Principales",
    "country": "Francia",
    "flag": "🇫🇷",
    "keywords": [
      "francia",
      "france",
      "ligue 1",
      "psg",
      "paris",
      "marseille",
      "fra.1",
      "french ligue 1"
    ]
  },
  {
    "slug": "fra.super_cup",
    "name": "French Trophee des Champions",
    "category": "Copas Nacionales",
    "country": "Francia",
    "flag": "🇫🇷",
    "keywords": [
      "francia",
      "france",
      "ligue 1",
      "psg",
      "paris",
      "marseille",
      "fra.super_cup",
      "french trophee des champions",
      "trophee des champions"
    ]
  },
  {
    "slug": "ita.super_cup",
    "name": "Italian Supercoppa",
    "category": "Copas Nacionales",
    "country": "Italia",
    "flag": "🇮🇹",
    "keywords": [
      "italia",
      "italy",
      "serie a",
      "juventus",
      "milan",
      "inter",
      "ita.super_cup",
      "italian supercoppa"
    ]
  },
  {
    "slug": "ger.super_cup",
    "name": "German Supercup",
    "category": "Copas Nacionales",
    "country": "Alemania",
    "flag": "🇩🇪",
    "keywords": [
      "alemania",
      "germany",
      "bundesliga",
      "bayern",
      "dortmund",
      "ger.super_cup",
      "german supercup"
    ]
  },
  {
    "slug": "eng.w.1",
    "name": "English Women's Super League",
    "category": "Ligas Principales",
    "country": "Inglaterra",
    "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "keywords": [
      "inglaterra",
      "england",
      "premier league",
      "fa cup",
      "arsenal",
      "chelsea",
      "liverpool",
      "manchester",
      "eng.w.1",
      "english women's super league",
      "women's super league"
    ]
  },
  {
    "slug": "eng.2",
    "name": "English League Championship",
    "category": "Ligas Principales",
    "country": "Inglaterra",
    "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "keywords": [
      "inglaterra",
      "england",
      "premier league",
      "fa cup",
      "arsenal",
      "chelsea",
      "liverpool",
      "manchester",
      "eng.2",
      "english league championship",
      "efl championship"
    ]
  },
  {
    "slug": "eng.w.promotion.relegation",
    "name": "English Women's Super League Promotion/Relegation Playoff",
    "category": "Ligas Principales",
    "country": "Inglaterra",
    "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "keywords": [
      "inglaterra",
      "england",
      "premier league",
      "fa cup",
      "arsenal",
      "chelsea",
      "liverpool",
      "manchester",
      "eng.w.promotion.relegation",
      "english women's super league promotion/relegation playoff",
      "women's super league pro/rel"
    ]
  },
  {
    "slug": "ned.1",
    "name": "Dutch Eredivisie",
    "category": "Ligas Principales",
    "country": "Países Bajos",
    "flag": "🇳🇱",
    "keywords": [
      "paises bajos",
      "holanda",
      "dutch",
      "eredivisie",
      "ajax",
      "psv",
      "feyenoord",
      "ned.1",
      "dutch eredivisie"
    ]
  },
  {
    "slug": "por.1",
    "name": "Portuguese Primeira Liga",
    "category": "Ligas Principales",
    "country": "Portugal",
    "flag": "🇵🇹",
    "keywords": [
      "portugal",
      "portugues",
      "primeira liga",
      "benfica",
      "porto",
      "sporting",
      "por.1",
      "portuguese primeira liga",
      "liga portugal"
    ]
  },
  {
    "slug": "fra.coupe_de_france",
    "name": "Coupe de France",
    "category": "Ligas Principales",
    "country": "Francia",
    "flag": "🇫🇷",
    "keywords": [
      "francia",
      "france",
      "ligue 1",
      "psg",
      "paris",
      "marseille",
      "fra.coupe_de_france",
      "coupe de france"
    ]
  },
  {
    "slug": "usa.open",
    "name": "U.S. Open Cup",
    "category": "Ligas Principales",
    "country": "Estados Unidos",
    "flag": "🇺🇸",
    "keywords": [
      "estados unidos",
      "usa",
      "mls",
      "inter miami",
      "messi",
      "nwsl",
      "usa.open",
      "u.s. open cup"
    ]
  },
  {
    "slug": "ksa.1",
    "name": "Saudi Pro League",
    "category": "Ligas Principales",
    "country": "Arabia Saudita",
    "flag": "🇸🇦",
    "keywords": [
      "arabia saudita",
      "arabia",
      "saudi",
      "al nassr",
      "al hilal",
      "al ittihad",
      "cristiano ronaldo",
      "ksa.1",
      "saudi pro league"
    ]
  },
  {
    "slug": "concacaf.nations.league",
    "name": "Concacaf Nations League",
    "category": "Torneos Continentales",
    "country": "CONCACAF / Norte-Centroamérica",
    "flag": "🏆",
    "keywords": [
      "concacaf",
      "norteamerica",
      "centroamerica",
      "copa oro",
      "champions cup",
      "concacaf.nations.league",
      "concacaf nations league"
    ]
  },
  {
    "slug": "conmebol.libertadores",
    "name": "CONMEBOL Libertadores",
    "category": "Torneos Continentales",
    "country": "CONMEBOL / Sudamérica",
    "flag": "🌎",
    "keywords": [
      "conmebol",
      "sudamerica",
      "copa libertadores",
      "copa sudamericana",
      "copa america",
      "conmebol.libertadores",
      "conmebol libertadores"
    ]
  },
  {
    "slug": "concacaf.champions",
    "name": "Concacaf Champions Cup",
    "category": "Torneos Continentales",
    "country": "CONCACAF / Norte-Centroamérica",
    "flag": "🏆",
    "keywords": [
      "concacaf",
      "norteamerica",
      "centroamerica",
      "copa oro",
      "champions cup",
      "concacaf.champions",
      "concacaf champions cup"
    ]
  },
  {
    "slug": "fifa.worldq.uefa",
    "name": "FIFA World Cup Qualifying - UEFA",
    "category": "Selecciones & FIFA",
    "country": "FIFA / Internacional",
    "flag": "🌍",
    "keywords": [
      "fifa",
      "mundial",
      "world cup",
      "eliminatorias",
      "selecciones",
      "fifa.worldq.uefa",
      "fifa world cup qualifying - uefa",
      "wcq - uefa"
    ]
  },
  {
    "slug": "fifa.wcq.ply",
    "name": "FIFA World Cup Qualifying - Playoff Tournament",
    "category": "Selecciones & FIFA",
    "country": "FIFA / Internacional",
    "flag": "🌍",
    "keywords": [
      "fifa",
      "mundial",
      "world cup",
      "eliminatorias",
      "selecciones",
      "fifa.wcq.ply",
      "fifa world cup qualifying - playoff tournament",
      "wcq - playoff tournament"
    ]
  },
  {
    "slug": "fifa.worldq.concacaf",
    "name": "FIFA World Cup Qualifying - Concacaf",
    "category": "Selecciones & FIFA",
    "country": "FIFA / Internacional",
    "flag": "🌍",
    "keywords": [
      "fifa",
      "mundial",
      "world cup",
      "eliminatorias",
      "selecciones",
      "fifa.worldq.concacaf",
      "fifa world cup qualifying - concacaf",
      "wcq - concacaf"
    ]
  },
  {
    "slug": "fifa.worldq.afc",
    "name": "FIFA World Cup Qualifying - AFC",
    "category": "Selecciones & FIFA",
    "country": "FIFA / Internacional",
    "flag": "🌍",
    "keywords": [
      "fifa",
      "mundial",
      "world cup",
      "eliminatorias",
      "selecciones",
      "fifa.worldq.afc",
      "fifa world cup qualifying - afc",
      "wcq - afc"
    ]
  },
  {
    "slug": "fifa.worldq.caf",
    "name": "FIFA World Cup Qualifying - CAF",
    "category": "Selecciones & FIFA",
    "country": "FIFA / Internacional",
    "flag": "🌍",
    "keywords": [
      "fifa",
      "mundial",
      "world cup",
      "eliminatorias",
      "selecciones",
      "fifa.worldq.caf",
      "fifa world cup qualifying - caf",
      "wcq - caf"
    ]
  },
  {
    "slug": "fifa.worldq.conmebol",
    "name": "FIFA World Cup Qualifying - CONMEBOL",
    "category": "Selecciones & FIFA",
    "country": "FIFA / Internacional",
    "flag": "🌍",
    "keywords": [
      "fifa",
      "mundial",
      "world cup",
      "eliminatorias",
      "selecciones",
      "fifa.worldq.conmebol",
      "fifa world cup qualifying - conmebol",
      "wcq - conmebol"
    ]
  },
  {
    "slug": "fifa.worldq.ofc",
    "name": "FIFA World Cup Qualifying - OFC",
    "category": "Selecciones & FIFA",
    "country": "FIFA / Internacional",
    "flag": "🌍",
    "keywords": [
      "fifa",
      "mundial",
      "world cup",
      "eliminatorias",
      "selecciones",
      "fifa.worldq.ofc",
      "fifa world cup qualifying - ofc",
      "wcq - ofc"
    ]
  },
  {
    "slug": "fifa.friendly.w",
    "name": "Women's International Friendly",
    "category": "Selecciones & FIFA",
    "country": "FIFA / Internacional",
    "flag": "🌍",
    "keywords": [
      "fifa",
      "mundial",
      "world cup",
      "eliminatorias",
      "selecciones",
      "fifa.friendly.w",
      "women's international friendly"
    ]
  },
  {
    "slug": "fifa.wworldq.uefa",
    "name": "FIFA Women's World Cup Qualifying - UEFA",
    "category": "Selecciones & FIFA",
    "country": "FIFA / Internacional",
    "flag": "🌍",
    "keywords": [
      "fifa",
      "mundial",
      "world cup",
      "eliminatorias",
      "selecciones",
      "fifa.wworldq.uefa",
      "fifa women's world cup qualifying - uefa",
      "wwcq - uefa"
    ]
  },
  {
    "slug": "fifa.wwcq.ply",
    "name": "FIFA Women's World Cup Qualifying - Playoff Tournament",
    "category": "Selecciones & FIFA",
    "country": "FIFA / Internacional",
    "flag": "🌍",
    "keywords": [
      "fifa",
      "mundial",
      "world cup",
      "eliminatorias",
      "selecciones",
      "fifa.wwcq.ply",
      "fifa women's world cup qualifying - playoff tournament",
      "wwcq - playoff tournament"
    ]
  },
  {
    "slug": "uefa.w.nations",
    "name": "UEFA Women's Nations League",
    "category": "Torneos Continentales",
    "country": "UEFA / Europa",
    "flag": "🇪🇺",
    "keywords": [
      "uefa",
      "europa",
      "europe",
      "champions league",
      "eurocopa",
      "nations league",
      "uefa.w.nations",
      "uefa women's nations league",
      "women's nations league"
    ]
  },
  {
    "slug": "usa.w.usl.1",
    "name": "USL Super League",
    "category": "Ligas Principales",
    "country": "Estados Unidos",
    "flag": "🇺🇸",
    "keywords": [
      "estados unidos",
      "usa",
      "mls",
      "inter miami",
      "messi",
      "nwsl",
      "usa.w.usl.1",
      "usl super league"
    ]
  },
  {
    "slug": "uefa.champions_qual",
    "name": "UEFA Champions League Qualifying",
    "category": "Torneos Continentales",
    "country": "UEFA / Europa",
    "flag": "🇪🇺",
    "keywords": [
      "uefa",
      "europa",
      "europe",
      "champions league",
      "eurocopa",
      "nations league",
      "uefa.champions_qual",
      "uefa champions league qualifying",
      "ucl qualifying"
    ]
  },
  {
    "slug": "uefa.wchampions_qual",
    "name": "UEFA Women's Champions League Qualifying",
    "category": "Torneos Continentales",
    "country": "UEFA / Europa",
    "flag": "🇪🇺",
    "keywords": [
      "uefa",
      "europa",
      "europe",
      "champions league",
      "eurocopa",
      "nations league",
      "uefa.wchampions_qual",
      "uefa women's champions league qualifying"
    ]
  },
  {
    "slug": "eng.w.fa",
    "name": "English Women's FA Cup",
    "category": "Ligas Principales",
    "country": "Inglaterra",
    "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "keywords": [
      "inglaterra",
      "england",
      "premier league",
      "fa cup",
      "arsenal",
      "chelsea",
      "liverpool",
      "manchester",
      "eng.w.fa",
      "english women's fa cup",
      "women's fa cup"
    ]
  },
  {
    "slug": "eng.w.league_cup",
    "name": "English WSL Players Cup",
    "category": "Copas Nacionales",
    "country": "Inglaterra",
    "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "keywords": [
      "inglaterra",
      "england",
      "premier league",
      "fa cup",
      "arsenal",
      "chelsea",
      "liverpool",
      "manchester",
      "eng.w.league_cup",
      "english wsl players cup",
      "wsl players cup"
    ]
  },
  {
    "slug": "esp.w.1",
    "name": "Spanish Liga F",
    "category": "Ligas Principales",
    "country": "España",
    "flag": "🇪🇸",
    "keywords": [
      "españa",
      "espana",
      "spain",
      "laliga",
      "copa del rey",
      "real madrid",
      "barcelona",
      "atletico",
      "esp.w.1",
      "spanish liga f",
      "liga f"
    ]
  },
  {
    "slug": "esp.copa_de_la_reina",
    "name": "Spanish Copa de la Reina",
    "category": "Copas Nacionales",
    "country": "España",
    "flag": "🇪🇸",
    "keywords": [
      "españa",
      "espana",
      "spain",
      "laliga",
      "copa del rey",
      "real madrid",
      "barcelona",
      "atletico",
      "esp.copa_de_la_reina",
      "spanish copa de la reina",
      "copa de la reina"
    ]
  },
  {
    "slug": "fra.w.1",
    "name": "French Première Ligue",
    "category": "Ligas Principales",
    "country": "Francia",
    "flag": "🇫🇷",
    "keywords": [
      "francia",
      "france",
      "ligue 1",
      "psg",
      "paris",
      "marseille",
      "fra.w.1",
      "french première ligue",
      "première ligue"
    ]
  },
  {
    "slug": "ned.cup",
    "name": "Dutch KNVB Beker",
    "category": "Copas Nacionales",
    "country": "Países Bajos",
    "flag": "🇳🇱",
    "keywords": [
      "paises bajos",
      "holanda",
      "dutch",
      "eredivisie",
      "ajax",
      "psv",
      "feyenoord",
      "ned.cup",
      "dutch knvb beker",
      "knvb beker"
    ]
  },
  {
    "slug": "sco.1",
    "name": "Scottish Premiership",
    "category": "Ligas Principales",
    "country": "Escocia",
    "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "keywords": [
      "escocia",
      "scotland",
      "celtic",
      "rangers",
      "sco.1",
      "scottish premiership",
      "spfl premiership"
    ]
  },
  {
    "slug": "sco.tennents",
    "name": "Scottish Cup",
    "category": "Ligas Principales",
    "country": "Escocia",
    "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "keywords": [
      "escocia",
      "scotland",
      "celtic",
      "rangers",
      "sco.tennents",
      "scottish cup"
    ]
  },
  {
    "slug": "sco.cis",
    "name": "Scottish League Cup",
    "category": "Ligas Principales",
    "country": "Escocia",
    "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "keywords": [
      "escocia",
      "scotland",
      "celtic",
      "rangers",
      "sco.cis",
      "scottish league cup"
    ]
  },
  {
    "slug": "aus.1",
    "name": "Australian A-League Men",
    "category": "Ligas Principales",
    "country": "Australia",
    "flag": "🇦🇺",
    "keywords": [
      "australia",
      "a-league",
      "socceroos",
      "aus.1",
      "australian a-league men",
      "a-league men"
    ]
  },
  {
    "slug": "aus.w.1",
    "name": "Australian A-League Women",
    "category": "Ligas Principales",
    "country": "Australia",
    "flag": "🇦🇺",
    "keywords": [
      "australia",
      "a-league",
      "socceroos",
      "aus.w.1",
      "australian a-league women",
      "a-league women"
    ]
  },
  {
    "slug": "ksa.kings.cup",
    "name": "Saudi King's Cup",
    "category": "Copas Nacionales",
    "country": "Arabia Saudita",
    "flag": "🇸🇦",
    "keywords": [
      "arabia saudita",
      "arabia",
      "saudi",
      "al nassr",
      "al hilal",
      "al ittihad",
      "cristiano ronaldo",
      "ksa.kings.cup",
      "saudi king's cup"
    ]
  },
  {
    "slug": "por.taca.portugal",
    "name": "Taca de Portugal",
    "category": "Ligas Principales",
    "country": "Portugal",
    "flag": "🇵🇹",
    "keywords": [
      "portugal",
      "portugues",
      "primeira liga",
      "benfica",
      "porto",
      "sporting",
      "por.taca.portugal",
      "taca de portugal"
    ]
  },
  {
    "slug": "tur.1",
    "name": "Turkish Super Lig",
    "category": "Ligas Principales",
    "country": "Turquía",
    "flag": "🇹🇷",
    "keywords": [
      "turquia",
      "turkey",
      "super lig",
      "galatasaray",
      "fenerbahce",
      "besiktas",
      "tur.1",
      "turkish super lig"
    ]
  },
  {
    "slug": "caf.nations",
    "name": "Africa Cup of Nations",
    "category": "Torneos Continentales",
    "country": "CAF / África",
    "flag": "🌍",
    "keywords": [
      "caf",
      "africa",
      "african",
      "afcon",
      "copa de africa",
      "caf.nations",
      "africa cup of nations"
    ]
  },
  {
    "slug": "afc.champions",
    "name": "AFC Champions League Elite",
    "category": "Torneos Continentales",
    "country": "AFC / Asia",
    "flag": "🌏",
    "keywords": [
      "afc",
      "asia",
      "asian",
      "asiatico",
      "oriente",
      "arabia",
      "japon",
      "corea",
      "china",
      "australia",
      "catar",
      "qatar",
      "afc.champions",
      "afc champions league elite"
    ]
  },
  {
    "slug": "caf.nations_qual",
    "name": "Africa Cup of Nations Qualifying",
    "category": "Selecciones & FIFA",
    "country": "CAF / África",
    "flag": "🌍",
    "keywords": [
      "caf",
      "africa",
      "african",
      "afcon",
      "copa de africa",
      "caf.nations_qual",
      "africa cup of nations qualifying",
      "afcon qualifying"
    ]
  },
  {
    "slug": "afc.cup",
    "name": "AFC Champions League Two",
    "category": "Torneos Continentales",
    "country": "AFC / Asia",
    "flag": "🌏",
    "keywords": [
      "afc",
      "asia",
      "asian",
      "asiatico",
      "oriente",
      "arabia",
      "japon",
      "corea",
      "china",
      "australia",
      "catar",
      "qatar",
      "afc.cup",
      "afc champions league two"
    ]
  },
  {
    "slug": "fifa.cwc",
    "name": "FIFA Club World Cup",
    "category": "Selecciones & FIFA",
    "country": "FIFA / Internacional",
    "flag": "🌍",
    "keywords": [
      "fifa",
      "mundial",
      "world cup",
      "eliminatorias",
      "selecciones",
      "fifa.cwc",
      "fifa club world cup",
      "club world cup"
    ]
  },
  {
    "slug": "fifa.olympics",
    "name": "Men's Olympic Soccer Tournament",
    "category": "Selecciones & FIFA",
    "country": "FIFA / Internacional",
    "flag": "🌍",
    "keywords": [
      "fifa",
      "mundial",
      "world cup",
      "eliminatorias",
      "selecciones",
      "fifa.olympics",
      "men's olympic soccer tournament",
      "oly soccer (m)"
    ]
  },
  {
    "slug": "fifa.w.olympics",
    "name": "Women's Olympic Soccer Tournament",
    "category": "Selecciones & FIFA",
    "country": "FIFA / Internacional",
    "flag": "🌍",
    "keywords": [
      "fifa",
      "mundial",
      "world cup",
      "eliminatorias",
      "selecciones",
      "fifa.w.olympics",
      "women's olympic soccer tournament",
      "oly soccer (w)"
    ]
  },
  {
    "slug": "concacaf.gold",
    "name": "Concacaf Gold Cup",
    "category": "Torneos Continentales",
    "country": "CONCACAF / Norte-Centroamérica",
    "flag": "🏆",
    "keywords": [
      "concacaf",
      "norteamerica",
      "centroamerica",
      "copa oro",
      "champions cup",
      "concacaf.gold",
      "concacaf gold cup",
      "gold cup"
    ]
  },
  {
    "slug": "concacaf.gold_qual",
    "name": "Concacaf Gold Cup Qualifying",
    "category": "Torneos Continentales",
    "country": "CONCACAF / Norte-Centroamérica",
    "flag": "🏆",
    "keywords": [
      "concacaf",
      "norteamerica",
      "centroamerica",
      "copa oro",
      "champions cup",
      "concacaf.gold_qual",
      "concacaf gold cup qualifying"
    ]
  },
  {
    "slug": "concacaf.w.gold",
    "name": "Concacaf W Gold Cup",
    "category": "Torneos Continentales",
    "country": "CONCACAF / Norte-Centroamérica",
    "flag": "🏆",
    "keywords": [
      "concacaf",
      "norteamerica",
      "centroamerica",
      "copa oro",
      "champions cup",
      "concacaf.w.gold",
      "concacaf w gold cup",
      " w gold cup"
    ]
  },
  {
    "slug": "concacaf.confederations_playoff",
    "name": "Concacaf Cup",
    "category": "Torneos Continentales",
    "country": "CONCACAF / Norte-Centroamérica",
    "flag": "🏆",
    "keywords": [
      "concacaf",
      "norteamerica",
      "centroamerica",
      "copa oro",
      "champions cup",
      "concacaf.confederations_playoff",
      "concacaf cup",
      "confed cup playoff"
    ]
  },
  {
    "slug": "concacaf.w.champions_cup",
    "name": "Concacaf W Champions Cup",
    "category": "Torneos Continentales",
    "country": "CONCACAF / Norte-Centroamérica",
    "flag": "🏆",
    "keywords": [
      "concacaf",
      "norteamerica",
      "centroamerica",
      "copa oro",
      "champions cup",
      "concacaf.w.champions_cup",
      "concacaf w champions cup",
      "w champions cup"
    ]
  },
  {
    "slug": "concacaf.womens.championship",
    "name": "Concacaf W Championship",
    "category": "Torneos Continentales",
    "country": "CONCACAF / Norte-Centroamérica",
    "flag": "🏆",
    "keywords": [
      "concacaf",
      "norteamerica",
      "centroamerica",
      "copa oro",
      "champions cup",
      "concacaf.womens.championship",
      "concacaf w championship"
    ]
  },
  {
    "slug": "uefa.euro",
    "name": "UEFA European Championship",
    "category": "Torneos Continentales",
    "country": "UEFA / Europa",
    "flag": "🇪🇺",
    "keywords": [
      "uefa",
      "europa",
      "europe",
      "champions league",
      "eurocopa",
      "nations league",
      "uefa.euro",
      "uefa european championship",
      "euro"
    ]
  },
  {
    "slug": "uefa.euroq",
    "name": "UEFA European Championship Qualifying",
    "category": "Selecciones & FIFA",
    "country": "UEFA / Europa",
    "flag": "🇪🇺",
    "keywords": [
      "uefa",
      "europa",
      "europe",
      "champions league",
      "eurocopa",
      "nations league",
      "uefa.euroq",
      "uefa european championship qualifying",
      "euro qualifying"
    ]
  },
  {
    "slug": "uefa.weuro",
    "name": "UEFA Women's European Championship",
    "category": "Torneos Continentales",
    "country": "UEFA / Europa",
    "flag": "🇪🇺",
    "keywords": [
      "uefa",
      "europa",
      "europe",
      "champions league",
      "eurocopa",
      "nations league",
      "uefa.weuro",
      "uefa women's european championship",
      "women's euro"
    ]
  },
  {
    "slug": "uefa.euro_u21",
    "name": "UEFA European Under-21 Championship",
    "category": "Torneos Continentales",
    "country": "UEFA / Europa",
    "flag": "🇪🇺",
    "keywords": [
      "uefa",
      "europa",
      "europe",
      "champions league",
      "eurocopa",
      "nations league",
      "uefa.euro_u21",
      "uefa european under-21 championship",
      "euro under-21"
    ]
  },
  {
    "slug": "uefa.super_cup",
    "name": "UEFA Super Cup",
    "category": "Torneos Continentales",
    "country": "UEFA / Europa",
    "flag": "🇪🇺",
    "keywords": [
      "uefa",
      "europa",
      "europe",
      "champions league",
      "eurocopa",
      "nations league",
      "uefa.super_cup",
      "uefa super cup"
    ]
  },
  {
    "slug": "conmebol.america",
    "name": "Copa América",
    "category": "Torneos Continentales",
    "country": "CONMEBOL / Sudamérica",
    "flag": "🌎",
    "keywords": [
      "conmebol",
      "sudamerica",
      "copa libertadores",
      "copa sudamericana",
      "copa america",
      "conmebol.america",
      "copa américa"
    ]
  },
  {
    "slug": "conmebol.america.femenina",
    "name": "Copa América Femenina",
    "category": "Torneos Continentales",
    "country": "CONMEBOL / Sudamérica",
    "flag": "🌎",
    "keywords": [
      "conmebol",
      "sudamerica",
      "copa libertadores",
      "copa sudamericana",
      "copa america",
      "conmebol.america.femenina",
      "copa américa femenina"
    ]
  },
  {
    "slug": "usa.usl.1",
    "name": "USL Championship",
    "category": "Ligas Principales",
    "country": "Estados Unidos",
    "flag": "🇺🇸",
    "keywords": [
      "estados unidos",
      "usa",
      "mls",
      "inter miami",
      "messi",
      "nwsl",
      "usa.usl.1",
      "usl championship"
    ]
  },
  {
    "slug": "usa.usl.l1",
    "name": "USL League One",
    "category": "Ligas Principales",
    "country": "Estados Unidos",
    "flag": "🇺🇸",
    "keywords": [
      "estados unidos",
      "usa",
      "mls",
      "inter miami",
      "messi",
      "nwsl",
      "usa.usl.l1",
      "usl league one"
    ]
  },
  {
    "slug": "usa.usl.l1.cup",
    "name": "USL Cup",
    "category": "Copas Nacionales",
    "country": "Estados Unidos",
    "flag": "🇺🇸",
    "keywords": [
      "estados unidos",
      "usa",
      "mls",
      "inter miami",
      "messi",
      "nwsl",
      "usa.usl.l1.cup",
      "usl cup"
    ]
  },
  {
    "slug": "mex.2",
    "name": "Mexican Liga de Expansión MX",
    "category": "Ligas Principales",
    "country": "México",
    "flag": "🇲🇽",
    "keywords": [
      "mexico",
      "mexicano",
      "liga mx",
      "america",
      "chivas",
      "cruz azul",
      "tigres",
      "monterrey",
      "mex.2",
      "mexican liga de expansión mx",
      "liga de expansión mx"
    ]
  },
  {
    "slug": "global.finalissima",
    "name": "CONMEBOL-UEFA Cup of Champions",
    "category": "Torneos Continentales",
    "country": "Internacional / Otros",
    "flag": "🌐",
    "keywords": [
      "internacional",
      "global",
      "qatar",
      "catar",
      "gulf",
      "golfo",
      "arabian gulf cup",
      "global.finalissima",
      "conmebol-uefa cup of champions",
      "men's finalissima"
    ]
  },
  {
    "slug": "global.u20.intercontinental_cup",
    "name": "CONMEBOL-UEFA U20 Intercontinental Cup",
    "category": "Torneos Continentales",
    "country": "Internacional / Otros",
    "flag": "🌐",
    "keywords": [
      "internacional",
      "global",
      "qatar",
      "catar",
      "gulf",
      "golfo",
      "arabian gulf cup",
      "global.u20.intercontinental_cup",
      "conmebol-uefa u20 intercontinental cup",
      "u20 intercontinental cup"
    ]
  },
  {
    "slug": "global.w.finalissima",
    "name": "CONMEBOL-UEFA Women's Cup of Champions",
    "category": "Torneos Continentales",
    "country": "Internacional / Otros",
    "flag": "🌐",
    "keywords": [
      "internacional",
      "global",
      "qatar",
      "catar",
      "gulf",
      "golfo",
      "arabian gulf cup",
      "global.w.finalissima",
      "conmebol-uefa women's cup of champions",
      "women's finalissima"
    ]
  },
  {
    "slug": "fifa.world.u20",
    "name": "FIFA Under-20 World Cup",
    "category": "Selecciones & FIFA",
    "country": "FIFA / Internacional",
    "flag": "🌍",
    "keywords": [
      "fifa",
      "mundial",
      "world cup",
      "eliminatorias",
      "selecciones",
      "fifa.world.u20",
      "fifa under-20 world cup",
      "fifa u-20 world cup"
    ]
  },
  {
    "slug": "afc.asian.cup",
    "name": "AFC Asian Cup",
    "category": "Torneos Continentales",
    "country": "AFC / Asia",
    "flag": "🌏",
    "keywords": [
      "afc",
      "asia",
      "asian",
      "asiatico",
      "oriente",
      "arabia",
      "japon",
      "corea",
      "china",
      "australia",
      "catar",
      "qatar",
      "afc.asian.cup",
      "afc asian cup"
    ]
  },
  {
    "slug": "afc.w.asian.cup",
    "name": "AFC Women's Asian Cup",
    "category": "Torneos Continentales",
    "country": "AFC / Asia",
    "flag": "🌏",
    "keywords": [
      "afc",
      "asia",
      "asian",
      "asiatico",
      "oriente",
      "arabia",
      "japon",
      "corea",
      "china",
      "australia",
      "catar",
      "qatar",
      "afc.w.asian.cup",
      "afc women's asian cup"
    ]
  },
  {
    "slug": "afc.cupq",
    "name": "AFC Asian Cup Qualifiers",
    "category": "Selecciones & FIFA",
    "country": "AFC / Asia",
    "flag": "🌏",
    "keywords": [
      "afc",
      "asia",
      "asian",
      "asiatico",
      "oriente",
      "arabia",
      "japon",
      "corea",
      "china",
      "australia",
      "catar",
      "qatar",
      "afc.cupq",
      "afc asian cup qualifiers",
      "asian cup qualifiers"
    ]
  },
  {
    "slug": "aff.championship",
    "name": "ASEAN Championship",
    "category": "Torneos Continentales",
    "country": "Sudeste Asiático (AFF)",
    "flag": "🌏",
    "keywords": [
      "aff",
      "asean",
      "asia",
      "sudeste asiatico",
      "aff.championship",
      "asean championship",
      "asean champ"
    ]
  },
  {
    "slug": "caf.w.nations",
    "name": "Women's Africa Cup of Nations",
    "category": "Torneos Continentales",
    "country": "CAF / África",
    "flag": "🌍",
    "keywords": [
      "caf",
      "africa",
      "african",
      "afcon",
      "copa de africa",
      "caf.w.nations",
      "women's africa cup of nations"
    ]
  },
  {
    "slug": "caf.championship",
    "name": "African Nations Championship",
    "category": "Torneos Continentales",
    "country": "CAF / África",
    "flag": "🌍",
    "keywords": [
      "caf",
      "africa",
      "african",
      "afcon",
      "copa de africa",
      "caf.championship",
      "african nations championship",
      "chan"
    ]
  },
  {
    "slug": "can.w.nsl",
    "name": "Northern Super League",
    "category": "Ligas Principales",
    "country": "Canadá",
    "flag": "🇨🇦",
    "keywords": [
      "canada",
      "canadiense",
      "can.w.nsl",
      "northern super league"
    ]
  },
  {
    "slug": "uefa.europa_qual",
    "name": "UEFA Europa League Qualifying",
    "category": "Torneos Continentales",
    "country": "UEFA / Europa",
    "flag": "🇪🇺",
    "keywords": [
      "uefa",
      "europa",
      "europe",
      "champions league",
      "eurocopa",
      "nations league",
      "uefa.europa_qual",
      "uefa europa league qualifying",
      "uel qualifying"
    ]
  },
  {
    "slug": "uefa.europa.conf_qual",
    "name": "UEFA Conference League Qualifying",
    "category": "Torneos Continentales",
    "country": "UEFA / Europa",
    "flag": "🇪🇺",
    "keywords": [
      "uefa",
      "europa",
      "europe",
      "champions league",
      "eurocopa",
      "nations league",
      "uefa.europa.conf_qual",
      "uefa conference league qualifying",
      "uecl qualifying"
    ]
  },
  {
    "slug": "uefa.w.europa",
    "name": "UEFA Women's Europa Cup",
    "category": "Torneos Continentales",
    "country": "UEFA / Europa",
    "flag": "🇪🇺",
    "keywords": [
      "uefa",
      "europa",
      "europe",
      "champions league",
      "eurocopa",
      "nations league",
      "uefa.w.europa",
      "uefa women's europa cup",
      "women's europa cup"
    ]
  },
  {
    "slug": "fifa.intercontinental_cup",
    "name": "FIFA Intercontinental Cup",
    "category": "Selecciones & FIFA",
    "country": "FIFA / Internacional",
    "flag": "🌍",
    "keywords": [
      "fifa",
      "mundial",
      "world cup",
      "eliminatorias",
      "selecciones",
      "fifa.intercontinental_cup",
      "fifa intercontinental cup",
      "intercontinental cup"
    ]
  },
  {
    "slug": "afc.champions_qual",
    "name": "AFC Champions League Elite Qualifying",
    "category": "Torneos Continentales",
    "country": "AFC / Asia",
    "flag": "🌏",
    "keywords": [
      "afc",
      "asia",
      "asian",
      "asiatico",
      "oriente",
      "arabia",
      "japon",
      "corea",
      "china",
      "australia",
      "catar",
      "qatar",
      "afc.champions_qual",
      "afc champions league elite qualifying"
    ]
  },
  {
    "slug": "afc.cup_qual",
    "name": "AFC Champions League Two Qualifying",
    "category": "Torneos Continentales",
    "country": "AFC / Asia",
    "flag": "🌏",
    "keywords": [
      "afc",
      "asia",
      "asian",
      "asiatico",
      "oriente",
      "arabia",
      "japon",
      "corea",
      "china",
      "australia",
      "catar",
      "qatar",
      "afc.cup_qual",
      "afc champions league two qualifying"
    ]
  },
  {
    "slug": "club.friendly",
    "name": "Club Friendly",
    "category": "Ligas Principales",
    "country": "Internacional Clubes",
    "flag": "⚽",
    "keywords": [
      "amistosos",
      "clubes",
      "friendly",
      "club.friendly",
      "club friendly"
    ]
  },
  {
    "slug": "nonfifa",
    "name": "Non-FIFA Friendly",
    "category": "Ligas Principales",
    "country": "No Oficial FIFA",
    "flag": "⚽",
    "keywords": [
      "nonfifa",
      "non-fifa friendly"
    ]
  },
  {
    "slug": "rus.1",
    "name": "Russian Premier League",
    "category": "Ligas Principales",
    "country": "Rusia",
    "flag": "🇷🇺",
    "keywords": [
      "rusia",
      "russia",
      "zenit",
      "spartak",
      "rus.1",
      "russian premier league",
      "russian premier"
    ]
  },
  {
    "slug": "rus.1.promotion.relegation",
    "name": "Russian Premier League Relegation/Promotion Playoffs",
    "category": "Ligas Principales",
    "country": "Rusia",
    "flag": "🇷🇺",
    "keywords": [
      "rusia",
      "russia",
      "zenit",
      "spartak",
      "rus.1.promotion.relegation",
      "russian premier league relegation/promotion playoffs",
      "russian premier league pro/rel"
    ]
  },
  {
    "slug": "bel.1",
    "name": "Belgian Pro League",
    "category": "Ligas Principales",
    "country": "Bélgica",
    "flag": "🇧🇪",
    "keywords": [
      "belgica",
      "belgium",
      "brujas",
      "anderlecht",
      "bel.1",
      "belgian pro league"
    ]
  },
  {
    "slug": "bel.promotion.relegation",
    "name": "Belgian Pro League Promotion/Relegation Playoffs",
    "category": "Ligas Principales",
    "country": "Bélgica",
    "flag": "🇧🇪",
    "keywords": [
      "belgica",
      "belgium",
      "brujas",
      "anderlecht",
      "bel.promotion.relegation",
      "belgian pro league promotion/relegation playoffs",
      "belgian pro league pro/rel"
    ]
  },
  {
    "slug": "esp.2",
    "name": "Spanish LALIGA 2",
    "category": "Ligas Principales",
    "country": "España",
    "flag": "🇪🇸",
    "keywords": [
      "españa",
      "espana",
      "spain",
      "laliga",
      "copa del rey",
      "real madrid",
      "barcelona",
      "atletico",
      "esp.2",
      "spanish laliga 2",
      "laliga 2"
    ]
  },
  {
    "slug": "ger.2",
    "name": "German 2. Bundesliga",
    "category": "Ligas Principales",
    "country": "Alemania",
    "flag": "🇩🇪",
    "keywords": [
      "alemania",
      "germany",
      "bundesliga",
      "bayern",
      "dortmund",
      "ger.2",
      "german 2. bundesliga",
      "2. bundesliga"
    ]
  },
  {
    "slug": "ita.2",
    "name": "Italian Serie B",
    "category": "Ligas Principales",
    "country": "Italia",
    "flag": "🇮🇹",
    "keywords": [
      "italia",
      "italy",
      "serie a",
      "juventus",
      "milan",
      "inter",
      "ita.2",
      "italian serie b"
    ]
  },
  {
    "slug": "fra.1.promotion.relegation",
    "name": "French Ligue 1 Promotion/Relegation Playoffs",
    "category": "Ligas Principales",
    "country": "Francia",
    "flag": "🇫🇷",
    "keywords": [
      "francia",
      "france",
      "ligue 1",
      "psg",
      "paris",
      "marseille",
      "fra.1.promotion.relegation",
      "french ligue 1 promotion/relegation playoffs",
      "ligue 1 pro/rel"
    ]
  },
  {
    "slug": "fra.2",
    "name": "French Ligue 2",
    "category": "Ligas Principales",
    "country": "Francia",
    "flag": "🇫🇷",
    "keywords": [
      "francia",
      "france",
      "ligue 1",
      "psg",
      "paris",
      "marseille",
      "fra.2",
      "french ligue 2",
      "ligue 2"
    ]
  },
  {
    "slug": "por.1.promotion.relegation",
    "name": "Portuguese Primeira Liga Promotion/Relegation Playoffs",
    "category": "Ligas Principales",
    "country": "Portugal",
    "flag": "🇵🇹",
    "keywords": [
      "portugal",
      "portugues",
      "primeira liga",
      "benfica",
      "porto",
      "sporting",
      "por.1.promotion.relegation",
      "portuguese primeira liga promotion/relegation playoffs",
      "portuguese liga pro/rel"
    ]
  },
  {
    "slug": "aut.1",
    "name": "Austrian Bundesliga",
    "category": "Ligas Principales",
    "country": "Austria",
    "flag": "🇦🇹",
    "keywords": [
      "austria",
      "salzburg",
      "rapid",
      "aut.1",
      "austrian bundesliga"
    ]
  },
  {
    "slug": "gre.1",
    "name": "Greek Super League",
    "category": "Ligas Principales",
    "country": "Grecia",
    "flag": "🇬🇷",
    "keywords": [
      "grecia",
      "greece",
      "olympiacos",
      "panathinaikos",
      "gre.1",
      "greek super league"
    ]
  },
  {
    "slug": "chn.1",
    "name": "Chinese Super League",
    "category": "Ligas Principales",
    "country": "China",
    "flag": "🇨🇳",
    "keywords": [
      "china",
      "chino",
      "chinese",
      "csl",
      "shanghai",
      "beijing",
      "chn.1",
      "chinese super league"
    ]
  },
  {
    "slug": "global.club_challenge",
    "name": "CONMEBOL-UEFA Club Challenge",
    "category": "Torneos Continentales",
    "country": "Internacional / Otros",
    "flag": "🌐",
    "keywords": [
      "internacional",
      "global",
      "qatar",
      "catar",
      "gulf",
      "golfo",
      "arabian gulf cup",
      "global.club_challenge",
      "conmebol-uefa club challenge"
    ]
  },
  {
    "slug": "ned.supercup",
    "name": "Dutch Johan Cruyff Shield",
    "category": "Copas Nacionales",
    "country": "Países Bajos",
    "flag": "🇳🇱",
    "keywords": [
      "paises bajos",
      "holanda",
      "dutch",
      "eredivisie",
      "ajax",
      "psv",
      "feyenoord",
      "ned.supercup",
      "dutch johan cruyff shield",
      "johan cruyff shield"
    ]
  },
  {
    "slug": "global.pinatar_cup",
    "name": "Pinatar Cup",
    "category": "Torneos Continentales",
    "country": "Internacional / Otros",
    "flag": "🌐",
    "keywords": [
      "internacional",
      "global",
      "qatar",
      "catar",
      "gulf",
      "golfo",
      "arabian gulf cup",
      "global.pinatar_cup",
      "pinatar cup"
    ]
  },
  {
    "slug": "friendly.emirates_cup",
    "name": "Emirates Cup",
    "category": "Selecciones & FIFA",
    "country": "Internacional",
    "flag": "⚽",
    "keywords": [
      "friendly.emirates_cup",
      "emirates cup"
    ]
  },
  {
    "slug": "esp.joan_gamper",
    "name": "Trofeo Joan Gamper",
    "category": "Ligas Principales",
    "country": "España",
    "flag": "🇪🇸",
    "keywords": [
      "españa",
      "espana",
      "spain",
      "laliga",
      "copa del rey",
      "real madrid",
      "barcelona",
      "atletico",
      "esp.joan_gamper",
      "trofeo joan gamper"
    ]
  },
  {
    "slug": "jpn.world_challenge",
    "name": "Japanese J.League World Challenge",
    "category": "Ligas Principales",
    "country": "Japón",
    "flag": "🇯🇵",
    "keywords": [
      "japon",
      "japan",
      "j-league",
      "j1",
      "urawa",
      "vissel kobe",
      "jpn.world_challenge",
      "japanese j.league world challenge",
      "j.league world challenge"
    ]
  },
  {
    "slug": "global.arnold.clark_cup",
    "name": "Arnold Clark Cup",
    "category": "Torneos Continentales",
    "country": "Internacional / Otros",
    "flag": "🌐",
    "keywords": [
      "internacional",
      "global",
      "qatar",
      "catar",
      "gulf",
      "golfo",
      "arabian gulf cup",
      "global.arnold.clark_cup",
      "arnold clark cup"
    ]
  },
  {
    "slug": "fifa.conmebol.olympicsq",
    "name": "CONMEBOL Pre-Olympic Tournament",
    "category": "Selecciones & FIFA",
    "country": "FIFA / Internacional",
    "flag": "🌍",
    "keywords": [
      "fifa",
      "mundial",
      "world cup",
      "eliminatorias",
      "selecciones",
      "fifa.conmebol.olympicsq",
      "conmebol pre-olympic tournament"
    ]
  },
  {
    "slug": "fifa.concacaf.olympicsq",
    "name": "Men's Olympic Qualifying Playoff",
    "category": "Selecciones & FIFA",
    "country": "FIFA / Internacional",
    "flag": "🌍",
    "keywords": [
      "fifa",
      "mundial",
      "world cup",
      "eliminatorias",
      "selecciones",
      "fifa.concacaf.olympicsq",
      "men's olympic qualifying playoff"
    ]
  },
  {
    "slug": "fifa.w.concacaf.olympicsq",
    "name": "Concacaf Women's Olympic Qualifying",
    "category": "Selecciones & FIFA",
    "country": "FIFA / Internacional",
    "flag": "🌍",
    "keywords": [
      "fifa",
      "mundial",
      "world cup",
      "eliminatorias",
      "selecciones",
      "fifa.w.concacaf.olympicsq",
      "concacaf women's olympic qualifying"
    ]
  },
  {
    "slug": "fifa.world.u17",
    "name": "FIFA Under-17 World Cup",
    "category": "Selecciones & FIFA",
    "country": "FIFA / Internacional",
    "flag": "🌍",
    "keywords": [
      "fifa",
      "mundial",
      "world cup",
      "eliminatorias",
      "selecciones",
      "fifa.world.u17",
      "fifa under-17 world cup",
      "fifa u-17 world cup"
    ]
  },
  {
    "slug": "fifa.wworld.u17",
    "name": "FIFA Under-17 Women's World Cup",
    "category": "Selecciones & FIFA",
    "country": "FIFA / Internacional",
    "flag": "🌍",
    "keywords": [
      "fifa",
      "mundial",
      "world cup",
      "eliminatorias",
      "selecciones",
      "fifa.wworld.u17",
      "fifa under-17 women's world cup",
      "u-17 wwc"
    ]
  },
  {
    "slug": "uefa.euro_u21_qual",
    "name": "UEFA European Under-21 Championship Qualifying",
    "category": "Torneos Continentales",
    "country": "UEFA / Europa",
    "flag": "🇪🇺",
    "keywords": [
      "uefa",
      "europa",
      "europe",
      "champions league",
      "eurocopa",
      "nations league",
      "uefa.euro_u21_qual",
      "uefa european under-21 championship qualifying",
      "euro u-21 qualifying"
    ]
  },
  {
    "slug": "uefa.euro.u19",
    "name": "UEFA European Under-19 Championship",
    "category": "Torneos Continentales",
    "country": "UEFA / Europa",
    "flag": "🇪🇺",
    "keywords": [
      "uefa",
      "europa",
      "europe",
      "champions league",
      "eurocopa",
      "nations league",
      "uefa.euro.u19",
      "uefa european under-19 championship",
      "euro under-19"
    ]
  },
  {
    "slug": "fifa.friendly_u21",
    "name": "Under-21 International Friendly",
    "category": "Selecciones & FIFA",
    "country": "FIFA / Internacional",
    "flag": "🌍",
    "keywords": [
      "fifa",
      "mundial",
      "world cup",
      "eliminatorias",
      "selecciones",
      "fifa.friendly_u21",
      "under-21 international friendly",
      "men's u-21 friendly"
    ]
  },
  {
    "slug": "ger.2.promotion.relegation",
    "name": "German Bundesliga 2. Promotion/Relegation Playoffs",
    "category": "Ligas Principales",
    "country": "Alemania",
    "flag": "🇩🇪",
    "keywords": [
      "alemania",
      "germany",
      "bundesliga",
      "bayern",
      "dortmund",
      "ger.2.promotion.relegation",
      "german bundesliga 2. promotion/relegation playoffs",
      "2. bundesliga pro/rel"
    ]
  },
  {
    "slug": "eng.trophy",
    "name": "English EFL Trophy",
    "category": "Copas Nacionales",
    "country": "Inglaterra",
    "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "keywords": [
      "inglaterra",
      "england",
      "premier league",
      "fa cup",
      "arsenal",
      "chelsea",
      "liverpool",
      "manchester",
      "eng.trophy",
      "english efl trophy",
      "efl trophy"
    ]
  },
  {
    "slug": "eng.3",
    "name": "English League One",
    "category": "Ligas Principales",
    "country": "Inglaterra",
    "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "keywords": [
      "inglaterra",
      "england",
      "premier league",
      "fa cup",
      "arsenal",
      "chelsea",
      "liverpool",
      "manchester",
      "eng.3",
      "english league one",
      "efl league one"
    ]
  },
  {
    "slug": "eng.4",
    "name": "English League Two",
    "category": "Ligas Principales",
    "country": "Inglaterra",
    "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "keywords": [
      "inglaterra",
      "england",
      "premier league",
      "fa cup",
      "arsenal",
      "chelsea",
      "liverpool",
      "manchester",
      "eng.4",
      "english league two",
      "efl league two"
    ]
  },
  {
    "slug": "eng.5",
    "name": "English National League",
    "category": "Ligas Principales",
    "country": "Inglaterra",
    "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "keywords": [
      "inglaterra",
      "england",
      "premier league",
      "fa cup",
      "arsenal",
      "chelsea",
      "liverpool",
      "manchester",
      "eng.5",
      "english national league",
      "national league"
    ]
  },
  {
    "slug": "eng.fa_qual",
    "name": "English FA Cup Qualifying",
    "category": "Ligas Principales",
    "country": "Inglaterra",
    "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "keywords": [
      "inglaterra",
      "england",
      "premier league",
      "fa cup",
      "arsenal",
      "chelsea",
      "liverpool",
      "manchester",
      "eng.fa_qual",
      "english fa cup qualifying"
    ]
  },
  {
    "slug": "sco.1.promotion.relegation",
    "name": "Scottish Premiership Promotion/Relegation Playoffs",
    "category": "Ligas Principales",
    "country": "Escocia",
    "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "keywords": [
      "escocia",
      "scotland",
      "celtic",
      "rangers",
      "sco.1.promotion.relegation",
      "scottish premiership promotion/relegation playoffs",
      "spfl premiership pro/rel"
    ]
  },
  {
    "slug": "sco.2",
    "name": "Scottish Championship",
    "category": "Ligas Principales",
    "country": "Escocia",
    "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "keywords": [
      "escocia",
      "scotland",
      "celtic",
      "rangers",
      "sco.2",
      "scottish championship",
      "spfl championship"
    ]
  },
  {
    "slug": "sco.2.promotion.relegation",
    "name": "Scottish Championship Promotion/Relegation Playoffs",
    "category": "Ligas Principales",
    "country": "Escocia",
    "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "keywords": [
      "escocia",
      "scotland",
      "celtic",
      "rangers",
      "sco.2.promotion.relegation",
      "scottish championship promotion/relegation playoffs",
      "spfl championship pro/rel"
    ]
  },
  {
    "slug": "sco.challenge",
    "name": "Scottish League Challenge Cup",
    "category": "Ligas Principales",
    "country": "Escocia",
    "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "keywords": [
      "escocia",
      "scotland",
      "celtic",
      "rangers",
      "sco.challenge",
      "scottish league challenge cup",
      "spfl challenge cup"
    ]
  },
  {
    "slug": "sco.tennents_qual",
    "name": "Scottish Cup Qualifying",
    "category": "Ligas Principales",
    "country": "Escocia",
    "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "keywords": [
      "escocia",
      "scotland",
      "celtic",
      "rangers",
      "sco.tennents_qual",
      "scottish cup qualifying"
    ]
  },
  {
    "slug": "ned.playoff.relegation",
    "name": "Dutch Eredivisie Promotion/Relegation Playoffs",
    "category": "Ligas Principales",
    "country": "Países Bajos",
    "flag": "🇳🇱",
    "keywords": [
      "paises bajos",
      "holanda",
      "dutch",
      "eredivisie",
      "ajax",
      "psv",
      "feyenoord",
      "ned.playoff.relegation",
      "dutch eredivisie promotion/relegation playoffs",
      "eredivisie pro/rel"
    ]
  },
  {
    "slug": "ned.2",
    "name": "Dutch Keuken Kampioen Divisie",
    "category": "Ligas Principales",
    "country": "Países Bajos",
    "flag": "🇳🇱",
    "keywords": [
      "paises bajos",
      "holanda",
      "dutch",
      "eredivisie",
      "ajax",
      "psv",
      "feyenoord",
      "ned.2",
      "dutch keuken kampioen divisie",
      "keuken kampioen divisie"
    ]
  },
  {
    "slug": "ned.3.promotion.relegation",
    "name": "Dutch Tweede Divisie Promotion/Relegation Playoffs",
    "category": "Ligas Principales",
    "country": "Países Bajos",
    "flag": "🇳🇱",
    "keywords": [
      "paises bajos",
      "holanda",
      "dutch",
      "eredivisie",
      "ajax",
      "psv",
      "feyenoord",
      "ned.3.promotion.relegation",
      "dutch tweede divisie promotion/relegation playoffs",
      "dutch tweede divisie pro/rel playoffs"
    ]
  },
  {
    "slug": "ned.w.knvb_cup",
    "name": "Dutch KNVB Beker Vrouwen",
    "category": "Copas Nacionales",
    "country": "Países Bajos",
    "flag": "🇳🇱",
    "keywords": [
      "paises bajos",
      "holanda",
      "dutch",
      "eredivisie",
      "ajax",
      "psv",
      "feyenoord",
      "ned.w.knvb_cup",
      "dutch knvb beker vrouwen",
      "dutch vrouwen knvb beker"
    ]
  },
  {
    "slug": "ned.w.1",
    "name": "Dutch Vrouwen Eredivisie",
    "category": "Ligas Principales",
    "country": "Países Bajos",
    "flag": "🇳🇱",
    "keywords": [
      "paises bajos",
      "holanda",
      "dutch",
      "eredivisie",
      "ajax",
      "psv",
      "feyenoord",
      "ned.w.1",
      "dutch vrouwen eredivisie"
    ]
  },
  {
    "slug": "swe.1",
    "name": "Swedish Allsvenskan",
    "category": "Ligas Principales",
    "country": "Suecia",
    "flag": "🇸🇪",
    "keywords": [
      "suecia",
      "sweden",
      "allsvenskan",
      "malmo",
      "swe.1",
      "swedish allsvenskan"
    ]
  },
  {
    "slug": "swe.1.promotion.relegation",
    "name": "Swedish Allsvenskan Promotion/Relegation Playoffs",
    "category": "Ligas Principales",
    "country": "Suecia",
    "flag": "🇸🇪",
    "keywords": [
      "suecia",
      "sweden",
      "allsvenskan",
      "malmo",
      "swe.1.promotion.relegation",
      "swedish allsvenskan promotion/relegation playoffs",
      "swedish allsvenskan pro/rel"
    ]
  },
  {
    "slug": "den.1",
    "name": "Danish Superliga",
    "category": "Ligas Principales",
    "country": "Dinamarca",
    "flag": "🇩🇰",
    "keywords": [
      "dinamarca",
      "denmark",
      "copenhague",
      "danish",
      "den.1",
      "danish superliga"
    ]
  },
  {
    "slug": "nor.1.promotion.relegation",
    "name": "Norwegian Eliteserien Promotion/Relegation Playoffs",
    "category": "Ligas Principales",
    "country": "Noruega",
    "flag": "🇳🇴",
    "keywords": [
      "noruega",
      "norway",
      "norwegian",
      "eliteserien",
      "bodo glimt",
      "rosenborg",
      "molde",
      "nor.1.promotion.relegation",
      "norwegian eliteserien promotion/relegation playoffs",
      "eliteserien pro/rel"
    ]
  },
  {
    "slug": "nor.1",
    "name": "Norwegian Eliteserien",
    "category": "Ligas Principales",
    "country": "Noruega",
    "flag": "🇳🇴",
    "keywords": [
      "noruega",
      "norway",
      "norwegian",
      "eliteserien",
      "bodo glimt",
      "rosenborg",
      "molde",
      "nor.1",
      "norwegian eliteserien"
    ]
  },
  {
    "slug": "conmebol.sudamericana",
    "name": "CONMEBOL Sudamericana",
    "category": "Torneos Continentales",
    "country": "CONMEBOL / Sudamérica",
    "flag": "🌎",
    "keywords": [
      "conmebol",
      "sudamerica",
      "copa libertadores",
      "copa sudamericana",
      "copa america",
      "conmebol.sudamericana",
      "conmebol sudamericana"
    ]
  },
  {
    "slug": "conmebol.recopa",
    "name": "CONMEBOL Recopa",
    "category": "Torneos Continentales",
    "country": "CONMEBOL / Sudamérica",
    "flag": "🌎",
    "keywords": [
      "conmebol",
      "sudamerica",
      "copa libertadores",
      "copa sudamericana",
      "copa america",
      "conmebol.recopa",
      "conmebol recopa"
    ]
  },
  {
    "slug": "arg.1",
    "name": "Argentine Liga Profesional de Fútbol",
    "category": "Ligas Principales",
    "country": "Argentina",
    "flag": "🇦🇷",
    "keywords": [
      "argentina",
      "afa",
      "superliga",
      "boca",
      "river",
      "arg.1",
      "argentine liga profesional de fútbol",
      "argentine lpf"
    ]
  },
  {
    "slug": "arg.copa",
    "name": "Copa Argentina",
    "category": "Copas Nacionales",
    "country": "Argentina",
    "flag": "🇦🇷",
    "keywords": [
      "argentina",
      "afa",
      "superliga",
      "boca",
      "river",
      "arg.copa",
      "copa argentina"
    ]
  },
  {
    "slug": "arg.copa_de_la_superliga",
    "name": "Argentine Copa de la Superliga",
    "category": "Copas Nacionales",
    "country": "Argentina",
    "flag": "🇦🇷",
    "keywords": [
      "argentina",
      "afa",
      "superliga",
      "boca",
      "river",
      "arg.copa_de_la_superliga",
      "argentine copa de la superliga",
      "argcopasuperliga"
    ]
  },
  {
    "slug": "arg.trofeo_de_la_campeones",
    "name": "Argentine Trofeo de Campeones",
    "category": "Ligas Principales",
    "country": "Argentina",
    "flag": "🇦🇷",
    "keywords": [
      "argentina",
      "afa",
      "superliga",
      "boca",
      "river",
      "arg.trofeo_de_la_campeones",
      "argentine trofeo de campeones"
    ]
  },
  {
    "slug": "arg.2",
    "name": "Argentine Nacional B",
    "category": "Ligas Principales",
    "country": "Argentina",
    "flag": "🇦🇷",
    "keywords": [
      "argentina",
      "afa",
      "superliga",
      "boca",
      "river",
      "arg.2",
      "argentine nacional b"
    ]
  },
  {
    "slug": "arg.supercopa",
    "name": "Argentine Supercopa",
    "category": "Copas Nacionales",
    "country": "Argentina",
    "flag": "🇦🇷",
    "keywords": [
      "argentina",
      "afa",
      "superliga",
      "boca",
      "river",
      "arg.supercopa",
      "argentine supercopa"
    ]
  },
  {
    "slug": "arg.supercopa.internacional",
    "name": "Argentine Supercopa Internacional",
    "category": "Copas Nacionales",
    "country": "Argentina",
    "flag": "🇦🇷",
    "keywords": [
      "argentina",
      "afa",
      "superliga",
      "boca",
      "river",
      "arg.supercopa.internacional",
      "argentine supercopa internacional",
      "supercopa internacional"
    ]
  },
  {
    "slug": "arg.3",
    "name": "Argentine Primera B",
    "category": "Ligas Principales",
    "country": "Argentina",
    "flag": "🇦🇷",
    "keywords": [
      "argentina",
      "afa",
      "superliga",
      "boca",
      "river",
      "arg.3",
      "argentine primera b"
    ]
  },
  {
    "slug": "bra.supercopa_do_brazil",
    "name": "Brazilian Supercopa Rei",
    "category": "Copas Nacionales",
    "country": "Brasil",
    "flag": "🇧🇷",
    "keywords": [
      "brasil",
      "brazil",
      "brasileirao",
      "flamengo",
      "palmeiras",
      "bra.supercopa_do_brazil",
      "brazilian supercopa rei",
      "supercopa rei"
    ]
  },
  {
    "slug": "bra.1",
    "name": "Brazilian Serie A",
    "category": "Ligas Principales",
    "country": "Brasil",
    "flag": "🇧🇷",
    "keywords": [
      "brasil",
      "brazil",
      "brasileirao",
      "flamengo",
      "palmeiras",
      "bra.1",
      "brazilian serie a",
      "brazil serie a"
    ]
  },
  {
    "slug": "bra.2",
    "name": "Brazilian Serie B",
    "category": "Ligas Principales",
    "country": "Brasil",
    "flag": "🇧🇷",
    "keywords": [
      "brasil",
      "brazil",
      "brasileirao",
      "flamengo",
      "palmeiras",
      "bra.2",
      "brazilian serie b",
      "brazil serie b"
    ]
  },
  {
    "slug": "bra.copa_do_brazil",
    "name": "Copa do Brasil",
    "category": "Copas Nacionales",
    "country": "Brasil",
    "flag": "🇧🇷",
    "keywords": [
      "brasil",
      "brazil",
      "brasileirao",
      "flamengo",
      "palmeiras",
      "bra.copa_do_brazil",
      "copa do brasil",
      "copa do brazil"
    ]
  },
  {
    "slug": "bra.camp.carioca",
    "name": "Brazilian Campeonato Carioca",
    "category": "Ligas Principales",
    "country": "Brasil",
    "flag": "🇧🇷",
    "keywords": [
      "brasil",
      "brazil",
      "brasileirao",
      "flamengo",
      "palmeiras",
      "bra.camp.carioca",
      "brazilian campeonato carioca",
      "brazil carioca"
    ]
  },
  {
    "slug": "bra.camp.paulista",
    "name": "Brazilian Campeonato Paulista",
    "category": "Ligas Principales",
    "country": "Brasil",
    "flag": "🇧🇷",
    "keywords": [
      "brasil",
      "brazil",
      "brasileirao",
      "flamengo",
      "palmeiras",
      "bra.camp.paulista",
      "brazilian campeonato paulista",
      "brazil paulista"
    ]
  },
  {
    "slug": "bra.camp.gaucho",
    "name": "Brazilian Campeonato Gaucho",
    "category": "Ligas Principales",
    "country": "Brasil",
    "flag": "🇧🇷",
    "keywords": [
      "brasil",
      "brazil",
      "brasileirao",
      "flamengo",
      "palmeiras",
      "bra.camp.gaucho",
      "brazilian campeonato gaucho",
      "brazil gaucho"
    ]
  },
  {
    "slug": "bra.camp.mineiro",
    "name": "Brazilian Campeonato Mineiro",
    "category": "Ligas Principales",
    "country": "Brasil",
    "flag": "🇧🇷",
    "keywords": [
      "brasil",
      "brazil",
      "brasileirao",
      "flamengo",
      "palmeiras",
      "bra.camp.mineiro",
      "brazilian campeonato mineiro",
      "brazil mineiro"
    ]
  },
  {
    "slug": "chi.super_cup",
    "name": "Chilean Supercopa",
    "category": "Copas Nacionales",
    "country": "Chile",
    "flag": "🇨🇱",
    "keywords": [
      "chile",
      "chileno",
      "colo colo",
      "universidad de chile",
      "chi.super_cup",
      "chilean supercopa"
    ]
  },
  {
    "slug": "chi.1",
    "name": "Chilean Primera División",
    "category": "Ligas Principales",
    "country": "Chile",
    "flag": "🇨🇱",
    "keywords": [
      "chile",
      "chileno",
      "colo colo",
      "universidad de chile",
      "chi.1",
      "chilean primera división",
      "chilean primera"
    ]
  },
  {
    "slug": "chi.1.promotion.relegation",
    "name": "Chilean Primera División Promotion/Relegation Playoffs",
    "category": "Ligas Principales",
    "country": "Chile",
    "flag": "🇨🇱",
    "keywords": [
      "chile",
      "chileno",
      "colo colo",
      "universidad de chile",
      "chi.1.promotion.relegation",
      "chilean primera división promotion/relegation playoffs",
      "chilean pro/rel"
    ]
  },
  {
    "slug": "chi.copa_chi",
    "name": "Copa Chile",
    "category": "Copas Nacionales",
    "country": "Chile",
    "flag": "🇨🇱",
    "keywords": [
      "chile",
      "chileno",
      "colo colo",
      "universidad de chile",
      "chi.copa_chi",
      "copa chile"
    ]
  },
  {
    "slug": "uru.1",
    "name": "Liga AUF Uruguaya",
    "category": "Ligas Principales",
    "country": "Uruguay",
    "flag": "🇺🇾",
    "keywords": [
      "uruguay",
      "uruguayo",
      "peñarol",
      "nacional",
      "uru.1",
      "liga auf uruguaya"
    ]
  },
  {
    "slug": "uru.2",
    "name": "Segunda División de Uruguay",
    "category": "Ligas Principales",
    "country": "Uruguay",
    "flag": "🇺🇾",
    "keywords": [
      "uruguay",
      "uruguayo",
      "peñarol",
      "nacional",
      "uru.2",
      "segunda división de uruguay",
      "segunda"
    ]
  },
  {
    "slug": "col.superliga",
    "name": "Colombian Superliga",
    "category": "Ligas Principales",
    "country": "Colombia",
    "flag": "🇨🇴",
    "keywords": [
      "colombia",
      "colombiano",
      "betplay",
      "millonarios",
      "nacional",
      "col.superliga",
      "colombian superliga"
    ]
  },
  {
    "slug": "col.1",
    "name": "Colombian Primera A",
    "category": "Ligas Principales",
    "country": "Colombia",
    "flag": "🇨🇴",
    "keywords": [
      "colombia",
      "colombiano",
      "betplay",
      "millonarios",
      "nacional",
      "col.1",
      "colombian primera a"
    ]
  },
  {
    "slug": "col.copa",
    "name": "Copa Colombia",
    "category": "Copas Nacionales",
    "country": "Colombia",
    "flag": "🇨🇴",
    "keywords": [
      "colombia",
      "colombiano",
      "betplay",
      "millonarios",
      "nacional",
      "col.copa",
      "copa colombia"
    ]
  },
  {
    "slug": "per.1",
    "name": "Peruvian Liga 1",
    "category": "Ligas Principales",
    "country": "Perú",
    "flag": "🇵🇪",
    "keywords": [
      "peru",
      "peruano",
      "liga 1",
      "alianza lima",
      "universitario",
      "sporting cristal",
      "per.1",
      "peruvian liga 1",
      "peru liga 1"
    ]
  },
  {
    "slug": "par.1",
    "name": "Paraguayan Primera División",
    "category": "Ligas Principales",
    "country": "Paraguay",
    "flag": "🇵🇾",
    "keywords": [
      "paraguay",
      "paraguayo",
      "olimpia",
      "cerro porteño",
      "libertad",
      "par.1",
      "paraguayan primera división",
      "paraguayan primera"
    ]
  },
  {
    "slug": "par.1.supercopa",
    "name": "Paraguayan Supercopa",
    "category": "Copas Nacionales",
    "country": "Paraguay",
    "flag": "🇵🇾",
    "keywords": [
      "paraguay",
      "paraguayo",
      "olimpia",
      "cerro porteño",
      "libertad",
      "par.1.supercopa",
      "paraguayan supercopa"
    ]
  },
  {
    "slug": "ecu.1",
    "name": "LigaPro Ecuador",
    "category": "Ligas Principales",
    "country": "Ecuador",
    "flag": "🇪🇨",
    "keywords": [
      "ecuador",
      "ecuatoriano",
      "ligapro",
      "liga de quito",
      "barcelona sc",
      "ecu.1",
      "ligapro ecuador"
    ]
  },
  {
    "slug": "ven.1",
    "name": "Venezuelan Primera División",
    "category": "Ligas Principales",
    "country": "Venezuela",
    "flag": "🇻🇪",
    "keywords": [
      "venezuela",
      "venezolano",
      "futve",
      "caracas fc",
      "tachira",
      "ven.1",
      "venezuelan primera división",
      "liga futve"
    ]
  },
  {
    "slug": "bol.ply.rel",
    "name": "Bolivian Liga Profesional Promotion/Relegation Playoffs",
    "category": "Ligas Principales",
    "country": "Bolivia",
    "flag": "🇧🇴",
    "keywords": [
      "bolivia",
      "boliviano",
      "the strongest",
      "bolivar",
      "bol.ply.rel",
      "bolivian liga profesional promotion/relegation playoffs",
      "bolivian liga pro/rel"
    ]
  },
  {
    "slug": "bol.copa",
    "name": "Copa Bolivia",
    "category": "Copas Nacionales",
    "country": "Bolivia",
    "flag": "🇧🇴",
    "keywords": [
      "bolivia",
      "boliviano",
      "the strongest",
      "bolivar",
      "bol.copa",
      "copa bolivia"
    ]
  },
  {
    "slug": "bol.1",
    "name": "Bolivian Liga Profesional",
    "category": "Ligas Principales",
    "country": "Bolivia",
    "flag": "🇧🇴",
    "keywords": [
      "bolivia",
      "boliviano",
      "the strongest",
      "bolivar",
      "bol.1",
      "bolivian liga profesional"
    ]
  },
  {
    "slug": "jpn.1",
    "name": "Japanese J.League",
    "category": "Ligas Principales",
    "country": "Japón",
    "flag": "🇯🇵",
    "keywords": [
      "japon",
      "japan",
      "j-league",
      "j1",
      "urawa",
      "vissel kobe",
      "jpn.1",
      "japanese j.league",
      "japanese j1 league"
    ]
  },
  {
    "slug": "mex.campeon",
    "name": "Mexican Campeon de Campeones",
    "category": "Ligas Principales",
    "country": "México",
    "flag": "🇲🇽",
    "keywords": [
      "mexico",
      "mexicano",
      "liga mx",
      "america",
      "chivas",
      "cruz azul",
      "tigres",
      "monterrey",
      "mex.campeon",
      "mexican campeon de campeones",
      "campeon de campeones"
    ]
  },
  {
    "slug": "concacaf.central.american.cup",
    "name": "Concacaf Central American Cup",
    "category": "Torneos Continentales",
    "country": "CONCACAF / Norte-Centroamérica",
    "flag": "🏆",
    "keywords": [
      "concacaf",
      "norteamerica",
      "centroamerica",
      "copa oro",
      "champions cup",
      "concacaf.central.american.cup",
      "concacaf central american cup"
    ]
  },
  {
    "slug": "concacaf.champions_cup",
    "name": "CONCACAF Champions Cup",
    "category": "Torneos Continentales",
    "country": "CONCACAF / Norte-Centroamérica",
    "flag": "🏆",
    "keywords": [
      "concacaf",
      "norteamerica",
      "centroamerica",
      "copa oro",
      "champions cup",
      "concacaf.champions_cup",
      "concacaf champions cup"
    ]
  },
  {
    "slug": "concacaf.u23",
    "name": "CONCACAF U23 Tournament",
    "category": "Torneos Continentales",
    "country": "CONCACAF / Norte-Centroamérica",
    "flag": "🏆",
    "keywords": [
      "concacaf",
      "norteamerica",
      "centroamerica",
      "copa oro",
      "champions cup",
      "concacaf.u23",
      "concacaf u23 tournament"
    ]
  },
  {
    "slug": "hon.1",
    "name": "Honduran Liga Nacional",
    "category": "Ligas Principales",
    "country": "Honduras",
    "flag": "🇭🇳",
    "keywords": [
      "honduras",
      "hondureño",
      "catracho",
      "olimpia",
      "motagua",
      "real españa",
      "marathon",
      "hondubet",
      "hon.1",
      "honduran liga nacional"
    ]
  },
  {
    "slug": "crc.1",
    "name": "Costa Rican Primera Division",
    "category": "Ligas Principales",
    "country": "Costa Rica",
    "flag": "🇨🇷",
    "keywords": [
      "costa rica",
      "tico",
      "saprissa",
      "alajuelense",
      "promerica",
      "crc.1",
      "costa rican primera division",
      "liga fpd"
    ]
  },
  {
    "slug": "gua.1",
    "name": "Guatemalan Liga Nacional",
    "category": "Ligas Principales",
    "country": "Guatemala",
    "flag": "🇬🇹",
    "keywords": [
      "guatemala",
      "guatemalteco",
      "comunicaciones",
      "municipal",
      "gua.1",
      "guatemalan liga nacional"
    ]
  },
  {
    "slug": "slv.1",
    "name": "Salvadoran Primera Division",
    "category": "Ligas Principales",
    "country": "El Salvador",
    "flag": "🇸🇻",
    "keywords": [
      "el salvador",
      "salvadoreño",
      "alianza fc",
      "fas",
      "aguila",
      "slv.1",
      "salvadoran primera division",
      "salvadoran primera"
    ]
  },
  {
    "slug": "fifa.intercontinental.cup",
    "name": "Intercontinental Cup (India)",
    "category": "Selecciones & FIFA",
    "country": "FIFA / Internacional",
    "flag": "🌍",
    "keywords": [
      "fifa",
      "mundial",
      "world cup",
      "eliminatorias",
      "selecciones",
      "fifa.intercontinental.cup",
      "intercontinental cup (india)"
    ]
  },
  {
    "slug": "afc.saff.championship",
    "name": "SAFF Championship",
    "category": "Torneos Continentales",
    "country": "AFC / Asia",
    "flag": "🌏",
    "keywords": [
      "afc",
      "asia",
      "asian",
      "asiatico",
      "oriente",
      "arabia",
      "japon",
      "corea",
      "china",
      "australia",
      "catar",
      "qatar",
      "afc.saff.championship",
      "saff championship"
    ]
  },
  {
    "slug": "chn.1.promotion.relegation",
    "name": "Chinese Super League Promotion/Relegation Playoffs",
    "category": "Ligas Principales",
    "country": "China",
    "flag": "🇨🇳",
    "keywords": [
      "china",
      "chino",
      "chinese",
      "csl",
      "shanghai",
      "beijing",
      "chn.1.promotion.relegation",
      "chinese super league promotion/relegation playoffs",
      "chinese pro/rel"
    ]
  },
  {
    "slug": "ind.1",
    "name": "Indian Super League",
    "category": "Ligas Principales",
    "country": "India",
    "flag": "🇮🇳",
    "keywords": [
      "india",
      "indian",
      "isl",
      "ind.1",
      "indian super league"
    ]
  },
  {
    "slug": "global.gulf_cup",
    "name": "Arabian Gulf Cup",
    "category": "Torneos Continentales",
    "country": "Internacional / Otros",
    "flag": "🌐",
    "keywords": [
      "internacional",
      "global",
      "qatar",
      "catar",
      "gulf",
      "golfo",
      "arabian gulf cup",
      "global.gulf_cup"
    ]
  },
  {
    "slug": "caf.cosafa",
    "name": "COSAFA Cup",
    "category": "Torneos Continentales",
    "country": "CAF / África",
    "flag": "🌍",
    "keywords": [
      "caf",
      "africa",
      "african",
      "afcon",
      "copa de africa",
      "caf.cosafa",
      "cosafa cup"
    ]
  },
  {
    "slug": "caf.champions",
    "name": "CAF Champions League",
    "category": "Torneos Continentales",
    "country": "CAF / África",
    "flag": "🌍",
    "keywords": [
      "caf",
      "africa",
      "african",
      "afcon",
      "copa de africa",
      "caf.champions",
      "caf champions league"
    ]
  },
  {
    "slug": "caf.confed",
    "name": "CAF Confederation Cup",
    "category": "Torneos Continentales",
    "country": "CAF / África",
    "flag": "🌍",
    "keywords": [
      "caf",
      "africa",
      "african",
      "afcon",
      "copa de africa",
      "caf.confed",
      "caf confederation cup"
    ]
  },
  {
    "slug": "rsa.1",
    "name": "South African Premiership",
    "category": "Ligas Principales",
    "country": "Sudáfrica",
    "flag": "🇿🇦",
    "keywords": [
      "sudafrica",
      "south africa",
      "sundowns",
      "orlando pirates",
      "rsa.1",
      "south african premiership",
      "south african premier"
    ]
  },
  {
    "slug": "usa.ncaa.m.1",
    "name": "NCAA Men's Soccer",
    "category": "Ligas Principales",
    "country": "Estados Unidos",
    "flag": "🇺🇸",
    "keywords": [
      "estados unidos",
      "usa",
      "mls",
      "inter miami",
      "messi",
      "nwsl",
      "usa.ncaa.m.1",
      "ncaa men's soccer",
      "ncaam soccer"
    ]
  },
  {
    "slug": "usa.ncaa.w.1",
    "name": "NCAA Women's Soccer",
    "category": "Ligas Principales",
    "country": "Estados Unidos",
    "flag": "🇺🇸",
    "keywords": [
      "estados unidos",
      "usa",
      "mls",
      "inter miami",
      "messi",
      "nwsl",
      "usa.ncaa.w.1",
      "ncaa women's soccer",
      "ncaaw soccer"
    ]
  },
  {
    "slug": "mex.w.1",
    "name": "Mexican Liga BBVA MX Femenil",
    "category": "Ligas Principales",
    "country": "México",
    "flag": "🇲🇽",
    "keywords": [
      "mexico",
      "mexicano",
      "liga mx",
      "america",
      "chivas",
      "cruz azul",
      "tigres",
      "monterrey",
      "mex.w.1",
      "mexican liga bbva mx femenil",
      "liga mx femenil"
    ]
  }
];
