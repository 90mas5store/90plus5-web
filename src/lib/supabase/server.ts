/**
 * 🖥️ Supabase Server Client (Server Components & Route Handlers)
 * ================================================================
 * Este archivo se usa ÚNICAMENTE en:
 * - Server Components (componentes sin "use client")
 * - API Routes / Route Handlers
 * - Server Actions
 * 
 * ⚠️ IMPORTANTE:
 * - Cada request debe crear una nueva instancia (NO usar singleton)
 * - Maneja cookies automáticamente para autenticación
 * - Compatible con Next.js 14 App Router
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Crea un cliente de Supabase para uso en el servidor
 * 
 * @example
 * // En un Server Component
 * import { createClient } from '@/lib/supabase/server';
 * 
 * export default async function Page() {
 *   const supabase = await createClient();
 *   const { data } = await supabase.from('products').select();
 *   return <div>{data}</div>;
 * }
 * 
 * @example
 * // En un Route Handler
 * import { createClient } from '@/lib/supabase/server';
 * 
 * export async function GET() {
 *   const supabase = await createClient();
 *   const { data } = await supabase.from('orders').select();
 *   return Response.json(data);
 * }
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /**
         * Obtiene una cookie por nombre
         */
        get(name: string) {
          return cookieStore.get(name)?.value;
        },

        /**
         * Establece una cookie con opciones
         * Puede fallar silenciosamente en Server Components (solo lectura)
         */
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Ignoramos el error en Server Components de solo lectura
            // El middleware se encarga de refrescar las sesiones
          }
        },

        /**
         * Elimina una cookie
         * Puede fallar silenciosamente en Server Components (solo lectura)
         */
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Ignoramos el error en Server Components de solo lectura
            // El middleware se encarga de refrescar las sesiones
          }
        },
      },
    }
  );
}
