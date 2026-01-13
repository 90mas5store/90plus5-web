import { createClient } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 🛡️ CONFIGURACIÓN DE RATE LIMIT
const RATELIMIT_WINDOW = 60 * 1000; // 1 minuto
const MAX_REQUESTS = 3; // Máximo 3 intentos de creación por minuto por IP

// Almacén en memoria
const ipCache = new Map<string, { count: number; expires: number }>();

export async function middleware(req: NextRequest) {
    let res = NextResponse.next()

    // 1️⃣ PROTECCIÓN DE RUTA /admin
    if (req.nextUrl.pathname.startsWith('/admin')) {
        // Excluimos la página de login
        if (req.nextUrl.pathname === '/admin/login') {
            return res;
        }

        const { supabase, response } = await createClient(req)
        // Actualizamos 'res' con la respuesta que trae las cookies actualizadas de Supabase
        res = response;

        // 🔐 Usamos getUser() en lugar de getSession() por seguridad
        // getUser() verifica el token con el servidor de Supabase
        const { data: { user }, error } = await supabase.auth.getUser()

        // Si no hay usuario autenticado, redirigir al login
        if (error || !user) {
            return NextResponse.redirect(new URL('/admin/login', req.url))
        }

        // (Opcional) Aquí podrías validar user.email === 'tu@email.com'
        // para seguridad paranoica extra.
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
