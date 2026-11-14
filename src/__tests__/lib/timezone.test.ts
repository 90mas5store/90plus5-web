import { describe, it, expect } from 'vitest';
import {
    getStoreDateParts,
    getStartOfDayInStoreTz,
    formatDateKeyInStoreTz,
    getRecentDaysInStoreTz,
} from '@/lib/analytics/timezone';

describe('Analytics Timezone Utilities (America/Tegucigalpa UTC-6)', () => {
    it('correctly maps UTC time between 18:00 and 23:59 to the local day', () => {
        // En UTC: 2026-11-13T02:00:00Z (las 2:00 AM del 13 en UTC)
        // En UTC-6 (Honduras): son las 20:00 (8:00 PM) del día 12 (2026-11-12)
        const utcEveningDate = new Date('2026-11-13T02:00:00Z');
        const dateKey = formatDateKeyInStoreTz(utcEveningDate);
        expect(dateKey).toBe('2026-11-12');
    });

    it('correctly maps UTC time past local midnight to the next local day', () => {
        // En UTC: 2026-11-13T06:30:00Z (las 6:30 AM del 13 en UTC)
        // En UTC-6 (Honduras): son las 00:30 (12:30 AM) del día 13 (2026-11-13)
        const utcMorningDate = new Date('2026-11-13T06:30:00Z');
        const dateKey = formatDateKeyInStoreTz(utcMorningDate);
        expect(dateKey).toBe('2026-11-13');
    });

    it('calculates the start of day (midnight local) in UTC correctly', () => {
        // En Honduras, la medianoche del 2026-11-12 (00:00:00 UTC-6) equivale a las 06:00:00Z en UTC
        const testDate = new Date('2026-11-12T15:00:00Z'); // 9:00 AM local del 12
        const startOfDay = getStartOfDayInStoreTz(testDate);
        
        expect(startOfDay.toISOString()).toBe('2026-11-12T06:00:00.000Z');
    });

    it('generates recent days list in local timezone', () => {
        const testDate = new Date('2026-11-13T02:00:00Z'); // Día local: 2026-11-12
        const days = getRecentDaysInStoreTz(3, testDate);
        expect(days).toEqual(['2026-11-10', '2026-11-11', '2026-11-12']);
    });
});

