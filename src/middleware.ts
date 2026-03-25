import { createClient } from '@/lib/supabase/middleware'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 🛡️ CONFIGURACIÓN DE RATE LIMIT
const RATELIMIT_WINDOW = 60 * 1000; // 1 minuto
const MAX_REQUESTS = 3; // Máximo 3 intentos de creación por minuto por IP

// Almacén en memoria
const ipCache = new Map<string, { count: number; expires: number }>();

/**
 * 🔐 Verifica si un usuario está en la whitelist de admins usando Service Role.
 * Esto NO puede ser bypaseado desde el cliente.
 */
async function isUserInAdminWhitelist(userId: string): Promise<boolean> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY for admin whitelist check');
        return false; // Fail closed: si no hay config, denegar acceso
    }

    const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data, error } = await adminClient
        .from('admin_whitelist')
        .select('id')
        .eq('id', userId)
        .single();

    if (error || !data) {
        return false;
    }

    return true;
}

export async function middleware(req: NextRequest) {
    let res = NextResponse.next()

    // 1️⃣ PROTECCIÓN DE RUTA /admin
    if (req.nextUrl.pathname.startsWith('/admin')) {
        // Excluimos SOLO la página de login
        if (req.nextUrl.pathname === '/admin/login') {
            return res;
        }

        // ⚠️ /admin/update-password YA NO está excluido — se protege igual que cualquier ruta admin

        const { supabase, response } = await createClient(req)
        // Actualizamos 'res' con la respuesta que trae las cookies actualizadas de Supabase
        res = response;

        // 🔐 Paso 1: Verificar autenticación con getUser() (valida contra el servidor de Supabase)
        const { data: { user }, error } = await supabase.auth.getUser()

        // Si no hay usuario autenticado, redirigir al login
        if (error || !user) {
            return NextResponse.redirect(new URL('/admin/login', req.url))
        }

        // 🔐 Paso 2: Verificar que el usuario está en admin_whitelist (server-side, no bypasseable)
        const isAdmin = await isUserInAdminWhitelist(user.id);

        if (!isAdmin) {
            console.warn(`🚫 Usuario ${user.id} (${user.email}) intentó acceder a admin sin estar en whitelist`);

            // Cerrar sesión del usuario para evitar loops
            await supabase.auth.signOut();

            // Redirigir al login con mensaje de error
            const loginUrl = new URL('/admin/login', req.url);
            loginUrl.searchParams.set('error', 'access_denied');
            return NextResponse.redirect(loginUrl);
        }
    }


    // 2️⃣ RATE LIMITING PARA API (/api/orders/create)
    if (req.nextUrl.pathname === '/api/orders/create') {
        const ip = req.ip || req.headers.get('x-forwarded-for') || '127.0.0.1';
        const now = Date.now();
        const record = ipCache.get(ip);

        if (record) {
            if (now > record.expires) {
                // Expiró, reset
                ipCache.set(ip, { count: 1, expires: now + RATELIMIT_WINDOW });
            } else {
                if (record.count >= MAX_REQUESTS) {
                    console.warn(`🚫 Rate limit exceeded for IP: ${ip}`);
                    return new NextResponse(
                        JSON.stringify({
                            success: false,
                            error: 'Has realizado demasiados intentos. Por favor espera un momento.'
                        }),
                        { status: 429, headers: { 'Content-Type': 'application/json' } }
                    );
                }
                record.count++;
            }
        } else {
            // Nuevo
            ipCache.set(ip, { count: 1, expires: now + RATELIMIT_WINDOW });
        }

        // Limpieza básica
        if (ipCache.size > 5000) ipCache.clear();
    }

    return res
}

// ⚡ Configuración del Matcher
export const config = {
    matcher: [
        // Matcher combinado: Rutas Admin + API Orders
        '/admin/:path*',
        '/api/orders/create'
    ],
}
