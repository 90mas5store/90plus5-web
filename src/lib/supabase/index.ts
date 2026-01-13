/**
 * 📦 Supabase Clients - Index
 * ===========================
 * Archivo de conveniencia para importar clientes de Supabase
 * 
 * USO CORRECTO:
 * 
 * 🌐 En Client Components ("use client"):
 * ```ts
 * import { createClient } from '@/lib/supabase/client';
 * const supabase = createClient();
 * ```
 * 
 * 🖥️ En Server Components, Route Handlers, Server Actions:
 * ```ts
 * import { createClient } from '@/lib/supabase/server';
 * const supabase = await createClient();
 * ```
 * 
 * 🛡️ En Middleware:
 * ```ts
 * import { createClient } from '@/lib/supabase/middleware';
 * const { supabase, response } = await createClient(request);
 * ```
 */

// Re-export para compatibilidad (no usar directamente)
export { createClient as createBrowserClient, supabase } from './client';
export { createClient as createServerClient } from './server';
export { createClient as createMiddlewareClient } from './middleware';
