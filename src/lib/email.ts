import { Resend } from "resend";
import { BANK_ACCOUNTS } from "@/lib/config/banks";

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
        (bank) => `
    <div style="background:#111;border:1px solid #222;border-radius:14px;padding:18px;margin-bottom:12px;display:flex;justify-content:space-between;gap:10px;">
      <div>
        <strong style="color:#fff;font-size:14px;">
          ${bank.banco}
        </strong>
        <p style="margin:4px 0 0;color:#777;font-size:11px;text-transform:uppercase;">
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
  `
    ).join("");

    // 👕 Productos
    const itemsHtml = items
        .map(
            (item) => `
    <div style="display:flex;gap:16px;padding:18px 0;border-bottom:1px solid #222;">
      <div style="width:70px;height:70px;border-radius:10px;overflow:hidden;background:#000;border:1px solid #333;">
        ${item.image
                    ? `<img src="${item.image}" style="width:100%;height:100%;object-fit:cover;" />`
                    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#333;font-size:9px;">SIN FOTO</div>`
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
  `
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
        <img src="https://90mas5.store/logo.svg" width="120" style="margin-bottom:40px;" />

        <!-- Card -->
        <table width="100%" style="max-width:600px;background:#0a0a0a;border-radius:24px;border:1px solid #222;">
          <tr>
            <td style="padding:40px;">

              <!-- Header -->
              <h1 style="margin:0 0 10px;font-size:30px;font-weight:900;text-align:center;">
                Pedido confirmado ⚽
              </h1>

              <p style="margin:0 0 30px;color:#aaa;text-align:center;font-size:15px;">
                Hola ${customerName.split(" ")[0]}, tu pedido fue recibido correctamente.<br/>
                <span style="display:inline-block;margin-top:10px;padding:6px 12px;background:#222;border-radius:8px;font-family:Courier,monospace;">
                  #${orderId.slice(0, 8).toUpperCase()}
                </span>
              </p>

              <!-- Depósito -->
              <div style="background:#120202;border:1px solid #2a0b0d;border-radius:16px;padding:26px;text-align:center;margin-bottom:30px;">
                <p style="margin:0;color:#E50914;font-size:12px;font-weight:800;text-transform:uppercase;">
                  Anticipo requerido
                </p>
                <p style="margin:12px 0 4px;font-size:36px;font-weight:900;">
                  L ${depositAmount.toLocaleString()}
                </p>
                <p style="margin:0;color:#999;font-size:14px;">
                  Pago inicial del 50% para procesar tu pedido.
                </p>
              </div>

              <!-- CTA Rastreo -->
              <p style="margin:0 0 15px;color:#aaa;font-size:14px;text-align:center;">
                Desde el rastreo podrás ver el estado del pedido y futuras actualizaciones.
              </p>

              <a href="https://90mas5.store/rastreo?order=${orderId}"
                 style="display:block;background:#fff;color:#000;text-decoration:none;
                        padding:18px 0;border-radius:14px;
                        text-align:center;font-weight:900;
                        text-transform:uppercase;margin-bottom:40px;">
                Rastrear mi pedido
              </a>

              <!-- Bancos -->
              <h3 style="margin:0 0 16px;font-size:13px;text-transform:uppercase;letter-spacing:1px;">
                Cuentas bancarias
              </h3>

              ${banksHtml}

              <!-- Productos -->
              <h3 style="margin:40px 0 16px;font-size:13px;text-transform:uppercase;letter-spacing:1px;">
                Resumen del pedido
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
              <a href="https://wa.me/50496649622?text=Hola,%20tengo%20una%20consulta%20sobre%20mi%20pedido%20#${orderId.slice(
        0,
        8
    ).toUpperCase()}"
                 style="display:block;margin-top:30px;text-align:center;
                        color:#25D366;text-decoration:none;font-size:13px;font-weight:700;">
                ¿Necesitas ayuda? Escríbenos por WhatsApp
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
            from: "90+5 Store <hola@90mas5.store>",
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
