"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, LogOut } from "lucide-react";
import HistorialPedidos from "../../components/perfil/HistorialPedidos";
import DatosUsuario from "../../components/perfil/DatosUsuario";
import Button from "../../components/ui/Button";

export default function PerfilPage() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🧠 Simular carga de sesión (más adelante conectarás auth real)
  useEffect(() => {
    const fakeUser = {
      nombre: "Daniel Urbizo",
      correo: "daniel@90mas5store.com",
      avatar: "/avatar.png",
    };
    setTimeout(() => {
      setUsuario(fakeUser);
      setLoading(false);
    }, 600);
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-black text-white">
        Cargando perfil...
      </div>
    );

  if (!usuario)
    return (
      <main className="min-h-screen bg-black text-white flex flex-col justify-center items-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-4"
        >
          No has iniciado sesión
        </motion.h1>
        <p className="text-gray-400 mb-8">
          Inicia sesión para ver tu perfil y tus pedidos.
        </p>
        <Button>Iniciar sesión</Button>
      </main>
    );

  return (
    <main className="min-h-screen bg-black text-white pt-24 pb-16 px-6">
      {/* ENCABEZADO */}
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-center justify-between border-b border-white/10 pb-8 mb-8"
      >
        <div className="flex items-center gap-4">
          <img
            src={usuario.avatar}
            alt="Avatar"
            className="w-16 h-16 rounded-full border border-[#E50914]/60 object-cover"
          />
          <div>
            <h1 className="text-2xl font-bold">{usuario.nombre}</h1>
            <p className="text-gray-400 text-sm">{usuario.correo}</p>
          </div>
        </div>
        <Button className="mt-4 sm:mt-0 flex items-center gap-2 bg-[#E50914]/80 hover:bg-[#E50914]">
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </Button>
      </motion.section>

      {/* SECCIONES */}
      <DatosUsuario usuario={usuario} />
      <HistorialPedidos usuario={usuario} />
    </main>
  );
}
