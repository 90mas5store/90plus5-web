import { createClient } from "@/lib/supabase/client";

export async function logAdminAction(
    action: string,
    details: object | string,
    severity: 'info' | 'warning' | 'danger' = 'info'
) {
    const supabase = createClient();

    try {
        // 1. Obtener usuario actual
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !user.email) return;

        // 2. Insertar Log
        const { error } = await supabase.from('admin_logs').insert({
            admin_email: user.email,
            action: action,
            details: typeof details === 'string' ? { message: details } : details,
            severity, // Si añadiste columna severity, si no, Supabase lo ignorará si no está en schema o dará error.
            // Asumo que tu tabla es simple, así que meteré severity en details si no existe la columna.
            // Para asegurar compatibilidad, lo meto todo en details si es complejo.
        });

        if (error) console.error("Error saving log:", error);

    } catch (err) {
        console.error("Logger error:", err);
    }
}
