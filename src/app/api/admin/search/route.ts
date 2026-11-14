import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface AdminSearchOrderResult {
    id: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    customer_city: string;
    status: string;
    total_amount: number;
    created_at: string;
}

export interface AdminSearchProductResult {
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
    active: boolean;
    season: string | null;
    team_name: string | null;
    price: number;
}

export interface AdminSearchCustomerResult {
    name: string;
    phone: string;
    email: string;
    city: string;
    totalOrders: number;
    lastOrderId: string;
    lastOrderStatus: string;
    lastOrderDate: string;
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // 🔐 Verificar sesión admin
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { data: isAdmin } = await supabase.rpc('is_admin');
        if (!isAdmin) {
            return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
        }

        const searchParams = request.nextUrl.searchParams;
        const rawQuery = (searchParams.get('q') || '').trim();

        if (rawQuery.length < 2) {
            return NextResponse.json({
                orders: [],
                products: [],
                customers: [],
            });
        }

        // Sanitizar término para evitar inyecciones en ilike de PostgREST
        const sanitized = rawQuery.replace(/[%_(),."']/g, '').trim().slice(0, 60);

        if (!sanitized) {
            return NextResponse.json({
                orders: [],
                products: [],
                customers: [],
            });
        }

        // 1. Buscar equipos que coincidan para expandir búsqueda de productos
        const teamSearchPromise = supabase
            .from('teams')
            .select('id, name')
            .ilike('name', `%${sanitized}%`)
            .limit(5);

        // 2. Buscar pedidos por id, cliente, email o teléfono
        const ordersPromise = supabase
            .from('orders')
            .select('id, customer_name, customer_phone, customer_email, customer_city, status, total_amount, created_at')
            .or(`id.ilike.%${sanitized}%,customer_name.ilike.%${sanitized}%,customer_email.ilike.%${sanitized}%,customer_phone.ilike.%${sanitized}%`)
            .order('created_at', { ascending: false })
            .limit(8);

        const [teamsRes, ordersRes] = await Promise.all([
            teamSearchPromise,
            ordersPromise,
        ]);

        const matchedTeamIds = (teamsRes.data || []).map((t: { id: string }) => t.id);

        // 3. Buscar productos por nombre, temporada o equipo relacionado
        let productsQuery = supabase
            .from('products')
            .select(`
                id,
                name,
                slug,
                image_url,
                active,
                season,
                teams (name),
                product_variants (price, active)
            `)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(8);

        if (matchedTeamIds.length > 0) {
            productsQuery = productsQuery.or(
                `name.ilike.%${sanitized}%,season.ilike.%${sanitized}%,team_id.in.(${matchedTeamIds.join(',')})`
            );
        } else {
            productsQuery = productsQuery.or(
                `name.ilike.%${sanitized}%,season.ilike.%${sanitized}%`
            );
        }

        const { data: productsData } = await productsQuery;

        // Mapear productos
        const mappedProducts: AdminSearchProductResult[] = (productsData || []).map((p: any) => {
            const variants = p.product_variants || [];
            const activeVariants = variants.filter((v: any) => v.active !== false);
            const priceList = activeVariants.length > 0 ? activeVariants : variants;
            const price = priceList.length > 0
                ? Math.min(...priceList.map((v: any) => v.price || 0))
                : 0;

            const teamObj = Array.isArray(p.teams) ? p.teams[0] : p.teams;

            return {
                id: p.id,
                name: p.name || 'Sin nombre',
                slug: p.slug || '',
                image_url: p.image_url || null,
                active: p.active ?? true,
                season: p.season || null,
                team_name: teamObj?.name || null,
                price,
            };
        });

        // Mapear pedidos
        const mappedOrders: AdminSearchOrderResult[] = (ordersRes.data || []).map((o: any) => ({
            id: o.id,
            customer_name: o.customer_name || 'Cliente sin nombre',
            customer_phone: o.customer_phone || '',
            customer_email: o.customer_email || '',
            customer_city: o.customer_city || '',
            status: o.status || 'pending_payment_50',
            total_amount: Number(o.total_amount) || 0,
            created_at: o.created_at || new Date().toISOString(),
        }));

        // 4. Agregar clientes únicos identificados a partir de los pedidos encontrados
        const customerMap = new Map<string, AdminSearchCustomerResult>();
        for (const order of mappedOrders) {
            const key = (order.customer_phone || order.customer_email || order.customer_name).toLowerCase().trim();
            if (!key) continue;

            const existing = customerMap.get(key);
            if (!existing) {
                customerMap.set(key, {
                    name: order.customer_name,
                    phone: order.customer_phone,
                    email: order.customer_email,
                    city: order.customer_city,
                    totalOrders: 1,
                    lastOrderId: order.id,
                    lastOrderStatus: order.status,
                    lastOrderDate: order.created_at,
                });
            } else {
                existing.totalOrders += 1;
            }
        }

        const mappedCustomers = Array.from(customerMap.values()).slice(0, 5);

        return NextResponse.json({
            orders: mappedOrders,
            products: mappedProducts,
            customers: mappedCustomers,
        });
    } catch (error: any) {
        console.error('Error en /api/admin/search:', error);
        return NextResponse.json({ error: error?.message || 'Error interno del servidor' }, { status: 500 });
    }
}

