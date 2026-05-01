"use client";

import { useRef } from "react";
import { Image as ImageIcon } from "lucide-react";

export function parseFocalPoint(v: string): { x: number; y: number } {
    const pct = v.match(/^(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
    if (pct) return { x: parseFloat(pct[1]), y: parseFloat(pct[2]) };
    const xMap: Record<string, number> = { left: 0, center: 50, right: 100 };
    const yMap: Record<string, number> = { top: 0, center: 50, bottom: 100 };
    const [xStr = "center", yStr = "center"] = v.trim().split(/\s+/);
    return { x: xMap[xStr] ?? 50, y: yMap[yStr] ?? 50 };
}

interface FocalPointPickerProps {
    imageUrl?: string;
    value: string;
    onChange: (v: string) => void;
    label: string;
    aspectRatio: string;
}

export default function FocalPointPicker({ imageUrl, value, onChange, label, aspectRatio }: FocalPointPickerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const { x, y } = parseFocalPoint(value || "50% 50%");

    const updateFromPointer = (clientX: number, clientY: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const nx = Math.round(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
        const ny = Math.round(Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)));
        onChange(`${nx}% ${ny}%`);
    };

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
                <span className="text-[10px] font-mono text-gray-600">{Math.round(x)}% {Math.round(y)}%</span>
            </div>
            <div
                ref={containerRef}
                className="relative rounded-xl overflow-hidden cursor-crosshair select-none border border-white/10 bg-neutral-900"
                style={{ aspectRatio }}
                onMouseDown={e => { isDragging.current = true; updateFromPointer(e.clientX, e.clientY); e.preventDefault(); }}
                onMouseMove={e => { if (isDragging.current) updateFromPointer(e.clientX, e.clientY); }}
                onMouseUp={() => { isDragging.current = false; }}
                onMouseLeave={() => { isDragging.current = false; }}
                onTouchStart={e => { isDragging.current = true; updateFromPointer(e.touches[0].clientX, e.touches[0].clientY); }}
                onTouchMove={e => { if (isDragging.current) updateFromPointer(e.touches[0].clientX, e.touches[0].clientY); }}
                onTouchEnd={() => { isDragging.current = false; }}
            >
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt=""
                        draggable={false}
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        style={{ objectPosition: `${x}% ${y}%` }}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon size={20} className="text-gray-700" />
                    </div>
                )}
                {/* Grid de tercios */}
                <div className="absolute inset-0 pointer-events-none opacity-20">
                    <div className="absolute top-1/3 left-0 right-0 h-px bg-white" />
                    <div className="absolute top-2/3 left-0 right-0 h-px bg-white" />
                    <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white" />
                    <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white" />
                </div>
                {/* Crosshair */}
                <div className="absolute top-0 bottom-0 w-px bg-white/40 pointer-events-none" style={{ left: `${x}%` }} />
                <div className="absolute left-0 right-0 h-px bg-white/40 pointer-events-none" style={{ top: `${y}%` }} />
                {/* Punto focal */}
                <div
                    className="absolute w-4 h-4 rounded-full border-2 border-white pointer-events-none -translate-x-1/2 -translate-y-1/2 shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"
                    style={{ left: `${x}%`, top: `${y}%`, background: "rgba(229,9,20,0.9)" }}
                />
                <div className="absolute bottom-1 inset-x-0 flex justify-center pointer-events-none">
                    <span className="text-[8px] text-white/30">Arrastra para mover</span>
                </div>
            </div>
        </div>
    );
}
