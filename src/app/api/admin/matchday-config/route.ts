import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ManualMatchdayStore } from '@/lib/matchdayStore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { teamId, is_matchday_active, matchday_opponent, matchday_score, matchday_period } = body;

    if (!teamId) {
      return NextResponse.json({ error: 'teamId es requerido' }, { status: 400 });
    }

    const config: ManualMatchdayStore = {
      is_matchday_active: !!is_matchday_active,
      matchday_opponent: matchday_opponent || '',
      matchday_score: matchday_score || '0-0',
      matchday_period: matchday_period || 'En Vivo',
    };

    // Supabase es la fuente de verdad. En Vercel la memoria y el filesystem no
    // son persistentes ni se comparten entre instancias de funciones.
    const supabase = createAdminClient();
    const payload = {
      is_matchday_active: config.is_matchday_active,
      matchday_opponent: config.matchday_opponent,
      matchday_score: config.matchday_score,
      matchday_period: config.matchday_period,
    };

    const { error } = await supabase.from('teams').update(payload).eq('id', teamId);
    if (error) {
      console.error('[matchday-config] Error saving configuration to Supabase:', error);
      return NextResponse.json(
        { error: 'No se pudo guardar la configuración de Matchday en Supabase.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, teamId, config });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
