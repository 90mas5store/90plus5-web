"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Button from "../../../components/ui/Button";
import Image from "next/image";

export default function PaypalPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-2xl shadow-2xl text-center"
      >
        {/* HEADER */}
        <h1 className="text-2xl font-bold text-[#E50914] mb-4">
          Pago con PayPal
        </h1>

        <p className="text-gray-300 mb-6 text-sm leading-relaxed">
          Completa tu pago del{" "}
          <span className="text-[#E50914] font-semibold">50% de anticipo</span>{" "}
          con PayPal. Al confirmar el pago, recibirás la confirmación automática
          y un correo con los detalles de tu pedido.
        </p>

        {/* LOGO PAYPAL */}
        <div className="flex justify-center mb-6">
          <Image
            src="/paypal-logo.png"
            alt="PayPal"
            width={150}
            height={50}
            className="object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]"
          />
        </div>

        {/* BOTÓN DE PAGO (simulación o real) */}
        <div className="bg-black/30 border border-white/10 rounded-lg p-6 text-center mb-6">
          <p className="text-sm text-gray-400 mb-4">
            Serás redirigido a PayPal para completar el pago de tu anticipo.
          </p>
          <Button
            onClick={() =>
              window.open(
                "https://www.paypal.com/paypalme/tucuenta",
                "_blank"
              )
            }
            className="w-full py-3"
          >
            Pagar anticipo con PayPal
          </Button>
        </div>

        {/* INFO ADICIONAL */}
        <p className="text-gray-400 text-sm mb-8">
          💬 Si tienes dudas o prefieres confirmar por mensaje, puedes contactarnos por{" "}
          <span
            onClick={() =>
              window.open("https://wa.me/50499999999?text=Hola,%20quiero%20confirmar%20mi%20pago%20por%20PayPal", "_blank")
            }
            className="text-[#E50914] hover:underline cursor-pointer"
          >
            WhatsApp
          </span>{" "}
          o correo a{" "}
          <span className="text-white font-medium">pagos@90mas5.com</span>
        </p>

        {/* BOTONES */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="w-full sm:w-auto"
          >
            Ir al inicio
          </Button>
          <Button onClick={() => router.push("/catalogo")} className="w-full sm:w-auto">
            Seguir comprando
          </Button>
        </div>
      </motion.div>
    </main>
  );
}
