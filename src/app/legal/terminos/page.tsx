import { Metadata } from "next";
import { SITE_URL } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description:
    "Términos y condiciones de compra en 90+5 Store Honduras. Productos, personalización, envíos y garantías.",
  alternates: { canonical: `${SITE_URL}/legal/terminos` },
};

export default function TerminosPage() {
    return (
        <article className="prose prose-invert prose-red max-w-none">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-[#E50914]">Términos y Condiciones</h1>
            <p className="text-gray-400 text-sm mb-8">Última actualización: Enero 2026</p>

            <h2>1. Introducción</h2>
            <p>
                Bienvenido a <strong>90+5 Store</strong>. Al acceder y realizar compras en nuestro sitio web, aceptas los siguientes términos y condiciones. Te recomendamos leerlos detenidamente antes de realizar cualquier pedido.
            </p>

            <h2>2. Productos y Personalización</h2>
            <p>
                Nuestras camisetas son réplicas de alta calidad (versiones Fan y Jugador). Nos esforzamos por mostrar los colores y detalles con la mayor precisión posible. Sin embargo:
            </p>
            <ul>
                <li>Los colores pueden variar ligeramente según la pantalla de tu dispositivo.</li>
                <li>La personalización (nombre y número) se realiza exactamente como la escribe el cliente. No nos hacemos responsables por errores ortográficos introducidos por el usuario.</li>
            </ul>

            <h2>3. Pedidos y Métodos de Pago</h2>
            <p>
                Ofrecemos múltiples formas de pago para tu comodidad y seguridad:
            </p>
            <ul>
                <li>
                    <strong>Transferencia Bancaria:</strong> Requerimos un anticipo del 50% para procesar pedidos bajo encargo, cancelando el 50% restante al momento de la entrega o despacho. Aceptamos transferencias directas a nuestras cuentas de BAC Credomatic y Banco Atlántida, así como transferencias ACH interbancarias desde Ficohsa, Banpaís, Banco de Occidente y otros bancos de Honduras.
                </li>
                <li>
                    <strong>PayPal y Tarjetas Internacionales (Débito / Crédito):</strong> Los pagos procesados a través de la pasarela oficial de PayPal se cobran al 100% en Dólares Estadounidenses (USD) al tipo de cambio oficial publicado en la tienda. La confirmación del pago y el procesamiento del pedido son inmediatos.
                </li>
                <li>
                    <strong>Seguridad en Pagos Electrónicos:</strong> Todas las transacciones con tarjeta son procesadas de extremo a extremo por PayPal bajo los más estrictos estándares de seguridad y encriptación PCI-DSS. 90+5 Store no almacena ni tiene acceso a los números completos de tu tarjeta de crédito o débito.
                </li>
                <li>
                    <strong>Plazo de Confirmación:</strong> Los pedidos con método de transferencia bancaria que no reciban su comprobante en un plazo de 48 horas podrán ser cancelados para no demorar la orden de importación.
                </li>
            </ul>

            <h2>4. Tiempos de Entrega</h2>
            <p>
                Operamos de manera 100% digital sin local físico ni inventario para venta inmediata. Todas las prendas se procesan principalmente bajo la modalidad de encargo. Los tiempos de entrega se componen de:
            </p>
            <ul>
                <li><strong>Bajo Pedido (Importación):</strong> 3 a 5 semanas aproximadamente desde la confirmación del anticipo del 50%.</li>
                <li><strong>Entregas en Tegucigalpa:</strong> Coordinación local gratuita una vez recibido el producto en el país.</li>
                <li><strong>Envíos Nacionales:</strong> 1 a 3 días hábiles una vez despachado por Cargo Expreso (CAEX, siendo ambas la misma empresa de logística) a cualquier departamento de Honduras.</li>
            </ul>

            <h2>5. Cambios y Devoluciones</h2>
            <p>
                Debido a la naturaleza personalizada de nuestros productos:
            </p>
            <ul>
                <li><strong>No aceptamos devoluciones</strong> en camisetas personalizadas con nombre o número, a menos que presenten un defecto de fábrica evidente.</li>
                <li>Para productos sin personalizar, se aceptan cambios de talla dentro de los primeros 3 días de recibido, siempre que la prenda esté intacta y con etiquetas. El cliente asume los costos de envío.</li>
            </ul>

            <h2>6. Propiedad Intelectual</h2>
            <p>
                Todo el contenido de este sitio (imágenes, logotipos, textos) es propiedad de 90+5 Store o de sus respectivos dueños, utilizado aquí con fines ilustrativos y comerciales legítimos.
            </p>

            <h2>7. Contacto</h2>
            <p>
                Si tienes dudas sobre estos términos, contáctanos en <a href="mailto:contacto@90mas5.store">contacto@90mas5.store</a> o vía WhatsApp.
            </p>
        </article>
    );
}
