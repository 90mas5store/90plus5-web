"use client";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { Suspense } from "react";
import ConectarContent from "./ConectarContent";

export default function ConectarPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh bg-black text-white flex items-center justify-center">
          Cargando página de contacto...
        </main>
      }
    >
      <ConectarContent />
    </Suspense>
  );
}
