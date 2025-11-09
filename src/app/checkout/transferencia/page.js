"use client";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";


import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Button from "../../../components/ui/Button";
import { useCart } from "../../../context/CartContext";

export default function TransferenciaPage() {
  const router = useRouter();
  const { items, total } = useCart();

  const numeroWhatsApp = "50496649622"; // 🔧 tu número real (solo dígitos)

  // 🧾 Generar resumen del pedido
  const resumenPedido = items
    .map(
      (item, i) =>
        `${i + 1}. ${item.equipo} - ${item.modelo}${
          item.version ? ` (${item.version})` : ""
        } - Talla ${item.talla}${item.dorsal ? ` - Dorsal ${item.dorsal}` : ""}`
    )
    .join("\n");

  // 💬 Mensaje formateado con estilo WhatsApp (negritas y saltos de línea)
  const mensaje = encodeURIComponent(
    `*Confirmación de pago - 90+5 Store*\n\n` +
      `He realizado el depósito correspondiente al *50% del anticipo* de mi pedido.\n\n` +
      `*Detalle del pedido:*\n${resumenPedido}\n\n` +
      `*Total del pedido:* L ${total.toFixed(2)}\n\n` +
      `_Adjunto el comprobante de pago en este mensaje._`
  );

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-2xl shadow-2xl text-center"
      >
        {/* 🏦 Encabezado */}
        <h1 className="text-2xl font-bold text-[#E50914] mb-4">
          Transferencia Bancaria
        </h1>

        <p className="text-gray-300 mb-6 text-sm leading-relaxed">
          Realiza el pago del{" "}
          <span className="text-[#E50914] font-semibold">50% de anticipo</span>{" "}
          a la cuenta indicada. Luego envíanos el comprobante por WhatsApp para
          confirmar tu pedido.
        </p>

        {/* 💳 Detalle de cuenta */}
        <div className="bg-black/30 border border-white/10 rounded-lg p-4 text-left text-sm space-y-2 mb-6">
          <p>
            <strong>Banco:</strong> BAC Credomatic
          </p>
          <p>
            <strong>Tipo de cuenta:</strong> Ahorros
          </p>
          <p>
            <strong>Número:</strong> 123456789
          </p>
          <p>
            <strong>Nombre:</strong> 90+5 Store
          </p>
        </div>

        {/* 📩 Contacto */}
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          Envía tu comprobante de pago a:
          <br />
          <span className="text-white font-medium">
            WhatsApp: +504 9999-9999
          </span>
          <br />
          <span className="text-white font-medium">
            Correo: pagos@90mas5.com
          </span>
        </p>

        {/* ⚙️ Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => router.push("/catalogo")}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Seguir comprando
          </Button>

          <Button
            onClick={() =>
              window.open(`https://wa.me/${numeroWhatsApp}?text=${mensaje}`, "_blank")
            }
            className="w-full sm:w-auto"
          >
            Enviar comprobante a WhatsApp
          </Button>
        </div>
      </motion.div>
    </main>
  );
}
