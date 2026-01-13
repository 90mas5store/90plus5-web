import { Suspense } from "react";
import CatalogoContent from "./CatalogoContent";
import { CatalogPageSkeleton } from "../../components/skeletons/ProductSkeletons";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catálogo | 90+5 Store",
  description: "Explora nuestra colección completa de camisetas y equipaciones.",
};

export default function CatalogoPage() {
  return (
    <Suspense fallback={<CatalogPageSkeleton />}>
      <CatalogoContent />
    </Suspense>
  );
}

