import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subir Comprobante de Pago",
  robots: { index: false, follow: false },
};

export default function ComprobanteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
