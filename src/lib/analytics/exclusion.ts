/**
 * Utilidades para exclusión de analíticas (Localhost, Desarrollador, Administrador,
 * Bots de Google / Vercel / Meta / IA y Data Centers automatizados).
 * Permite evitar datos falsos provocados por pruebas locales, visitas del dueño
 * o rastreadores nocturnos desde granjas de servidores en EE. UU.
 */

import { getStoreDateParts } from './timezone';

export const ANALYTICS_EXCLUSION_STORAGE_KEY = '90plus5_ignore_analytics';
export const ANALYTICS_EXCLUSION_COOKIE_KEY = '90plus5_ignore_analytics';

/**
 * Patrones de User-Agent correspondientes a bots, crawlers, indexadores,
 * generadores de vistas previas, herramientas de IA y monitoreo.
 */
export const BOT_USER_AGENT_PATTERNS: readonly string[] = [
    // Infraestructura, Despliegue y Monitoreo
    'vercel',
    'headless',
    'lighthouse',
    'pagespeed',
    'chrome-lighthouse',
    'ptst',
    'webpagetest',
    'gtmetrix',
    'pingdom',
    'uptimerobot',
    'statuscake',
    'datadog',
    'newrelic',
    'sentry',
    'supabase',
    'cloudflare',
    'prerender',
    'screenshot',

    // Motores de Búsqueda y Servicios de Google (muchos no contienen la palabra "bot")
    'bot',
    'crawler',
    'spider',
    'googlebot',
    'adsbot',
    'storebot-google',
    'google-inspectiontool',
    'googleother',
    'google-extended',
    'google-safety',
    'google-read-aloud',
    'google-site-verification',
    'googleweblight',
    'mediapartners-google',
    'apis-google',
    'feedfetcher-google',
    'bingpreview',
    'slurp',
    'duckduckgo',
    'baiduspider',
    'yandex',
    'sogou',
    'ia_archiver',

    // Agentes de IA, LLMs y Scrapers Generativos
    'gptbot',
    'chatgpt-user',
    'oai-searchbot',
    'chatgpt',
    'openai',
    'claudebot',
    'anthropic',
    'claude-web',
    'perplexity',
    'cohere-ai',
    'youbot',
    'ccbot',
    'bytespider',
    'bytedance',
    'amazonbot',
    'applebot',
    'diffbot',
    'omgili',
    'higgsfield',

    // Redes Sociales y Previsualizadores de Enlaces (Meta Catalog, WhatsApp, etc.)
    'facebookexternalhit',
    'facebot',
    'meta-externalagent',
    'meta-externalfetcher',
    'whatsapp',
    'twitterbot',
    'linkedinbot',
    'slackbot',
    'discordbot',
    'telegrambot',
    'pinterest',
    'skypeuripreview',

    // Navegadores Automatizados, Scrapers SEO y Clientes HTTP
    'puppeteer',
    'playwright',
    'selenium',
    'webdriver',
    'phantomjs',
    'slimerjs',
    'cypress',
    'electron',
    'wkhtmltopdf',
    'ahrefs',
    'semrush',
    'mj12bot',
    'dotbot',
    'petalbot',
    'screaming frog',
    'sitebulb',
    'dataprovider',
    'curl/',
    'wget/',
    'python-requests',
    'python-urllib',
    'aiohttp',
    'httpx',
    'axios/',
    'node-fetch',
    'undici',
    'go-http-client',
    'okhttp',
    'scrapy',
    'postmanruntime',
    'insomnia',
];

/**
 * Ciudades en EE. UU. donde operan exclusivamente granjas de servidores / data centers
 * (Google Cloud us-central1/us-east1/us-east5, AWS us-east-1/us-east-2/us-west-2,
 * nodos de verificación post-deploy en Silicon Valley, etc.) que generan tráfico
 * sintético en la madrugada.
 */
export const US_DATACENTER_BOT_CITIES = new Set<string>([
    'council bluffs',   // Google Cloud us-central1 (Iowa) - ping diario de madrugada
    'north charleston', // Google Cloud us-east1 (South Carolina) - crawler nocturno de productos
    'columbus',         // AWS us-east-2 / Google Cloud us-east5 (Ohio) - crawler en ráfaga
    'santa clara',      // Data centers Silicon Valley (California) - escaneo de términos/privacidad
    'san jose',         // Nodos post-deploy / preview (California)
    'mountain view',    // Google HQ / Web Rendering Service (California)
    'menlo park',       // Meta HQ / Catalog Crawler (California)
    'ashburn',          // AWS us-east-1 (Virginia)
    'boardman',         // AWS us-west-2 (Oregon)
    'the dalles',       // Google Cloud us-west1 (Oregon)
    'hillsboro',        // Cloud data center hub (Oregon)
    'des moines',       // Azure / OpenAI data center hub (Iowa)
]);

/**
 * Determina si un User-Agent pertenece a un bot, crawler o herramienta automatizada.
 */
export function isBotUserAgent(userAgent?: string | null): boolean {
    if (!userAgent) return false;
    const ua = userAgent.toLowerCase();
    return BOT_USER_AGENT_PATTERNS.some((pattern) => ua.includes(pattern));
}

/**
 * Determina si la ubicación geográfica corresponde a un data center conocido de bots en EE. UU.
 */
export function isDataCenterBotLocation(
    country?: string | null,
    city?: string | null
): boolean {
    if (!city) return false;
    const normCountry = (country || '').trim().toUpperCase();
    if (normCountry && normCountry !== 'US') return false;

    const normCity = city.trim().toLowerCase();
    return US_DATACENTER_BOT_CITIES.has(normCity);
}

/**
 * Evalúa si un evento de analítica (histórico o en tiempo real) proviene de tráfico automatizado.
 */
export function isAutomatedAnalyticsEvent(event: {
    path?: string | null;
    referrer?: string | null;
    device?: string | null;
    country?: string | null;
    city?: string | null;
    metadata?: Record<string, unknown> | null;
    created_at?: string | null;
}): boolean {
    const meta = (event.metadata && typeof event.metadata === 'object' ? event.metadata : {}) as Record<string, unknown>;
    const geoMeta = (meta.geo && typeof meta.geo === 'object' ? meta.geo : {}) as Record<string, unknown>;

    // 1. Verificar User-Agent si fue almacenado en metadata
    const metaUa = typeof meta.ua === 'string' ? meta.ua : null;
    if (metaUa && isBotUserAgent(metaUa)) {
        return true;
    }

    // 2. Verificar ciudad de Data Center en EE. UU. (Council Bluffs, Columbus, North Charleston, Santa Clara, San Jose, etc.)
    const country = event.country || (typeof geoMeta.country === 'string' ? geoMeta.country : null);
    const city = event.city || (typeof geoMeta.city === 'string' ? geoMeta.city : null);
    if (isDataCenterBotLocation(country, city)) {
        return true;
    }

    // 3. Huella histórica del bot nocturno de Google (Council Bluffs 800x600 -> clasificado como "tablet")
    // antes de que existiera la columna de geolocalización: entra a "/" sin referrer en la madrugada (01:00 - 05:59 HN)
    if (
        event.device === 'tablet' &&
        event.path === '/' &&
        !event.referrer &&
        !country &&
        event.created_at
    ) {
        const d = new Date(event.created_at);
        if (!isNaN(d.getTime())) {
            const { hour } = getStoreDateParts(d);
            if (hour >= 1 && hour <= 5) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Detecta si el entorno actual es localhost o desarrollo.
 */
export function isLocalhost(): boolean {
    if (typeof window === 'undefined') {
        return process.env.NODE_ENV === 'development';
    }

    const host = window.location.hostname;
    return (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '0.0.0.0' ||
        host === '[::1]' ||
        host.endsWith('.local') ||
        process.env.NODE_ENV === 'development'
    );
}

/**
 * Verifica si las analíticas deben ser excluidas en el navegador actual:
 * 1. Si está en localhost / desarrollo -> SIEMPRE excluido.
 * 2. Si es un navegador automatizado (webdriver, headless, bot UA, contenedor Linux 800x600) -> excluido.
 * 3. Si tiene la bandera de exclusión guardada en localStorage o Cookie -> excluido.
 */
export function isAnalyticsExcluded(): boolean {
    if (typeof window === 'undefined') return false;

    // 1. Siempre excluir localhost / entornos de desarrollo
    if (isLocalhost()) return true;

    // 1.5. Excluir bots de captura, crawlers, IA y navegadores headless (Puppeteer, Playwright, Google WRS)
    if (typeof navigator !== 'undefined') {
        if (navigator.webdriver === true) {
            return true;
        }
        const ua = navigator.userAgent || '';
        if (isBotUserAgent(ua)) {
            return true;
        }
        // Contenedor Linux Headless con viewport por defecto 800x600 (firma exacta de Google WRS / Cloud Renderers)
        if (
            /linux/i.test(ua) &&
            !/android/i.test(ua) &&
            window.innerWidth === 800 &&
            window.innerHeight === 600
        ) {
            return true;
        }
    }

    if (window.outerWidth === 0 && window.outerHeight === 0) {
        return true;
    }

    // 2. Comprobar bandera en localStorage
    try {
        if (localStorage.getItem(ANALYTICS_EXCLUSION_STORAGE_KEY) === 'true') {
            return true;
        }
    } catch {
        // En modos ultra-privados localStorage puede lanzar excepciones
    }

    // 3. Comprobar bandera en Cookie
    try {
        if (document.cookie.split(';').some(c => c.trim().startsWith(`${ANALYTICS_EXCLUSION_COOKIE_KEY}=true`))) {
            return true;
        }
    } catch {
        // Ignorar
    }

    return false;
}

/**
 * Activa o desactiva la exclusión de analíticas en este dispositivo.
 * Guarda la preferencia tanto en localStorage como en Cookie (1 año) para máxima persistencia.
 */
export function setAnalyticsExcluded(excluded: boolean): void {
    if (typeof window === 'undefined') return;

    try {
        if (excluded) {
            localStorage.setItem(ANALYTICS_EXCLUSION_STORAGE_KEY, 'true');
            document.cookie = `${ANALYTICS_EXCLUSION_COOKIE_KEY}=true; path=/; max-age=31536000; SameSite=Lax`;
        } else {
            localStorage.removeItem(ANALYTICS_EXCLUSION_STORAGE_KEY);
            document.cookie = `${ANALYTICS_EXCLUSION_COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`;
        }
    } catch {
        // Ignorar errores de acceso
    }
}
