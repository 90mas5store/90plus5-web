import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  DEFAULT_LEAGUES,
  DISCOVERY_LEAGUES_CATALOG,
  POPULAR_TEAMS_DIRECTORY,
  SETTINGS_KEY,
  getMatchdayLeaguesConfig,
  invalidateMatchdayLeaguesCache,
  type LeagueDefinition,
} from '@/lib/matchdayLeagues';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

const customLeagueSchema = z.object({
  slug: z.string().min(2).max(60).regex(/^[a-z0-9._-]+$/, 'Slug inválido (solo minúsculas, números, puntos y guiones)'),
  name: z.string().min(2).max(100),
  category: z.enum([
    'Ligas Principales',
    'Copas Nacionales',
    'Torneos Continentales',
    'Selecciones & FIFA',
    'Personalizados',
  ]),
  country: z.string().max(60).optional(),
});

const updateTorneosSchema = z.object({
  custom_leagues: z.array(customLeagueSchema),
  disabled_leagues: z.array(z.string()),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Comprobador de slug ESPN en vivo: ?testSlug=arg.copa
    const testSlug = request.nextUrl.searchParams.get('testSlug')?.trim()?.toLowerCase();
    if (testSlug) {
      try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${encodeURIComponent(testSlug)}/scoreboard`;
        const res = await fetch(url, {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          },
          signal: AbortSignal.timeout(4000),
        });

        if (res.ok) {
          const data = await res.json();
          const leagueName = data.leagues?.[0]?.name || data.leagues?.[0]?.abbreviation || testSlug;
          return NextResponse.json({
            valid: true,
            slug: testSlug,
            name: leagueName,
            eventsCount: data.events?.length ?? 0,
          });
        }
        return NextResponse.json({
          valid: false,
          slug: testSlug,
          message: `ESPN respondió con estado HTTP ${res.status}. Verifica que el slug sea exacto.`,
        });
      } catch (err: any) {
        return NextResponse.json({
          valid: false,
          slug: testSlug,
          message: `Error al conectar con ESPN: ${err?.message || 'Tiempo de espera agotado'}`,
        });
      }
    }

    const config = await getMatchdayLeaguesConfig();
    return NextResponse.json({
      default_leagues: DEFAULT_LEAGUES,
      custom_leagues: config.custom_leagues,
      disabled_leagues: config.disabled_leagues,
      suggested_leagues: DISCOVERY_LEAGUES_CATALOG,
      popular_teams: POPULAR_TEAMS_DIRECTORY,
      updated_at: config.updated_at,
    });
  } catch (err) {
    console.error('[admin/settings/torneos GET] Error:', err);
    return NextResponse.json({ error: 'Error al consultar torneos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateTorneosSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Datos inválidos' },
        { status: 400 }
      );
    }

    const adminDb = createAdminClient();
    const payload = {
      custom_leagues: parsed.data.custom_leagues,
      disabled_leagues: parsed.data.disabled_leagues,
    };

    const { data, error } = await adminDb
      .from('store_settings')
      .upsert(
        {
          key: SETTINGS_KEY,
          value: payload,
          description: 'Lista dinámica de ligas y copas ESPN consultadas en Matchday en tiempo real',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      )
      .select()
      .single();

    if (error) {
      console.error('[admin/settings/torneos POST] Error updating DB:', error);
      return NextResponse.json({ error: 'Error al guardar en base de datos' }, { status: 500 });
    }

    // Invalidar caché local en memoria
    invalidateMatchdayLeaguesCache();

    // Revalidar paths de Next.js
    try {
      revalidatePath('/', 'page');
      revalidatePath('/api/live-matches');
    } catch { /* ignore */ }

    return NextResponse.json({
      success: true,
      data: payload,
      updated_at: data?.updated_at,
      message: 'Torneos de Matchday actualizados correctamente',
    });
  } catch (err) {
    console.error('[admin/settings/torneos POST] Error:', err);
    return NextResponse.json({ error: 'Error al actualizar torneos' }, { status: 500 });
  }
}
