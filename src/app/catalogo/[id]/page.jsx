"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

// Legacy route — redirects to the proper product page /producto/[slug]
export default function LegacyProductRedirect() {
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      router.replace(`/producto/${id}`);
    }
  }, [id, router]);

  return null;
}
