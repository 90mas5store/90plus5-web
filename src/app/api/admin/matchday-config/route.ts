import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { setManualMatchdayConfig, ManualMatchdayStore } from '@/lib/matchdayStore';

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

    // Guardar en memoria para respuesta inmediata
    setManualMatchdayConfig(teamId, config);

    // Intentar guardar en Supabase (si las columnas existen)
    const supabase = createAdminClient();
    try {
      const payload = {
        is_matchday_active: config.is_matchday_active,
        matchday_opponent: config.matchday_opponent,
        matchday_score: config.matchday_score,
        matchday_period: config.matchday_period,
      };

      const { error } = await supabase.from('teams').update(payload).eq('id', teamId);
      if (error) {
        // Fallback a is_matchday_active básico si faltan columnas extendidas en PostgreSQL
        await supabase.from('teams').update({ is_matchday_active: config.is_matchday_active }).eq('id', teamId);
      }
    } catch (dbErr) {
      console.warn('[matchday-config] DB update fallback:', dbErr);
    }

    return NextResponse.json({ success: true, teamId, config });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
