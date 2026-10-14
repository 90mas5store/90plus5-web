import React from "react";
import { Eye, Monitor, Smartphone, ChevronDown, ImageIcon, ExternalLink } from "lucide-react";
import { Banner } from "./types";

interface BannerPreviewProps {
    formData: Partial<Banner>;
    previewOpen: boolean;
    onTogglePreview: () => void;
    previewMode: "desktop" | "mobile";
    onChangePreviewMode: (mode: "desktop" | "mobile") => void;
}

export default function BannerPreview({
    formData,
    previewOpen,
    onTogglePreview,
    previewMode,
    onChangePreviewMode,
}: BannerPreviewProps) {
    return (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
            <button
                type="button"
                onClick={onTogglePreview}
                className="w-full flex items-center justify-between px-5 py-3 bg-white/[0.03] hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
                <span className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-widest">
                    <Eye size={14} className="text-primary" /> Vista Previa
                </span>
                <div className="flex items-center gap-3">
                    {previewOpen && (
                        <div
                            className="flex bg-black/40 rounded-lg p-0.5 border border-white/10"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                onClick={() => onChangePreviewMode("desktop")}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                    previewMode === "desktop" ? "bg-white text-black" : "text-gray-500 hover:text-white"
                                }`}
                            >
                                <Monitor size={11} /> Desktop
                            </button>
                            <button
                                type="button"
                                onClick={() => onChangePreviewMode("mobile")}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                    previewMode === "mobile" ? "bg-white text-black" : "text-gray-500 hover:text-white"
                                }`}
                            >
                                <Smartphone size={11} /> Mobile
                            </button>
                        </div>
                    )}
                    <ChevronDown size={14} className={`text-gray-500 transition-transform ${previewOpen ? "rotate-180" : ""}`} />
                </div>
            </button>

            {previewOpen && (
                <div className="p-4 bg-black/20">
                    <div className={`mx-auto transition-all duration-300 ${previewMode === "mobile" ? "max-w-[390px]" : "w-full"}`}>
                        <div
                            className="relative rounded-xl overflow-hidden bg-neutral-900 border border-white/5"
                            style={{ aspectRatio: previewMode === "mobile" ? "4/3" : "16/5" }}
                        >
                            {/* Imagen de fondo */}
                            {formData.image_url ? (
                                <img
                                    src={formData.image_url}
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover"
                                    style={{
                                        objectPosition: previewMode === "mobile"
                                            ? (formData.image_position_mobile || "center center")
                                            : (formData.image_position_desktop || "center center"),
                                    }}
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
                                    <ImageIcon size={32} className="text-gray-600" />
                                </div>
                            )}

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

                            {/* Texto */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 gap-1.5">
                                {formData.title && (
                                    <p
                                        className="text-white font-extrabold drop-shadow-lg leading-tight"
                                        style={{ fontSize: previewMode === "mobile" ? "14px" : "22px" }}
                                    >
                                        {formData.title}
                                    </p>
                                )}
                                {formData.description && (
                                    <p
                                        className="text-gray-300 leading-tight"
                                        style={{ fontSize: previewMode === "mobile" ? "10px" : "13px" }}
                                    >
                                        {formData.description}
                                    </p>
                                )}
                                {formData.show_button && formData.button_text && (
                                    <span
                                        className="mt-1 inline-flex items-center gap-1 bg-primary text-black font-bold rounded-full px-3 py-1"
                                        style={{ fontSize: previewMode === "mobile" ? "9px" : "11px" }}
                                    >
                                        {formData.button_text} <ExternalLink size={previewMode === "mobile" ? 8 : 10} />
                                    </span>
                                )}
                            </div>

                            {/* Destino badge */}
                            <div className="absolute bottom-2 right-2">
                                <span className="text-[9px] font-mono bg-black/60 text-gray-400 px-1.5 py-0.5 rounded border border-white/10">
                                    {formData.link_url || "/catalogo"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
