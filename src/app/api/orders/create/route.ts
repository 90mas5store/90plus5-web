import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrderConfirmationEmail, sendAdminNewOrderEmail } from '@/lib/email';
import { BUSINESS_LOGIC } from '@/lib/constants';

// 📝 Payload esperado del frontend
interface CreateOrderPayload {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    shipping_department: string;
    shipping_municipality: string;
    shipping_address: string;
    payment_method: string;
    items: Array<{
        product_id: string;
        variant_id?: string | null;
        size_id?: string | null;
        patch_id?: string | null;
        quantity: number;
        unit_price: number; // Ignored for calculation, used for ref only if needed
        personalization_type: 'none' | 'player' | 'custom';
        player_id?: string | null;
        custom_number?: number | null;
        custom_name?: string | null;
    }>;
    _honey?: string; // Honeypot
}

export async function POST(request: NextRequest) {
    try {
        console.log("🚀 Starting Order Creation...");

        // 0️⃣ DEBUG CHECK
        if (!BUSINESS_LOGIC || !BUSINESS_LOGIC.ORDER) {
            console.error("❌ CRITICAL: BUSINESS_LOGIC is undefined");
            throw new Error("Configuration Error: BUSINESS_LOGIC not loaded");
        }

        // 🔐 Crear cliente de Supabase con Service Role (Admin)
        const supabase = createAdminClient();
        if (!supabase) throw new Error("Failed to initialize Supabase Admin Client");

        const payload: CreateOrderPayload = await request.json();
        console.log("📦 Payload received:", { ...payload, items: payload.items?.length });

        // 🐝 HONEYPOT CHECK
        if (payload._honey) {
            console.warn('🤖 Bot detected via honeypot');
            return NextResponse.json({ success: true, fake: true }, { status: 200 });
        }

        // 1️⃣ VALIDACIÓN BÁSICA
        if (!payload.customer_name || !payload.customer_email || !payload.items?.length) {
            return NextResponse.json(
                { success: false, error: 'Datos incompletos', details: 'Faltan campos requeridos' },
                { status: 400 }
            );
        }

        // 🛡️ SECURITY: FETCH REAL PRICES
        // Extraer IDs únicos para batch fetching
        const productIds = [...new Set(payload.items.map(i => i.product_id))];
        const variantIds = [...new Set(payload.items.map(i => i.variant_id).filter(Boolean))] as string[];

        // Fetch basic product info (just to verify existence and get team logic if needed in future)
        const { data: dbProducts, error: prodError } = await supabase
            .from('products')
            .select('id') // Only ID, no price
            .in('id', productIds);

        if (prodError || !dbProducts) {
            throw new Error('Error validando productos: ' + (prodError?.message || 'No data'));
        }

        // Fetch variants prices (CRITICAL: Price comes from here)
        // We MUST fetch variants for ALL items, because price is in variants table.
        // If an item has no variant_id payload, we have a problem unless we default to a main variant.
        // Current logic assumes frontend sends variant_id.
        let dbVariants: any[] = [];
        const allVariantIdsToCheck = [...variantIds];

        // If there are items without variant_id, we can't price them with current schema.
        // Assuming every purchasable item corresponds to a variant.
        const itemsMissingVariant = payload.items.filter(i => !i.variant_id);
        if (itemsMissingVariant.length > 0) {
            throw new Error("Error de validación: Se detectaron productos sin variante (versión) seleccionada.");
        }

        if (allVariantIdsToCheck.length > 0) {
            const { data: variants, error: varError } = await supabase
                .from('product_variants')
                .select('id, price')
                .in('id', allVariantIdsToCheck);

            if (varError) throw new Error('Error validando variantes: ' + varError.message);
            dbVariants = variants || [];
        }

        // Create Maps for O(1) lookup
        // const productMap = new Map(dbProducts.map(p => [p.id, p])); // Not needed for price anymore
        const variantMap = new Map(dbVariants.map(v => [v.id, v]));

        // 2️⃣ CALCULAR TOTALES (SERVER SIDE)
        let calculatedSubtotal = 0;

        // Re-map items with REAL prices
        const secureItems = payload.items.map(item => {
            let realPrice = 0;

            if (item.variant_id) {
                const variant = variantMap.get(item.variant_id);
                if (!variant) throw new Error(`Variante no encontrada o no válida: ${item.variant_id}`);
                realPrice = variant.price;
            } else {
                // Fallback impossible if we strictly require variants as above
                throw new Error(`Producto sin variante definida: ${item.product_id}`);
            }

            calculatedSubtotal += (realPrice * item.quantity);

            return {
                ...item,
                unit_price: realPrice // Overwrite with secure price
            };
        });

        const deposit_amount = calculatedSubtotal * BUSINESS_LOGIC.ORDER.DEPOSIT_PERCENTAGE;
        const total_amount = calculatedSubtotal;

        // 3️⃣ CREAR ORDEN
        const orderData: any = {
            customer_id: null,
            status: 'pending_payment_50',
            subtotal: calculatedSubtotal,
            deposit_amount,
            total_amount,
        };

        const customerFields = [
            'customer_name', 'customer_email', 'customer_phone',
            'shipping_department', 'shipping_municipality', 'shipping_address'
        ];

        customerFields.forEach(field => {
            const payloadField = field as keyof CreateOrderPayload;
            if (payload[payloadField]) {
                orderData[field] = payload[payloadField];
            }
        });

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert(orderData)
            .select()
            .single();

        if (orderError) {
            console.error('❌ Error creating order:', orderError);
            return NextResponse.json(
                { success: false, error: 'Error al crear la orden', details: orderError.message, pgCode: orderError.code },
                { status: 500 }
            );
        }

        if (!order) {
            return NextResponse.json(
                { success: false, error: 'No se pudo crear la orden (Empty result)' },
                { status: 500 }
            );
        }

        // 4️⃣ CREAR ORDER_ITEMS
        const orderItems = secureItems.map(item => {
            // Helper to clean UUIDs (empty string -> null)
            const cleanUUID = (id: string | null | undefined) => (!id || id.trim() === '') ? null : id;

            return {
                order_id: order.id,
                product_id: cleanUUID(item.product_id),
                variant_id: cleanUUID(item.variant_id),
                size_id: cleanUUID(item.size_id),
                patch_id: cleanUUID(item.patch_id),
                quantity: item.quantity,
                unit_price: item.unit_price,
                personalization_type: item.personalization_type || 'none',
                player_id: cleanUUID(item.player_id),
                custom_number: item.custom_number ? parseInt(String(item.custom_number)) || null : null,
                custom_name: item.custom_name ? item.custom_name.trim() : null,
                // Explicitly set timestamp to avoid DB trigger timezone issues
                created_at: new Date().toISOString(),
            };
        });

        console.log("📝 Inserting Order Items:", JSON.stringify(orderItems, null, 2));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error('❌ Error creating order items:', itemsError);
            await supabase.from('orders').delete().eq('id', order.id);
            return NextResponse.json(
                { success: false, error: 'Error al crear items', details: itemsError.message },
                { status: 500 }
            );
        }

        // 5️⃣ CREAR REGISTRO DE PAGO
        const paymentData = {
            order_id: order.id,
            amount: deposit_amount,
            type: 'deposit' as const,
            status: 'pending' as const,
            provider: 'manual',
            method: payload.payment_method,
            notes: `Anticipo del ${BUSINESS_LOGIC.ORDER.DEPOSIT_PERCENTAGE * 100}% - Método: ${payload.payment_method}`,
        };

        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert(paymentData)
            .select()
            .single();

        if (paymentError) {
            console.error('❌ Error creating payment:', paymentError);
            await supabase.from('order_items').delete().eq('order_id', order.id);
            await supabase.from('orders').delete().eq('id', order.id);
            return NextResponse.json(
                { success: false, error: 'Error al crear pago', details: paymentError.message },
                { status: 500 }
            );
        }

        // 6️⃣ CORREO DE CONFIRMACIÓN
        try {
            // Recuperar detalles para el correo (joins)
            const { data: enrichedItems } = await supabase
                .from('order_items')
                .select(`
                    quantity,
                    products (name, image_url, team_id, teams(name)),
                    personalization_type,
                    custom_name,
                    custom_number,
                    product_variants (version),
                    sizes (label),
                    patches (name)
                `)
                .eq('order_id', order.id);

            const emailItems = enrichedItems?.map((item: any) => {
                let customization = [];
                if (item.product_variants?.version) customization.push(item.product_variants.version);
                if (item.sizes?.label) customization.push(`Talla ${item.sizes.label}`);
                if (item.patches?.name) customization.push(`Parche: ${item.patches.name}`);
                if (item.personalization_type === 'custom' || item.personalization_type === 'player') {
                    customization.push(`Dorsal: ${item.custom_number || ''} ${item.custom_name || ''}`);
                }
                return {
                    name: item.products?.name || 'Producto',
                    team: item.products?.teams?.name || '',
                    image: item.products?.image_url || '',
                    quantity: item.quantity,
                    details: customization.join(' · ')
                };
            }) || [];

            await sendOrderConfirmationEmail({
                customerName: payload.customer_name,
                customerEmail: payload.customer_email,
                orderId: order.id,
                totalAmount: total_amount,
                depositAmount: deposit_amount,
                items: emailItems
            });

            // 👑 Admin Notification
            await sendAdminNewOrderEmail({
                customerName: payload.customer_name,
                customerEmail: payload.customer_email,
                orderId: order.id,
                totalAmount: total_amount,
                items: emailItems
            });

        } catch (emailErr) {
            console.error('⚠️ Error enviando correo:', emailErr);
            // No fallamos la orden si falla el correo, solo logueamos
        }

        return NextResponse.json({
            success: true,
            order_id: order.id,
            order_number: order.id.slice(0, 8).toUpperCase(),
            total: total_amount,
            deposit: deposit_amount,
            payment_id: payment?.id,
        });

    } catch (error: any) {
        console.error('💥 Unexpected error in create order:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Error inesperado del servidor',
                details: error.message,
                stack: error.stack, // 🔥 DEBUG STACK
            },
            { status: 500 }
        );
    }
}
