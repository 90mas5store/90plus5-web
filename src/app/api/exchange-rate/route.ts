import { NextResponse } from 'next/server';
import { getExchangeRate } from '@/lib/exchangeRate';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const rate = await getExchangeRate();
        return NextResponse.json(
            {
                rate,
                base: 'USD',
                target: 'HNL',
                timestamp: Date.now(),
            },
            {
                headers: {
                    'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
                },
            }
        );
    } catch (err) {
        console.error('[API /api/exchange-rate] Error:', err);
        return NextResponse.json({ rate: 26.80, base: 'USD', target: 'HNL' });
    }
}
