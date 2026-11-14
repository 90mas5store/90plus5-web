import {
    formatDateKeyInStoreTz,
    getStartOfDayInStoreTz,
    STORE_TIMEZONE,
} from './timezone';
import type { AnalyticsRange } from './types';

export interface AnalyticsDateRangeResult {
    range: AnalyticsRange;
    startDate: Date;
    endDate: Date;
    prevStartDate: Date | null;
    prevEndDate: Date | null;
    daysToGenerate: number;
}

const VALID_RANGES: readonly AnalyticsRange[] = ['today', '7d', '30d', 'all'];

export function normalizeAnalyticsRange(raw?: string | null): AnalyticsRange {
    if (raw && (VALID_RANGES as readonly string[]).includes(raw)) {
        return raw as AnalyticsRange;
    }
    return '7d';
}

/**
 * Calcula las ventanas de tiempo exactas en hora local de la tienda (UTC-6)
 * junto con su período anterior equivalente para calcular deltas.
 */
export function getAnalyticsDateRange(
    rawRange?: string | null,
    now: Date = new Date(),
    timeZone: string = STORE_TIMEZONE
): AnalyticsDateRangeResult {
    const range = normalizeAnalyticsRange(rawRange);
    const endDate = now;
    const todayStart = getStartOfDayInStoreTz(now, timeZone);
    const DAY_MS = 24 * 60 * 60 * 1000;

    if (range === 'today') {
        const startDate = todayStart;
        const prevStartDate = new Date(todayStart.getTime() - DAY_MS);
        const prevEndDate = new Date(todayStart.getTime() - 1);
        return { range, startDate, endDate, prevStartDate, prevEndDate, daysToGenerate: 1 };
    }

    if (range === '30d') {
        const startDate = new Date(todayStart.getTime() - 29 * DAY_MS);
        const spanMs = endDate.getTime() - startDate.getTime();
        const prevEndDate = new Date(startDate.getTime() - 1);
        const prevStartDate = new Date(prevEndDate.getTime() - spanMs);
        return { range, startDate, endDate, prevStartDate, prevEndDate, daysToGenerate: 30 };
    }

    if (range === 'all') {
        return {
            range,
            startDate: new Date(0),
            endDate,
            prevStartDate: null,
            prevEndDate: null,
            daysToGenerate: 14,
        };
    }

    // Default: '7d' (hoy + 6 días previos completos en hora de Honduras)
    const startDate = new Date(todayStart.getTime() - 6 * DAY_MS);
    const spanMs = endDate.getTime() - startDate.getTime();
    const prevEndDate = new Date(startDate.getTime() - 1);
    const prevStartDate = new Date(prevEndDate.getTime() - spanMs);
    return { range, startDate, endDate, prevStartDate, prevEndDate, daysToGenerate: 7 };
}

/**
 * Retorna fechas 'YYYY-MM-DD' ancladas a America/Tegucigalpa (UTC-6)
 * para evitar el bug de cambio de día después de las 6:00 PM con .toISOString().
 */
export function getStoreRangeDateStrings(
    range: AnalyticsRange,
    now: Date = new Date(),
    timeZone: string = STORE_TIMEZONE
): { startStr: string; endStr: string } {
    const endStr = formatDateKeyInStoreTz(now, timeZone);

    if (range === 'today') {
        return { startStr: endStr, endStr };
    }

    if (range === '7d') {
        const start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
        return { startStr: formatDateKeyInStoreTz(start, timeZone), endStr };
    }

    if (range === '30d') {
        const start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
        return { startStr: formatDateKeyInStoreTz(start, timeZone), endStr };
    }

    return { startStr: '2024-01-01', endStr };
}

export function isCancelledStatus(status?: string | null): boolean {
    if (!status) return false;
    const normalized = status.trim().toLowerCase();
    return normalized === 'cancelled' || normalized === 'cancelado';
}

