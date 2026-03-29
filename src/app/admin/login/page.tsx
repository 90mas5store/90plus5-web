'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

// 🛡️ M6 FIX: Rate limit simple en cliente para login de admin
// Máximo 5 intentos en 15 minutos. Después, bloqueo temporal.
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutos

function getLoginAttempts(): { count: number; firstAttemptAt: number } {
    if (typeof window === 'undefined') return { count: 0, firstAttemptAt: 0 };
    try {
        const stored = sessionStorage.getItem('admin_login_attempts');
        if (!stored) return { count: 0, firstAttemptAt: 0 };
        return JSON.parse(stored);
    } catch {
        return { count: 0, firstAttemptAt: 0 };
    }
}

function recordLoginAttempt(): boolean {
    const now = Date.now();
    const attempts = getLoginAttempts();

    // Si ha pasado el lockout, resetear
    if (attempts.firstAttemptAt && (now - attempts.firstAttemptAt) > LOGIN_LOCKOUT_MS) {
        sessionStorage.setItem('admin_login_attempts', JSON.stringify({ count: 1, firstAttemptAt: now }));
        return true; // Permitido
    }

    const newCount = attempts.count + 1;
    sessionStorage.setItem('admin_login_attempts', JSON.stringify({
        count: newCount,
        firstAttemptAt: attempts.firstAttemptAt || now,
    }));

    return newCount <= LOGIN_MAX_ATTEMPTS;
}

function clearLoginAttempts() {
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem('admin_login_attempts');
    }
}

function getRemainingLockoutMinutes(): number {
    const attempts = getLoginAttempts();
    if (!attempts.firstAttemptAt) return 0;
    const elapsed = Date.now() - attempts.firstAttemptAt;
    const remaining = LOGIN_LOCKOUT_MS - elapsed;
    return Math.max(0, Math.ceil(remaining / 60_000));
}

export default function AdminLogin() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // 🛡️ M6 FIX: Verificar rate limit antes de intentar login
        const attempts = getLoginAttempts();
        if (attempts.count >= LOGIN_MAX_ATTEMPTS) {
            const remaining = getRemainingLockoutMinutes();
            if (remaining > 0) {
                setError(`Demasiados intentos fallidos. Espera ${remaining} minuto${remaining !== 1 ? 's' : ''} antes de intentar de nuevo.`);
                return;
            }
        }

        setLoading(true)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                // Registrar intento fallido
                const allowed = recordLoginAttempt();
                const isNetworkError = error.message === 'Failed to fetch' || error.message.includes('NetworkError') || error.message.includes('fetch');
                if (!allowed) {
                    const remaining = getRemainingLockoutMinutes();
                    setError(`Demasiados intentos fallidos. Espera ${remaining} minuto${remaining !== 1 ? 's' : ''} antes de intentar de nuevo.`);
                } else if (isNetworkError) {
                    setError('No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta de nuevo.');
                } else {
                    const remaining = LOGIN_MAX_ATTEMPTS - getLoginAttempts().count;
                    const msg = error.message.includes('Invalid login') ? 'Email o contraseña incorrectos.' : error.message;
                    setError(`${msg}${remaining <= 2 ? ` (${remaining} intento${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''})` : ''}`);
                }
                setLoading(false)
            } else {
                // Login exitoso, limpiar contador
                clearLoginAttempts();
                router.push('/admin')
                router.refresh()
            }
        } catch {
            setError('No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta de nuevo.');
            setLoading(false)
        }
    }

    return (
        <div className="min-h-dvh bg-black flex items-center justify-center p-4">
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
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 pr-12 text-white focus:border-primary outline-none transition-colors"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
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
