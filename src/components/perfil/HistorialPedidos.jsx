"use client";
import { motion } from "framer-motion";
import { Package, Clock, CheckCircle } from "lucide-react";

export default function HistorialPedidos({ usuario }) {
  // 🧠 Simular pedidos por ahora
  const pedidos = [
    {
      id: "PED-2301",
      fecha: "2025-11-03",
      total: "L 1,500",
      estado: "Entregado",
    },
    {
      id: "PED-2289",
      fecha: "2025-10-18",
      total: "L 2,300",
      estado: "En camino",
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111]/80 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-[0_0_25px_rgba(255,255,255,0.05)]"
    >
      <h2 className="text-xl font-semibold mb-6 text-[#E50914]">
        Historial de pedidos
      </h2>

      {pedidos.length === 0 ? (
        <p className="text-gray-400 text-sm">No tienes pedidos registrados.</p>
      ) : (
        <ul className="space-y-4">
          {pedidos.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10 hover:border-[#E50914]/40 transition-all"
            >
              <div>
                <p className="font-medium text-white">
                  <Package className="inline w-4 h-4 mr-2 text-[#E50914]" />
                  {p.id}
                </p>
                <p className="text-gray-400 text-sm">{p.fecha}</p>
              </div>

              <div className="text-right">
                <p className="font-semibold text-[#E50914]">{p.total}</p>
                <p
                  className={`text-xs mt-1 ${
                    p.estado === "Entregado"
                      ? "text-green-400 flex items-center gap-1"
                      : "text-yellow-400 flex items-center gap-1"
                  }`}
                >
                  {p.estado === "Entregado" ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                  {p.estado}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </motion.section>
  );
}
