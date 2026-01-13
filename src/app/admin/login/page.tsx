'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function AdminLogin() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            // Login exitoso, redirigir al dashboard
            router.push('/admin')
            router.refresh()
        }
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl">
                <div className="flex justify-center mb-8">
                    {/* Asumiendo que tienes un logo, si no usa texto */}
                    <h1 className="text-3xl font-black text-white tracking-tighter">90+5 <span className="text-primary">ADMIN</span></h1>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none transition-colors"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none transition-colors"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl font-medium">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all shadow-[0_10px_20px_rgba(229,9,20,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Entrando...' : 'INICIAR SESIÓN'}
                    </button>
                </form>
            </div>
        </div>
    )
}
