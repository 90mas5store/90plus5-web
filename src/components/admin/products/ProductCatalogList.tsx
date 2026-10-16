import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Edit, Copy, Loader2, Zap, Trash2, Tag, Trophy } from 'lucide-react'
import { ProductView } from './useAdminProducts'

interface ProductCatalogListProps {
    products: ProductView[]
    duplicating: string | null
    trendingProduct: string | null
    isSuperAdmin: boolean
    handleToggleActive: (id: string, active: boolean) => void
    handleDuplicate: (product: ProductView) => void
    handleTrending: (productId: string, hours: number | null) => void
    handleDelete: (id: string) => void
}

export default function ProductCatalogList({
    products,
    duplicating,
    trendingProduct,
    isSuperAdmin,
    handleToggleActive,
    handleDuplicate,
    handleTrending,
    handleDelete,
}: ProductCatalogListProps) {
    return (
        <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
            {/* MOBILE: Cards */}
            <div className="md:hidden divide-y divide-white/5">
                {products.map(product => {
                    const isDuping = duplicating === product.id

                    return (
                        <div key={product.id} className="p-3.5 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 relative rounded-lg overflow-hidden bg-white/5 border border-white/10 shrink-0">
                                    <Image
                                        src={product.image || '/heroes/default.jpg'}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-white truncate text-sm">{product.name}</p>
                                        {product.season && (
                                            <span className="text-[9px] font-bold text-gray-300 bg-white/10 px-1.5 py-0.2 rounded-full border border-white/10 shrink-0">
                                                {product.season}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-primary truncate">
                                        {product.team?.name || product.brand?.name || 'Sin equipo'}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        <span className="text-[10px] text-gray-500">{product.category?.name || 'N/A'}</span>
                                        <span className="text-gray-700">·</span>
                                        <span className="text-[10px] text-gray-500">{product.league?.name || 'N/A'}</span>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="font-black text-white text-sm">L {product.price}</p>
                                    <button
                                        onClick={() => handleToggleActive(product.id, product.active)}
                                        className="flex items-center gap-1 mt-1 ml-auto cursor-pointer"
                                    >
                                        <div className={`w-2 h-2 rounded-full ${product.active ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <span className="text-[10px] text-gray-500">{product.active ? 'Activo' : 'Inactivo'}</span>
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                                <Link
                                    href={`/admin/productos/editar/${product.id}`}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors text-xs font-bold"
                                >
                                    <Edit className="w-3.5 h-3.5" /> Editar
                                </Link>
                                <button
                                    onClick={() => handleDuplicate(product)}
                                    disabled={isDuping}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/5 hover:bg-blue-500/20 rounded-lg text-gray-400 hover:text-blue-400 transition-colors text-xs font-bold disabled:opacity-30 cursor-pointer"
                                >
                                    {isDuping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />} Copiar
                                </button>
                                <button
                                    onClick={() => handleDelete(product.id)}
                                    disabled={!isSuperAdmin}
                                    className="p-2 bg-white/5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30 cursor-pointer"
                                    title={!isSuperAdmin ? 'Solo los super admins pueden eliminar' : 'Mover a papelera'}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* DESKTOP: Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/5 text-xs uppercase tracking-wider text-gray-400">
                            <th className="p-4 font-bold">Producto</th>
                            <th className="p-4 font-bold">Categoría / Liga</th>
                            <th className="p-4 font-bold">Equipo</th>
                            <th className="p-4 font-bold text-right">Precio</th>
                            <th className="p-4 font-bold text-center">Estado</th>
                            <th className="p-4 font-bold text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {products.map(product => {
                            const isDuping = duplicating === product.id
                            const isTrending = product.trending_until && new Date(product.trending_until) > new Date()
                            const isTrendingLoading = trendingProduct === product.id

                            return (
                                <tr key={product.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-white/5 border border-white/10">
                                                <Image
                                                    src={product.image || '/heroes/default.jpg'}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform"
                                                />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-white group-hover:text-primary transition-colors">
                                                        {product.name}
                                                    </p>
                                                    {product.featured && (
                                                        <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                            ⭐ #{product.sort_order ?? 0}
                                                        </span>
                                                    )}
                                                    {product.season && (
                                                        <span className="text-[10px] font-bold text-gray-300 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                                                            {product.season}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500">ID: {product.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="flex items-center gap-2 text-sm text-gray-300">
                                                <Tag className="w-3 h-3 text-gray-500" /> {product.category?.name || 'N/A'}
                                            </span>
                                            <span className="flex items-center gap-2 text-xs text-gray-500">
                                                <Trophy className="w-3 h-3" /> {product.league?.name || 'N/A'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-white border border-white/10">
                                            {product.team?.name || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-mono text-white">
                                        L {product.price}
                                    </td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => handleToggleActive(product.id, product.active)}
                                            title={product.active ? 'Desactivar' : 'Activar'}
                                            className="group inline-flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors hover:bg-white/5 cursor-pointer"
                                        >
                                            <div className={`w-2 h-2 rounded-full transition-colors ${product.active ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">
                                                {product.active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </button>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                            <Link
                                                href={`/admin/productos/editar/${product.id}`}
                                                title="Editar"
                                                className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white text-white hover:text-black rounded-lg transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDuplicate(product)}
                                                disabled={isDuping}
                                                title="Duplicar"
                                                className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-blue-500/20 text-white hover:text-blue-400 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                                            >
                                                {isDuping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                                            </button>

                                            {/* Trending */}
                                            {isTrendingLoading ? (
                                                <div className="w-9 h-9 flex items-center justify-center">
                                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                </div>
                                            ) : isTrending ? (
                                                <button
                                                    onClick={() => handleTrending(product.id, null)}
                                                    title="Desactivar EN VIVO"
                                                    className="w-9 h-9 flex items-center justify-center bg-primary/20 hover:bg-primary text-primary hover:text-white rounded-lg transition-colors cursor-pointer"
                                                >
                                                    <Zap className="w-4 h-4" fill="currentColor" />
                                                </button>
                                            ) : (
                                                <div className="relative group/tl">
                                                    <button
                                                        title="Activar EN VIVO"
                                                        className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-primary/20 text-gray-400 hover:text-primary rounded-lg transition-colors cursor-pointer"
                                                    >
                                                        <Zap className="w-4 h-4" />
                                                    </button>
                                                    <div className="absolute bottom-full mb-1 right-0 hidden group-hover/tl:flex flex-row gap-1 bg-neutral-900 border border-white/10 rounded-xl p-1.5 shadow-2xl z-20">
                                                        {[2, 4, 8].map(h => (
                                                            <button
                                                                key={h}
                                                                onClick={() => handleTrending(product.id, h)}
                                                                className="text-xs text-white hover:text-primary px-2.5 py-1.5 rounded-lg hover:bg-white/5 whitespace-nowrap transition-colors cursor-pointer"
                                                            >
                                                                {h}h
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <button
                                                className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-red-500/20 text-white hover:text-red-500 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:text-white cursor-pointer"
                                                onClick={() => handleDelete(product.id)}
                                                disabled={!isSuperAdmin}
                                                title={!isSuperAdmin ? 'Solo los super admins pueden eliminar' : 'Mover a papelera'}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
