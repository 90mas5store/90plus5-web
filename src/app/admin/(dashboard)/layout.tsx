import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    // 🔐 Usamos getUser() en lugar de getSession() por seguridad
    // getUser() verifica el token directamente con Supabase
    const { data: { user }, error } = await supabase.auth.getUser()

    // Doble verificación: Si no hay usuario autenticado, fuera.
    // Esto protege incluso si fallara el middleware.
    if (error || !user) {
        redirect('/admin/login')
    }

    // 🛡️ SEGURIDAD EXTRA: Verificar Whitelist
    // Aunque tenga login, si no está en la tabla admin_whitelist, no pasa.
    const { data: isAdmin } = await supabase.rpc('is_admin')

    if (!isAdmin) {
        redirect('/')
    }

    return (
        <div className="h-screen overflow-hidden bg-black text-white flex">
            {/* 🟢 SIDEBAR */}
            <AdminSidebar userEmail={user.email} />

            {/* 🟢 MAIN CONTENT */}
            <main className="flex-1 w-full relative flex flex-col overflow-hidden bg-[#050505]">
                <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full">
                    {children}
                </div>
            </main>
        </div>
    )
}
