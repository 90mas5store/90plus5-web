import React from "react";
import Image from "next/image";
import { Plus, Image as ImageIcon, Loader2, Trash2, Sliders } from "lucide-react";
import { Banner } from "./types";

interface BannersSidebarProps {
    banners: Banner[];
    loading: boolean;
    selectedBannerId: string | null;
    onSelectBanner: (banner: Banner) => void;
    onCreateNew: () => void;
    onDelete: (id: string, e?: React.MouseEvent) => void;
    onOpenHeroSettings?: () => void;
}

export default function BannersSidebar({
    banners,
    loading,
    selectedBannerId,
    onSelectBanner,
    onCreateNew,
    onDelete,
    onOpenHeroSettings,
}: BannersSidebarProps) {
    return (
        <div className="w-full md:w-80 flex flex-col bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex-shrink-0">
            {/* Header Lista */}
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div>
                    <h2 className="text-base font-bold text-white tracking-wide">Banners</h2>
                    <p className="text-xs text-gray-500 font-medium">{banners.length} elementos</p>
                </div>
                <button
                    type="button"
                    onClick={onCreateNew}
                    className="w-8 h-8 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-all shadow-lg shadow-white/10 cursor-pointer"
                    title="Nuevo Banner"
                >
                    <Plus size={18} />
                </button>
            </div>

            {/* Lista Scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                {loading ? (
                    <div className="p-10 flex justify-center">
                        <Loader2 className="animate-spin text-gray-600" />
                    </div>
                ) : banners.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-xs flex flex-col items-center">
                        <ImageIcon size={24} className="mb-2 opacity-30" />
                        Sin banners. Crea uno nuevo.
                    </div>
                ) : (
                    banners.map(banner => (
                        <div
                            key={banner.id}
                            onClick={() => onSelectBanner(banner)}
                            className={`
                                group relative flex items-center gap-3 p-2 pr-3 rounded-xl cursor-pointer transition-all duration-300 border
                                ${selectedBannerId === banner.id
                                    ? "bg-white/10 border-white/20 shadow-inner"
                                    : "bg-transparent border-transparent hover:bg-white/5"
                                }
                            `}
                        >
                            {/* Thumbnail */}
                            <div className="w-14 h-10 relative rounded-lg overflow-hidden bg-black shrink-0 border border-white/10 shadow-sm">
                                {banner.image_url ? (
                                    <Image src={banner.image_url} fill alt="" className="object-cover" sizes="56px" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                                        <ImageIcon size={12} className="text-gray-600" />
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h4 className={`text-xs font-bold truncate ${selectedBannerId === banner.id ? "text-white" : "text-gray-400 group-hover:text-gray-200"}`}>
                                    {banner.title || <span className="italic opacity-50">Sin título</span>}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border ${banner.active
                                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                                        : "bg-gray-700/30 text-gray-500 border-gray-600/30"
                                    }`}>
                                        {banner.active ? "ACTIVO" : "INACTIVO"}
                                    </div>
                                    {banner.show_on_home && (
                                        <span className="text-[9px] text-blue-400 font-bold" title="Visible en Home">
                                            HOME
                                        </span>
                                    )}
                                    <span className="ml-auto text-[9px] text-gray-600 font-mono">#{banner.sort_order}</span>
                                </div>
                            </div>

                            {/* Actions Quick */}
                            <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 rounded-lg p-1 flex gap-1 backdrop-blur-sm border border-white/10 shadow-xl">
                                <button
                                    type="button"
                                    onClick={(e) => onDelete(banner.id, e)}
                                    className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded transition cursor-pointer"
                                    title="Eliminar"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Acceso a Configuración de Textos del Hero */}
            {onOpenHeroSettings && (
                <div className="p-3 border-t border-white/5 bg-white/[0.02]">
                    <button
                        type="button"
                        onClick={onOpenHeroSettings}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition border border-white/10 active:scale-95 cursor-pointer"
                    >
                        <Sliders size={14} className="text-primary" />
                        <span>Textos & Elementos del Hero</span>
                    </button>
                </div>
            )}
        </div>
    );
}
