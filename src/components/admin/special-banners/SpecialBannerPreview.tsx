import React from "react";
import { Eye, Monitor, Smartphone, ChevronDown, ArrowRight, Globe } from "lucide-react";
import { SpecialBanner, ICON_MAP } from "./types";

interface SpecialBannerPreviewProps {
    formData: Partial<SpecialBanner>;
    previewOpen: boolean;
    onTogglePreview: () => void;
    previewMode: "desktop" | "mobile";
    onChangePreviewMode: (mode: "desktop" | "mobile") => void;
}

export default function SpecialBannerPreview({
    formData,
    previewOpen,
    onTogglePreview,
    previewMode,
    onChangePreviewMode,
}: SpecialBannerPreviewProps) {
    const IconPreview = ICON_MAP[formData.badge_secondary_icon || "globe"] || Globe;

    return (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
            <button
                type="button"
                onClick={onTogglePreview}
                className="w-full flex items-center justify-between px-5 py-3 bg-white/[0.03] hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
                <span className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-widest">
                    <Eye size={14} className="text-primary" /> Vista Previa del Banner
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
                        <div className="relative rounded-2xl overflow-hidden bg-black/90 border border-white/10 min-h-[180px] md:min-h-[220px]">
                            <div className="absolute inset-0 bg-neutral-900">
                                {formData.background_image_url ? (
                                    <img
                                        src={formData.background_image_url}
                                        alt=""
                                        style={{
                                            objectPosition: previewMode === "mobile"
                                                ? (formData.image_position_mobile || "50% 50%")
                                                : (formData.image_position_desktop || "50% 50%")
                                        }}
                                        className="w-full h-full object-cover opacity-60 brightness-75 transition-all duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
                            </div>

                            <div className="relative px-5 md:px-10 py-6 md:py-8 flex items-center justify-between z-10">
                                <div className="flex flex-col gap-2 max-w-[70%]">
                                    {(formData.badge_primary_text || formData.badge_secondary_text) && (
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            {formData.badge_primary_text && (
                                                <span className="px-2 py-[2px] bg-white text-black text-[7px] md:text-[9px] font-black uppercase tracking-widest rounded-full border border-white">
                                                    {formData.badge_primary_text}
                                                </span>
                                            )}
                                            {formData.badge_secondary_text && (
                                                <div className="flex items-center gap-1 bg-black/40 text-[#FFD700] border border-[#FFD700]/30 px-2 py-0.5 rounded-full">
                                                    <IconPreview className="w-2.5 h-2.5 fill-current" />
                                                    <span className="text-[7px] md:text-[9px] font-bold tracking-wider uppercase">{formData.badge_secondary_text}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 md:gap-4">
                                        {formData.logo_url && (
                                            <div className="relative h-8 w-6 md:h-14 md:w-12 flex-shrink-0">
                                                <img src={formData.logo_url} alt="" className="w-full h-full object-contain" />
                                            </div>
                                        )}
                                        <h3 className={`font-black uppercase text-white tracking-tighter leading-none ${previewMode === "mobile" ? "text-2xl" : "text-4xl md:text-5xl"}`}>
                                            {formData.title || "TÍTULO DEL EVENTO"}
                                        </h3>
                                    </div>

                                    {formData.subtitle && (
                                        <p className={`text-gray-300 font-medium mt-1 ${previewMode === "mobile" ? "text-[10px]" : "text-sm"}`}>
                                            {formData.subtitle}
                                        </p>
                                    )}

                                    {formData.button_text && previewMode === "mobile" && (
                                        <div className="mt-2">
                                            <span className="inline-flex items-center gap-1.5 bg-white text-black px-4 py-1.5 rounded-full font-bold uppercase text-[8px] tracking-widest">
                                                {formData.button_text}
                                                <ArrowRight className="w-2.5 h-2.5" />
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {formData.decoration_image_url && (
                                    <div className={`absolute right-2 bottom-0 pointer-events-none ${previewMode === "mobile" ? "w-16 h-16 opacity-40" : "w-32 h-32 md:w-48 md:h-48"}`}>
                                        <img src={formData.decoration_image_url} alt="" className="w-full h-full object-contain" />
                                    </div>
                                )}

                                {formData.button_text && previewMode === "desktop" && (
                                    <div className="flex-shrink-0 z-20">
                                        <span className="inline-flex items-center gap-2 bg-white text-black px-5 py-2 rounded-full font-bold uppercase text-[10px] tracking-widest">
                                            {formData.button_text}
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="absolute bottom-1.5 right-2 z-20">
                                <span className="text-[8px] font-mono bg-black/60 text-gray-400 px-1.5 py-0.5 rounded border border-white/10">
                                    {formData.link_url || (formData.slug ? `/coleccion/${formData.slug}` : "/catalogo")}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
