import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Edit, Copy, Loader2, Zap, Trophy } from 'lucide-react'
import { ProductView } from './useAdminProducts'

interface ProductCatalogGridProps {
    products: ProductView[]
    duplicating: string | null
    trendingProduct: string | null
    handleDuplicate: (product: ProductView) => void
    handleTrending: (productId: string, hours: number | null) => void
}

export default function ProductCatalogGrid({
    products,
    duplicating,
    trendingProduct,
    handleDuplicate,
    handleTrending,
}: ProductCatalogGridProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6 pb-24">
            {products.map(product => {
                const isTrending = product.trending_until && new Date(product.trending_until) > new Date()
                const isDuping = duplicating === product.id
                const isTrendingLoading = trendingProduct === product.id

                return (
                    <div
                        key={product.id}
                        className="group relative bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 flex flex-col"
                    >
                        {/* Imagen compacta */}
                        <div className="aspect-square sm:aspect-[4/5] relative bg-white/5 overflow-hidden">
                            <Image
                                src={product.image || '/heroes/default.jpg'}
                                alt={product.name}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                            />

                            {/* Gradiente Overlay */}
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent opacity-60 group-hover:opacity-80 transition-opacity z-1 pointer-events-none" />

                            {/* Badges de Categoría, EN VIVO y Destacado */}
                            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 flex flex-col gap-1 pointer-events-none">
                                <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-black/70 backdrop-blur-md text-white border border-white/10 flex items-center gap-1.5">
                                    <span
                                        className={`w-2 h-2 rounded-full shrink-0 ${product.active ? 'bg-green-500' : 'bg-red-500'}`}
                                        title={product.active ? 'Activo' : 'Inactivo'}
                                    />
                                    <span className="truncate max-w-[70px] sm:max-w-none">
                                        {product.category?.name || 'General'}
                                    </span>
                                </span>
                                {isTrending && (
                                    <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-primary text-white animate-pulse w-fit">
                                        ⚡ EN VIVO
                                    </span>
                                )}
                                {product.featured && (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 w-fit flex items-center gap-1 shadow-sm backdrop-blur-md">
                                        ⭐ #{product.sort_order ?? 0}
                                    </span>
                                )}
                            </div>

                            {/* Menú Flotante de Acciones */}
                            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all sm:translate-x-2 sm:group-hover:translate-x-0 flex flex-col gap-1.5">
                                <Link
                                    href={`/admin/productos/editar/${product.id}`}
                                    className="p-2 sm:p-2.5 bg-white text-black rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform"
                                    title="Editar"
                                >
                                    <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </Link>
                                <button
                                    onClick={() => handleDuplicate(product)}
                                    disabled={isDuping}
                                    className="p-2 sm:p-2.5 bg-black/80 border border-white/20 text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform disabled:opacity-50 cursor-pointer"
                                    title="Duplicar"
                                >
                                    {isDuping ? (
                                        <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                                    ) : (
                                        <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    )}
                                </button>

                                {/* Trending toggle */}
                                {isTrendingLoading ? (
                                    <div className="p-2 sm:p-2.5 bg-primary/20 rounded-full flex items-center justify-center">
                                        <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-primary" />
                                    </div>
                                ) : isTrending ? (
                                    <button
                                        onClick={() => handleTrending(product.id, null)}
                                        className="p-2 sm:p-2.5 bg-primary text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                                        title="Desactivar EN VIVO"
                                    >
                                        <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" />
                                    </button>
                                ) : (
                                    <div className="relative group/trending">
                                        <button
                                            className="p-2 sm:p-2.5 bg-black/80 border border-white/20 text-gray-400 hover:text-primary hover:border-primary/50 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer"
                                            title="Activar EN VIVO"
                                        >
                                            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </button>
                                        <div className="absolute right-full mr-2 top-0 hidden group-hover/trending:flex flex-col gap-1 bg-neutral-900 border border-white/10 rounded-xl p-2 shadow-2xl z-20">
                                            {[2, 4, 8].map(h => (
                                                <button
                                                    key={h}
                                                    onClick={() => handleTrending(product.id, h)}
                                                    className="text-xs text-white hover:text-primary px-3 py-1.5 rounded-lg hover:bg-white/5 whitespace-nowrap transition-colors cursor-pointer"
                                                >
                                                    {h}h
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="p-3 sm:p-5 flex-1 flex flex-col relative">
                            <div className="flex-1">
                                <div className="flex items-center justify-between gap-1 mb-1 flex-wrap">
                                    <span className="text-[10px] sm:text-xs font-bold text-primary tracking-wider uppercase truncate max-w-[90px] sm:max-w-none">
                                        {product.team?.name || product.brand?.name || 'Sin equipo'}
                                    </span>
                                    {product.season && (
                                        <span className="text-[9px] sm:text-[10px] font-bold text-gray-300 bg-white/10 px-1.5 py-0.2 rounded-full border border-white/10">
                                            {product.season}
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-xs sm:text-lg font-bold text-white mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                                    {product.name}
                                </h3>
                                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-400 mb-2 sm:mb-4 truncate">
                                    <Trophy className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{product.league?.name || 'Liga Desconocida'}</span>
                                </div>
                            </div>

                            <div className="flex items-end justify-between border-t border-white/10 pt-2 sm:pt-4 mt-1">
                                <div>
                                    <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">Precio Base</p>
                                    <p className="text-sm sm:text-xl font-black text-white">L {product.price}</p>
                                </div>
                                <div
                                    className={`w-2 h-2 rounded-full ${
                                        product.active
                                            ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                                            : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                                    }`}
                                />
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
