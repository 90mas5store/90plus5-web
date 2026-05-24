import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrderConfirmationEmail, sendAdminNewOrderEmail } from '@/lib/email';
import { BUSINESS_LOGIC, calcShippingCost } from '@/lib/constants';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import type { SupabaseRawOrderItem } from '@/lib/types';
import { SITE_URL } from '@/lib/config/site';

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
    discount_code?: string;
    _honey?: string; // Honeypot
    idempotency_key?: string;
}

export async function POST(request: NextRequest) {
    try {
        // Order creation started

        // 🛡️ RATE LIMITING — máximo 10 pedidos por IP cada hora
        const ip = getClientIp(request);
        const { allowed, retryAfterMs } = await checkRateLimit(`orders:${ip}`, 10, 60 * 60_000);
        if (!allowed) {
            return NextResponse.json(
                { success: false, error: 'Demasiadas solicitudes. Intenta más tarde.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
            );
        }

        // 🛡️ BODY SIZE — máximo 50 KB
        const contentLength = parseInt(request.headers.get('content-length') ?? '0', 10);
        if (contentLength > 50_000) {
            return NextResponse.json(
                { success: false, error: 'Payload demasiado grande' },
                { status: 413 }
            );
        }

        // 🛡️ CSRF — verificar que el request viene del mismo dominio
        // Comparamos el hostname del Origin contra el Host del propio request
        // (robusto: funciona en cualquier dominio/preview sin vars de entorno)
        const origin = request.headers.get('origin') ?? '';
        const referer = request.headers.get('referer') ?? '';
        // Host puede venir como "90mas5.store" o "localhost:3000" — quitamos el puerto
        const currentHost = (request.headers.get('host') ?? '').split(':')[0];

        const isSameHost = (headerValue: string): boolean => {
            try {
                return new URL(headerValue).hostname === currentHost;
            } catch {
                return false;
            }
        };

        if (origin) {
            if (!isSameHost(origin)) {
                console.warn(`⚠️ CSRF: Origin rechazado: ${origin} (host: ${currentHost})`);
                return NextResponse.json(
                    { success: false, error: 'Solicitud no autorizada' },
                    { status: 403 }
                );
            }
        } else if (referer) {
            if (!isSameHost(referer)) {
                console.warn(`⚠️ CSRF: Referer rechazado: ${referer} (host: ${currentHost})`);
                return NextResponse.json(
                    { success: false, error: 'Solicitud no autorizada' },
                    { status: 403 }
                );
            }
        }
        // Sin Origin ni Referer → dejamos pasar (API call server-side legítimo)

        // 0️⃣ DEBUG CHECK
        if (!BUSINESS_LOGIC || !BUSINESS_LOGIC.ORDER) {
            console.error("❌ CRITICAL: BUSINESS_LOGIC is undefined");
            throw new Error("Configuration Error: BUSINESS_LOGIC not loaded");
        }

        // 🔐 Crear cliente de Supabase con Service Role (Admin)
        const supabase = createAdminClient();
        if (!supabase) throw new Error("Failed to initialize Supabase Admin Client");

        const payload: CreateOrderPayload = await request.json();

        // 🐝 HONEYPOT CHECK
        if (payload._honey) {
            console.warn('🤖 Bot detected via honeypot');
            return NextResponse.json({ success: true, fake: true }, { status: 200 });
        }

        // 🔑 IDEMPOTENCY — requerir key para prevenir duplicados
        if (!payload.idempotency_key || typeof payload.idempotency_key !== 'string' || payload.idempotency_key.length < 5) {
            return NextResponse.json(
                { success: false, error: 'Falta clave de idempotencia' },
                { status: 400 }
            );
        }

        // 1️⃣ VALIDACIÓN BÁSICA
        if (!payload.customer_name || !payload.customer_email || !payload.items?.length) {
            return NextResponse.json(
                { success: false, error: 'Datos incompletos', details: 'Faltan campos requeridos' },
                { status: 400 }
            );
        }

        // 🛡️ VALIDACIÓN DE LONGITUD Y FORMATO
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (payload.customer_name.length > 100) {
            return NextResponse.json({ success: false, error: 'Nombre demasiado largo (máx. 100 caracteres)' }, { status: 400 });
        }
        if (payload.customer_email.length > 254 || !emailRegex.test(payload.customer_email)) {
            return NextResponse.json({ success: false, error: 'Email inválido' }, { status: 400 });
        }
        if (payload.customer_phone && payload.customer_phone.length > 20) {
            return NextResponse.json({ success: false, error: 'Teléfono demasiado largo (máx. 20 caracteres)' }, { status: 400 });
        }
        // 🛡️ M1 FIX: Normalizar teléfono antes de validar (strip espacios, guiones, paréntesis)
        if (payload.customer_phone) {
            payload.customer_phone = payload.customer_phone.replace(/[\s\-\(\)]/g, '');
        }
        const phoneRegex = /^\+504[0-9]{8}$/;
        if (payload.customer_phone && !phoneRegex.test(payload.customer_phone)) {
            return NextResponse.json({ success: false, error: 'Formato de teléfono inválido. Usa el formato +504XXXXXXXX' }, { status: 400 });
        }
        if (payload.shipping_address && payload.shipping_address.length > 300) {
            return NextResponse.json({ success: false, error: 'Dirección demasiado larga (máx. 300 caracteres)' }, { status: 400 });
        }
        if (!Array.isArray(payload.items) || payload.items.length > 50) {
            return NextResponse.json({ success: false, error: 'Número de artículos inválido' }, { status: 400 });
        }

        // 🛡️ VALIDAR CANTIDAD POR ITEM
        for (const item of payload.items) {
            if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
                return NextResponse.json({ success: false, error: 'Cantidad de artículo inválida (1–99)' }, { status: 400 });
            }
        }

        // 🛡️ VALIDAR MÉTODO DE PAGO — solo métodos permitidos
        const ALLOWED_PAYMENT_METHODS = ['transferencia'];
        if (!payload.payment_method || !ALLOWED_PAYMENT_METHODS.includes(payload.payment_method)) {
            return NextResponse.json({ success: false, error: 'Método de pago no permitido' }, { status: 400 });
        }

        // 🛡️ SECURITY: FETCH REAL PRICES
        // Extraer IDs únicos para batch fetching
        const productIds = [...new Set(payload.items.map(i => i.product_id))];
        const variantIds = [...new Set(payload.items.map(i => i.variant_id).filter(Boolean))] as string[];

        // Fetch basic product info (category/team for discount scope evaluation)
        const { data: dbProducts, error: prodError } = await supabase
            .from('products')
            .select('id, category_id, team_id')
            .in('id', productIds);

        if (prodError || !dbProducts) {
            throw new Error('Error validando productos: ' + (prodError?.message || 'No data'));
        }

        // Fetch variants prices (CRITICAL: Price comes from here)
        // We MUST fetch variants for ALL items, because price is in variants table.
        // If an item has no variant_id payload, we have a problem unless we default to a main variant.
        // Current logic assumes frontend sends variant_id.
        let dbVariants: { id: string; price: number }[] = [];
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
                realPrice = variant.price as number;
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

        // 💰 DISCOUNT CODE VALIDATION (re-validate server-side)
        let discountAmount = 0;
        let discountCodeId: string | null = null;

        if (payload.discount_code) {
            try {
                const discountCode = payload.discount_code.toUpperCase().trim();
                const customerEmail = payload.customer_email.toLowerCase().trim();

                const { data: dc } = await supabase
                    .from('discount_codes')
                    .select('*')
                    .eq('code', discountCode)
                    .eq('active', true)
                    .maybeSingle();

                const isValidCode = dc &&
                    (!dc.expires_at || new Date(dc.expires_at) >= new Date()) &&
                    (dc.max_uses === null || dc.used_count < dc.max_uses);

                if (isValidCode) {
                    // Check email hasn't used it
                    const { data: existingUsage } = await supabase
                        .from('discount_code_usage')
                        .select('id')
                        .eq('code_id', dc.id)
                        .eq('customer_email', customerEmail)
                        .maybeSingle();

                    if (!existingUsage) {
                        // Fetch product leagues for scope check
                        const { data: productLeaguesData } = await supabase
                            .from('product_leagues')
                            .select('product_id, league_id')
                            .in('product_id', productIds);

                        const productLeaguesMap = new Map<string, Set<string>>();
                        for (const pl of (productLeaguesData ?? [])) {
                            if (!productLeaguesMap.has(pl.product_id)) {
                                productLeaguesMap.set(pl.product_id, new Set());
                            }
                            productLeaguesMap.get(pl.product_id)!.add(pl.league_id);
                        }

                        const productInfoMap = new Map((dbProducts ?? []).map(p => [p.id, p]));
                        const categoryScope: string[] = dc.category_ids ?? [];
                        const leagueScope: string[] = dc.league_ids ?? [];
                        const teamScope: string[] = dc.team_ids ?? [];

                        let eligibleSubtotal = 0;
                        for (const item of secureItems) {
                            const product = productInfoMap.get(item.product_id);
                            if (!product) continue;
                            const productLeagues = productLeaguesMap.get(item.product_id) ?? new Set();
                            const matchesCategory = categoryScope.length === 0 || categoryScope.includes(product.category_id);
                            const matchesLeague = leagueScope.length === 0 || leagueScope.some((lid: string) => productLeagues.has(lid));
                            const matchesTeam = teamScope.length === 0 || teamScope.includes(product.team_id);
                            if (matchesCategory && matchesLeague && matchesTeam) {
                                eligibleSubtotal += item.unit_price * item.quantity;
                            }
                        }

                        discountAmount = Math.round((eligibleSubtotal * dc.discount_pct / 100) * 100) / 100;
                        discountCodeId = dc.id;
                    }
                }
            } catch (discountErr) {
                // Silent fail — don't break order if discount validation fails
                console.warn('⚠️ Discount code validation failed silently:', discountErr);
            }
        }

        const shippingCost = calcShippingCost(
            payload.shipping_department ?? '',
            payload.shipping_municipality ?? ''
        );
        const effectiveSubtotal = calculatedSubtotal - discountAmount;
        const total_amount = effectiveSubtotal + shippingCost;
        const deposit_amount = total_amount * BUSINESS_LOGIC.ORDER.DEPOSIT_PERCENTAGE;

        // 3️⃣ CREAR ORDEN — transacción atómica via RPC PostgreSQL
        const cleanUUID = (id: string | null | undefined) => (!id || id.trim() === '') ? null : id;

        const rpcOrderData = {
            subtotal: calculatedSubtotal,
            deposit_amount,
            total_amount,
            discount_amount: discountAmount,
            idempotency_key: payload.idempotency_key,
            customer_name: payload.customer_name,
            customer_email: payload.customer_email,
            customer_phone: payload.customer_phone,
            shipping_department: payload.shipping_department,
            shipping_municipality: payload.shipping_municipality,
            shipping_address: payload.shipping_address,
        };

        const rpcItems = secureItems.map(item => ({
            product_id: cleanUUID(item.product_id),
            variant_id: cleanUUID(item.variant_id),
            size_id: cleanUUID(item.size_id),
            patch_id: cleanUUID(item.patch_id),
            quantity: item.quantity,
            unit_price: item.unit_price,
            personalization_type: item.personalization_type || 'none',
            player_id: cleanUUID(item.player_id),
            custom_number: item.custom_number ? String(item.custom_number) : null,
            custom_name: item.custom_name ? item.custom_name.trim() : null,
        }));

        const rpcPayment = {
            amount: deposit_amount,
            type: 'deposit',
            status: 'pending',
            provider: 'manual',
            method: payload.payment_method,
            notes: `Anticipo del ${BUSINESS_LOGIC.ORDER.DEPOSIT_PERCENTAGE * 100}% - Método: ${payload.payment_method}`,
        };

        const { data: rpcResult, error: rpcError } = await supabase.rpc('create_order_atomic', {
            p_order: rpcOrderData,
            p_items: rpcItems,
            p_payment: rpcPayment,
            p_discount_code_id: discountCodeId,
            p_discount_amount: discountAmount,
            p_customer_email: payload.customer_email.toLowerCase().trim(),
        });

        if (rpcError) {
            console.error('❌ Error creating order (RPC):', rpcError);
            return NextResponse.json(
                { success: false, error: 'Error al crear la orden', details: rpcError.message },
                { status: 500 }
            );
        }

        if (!rpcResult) {
            return NextResponse.json(
                { success: false, error: 'No se pudo crear la orden (empty RPC result)' },
                { status: 500 }
            );
        }

        const orderId: string = rpcResult.order_id;
        const isDuplicate: boolean = rpcResult.duplicate === true;
        const siteUrl = SITE_URL;

        if (isDuplicate) {
            return NextResponse.json({
                success: true,
                order_id: orderId,
                order_number: orderId.slice(0, 8).toUpperCase(),
                total: rpcResult.total,
                deposit: rpcResult.deposit,
                shipping: shippingCost,
                duplicate: true,
                proof_upload_url: `${siteUrl}/comprobante/${orderId}`,
            });
        }

        // 📊 AUDIT LOG
        console.warn(JSON.stringify({
            event: 'ORDER_CREATED',
            timestamp: new Date().toISOString(),
            order_id: orderId,
            payment_method: payload.payment_method,
            total_amount,
            deposit_amount,
            items_count: payload.items.length,
        }));

        // 4️⃣ CORREO DE CONFIRMACIÓN (fuera de la transacción — no bloquea la orden)
        try {
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
                .eq('order_id', orderId);

            const emailItems = (enrichedItems as SupabaseRawOrderItem[] | null)?.map((item) => {
                const customization: string[] = [];
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

            const proofUploadUrl = `${siteUrl}/comprobante/${orderId}`;

            await sendOrderConfirmationEmail({
                customerName: payload.customer_name,
                customerEmail: payload.customer_email,
                orderId,
                totalAmount: total_amount,
                depositAmount: deposit_amount,
                proofUploadUrl,
                items: emailItems
            });

            await sendAdminNewOrderEmail({
                customerName: payload.customer_name,
                customerEmail: payload.customer_email,
                orderId,
                totalAmount: total_amount,
                items: emailItems
            });

        } catch (emailErr) {
            console.error('⚠️ Error enviando correo:', emailErr);
        }

        return NextResponse.json({
            success: true,
            order_id: orderId,
            order_number: orderId.slice(0, 8).toUpperCase(),
            total: total_amount,
            deposit: deposit_amount,
            shipping: shippingCost,
            payment_id: rpcResult.payment_id,
            proof_upload_url: `${siteUrl}/comprobante/${orderId}`,
        });

    } catch (error: unknown) {
        console.error('💥 Unexpected error in create order:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Error inesperado del servidor',
            },
            { status: 500 }
        );
    }
}
