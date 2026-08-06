import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        // 🔐 Verificar autenticación
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const searchParams = request.nextUrl.searchParams
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        if (!startDate || !endDate) {
            return NextResponse.json({ error: 'Fechas requeridas' }, { status: 400 })
        }

        const startDateISO = `${startDate}T00:00:00.000Z`
        const endDateISO = `${endDate}T23:59:59.999Z`

        const adminSupabase = createAdminClient()

        // 1. Fetch share events and products map in parallel
        const [shareRes, prodRes] = await Promise.all([
            adminSupabase
                .from('product_share_events')
                .select('product_slug, product_name, team_name, created_at')
                .gte('created_at', startDateISO)
                .lte('created_at', endDateISO),

            adminSupabase
                .from('products')
                .select('slug, name, season, teams(name), brands(name)')
                .is('deleted_at', null)
        ])

        if (shareRes.error) {
            console.error('[reports/shares] share query error:', shareRes.error)
            return NextResponse.json({ error: shareRes.error.message }, { status: 500 })
        }

        // Map product slug & name -> product details (team, season)
        const productMap = new Map<string, { team_name: string | null; season: string | null; name: string }>()
        if (prodRes.data) {
            for (const p of prodRes.data as any[]) {
                const teamObj = Array.isArray(p.teams) ? p.teams[0] : p.teams
                const brandObj = Array.isArray(p.brands) ? p.brands[0] : p.brands
                const teamName = teamObj?.name || brandObj?.name || null
                const details = { team_name: teamName, season: p.season || null, name: p.name }
                if (p.slug) productMap.set(p.slug.toLowerCase(), details)
                if (p.name) productMap.set(p.name.toLowerCase(), details)
            }
        }

        // Enrich share events
        const enrichedEvents = (shareRes.data || []).map(event => {
            const slugKey = (event.product_slug || '').toLowerCase()
            const nameKey = (event.product_name || '').toLowerCase()
            const prodDetails = productMap.get(slugKey) || productMap.get(nameKey)

            return {
                product_slug: event.product_slug,
                product_name: prodDetails?.name || event.product_name,
                team_name: prodDetails?.team_name || event.team_name || null,
                season: prodDetails?.season || null,
                created_at: event.created_at,
            }
        })

        return NextResponse.json(enrichedEvents)

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error interno';
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}
