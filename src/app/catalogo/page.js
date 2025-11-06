'use client';
import { Suspense } from "react";
import CatalogoContent from "./CatalogoContent";

export default function CatalogoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black text-gray-400">
        Cargando catálogo...
      </div>
    }>
      <CatalogoContent />
    </Suspense>
  );
}

