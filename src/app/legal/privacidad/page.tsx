import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description:
    "Conoce cómo 90+5 Store recopila, usa y protege tu información personal. Política de privacidad actualizada.",
  alternates: { canonical: "https://90mas5.store/legal/privacidad" },
};

export default function PrivacidadPage() {
    return (
        <article className="prose prose-invert prose-red max-w-none">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-[#E50914]">Política de Privacidad</h1>
            <p className="text-gray-400 text-sm mb-8">Última actualización: Enero 2026</p>

            <h2>1. Información que Recopilamos</h2>
            <p>
                Para procesar tus pedidos en <strong>90+5 Store</strong>, necesitamos recopilar cierta información personal, que incluye:
            </p>
            <ul>
                <li>Nombre completo.</li>
                <li>Dirección de envío y facturación.</li>
                <li>Correo electrónico y número de teléfono (para notificaciones y coordinación de entrega).</li>
                <li>Información de pago (comprobantes de transferencia). <strong>No almacenamos datos de tarjetas de crédito</strong> directamente.</li>
            </ul>

            <h2>2. Uso de la Información</h2>
            <p>
                Utilizamos tus datos exclusivamente para:
            </p>
            <ul>
                <li>Procesar y gestionar tu pedido.</li>
                <li>Enviar actualizaciones sobre el estado de tu compra (vía Email o WhatsApp).</li>
                <li>Coordinar el envío con la empresa de logística (CAEX, Cargo Expreso, etc.).</li>
                <li>Mejorar nuestra tienda y experiencia de usuario.</li>
            </ul>

            <h2>3. Compartir Información</h2>
            <p>
                <strong>Nunca vendemos tus datos personales.</strong> Solo compartimos la información estrictamente necesaria con terceros proveedores de servicios esenciales, como:
            </p>
            <ul>
                <li>Empresas de mensajería (para entregarte el paquete).</li>
                <li>Plataformas de infraestructura tecnológica (para que la tienda funcione de manera segura).</li>
            </ul>

            <h2>4. Seguridad de los Datos</h2>
            <p>
                Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos contra acceso no autorizado, pérdida o alteración. Utilizamos conexiones seguras (SSL/TLS) en todo nuestro sitio.
            </p>

            <h2>5. Tus Derechos</h2>
            <p>
                Tienes derecho a solicitar acceso, corrección o eliminación de tus datos personales de nuestros registros. Para hacerlo, simplemente escríbenos a <a href="mailto:contacto@90mas5.store">contacto@90mas5.store</a>.
            </p>

            <h2>6. Cookies</h2>
            <p>
                Utilizamos cookies esenciales para el funcionamiento del carrito de compras y la sesión de usuario. Al usar nuestro sitio, aceptas el uso de estas cookies básicas.
            </p>
        </article>
    );
}
