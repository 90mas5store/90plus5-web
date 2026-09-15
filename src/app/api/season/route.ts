import { NextResponse } from 'next/server';
import { getSeasonSettings } from '@/lib/seasonSettings';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const settings = await getSeasonSettings();
        return NextResponse.json(settings, {
            headers: {
                'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
            },
        });
    } catch (err) {
        console.error('[API /api/season] Error:', err);
        return NextResponse.json({
            season: '2026/27',
            seasonShort: '26/27',
            badge: 'NOVEDADES',
            title: 'Equipaciones 2026/27',
            subtitle: 'Versión Jugador y Aficionado bajo pedido con personalización oficial.',
            buttonText: 'Explorar Catálogo',
        });
    }
}
