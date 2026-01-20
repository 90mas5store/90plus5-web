import { Resend } from "resend";
import { BANK_ACCOUNTS } from "@/lib/config/banks";
import { getWhatsappLink } from "@/lib/whatsapp";

// const resend = new Resend(process.env.RESEND_API_KEY); // Movido dentro de la función para mayor robustez

interface OrderEmailProps {
  customerName: string;
  customerEmail: string;
  orderId: string;
  totalAmount: number;
  depositAmount: number;
  items: {
    name: string;
    team?: string;
    image?: string;
    quantity: number;
    details?: string;
  }[];
}

export const sendOrderConfirmationEmail = async ({
  customerName,
  customerEmail,
  orderId,
  totalAmount,
  depositAmount,
  items,
}: OrderEmailProps) => {
  // Inicializar cliente aquí para evitar crash si falta la ENV al cargar el módulo
  const resend = new Resend(process.env.RESEND_API_KEY);

  // 🏦 Cuentas bancarias
  const banksHtml = BANK_ACCOUNTS.map(
    (bank) => {
      // Convertir rutas relativas a URLs absolutas para emails
      const logoUrl = bank.logo?.startsWith('/')
        ? `https://90mas5.store${bank.logo}`
        : bank.logo;

      return `
    <div style="background:#111;border:1px solid #222;border-radius:14px;padding:18px;margin-bottom:12px;display:flex;align-items:center;gap:16px;">
      <div style="flex:1;">
        <strong style="color:#fff;font-size:14px;display:block;margin-bottom:4px;">
          ${bank.banco}
        </strong>
        <p style="margin:0;color:#777;font-size:11px;text-transform:uppercase;">
          ${bank.tipo}
        </p>
      </div>
      <div style="text-align:right;">
        <p style="margin:0;color:#fff;font-family:Courier,monospace;font-size:17px;font-weight:700;">
          ${bank.numero}
        </p>
        <p style="margin:2px 0 0;color:#666;font-size:10px;">
          ${bank.titular}
        </p>
      </div>
    </div>
  `;
    }
  ).join("");

  // 👕 Productos
  const itemsHtml = items
    .map(
      (item) => {
        // Fix: Normalizar URL de imagen para que sea absoluta si es relativa
        const imageUrl = item.image?.startsWith('/')
          ? `https://90mas5.store${item.image}`
          : item.image;

        return `
    <div style="display:flex;gap:16px;padding:18px 0;border-bottom:1px solid #222;">
      <div style="width:70px;height:70px;border-radius:10px;overflow:hidden;background:#000;border:1px solid #333;">
        ${imageUrl && imageUrl.startsWith('http')
            ? `<img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover;" />`
            : `<div style="width:100%;height:100%;background:#111;"></div>`
          }
      </div>
      <div style="flex:1;">
        <p style="margin:0;color:#fff;font-size:14px;font-weight:700;">
          ${item.team ? `${item.team} – ` : ""}${item.name}
        </p>
        <p style="margin:6px 0;color:#aaa;font-size:12px;">
          ${item.details || "Estándar"}
        </p>
        <p style="margin:0;color:#E50914;font-size:12px;font-weight:700;">
          Cantidad: ${item.quantity}
        </p>
      </div>
    </div>
  `;
      }
    )
    .join("");

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width" />
  <title>Confirmación de pedido</title>
</head>
<body style="margin:0;background:#000;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 12px;">

        <!-- Logo -->
        <img src="https://90mas5.store/logo.png" width="120" style="margin-bottom:40px;" />

        <!-- Card -->
        <table width="100%" style="max-width:600px;background:#0a0a0a;border-radius:24px;border:1px solid #222;">
          <tr>
            <td style="padding:40px;">

              <!-- Header -->
              <h1 style="margin:0 0 10px;font-size:30px;font-weight:900;text-align:center;font-style:italic;">
                "Here we go!" ⚽
              </h1>

              <p style="margin:0 0 30px;color:#aaa;text-align:center;font-size:15px;">
                Jugada inicial ${customerName.split(" ")[0]}, ya recibimos tu pedido.<br/>
                Ahora sos parte del equipo.<br/>
                <span style="display:inline-block;margin-top:10px;padding:6px 12px;background:#222;border-radius:8px;font-family:Courier,monospace;">
                  #${orderId.slice(0, 8).toUpperCase()}
                </span>
              </p>

              <!-- Depósito -->
              <div style="background:#120202;border:1px solid #2a0b0d;border-radius:16px;padding:26px;text-align:center;margin-bottom:30px;">
                <p style="margin:0;color:#E50914;font-size:12px;font-weight:800;text-transform:uppercase;">
                  Balón al centro (Anticipo)
                </p>
                <p style="margin:12px 0 4px;font-size:36px;font-weight:900;">
                  L ${depositAmount.toLocaleString()}
                </p>
                <p style="margin:0;color:#999;font-size:14px;">
                  Mete el gol del 50% de anticipo para que empiece el partido.
                </p>
              </div>

              <!-- CTA Rastreo -->
              <p style="margin:0 0 15px;color:#aaa;font-size:14px;text-align:center;">
                No le perdás la pista a tu fichaje.
              </p>

              <a href="https://90mas5.store/rastreo?order=${orderId}"
                 style="display:block;background:#fff;color:#000;text-decoration:none;
                        padding:18px 0;border-radius:14px;
                        text-align:center;font-weight:900;
                        text-transform:uppercase;margin-bottom:40px;">
                Seguir la jugada
              </a>

              <!-- Bancos -->
              <h3 style="margin:0 0 16px;font-size:13px;text-transform:uppercase;letter-spacing:1px;">
                Taquilla de Pago (Cuentas)
              </h3>

              ${banksHtml}

              <!-- Productos -->
              <h3 style="margin:40px 0 16px;font-size:13px;text-transform:uppercase;letter-spacing:1px;">
                Alineación (Resumen)
              </h3>

              ${itemsHtml}

              <!-- Total -->
              <table width="100%" style="margin-top:20px;border-top:1px solid #333;padding-top:16px;">
                <tr>
                  <td style="color:#777;font-size:14px;">Total del pedido</td>
                  <td align="right" style="font-size:20px;font-weight:900;">
                    L ${totalAmount.toLocaleString()}
                  </td>
                </tr>
              </table>

              <!-- WhatsApp soporte -->
              <a href="${getWhatsappLink({ message: `Qué ondas, tengo una consulta sobre mi pedido #${orderId.slice(0, 8).toUpperCase()}` })}"
                 style="display:block;margin-top:30px;text-align:center;
                        color:#25D366;text-decoration:none;font-size:13px;font-weight:700;">
                ¿Consultas al árbitro? Escribinos por WhatsApp
              </a>

            </td>
          </tr>
        </table>

        <!-- Footer -->
        <p style="margin-top:40px;color:#444;font-size:12px;text-align:center;">
          <strong>90+5 STORE</strong><br/>
          Tegucigalpa, Honduras
        </p>

      </td>
    </tr>
  </table>
</body>
</html>
`;

  try {
    const data = await resend.emails.send({
      from: "90+5 Store <contacto@90mas5.store>",
      to: [customerEmail],
      subject: `Pedido confirmado #${orderId.slice(0, 8).toUpperCase()} – 90+5 Store`,
      html: htmlContent,
    });

    return { success: true, data };
  } catch (error) {
    console.error("Error enviando correo:", error);
    return { success: false, error };
  }
};

export const sendOrderStatusUpdateEmail = async ({
  customerName,
  customerEmail,
  orderId,
  status,
}: {
  customerName: string;
  customerEmail: string;
  orderId: string;
  status: string;
}) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  let statusConfig = {
    subject: `Actualización del partido #${orderId.slice(0, 8).toUpperCase()} ⚽`,
    title: 'Cambio táctico',
    message: `El estado de tu pedido ha cambiado a: ${status}.`,
  };

  switch (status) {
    case 'deposit_paid':
      statusConfig = {
        subject: '¡Anticipo anotado! ⚽ A calentar',
        title: '¡Gol del Anticipo!',
        message: 'Ya recibimos tu pago inicial. El equipo entra en producción. ¡Se viene lo bueno!',
      };
      break;
    case 'ready_for_delivery':
      statusConfig = {
        subject: '¡Tu pedido salta a la cancha! 🚚',
        title: '¡Contragolpe Letal!',
        message: 'Tu pedido ya va en camino hacia vos. Atento a la jugada que llega pronto.',
      };
      break;
    case 'paid_full':
      statusConfig = {
        subject: '¡Victoria! Pedido entregado 🏆',
        title: '¡Partido Ganado!',
        message: 'Pedido entregado y pagado al 100%. Gracias por jugar con nosotros. ¡Hasta la próxima temporada!',
      };
      break;
    case 'Cancelled':
      statusConfig = {
        subject: 'Tarjeta Roja: Pedido Cancelado 🔴',
        title: 'Partido Suspendido',
        message: 'Tu pedido ha sido cancelado. Si crees que fue un error del árbitro (nosotros), escribinos para revisar el VAR.',
      };
      break;
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width" />
  <title>${statusConfig.subject}</title>
</head>
<body style="margin:0;background:#000;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 12px;">
        <img src="https://90mas5.store/logo.png" width="80" style="margin-bottom:40px;" />
        <table width="100%" style="max-width:500px;background:#0a0a0a;border-radius:24px;border:1px solid #222;">
          <tr>
            <td style="padding:40px;text-align:center;">
              <h1 style="margin:0 0 10px;font-size:28px;font-weight:900;">
                ${statusConfig.title}
              </h1>
              <p style="margin:0 0 20px;color:#aaa;font-size:16px;line-height:1.5;">
                Jugada inicial ${customerName.split(" ")[0]},<br/>
                ${statusConfig.message}
              </p>
              
              <a href="https://90mas5.store/rastreo?order=${orderId}"
                 style="display:block;background:#fff;color:#000;text-decoration:none;
                        padding:16px 0;border-radius:12px;
                        font-weight:900;text-transform:uppercase;margin-top:30px;">
                Ver marcador (Rastreo)
              </a>
            </td>
          </tr>
        </table>
        <p style="margin-top:30px;color:#444;font-size:12px;text-align:center;">
          <strong>90+5 STORE</strong>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  try {
    const data = await resend.emails.send({
      from: "90+5 Store <contacto@90mas5.store>",
      to: [customerEmail],
      subject: statusConfig.subject,
      html: htmlContent,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Error enviando actualización:", error);
    return { success: false, error };
  }
};

export const sendAdminNewOrderEmail = async ({
  customerName,
  customerEmail,
  orderId,
  totalAmount,
  items,
}: {
  customerName: string;
  customerEmail: string;
  orderId: string;
  totalAmount: number;
  items: any[];
}) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  // Email del admin: contacto@90mas5.store (o el que prefiera el usuario)
  const adminEmail = "contacto@90mas5.store";

  const htmlContent = `
<!DOCTYPE html>
<html>
<head><title>Nuevo Pedido</title></head>
<body style="font-family:sans-serif;color:#333;">
  <h1>¡Nuevo Fichaje! 🤑</h1>
  <p>Has recibido un nuevo pedido de <strong>${customerName}</strong>.</p>
  <p><strong>ID:</strong> ${orderId}</p>
  <p><strong>Total:</strong> L ${totalAmount.toLocaleString()}</p>
  
  <h3>Alineación (Productos):</h3>
  <ul>
    ${items.map(i => `<li>${i.quantity}x ${i.team || ''} ${i.name} (${i.details || 'Estándar'})</li>`).join('')}
  </ul>

  <p>
    <a href="https://90mas5.store/admin/orders/${orderId}">Ver pedido en Admin</a>
  </p>
</body>
</html>
  `;

  try {
    await resend.emails.send({
      from: "90+5 Store System <contacto@90mas5.store>",
      to: [adminEmail],
      subject: `Nuevo Pedido #${orderId.slice(0, 8)} - L ${totalAmount}`,
      html: htmlContent,
    });
  } catch (e) {
    console.error("Error sending admin notification", e);
  }
};
