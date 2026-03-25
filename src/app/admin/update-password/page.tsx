"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Lock, Eye, EyeOff, ShieldCheck, ShieldAlert } from "lucide-react";

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [authorized, setAuthorized] = useState<boolean | null>(null);
    const router = useRouter();
    const supabase = createClient();

    // 🔐 Verificar que el usuario actual está en la whitelist (doble validación client-side)
    useEffect(() => {
        const checkAuthorization = async () => {
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError || !user) {
                    setAuthorized(false);
                    return;
                }

                // Verificar whitelist via RPC (respeta RLS)
                const { data: role } = await supabase.rpc('get_my_admin_role');
                if (!role) {
                    setAuthorized(false);
                    return;
                }

                setAuthorized(true);
            } catch {
                setAuthorized(false);
            }
        };

        checkAuthorization();
    }, [supabase]);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        // 🛡️ Validaciones de contraseña robusta
        if (password.length < 8) {
            toast.error("La contraseña debe tener al menos 8 caracteres");
            return;
        }

        if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
            toast.error("La contraseña debe incluir mayúsculas, minúsculas y números");
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            toast.success("Contraseña establecida correctamente");
            router.push("/admin/dashboard");
        } catch (error: unknown) {
            toast.error((error as Error).message || "Error al actualizar contraseña");
        } finally {
            setLoading(false);
        }
    };

    // Estado de carga mientras verificamos autorización
    if (authorized === null) {
        return (
            <div className="min-h-dvh bg-black flex items-center justify-center p-4">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    // No autorizado
    if (!authorized) {
        return (
            <div className="min-h-dvh bg-black flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-[#111] border border-red-500/20 rounded-3xl p-8 shadow-2xl text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                        <ShieldAlert size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-white mb-2">Acceso Denegado</h1>
                    <p className="text-gray-400 text-sm mb-6">
                        No tienes permiso para acceder a esta página. Contacta al administrador.
                    </p>
                    <button
                        onClick={() => router.push('/admin/login')}
                        className="bg-white hover:bg-gray-200 text-black font-bold py-3 px-6 rounded-xl transition-all"
                    >
                        Ir al Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-dvh bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                {/* Decoration */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-primary"></div>

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary animate-in zoom-in duration-500">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight mb-2">Bienvenido al Equipo</h1>
                    <p className="text-gray-400 text-sm">Establece tu contraseña segura para acceder al panel de administración de 90+5 Store.</p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nueva Contraseña</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" size={18} />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white placeholder:text-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                placeholder="Mínimo 8 caracteres (mayús, minús, número)"
                                minLength={8}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-600 ml-1">Debe incluir mayúsculas, minúsculas y números.</p>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-white hover:bg-gray-200 text-black font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                    >
                        {loading ? "Guardando..." : "Establecer Contraseña e Iniciar"}
                    </button>
                </form>
            </div>
        </div>
    );
}
