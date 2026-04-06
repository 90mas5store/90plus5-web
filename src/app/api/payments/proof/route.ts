import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
    // Rate limit: 5 uploads por IP cada 10 minutos
    const ip = getClientIp(request);
    const { allowed, retryAfterMs } = await checkRateLimit(`proof-upload:${ip}`, 5, 10 * 60_000);
    if (!allowed) {
        return NextResponse.json(
            { error: 'Demasiados intentos. Espera unos minutos.' },
            { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
        );
    }

    let formData: FormData;
    try {
        formData = await request.formData();
    } catch {
        return NextResponse.json({ error: 'Formato de solicitud inválido' }, { status: 400 });
    }

    const orderId = (formData.get('orderId') as string | null)?.trim();
    const file = formData.get('file') as File | null;

    if (!orderId || !file) {
        return NextResponse.json({ error: 'Faltan datos requeridos (orderId, file)' }, { status: 400 });
    }

    // Validar UUID básico
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
        return NextResponse.json({ error: 'ID de pedido inválido' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: 'Formato no permitido. Usa JPG, PNG o WEBP.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'La imagen no debe superar 10 MB' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verificar que el pedido existe y tiene un payment pending
    const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('id, status, proof_url')
        .eq('order_id', orderId)
        .maybeSingle();

    if (paymentError || !payment) {
        return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    if (payment.status === 'verified') {
        return NextResponse.json({ error: 'Este pago ya fue verificado' }, { status: 409 });
    }

    // Subir a Supabase Storage
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const filePath = `payment-proofs/${orderId}/${Date.now()}.${ext}`;
    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, fileBuffer, {
            contentType: file.type,
            upsert: true,
        });

    if (uploadError) {
        console.error('❌ Storage upload error:', uploadError);
        return NextResponse.json({ error: 'Error al subir la imagen. Intenta de nuevo.' }, { status: 500 });
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

    const proofUrl = urlData.publicUrl;

    // Guardar en DB
    const { error: updateError } = await supabase
        .from('payments')
        .update({ proof_url: proofUrl })
        .eq('id', payment.id);

    if (updateError) {
        console.error('❌ DB update error:', updateError);
        return NextResponse.json({ error: 'Error al guardar el comprobante' }, { status: 500 });
    }

    return NextResponse.json({ success: true, proof_url: proofUrl });
}
