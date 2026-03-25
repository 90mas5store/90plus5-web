"use client";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import HistorialPedidos from "../../components/perfil/HistorialPedidos";
import DatosUsuario from "../../components/perfil/DatosUsuario";
import Button from "../../components/ui/MainButton";
import { createClient } from "@/lib/supabase/client";

interface UsuarioData {
    id: string;
    nombre: string;
    correo: string;
    avatar: string | null;
}

export default function PerfilPage() {
    const [usuario, setUsuario] = useState<UsuarioData | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const supabase = createClient();

        async function loadUser() {
            try {
                const { data: { user }, error } = await supabase.auth.getUser();

                if (error || !user) {
                    setUsuario(null);
                    return;
                }

                setUsuario({
                    id: user.id,
                    nombre: user.user_metadata?.full_name
                        || user.email?.split("@")[0]
                        || "Usuario",
                    correo: user.email ?? "",
                    avatar: user.user_metadata?.avatar_url ?? null,
                });
            } catch (err) {
                console.error("Error cargando usuario:", err);
                setUsuario(null);
            } finally {
                setLoading(false);
            }
        }

        loadUser();
    }, []);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-dvh bg-black text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-full border-2 border-primary/40 border-t-primary animate-spin" />
                    <p className="text-gray-500 text-sm">Cargando perfil...</p>
                </div>
            </div>
        );
    }

    if (!usuario) {
        return (
            <main className="min-h-dvh bg-black text-white flex flex-col justify-center items-center gap-6 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-4"
                >
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10 mx-auto">
                        <User className="w-10 h-10 text-gray-600" />
                    </div>
                    <h1 className="text-2xl font-black uppercase tracking-tight">
                        No has iniciado sesión
                    </h1>
                    <p className="text-gray-400">
                        Inicia sesión para ver tu perfil y tus pedidos.
                    </p>
                    <Button onClick={() => router.push("/auth/login")}>
                        Iniciar sesión
                    </Button>
                </motion.div>
            </main>
        );
    }

    return (
        <main className="min-h-dvh bg-black text-white pt-24 pb-16 px-6">
            {/* ENCABEZADO */}
            <motion.section
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row items-center justify-between border-b border-white/10 pb-8 mb-8"
            >
                <div className="flex items-center gap-4">
                    {usuario.avatar ? (
                        <img
                            src={usuario.avatar}
                            alt="Avatar"
                            className="w-16 h-16 rounded-full border border-primary/60 object-cover"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full border border-primary/60 bg-white/10 flex items-center justify-center text-2xl font-black text-white select-none">
                            {usuario.nombre.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold">{usuario.nombre}</h1>
                        <p className="text-gray-400 text-sm">{usuario.correo}</p>
                    </div>
                </div>
                <Button
                    onClick={handleSignOut}
                    className="mt-4 sm:mt-0 flex items-center gap-2 bg-[#E50914]/80 hover:bg-[#E50914]"
                >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                </Button>
            </motion.section>

            {/* SECCIONES */}
            <DatosUsuario usuario={usuario} />
            <HistorialPedidos usuario={usuario} />
        </main>
    );
}
