import { NextResponse } from 'next/server';
import { generateMetaProductFeed } from '@/lib/catalog/metaFeed';

export const revalidate = 3600;

export async function GET() {
    try {
        const xml = await generateMetaProductFeed();

        return new NextResponse(xml, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    } catch (error) {
        console.error('Error generating Meta catalog feed:', error);
        return new NextResponse('Error generating feed', { status: 500 });
    }
}
