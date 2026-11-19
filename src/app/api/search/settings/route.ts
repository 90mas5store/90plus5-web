import { NextResponse } from 'next/server';
import { getSearchSettings, DEFAULT_SEARCH_SETTINGS } from '@/lib/search/searchSettings';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const settings = await getSearchSettings();
        return NextResponse.json(settings, {
            headers: {
                'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
            },
        });
    } catch (err) {
        console.error('[API /api/search/settings] Error:', err);
        return NextResponse.json(DEFAULT_SEARCH_SETTINGS);
    }
}
