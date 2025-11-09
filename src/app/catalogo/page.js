'use client';
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { Suspense } from "react";
import CatalogoContent from "./CatalogoContent";

export default function CatalogoPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-black text-white">
          <p>Cargando catálogo...</p>
        </main>
      }
    >
      <CatalogoContent />
    </Suspense>
  );
}
