import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface CustomerReportItem {
    email: string
    name: string
    phone: string
    totalSpent: number
    totalOrders: number
    totalJerseys: number
    avgOrderValue: number
    lastOrderDate: string
    freeJerseysEarned: number
    jerseysUntilNext: number
    loyaltyTier: 'VIP_LEGEND' | 'LOYAL_FAN' | 'STARTER_FAN'
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        // 🔐 Verificar sesión admin
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const searchParams = request.nextUrl.searchParams
        const minJerseys = parseInt(searchParams.get('minJerseys') || '1', 10)

        // Obtener órdenes con sus items (excluyendo canceladas)
        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
                id,
                created_at,
                customer_name,
                customer_email,
                customer_phone,
                status,
                total_amount,
                order_items (quantity)
            `)
            .neq('status', 'Cancelled')
            .neq('status', 'cancelled')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[top-buyers] Supabase error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Agrupar por correo electrónico del comprador
        const customerMap = new Map<string, {
            email: string
            name: string
            phone: string
            totalSpent: number
            totalOrders: number
            totalJerseys: number
            lastOrderDate: string
        }>()

        for (const order of orders || []) {
            if (!order.customer_email) continue
            const emailKey = order.customer_email.toLowerCase().trim()
            const jerseysCount = (order.order_items || []).reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0)
            const spent = Number(order.total_amount) || 0

            const existing = customerMap.get(emailKey)
            if (existing) {
                existing.totalSpent += spent
                existing.totalOrders += 1
                existing.totalJerseys += jerseysCount
                if (new Date(order.created_at) > new Date(existing.lastOrderDate)) {
                    existing.lastOrderDate = order.created_at
                }
                if (!existing.phone && order.customer_phone) existing.phone = order.customer_phone
                if (!existing.name && order.customer_name) existing.name = order.customer_name
            } else {
                customerMap.set(emailKey, {
                    email: emailKey,
                    name: order.customer_name || 'Cliente sin nombre',
                    phone: order.customer_phone || '',
                    totalSpent: spent,
                    totalOrders: 1,
                    totalJerseys: jerseysCount,
                    lastOrderDate: order.created_at,
                })
            }
        }

        // Calcular niveles de fidelidad y recompensas de 5ta camisa
        const results: CustomerReportItem[] = Array.from(customerMap.values())
            .map(c => {
                const totalJerseys = c.totalJerseys
                const freeJerseysEarned = Math.floor(totalJerseys / 5)
                const remainder = totalJerseys % 5
                const jerseysUntilNext = remainder === 0 ? 5 : 5 - remainder

                let loyaltyTier: 'VIP_LEGEND' | 'LOYAL_FAN' | 'STARTER_FAN' = 'STARTER_FAN'
                if (totalJerseys >= 5) {
                    loyaltyTier = 'VIP_LEGEND'
                } else if (totalJerseys >= 3) {
                    loyaltyTier = 'LOYAL_FAN'
                }

                return {
                    ...c,
                    avgOrderValue: c.totalOrders > 0 ? c.totalSpent / c.totalOrders : 0,
                    freeJerseysEarned,
                    jerseysUntilNext,
                    loyaltyTier,
                }
            })
            .filter(c => c.totalJerseys >= minJerseys)
            .sort((a, b) => b.totalSpent - a.totalSpent)

        return NextResponse.json(results)
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error interno'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
