import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/analytics/track/route';

vi.mock('@/lib/supabase/admin', () => ({
    createAdminClient: () => ({
        from: () => ({
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
    }),
}));

vi.mock('@/lib/rateLimit', () => ({
    checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
    getClientIp: () => '127.0.0.1',
}));

describe('Analytics Track API (/api/analytics/track)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects invalid event types with 400', async () => {
        const req = new NextRequest('http://localhost:3000/api/analytics/track', {
            method: 'POST',
            body: JSON.stringify({
                event_type: 'invalid_event',
                path: '/catalogo',
            }),
        });

        const res = await POST(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('Invalid payload');
    });

    it('ignores tracking on /admin paths and returns 200 with ignored flag', async () => {
        const req = new NextRequest('http://localhost:3000/api/analytics/track', {
            method: 'POST',
            body: JSON.stringify({
                event_type: 'page_view',
                path: '/admin/productos',
            }),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.ignored).toBe(true);
    });

    it('successfully processes valid page_view event', async () => {
        const req = new NextRequest('http://localhost:3000/api/analytics/track', {
            method: 'POST',
            body: JSON.stringify({
                event_type: 'page_view',
                path: '/catalogo',
                referrer: 'https://instagram.com',
                device: 'mobile',
                session_id: 'sess_123',
                metadata: { utm_source: 'instagram' },
            }),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.ok).toBe(true);
    });

    it('successfully processes valid product_view event with metadata', async () => {
        const req = new NextRequest('http://localhost:3000/api/analytics/track', {
            method: 'POST',
            body: JSON.stringify({
                event_type: 'product_view',
                path: '/producto/real-madrid-2026',
                metadata: {
                    slug: 'real-madrid-2026',
                    productName: 'Real Madrid Local 25/26',
                    teamName: 'Real Madrid',
                },
            }),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.ok).toBe(true);
    });
});
