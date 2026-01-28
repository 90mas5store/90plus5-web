"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { Trash2, UserPlus, ShieldAlert } from "lucide-react";

interface AdminUser {
    id: string;
    email: string;
    created_at: string;
}

export default function AdminUsersPage() {
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            const { data, error } = await supabase
                .from("admin_whitelist")
                .select("*")
                .order("created_at", { ascending: true });

            if (error) throw error;
            setAdmins(data || []);
        } catch (error) {
            console.error("Error fetching admins:", error);
            toast.error("Error al cargar administradores");
        } finally {
            setLoading(false);
        }
    };

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail.trim()) return;

        setIsAdding(true);
        try {
            // 1. Primero buscamos si el usuario existe en auth.users (Esto requiere permisos especiales o una Edge Function)
            // Como no tenemos acceso directo a auth.users desde el cliente por seguridad,
            // la estrategia simple es: Insertar en whitelist y esperar que el ID se resuelva o
            // insertar solo el email y dejar que un trigger maneje el ID, o simplemente guardar el email.
            // DADO QUE mi tabla admin_whitelist tiene ID como PK ref a auth.users, necesito el UUID.
            // ESTRATEGIA: Por ahora, insertar una fila ficticia solo con email si no podemos obtener el UUID,
            // O cambiar el esquema. 
            // PERO, la RLS usa auth.uid() in (select id...).

            // SOLUCIÓN PRÁCTICA RAPIDA:
            // Vamos a asumir que quieres dar acceso a alguien que YA se registró o se va a registrar.
            // Como no puedo buscar su UUID fácilmente desde el cliente sdk sin ser service_role,
            // Lo mejor es usar una Server Action o API Route que use service_role para buscar el UUID por email.

            const response = await fetch('/api/admin/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newEmail, password: newPassword })
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error);

            toast.success(newPassword ? "Usuario creado y añadido" : "Invitación enviada correctamente");
            setNewEmail("");
            setNewPassword("");
            fetchAdmins();
        } catch (error: any) {
            toast.error(error.message || "Error al añadir admin");
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveAdmin = (id: string) => {
        setDeleteTarget(id);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);

        try {
            const { error } = await supabase
                .from("admin_whitelist")
                .delete()
                .eq("id", deleteTarget);

            if (error) throw error;

            toast.success("Administrador eliminado");
            setAdmins(admins.filter(a => a.id !== deleteTarget));
            setDeleteTarget(null);
        } catch (error) {
            toast.error("Error al eliminar");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-8 space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-2">
                        Equipo <span className="text-primary">Admin</span>
                    </h1>
                    <p className="text-gray-400 max-w-lg text-sm md:text-base leading-relaxed">
                        Controla quién tiene acceso al panel de administración. Solo los usuarios en esta lista podrán iniciar sesión y gestionar la tienda.
                    </p>
                </div>
                <div className="text-right hidden md:block">
                    <div className="text-3xl font-mono font-bold text-white/20">{admins.length}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">USUARIOS ACTIVOS</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* COLUMNA 1: FORMULARIO (Sticky) */}
                <div className="lg:col-span-1">
                    <div className="bg-[#111] border border-white/10 rounded-3xl p-6 sticky top-8 shadow-2xl">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
                            <UserPlus size={24} />
                        </div>

                        <h2 className="text-xl font-bold text-white mb-2">Gestión de Acceso</h2>
                        <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                            Añade un usuario existente o crea uno nuevo. Si dejas la contraseña vacía, se enviará una invitación por email.
                        </p>

                        <form onSubmit={handleAddAdmin} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Email del Usuario</label>
                                <input
                                    type="email"
                                    placeholder="usuario@90plus5.com"
                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all placeholder:text-gray-700"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase ml-1 flex justify-between">
                                    Contraseña <span className="text-[10px] text-gray-600 font-normal normal-case">Opcional</span>
                                </label>
                                <input
                                    type="password"
                                    placeholder="Crear contraseña manualmente..."
                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all placeholder:text-gray-700"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>

                            <button
                                disabled={isAdding || !newEmail}
                                className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isAdding ? (
                                    <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Procesando...</span>
                                ) : (
                                    <>
                                        {newPassword ? 'Crear y Dar Acceso' : 'Enviar Invitación'}
                                        {newPassword ? <ShieldAlert size={16} className="opacity-50" /> : <UserPlus size={16} className="opacity-50" />}
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* COLUMNA 2: LISTA (Scrollable) */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between mb-2 px-2">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Lista de Acceso</h3>
                        <span className="bg-white/5 text-gray-400 text-[10px] px-2 py-1 rounded-full border border-white/5 font-mono">
                            WHITELIST
                        </span>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 bg-[#111] rounded-2xl animate-pulse border border-white/5" />
                            ))}
                        </div>
                    ) : admins.length === 0 ? (
                        <div className="bg-[#111] border border-white/5 rounded-3xl p-10 text-center flex flex-col items-center">
                            <ShieldAlert size={40} className="text-gray-700 mb-4" />
                            <p className="text-gray-500 font-medium">No hay administradores en la lista.</p>
                            <p className="text-xs text-gray-600 mt-1">Esto es extraño, deberías estar tú aquí.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {admins.map(admin => (
                                <div
                                    key={admin.id}
                                    className="group flex items-center justify-between bg-[#111] hover:bg-[#161616] border border-white/5 hover:border-white/10 p-4 rounded-2xl transition-all duration-300"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neutral-800 to-black border border-white/5 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                                                {admin.email[0].toUpperCase()}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-[#111]" title="Activo"></div>
                                        </div>
                                        <div>
                                            <p className="text-white font-bold leading-tight">{admin.email}</p>
                                            <p className="text-[10px] text-gray-500 font-mono mt-1 opacity-60">ID: {admin.id}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span className="hidden sm:inline-block px-3 py-1 bg-primary/5 text-primary text-[10px] font-bold rounded-lg border border-primary/10">
                                            ADMIN
                                        </span>
                                        <button
                                            onClick={() => handleRemoveAdmin(admin.id)}
                                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            title="Revocar acceso"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL DE CONFIRMACIÓN */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#111] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-2">
                                <ShieldAlert size={32} />
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-white">¿Revocar Acceso?</h3>
                                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                                    Estás a punto de eliminar a este administrador. Perderá el acceso al panel inmediatamente.
                                </p>
                            </div>

                            <div className="flex gap-3 w-full pt-2">
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-400 hover:bg-white/5 hover:text-white transition-colors border border-transparent hover:border-white/5"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? "Eliminando..." : "Sí, Revocar"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
