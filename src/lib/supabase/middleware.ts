/**
 * 🛡️ Supabase Middleware Client
 * ==============================
 * Este archivo se usa ÚNICAMENTE en middleware.ts
 * 
 * ⚠️ IMPORTANTE:
 * - El middleware tiene acceso especial a cookies de request/response
 * - Se ejecuta en el Edge Runtime
 * - Necesario para refrescar sesiones de autenticación
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Crea un cliente de Supabase para uso en middleware
 * Retorna tanto el cliente como la respuesta modificada
 * 
 * @param request - El objeto NextRequest del middleware
 * @returns Object con supabase client y response con cookies actualizadas
 * 
 * @example
 * // En middleware.ts
 * import { createClient } from '@/lib/supabase/middleware';
 * 
 * export async function middleware(req: NextRequest) {
 *   const { supabase, response } = await createClient(req);
 *   // ⚠️ Usar getUser() en lugar de getSession() por seguridad
 *   const { data: { user }, error } = await supabase.auth.getUser();
 *   
 *   if (error || !user) {
 *     return NextResponse.redirect(new URL('/login', req.url));
 *   }
 *   return response;
 * }
 */
export async function createClient(request: NextRequest) {
    // Crear respuesta inicial que será modificada con cookies
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                /**
                 * Obtiene una cookie de la request
                 */
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },

                /**
                 * Establece una cookie tanto en request como en response
                 * Necesario para mantener la sesión sincronizada
                 */
                set(name: string, value: string, options: CookieOptions) {
                    // Actualizar cookie en la request
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    });

                    // Crear nueva respuesta con la request actualizada
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });

                    // Establecer cookie en la respuesta
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                },

                /**
                 * Elimina una cookie estableciendo valor vacío
                 */
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });

                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });

                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                },
            },
        }
    );

    return { supabase, response };
}
