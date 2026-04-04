import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
    try {
        // 🛡️ RATE LIMITING — máximo 5 invitaciones por IP cada 10 minutos
        const ip = getClientIp(request);
        const { allowed, retryAfterMs } = await checkRateLimit(`admin-invite:${ip}`, 5, 10 * 60_000);
        if (!allowed) {
            return NextResponse.json(
                { error: 'Demasiadas solicitudes. Intenta más tarde.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
            );
        }

        // 🔐 VERIFICAR AUTENTICACIÓN — Solo admins autenticados pueden crear admins
        const supabaseUser = await createServerClient();
        const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // 🔐 Verificar que el usuario está en la whitelist de admins Y tiene rol super_admin
        const supabaseAdminCheck = createAdminClient();
        const { data: adminRecord } = await supabaseAdminCheck
            .from('admin_whitelist')
            .select('id, role')
            .eq('id', user.id)
            .single();

        if (!adminRecord) {
            return NextResponse.json({ error: 'Acceso denegado: no eres administrador' }, { status: 403 });
        }

        // 🛡️ C2 FIX: Solo super_admin puede invitar nuevos administradores
        if (adminRecord.role !== 'super_admin') {
            console.warn(`🚫 Admin ${user.id} (${user.email}) intentó invitar sin ser super_admin (role: ${adminRecord.role})`);
            return NextResponse.json(
                { error: 'Solo un Super Admin puede invitar nuevos administradores.' },
                { status: 403 }
            );
        }

        const { email, password, role } = await request.json();
        const assignedRole = role === 'super_admin' ? 'super_admin' : 'admin';

        if (!email) {
            return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
        }

        // 1. Crear cliente con permisos de SUPER ADMIN (Service Role)
        const supabaseAdmin = createAdminClient();

        // No logear email — PII

        // 2. Buscar si el usuario ya existe en Supabase Auth
        const { data: { users }, error: searchError } = await supabaseAdmin.auth.admin.listUsers();

        // Filtramos manualmente porque listUsers no busca por email directamente en versiones antiguas
        const existingUser = (users as any[])?.find(u => u.email?.toLowerCase() === email.toLowerCase());

        let userId = existingUser?.id;

        if (userId) {
            // usuario ya existente
        } else {
            if (password) {
                const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    email,
                    password,
                    email_confirm: true,
                    user_metadata: { full_name: 'Admin User' }
                });
                if (createError) throw createError;
                userId = newUser.user.id;
            } else {

                // Definir URL base dinámica
                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

                const { data: newUser, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
                    redirectTo: `${siteUrl}/admin/update-password`
                });
                if (inviteError) throw inviteError;
                userId = newUser.user.id;
            }
        }

        // 4. AÑADIR A LA WHITELIST (Tabla de Admins en DB)
        // Verificamos si ya está en la whitelist para no duplicar error
        const { data: existingAdmin } = await supabaseAdmin
            .from('admin_whitelist')
            .select('id')
            .eq('id', userId)
            .single();

        if (!existingAdmin) {
            const { error: insertError } = await supabaseAdmin
                .from('admin_whitelist')
                .insert([{ id: userId, email: email, role: assignedRole }]);

            if (insertError) {
                console.error("Error insertando en whitelist:", insertError);
                throw insertError;
            }
        } else {
            // Actualizar rol si ya existe
            await supabaseAdmin
                .from('admin_whitelist')
                .update({ role: assignedRole })
                .eq('id', userId);
        }

        return NextResponse.json({ success: true, message: 'Administrador gestionado correctamente' });

    } catch (error: unknown) {
        console.error('❌ Error en Invite API:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
