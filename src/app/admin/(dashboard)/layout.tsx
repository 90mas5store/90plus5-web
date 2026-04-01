import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminBottomNav from '@/components/admin/AdminBottomNav'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Admin Panel',
    robots: { index: false, follow: false },
}

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    // 🔐 Usamos getUser() en lugar de getSession() por seguridad
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/admin/login')
    }

    // 🛡️ SEGURIDAD EXTRA: Verificar Whitelist
    const { data: isAdmin } = await supabase.rpc('is_admin')

    if (!isAdmin) {
        redirect('/')
    }

    return (
        <div className="h-dvh overflow-hidden bg-black text-white flex">
            {/* Spacer que ocupa el ancho del sidebar en el flujo flex (el sidebar en sí es fixed) */}
            <div className="hidden md:block md:w-72 flex-shrink-0" />

            {/* 🟢 SIDEBAR — solo desktop (md+) */}
            <AdminSidebar userEmail={user.email} />

            {/* 🟢 MAIN CONTENT */}
            <main className="flex-1 min-w-0 relative flex flex-col overflow-hidden bg-[#050505]">
                {/* Mini header solo en móvil */}
                <div className="md:hidden flex-shrink-0 flex items-center justify-between px-4 h-12 bg-black/80 backdrop-blur-md border-b border-white/5">
                    <span className="text-sm font-black tracking-tight text-white">
                        90+5 <span className="text-primary">ADMIN</span>
                    </span>
                    {user.email && (
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="truncate max-w-[120px]">{user.email}</span>
                        </div>
                    )}
                </div>

                {/* Contenido scrollable */}
                <div className="flex-1 overflow-y-auto p-4 pb-24 md:p-8 md:pb-8 w-full">
                    {children}
                </div>
            </main>

            {/* 🟢 BOTTOM NAV — solo móvil (<md) */}
            <AdminBottomNav userEmail={user.email} />
        </div>
    )
}
