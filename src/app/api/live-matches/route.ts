import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { LiveMatchData } from '@/hooks/useLiveMatches';

// Caché en memoria: 2 minutos (respeta el free tier de football-data.org, 10 req/min)
let liveCache: { data: Record<string, LiveMatchData>; ts: number } | null = null;
const CACHE_TTL = 2 * 60 * 1000;

export const dynamic = 'force-dynamic';

export async function GET() {
    const apiKey = process.env.FOOTBALL_DATA_API_KEY;
    if (!apiKey) {
        return NextResponse.json({});
    }

    const now = Date.now();
    if (liveCache && now - liveCache.ts < CACHE_TTL) {
        return NextResponse.json(liveCache.data, {
            headers: { 'Cache-Control': 'public, max-age=120' },
        });
    }

    try {
        const matchRes = await fetch('https://api.football-data.org/v4/matches?status=IN_PLAY', {
            headers: { 'X-Auth-Token': apiKey },
            signal: AbortSignal.timeout(5000),
        });

        if (!matchRes.ok) {
            // Devolver caché anterior si falla la API
            return NextResponse.json(liveCache?.data ?? {});
        }

        const json = await matchRes.json();
        const matches: Record<string, unknown>[] = json.matches ?? [];

        if (matches.length === 0) {
            liveCache = { data: {}, ts: now };
            return NextResponse.json({}, { headers: { 'Cache-Control': 'public, max-age=120' } });
        }

        // Recopilar todos los IDs de football-data.org presentes en partidos activos
        const fdIds = new Set<number>();
        for (const m of matches) {
            fdIds.add((m.homeTeam as { id: number }).id);
            fdIds.add((m.awayTeam as { id: number }).id);
        }

        // Mapear football_data_id → UUID de nuestro equipo
        const supabase = createAdminClient();
        const { data: teamsData } = await supabase
            .from('teams')
            .select('id, football_data_id')
            .in('football_data_id', [...fdIds]);

        const fdToUuid = new Map<number, string>();
        for (const t of teamsData ?? []) {
            if (t.football_data_id) fdToUuid.set(t.football_data_id, t.id);
        }

        const result: Record<string, LiveMatchData> = {};

        for (const m of matches) {
            const home = m.homeTeam as { id: number; name: string };
            const away = m.awayTeam as { id: number; name: string };
            const score = m.score as {
                fullTime?: { home: number | null; away: number | null };
                halfTime?: { home: number | null; away: number | null };
            };

            const homeScore = score?.fullTime?.home ?? score?.halfTime?.home ?? 0;
            const awayScore = score?.fullTime?.away ?? score?.halfTime?.away ?? 0;
            const minute = (m.minute as number | null) ?? null;

            const homeUuid = fdToUuid.get(home.id);
            const awayUuid = fdToUuid.get(away.id);

            if (homeUuid) {
                result[homeUuid] = {
                    homeTeam: home.name,
                    awayTeam: away.name,
                    homeScore: homeScore ?? 0,
                    awayScore: awayScore ?? 0,
                    minute,
                    isHome: true,
                };
            }
            if (awayUuid) {
                result[awayUuid] = {
                    homeTeam: home.name,
                    awayTeam: away.name,
                    homeScore: homeScore ?? 0,
                    awayScore: awayScore ?? 0,
                    minute,
                    isHome: false,
                };
            }
        }

        liveCache = { data: result, ts: now };
        return NextResponse.json(result, {
            headers: { 'Cache-Control': 'public, max-age=120' },
        });

    } catch (err) {
        console.error('[live-matches] Error:', err);
        return NextResponse.json(liveCache?.data ?? {});
    }
}
