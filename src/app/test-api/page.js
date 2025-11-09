"use client";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";


import { useState } from "react";

export default function TestAPI() {
  const [result, setResult] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [loading, setLoading] = useState(false);

  const callAPI = async (action, payload) => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: "Respuesta no válida", raw: text };
      }

      setResult(data);

      // Si se registró cliente, guardamos su ID (maneja diferentes formatos)
if (action === "registerOrUpdateClient") {
  const id =
    data?.id || data?.idCliente || data?.idcliente || data?.IDCliente || null;
  if (id) setClientId(id);
}


      return data;
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClient = async () => {
    await callAPI("registerOrUpdateClient", {
      nombre: "Daniel Test",
      correo: "daniel.test@example.com",
      telefono: "9999-0000",
      pais: "Honduras",
      ciudad: "Tegucigalpa",
      direccion: "Colonia El Sauce",
    });
  };

  const handleSaveOrder = async () => {
    if (!clientId) {
      alert("⚠️ Primero registrá un cliente (para obtener su ID).");
      return;
    }

    await callAPI("saveOrder", {
      cliente: clientId, // ahora usa el ID real del cliente
      clienteEmail: "daniel.test@example.com",
      clienteTelefono: "9999-0000",
      pais: "Honduras",
      metodoPago: "whatsapp",
      notasCliente: "Pedido de prueba desde test-api",
      items: [
        {
          idProducto: "FCB001",
          equipo: "FC Barcelona",
          modelo: "1° Equipación 25/26",
          talla: "M",
          color: "Blaugrana",
          cantidad: 1,
          precioUnitario: 999,
        },
      ],
    });
  };

  return (
    <main className="min-h-screen bg-black text-white px-8 py-20">
      <h1 className="text-3xl font-bold text-[#E50914] mb-6">
        🧩 Test API - 90+5 Store
      </h1>

      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={handleRegisterClient}
          disabled={loading}
          className="bg-[#E50914] hover:bg-[#ff1f27] text-white px-6 py-3 rounded-lg transition font-medium"
        >
          {loading ? "Enviando..." : "Registrar Cliente de Prueba"}
        </button>

        <button
          onClick={handleSaveOrder}
          disabled={loading}
          className={`${
            clientId
              ? "bg-white/10 hover:bg-white/20"
              : "bg-gray-700 cursor-not-allowed"
          } text-white px-6 py-3 rounded-lg border border-white/10 transition font-medium`}
        >
          {loading
            ? "Enviando..."
            : clientId
            ? "Guardar Pedido de Prueba"
            : "Esperando cliente..."}
        </button>
      </div>

      {clientId && (
        <p className="mb-6 text-sm text-gray-400">
          ✅ Cliente registrado con ID: <span className="text-white">{clientId}</span>
        </p>
      )}

      <div className="bg-white/5 border border-white/10 rounded-xl p-6 font-mono text-sm overflow-x-auto">
        {result ? (
          <pre>{JSON.stringify(result, null, 2)}</pre>
        ) : (
          <p className="text-gray-400">
            Presiona un botón para probar la conexión con el backend.
          </p>
        )}
      </div>
    </main>
  );
}
