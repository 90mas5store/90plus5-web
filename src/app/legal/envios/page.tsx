import { Metadata } from "next";
import { SITE_URL } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Envíos y Devoluciones",
  description:
    "Información de envíos a todo Honduras: costos, tiempos de entrega y política de devoluciones de 90+5 Store.",
  alternates: { canonical: `${SITE_URL}/legal/envios` },
};

export default function EnviosPage() {
    return (
        <article className="prose prose-invert prose-red max-w-none">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-[#E50914]">Envíos y Devoluciones</h1>
            <p className="text-gray-400 text-sm mb-8">Última actualización: Enero 2026</p>

            <h2>1. Cobertura de Envíos</h2>
            <p>
                Realizamos envíos a <strong>todo el territorio nacional de Honduras</strong> (los 18 departamentos). Trabajamos con la empresa de logística líder <strong>Cargo Expreso (CAEX, ambas denominaciones refieren a la misma empresa)</strong> para garantizar que tu pedido llegue a tiempo, con número de guía oficial y en perfectas condiciones.
            </p>

            <h2>2. Modalidad Bajo Pedido y Tiempos de Entrega</h2>
            <p>
                En <strong>90+5 Store</strong> no disponemos de tienda física ni manejamos stock para venta inmediata. Operamos de manera 100% digital y principalmente <strong>bajo pedido (por encargo)</strong>. Este modelo nos permite ofrecerte cualquier camiseta del mundo, versión jugador o aficionado, talla exacta y personalización oficial sin las limitaciones de inventario físico de las tiendas convencionales.
            </p>
            <ul>
                <li>
                    <strong>Tiempo de Importación / Llegada:</strong> Los pedidos bajo encargo tardan entre <strong>3 y 5 semanas</strong> en llegar a Honduras una vez confirmado el anticipo del 50%.
                </li>
                <li>
                    <strong>Tegucigalpa y Distrito Central:</strong> Una vez recibido el pedido en el país, la entrega es <strong>Gratis</strong> vía entregas locales coordinadas en puntos convenidos o a domicilio.
                </li>
                <li>
                    <strong>Resto del país (Nacional):</strong> Envíos a San Pedro Sula, La Ceiba, Choluteca, Comayagua y los 18 departamentos vía <strong>Cargo Expreso (CAEX)</strong> con tarifa plana de <strong>L. 140</strong>. El tiempo de tránsito nacional es de 1 a 3 días hábiles una vez despachado.
                </li>
            </ul>

            <h2>3. Rastreo de Pedido</h2>
            <p>
                Una vez que tu pedido llega a Honduras y es despachado por Cargo Expreso (CAEX), recibirás tu número de guía oficial. Puedes rastrear el estado de tu paquete en cualquier momento directamente en nuestra sección de <a href="/rastreo" className="text-[#E50914] no-underline hover:underline">Rastreo de Pedido</a> o en la plataforma de Cargo Expreso.
            </p>

            <h2>4. Política de Cambios</h2>
            <p>
                Queremos que estés feliz con tu fichaje.
            </p>
            <ul>
                <li>
                    <strong>Productos sin personalizar:</strong> Tienes 3 días calendario después de recibir el producto para solicitar un cambio de talla. La prenda debe estar nueva, sin uso, con etiquetas y en su empaque original. El cliente cubre los gastos de envío de retorno y reenvío.
                </li>
                <li>
                    <strong>Productos personalizados:</strong> Las camisetas con nombre o número personalizado (ya sea de jugador o propio) <strong>NO tienen cambio ni devolución</strong>, salvo defecto de fábrica comprobado, ya que son productos creados exclusivamente para ti.
                </li>
            </ul>

            <h2>5. Productos Defectuosos</h2>
            <p>
                Si recibes un producto con defecto de fábrica (roturas, manchas, estampado dañado), contáctanos inmediatamente (máximo 48 horas tras recibirlo) con fotos del problema. Si procede la garantía, cubriremos los costos de reposición y envío.
            </p>
        </article>
    );
}
