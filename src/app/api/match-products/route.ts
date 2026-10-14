import { NextRequest, NextResponse } from 'next/server';
import { supabase as publicSupabase } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { adaptSupabaseProductToProduct } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // 1 minuto de cache

function getClient() {
  try {
    return createAdminClient();
  } catch {
    return publicSupabase;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');
    const query = searchParams.get('query');
    const limit = Math.min(parseInt(searchParams.get('limit') || '4', 10), 8);

    if (!teamId && !query) {
      return NextResponse.json({ products: [] });
    }

    const client = getClient();
    let teamUuid = teamId;
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Si recibimos un slug o nombre, resolver el UUID del equipo
    if (teamUuid && !UUID_REGEX.test(teamUuid)) {
      const { data: teamData } = await client
        .from('teams')
        .select('id')
        .or(`slug.eq.${teamUuid},name.ilike.%${teamUuid}%`)
        .limit(1)
        .maybeSingle();
      if (teamData?.id) {
        teamUuid = teamData.id;
      }
    }

    // Si tenemos solo query y no teamUuid válido, intentar buscar el equipo
    if (!teamUuid && query) {
      const cleanQ = query.trim();
      const { data: teamData } = await client
        .from('teams')
        .select('id')
        .ilike('name', `%${cleanQ}%`)
        .limit(1)
        .maybeSingle();
      if (teamData?.id) {
        teamUuid = teamData.id;
      }
    }

    let productsQuery = client
      .from('products')
      .select(`
        id,
        name,
        slug,
        image_url,
        featured,
        sort_order,
        team_id,
        category_id,
        league_id,
        brand_id,
        trending_until,
        season,
        teams (
          id,
          name,
          logo_url
        ),
        brands (
          name,
          slug,
          logo_url
        ),
        product_variants (
          id,
          version,
          price,
          active
        ),
        product_leagues (
          league_id
        )
      `)
      .eq('active', true);

    if (teamUuid && UUID_REGEX.test(teamUuid)) {
      productsQuery = productsQuery.eq('team_id', teamUuid);
    } else if (query) {
      productsQuery = productsQuery.ilike('name', `%${query.trim()}%`);
    }

    productsQuery = productsQuery
      .order('featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .limit(limit);

    const { data, error } = await productsQuery;

    if (error) {
      console.warn('[match-products] Error fetching products:', error.message);
      return NextResponse.json({ products: [] });
    }

    const products = (data || []).map(adaptSupabaseProductToProduct);
    return NextResponse.json({ products });
  } catch (err: any) {
    console.error('[match-products] Exception:', err?.message || err);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}

