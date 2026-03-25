import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 🛡️ A6 FIX: Sanitizar valores para prevenir inyección CSV/Excel
// Valores que empiezan con =, +, -, @ pueden ejecutar fórmulas en Excel/Sheets
function sanitizeCsvValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (/^[=+\-@\t\r]/.test(str)) {
        return `'${str}`; // Prefixar con apóstrofe para evitar interpretación como fórmula
    }
    return str;
}

// Sanitizar un objeto completo recursivamente
function sanitizeOrderForExport(order: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(order)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeCsvValue(value);
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map(item =>
                typeof item === 'object' && item !== null
                    ? sanitizeOrderForExport(item as Record<string, unknown>)
                    : sanitizeCsvValue(item)
            );
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeOrderForExport(value as Record<string, unknown>);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

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

        // 🛡️ A6 FIX: Sanitizar datos antes de enviarlos (protege contra CSV injection)
        const sanitizedOrders = (orders || []).map(order =>
            sanitizeOrderForExport(order as Record<string, unknown>)
        );

        // Devolver datos JSON puros (sanitizados)
        return NextResponse.json(sanitizedOrders)

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error interno';
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}
