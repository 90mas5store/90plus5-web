/**
 * Meta Pixel (Facebook Pixel) client-side helper functions.
 * All functions safely verify that window.fbq is present and ready,
 * ensuring no crashes when cookies are rejected or during SSR.
 */

declare global {
    interface Window {
        fbq: (command: string, eventName: string, params?: Record<string, unknown>) => void;
    }
}

import { isAnalyticsExcluded } from './exclusion';

export interface MetaProductTrackParams {
    id: string;
    name: string;
    price: number;
    currency?: string;
    category?: string;
}

export function trackMetaEvent(eventName: string, params?: Record<string, unknown>): void {
    if (typeof window === 'undefined') return;
    if (isAnalyticsExcluded()) return;
    if (typeof window.fbq === 'function') {
        window.fbq('track', eventName, params);
    }
}

/**
 * Fired when a user visits a product details page.
 * Required by Meta Catalog to sync product microdata & dynamic product ads.
 */
export function trackMetaViewContent(params: MetaProductTrackParams): void {
    trackMetaEvent('ViewContent', {
        content_ids: [params.id],
        content_name: params.name,
        content_type: 'product',
        content_category: params.category || 'Deportes',
        value: Number(params.price) || 0,
        currency: params.currency || 'HNL',
    });
}

/**
 * Fired when a user adds a product/variant to cart.
 */
export function trackMetaAddToCart(params: MetaProductTrackParams): void {
    trackMetaEvent('AddToCart', {
        content_ids: [params.id],
        content_name: params.name,
        content_type: 'product',
        value: Number(params.price) || 0,
        currency: params.currency || 'HNL',
    });
}

/**
 * Fired when checkout starts.
 */
export function trackMetaInitiateCheckout(params: {
    ids: string[];
    value: number;
    numItems: number;
    currency?: string;
}): void {
    trackMetaEvent('InitiateCheckout', {
        content_ids: params.ids,
        content_type: 'product',
        value: Number(params.value) || 0,
        num_items: params.numItems,
        currency: params.currency || 'HNL',
    });
}

/**
 * Fired on successful order completion.
 */
export function trackMetaPurchase(params: {
    orderId: string;
    ids: string[];
    value: number;
    numItems: number;
    currency?: string;
}): void {
    trackMetaEvent('Purchase', {
        content_ids: params.ids,
        content_type: 'product',
        value: Number(params.value) || 0,
        num_items: params.numItems,
        currency: params.currency || 'HNL',
    });
}
