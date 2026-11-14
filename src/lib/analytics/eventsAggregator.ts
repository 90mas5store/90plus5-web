import type { AnalyticsEventType, AnalyticsWhatsAppClickItem } from './types';
import { formatDateKeyInStoreTz, getStoreDateParts } from './timezone';

export interface RawAnalyticsEvent {
    id: string;
    event_type: AnalyticsEventType;
    path: string;
    referrer?: string | null;
    device?: string | null;
    session_id?: string | null;
    country?: string | null;
    city?: string | null;
    metadata?: Record<string, unknown> | null;
    created_at: string;
}

export interface ProductViewBucket {
    slug: string;
    name: string;
    teamName: string | null;
    season: string | null;
    imageUrl: string | null;
    views: number;
}

export interface PlayerDemandBucket {
    name: string;
    number: string | null;
    count: number;
}

export interface SessionInfo {
    firstSeenAt: number;
    source: string;
    hasExternalSource: boolean;
    device: string;
    country: string | null;
    city: string | null;
}

export interface EventsAggregation {
    totalPageViews: number;
    totalProductViews: number;
    totalSearches: number;
    totalCarts: number;
    totalWhatsAppClicks: number;
    totalMatchdayClicks: number;
    uniqueSessions: Set<string>;
    realtimeSessions: Set<string>;
    sessionsWithProductView: Set<string>;
    sessionsWithCart: Set<string>;
    sessionsWithWhatsApp: Set<string>;
    sessionsWithCheckout: Set<string>;
    sessionsWithPurchase: Set<string>;
    matchdaySessions: Set<string>;
    sessions: Map<string, SessionInfo>;
    dailyMap: Map<string, { views: number; visitors: Set<string> }>;
    hourlyViews: number[];
    productMap: Map<string, ProductViewBucket>;
    cartByProductId: Map<string, number>;
    cartByProductName: Map<string, number>;
    searchMap: Map<string, number>;
    missedSearchMap: Map<string, number>;
    sizeMap: Map<string, number>;
    versionMap: Map<string, number>;
    patchCounts: { withPatch: number; total: number };
    playerMap: Map<string, PlayerDemandBucket>;
    whatsappClicks: AnalyticsWhatsAppClickItem[];
}

export function normalizeVersionLabel(raw?: unknown): string | null {
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const lower = trimmed.toLowerCase();
    if (lower.includes('jugador') || lower.includes('player')) return 'Versión Jugador';
    if (lower.includes('aficionado') || lower.includes('fan')) return 'Versión Aficionado';
    if (lower.includes('retro')) return 'Edición Retro';
    if (lower.includes('niño') || lower.includes('kid') || lower.includes('infantil')) return 'Edición Niños';
    return trimmed;
}

export function normalizeProductKey(raw?: string | null): string {
    return (raw || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export function resolveEventSource(
    referrer: string | null | undefined,
    metadata: Record<string, unknown> | null | undefined,
    host: string
): { source: string; isExternal: boolean } {
    const utmSource = typeof metadata?.utm_source === 'string'
        ? metadata.utm_source.trim().toLowerCase()
        : '';

    if (utmSource) {
        if (utmSource.includes('instagram') || utmSource === 'ig') return { source: 'Instagram', isExternal: true };
        if (utmSource.includes('facebook') || utmSource === 'fb') return { source: 'Facebook', isExternal: true };
        if (utmSource.includes('tiktok')) return { source: 'TikTok', isExternal: true };
        if (utmSource.includes('whatsapp') || utmSource === 'wa') return { source: 'WhatsApp', isExternal: true };
        if (utmSource.includes('google')) return { source: 'Google', isExternal: true };
        return {
            source: utmSource.charAt(0).toUpperCase() + utmSource.slice(1),
            isExternal: true,
        };
    }

    const rawRef = (referrer || '').trim();
    if (!rawRef) {
        return { source: 'Directo / Navegador', isExternal: false };
    }

    const lowerRef = rawRef.toLowerCase();
    if (host && lowerRef.includes(host.toLowerCase())) {
        return { source: 'Directo / Navegador', isExternal: false };
    }

    if (lowerRef.includes('instagram.com') || lowerRef.includes('ig.me')) {
        return { source: 'Instagram', isExternal: true };
    }
    if (lowerRef.includes('facebook.com') || lowerRef.includes('fb.com') || lowerRef.includes('fb.me')) {
        return { source: 'Facebook', isExternal: true };
    }
    if (lowerRef.includes('tiktok.com')) {
        return { source: 'TikTok', isExternal: true };
    }
    if (lowerRef.includes('whatsapp.com') || lowerRef.includes('wa.me')) {
        return { source: 'WhatsApp', isExternal: true };
    }
    if (lowerRef.includes('google.')) {
        return { source: 'Google', isExternal: true };
    }

    try {
        const parsed = new URL(rawRef);
        const cleanHost = parsed.hostname.replace(/^www\./, '');
        return { source: cleanHost || 'Otros Enlaces', isExternal: true };
    } catch {
        return { source: 'Otros Enlaces', isExternal: true };
    }
}

export function normalizeDeviceLabel(raw?: string | null): string {
    const dev = (raw || 'desktop').toLowerCase();
    if (dev === 'mobile') return 'Móvil';
    if (dev === 'tablet') return 'Tablet';
    return 'Computadora';
}

export function aggregateEvents(
    events: RawAnalyticsEvent[],
    options: { host?: string; now?: Date } = {}
): EventsAggregation {
    const host = options.host || '';
    const now = options.now || new Date();
    const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000);

    // Orden cronológico ascendente para atribución first-touch fiel por sesión
    const chronological = [...events].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const agg: EventsAggregation = {
        totalPageViews: 0,
        totalProductViews: 0,
        totalSearches: 0,
        totalCarts: 0,
        totalWhatsAppClicks: 0,
        totalMatchdayClicks: 0,
        uniqueSessions: new Set(),
        realtimeSessions: new Set(),
        sessionsWithProductView: new Set(),
        sessionsWithCart: new Set(),
        sessionsWithWhatsApp: new Set(),
        sessionsWithCheckout: new Set(),
        sessionsWithPurchase: new Set(),
        matchdaySessions: new Set(),
        sessions: new Map(),
        dailyMap: new Map(),
        hourlyViews: new Array(24).fill(0),
        productMap: new Map(),
        cartByProductId: new Map(),
        cartByProductName: new Map(),
        searchMap: new Map(),
        missedSearchMap: new Map(),
        sizeMap: new Map(),
        versionMap: new Map(),
        patchCounts: { withPatch: 0, total: 0 },
        playerMap: new Map(),
        whatsappClicks: [],
    };

    for (const ev of chronological) {
        const sess = ev.session_id || `anon_${ev.id}`;
        const meta = (ev.metadata && typeof ev.metadata === 'object' ? ev.metadata : {}) as Record<string, unknown>;
        const evTime = ev.created_at ? new Date(ev.created_at) : now;

        agg.uniqueSessions.add(sess);

        if (!isNaN(evTime.getTime()) && evTime >= fifteenMinAgo) {
            agg.realtimeSessions.add(sess);
        }

        if (!isNaN(evTime.getTime())) {
            const hourLocal = getStoreDateParts(evTime).hour;
            if (hourLocal >= 0 && hourLocal < 24) {
                agg.hourlyViews[hourLocal]++;
            }
        }

        // Atribución única por sesión (prioriza la primera fuente externa / UTM de la sesión)
        const resolvedSource = resolveEventSource(ev.referrer, meta, host);
        const geoMeta = (meta.geo && typeof meta.geo === 'object' ? meta.geo : {}) as Record<string, unknown>;
        const evCountry = String(ev.country || geoMeta.country || '').toUpperCase().trim() || null;
        const evCity = String(ev.city || geoMeta.city || '').trim() || null;

        const existingSession = agg.sessions.get(sess);
        if (!existingSession) {
            agg.sessions.set(sess, {
                firstSeenAt: evTime.getTime(),
                source: resolvedSource.source,
                hasExternalSource: resolvedSource.isExternal,
                device: normalizeDeviceLabel(ev.device),
                country: evCountry,
                city: evCity,
            });
        } else {
            if (!existingSession.hasExternalSource && resolvedSource.isExternal) {
                existingSession.source = resolvedSource.source;
                existingSession.hasExternalSource = true;
            }
            if (!existingSession.country && evCountry) existingSession.country = evCountry;
            if (!existingSession.city && evCity) existingSession.city = evCity;
        }

        // Conteo por tipo de evento
        switch (ev.event_type) {
            case 'page_view':
                agg.totalPageViews++;
                break;

            case 'product_view': {
                agg.totalProductViews++;
                agg.sessionsWithProductView.add(sess);

                const slug = String(
                    meta.slug || ev.path.replace('/producto/', '').split('?')[0] || 'producto'
                ).trim();
                const name = String(meta.productName || slug).trim();
                const teamName = typeof meta.teamName === 'string' ? meta.teamName : null;
                const season = typeof meta.season === 'string' ? meta.season : null;
                const imageUrl = typeof meta.imageUrl === 'string' ? meta.imageUrl : null;

                const currentProd = agg.productMap.get(slug);
                if (!currentProd) {
                    agg.productMap.set(slug, { slug, name, teamName, season, imageUrl, views: 1 });
                } else {
                    currentProd.views++;
                    if (!currentProd.season && season) currentProd.season = season;
                    if (!currentProd.teamName && teamName) currentProd.teamName = teamName;
                    if (!currentProd.imageUrl && imageUrl) currentProd.imageUrl = imageUrl;
                }
                break;
            }

            case 'search': {
                agg.totalSearches++;
                const rawTerm = typeof meta.searchTerm === 'string' ? meta.searchTerm.trim().toLowerCase() : '';
                if (rawTerm) {
                    agg.searchMap.set(rawTerm, (agg.searchMap.get(rawTerm) || 0) + 1);
                    if (meta.has_results === false || meta.resultsCount === 0) {
                        agg.missedSearchMap.set(rawTerm, (agg.missedSearchMap.get(rawTerm) || 0) + 1);
                    }
                }
                break;
            }

            case 'add_to_cart': {
                const qty = Math.max(1, Number(meta.cantidad) || 1);
                agg.totalCarts++;
                agg.sessionsWithCart.add(sess);

                if (typeof meta.productId === 'string' && meta.productId) {
                    agg.cartByProductId.set(meta.productId, (agg.cartByProductId.get(meta.productId) || 0) + qty);
                }
                if (typeof meta.modelo === 'string' && meta.modelo.trim()) {
                    const key = normalizeProductKey(meta.modelo);
                    agg.cartByProductName.set(key, (agg.cartByProductName.get(key) || 0) + qty);
                }

                const sizeVal = typeof meta.talla === 'string' ? meta.talla.trim().toUpperCase() : '';
                if (sizeVal) {
                    agg.sizeMap.set(sizeVal, (agg.sizeMap.get(sizeVal) || 0) + qty);
                }

                const versionVal = normalizeVersionLabel(meta.version);
                if (versionVal) {
                    agg.versionMap.set(versionVal, (agg.versionMap.get(versionVal) || 0) + qty);
                }

                agg.patchCounts.total += qty;
                if (typeof meta.parche === 'string' && meta.parche.trim() && meta.parche.trim().toLowerCase() !== 'ninguno' && meta.parche.trim().toLowerCase() !== 'sin parche') {
                    agg.patchCounts.withPatch += qty;
                }

                const dorsalNombre = typeof meta.dorsalNombre === 'string' ? meta.dorsalNombre.trim() : '';
                const dorsalNumero = meta.dorsalNumero != null ? String(meta.dorsalNumero).trim() : '';
                if (dorsalNombre) {
                    const playerKey = `${dorsalNombre.toLowerCase()}__${dorsalNumero}`;
                    const currentP = agg.playerMap.get(playerKey);
                    agg.playerMap.set(playerKey, {
                        name: dorsalNombre,
                        number: dorsalNumero || null,
                        count: (currentP?.count || 0) + qty,
                    });
                }
                break;
            }

            case 'whatsapp_click': {
                agg.totalWhatsAppClicks++;
                agg.sessionsWithWhatsApp.add(sess);

                const slug = String(
                    meta.slug || ev.path.replace('/producto/', '').split('?')[0] || 'producto'
                ).trim();
                const productName = String(meta.productName || meta.modelo || slug).trim();
                const teamName = typeof meta.teamName === 'string'
                    ? meta.teamName
                    : typeof meta.equipo === 'string'
                        ? meta.equipo
                        : null;

                const sizeVal = typeof meta.talla === 'string' ? meta.talla.trim().toUpperCase() : '';
                if (sizeVal) {
                    agg.sizeMap.set(sizeVal, (agg.sizeMap.get(sizeVal) || 0) + 1);
                }

                const versionVal = normalizeVersionLabel(meta.version);
                if (versionVal) {
                    agg.versionMap.set(versionVal, (agg.versionMap.get(versionVal) || 0) + 1);
                }

                agg.patchCounts.total += 1;
                const patchStr = typeof meta.parche === 'string' ? meta.parche.trim() : '';
                if (patchStr && patchStr.toLowerCase() !== 'ninguno' && patchStr.toLowerCase() !== 'sin parche') {
                    agg.patchCounts.withPatch += 1;
                }

                const dorsalNombre = typeof meta.dorsalNombre === 'string' ? meta.dorsalNombre.trim() : '';
                const dorsalNumero = meta.dorsalNumero != null ? String(meta.dorsalNumero).trim() : '';
                if (dorsalNombre) {
                    const playerKey = `${dorsalNombre.toLowerCase()}__${dorsalNumero}`;
                    const currentP = agg.playerMap.get(playerKey);
                    agg.playerMap.set(playerKey, {
                        name: dorsalNombre,
                        number: dorsalNumero || null,
                        count: (currentP?.count || 0) + 1,
                    });
                }

                const dorsalFormatted = dorsalNombre
                    ? dorsalNumero
                        ? `#${dorsalNumero} ${dorsalNombre}`
                        : dorsalNombre
                    : dorsalNumero
                        ? `#${dorsalNumero}`
                        : null;

                agg.whatsappClicks.unshift({
                    id: ev.id,
                    slug,
                    productName,
                    teamName,
                    version: versionVal,
                    size: sizeVal || null,
                    patch: patchStr || null,
                    dorsal: dorsalFormatted,
                    price: Number(meta.precio || meta.price) || 0,
                    device: normalizeDeviceLabel(ev.device),
                    country: evCountry,
                    city: evCity,
                    created_at: ev.created_at,
                });
                break;
            }

            case 'matchday_click':
                agg.totalMatchdayClicks++;
                agg.matchdaySessions.add(sess);
                break;

            case 'checkout_start':
                agg.sessionsWithCheckout.add(sess);
                break;

            case 'purchase':
                agg.sessionsWithPurchase.add(sess);
                break;
        }

        // Serie diaria por fecha en zona horaria local
        const dateKey = ev.created_at ? formatDateKeyInStoreTz(ev.created_at) : 'Hoy';
        if (!agg.dailyMap.has(dateKey)) {
            agg.dailyMap.set(dateKey, { views: 0, visitors: new Set() });
        }
        const dayBucket = agg.dailyMap.get(dateKey)!;
        dayBucket.views++;
        dayBucket.visitors.add(sess);
    }

    return agg;
}

