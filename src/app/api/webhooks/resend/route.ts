import { Resend } from 'resend';
import { headers } from 'next/headers';
import { Webhook } from 'svix';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        throw new Error('Please add RESEND_WEBHOOK_SECRET from Resend Dashboard to .env');
    }

    // Get the headers
    const headerPayload = headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error occured -- no svix headers', {
            status: 400
        });
    }

    // Get the raw body for verification
    const body = await req.text();

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: any;

    try {
        // Verify the payload with the headers
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        });
    } catch (err) {
        console.error('Error verifying webhook:', err);
        return new Response(`Error occured: ${err.message}`, {
            status: 400
        });
    }

    // Handle the event
    try {
        // The payload structure depends on the event type.
        // For Inbound Webhooks, 'evt' is directly the email object.
        // For Event Webhooks, the data is inside 'evt.data'.
        const emailData = evt.data || evt;

        // Validate payload
        if (!emailData.from || !emailData.subject) {
            return Response.json({ error: 'Invalid payload' }, { status: 400 });
        }

        await resend.emails.send({
            from: '90+5 Store <contacto@90mas5.store>',
            to: '90mas5.store@gmail.com',
            subject: `📦 Nuevo correo recibido: ${emailData.subject}`,
            html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #000;">Nuevo Mensaje Recibido</h2>
            <p><strong>De:</strong> ${emailData.from}</p>
            <p><strong>Para:</strong> ${emailData.to}</p>
            <p><strong>Asunto:</strong> ${emailData.subject}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <div style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
            ${emailData.html || '<pre>' + emailData.text + '</pre>'}
            </div>
        </div>
        `,
        });

        return Response.json({ ok: true });
    } catch (error) {
        console.error('Error forwarding email:', error);
        return Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
