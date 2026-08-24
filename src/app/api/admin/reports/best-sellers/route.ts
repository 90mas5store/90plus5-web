import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const searchParams = request.nextUrl.searchParams
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const status = searchParams.get('status')

        if (!startDate || !endDate) {
            return NextResponse.json({ error: 'Fechas requeridas' }, { status: 400 })
        }

        const endDateAdjusted = new Date(endDate)
        endDateAdjusted.setHours(23, 59, 59, 999)

        let query = supabase
            .from('orders')
            .select(`
                id,
                order_items (
                    quantity,
                    unit_price,
                    products (name, season, teams (name), brands (name))
                )
            `)
            .gte('created_at', startDate)
            .lte('created_at', endDateAdjusted.toISOString())

        if (status && status !== 'all') {
            const statuses = status.split(',')
            query = query.in('status', statuses)
        } else {
            query = query.neq('status', 'Cancelled').neq('status', 'cancelled')
        }

        const { data: orders, error } = await query.order('created_at', { ascending: false })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const map = new Map<string, { name: string; team_name: string | null; season: string | null; units: number; revenue: number }>()

        for (const order of (orders || [])) {
            for (const item of (order.order_items || [])) {
                const prod = Array.isArray(item.products) ? item.products[0] : item.products
                if (!prod) continue
                const name = prod.name || 'Sin nombre'
                const teamObj = Array.isArray(prod.teams) ? prod.teams[0] : prod.teams
                const brandObj = Array.isArray(prod.brands) ? prod.brands[0] : prod.brands
                const team_name = teamObj?.name || brandObj?.name || null
                const season = prod.season || null
                const key = `${team_name || ''}::${name}::${season || ''}`

                const existing = map.get(key) || { name, team_name, season, units: 0, revenue: 0 }
                existing.units += item.quantity || 0
                existing.revenue += (item.unit_price || 0) * (item.quantity || 0)
                map.set(key, existing)
            }
        }

        const sorted = Array.from(map.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 15)

        return NextResponse.json(sorted)
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error interno';
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}
