'use client';
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { Suspense } from "react";
import ProductoPersonalizar from "./ProductoPersonalizar";


export default function ProductoPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-black text-white">
          <p>Cargando producto...</p>
        </main>
      }
    >
      <ProductoPersonalizar />
    </Suspense>
  );
}
