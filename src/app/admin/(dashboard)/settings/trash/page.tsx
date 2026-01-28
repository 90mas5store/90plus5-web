"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { RotateCcw, Trash2, Search, AlertTriangle } from "lucide-react";
import Image from "next/image";

interface DeletedProduct {
    id: string;
    name: string;
    image_url: string;
    deleted_at: string;
    teams?: { name: string };
}

export default function TrashPage() {
    const [products, setProducts] = useState<DeletedProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchDeleted();
    }, []);

    const fetchDeleted = async () => {
        try {
            // Necesitamos seleccionar explícitamente los borrados.
            // Supabase no filtra automáticamente soft deletes a menos que usemos Views.
            // Aquí buscamos donde deleted_at NO sea null.
            const { data, error } = await supabase
                .from("products")
                .select(`
            id, name, image_url, deleted_at,
            teams ( name )
        `)
                .not("deleted_at", "is", null)
                .order("deleted_at", { ascending: false });

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando papelera");
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (id: string) => {
        try {
            const { error } = await supabase
                .from("products")
                .update({ deleted_at: null, active: false }) // Restauramos como inactivo por seguridad
                .eq("id", id);

            if (error) throw error;

            toast.success("Producto restaurado (Inactivo)");
            setProducts(products.filter(p => p.id !== id));
        } catch (e) {
            toast.error("Error al restaurar");
        }
    };

    const handlePermanentDelete = async (id: string) => {
        if (!confirm("⚠️ ¿Eliminar PERMANENTEMENTE? No se podrá recuperar.")) return;

        try {
            const { error } = await supabase.from("products").delete().eq("id", id);
            if (error) throw error;

            toast.success("Eliminado para siempre");
            setProducts(products.filter(p => p.id !== id));
        } catch (e) {
            toast.error("Error al eliminar");
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Papelera de Reciclaje</h1>
                <p className="text-gray-400">Recupera productos eliminados accidentalmente.</p>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-500">Buscando en la basura...</div>
            ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-white/5 rounded-2xl bg-neutral-900/50">
                    <Trash2 size={48} className="text-gray-600 mb-4" />
                    <p className="text-gray-400 font-medium">La papelera está vacía</p>
                    <p className="text-xs text-gray-600">¡Buen trabajo manteniendo todo limpio!</p>
                </div>
            ) : (
                <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-gray-400 text-xs uppercase font-bold">
                            <tr>
                                <th className="p-4">Producto</th>
                                <th className="p-4">Fecha Eliminación</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {products.map(p => (
                                <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4 flex items-center gap-4">
                                        <div className="w-12 h-12 relative rounded-md overflow-hidden bg-black border border-white/10">
                                            <Image src={p.image_url} alt={p.name} fill className="object-cover opacity-50 grayscale" />
                                        </div>
                                        <div>
                                            <p className="text-white font-bold opacity-70 line-through decoration-red-500/50">{p.name}</p>
                                            <p className="text-xs text-gray-500">{p.teams?.name}</p>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-500">
                                        {new Date(p.deleted_at).toLocaleDateString()} {new Date(p.deleted_at).toLocaleTimeString()}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleRestore(p.id)}
                                                className="flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                            >
                                                <RotateCcw size={14} /> Restaurar
                                            </button>
                                            <button
                                                onClick={() => handlePermanentDelete(p.id)}
                                                className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                                                title="Eliminar para siempre"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
