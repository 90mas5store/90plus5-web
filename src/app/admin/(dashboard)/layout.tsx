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

    return (
        <div className="min-h-screen bg-black text-white flex">
            {/* 🟢 SIDEBAR */}
            <AdminSidebar userEmail={user.email} />

            {/* 🟢 MAIN CONTENT */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full transition-all">
                {children}
            </main>
        </div>
    )
}
