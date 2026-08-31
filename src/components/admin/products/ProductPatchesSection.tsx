'use client';

import React from 'react';
import { ShieldPlus } from 'lucide-react';
import { AdminPatch } from '@/types/adminProduct';

interface ProductPatchesSectionProps {
    filteredPatches: AdminPatch[];
    productPatches: Set<string>;
    categoryId: string;
    onTogglePatch: (patchId: string) => void;
}

export default function ProductPatchesSection({
    filteredPatches,
    productPatches,
    categoryId,
    onTogglePatch,
}: ProductPatchesSectionProps) {
    return (
        <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6 space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldPlus className="w-4 h-4 text-primary" /> Parches Disponibles
            </h2>

            <div className="flex flex-wrap gap-2">
                {filteredPatches.map((patch) => {
                    const isSelected = productPatches.has(patch.id);
                    return (
                        <button
                            key={patch.id}
                            type="button"
                            onClick={() => onTogglePatch(patch.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 tracking-wide cursor-pointer ${
                                isSelected
                                    ? 'bg-primary/20 text-primary border-primary'
                                    : 'bg-black/30 text-gray-500 border-white/10 hover:border-white/30 hover:text-gray-300'
                            }`}
                        >
                            {patch.name}
                        </button>
                    );
                })}
                {filteredPatches.length === 0 && (
                    <span className="text-xs text-gray-600">
                        {!categoryId
                            ? 'No hay parches en el catálogo.'
                            : 'Sin parches para esta categoría. Configúralos en Personalización.'}
                    </span>
                )}
            </div>
        </div>
    );
}
