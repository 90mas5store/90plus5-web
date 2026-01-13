import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        // 🔐 Verificar autenticación
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Obtener parámetros de la URL
        const searchParams = request.nextUrl.searchParams
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const status = searchParams.get('status')

        if (!startDate || !endDate) {
            return NextResponse.json({ error: 'Fechas requeridas' }, { status: 400 })
        }

        // Ajustar endDate para incluir todo el día
        const endDateAdjusted = new Date(endDate)
        endDateAdjusted.setHours(23, 59, 59, 999)

        // 📊 Obtener pedidos con sus items
        let query = supabase
            .from('orders')
            .select(`
                id,
                created_at,
                customer_name,
                customer_email,
                customer_phone,
                status,
                total_amount,
                order_items (
                    quantity,
                    unit_price,
                    personalization_type,
                    custom_name,
                    custom_number,
                    products (name, teams (name)),
                    product_variants (version),
                    sizes (label),
                    patches (name),
                    players (name, number)
                )
            `)
            .gte('created_at', startDate)
            .lte('created_at', endDateAdjusted.toISOString())

        // Aplicar filtro de estado múltiple
        if (status && status !== 'all') {
            const statuses = status.split(',')
            query = query.in('status', statuses)
        }

        const { data: orders, error } = await query.order('created_at', { ascending: false })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Devolver datos JSON puros
        return NextResponse.json(orders)

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
