/**
 * 🌐 Supabase Client (Browser/Client Components)
 * ================================================
 * Este archivo se usa ÚNICAMENTE en:
 * - Componentes con "use client"
 * - Hooks del cliente
 * - Cualquier código que se ejecute en el navegador
 * 
 * ⚠️ IMPORTANTE:
 * - NO usar en Server Components, API Routes o Route Handlers
 * - La anon key es pública pero segura gracias a RLS
 * - Nunca exponer la service_role key en el cliente
 */

import { createBrowserClient } from '@supabase/ssr';

// Singleton para evitar múltiples instancias en el cliente
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Crea o retorna el cliente de Supabase para el navegador
 * Usa Singleton pattern para optimizar conexiones
 */
export function createClient() {
    if (browserClient) {
        return browserClient;
    }

    browserClient = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    return browserClient;
}

// Export directo para compatibilidad con código existente
// ⚠️ Preferir usar createClient() para mejor tree-shaking
export const supabase = createClient();
