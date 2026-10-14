import React from "react";
import Image from "next/image";
import { Plus, Image as ImageIcon, Loader2, Copy, Trash2 } from "lucide-react";
import { SpecialBanner } from "./types";

interface SpecialBannersSidebarProps {
    banners: SpecialBanner[];
    loading: boolean;
    selectedBannerId: string | null;
    onSelectBanner: (banner: SpecialBanner) => void;
    onCreateNew: () => void;
    onDuplicate: (banner: SpecialBanner, e?: React.MouseEvent) => void;
    onDelete: (id: string, e?: React.MouseEvent) => void;
    onToggleActive: (banner: SpecialBanner, e?: React.MouseEvent) => void;
}

export default function SpecialBannersSidebar({
    banners,
    loading,
    selectedBannerId,
    onSelectBanner,
    onCreateNew,
    onDuplicate,
    onDelete,
    onToggleActive,
}: SpecialBannersSidebarProps) {
    return (
        <div className="w-full md:w-80 flex flex-col bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex-shrink-0">
            {/* Header */}
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div>
                    <h2 className="text-base font-bold text-white tracking-wide">Banners Especiales</h2>
                    <p className="text-xs text-gray-500 font-medium">{banners.length} campañas configuradas</p>
                </div>
                <button
                    onClick={onCreateNew}
                    className="w-8 h-8 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-all shadow-lg shadow-white/10 cursor-pointer"
                    title="Nuevo Banner / Colección"
                >
                    <Plus size={18} />
                </button>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                {loading ? (
                    <div className="p-10 flex justify-center">
                        <Loader2 className="animate-spin text-gray-600" />
                    </div>
                ) : banners.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-xs flex flex-col items-center">
                        <ImageIcon size={24} className="mb-2 opacity-30" />
                        Sin banners especiales. Crea uno nuevo.
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
                                {banner.background_image_url ? (
                                    <Image src={banner.background_image_url} fill alt="" className="object-cover" sizes="56px" />
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
                                    <button
                                        type="button"
                                        onClick={(e) => onToggleActive(banner, e)}
                                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border cursor-pointer transition-colors ${banner.active
                                            ? "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20"
                                            : "bg-gray-700/30 text-gray-500 border-gray-600/30 hover:bg-gray-700/50"
                                        }`}
                                    >
                                        {banner.active ? "ACTIVO" : "INACTIVO"}
                                    </button>
                                    <span className="ml-auto text-[9px] text-gray-600 font-mono">#{banner.sort_order}</span>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 rounded-lg p-1 flex gap-1 backdrop-blur-sm border border-white/10 shadow-xl">
                                <button
                                    type="button"
                                    onClick={(e) => onDuplicate(banner, e)}
                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition cursor-pointer"
                                    title="Duplicar"
                                >
                                    <Copy size={13} />
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => onDelete(banner.id, e)}
                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded transition cursor-pointer"
                                    title="Eliminar"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
