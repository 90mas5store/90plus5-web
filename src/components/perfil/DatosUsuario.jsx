"use client";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone } from "lucide-react";

export default function DatosUsuario({ usuario }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111]/80 backdrop-blur-xl rounded-2xl p-6 mb-10 border border-white/10 shadow-[0_0_25px_rgba(255,255,255,0.05)]"
    >
      <h2 className="text-xl font-semibold mb-4 text-[#E50914]">
        Información personal
      </h2>
      <div className="grid sm:grid-cols-2 gap-4 text-gray-300 text-sm">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-[#E50914]" /> {usuario.correo}
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-[#E50914]" /> +504 9XX-XXX-XX
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#E50914]" /> Tegucigalpa, Honduras
        </div>
      </div>
    </motion.section>
  );
}
