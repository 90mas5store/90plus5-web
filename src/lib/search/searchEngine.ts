import { Product, Category, League } from '@/lib/types';
import { QuickClub } from '@/types/search';
import { SearchablePlayer } from '@/lib/api';
import { matchPlayers } from './playerMatch';
import { SearchAliasRule, SearchSynonymRule } from './searchSettingsTypes';
import {
    normalizeSearchText,
    tokenizeQuery,
    tokenizeDocument,
    stemSpanish,
    damerauLevenshtein,
    maxTyposForLength,
    buildAdjacentCompounds,
    extractJoinedCompounds,
} from './textUtils';

export type SearchMatchQuality = 'exact' | 'partial' | 'empty';

export interface SearchCorrectedTerm {
    from: string;
    to: string;
}

export interface SearchSuggestedAlternative {
    label: string;
    query: string;
    href: string;
}

export interface ScoredProduct {
    product: Product;
    score: number;
    matchedTokens: string[];
    unmatchedTokens: string[];
    matchedPlayer?: SearchablePlayer;
}

export interface SearchExecutionMeta {
    matchQuality: SearchMatchQuality;
    matchedTokens: string[];
    unmatchedCatalogTokens: string[];
    unmatchedUnknownTokens: string[];
    correctedTerms: SearchCorrectedTerm[];
    suggestedAlternative: SearchSuggestedAlternative | null;
    anchorTerm: string | null;
}

export interface CatalogSearchOutput {
    products: ScoredProduct[];
    totalProducts: number;
    categories: Category[];
    leagues: League[];
    players: SearchablePlayer[];
    matchedClub: QuickClub | null;
    meta: SearchExecutionMeta;
}

interface IndexedField {
    name: string;
    weight: number;
    tokens: string[];
    compoundTokens: Set<string>;
    baseTokenCount: number;
    stems: string[];
    normalizedText: string;
}

interface IndexedProduct {
    product: Product;
    fields: IndexedField[];
    allTokens: Set<string>;
    allStems: Set<string>;
    aliasPhrases: string[];
}

interface IndexedTaxonomy<T> {
    item: T;
    tokens: string[];
    stems: string[];
    normalizedName: string;
    normalizedSlug: string;
}

export interface SearchIndex {
    products: IndexedProduct[];
    categories: IndexedTaxonomy<Category>[];
    leagues: IndexedTaxonomy<League>[];
    clubs: IndexedTaxonomy<QuickClub>[];
    players: SearchablePlayer[];
    aliases: SearchAliasRule[];
    synonyms: SearchSynonymRule[];
    tokenDf: Map<string, number>;
    stemDf: Map<string, number>;
    vocabulary: string[];
    vocabularyStems: Map<string, string>; // stem -> representative raw token
    totalDocs: number;
}

export interface BuildSearchIndexInput {
    products: Product[];
    categories: Category[];
    leagues: League[];
    players: SearchablePlayer[];
    aliases: SearchAliasRule[];
    synonyms?: SearchSynonymRule[];
}

const FIELD_WEIGHTS = {
    team: 10,
    alias: 9.5,
    player: 9,
    model: 8,
    category: 7,
    league: 6.5,
    synonym: 6.5,
    patch: 6,
    brand: 5.5,
    season: 5,
    variant: 4.5,
    slug: 4,
    description: 2.5,
} as const;

function parseSeasonStartYear(season?: string | null): number | null {
    if (!season) return null;
    const match4 = season.match(/\b(19\d{2}|20\d{2})\b/);
    if (match4) return parseInt(match4[1], 10);
    const match2 = season.match(/\b(\d{2})\/(\d{2})\b/);
    if (match2) {
        const y = parseInt(match2[1], 10);
        return y < 50 ? 2000 + y : 1900 + y;
    }
    return null;
}

function makeField(
    name: string,
    weight: number,
    rawParts: Array<string | null | undefined>,
    includeJoinedCompounds = false
): IndexedField {
    const joined = rawParts.filter(Boolean).join(' ');
    const normalizedText = normalizeSearchText(joined);
    const baseTokens = tokenizeDocument(joined);
    const compoundList = includeJoinedCompounds ? extractJoinedCompounds(baseTokens) : [];
    const compoundTokens = new Set(compoundList);
    const tokens = compoundList.length > 0 ? Array.from(new Set([...baseTokens, ...compoundList])) : baseTokens;
    const stems = Array.from(new Set(tokens.map(stemSpanish)));
    return {
        name,
        weight,
        tokens,
        compoundTokens,
        baseTokenCount: baseTokens.length,
        stems,
        normalizedText,
    };
}

function teamMatchesTarget(teamNameNorm: string, targetNorm: string): boolean {
    if (!teamNameNorm || !targetNorm) return false;
    if (teamNameNorm === targetNorm) return true;
    const teamWords = teamNameNorm.split(/\s+/);
    const targetWords = targetNorm.split(/\s+/);
    // Coincide si todas las palabras del target aparecen en el equipo (ej. "america" en "club america")
    return targetWords.every((tw) => teamWords.some((w) => w === tw));
}

function localizeVariantVersion(version: string): string {
    const lower = normalizeSearchText(version);
    if (lower.includes('player')) return `${version} jugador`;
    if (lower.includes('fan')) return `${version} aficionado`;
    return version;
}

/**
 * Construye el índice de búsqueda unificado en memoria (se ejecuta una sola vez por carga de catálogo).
 */
export function buildSearchIndex(input: BuildSearchIndexInput): SearchIndex {
    const { products, categories, leagues, players, aliases, synonyms = [] } = input;
    const activeAliases = (aliases || []).filter((a) => a.active && a.targetTeam.trim() && a.aliases.length > 0);
    const activeSynonyms = (synonyms || []).filter((s) => s.active && s.targetTerm.trim() && s.synonyms.length > 0);

    const parsedSynonyms = activeSynonyms.map((rule) => {
        const targetTokens = tokenizeDocument(rule.targetTerm);
        const targetStems = targetTokens.map(stemSpanish);
        return { rule, targetTokens, targetStems };
    });

    const matchSynonymsForTokens = (tokens: Set<string>, stems: Set<string>): string[] => {
        if (parsedSynonyms.length === 0) return [];
        const matched: string[] = [];
        for (const entry of parsedSynonyms) {
            if (entry.targetTokens.length === 0) continue;
            const hits = entry.targetTokens.every(
                (t, idx) => tokens.has(t) || (entry.targetStems[idx].length >= 3 && stems.has(entry.targetStems[idx]))
            );
            if (hits) {
                matched.push(...entry.rule.synonyms);
            }
        }
        return matched;
    };

    const categoryById = new Map<string, Category>();
    for (const c of categories) categoryById.set(c.id, c);

    const leagueById = new Map<string, League>();
    for (const l of leagues) leagueById.set(l.id, l);

    const playersByProductId = new Map<string, SearchablePlayer[]>();
    for (const pl of players) {
        for (const pid of pl.productIds) {
            const list = playersByProductId.get(pid) || [];
            list.push(pl);
            playersByProductId.set(pid, list);
        }
    }

    const currentYear = new Date().getFullYear();
    const tokenDf = new Map<string, number>();
    const stemDf = new Map<string, number>();
    const vocabularyStems = new Map<string, string>();
    const clubMap = new Map<string, { count: number; logoUrl?: string; aliasTexts: string[] }>();

    const indexedProducts: IndexedProduct[] = products.map((p) => {
        const teamNorm = normalizeSearchText(p.equipo);
        const matchedAliasPhrases: string[] = [];

        if (teamNorm) {
            for (const rule of activeAliases) {
                const targetNorm = normalizeSearchText(rule.targetTeam);
                if (teamMatchesTarget(teamNorm, targetNorm)) {
                    for (const alias of rule.aliases) {
                        const aNorm = normalizeSearchText(alias);
                        if (aNorm) matchedAliasPhrases.push(aNorm);
                    }
                }
            }
        }

        // Acumular clubes para Club Hero
        if (p.equipo && p.equipo !== 'Sin equipo') {
            const prev = clubMap.get(p.equipo) || { count: 0, logoUrl: p.logoEquipo, aliasTexts: [] };
            clubMap.set(p.equipo, {
                count: prev.count + 1,
                logoUrl: p.logoEquipo || prev.logoUrl,
                aliasTexts: prev.aliasTexts.length > 0 ? prev.aliasTexts : matchedAliasPhrases,
            });
        }

        const cat = p.category_id ? categoryById.get(p.category_id) : undefined;
        const leagueIds = Array.from(new Set([...(p.league_ids || []), ...(p.league_id ? [p.league_id] : [])]));
        const prodLeagues = leagueIds.map((id) => leagueById.get(id)).filter(Boolean) as League[];
        const prodPlayers = playersByProductId.get(p.id) || [];

        const seasonYear = parseSeasonStartYear(p.season);
        const isVintageSeason = seasonYear !== null && seasonYear <= currentYear - 5;

        const variantTexts = (p.product_variants || [])
            .filter((v) => v.active !== false)
            .map((v) => localizeVariantVersion(v.version));

        const baseFields: IndexedField[] = [
            makeField('team', FIELD_WEIGHTS.team, [p.equipo], true),
            makeField('alias', FIELD_WEIGHTS.alias, matchedAliasPhrases, true),
            makeField(
                'player',
                FIELD_WEIGHTS.player,
                prodPlayers.map((pl) => `${pl.name} ${pl.number}`)
            ),
            makeField('model', FIELD_WEIGHTS.model, [p.modelo], true),
            makeField(
                'category',
                FIELD_WEIGHTS.category,
                [cat?.nombre, cat?.slug, isVintageSeason ? 'retro vintage clasico' : null],
                true
            ),
            makeField(
                'league',
                FIELD_WEIGHTS.league,
                prodLeagues.flatMap((l) => [l.nombre, l.slug]),
                true
            ),
            makeField('patch', FIELD_WEIGHTS.patch, p.patch_names || []),
            makeField('brand', FIELD_WEIGHTS.brand, [p.brand_name]),
            makeField('season', FIELD_WEIGHTS.season, [p.season]),
            makeField('variant', FIELD_WEIGHTS.variant, variantTexts),
            makeField('slug', FIELD_WEIGHTS.slug, [p.slug]),
            makeField('description', FIELD_WEIGHTS.description, [p.description]),
        ].filter((f) => f.tokens.length > 0);

        // Evaluar sinónimos generales administrados en /admin (ej. "dama" -> "femenina", "away" -> "visitante")
        const attributeTokens = new Set<string>();
        const attributeStems = new Set<string>();
        for (const f of baseFields) {
            if (f.name === 'team' || f.name === 'alias' || f.name === 'player' || f.name === 'description') continue;
            for (const t of f.tokens) attributeTokens.add(t);
            for (const st of f.stems) attributeStems.add(st);
        }
        const matchedSynonyms = matchSynonymsForTokens(attributeTokens, attributeStems);
        const fields =
            matchedSynonyms.length > 0
                ? [...baseFields, makeField('synonym', FIELD_WEIGHTS.synonym, matchedSynonyms)]
                : baseFields;

        const allTokens = new Set<string>();
        const allStems = new Set<string>();

        for (const f of fields) {
            for (const t of f.tokens) {
                allTokens.add(t);
                const st = stemSpanish(t);
                allStems.add(st);
                if (!vocabularyStems.has(st)) {
                    vocabularyStems.set(st, t);
                }
            }
        }

        for (const t of allTokens) {
            tokenDf.set(t, (tokenDf.get(t) || 0) + 1);
        }
        for (const st of allStems) {
            stemDf.set(st, (stemDf.get(st) || 0) + 1);
        }

        return {
            product: p,
            fields,
            allTokens,
            allStems,
            aliasPhrases: matchedAliasPhrases,
        };
    });

    const indexedCategories: IndexedTaxonomy<Category>[] = categories.map((c) => {
        const baseTokens = tokenizeDocument(`${c.nombre} ${c.slug}`);
        const baseStems = new Set(baseTokens.map(stemSpanish));
        const synTokens = matchSynonymsForTokens(new Set(baseTokens), baseStems).flatMap((s) => tokenizeDocument(s));
        const tokens = Array.from(new Set([...baseTokens, ...extractJoinedCompounds(baseTokens), ...synTokens]));
        return {
            item: c,
            tokens,
            stems: Array.from(new Set(tokens.map(stemSpanish))),
            normalizedName: normalizeSearchText(c.nombre),
            normalizedSlug: normalizeSearchText(c.slug),
        };
    });

    const indexedLeagues: IndexedTaxonomy<League>[] = leagues.map((l) => {
        const baseTokens = tokenizeDocument(`${l.nombre} ${l.slug}`);
        const baseStems = new Set(baseTokens.map(stemSpanish));
        const synTokens = matchSynonymsForTokens(new Set(baseTokens), baseStems).flatMap((s) => tokenizeDocument(s));
        const tokens = Array.from(new Set([...baseTokens, ...extractJoinedCompounds(baseTokens), ...synTokens]));
        return {
            item: l,
            tokens,
            stems: Array.from(new Set(tokens.map(stemSpanish))),
            normalizedName: normalizeSearchText(l.nombre),
            normalizedSlug: normalizeSearchText(l.slug),
        };
    });

    const indexedClubs: IndexedTaxonomy<QuickClub>[] = Array.from(clubMap.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .map(([name, data]) => {
            const club: QuickClub = {
                name,
                logoUrl: data.logoUrl,
                query: name,
                count: data.count,
            };
            const nameTokens = tokenizeDocument(name);
            const aliasTokens = tokenizeDocument(data.aliasTexts.join(' '));
            const tokens = Array.from(
                new Set([...nameTokens, ...extractJoinedCompounds(nameTokens), ...aliasTokens])
            );
            return {
                item: club,
                tokens,
                stems: Array.from(new Set(tokens.map(stemSpanish))),
                normalizedName: normalizeSearchText(name),
                normalizedSlug: normalizeSearchText(data.aliasTexts.join(' ')),
            };
        });

    // Añadir tokens de categorías y ligas al vocabulario para compounds / correcciones
    for (const c of indexedCategories) {
        for (const t of c.tokens) {
            if (!tokenDf.has(t)) tokenDf.set(t, 1);
            const st = stemSpanish(t);
            if (!stemDf.has(st)) stemDf.set(st, 1);
            if (!vocabularyStems.has(st)) vocabularyStems.set(st, t);
        }
    }
    for (const l of indexedLeagues) {
        for (const t of l.tokens) {
            if (!tokenDf.has(t)) tokenDf.set(t, 1);
            const st = stemSpanish(t);
            if (!stemDf.has(st)) stemDf.set(st, 1);
            if (!vocabularyStems.has(st)) vocabularyStems.set(st, t);
        }
    }

    return {
        products: indexedProducts,
        categories: indexedCategories,
        leagues: indexedLeagues,
        clubs: indexedClubs,
        players,
        aliases: activeAliases,
        synonyms: activeSynonyms,
        tokenDf,
        stemDf,
        vocabulary: Array.from(tokenDf.keys()),
        vocabularyStems,
        totalDocs: Math.max(products.length, 1),
    };
}

interface TokenMatchDetail {
    quality: number;
    matchedWord: string;
    isFuzzy: boolean;
    isExactOrStem: boolean;
}

/**
 * Compara un token de búsqueda contra la lista de tokens/stems de un campo.
 */
function matchTokenAgainstField(
    qToken: string,
    qStem: string,
    fieldTokens: string[],
    fieldStems: string[]
): TokenMatchDetail | null {
    // 1. Coincidencia exacta
    for (const dt of fieldTokens) {
        if (dt === qToken) {
            return { quality: 1.0, matchedWord: dt, isFuzzy: false, isExactOrStem: true };
        }
    }

    // 2. Coincidencia exacta por raíz morfológica (femenino <-> femenina <-> femenil, niño <-> niños)
    if (qToken.length >= 4) {
        for (let i = 0; i < fieldStems.length; i++) {
            if (fieldStems[i] === qStem && qStem.length >= 3) {
                return {
                    quality: 0.95,
                    matchedWord: fieldTokens[i] || fieldStems[i],
                    isFuzzy: false,
                    isExactOrStem: true,
                };
            }
        }
    }

    // 3. Coincidencia por prefijo (ej: "barc" -> "barcelona", "motag" -> "motagua")
    let bestPrefix: TokenMatchDetail | null = null;
    if (qToken.length >= 2) {
        for (const dt of fieldTokens) {
            if (dt.startsWith(qToken)) {
                const ratio = qToken.length / dt.length;
                const quality = 0.78 + 0.14 * ratio;
                if (!bestPrefix || quality > bestPrefix.quality) {
                    bestPrefix = { quality, matchedWord: dt, isFuzzy: false, isExactOrStem: false };
                }
            }
        }
        if (bestPrefix) return bestPrefix;
    }

    // 4. Tolerancia ortográfica (Damerau-Levenshtein) solo para palabras >= 4 letras
    const maxDist = maxTyposForLength(qToken.length);
    if (maxDist === 0) return null;

    let bestFuzzy: TokenMatchDetail | null = null;
    for (const dt of fieldTokens) {
        if (dt.length < 4) continue;
        // Evitar emparejar números con palabras o números distintos
        if (/^\d+$/.test(qToken) || /^\d+$/.test(dt)) continue;

        const dist = damerauLevenshtein(qToken, dt, maxDist);
        if (dist <= maxDist) {
            const quality = dist === 1 ? 0.72 : 0.56;
            if (!bestFuzzy || quality > bestFuzzy.quality) {
                bestFuzzy = { quality, matchedWord: dt, isFuzzy: true, isExactOrStem: false };
            }
            continue;
        }

        // También permitir distancia 1 entre raíces para casos combinados (typo + género, ej. "femenio" -> "femenina")
        if (qStem.length >= 4) {
            const dtStem = stemSpanish(dt);
            if (dtStem.length >= 4) {
                const stemDist = damerauLevenshtein(qStem, dtStem, 1);
                if (stemDist <= 1) {
                    const quality = 0.68;
                    if (!bestFuzzy || quality > bestFuzzy.quality) {
                        bestFuzzy = { quality, matchedWord: dt, isFuzzy: true, isExactOrStem: false };
                    }
                }
            }
        }
    }

    return bestFuzzy;
}

/**
 * Busca si un candidato (ej. bigrama unido "mota"+"gua" = "motagua") existe en el vocabulario del catálogo.
 */
function resolveVocabularyMatch(word: string, index: SearchIndex): { word: string; exact: boolean } | null {
    if (index.tokenDf.has(word)) {
        return { word, exact: true };
    }
    const stem = stemSpanish(word);
    if (index.stemDf.has(stem)) {
        return { word: index.vocabularyStems.get(stem) || word, exact: true };
    }
    if (word.length >= 5) {
        for (const v of index.vocabulary) {
            if (v.startsWith(word) && v.length - word.length <= 3) {
                return { word: v, exact: false };
            }
        }
        for (const v of index.vocabulary) {
            if (v.length >= 5 && damerauLevenshtein(word, v, 1) <= 1) {
                return { word: v, exact: false };
            }
        }
    }
    return null;
}

/**
 * Determina si un token existe (exacto, stem, prefijo >= 3 o fuzzy dist 1) en el catálogo.
 */
function tokenExistsInCatalog(token: string, index: SearchIndex): { exists: boolean; bestMatch?: string } {
    if (index.tokenDf.has(token)) return { exists: true, bestMatch: token };
    const st = stemSpanish(token);
    if (token.length >= 4 && index.stemDf.has(st)) {
        return { exists: true, bestMatch: index.vocabularyStems.get(st) || token };
    }
    if (token.length >= 3) {
        for (const v of index.vocabulary) {
            if (v.startsWith(token)) return { exists: true, bestMatch: v };
        }
    }
    const maxDist = maxTyposForLength(token.length);
    if (maxDist > 0 && !/^\d+$/.test(token)) {
        for (const v of index.vocabulary) {
            if (v.length < 4 || /^\d+$/.test(v)) continue;
            if (damerauLevenshtein(token, v, maxDist) <= maxDist) {
                return { exists: true, bestMatch: v };
            }
        }
    }
    return { exists: false };
}

/**
 * Resuelve bigramas adyacentes separados por accidente (ej. "mota gua" -> "motagua").
 */
function resolveQueryTokens(
    rawTokens: string[],
    index: SearchIndex
): { tokens: string[]; correctedTerms: SearchCorrectedTerm[] } {
    const correctedTerms: SearchCorrectedTerm[] = [];
    if (rawTokens.length < 2) {
        return { tokens: rawTokens, correctedTerms };
    }

    const compounds = buildAdjacentCompounds(rawTokens);
    const consumed = new Set<number>();
    const result: string[] = [];

    for (let i = 0; i < rawTokens.length; i++) {
        if (consumed.has(i)) continue;

        const compound = compounds.find((c) => c.startIndex === i);
        if (compound) {
            const leftExists = index.tokenDf.has(rawTokens[i]) || index.stemDf.has(stemSpanish(rawTokens[i]));
            const rightExists = index.tokenDf.has(rawTokens[i + 1]) || index.stemDf.has(stemSpanish(rawTokens[i + 1]));

            // Si ambas partes NO existen independientemente como palabras exactas, probar la unión
            if (!(leftExists && rightExists)) {
                const vocabMatch = resolveVocabularyMatch(compound.joined, index);
                if (vocabMatch) {
                    result.push(vocabMatch.word);
                    consumed.add(i);
                    consumed.add(i + 1);
                    correctedTerms.push({ from: compound.original, to: vocabMatch.word });
                    continue;
                }
            }
        }

        result.push(rawTokens[i]);
    }

    return { tokens: result, correctedTerms };
}

function matchTaxonomyList<T>(
    items: IndexedTaxonomy<T>[],
    tokens: string[],
    stems: string[],
    normalizedQuery: string,
    limit: number
): T[] {
    const scored: { item: T; score: number }[] = [];

    for (const entry of items) {
        if (entry.tokens.length === 0) continue;

        let matched = 0;
        let qualitySum = 0;

        for (let i = 0; i < tokens.length; i++) {
            const m = matchTokenAgainstField(tokens[i], stems[i], entry.tokens, entry.stems);
            if (m) {
                matched++;
                qualitySum += m.quality;
            }
        }

        if (matched === 0) continue;

        const queryCoverage = matched / tokens.length;
        const entityCoverage = matched / entry.tokens.length;

        // Exigir buena cobertura sobre la taxonomía o sobre la consulta
        const isDirectSubstring =
            normalizedQuery.length >= 3 &&
            (entry.normalizedName.includes(normalizedQuery) || entry.normalizedSlug.includes(normalizedQuery));

        if (!isDirectSubstring && queryCoverage < 0.5 && entityCoverage < 0.6) continue;
        // Para consultas de 1 palabra, exigir coincidencia completa de ese token
        if (tokens.length === 1 && matched < 1) continue;

        let score = qualitySum * (0.5 + 0.5 * entityCoverage);
        if (entry.normalizedName === normalizedQuery) score += 5;
        else if (isDirectSubstring) score += 2;
        if (queryCoverage === 1) score += 2;

        scored.push({ item: entry.item, score });
    }

    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((s) => s.item);
}

/**
 * Ejecuta una búsqueda completa, tolerante a errores humanos y sin hardcoding sobre el índice.
 */
export function searchCatalog(
    index: SearchIndex,
    rawQuery: string,
    options: { productLimit?: number; categoryLimit?: number; leagueLimit?: number; playerLimit?: number } = {}
): CatalogSearchOutput {
    const {
        productLimit = 500,
        categoryLimit = 3,
        leagueLimit = 3,
        playerLimit = 3,
    } = options;

    const trimmed = (rawQuery || '').trim();
    const normalizedFull = normalizeSearchText(trimmed);

    if (trimmed.length < 2 || !normalizedFull) {
        return {
            products: [],
            totalProducts: 0,
            categories: [],
            leagues: [],
            players: [],
            matchedClub: null,
            meta: {
                matchQuality: 'empty',
                matchedTokens: [],
                unmatchedCatalogTokens: [],
                unmatchedUnknownTokens: [],
                correctedTerms: [],
                suggestedAlternative: null,
                anchorTerm: null,
            },
        };
    }

    // 1. Tokenizar y resolver bigramas separados por accidente ("mota gua" -> "motagua")
    const rawTokens = tokenizeQuery(trimmed);
    const { tokens, correctedTerms } = resolveQueryTokens(rawTokens, index);
    const stems = tokens.map(stemSpanish);

    // Intención de destacados / más vendidas (ej. chip rápido "más vendidas")
    const isFeaturedIntent =
        normalizedFull === 'featured' ||
        normalizedFull.includes('mas vendid') ||
        normalizedFull.includes('populares') ||
        normalizedFull.includes('destacad') ||
        normalizedFull.includes('top seller');

    // 2. Match de Jugadores (tolerante a typos + dorsal)
    const matchedPlayers = matchPlayers(index.players, trimmed, playerLimit);
    const playerByProductId = new Map<string, SearchablePlayer>();
    for (const pl of matchedPlayers) {
        for (const pid of pl.productIds) {
            if (!playerByProductId.has(pid)) {
                playerByProductId.set(pid, pl);
            }
        }
    }

    // 3. Match de Categorías y Ligas
    const matchedCategories = matchTaxonomyList(index.categories, tokens, stems, normalizedFull, categoryLimit);
    const matchedLeagues = matchTaxonomyList(index.leagues, tokens, stems, normalizedFull, leagueLimit);

    // 4. Clasificar qué tokens de la consulta existen en el catálogo vs. palabras desconocidas/ruido (df === 0)
    const catalogTokenFlags = tokens.map((t) => tokenExistsInCatalog(t, index));
    const catalogTokenCount = catalogTokenFlags.filter((f) => f.exists).length;

    // 5. Evaluar y puntuar cada producto del índice
    const idfCache = new Map<string, number>();
    const getIdf = (token: string, stem: string): number => {
        const key = stem || token;
        const cached = idfCache.get(key);
        if (cached !== undefined) return cached;
        const df = index.stemDf.get(stem) ?? index.tokenDf.get(token) ?? 0;
        const idf = Math.log(1 + index.totalDocs / (1 + df));
        idfCache.set(key, idf);
        return idf;
    };

    const maxPossibleIdf = Math.log(1 + index.totalDocs);

    interface InternalCandidate {
        indexed: IndexedProduct;
        score: number;
        matchedTokens: string[];
        unmatchedTokens: string[];
        matchedCatalogCount: number;
        bestFieldCoverage: number;
        strongTokenMatch: boolean;
        hasPrimaryEntityMatch: boolean;
        topMatchedToken: string | null;
        topTokenScore: number;
        matchedPlayer?: SearchablePlayer;
        fuzzyCorrections: SearchCorrectedTerm[];
    }

    const candidates: InternalCandidate[] = [];

    for (const doc of index.products) {
        const matchedPlayer = playerByProductId.get(doc.product.id);

        // Si el usuario buscó explícitamente "más vendidas" / "destacados"
        if (isFeaturedIntent && doc.product.destacado) {
            candidates.push({
                indexed: doc,
                score: 50,
                matchedTokens: [...tokens],
                unmatchedTokens: [],
                matchedCatalogCount: Math.max(catalogTokenCount, 1),
                bestFieldCoverage: 1,
                strongTokenMatch: true,
                hasPrimaryEntityMatch: false,
                topMatchedToken: tokens[0] || null,
                topTokenScore: 50,
                matchedPlayer,
                fuzzyCorrections: [],
            });
            continue;
        }

        // Comprobar si algún alias multi-palabra configurado en Admin está contenido en la consulta
        // (ej. "rey de copas", "red devils", "man u", "paris saint germain")
        const multiWordAliasMatchedTokens = new Set<string>();
        let multiWordAliasBonus = 0;
        for (const phrase of doc.aliasPhrases) {
            if (phrase.includes(' ') && normalizedFull.includes(phrase)) {
                const phraseTokens = tokenizeQuery(phrase);
                for (const pt of phraseTokens) multiWordAliasMatchedTokens.add(pt);
                multiWordAliasBonus += FIELD_WEIGHTS.alias * 1.4;
            }
        }

        let totalScore = multiWordAliasBonus;
        const matchedTokens: string[] = [];
        const unmatchedTokens: string[] = [];
        let matchedCatalogCount = 0;
        let strongTokenMatch = multiWordAliasBonus > 0 || Boolean(matchedPlayer);
        let hasPrimaryEntityMatch = multiWordAliasBonus > 0 || Boolean(matchedPlayer);
        let topMatchedToken: string | null = null;
        let topTokenScore = 0;
        const fuzzyCorrections: SearchCorrectedTerm[] = [];

        // Rastrear cuántos tokens de cada campo fueron cubiertos (para Precision Guard)
        const fieldHits = new Map<string, { matched: Set<string>; total: number; weight: number }>();

        for (let i = 0; i < tokens.length; i++) {
            const qt = tokens[i];
            const qst = stems[i];

            if (multiWordAliasMatchedTokens.has(qt)) {
                matchedTokens.push(qt);
                if (catalogTokenFlags[i].exists) matchedCatalogCount++;
                continue;
            }

            let bestScoreForToken = 0;
            let bestField: IndexedField | null = null;
            let bestDetail: TokenMatchDetail | null = null;

            for (const field of doc.fields) {
                const detail = matchTokenAgainstField(qt, qst, field.tokens, field.stems);
                if (!detail) continue;

                const normIdf = maxPossibleIdf > 0 ? getIdf(qt, qst) / maxPossibleIdf : 1;
                const score = field.weight * detail.quality * (0.55 + 0.45 * normIdf);

                if (score > bestScoreForToken) {
                    bestScoreForToken = score;
                    bestField = field;
                    bestDetail = detail;
                }
            }

            if (bestField && bestDetail) {
                matchedTokens.push(qt);
                if (catalogTokenFlags[i].exists) matchedCatalogCount++;
                totalScore += bestScoreForToken;

                if (bestScoreForToken > topTokenScore) {
                    topTokenScore = bestScoreForToken;
                    topMatchedToken = qt;
                }

                const isStrong =
                    bestDetail.isExactOrStem ||
                    (!bestDetail.isFuzzy && qt.length >= 3) ||
                    (bestDetail.isFuzzy && bestDetail.quality >= 0.7 && qt.length >= 5);

                if (isStrong) {
                    strongTokenMatch = true;
                    if (bestField.name === 'team' || bestField.name === 'alias' || bestField.name === 'player') {
                        hasPrimaryEntityMatch = true;
                    }
                }

                if (bestDetail.isFuzzy && bestDetail.matchedWord !== qt) {
                    fuzzyCorrections.push({ from: qt, to: bestDetail.matchedWord });
                }

                const hitEntry = fieldHits.get(bestField.name) || {
                    matched: new Set<string>(),
                    total: bestField.baseTokenCount || bestField.tokens.length,
                    weight: bestField.weight,
                };
                if (bestField.compoundTokens.has(bestDetail.matchedWord)) {
                    // Un token pegado (ej. "realmadrid" o "parissaintgermain") cubre la entidad completa
                    hitEntry.matched.add(bestDetail.matchedWord);
                    hitEntry.total = Math.min(hitEntry.total, hitEntry.matched.size);
                } else {
                    hitEntry.matched.add(bestDetail.matchedWord);
                }
                fieldHits.set(bestField.name, hitEntry);
            } else {
                unmatchedTokens.push(qt);
            }
        }

        // Bonus si el producto coincide por jugador asignado
        if (matchedPlayer) {
            totalScore += FIELD_WEIGHTS.player * 1.6;
            // Considerar cubiertos los tokens del nombre/dorsal del jugador
            const playerTokens = tokenizeDocument(`${matchedPlayer.name} ${matchedPlayer.number}`);
            for (const ut of [...unmatchedTokens]) {
                if (playerTokens.some((pt) => pt.startsWith(ut) || ut === pt)) {
                    matchedTokens.push(ut);
                    unmatchedTokens.splice(unmatchedTokens.indexOf(ut), 1);
                }
            }
        }

        if (matchedTokens.length === 0) continue;

        // Calcular la mejor cobertura sobre un campo estructurado principal (Precision Guard)
        let bestFieldCoverage = 0;
        for (const [, hit] of fieldHits) {
            const cov = hit.total > 0 ? hit.matched.size / hit.total : 0;
            if (cov > bestFieldCoverage) bestFieldCoverage = cov;
        }
        if (matchedPlayer || multiWordAliasBonus > 0) {
            bestFieldCoverage = Math.max(bestFieldCoverage, 1);
        }

        // Bonus por frase contigua en equipo + modelo
        const fullTitle = normalizeSearchText(`${doc.product.equipo} ${doc.product.modelo}`);
        if (normalizedFull.length >= 3 && fullTitle.includes(normalizedFull)) {
            totalScore += 8;
        }

        // Bonus ligero por cobertura de consulta
        const queryCoverage = matchedTokens.length / tokens.length;
        totalScore *= 0.65 + 0.35 * queryCoverage;

        candidates.push({
            indexed: doc,
            score: totalScore,
            matchedTokens,
            unmatchedTokens,
            matchedCatalogCount,
            bestFieldCoverage,
            strongTokenMatch,
            hasPrimaryEntityMatch,
            topMatchedToken,
            topTokenScore,
            matchedPlayer,
            fuzzyCorrections,
        });
    }

    // 6. Clasificación en Niveles (Tier 1 Exacto -> Tier 2 Relajación Inteligente -> Tier 3 Vacío)
    const allUnmatchedAreUnknown = (c: InternalCandidate) =>
        c.unmatchedTokens.every((ut) => {
            const idx = tokens.indexOf(ut);
            return idx !== -1 && !catalogTokenFlags[idx].exists;
        });

    // Tier 1A: Coinciden TODOS los tokens escritos
    const fullMatches = candidates
        .filter((c) => c.unmatchedTokens.length === 0 && c.strongTokenMatch)
        .sort((a, b) => b.score - a.score);

    // Tier 1B: Todos los tokens que SÍ existen en el catálogo coincidieron, y los restantes son
    // palabras de relleno que no existen en el índice (ej. "camisa" en "camisa del mota gua" o "camiseta" en "camiseta manga larga")
    // Con Precision Guard: exigir cobertura >= 50% del campo principal para bloquear ruido (ej. "saint kitts" vs "Paris Saint-Germain")
    const cleanNoiseMatches =
        fullMatches.length > 0
            ? []
            : candidates
                  .filter(
                      (c) =>
                          catalogTokenCount > 0 &&
                          c.matchedCatalogCount === catalogTokenCount &&
                          allUnmatchedAreUnknown(c) &&
                          c.strongTokenMatch &&
                          c.bestFieldCoverage >= 0.5
                  )
                  .sort((a, b) => b.score - a.score);

    const tier1 = fullMatches.length > 0 ? fullMatches : cleanNoiseMatches;

    let selected: InternalCandidate[] = [];
    let matchQuality: SearchMatchQuality = 'empty';
    let anchorTerm: string | null = null;

    if (tier1.length > 0) {
        selected = tier1;
        matchQuality = 'exact';
    } else if (tokens.length >= 2 && candidates.length > 0) {
        // Tier 2: Relajación progresiva con Precision Guard
        // Aceptar candidatos fuertes cuya coincidencia sea significativa:
        // - Si los no coincidentes son atributos reales del catálogo (ej. "femenino", "niño", "manga larga"),
        //   priorizar los productos que cubren el token ancla de mayor peso/especificidad (ej. "america", "boca", "river").
        // - Si los no coincidentes son desconocidos (df === 0), exigir cobertura de campo >= 0.5 (bloquea "saint kitts" -> PSG).
        const validPartials = candidates
            .filter((c) => {
                if (!c.strongTokenMatch) return false;
                const hasUnmatchedCatalogToken = c.unmatchedTokens.some((ut) => {
                    const idx = tokens.indexOf(ut);
                    return idx !== -1 && catalogTokenFlags[idx].exists;
                });
                if (!hasUnmatchedCatalogToken && c.bestFieldCoverage < 0.5) {
                    return false;
                }
                return true;
            })
            .sort((a, b) => {
                // Primero priorizar coincidencia en entidad principal (equipo / alias / jugador),
                // luego mayor cantidad de tokens del catálogo cubiertos y puntaje ponderado por IDF.
                if (a.hasPrimaryEntityMatch !== b.hasPrimaryEntityMatch) {
                    return a.hasPrimaryEntityMatch ? -1 : 1;
                }
                if (b.matchedCatalogCount !== a.matchedCatalogCount) {
                    return b.matchedCatalogCount - a.matchedCatalogCount;
                }
                return b.score - a.score;
            });

        if (validPartials.length > 0) {
            const topCandidate = validPartials[0];
            anchorTerm = topCandidate.topMatchedToken;

            // Anclar resultados parciales al token principal ganador (ej. en "boca niño", mostrar solo Boca Juniors
            // en lugar de mezclar 20 camisas de otros equipos que solo tienen "niño").
            selected = anchorTerm
                ? validPartials.filter((c) => c.matchedTokens.includes(anchorTerm!))
                : validPartials;

            // Verificar si realmente faltó algún atributo del catálogo o solo ruido
            const topUnmatchedCatalog = topCandidate.unmatchedTokens.filter((ut) => {
                const idx = tokens.indexOf(ut);
                return idx !== -1 && catalogTokenFlags[idx].exists;
            });

            matchQuality = topUnmatchedCatalog.length > 0 ? 'partial' : 'exact';
        }
    }

    // 7. Construir metadatos de salida (correcciones, tokens no coincidentes, alternativa de 1 toque)
    const finalCorrected: SearchCorrectedTerm[] = [...correctedTerms];
    if (selected.length > 0) {
        for (const fc of selected[0].fuzzyCorrections) {
            if (!finalCorrected.some((c) => c.from === fc.from)) {
                finalCorrected.push(fc);
            }
        }
    }

    const representative = selected[0];
    const matchedTokensOut = representative ? representative.matchedTokens : [];
    const unmatchedCatalogTokens = representative
        ? representative.unmatchedTokens.filter((ut) => {
              const idx = tokens.indexOf(ut);
              return idx !== -1 && catalogTokenFlags[idx].exists;
          })
        : tokens.filter((_, i) => catalogTokenFlags[i].exists);

    const unmatchedUnknownTokens = representative
        ? representative.unmatchedTokens.filter((ut) => {
              const idx = tokens.indexOf(ut);
              return idx !== -1 && !catalogTokenFlags[idx].exists;
          })
        : tokens.filter((_, i) => !catalogTokenFlags[i].exists);

    // Sugerencia alternativa de 1 toque si hubo un atributo del catálogo que no existía para ese club
    // (ej. buscó "boca niño" -> mostramos Boca Juniors + chip "Ver colección Niños")
    let suggestedAlternative: SearchSuggestedAlternative | null = null;
    if (matchQuality === 'partial' && unmatchedCatalogTokens.length > 0) {
        const unmatchedQuery = unmatchedCatalogTokens.join(' ');
        const unmatchedStems = unmatchedCatalogTokens.map(stemSpanish);

        const altCats = matchTaxonomyList(index.categories, unmatchedCatalogTokens, unmatchedStems, unmatchedQuery, 1);
        if (altCats.length > 0) {
            suggestedAlternative = {
                label: `Ver colección ${altCats[0].nombre}`,
                query: altCats[0].nombre,
                href: `/catalogo?categoria=${encodeURIComponent(altCats[0].slug)}`,
            };
        } else {
            const altLeagues = matchTaxonomyList(index.leagues, unmatchedCatalogTokens, unmatchedStems, unmatchedQuery, 1);
            if (altLeagues.length > 0) {
                suggestedAlternative = {
                    label: `Ver liga ${altLeagues[0].nombre}`,
                    query: altLeagues[0].nombre,
                    href: `/catalogo?liga=${encodeURIComponent(altLeagues[0].slug)}`,
                };
            } else {
                suggestedAlternative = {
                    label: `Ver prendas "${unmatchedQuery}"`,
                    query: unmatchedQuery,
                    href: `/catalogo?query=${encodeURIComponent(unmatchedQuery)}`,
                };
            }
        }
    }

    // 8. Detectar Club Hero (solo si realmente hay resultados para evitar contradicción con Sin Resultados)
    let matchedClub: QuickClub | null = null;
    if (selected.length > 0) {
        const clubMatches = matchTaxonomyList(index.clubs, tokens, stems, normalizedFull, 1);
        if (clubMatches.length > 0) {
            matchedClub = clubMatches[0];
        } else {
            // Si los resultados principales pertenecen mayoritariamente a un mismo club
            const topTeam = selected[0].indexed.product.equipo;
            if (topTeam) {
                const sameTeamCount = selected.slice(0, 5).filter((c) => c.indexed.product.equipo === topTeam).length;
                if (sameTeamCount >= Math.min(2, selected.length)) {
                    const foundClub = index.clubs.find((cl) => cl.item.name === topTeam);
                    if (foundClub) matchedClub = foundClub.item;
                }
            }
        }
    }

    const totalProducts = selected.length;
    const slicedProducts: ScoredProduct[] = selected.slice(0, productLimit).map((c) => ({
        product: c.indexed.product,
        score: c.score,
        matchedTokens: c.matchedTokens,
        unmatchedTokens: c.unmatchedTokens,
        matchedPlayer: c.matchedPlayer,
    }));

    return {
        products: slicedProducts,
        totalProducts,
        categories: matchedCategories,
        leagues: matchedLeagues,
        players: matchedPlayers,
        matchedClub,
        meta: {
            matchQuality: totalProducts > 0 || matchedCategories.length > 0 || matchedLeagues.length > 0 || matchedPlayers.length > 0
                ? matchQuality === 'empty'
                    ? 'exact'
                    : matchQuality
                : 'empty',
            matchedTokens: matchedTokensOut,
            unmatchedCatalogTokens,
            unmatchedUnknownTokens,
            correctedTerms: finalCorrected,
            suggestedAlternative,
            anchorTerm,
        },
    };
}
