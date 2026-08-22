import { createClient } from '@/lib/supabase/middleware'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
    checkRateLimit,
    getClientIp,
    getRateLimitHeaders,
    getRateLimitTierForPath
} from '@/lib/rateLimit'

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

// 🌐 CONFIGURACIÓN DE CORS
function isOriginAllowed(origin: string | null): boolean {
    if (!origin) return true; // Permite llamadas server-to-server o same-origin sin header Origin

    // Normalizar la URL de origen eliminando barras finales
    const normalizedOrigin = origin.replace(/\/$/, '');

    // Orígenes explícitamente permitidos por env o defecto
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://90mas5.store').replace(/\/$/, '');
    const allowedFromEnv = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim().replace(/\/$/, ''))
        : [];

    const defaultAllowedOrigins = [
        siteUrl,
        'https://90mas5.store',
        'https://www.90mas5.store',
        ...allowedFromEnv,
    ];

    if (defaultAllowedOrigins.includes(normalizedOrigin)) {
        return true;
    }

    // Permitir orígenes de desarrollo/pruebas locales
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin)) {
            return true;
        }
    }

    return false;
}

function getCorsHeaders(origin: string | null): Record<string, string> {
    const allowedOrigin = origin || process.env.NEXT_PUBLIC_SITE_URL || 'https://90mas5.store';
    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
    };
}

export async function middleware(req: NextRequest) {
    let res = NextResponse.next()
    const origin = req.headers.get('origin');

    // 0️⃣ PROTECCIÓN CORS PARA API (/api/*)
    if (req.nextUrl.pathname.startsWith('/api')) {
        // Excepción para webhooks (solicitudes server-to-server sin navegador)
        const isWebhook = req.nextUrl.pathname.startsWith('/api/webhooks');

        if (!isWebhook) {
            if (!isOriginAllowed(origin)) {
                console.warn(`🚫 Petición CORS bloqueada para el origen no autorizado: ${origin}`);
                return new NextResponse(
                    JSON.stringify({ success: false, error: 'CORS policy: Access denied for this origin' }),
                    { status: 403, headers: { 'Content-Type': 'application/json' } }
                );
            }

            // Manejo de Preflight request (OPTIONS) - No consume rate limit
            if (req.method === 'OPTIONS') {
                return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) });
            }

            // Adjuntar headers CORS a la respuesta permitida
            if (origin) {
                const corsHeaders = getCorsHeaders(origin);
                Object.entries(corsHeaders).forEach(([key, value]) => res.headers.set(key, value));
            }
        }

        // 🛡️ RATE LIMITING GLOBAL PARA /api/*
        const tierInfo = getRateLimitTierForPath(req.nextUrl.pathname);
        if (tierInfo) {
            const ip = getClientIp(req);
            const identifier = `api:${tierInfo.tier}:${ip}`;
            const result = await checkRateLimit(
                identifier,
                tierInfo.config.maxRequests,
                tierInfo.config.windowMs
            );

            const rateLimitHeaders = getRateLimitHeaders(result, tierInfo.config.maxRequests);

            // Adjuntar encabezados X-RateLimit-* a la respuesta
            Object.entries(rateLimitHeaders).forEach(([key, value]) => {
                res.headers.set(key, value);
            });

            if (!result.allowed) {
                console.warn(`🚫 Rate limit de API excedido para IP (${ip}) en ruta [${req.nextUrl.pathname}] - Tier: ${tierInfo.tier}`);

                const responseHeaders: Record<string, string> = {
                    'Content-Type': 'application/json',
                    ...rateLimitHeaders,
                };

                if (origin && isOriginAllowed(origin)) {
                    Object.assign(responseHeaders, getCorsHeaders(origin));
                }

                return new NextResponse(
                    JSON.stringify({
                        success: false,
                        error: 'Has realizado demasiadas solicitudes. Por favor espera un momento e intenta de nuevo.'
                    }),
                    { status: 429, headers: responseHeaders }
                );
            }
        }
    }

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

    return res
}

// ⚡ Configuración del Matcher
export const config = {
    matcher: [
        // Matcher combinado: Rutas Admin + API
        '/admin/:path*',
        '/api/:path*'
    ],
}

