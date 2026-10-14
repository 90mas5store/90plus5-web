import React from "react";
import { Image as ImageIcon, Film, Monitor, Smartphone } from "lucide-react";
import MediaUpload from "@/components/admin/MediaUpload";
import FocalPointPicker from "@/components/admin/FocalPointPicker";
import { Banner } from "./types";

interface BannerMediaSectionProps {
    formData: Partial<Banner>;
    onUpdateField: (field: keyof Banner, value: string) => void;
}

export default function BannerMediaSection({
    formData,
    onUpdateField,
}: BannerMediaSectionProps) {
    return (
        <div className="space-y-6 md:space-y-8">
            {/* Medios principales: Imagen y Video */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-start">
                {/* Imagen Principal */}
                <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <label className="text-sm font-bold text-gray-200 flex items-center gap-2">
                            <ImageIcon size={16} className="text-primary" /> Imagen / Poster
                        </label>
                        <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded">Recomendado</span>
                    </div>

                    <div className="aspect-video w-full">
                        <MediaUpload
                            type="image"
                            value={formData.image_url || ""}
                            onChange={(url) => onUpdateField("image_url", url)}
                            onRemove={() => onUpdateField("image_url", "")}
                            className="bg-neutral-900/50 hover:bg-neutral-900 border-dashed border-white/20 hover:border-white/40 shadow-inner"
                        />
                    </div>
                </div>

                {/* Video Loop */}
                <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <label className="text-sm font-bold text-gray-200 flex items-center gap-2">
                            <Film size={16} className="text-purple-400" /> Video Loop (Opcional)
                        </label>
                        <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded">Desktop Only</span>
                    </div>
                    <div className="aspect-video w-full">
                        <MediaUpload
                            type="video"
                            value={formData.video_url || ""}
                            onChange={(url) => onUpdateField("video_url", url)}
                            onRemove={() => onUpdateField("video_url", "")}
                            className="bg-neutral-900/50 hover:bg-neutral-900 border-dashed border-white/20 hover:border-white/40 shadow-inner"
                        />
                    </div>
                </div>
            </div>

            {/* Punto Focal Desktop y Mobile */}
            <div className="rounded-2xl border border-white/10 overflow-hidden">
                <div className="px-5 py-3 bg-white/[0.03]">
                    <span className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-widest">
                        <ImageIcon size={14} className="text-blue-400" /> Punto Focal de Imagen
                    </span>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Monitor size={13} className="text-gray-500" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Desktop</span>
                        </div>
                        <FocalPointPicker
                            label="Desktop"
                            imageUrl={formData.image_url}
                            value={formData.image_position_desktop || "50% 50%"}
                            onChange={v => onUpdateField("image_position_desktop", v)}
                            aspectRatio="16/5"
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Smartphone size={13} className="text-gray-500" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mobile</span>
                        </div>
                        <FocalPointPicker
                            label="Mobile"
                            imageUrl={formData.image_url}
                            value={formData.image_position_mobile || "50% 50%"}
                            onChange={v => onUpdateField("image_position_mobile", v)}
                            aspectRatio="4/3"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
