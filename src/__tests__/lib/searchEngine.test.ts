import { describe, it, expect } from 'vitest';
import { buildSearchIndex, searchCatalog } from '@/lib/search/searchEngine';
import { DEFAULT_SEARCH_SETTINGS } from '@/lib/search/searchSettingsTypes';
import { Product, Category, League } from '@/lib/types';
import { SearchablePlayer } from '@/lib/api';

const categories: Category[] = [
    { id: 'cat-futbol', nombre: 'Fútbol', slug: 'futbol', order: 1 },
    { id: 'cat-femenina', nombre: 'Femenina', slug: 'femenina', order: 2 },
    { id: 'cat-ninos', nombre: 'Niños', slug: 'ninos', order: 3 },
    { id: 'cat-retro', nombre: 'Retro', slug: 'retro', order: 4 },
    { id: 'cat-f1', nombre: 'Fórmula 1', slug: 'formula-1', order: 5 },
    { id: 'cat-gorras', nombre: 'Gorras', slug: 'gorras', order: 6 },
];

const leagues: League[] = [
    { id: 'lig-laliga', nombre: 'LaLiga', slug: 'laliga', imagen: '' },
    { id: 'lig-ucl', nombre: 'Champions League', slug: 'champions-league', imagen: '' },
    { id: 'lig-ligamx', nombre: 'Liga MX', slug: 'liga-mx', imagen: '' },
    { id: 'lig-hn', nombre: 'Liga Nacional', slug: 'liga-nacional', imagen: '' },
    { id: 'lig-lib', nombre: 'Copa Libertadores', slug: 'copa-libertadores', imagen: '' },
    { id: 'lig-sel', nombre: 'Selecciones', slug: 'selecciones', imagen: '' },
];

const products: Product[] = [
    {
        id: 'p-america-fem',
        equipo: 'América',
        team_id: 't-america',
        modelo: 'Visitante - Femenina',
        slug: 'america-visitante-femenina-2025-26-femenina-mujer',
        precio: 1150,
        imagen: '/img/america-fem.webp',
        category_id: 'cat-femenina',
        league_id: 'lig-ligamx',
        brand_name: 'Nike',
        season: '2025/26',
        product_variants: [{ id: 'v1', version: 'Fan', price: 1150, active: true }],
    },
    {
        id: 'p-america-local',
        equipo: 'América',
        team_id: 't-america',
        modelo: 'Local',
        slug: 'america-local-2025-26-futbol-hombre',
        precio: 1200,
        imagen: '/img/america-local.webp',
        category_id: 'cat-futbol',
        league_id: 'lig-ligamx',
        brand_name: 'Nike',
        season: '2025/26',
        product_variants: [
            { id: 'v2', version: 'Player', price: 1450, active: true },
            { id: 'v3', version: 'Fan', price: 1200, active: true },
        ],
    },
    {
        id: 'p-motagua',
        equipo: 'Motagua',
        team_id: 't-motagua',
        modelo: 'Local',
        slug: 'motagua-local-2025-26-futbol-hombre',
        precio: 1100,
        imagen: '/img/motagua.webp',
        category_id: 'cat-futbol',
        league_id: 'lig-hn',
        brand_name: 'Joma',
        season: '2025/26',
    },
    {
        id: 'p-barca-local',
        equipo: 'FC Barcelona',
        team_id: 't-barca',
        modelo: 'Local Manga Larga',
        slug: 'fc-barcelona-local-manga-larga-2025-26-futbol-hombre',
        precio: 1350,
        imagen: '/img/barca.webp',
        category_id: 'cat-futbol',
        league_id: 'lig-laliga',
        league_ids: ['lig-laliga', 'lig-ucl'],
        brand_name: 'Nike',
        season: '2025/26',
    },
    {
        id: 'p-madrid-local',
        equipo: 'Real Madrid',
        team_id: 't-madrid',
        modelo: 'Local',
        slug: 'real-madrid-local-2025-26-futbol-hombre',
        precio: 1250,
        imagen: '/img/madrid.webp',
        destacado: true,
        category_id: 'cat-futbol',
        league_id: 'lig-laliga',
        league_ids: ['lig-laliga', 'lig-ucl'],
        brand_name: 'Adidas',
        season: '2025/26',
    },
    {
        id: 'p-boca',
        equipo: 'Boca Juniors',
        team_id: 't-boca',
        modelo: 'Local',
        slug: 'boca-juniors-local-2025-26-futbol-hombre',
        precio: 1200,
        imagen: '/img/boca.webp',
        category_id: 'cat-futbol',
        league_id: 'lig-lib',
        patch_names: ['Copa Libertadores'],
        brand_name: 'Adidas',
        season: '2025/26',
    },
    {
        id: 'p-river',
        equipo: 'River Plate',
        team_id: 't-river',
        modelo: 'Local',
        slug: 'river-plate-local-2025-26-futbol-hombre',
        precio: 1200,
        imagen: '/img/river.webp',
        category_id: 'cat-futbol',
        league_id: 'lig-lib',
        brand_name: 'Adidas',
        season: '2025/26',
    },
    {
        id: 'p-honduras-ninos',
        equipo: 'Honduras',
        team_id: 't-hn',
        modelo: 'Local Kit',
        slug: 'honduras-local-kit-2026-ninos-nino',
        precio: 950,
        imagen: '/img/hn-kids.webp',
        category_id: 'cat-ninos',
        league_id: 'lig-sel',
        brand_name: 'Joma',
        season: '2026',
    },
    {
        id: 'p-japon',
        equipo: 'Japón',
        team_id: 't-jp',
        modelo: 'Local',
        slug: 'japon-local-2026-futbol-hombre',
        precio: 1200,
        imagen: '/img/jp.webp',
        category_id: 'cat-futbol',
        league_id: 'lig-sel',
        brand_name: 'Adidas',
        season: '2026',
    },
    {
        id: 'p-arg-retro',
        equipo: 'Argentina',
        team_id: 't-arg',
        modelo: 'Local Clásica',
        slug: 'argentina-local-2006-retro-hombre',
        precio: 1300,
        imagen: '/img/arg-retro.webp',
        category_id: 'cat-retro',
        league_id: 'lig-sel',
        brand_name: 'Adidas',
        season: '2006',
    },
    {
        id: 'p-f1-redbull',
        equipo: 'Red Bull Racing',
        team_id: 't-rb',
        modelo: 'Team Polo Navy',
        slug: 'red-bull-racing-team-polo-navy-formula-1-hombre',
        precio: 1400,
        imagen: '/img/rb.webp',
        category_id: 'cat-f1',
        brand_name: 'Castore',
    },
    {
        id: 'p-gorra-bayern',
        equipo: 'Bayern Múnich',
        team_id: 't-bayern',
        modelo: 'Gorra Oficial',
        slug: 'bayern-munich-gorra-oficial-gorras',
        precio: 650,
        imagen: '/img/gorra.webp',
        category_id: 'cat-gorras',
        brand_name: 'Adidas',
    },
    {
        id: 'p-psg',
        equipo: 'Paris Saint-Germain',
        team_id: 't-psg',
        modelo: 'Local',
        slug: 'paris-saint-germain-local-2025-26-futbol-hombre',
        precio: 1250,
        imagen: '/img/psg.webp',
        category_id: 'cat-futbol',
        league_id: 'lig-ucl',
        brand_name: 'Nike',
        season: '2025/26',
    },
];

const players: SearchablePlayer[] = [
    { id: 'pl-yamal', name: 'LAMINE YAMAL', number: '19', productIds: ['p-barca-local'] },
    { id: 'pl-bellingham', name: 'JUDE BELLINGHAM', number: '5', productIds: ['p-madrid-local'] },
];

const index = buildSearchIndex({
    products,
    categories,
    leagues,
    players,
    aliases: DEFAULT_SEARCH_SETTINGS.aliases,
    synonyms: DEFAULT_SEARCH_SETTINGS.synonyms,
});

describe('Unified Algorithmic Search Engine (Propuesta B)', () => {
    it('encuentra la camisa femenina del América cuando el cliente escribe "America femenino" (con -o)', () => {
        const res = searchCatalog(index, 'America femenino');
        expect(res.meta.matchQuality).toBe('exact');
        expect(res.products.length).toBeGreaterThan(0);
        expect(res.products[0].product.id).toBe('p-america-fem');
    });

    it('encuentra la camisa femenina del América cuando busca "America mujer" gracias al slug indexado', () => {
        const res = searchCatalog(index, 'America mujer');
        expect(res.meta.matchQuality).toBe('exact');
        expect(res.products[0].product.id).toBe('p-america-fem');
    });

    it('resuelve "camisa del mota gua" uniendo bigramas adyacentes e ignorando ruido sin hardcoding', () => {
        const res = searchCatalog(index, 'camisa del mota gua');
        expect(res.products.length).toBeGreaterThan(0);
        expect(res.products[0].product.id).toBe('p-motagua');
        expect(res.meta.correctedTerms.some((c) => c.from === 'mota gua' && c.to === 'motagua')).toBe(true);
    });

    it('resuelve "formula1" separando frontera letra-número contra "Fórmula 1"', () => {
        const res = searchCatalog(index, 'formula1');
        expect(res.categories.some((c) => c.id === 'cat-f1')).toBe(true);
        expect(res.products.some((p) => p.product.id === 'p-f1-redbull')).toBe(true);
    });

    it('resuelve "camiseta manga larga" aunque el producto no incluya la palabra "camiseta"', () => {
        const res = searchCatalog(index, 'camiseta manga larga');
        expect(res.products.length).toBeGreaterThan(0);
        expect(res.products[0].product.id).toBe('p-barca-local');
    });

    it('resuelve "camisa de river manga larga" con relajación inteligente hacia River Plate + alternativa manga larga', () => {
        const res = searchCatalog(index, 'camisa de river manga larga');
        expect(res.meta.matchQuality).toBe('partial');
        expect(res.products.length).toBe(1);
        expect(res.products[0].product.id).toBe('p-river');
        expect(res.meta.suggestedAlternative).not.toBeNull();
    });

    it('resuelve "boca niño" con relajación hacia Boca Juniors + chip a colección Niños', () => {
        const res = searchCatalog(index, 'boca niño');
        expect(res.meta.matchQuality).toBe('partial');
        expect(res.products.length).toBe(1);
        expect(res.products[0].product.id).toBe('p-boca');
        expect(res.meta.suggestedAlternative?.href).toContain('categoria=ninos');
    });

    it('resuelve "honduras selección niños" encontrando el kit de niños de Honduras', () => {
        const res = searchCatalog(index, 'honduras selección niños');
        expect(res.products.length).toBeGreaterThan(0);
        expect(res.products[0].product.id).toBe('p-honduras-ninos');
    });

    it('resuelve "boca libertadores" cruzando equipo + liga/parche', () => {
        const res = searchCatalog(index, 'boca libertadores');
        expect(res.meta.matchQuality).toBe('exact');
        expect(res.products[0].product.id).toBe('p-boca');
    });

    it('resuelve "retro" encontrando tanto la categoría como las camisas retro', () => {
        const res = searchCatalog(index, 'retro');
        expect(res.categories.some((c) => c.id === 'cat-retro')).toBe(true);
        expect(res.products.some((p) => p.product.id === 'p-arg-retro')).toBe(true);
    });

    it('resuelve "gorras" (plural) contra "Gorra Oficial" (singular) mediante stemming', () => {
        const res = searchCatalog(index, 'gorras');
        expect(res.products.some((p) => p.product.id === 'p-gorra-bayern')).toBe(true);
    });

    it('resuelve "japón" y "japon" de forma idéntica', () => {
        const withAccent = searchCatalog(index, 'japón');
        const withoutAccent = searchCatalog(index, 'japon');
        expect(withAccent.products[0].product.id).toBe('p-japon');
        expect(withoutAccent.products[0].product.id).toBe('p-japon');
    });

    it('tolera errores ortográficos comunes como "amerca", "barcelna" y "bellingam"', () => {
        expect(searchCatalog(index, 'amerca').products.some((p) => p.product.team_id === 't-america')).toBe(true);
        expect(searchCatalog(index, 'barcelna').products[0].product.id).toBe('p-barca-local');
        const playerRes = searchCatalog(index, 'bellingam');
        expect(playerRes.players[0]?.id).toBe('pl-bellingham');
        expect(playerRes.products[0]?.product.id).toBe('p-madrid-local');
    });

    it('soporta alias compartidos desde configuración admin ("aguilas" devuelve Motagua y América)', () => {
        const res = searchCatalog(index, 'aguilas');
        const teamIds = new Set(res.products.map((p) => p.product.team_id));
        expect(teamIds.has('t-motagua')).toBe(true);
        expect(teamIds.has('t-america')).toBe(true);
    });

    it('Precision Guard: NO devuelve basura para ausencias reales de inventario ("nedved", "juventus", "saint kitts")', () => {
        expect(searchCatalog(index, 'nedved').products.length).toBe(0);
        expect(searchCatalog(index, 'juventus').products.length).toBe(0);
        expect(searchCatalog(index, 'saint kitts').products.length).toBe(0);
    });

    it('resuelve clubes y atributos escritos pegados sin espacio ("realmadrid", "bocajuniors", "mangalarga")', () => {
        expect(searchCatalog(index, 'realmadrid').products[0]?.product.id).toBe('p-madrid-local');
        expect(searchCatalog(index, 'bocajuniors').products[0]?.product.id).toBe('p-boca');
        expect(searchCatalog(index, 'mangalarga').products[0]?.product.id).toBe('p-barca-local');
        expect(searchCatalog(index, 'parissaintgermain').products[0]?.product.id).toBe('p-psg');
    });

    it('resuelve sinónimos administrables de atributos ("America dama", "America away", "Honduras kids")', () => {
        const damaRes = searchCatalog(index, 'America dama');
        expect(damaRes.meta.matchQuality).toBe('exact');
        expect(damaRes.products[0]?.product.id).toBe('p-america-fem');
        expect(searchCatalog(index, 'dama').categories.some((c) => c.id === 'cat-femenina')).toBe(true);

        const awayRes = searchCatalog(index, 'America away');
        expect(awayRes.meta.matchQuality).toBe('exact');
        expect(awayRes.products[0]?.product.id).toBe('p-america-fem');

        const kidsRes = searchCatalog(index, 'Honduras kids');
        expect(kidsRes.meta.matchQuality).toBe('exact');
        expect(kidsRes.products[0]?.product.id).toBe('p-honduras-ninos');
    });
});
