import { Metadata } from "next";
import { SITE_URL } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description:
    "Conoce cómo 90+5 Store recopila, usa y protege tu información personal. Política de privacidad actualizada.",
  alternates: { canonical: `${SITE_URL}/legal/privacidad` },
};

export default function PrivacidadPage() {
    return (
        <article className="prose prose-invert prose-red max-w-none">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-[#E50914]">Política de Privacidad</h1>
            <p className="text-gray-400 text-sm mb-8">Última actualización: Agosto 2026</p>

            <h2>1. Información que Recopilamos</h2>
            <p>
                Para procesar tus pedidos en <strong>90+5 Store</strong>, necesitamos recopilar cierta información personal, que incluye:
            </p>
            <ul>
                <li>Nombre completo.</li>
                <li>Dirección de entrega y departamento/municipio de destino.</li>
                <li>Correo electrónico y número de teléfono (para notificaciones del estado del pedido y coordinación de entrega).</li>
                <li>Información transaccional de pagos. <strong>Importante:</strong> Los datos de tu tarjeta de crédito o débito son introducidos directamente en los formularios seguros de <strong>PayPal (PayPal Holdings, Inc.)</strong>. 90+5 Store nunca tiene acceso, procesa ni almacena números de tarjeta ni códigos de seguridad CVV.</li>
            </ul>

            <h2>2. Uso de la Información</h2>
            <p>
                Utilizamos tus datos exclusivamente para:
            </p>
            <ul>
                <li>Procesar, validar y gestionar tu pedido en la tienda.</li>
                <li>Enviar actualizaciones en tiempo real sobre el estado de tu compra (vía correo electrónico o WhatsApp).</li>
                <li>Coordinar el despacho y entrega con las empresas de logística nacional.</li>
                <li>Garantizar la prevención de fraude y la seguridad de las transacciones.</li>
                <li>Mejorar continuamente nuestra plataforma y la experiencia de compra.</li>
            </ul>

            <h2>3. Compartir Información y Pasarelas de Pago</h2>
            <p>
                <strong>Nunca vendemos ni comercializamos tus datos personales.</strong> Únicamente compartimos la información estrictamente necesaria con proveedores de servicios autorizados para completar tu compra:
            </p>
            <ul>
                <li><strong>PayPal:</strong> Como pasarela de pagos internacional certificada PCI-DSS Nivel 1 para el cobro seguro y encriptado con tarjetas de crédito, débito o saldo PayPal.</li>
                <li><strong>Empresas de Mensajería y Logística:</strong> Para hacer llegar tus paquetes a la dirección indicada en todo el territorio hondureño.</li>
                <li><strong>Infraestructura en la Nube (Supabase / Vercel / Resend):</strong> Para el almacenamiento seguro de pedidos y el envío de recibos digitales por correo.</li>
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
                Utilizamos diferentes tipos de cookies para mejorar tu experiencia en nuestra tienda:
            </p>
            <ul>
                <li><strong>Cookies de sesión (Supabase Auth):</strong> Estrictamente necesarias y funcionales para mantener tu sesión activa y gestionar el carrito de compras de forma segura.</li>
                <li><strong>Google Analytics:</strong> Herramienta de análisis que nos permite medir el tráfico y entender cómo interactúas con nuestra tienda, para mejorar continuamente. (Opcional)</li>
                <li><strong>Facebook Pixel:</strong> Utilizado para campañas de marketing y mostrarte anuncios relevantes sobre nuestros productos. (Opcional)</li>
                <li><strong>Sentry:</strong> Utilizado para el monitoreo de errores y rendimiento, permitiéndonos identificar y corregir fallos técnicos rápidamente.</li>
                <li><strong>Almacenamiento Local (localStorage):</strong> Utilizado para guardar tus preferencias de cookies y el estado local de tu carrito de compras.</li>
            </ul>

            <h2>7. Gestión de Preferencias de Cookies</h2>
            <p>
                Puedes gestionar tus preferencias y decidir qué cookies no esenciales permites directamente desde nuestro banner de cookies. Tienes la opción de "Aceptar todas" para la mejor experiencia posible o "Solo necesarias" para bloquear los scripts de marketing y análisis.
            </p>
        </article>
    );
}
