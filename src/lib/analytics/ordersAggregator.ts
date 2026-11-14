import { formatDateKeyInStoreTz, getStoreDateParts } from './timezone';
import { isCancelledStatus } from './range';
import { normalizeProductKey, normalizeVersionLabel } from './eventsAggregator';

type RelationOneOrMany<T> = T | T[] | null | undefined;

export interface RawOrderPayment {
    method?: string | null;
    provider?: string | null;
    status?: string | null;
    amount?: number | null;
    type?: string | null;
}

export interface RawOrderItem {
    quantity?: number | null;
    unit_price?: number | null;
    personalization_type?: string | null;
    custom_name?: string | null;
    custom_number?: string | null;
    products?: RelationOneOrMany<{
        id?: string | null;
        slug?: string | null;
        name?: string | null;
        season?: string | null;
        teams?: RelationOneOrMany<{ name?: string | null }>;
    }>;
    product_variants?: RelationOneOrMany<{ version?: string | null }>;
    sizes?: RelationOneOrMany<{ label?: string | null }>;
    patches?: RelationOneOrMany<{ name?: string | null }>;
    players?: RelationOneOrMany<{ name?: string | null; number?: number | string | null }>;
}

export interface RawAnalyticsOrder {
    id: string;
    created_at: string;
    status?: string | null;
    total_amount?: number | null;
    deposit_amount?: number | null;
    discount_amount?: number | null;
    shipping_department?: string | null;
    shipping_municipality?: string | null;
    order_items?: RawOrderItem[] | null;
    payments?: RawOrderPayment[] | null;
}

export interface ProductSalesBucket {
    productId: string | null;
    slug: string;
    name: string;
    teamName: string | null;
    season: string | null;
    unitsSold: number;
    revenue: number;
    orderIds: Set<string>;
}

export interface OrdersAggregation {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    depositPercentage: number;
    pixelpayOrdersCount: number;
    transferOrdersCount: number;
    discountedOrdersCount: number;
    discountUsageRate: number;
    totalDiscountAmount: number;
    hourlyOrders: number[];
    hourlyRevenue: number[];
    dailyMap: Map<string, { orders: number; revenue: number }>;
    productSalesBySlug: Map<string, ProductSalesBucket>;
    productSalesByName: Map<string, ProductSalesBucket>;
    slugByProductId: Map<string, string>;
    slugByProductName: Map<string, string>;
    purchasedSizeMap: Map<string, number>;
    purchasedVersionMap: Map<string, number>;
    purchasedPatchCounts: { withPatchUnits: number; totalUnits: number };
    purchasedPlayerMap: Map<string, { name: string; number: string | null; count: number }>;
    shippingRegions: Map<string, {
        department: string;
        municipalityCounts: Map<string, number>;
        orders: number;
        revenue: number;
    }>;
}

function unwrap<T>(rel: RelationOneOrMany<T>): T | null {
    if (!rel) return null;
    return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

export function resolveOrderChannel(payments?: RawOrderPayment[] | null): 'pixelpay' | 'transfer' {
    if (!payments || payments.length === 0) return 'transfer';
    for (const p of payments) {
        const provider = (p.provider || '').toLowerCase();
        const method = (p.method || '').toLowerCase();
        if (provider.includes('pixelpay') || method.includes('tarjeta') || method.includes('pixelpay')) {
            return 'pixelpay';
        }
    }
    return 'transfer';
}

export function isDepositOrder(order: RawAnalyticsOrder): boolean {
    const payments = order.payments || [];
    if (payments.some((p) => (p.type || '').toLowerCase() === 'full')) {
        return false;
    }
    if (payments.some((p) => (p.type || '').toLowerCase() === 'deposit')) {
        return true;
    }
    const total = Number(order.total_amount) || 0;
    const deposit = Number(order.deposit_amount) || 0;
    return deposit > 0 && deposit < total;
}

export function aggregateOrders(rawOrders: RawAnalyticsOrder[]): OrdersAggregation {
    const agg: OrdersAggregation = {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        depositPercentage: 0,
        pixelpayOrdersCount: 0,
        transferOrdersCount: 0,
        discountedOrdersCount: 0,
        discountUsageRate: 0,
        totalDiscountAmount: 0,
        hourlyOrders: new Array(24).fill(0),
        hourlyRevenue: new Array(24).fill(0),
        dailyMap: new Map(),
        productSalesBySlug: new Map(),
        productSalesByName: new Map(),
        slugByProductId: new Map(),
        slugByProductName: new Map(),
        purchasedSizeMap: new Map(),
        purchasedVersionMap: new Map(),
        purchasedPatchCounts: { withPatchUnits: 0, totalUnits: 0 },
        purchasedPlayerMap: new Map(),
        shippingRegions: new Map(),
    };

    let depositOrdersCount = 0;

    for (const order of rawOrders) {
        if (isCancelledStatus(order.status)) continue;

        const orderTotal = Number(order.total_amount) || 0;
        const orderDiscount = Number(order.discount_amount) || 0;

        agg.totalOrders++;
        agg.totalRevenue += orderTotal;

        if (isDepositOrder(order)) {
            depositOrdersCount++;
        }

        if (resolveOrderChannel(order.payments) === 'pixelpay') {
            agg.pixelpayOrdersCount++;
        } else {
            agg.transferOrdersCount++;
        }

        if (orderDiscount > 0) {
            agg.discountedOrdersCount++;
            agg.totalDiscountAmount += orderDiscount;
        }

        // Tiempo local (UTC-6)
        if (order.created_at) {
            const d = new Date(order.created_at);
            if (!isNaN(d.getTime())) {
                const hourLocal = getStoreDateParts(d).hour;
                if (hourLocal >= 0 && hourLocal < 24) {
                    agg.hourlyOrders[hourLocal]++;
                    agg.hourlyRevenue[hourLocal] += orderTotal;
                }

                const dateKey = formatDateKeyInStoreTz(d);
                const dayObj = agg.dailyMap.get(dateKey) || { orders: 0, revenue: 0 };
                dayObj.orders++;
                dayObj.revenue += orderTotal;
                agg.dailyMap.set(dateKey, dayObj);
            }
        }

        // Departamento y municipio de envío real
        const rawDept = (order.shipping_department || '').trim();
        if (rawDept) {
            const deptKey = rawDept.toLowerCase();
            const existingRegion = agg.shippingRegions.get(deptKey) || {
                department: rawDept,
                municipalityCounts: new Map<string, number>(),
                orders: 0,
                revenue: 0,
            };
            existingRegion.orders++;
            existingRegion.revenue += orderTotal;
            const muni = (order.shipping_municipality || '').trim();
            if (muni) {
                existingRegion.municipalityCounts.set(muni, (existingRegion.municipalityCounts.get(muni) || 0) + 1);
            }
            agg.shippingRegions.set(deptKey, existingRegion);
        }

        // Desglose por item vendido
        for (const item of order.order_items || []) {
            const qty = Math.max(0, Number(item.quantity) || 0);
            if (qty === 0) continue;

            const lineRevenue = (Number(item.unit_price) || 0) * qty;
            const prod = unwrap(item.products);
            const variant = unwrap(item.product_variants);
            const size = unwrap(item.sizes);
            const patch = unwrap(item.patches);
            const player = unwrap(item.players);

            if (prod) {
                const prodSlug = (prod.slug || '').trim() || normalizeProductKey(prod.name);
                const prodName = (prod.name || prodSlug || 'Camiseta').trim();
                const teamObj = unwrap(prod.teams);
                const teamName = teamObj?.name?.trim() || null;

                if (prod.id && prod.slug) {
                    agg.slugByProductId.set(prod.id, prod.slug);
                }
                if (prodName && prod.slug) {
                    agg.slugByProductName.set(normalizeProductKey(prodName), prod.slug);
                }

                if (prodSlug) {
                    const existingBucket = agg.productSalesBySlug.get(prodSlug);
                    if (!existingBucket) {
                        const bucket: ProductSalesBucket = {
                            productId: prod.id || null,
                            slug: prodSlug,
                            name: prodName,
                            teamName,
                            season: prod.season || null,
                            unitsSold: qty,
                            revenue: lineRevenue,
                            orderIds: new Set([order.id]),
                        };
                        agg.productSalesBySlug.set(prodSlug, bucket);
                        agg.productSalesByName.set(normalizeProductKey(prodName), bucket);
                    } else {
                        existingBucket.unitsSold += qty;
                        existingBucket.revenue += lineRevenue;
                        existingBucket.orderIds.add(order.id);
                    }
                }
            }

            if (size?.label) {
                const sKey = size.label.trim().toUpperCase();
                agg.purchasedSizeMap.set(sKey, (agg.purchasedSizeMap.get(sKey) || 0) + qty);
            }

            const versionLabel = normalizeVersionLabel(variant?.version);
            if (versionLabel) {
                agg.purchasedVersionMap.set(versionLabel, (agg.purchasedVersionMap.get(versionLabel) || 0) + qty);
            }

            agg.purchasedPatchCounts.totalUnits += qty;
            if (patch?.name && patch.name.trim().toLowerCase() !== 'ninguno' && patch.name.trim().toLowerCase() !== 'sin parche') {
                agg.purchasedPatchCounts.withPatchUnits += qty;
            }

            const playerName = (player?.name || item.custom_name || '').trim();
            const playerNumber = player?.number != null
                ? String(player.number).trim()
                : item.custom_number
                    ? String(item.custom_number).trim()
                    : '';

            if (playerName) {
                const pKey = `${playerName.toLowerCase()}__${playerNumber}`;
                const existingP = agg.purchasedPlayerMap.get(pKey);
                agg.purchasedPlayerMap.set(pKey, {
                    name: playerName,
                    number: playerNumber || null,
                    count: (existingP?.count || 0) + qty,
                });
            }
        }
    }

    agg.averageOrderValue = agg.totalOrders > 0 ? Math.round(agg.totalRevenue / agg.totalOrders) : 0;
    agg.depositPercentage = agg.totalOrders > 0 ? Math.round((depositOrdersCount / agg.totalOrders) * 100) : 0;
    agg.discountUsageRate = agg.totalOrders > 0 ? Math.round((agg.discountedOrdersCount / agg.totalOrders) * 100) : 0;

    return agg;
}

