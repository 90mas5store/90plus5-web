import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convertHnlToUsd, getExchangeRate, invalidateExchangeRateCache } from '@/lib/exchangeRate';

vi.mock('@/lib/supabase/admin', () => ({
    createAdminClient: () => ({
        from: () => ({
            select: () => ({
                eq: () => ({
                    maybeSingle: vi.fn().mockResolvedValue({
                        data: { value: { rate: 26.85 } },
                        error: null,
                    }),
                    single: vi.fn().mockResolvedValue({
                        data: { value: { rate: 26.85 } },
                        error: null,
                    }),
                }),
            }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
        }),
    }),
}));

describe('Exchange Rate Utility (HNL ➡️ USD)', () => {
    beforeEach(() => {
        invalidateExchangeRateCache();
    });

    it('converts HNL to USD correctly with 2 decimal rounding', () => {
        const rate = 26.80;
        expect(convertHnlToUsd(1200, rate)).toBe(44.78);
        expect(convertHnlToUsd(2680, rate)).toBe(100.00);
        expect(convertHnlToUsd(670, rate)).toBe(25.00);
        expect(convertHnlToUsd(0, rate)).toBe(0);
        expect(convertHnlToUsd(-50, rate)).toBe(0);
    });

    it('handles floating point precision safely', () => {
        const rate = 26.85;
        const result = convertHnlToUsd(950, rate);
        expect(result).toBe(35.38);
        expect(typeof result).toBe('number');
    });

    it('fetches rate from store_settings via getExchangeRate()', async () => {
        const rate = await getExchangeRate();
        expect(rate).toBe(26.85);
    });
});
