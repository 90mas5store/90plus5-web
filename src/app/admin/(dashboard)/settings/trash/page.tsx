"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { RotateCcw, Trash2 } from "lucide-react";
import Image from "next/image";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

interface DeletedProduct {
    id: string;
    name: string;
    image_url: string;
    deleted_at: string;
    teams?: { name: string };
}

interface DeletedItem {
    id: string;
    name: string;
    deleted_at: string;
    logo_url?: string;
}

type TrashTab = 'products' | 'categories' | 'leagues' | 'teams';

const TABS: { id: TrashTab; label: string }[] = [
    { id: 'products', label: 'Productos' },
    { id: 'categories', label: 'Categorías' },
    { id: 'leagues', label: 'Ligas' },
    { id: 'teams', label: 'Equipos' },
];

export default function TrashPage() {
    const [activeTab, setActiveTab] = useState<TrashTab>('products');
    const [products, setProducts] = useState<DeletedProduct[]>([]);
    const [categories, setCategories] = useState<DeletedItem[]>([]);
    const [leagues, setLeagues] = useState<DeletedItem[]>([]);
    const [teams, setTeams] = useState<DeletedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; tab: TrashTab } | null>(null);
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [prodRes, catRes, lgRes, teamRes] = await Promise.all([
                supabase.from("products").select("id, name, image_url, deleted_at, teams(name)").not("deleted_at", "is", null).order("deleted_at", { ascending: false }),
                supabase.from("categories").select("id, name, deleted_at").not("deleted_at", "is", null).order("deleted_at", { ascending: false }),
                supabase.from("leagues").select("id, name, deleted_at, logo_url").not("deleted_at", "is", null).order("deleted_at", { ascending: false }),
                supabase.from("teams").select("id, name, deleted_at, logo_url").not("deleted_at", "is", null).order("deleted_at", { ascending: false }),
            ]);
            setProducts(prodRes.data || []);
            setCategories(catRes.data || []);
            setLeagues(lgRes.data || []);
            setTeams(teamRes.data || []);
        } catch {
            toast.error("Error cargando papelera");
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // --- Product handlers ---
    const restoreProduct = async (id: string) => {
        const { error } = await supabase.from("products").update({ deleted_at: null, active: false }).eq("id", id);
        if (error) { toast.error("Error al restaurar"); return; }
        toast.success("Producto restaurado (Inactivo)");
        setProducts(p => p.filter(x => x.id !== id));
    };

    const deleteProduct = async (id: string) => {
        const { error } = await supabase.from("products").delete().eq("id", id);
        if (error) { toast.error("Error al eliminar"); return; }
        toast.success("Eliminado permanentemente");
        setProducts(p => p.filter(x => x.id !== id));
    };

    // --- Generic restore/delete for simple tables ---
    const restoreItem = async (table: string, id: string, setter: React.Dispatch<React.SetStateAction<DeletedItem[]>>) => {
        const { error } = await supabase.from(table).update({ deleted_at: null }).eq("id", id);
        if (error) { toast.error("Error al restaurar"); return; }
        toast.success("Restaurado correctamente");
        setter(prev => prev.filter(x => x.id !== id));
    };

    const deleteItem = async (table: string, id: string, setter: React.Dispatch<React.SetStateAction<DeletedItem[]>>) => {
        const { error } = await supabase.from(table).delete().eq("id", id);
        if (error) { toast.error("Error al eliminar"); return; }
        toast.success("Eliminado permanentemente");
        setter(prev => prev.filter(x => x.id !== id));
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        const { id, tab } = deleteTarget;
        if (tab === 'products') await deleteProduct(id);
        else if (tab === 'categories') await deleteItem('categories', id, setCategories);
        else if (tab === 'leagues') await deleteItem('leagues', id, setLeagues);
        else if (tab === 'teams') await deleteItem('teams', id, setTeams);
        setDeleteTarget(null);
    };

    const totalCount = products.length + categories.length + leagues.length + teams.length;
    const tabCount: Record<TrashTab, number> = {
        products: products.length,
        categories: categories.length,
        leagues: leagues.length,
        teams: teams.length,
    };

    const formatDeletedAt = (d: string) =>
        `${new Date(d).toLocaleDateString('es-HN')} ${new Date(d).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}`;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Papelera de Reciclaje</h1>
                <p className="text-gray-400">Recupera o elimina definitivamente los registros borrados.</p>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-500">Buscando en la papelera...</div>
            ) : (
                <>
                    {/* TABS */}
                    <div className="flex gap-1 bg-black/30 border border-white/5 rounded-xl p-1 w-fit">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-white/10 text-white'
                                    : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {tab.label}
                                {tabCount[tab.id] > 0 && (
                                    <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                        {tabCount[tab.id]}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* EMPTY STATE */}
                    {tabCount[activeTab] === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 border border-white/5 rounded-2xl bg-neutral-900/50">
                            <Trash2 size={48} className="text-gray-600 mb-4" />
                            <p className="text-gray-400 font-medium">Esta sección está vacía</p>
                            <p className="text-xs text-gray-600">No hay elementos eliminados aquí.</p>
                        </div>
                    ) : (
                        <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 text-gray-400 text-xs uppercase font-bold">
                                    <tr>
                                        <th className="p-4">Elemento</th>
                                        <th className="p-4">Fecha Eliminación</th>
                                        <th className="p-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {/* PRODUCTS */}
                                    {activeTab === 'products' && products.map(p => (
                                        <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 flex items-center gap-4">
                                                <div className="w-12 h-12 relative rounded-md overflow-hidden bg-black border border-white/10 shrink-0">
                                                    <Image src={p.image_url} alt={p.name} fill className="object-cover opacity-50 grayscale" />
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold opacity-70 line-through decoration-red-500/50">{p.name}</p>
                                                    <p className="text-xs text-gray-500">{p.teams?.name}</p>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-500">{formatDeletedAt(p.deleted_at)}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => restoreProduct(p.id)} className="flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                                        <RotateCcw size={14} /> Restaurar
                                                    </button>
                                                    <button onClick={() => setDeleteTarget({ id: p.id, tab: 'products' })} className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors" title="Eliminar permanentemente">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* CATEGORIES */}
                                    {activeTab === 'categories' && categories.map(item => (
                                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4">
                                                <p className="text-white font-bold opacity-70 line-through decoration-red-500/50">{item.name}</p>
                                            </td>
                                            <td className="p-4 text-sm text-gray-500">{formatDeletedAt(item.deleted_at)}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => restoreItem('categories', item.id, setCategories)} className="flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                                        <RotateCcw size={14} /> Restaurar
                                                    </button>
                                                    <button onClick={() => setDeleteTarget({ id: item.id, tab: 'categories' })} className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* LEAGUES */}
                                    {activeTab === 'leagues' && leagues.map(item => (
                                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 flex items-center gap-4">
                                                {item.logo_url && (
                                                    <div className="w-10 h-10 relative rounded-md overflow-hidden bg-black border border-white/10 shrink-0">
                                                        <Image src={item.logo_url} alt={item.name} fill className="object-contain opacity-50 grayscale p-1" />
                                                    </div>
                                                )}
                                                <p className="text-white font-bold opacity-70 line-through decoration-red-500/50">{item.name}</p>
                                            </td>
                                            <td className="p-4 text-sm text-gray-500">{formatDeletedAt(item.deleted_at)}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => restoreItem('leagues', item.id, setLeagues)} className="flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                                        <RotateCcw size={14} /> Restaurar
                                                    </button>
                                                    <button onClick={() => setDeleteTarget({ id: item.id, tab: 'leagues' })} className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* TEAMS */}
                                    {activeTab === 'teams' && teams.map(item => (
                                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 flex items-center gap-4">
                                                {item.logo_url && (
                                                    <div className="w-10 h-10 relative rounded-md overflow-hidden bg-black border border-white/10 shrink-0">
                                                        <Image src={item.logo_url} alt={item.name} fill className="object-contain opacity-50 grayscale p-1" />
                                                    </div>
                                                )}
                                                <p className="text-white font-bold opacity-70 line-through decoration-red-500/50">{item.name}</p>
                                            </td>
                                            <td className="p-4 text-sm text-gray-500">{formatDeletedAt(item.deleted_at)}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => restoreItem('teams', item.id, setTeams)} className="flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                                        <RotateCcw size={14} /> Restaurar
                                                    </button>
                                                    <button onClick={() => setDeleteTarget({ id: item.id, tab: 'teams' })} className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors">
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
                </>
            )}

            <ConfirmDialog
                open={deleteTarget !== null}
                title="Eliminación permanente"
                message="¿Eliminar este elemento permanentemente? Esta acción no se puede deshacer."
                confirmLabel="Eliminar para siempre"
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
