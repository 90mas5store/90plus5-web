"use client";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";


import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Button from "../../components/ui/Button";
import { useCart } from "../../context/CartContext";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();

  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    direccion: "",
    departamento: "",
    municipio: "",
  });

  const [metodoPago, setMetodoPago] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errores, setErrores] = useState({});
  const anticipo = total * 0.5;
  const API_URL = "/api/proxy";


  // === LISTADO DE DEPARTAMENTOS Y MUNICIPIOS (completo) ===
  const departamentos = {
    "Atlántida": ["La Ceiba", "Tela", "Jutiapa", "La Masica", "San Francisco", "Arizona", "El Porvenir", "Esparta"],
    "Colón": ["Trujillo", "Tocoa", "Sonaguera", "Balfate", "Santa Fe", "Santa Rosa de Aguán", "Limón", "Iriona", "Bonito Oriental", "Juan Francisco Bulnes"],
    "Comayagua": ["Comayagua", "Siguatepeque", "La Libertad", "El Rosario", "Esquías", "Humuya", "Lamaní", "La Trinidad", "Lejamaní", "Meámbar", "Minas de Oro", "Ojos de Agua", "San Jerónimo", "San José de Comayagua", "San José del Potrero", "San Luis", "Santa Rosa de Copán", "Taulabé", "Villa de San Antonio", "Las Lajas", "Río Bonito"],
    "Copán": ["Santa Rosa de Copán", "Cabañas", "Concepción", "Copán Ruinas", "Corquín", "Cucuyagua", "Dolores", "Dulce Nombre", "El Paraíso", "Florida", "La Jigua", "La Unión", "Nueva Arcadia", "San Agustín", "San Antonio", "San Jerónimo", "San José", "San Juan de Opoa", "San Nicolás", "San Pedro", "Santa Rita", "Trinidad de Copán", "Veracruz"],
    "Cortés": ["San Pedro Sula", "Puerto Cortés", "Choloma", "Villanueva", "La Lima", "Omoa", "Pimienta", "Potrerillos", "San Antonio de Cortés", "San Francisco de Yojoa", "San Manuel", "Santa Cruz de Yojoa"],
    "Choluteca": ["Choluteca", "San Marcos de Colón", "El Triunfo", "Pespire", "La Esperanza", "Morolica", "Namasigüe", "Orocuina", "Panteón", "Quebrada de Arena", "San Antonio de Flores", "San Isidro", "San José", "San Marcos de Colón", "Santa Ana de Yusguare", "Santa Cruz", "Yuscarán"],
    "El Paraíso": ["Danlí", "Yuscarán", "Alauca", "El Paraíso", "Güinope", "Jacaleapa", "Liure", "Morocelí", "Oropolí", "Potrerillos", "San Antonio de Flores", "San Matías", "Soledad", "Teupasenti", "Texiguat", "Vado Ancho", "Trojes", "San Lucas"],
    "Francisco Morazán": ["Tegucigalpa", "Valle de Ángeles", "Santa Lucía", "San Juan de Flores", "Cedros", "Talanga", "Orica", "Marale", "San Ignacio", "Nueva Armenia", "Mata de Plátano", "Curarén", "Reitoca", "Sabanagrande", "El Porvenir", "Lepaterique", "Tatumbla", "Ojojona", "Villa de San Francisco", "Maraita", "San Antonio de Oriente", "Guaimaca", "Cantarranas", "Distrito Central"],
    "Gracias a Dios": ["Puerto Lempira", "Brus Laguna", "Ahuas", "Juan Francisco Bulnes", "Ramón Villeda Morales", "Wampusirpe"],
    "Intibucá": ["La Esperanza", "Intibucá", "Jesús de Otoro", "Magdalena", "San Antonio", "San Isidro", "San Juan", "San Marcos de la Sierra", "San Miguelito", "Santa Lucía", "Yamaranguila"],
    "Islas de la Bahía": ["Roatán", "Guanaja", "José Santos Guardiola", "Utila"],
    "La Paz": ["La Paz", "Aguanqueterique", "Cabañas", "Cane", "Chinacla", "Guajiquiro", "Lauterique", "Marcala", "Mercedes de Oriente", "Opatoro", "San Antonio del Norte", "San José", "San Juan", "San Pedro de Tutule", "Santa Ana", "Santa Elena", "Santa María", "Santiago de Puringla", "Yarula"],
    "Lempira": ["Gracias", "Belén", "Candelaria", "Cololaca", "Erandique", "Gualcince", "Guarita", "La Campa", "La Iguala", "Las Flores", "La Unión", "La Virtud", "Lepaera", "Mapulaca", "Piraera", "San Andrés", "San Francisco", "San Juan Guarita", "San Manuel Colohete", "San Rafael", "San Sebastián", "Santa Cruz", "Talgua", "Tambla", "Tomalá", "Valladolid", "Virginia"],
    "Ocotepeque": ["Ocotepeque", "Belén Gualcho", "Concepción", "Dolores Merendón", "Fraternidad", "La Encarnación", "La Labor", "Lucerna", "Mercedes", "San Fernando", "San Francisco del Valle", "San Jorge", "San Marcos", "Santa Fe", "Sensenti", "Sinuapa"],
    "Olancho": ["Juticalpa", "Catacamas", "Campamento", "Concordia", "Dulce Nombre de Culmí", "El Rosario", "Esquipulas del Norte", "Gualaco", "Guarizama", "Guata", "Guayape", "Jano", "La Unión", "Mangulile", "Manto", "Salamá", "San Esteban", "San Francisco de Becerra", "San Francisco de la Paz", "Santa María del Real", "Silca", "Yocón", "Patuca"],
    "Santa Bárbara": ["Santa Bárbara", "Arada", "Atima", "Azacualpa", "Ceguaca", "Concepción del Norte", "Concepción del Sur", "Chinda", "El Níspero", "Gualala", "Ilama", "Las Vegas", "Macuelizo", "Naranjito", "Nueva Frontera", "Nuevo Celilac", "Petoa", "Protección", "Quimistán", "San Francisco de Ojuera", "San José de Colinas", "San Luis", "San Marcos", "San Nicolás", "San Pedro Zacapa", "Santa Rita", "San Vicente Centenario", "Trinidad", "Las Vegas", "Teupasenti"],
    "Valle": ["Nacaome", "Alianza", "Amapala", "Aramecina", "Caridad", "Goascorán", "Langue", "San Francisco de Coray", "San Lorenzo"],
    "Yoro": ["El Progreso", "Olanchito", "Yoro", "Arenal", "El Negrito", "Jocón", "Morazán", "Olanchito", "Santa Rita", "Sulaco", "Victoria", "Yorito"]
  };

  // === Mapa geográfico básico (coordenadas promedio) ===
  const zonas = [
    { nombre: "Tegucigalpa", lat: 14.0723, lon: -87.1921, departamento: "Francisco Morazán" },
    { nombre: "San Pedro Sula", lat: 15.5, lon: -88.0333, departamento: "Cortés" },
    { nombre: "La Ceiba", lat: 15.7631, lon: -86.7967, departamento: "Atlántida" },
    { nombre: "Comayagua", lat: 14.4514, lon: -87.637, departamento: "Comayagua" },
    { nombre: "Choluteca", lat: 13.3, lon: -87.2, departamento: "Choluteca" },
    { nombre: "Danlí", lat: 14.0333, lon: -86.5833, departamento: "El Paraíso" },
    { nombre: "Juticalpa", lat: 14.6667, lon: -86.2167, departamento: "Olancho" },
    { nombre: "El Progreso", lat: 15.4, lon: -87.8, departamento: "Yoro" },
    { nombre: "Santa Rosa de Copán", lat: 14.7667, lon: -88.7833, departamento: "Copán" },
    { nombre: "Yoro", lat: 15.1333, lon: -87.1333, departamento: "Yoro" },
    { nombre: "Trujillo", lat: 15.9167, lon: -85.95, departamento: "Colón" },
    { nombre: "La Esperanza", lat: 14.3, lon: -88.1833, departamento: "Intibucá" },
    { nombre: "Roatán", lat: 16.3, lon: -86.55, departamento: "Islas de la Bahía" },
    { nombre: "Gracias", lat: 14.5833, lon: -88.5833, departamento: "Lempira" },
    { nombre: "Ocotepeque", lat: 14.4333, lon: -89.1833, departamento: "Ocotepeque" },
    { nombre: "Nacaome", lat: 13.5333, lon: -87.4833, departamento: "Valle" },
    { nombre: "La Paz", lat: 14.3167, lon: -87.6833, departamento: "La Paz" },
    { nombre: "Puerto Lempira", lat: 15.2667, lon: -83.7667, departamento: "Gracias a Dios" },
    { nombre: "Santa Bárbara", lat: 14.9167, lon: -88.2333, departamento: "Santa Bárbara" },
    { nombre: "Yuscarán", lat: 13.95, lon: -86.85, departamento: "El Paraíso" },
    { nombre: "Siguatepeque", lat: 14.6, lon: -87.8333, departamento: "Comayagua" },
    { nombre: "Tela", lat: 15.7833, lon: -87.45, departamento: "Atlántida" },
    { nombre: "Puerto Cortés", lat: 15.8833, lon: -87.95, departamento: "Cortés" },
    { nombre: "Choloma", lat: 15.6144, lon: -87.953, departamento: "Cortés" },
    { nombre: "Villanueva", lat: 15.3167, lon: -88, departamento: "Cortés" },
    { nombre: "La Lima", lat: 15.4333, lon: -87.9167, departamento: "Cortés" },
    { nombre: "Catacamas", lat: 14.8486, lon: -85.8942, departamento: "Olancho" },
    { nombre: "Olanchito", lat: 15.4833, lon: -86.5667, departamento: "Yoro" },
    { nombre: "San Lorenzo", lat: 13.4167, lon: -87.45, departamento: "Valle" },
    { nombre: "Amapala", lat: 13.2833, lon: -87.65, departamento: "Valle" },
    { nombre: "Santa Rosa de Aguán", lat: 15.95, lon: -85.7167, departamento: "Colón" },
    { nombre: "Tocoa", lat: 15.6833, lon: -86, departamento: "Colón" },
    { nombre: "Sonaguera", lat: 15.6333, lon: -86.2667, departamento: "Colón" },
    { nombre: "Copán Ruinas", lat: 14.8333, lon: -89.15, departamento: "Copán" },
    { nombre: "Santa Rita", lat: 15.1667, lon: -87.2833, departamento: "Yoro" },
    { nombre: "Valle de Ángeles", lat: 14.15, lon: -87.0333, departamento: "Francisco Morazán" },
    { nombre: "Santa Lucía", lat: 14.1, lon: -87.1167, departamento: "Francisco Morazán" },
    { nombre: "San Juan de Flores", lat: 14.2667, lon: -87.0333, departamento: "Francisco Morazán" },
    { nombre: "Ojojona", lat: 13.9333, lon: -87.2833, departamento: "Francisco Morazán" },
    { nombre: "San Marcos de Colón", lat: 13.4333, lon: -86.8, departamento: "Choluteca" },
    { nombre: "El Triunfo", lat: 13.1167, lon: -87, departamento: "Choluteca" },
    { nombre: "Namasigüe", lat: 13.2, lon: -87.1333, departamento: "Choluteca" },
    { nombre: "Trojes", lat: 14.0667, lon: -86, departamento: "El Paraíso" },
    { nombre: "Guaimaca", lat: 14.5333, lon: -86.8167, departamento: "Francisco Morazán" },
    { nombre: "Talanga", lat: 14.4, lon: -87.0833, departamento: "Francisco Morazán" },
    { nombre: "Cedros", lat: 14.6, lon: -87.1167, departamento: "Francisco Morazán" },
    { nombre: "El Paraíso", lat: 13.8667, lon: -86.55, departamento: "El Paraíso" },
    { nombre: "Yoro", lat: 15.1333, lon: -87.1333, departamento: "Yoro" },
    { nombre: "Morazán", lat: 15.3167, lon: -87.6, departamento: "Yoro" }
  ];

  // === GEOLOCALIZACIÓN AUTOMÁTICA (auto-fill departamento/municipio) ===
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          let masCercano = null;
          let menorDist = Infinity;
          for (const zona of zonas) {
            const d = Math.sqrt(
              Math.pow(latitude - zona.lat, 2) + Math.pow(longitude - zona.lon, 2)
            );
            if (d < menorDist) {
              menorDist = d;
              masCercano = zona;
            }
          }
          if (masCercano) {
            setFormData((prev) => ({
              ...prev,
              departamento: masCercano.departamento,
              municipio: masCercano.nombre,
            }));
          }
        },
        (err) => console.log("Ubicación no permitida:", err),
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  // === FORMATEO DEL TELÉFONO ===
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "telefono") {
      const digits = value.replace(/\D/g, "").slice(0, 8);
      const formatted =
        digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
      setFormData({ ...formData, telefono: formatted });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  // === VALIDACIÓN ===
  const validate = () => {
    const newErrors = {};
    const telRegex = /^[0-9]{4}-[0-9]{4}$/;
    if (!formData.nombre.trim()) newErrors.nombre = true;
    if (!formData.correo.includes("@")) newErrors.correo = true;
    if (!telRegex.test(formData.telefono)) newErrors.telefono = true;
    if (!formData.direccion.trim()) newErrors.direccion = true;
    if (!formData.departamento) newErrors.departamento = true;
    if (!formData.municipio) newErrors.municipio = true;
    if (!metodoPago) newErrors.metodoPago = true;
    setErrores(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // === ENVÍO COMPLETO: REGISTRO CLIENTE + PEDIDO ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      alert("Por favor completa todos los campos correctamente.");
      return;
    }
    setIsSubmitting(true);

    try {
      // 1️⃣ Registrar cliente
      const clientPayload = {
        nombre: formData.nombre,
        correo: formData.correo,
        telefono: "+504" + formData.telefono.replace("-", ""),
        pais: "Honduras",
        ciudad: formData.municipio,
        direccion: formData.direccion,
      };

      const clientRes = await fetch(API_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "registerOrUpdateClient",
    payload: clientPayload,
  }),
});

      const clientData = await clientRes.json();
if (!clientData.success) throw new Error("No se pudo registrar cliente.");
const idCliente = clientData.idCliente || clientData.id || "CLI-TEMP";

      // 2️⃣ Guardar pedido
      const orderPayload = {
        cliente: idCliente,
        clienteEmail: formData.correo,
        clienteTelefono: "+504" + formData.telefono.replace("-", ""),
        pais: "Honduras",
        departamento: formData.departamento,
        municipio: formData.municipio,
        direccion: formData.direccion,
        metodoPago,
        notasCliente: "",
        items: items.map((item) => ({
          idProducto: item.id,
          equipo: item.equipo,
          modelo: item.modelo,
          liga: item.liga,
          tipo: item.tipo || "",
          version: item.version || "",
          talla: item.talla || "",
          color: item.color || "",
          cantidad: item.cantidad,
          precioUnitario: item.precio,
          dorsalNumero: item.dorsalNumero || "",
          dorsalNombre: item.dorsalNombre || "",
          parches: item.parche ? [item.parche] : [],
        })),
      };

      const orderRes = await fetch(API_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "saveOrder",
    payload: orderPayload,
  }),
});

      const orderData = await orderRes.json();

      if (orderData.success) {
        clearCart();
        if (metodoPago === "whatsapp") {
          window.open(orderData.whatsappLink, "_blank");
        } else if (metodoPago === "transferencia") {
          router.push("/checkout/transferencia");
        } else {
          alert("✅ Pedido registrado correctamente.");
        }
      } else {
        alert("❌ Error al guardar pedido: " + (orderData.error || "Desconocido"));
      }
    } catch (error) {
      console.error(error);
      alert("Error al procesar el pedido. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // === TILOPAY ===
  useEffect(() => {
    if (metodoPago === "tarjeta") {
      const container = document.getElementById("tilopay-container");
      if (container) container.innerHTML = "";
      const link = document.createElement("a");
      link.id = "tlpmbd-btn-pay";
      link.href = "https://tp.cr/s/MjQ1NzEy";
      link.target = "_blank";
      link.innerText = "Pagar con Tilopay";
      link.setAttribute("amount", anticipo.toFixed(2));
      link.setAttribute("currency", "HNL");
      container?.appendChild(link);

      const script = document.createElement("script");
      script.src =
        "https://storage.googleapis.com/tilo-uploads/assets/js/embed.js";
      script.async = true;
      script.onload = () => {
        if (typeof window.tlpmbdInit === "function") window.tlpmbdInit();
      };
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
        if (container) container.innerHTML = "";
      };
    }
  }, [metodoPago, anticipo]);

  // === UI ===
  if (items.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
        <p className="text-gray-400 mb-6">Tu carrito está vacío 🛒</p>
        <Button onClick={() => router.push("/catalogo")}>Ir al catálogo</Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10"
      >
        {/* 🧾 DETALLES DEL CLIENTE */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-[#E50914]">
            Detalles de facturación
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nombre */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Nombre completo *
              </label>
              <input
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className={`w-full p-3 rounded-lg bg-black/30 border ${
                  errores.nombre ? "border-red-500/70" : "border-white/10"
                } focus:ring-2 focus:ring-[#E50914]/50 outline-none text-white`}
              />
            </div>

            {/* Correo */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Correo electrónico *
              </label>
              <input
                type="email"
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                className={`w-full p-3 rounded-lg bg-black/30 border ${
                  errores.correo ? "border-red-500/70" : "border-white/10"
                } focus:ring-2 focus:ring-[#E50914]/50 outline-none text-white`}
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Teléfono *
              </label>
              <div className="flex items-center gap-2">
                <span className="text-white/70 bg-black/30 border border-white/10 px-3 py-2 rounded-lg">
                  +504
                </span>
                <input
                  type="text"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="####-####"
                  className={`flex-1 p-3 rounded-lg bg-black/30 border ${
                    errores.telefono ? "border-red-500/70" : "border-white/10"
                  } focus:ring-2 focus:ring-[#E50914]/50 outline-none text-white`}
                />
              </div>
            </div>

            {/* Departamento y municipio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Departamento *
                </label>
                <select
                  name="departamento"
                  value={formData.departamento}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      departamento: e.target.value,
                      municipio: "",
                    })
                  }
                  className={`w-full p-3 rounded-lg bg-black/30 border ${
                    errores.departamento
                      ? "border-red-500/70"
                      : "border-white/10"
                  } text-white focus:ring-2 focus:ring-[#E50914]/50 outline-none`}
                >
                  <option value="">Selecciona un departamento</option>
                  {Object.keys(departamentos).map((dep) => (
                    <option key={dep} value={dep}>
                      {dep}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Municipio *
                </label>
                <select
                  name="municipio"
                  value={formData.municipio}
                  onChange={handleChange}
                  disabled={!formData.departamento}
                  className={`w-full p-3 rounded-lg bg-black/30 border ${
                    errores.municipio ? "border-red-500/70" : "border-white/10"
                  } text-white focus:ring-2 focus:ring-[#E50914]/50 outline-none disabled:opacity-50`}
                >
                  <option value="">Selecciona un municipio</option>
                  {formData.departamento &&
                    departamentos[formData.departamento]?.map((mun) => (
                      <option key={mun} value={mun}>
                        {mun}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Dirección de entrega *
              </label>
              <textarea
                name="direccion"
                rows="3"
                value={formData.direccion}
                onChange={handleChange}
                className={`w-full p-3 rounded-lg bg-black/30 border ${
                  errores.direccion ? "border-red-500/70" : "border-white/10"
                } focus:ring-2 focus:ring-[#E50914]/50 outline-none text-white`}
              />
            </div>
          </form>
        </div>

        {/* 🛒 RESUMEN DEL PEDIDO */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-2xl shadow-lg h-fit">
          <h2 className="text-2xl font-bold mb-6 text-[#E50914]">Tu pedido</h2>
          <div className="space-y-4 mb-6">
 {items.map((item) => (
  <div
    key={`${item.id}-${item.talla}-${item.version || "base"}`}
    className="flex items-center justify-between border-b border-white/10 pb-3"
  >
    <div className="flex items-center gap-3">
      <div className="relative w-14 h-14 rounded-md overflow-hidden bg-white/10">
        <Image
          src={item.imagen}
          alt={item.equipo}
          fill
          className="object-cover"
        />
      </div>

      <div className="flex flex-col leading-tight">
        {/* 🏟️ Equipo */}
        <p className="text-sm font-medium text-white">
          {item.equipo}
        </p>

        {/* 🧢 Modelo + Versión */}
        <p className="text-xs text-gray-400">
          {item.modelo}
          {item.version ? ` · ${item.version}` : ""}
        </p>

        {/* 📏 Talla */}
        {item.talla && (
          <p className="text-xs text-gray-500 italic">
            Talla: {item.talla}
          </p>
        )}

        {/* 🩶 Parche */}
        {item.parche && (
          <p className="text-xs text-gray-500 italic">
            Parche: {item.parche}
          </p>
        )}

        {/* 🎽 Dorsal */}
        {(item.dorsalNumero || item.dorsalNombre) && (
          <p className="text-xs text-gray-500 italic">
            Dorsal:{" "}
            {item.dorsalNumero && `${item.dorsalNumero} `}
            {item.dorsalNombre && `- ${item.dorsalNombre}`}
          </p>
        )}
      </div>
    </div>

    {/* 💰 Precio total del ítem */}
    <span className="text-sm font-semibold text-white whitespace-nowrap">
      L{(item.precio * item.cantidad).toFixed(2)}
    </span>
  </div>
))}


          </div>

          <div className="border-t border-white/10 pt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-white/70">Subtotal</span>
              <span className="font-medium text-white">
                L{total.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Anticipo (50%)</span>
              <span className="font-semibold text-[#E50914]">
                L{anticipo.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Métodos de pago */}
          <div className="mt-6 space-y-3">
            <p className="text-sm text-gray-400 mb-2">
              Selecciona tu método de pago *
            </p>
            {["transferencia", "tarjeta", "whatsapp"].map((opt) => (
              <label
                key={opt}
                className={`flex items-center justify-between p-3 rounded-lg border transition cursor-pointer ${
                  metodoPago === opt
                    ? "border-[#E50914] bg-[#E50914]/20"
                    : "border-white/10 hover:border-[#E50914]/40"
                }`}
              >
                <span>
                  {opt === "tarjeta"
                    ? "Tarjeta (Tilopay)"
                    : opt === "whatsapp"
                    ? "Confirmar por WhatsApp"
                    : "Transferencia bancaria"}
                </span>
                <input
                  type="radio"
                  name="metodoPago"
                  value={opt}
                  checked={metodoPago === opt}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="accent-[#E50914]"
                />
              </label>
            ))}
          </div>

          {/* Tilopay */}
          {metodoPago === "tarjeta" && (
            <div className="mt-6 p-4 rounded-2xl border border-white/10 bg-white/5 text-center">
              <p className="text-gray-300 mb-3">
                Completa tu pago con tarjeta a través de Tilopay:
              </p>
              <div id="tilopay-container" className="flex justify-center"></div>
            </div>
          )}

          {/* Botón Confirmar */}
          {metodoPago !== "tarjeta" && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full mt-6 py-3"
            >
              {isSubmitting ? "Procesando..." : "Confirmar compra"}
            </Button>
          )}
        </div>
      </motion.div>
    </main>
  );
}