export default function EnviosPage() {
    return (
        <article className="prose prose-invert prose-red max-w-none">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-[#E50914]">Envíos y Devoluciones</h1>
            <p className="text-gray-400 text-sm mb-8">Última actualización: Enero 2026</p>

            <h3>1. Cobertura de Envíos</h3>
            <p>
                Realizamos envíos a <strong>todo el territorio nacional de Honduras</strong>. Trabajamos principalmente con empresas de logística confiables como Cargo Expreso y CAEX para asegurar que tu pedido llegue a tiempo y en perfectas condiciones.
            </p>

            <h3>2. Costos y Tiempos</h3>
            <ul>
                <li><strong>Tegucigalpa:</strong> Envíos locales (L. 60 - L. 80 aprox.) o entregas en puntos convenidos. Tiempo: 24h hábiles una vez listo el pedido.</li>
                <li><strong>Nacional / Departamental:</strong> El costo depende del destino y peso, generalmente entre L. 130 y L. 180. Tiempo: 1-3 días hábiles una vez despachado.</li>
                <li>El costo del envío suele ser pagado por el cliente, salvo promociones específicas.</li>
            </ul>

            <h3>3. Rastreo de Pedido</h3>
            <p>
                Una vez que tu pedido sea despachado, recibirás un número de guía. Puedes rastrear el estado de tu pedido directamente en nuestra sección de <a href="/rastreo" className="text-[#E50914] no-underline hover:underline">Rastreo</a> o en la web de la paquetería correspondiente.
            </p>

            <h3>4. Política de Cambios</h3>
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

            <h3>5. Productos Defectuosos</h3>
            <p>
                Si recibes un producto con defecto de fábrica (roturas, manchas, estampado dañado), contáctanos inmediatamente (máximo 48 horas tras recibirlo) con fotos del problema. Si procede la garantía, cubriremos los costos de reposición y envío.
            </p>
        </article>
    );
}
