import { createClient } from '@supabase/supabase-js';

/**
 * Cliente de Supabase con privilegios de Administrador (Service Role).
 * ⚠️ ÚSALO CON EXTREMA PRECAUCIÓN Y SOLO EN EL SERVIDOR.
 *
 * Este cliente salta todas las políticas Row Level Security (RLS).
 */
export const createAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseServiceKey) {
        throw new Error('❌ SUPABASE_SERVICE_ROLE_KEY no está definida en las variables de entorno.');
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};
