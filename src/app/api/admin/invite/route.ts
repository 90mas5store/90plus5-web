import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
        }

        // 1. Crear cliente con permisos de SUPER ADMIN (Service Role)
        // Esto es necesario para gestionar usuarios y enviar invitaciones
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        console.log(`🔍 Buscando usuario: ${email} `);

        // 2. Buscar si el usuario ya existe en Supabase Auth
        const { data: { users }, error: searchError } = await supabaseAdmin.auth.admin.listUsers();

        // Filtramos manualmente porque listUsers no busca por email directamente en versiones antiguas
        const existingUser = (users as any[])?.find(u => u.email?.toLowerCase() === email.toLowerCase());

        let userId = existingUser?.id;

        if (userId) {
            console.log(`✅ Usuario existente: ${userId} `);
        } else {
            if (password) {
                console.log(`🔑 Creando usuario con contraseña...`);
                const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    email,
                    password,
                    email_confirm: true,
                    user_metadata: { full_name: 'Admin User' }
                });
                if (createError) throw createError;
                userId = newUser.user.id;
            } else {
                console.log(`✨ Invitando usuario...`);

                // Definir URL base dinámica
                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

                const { data: newUser, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
                    redirectTo: `${siteUrl} /admin/update - password`
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
                .insert([{ id: userId, email: email }]); // Guardamos email también por referencia visual

            if (insertError) {
                console.error("Error insertando en whitelist:", insertError);
                throw insertError;
            }
        }

        return NextResponse.json({ success: true, message: 'Administrador gestionado correctamente' });

    } catch (error: any) {
        console.error('❌ Error en Invite API:', error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}
