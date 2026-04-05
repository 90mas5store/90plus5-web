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
                created_at,
                status,
                total_amount,
                subtotal,
                customer_name,
                order_items (
                    quantity,
                    unit_price,
                    products (name, teams(name)),
                    product_variants (cost)
                ),
                payments:payments!payments_order_id_fkey (
                    amount,
                    method,
                    notes,
                    status,
                    type
                )
            `)
            .gte('created_at', startDate)
            .lte('created_at', endDateAdjusted.toISOString())

        if (status && status !== 'all') {
            const statuses = status.split(',')
            query = query.in('status', statuses)
        }

        const { data: orders, error } = await query.order('created_at', { ascending: false })

        if (error) {
            console.error('[accounting] Supabase error:', error)
            return NextResponse.json({ error: error.message, details: error }, { status: 500 })
        }

        return NextResponse.json(orders || [])

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error interno'
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}
