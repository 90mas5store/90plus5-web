import React from "react";
import { Image as ImageIcon, Film, Sparkles, Monitor, Smartphone } from "lucide-react";
import MediaUpload from "@/components/admin/MediaUpload";
import FocalPointPicker from "@/components/admin/FocalPointPicker";
import { SpecialBanner } from "./types";

interface SpecialBannerMediaSectionProps {
    formData: Partial<SpecialBanner>;
    onUpdateField: (field: keyof SpecialBanner, value: string) => void;
}

export default function SpecialBannerMediaSection({
    formData,
    onUpdateField,
}: SpecialBannerMediaSectionProps) {
    return (
        <div className="space-y-8">
            {/* Medios de Fondo */}
            <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Medios de Fondo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-start">
                    {/* Background Image */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <label className="text-sm font-bold text-gray-200 flex items-center gap-2">
                                <ImageIcon size={16} className="text-primary" /> Imagen de Fondo
                            </label>
                            <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded">Póster / Hero</span>
                        </div>
                        <div className="aspect-video w-full">
                            <MediaUpload
                                type="image"
                                value={formData.background_image_url || ""}
                                onChange={(url) => onUpdateField("background_image_url", url)}
                                onRemove={() => onUpdateField("background_image_url", "")}
                                className="bg-neutral-900/50 hover:bg-neutral-900 border-dashed border-white/20 hover:border-white/40 shadow-inner"
                            />
                        </div>
                    </div>

                    {/* Background Video */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <label className="text-sm font-bold text-gray-200 flex items-center gap-2">
                                <Film size={16} className="text-purple-400" /> Video Loop (Opcional)
                            </label>
                            <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded">Fondo en Movimiento</span>
                        </div>
                        <div className="aspect-video w-full">
                            <MediaUpload
                                type="video"
                                value={formData.background_video_url || ""}
                                onChange={(url) => onUpdateField("background_video_url", url)}
                                onRemove={() => onUpdateField("background_video_url", "")}
                                className="bg-neutral-900/50 hover:bg-neutral-900 border-dashed border-white/20 hover:border-white/40 shadow-inner"
                            />
                        </div>
                    </div>
                </div>

                {/* Selector Interactivo de Punto Focal / Centro de Imagen */}
                {formData.background_image_url && (
                    <div className="mt-5 p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/5">
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                                    <Sparkles size={14} className="text-primary" /> Centro de la Imagen (Encuadre Focal)
                                </h4>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                    Arrastra el punto rojo directamente sobre la parte más importante (jugadores, caras, trofeo) para que nunca salga cortada en ninguna pantalla.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Monitor size={14} className="text-gray-400" />
                                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Pantallas Grandes (Desktop)</span>
                                </div>
                                <FocalPointPicker
                                    label="Encuadre Desktop"
                                    imageUrl={formData.background_image_url}
                                    value={formData.image_position_desktop || "50% 50%"}
                                    onChange={(v) => onUpdateField("image_position_desktop", v)}
                                    aspectRatio="16/5"
                                />
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Smartphone size={14} className="text-gray-400" />
                                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Celulares (Mobile)</span>
                                </div>
                                <FocalPointPicker
                                    label="Encuadre Mobile"
                                    imageUrl={formData.background_image_url}
                                    value={formData.image_position_mobile || "50% 50%"}
                                    onChange={(v) => onUpdateField("image_position_mobile", v)}
                                    aspectRatio="4/3"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Branding & Elementos Gráficos */}
            <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Branding & Elementos Gráficos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-start">
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-200 flex items-center gap-2">
                            <ImageIcon size={16} className="text-yellow-400" /> Logo del Evento
                        </label>
                        <p className="text-[10px] text-gray-500">Aparece junto al título. Ej: escudo del clásico, logo del torneo.</p>
                        <div className="aspect-square w-full max-w-[200px]">
                            <MediaUpload
                                type="image"
                                value={formData.logo_url || ""}
                                onChange={(url) => onUpdateField("logo_url", url)}
                                onRemove={() => onUpdateField("logo_url", "")}
                                className="bg-neutral-900/50 hover:bg-neutral-900 border-dashed border-white/20 hover:border-white/40 shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-200 flex items-center gap-2">
                            <ImageIcon size={16} className="text-blue-400" /> Imagen Decorativa
                        </label>
                        <p className="text-[10px] text-gray-500">Elemento flotante a la derecha. Ej: trofeo, balón, silueta.</p>
                        <div className="aspect-square w-full max-w-[200px]">
                            <MediaUpload
                                type="image"
                                value={formData.decoration_image_url || ""}
                                onChange={(url) => onUpdateField("decoration_image_url", url)}
                                onRemove={() => onUpdateField("decoration_image_url", "")}
                                className="bg-neutral-900/50 hover:bg-neutral-900 border-dashed border-white/20 hover:border-white/40 shadow-inner"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
