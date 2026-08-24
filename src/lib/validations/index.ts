import { z } from 'zod';

/**
 * Sanitiza cadenas de texto eliminando etiquetas HTML y scripts para prevenir XSS.
 */
export function sanitizeText(str: string): string {
    if (!str) return '';
    return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim();
}

/**
 * Esquema de validación para los ítems individuales de una orden.
 */
export const orderItemSchema = z.object({
    product_id: z.string({ message: 'ID de producto requerido' }).uuid('ID de producto inválido'),
    variant_id: z.string().uuid('ID de variante inválido').nullable().optional(),
    size_id: z.string().uuid('ID de talla inválido').nullable().optional(),
    patch_id: z.string().uuid('ID de parche inválido').nullable().optional(),
    quantity: z.number({ message: 'Cantidad requerida' })
        .int('La cantidad debe ser un número entero')
        .min(1, 'La cantidad mínima es 1')
        .max(99, 'La cantidad máxima por producto es 99'),
    unit_price: z.number().optional(), // Ignorado en backend, recalculado desde la BD
    personalization_type: z.enum(['none', 'player', 'custom'], {
        message: 'Tipo de personalización inválido',
    }),
    player_id: z.string().uuid('ID de jugador inválido').nullable().optional(),
    custom_number: z.number()
        .int('El dorsal personalizado debe ser un número entero')
        .min(0, 'El dorsal mínimo es 0')
        .max(99, 'El dorsal máximo es 99')
        .nullable()
        .optional(),
    custom_name: z.string()
        .max(30, 'El nombre personalizado no puede exceder 30 caracteres')
        .transform(sanitizeText)
        .nullable()
        .optional(),
});

/**
 * Esquema de validación para la creación de órdenes (POST /api/orders/create).
 */
export const createOrderSchema = z.object({
    customer_name: z.string({ message: 'El nombre es obligatorio' })
        .trim()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres')
        .transform(sanitizeText),
    customer_email: z.string({ message: 'El correo electrónico es obligatorio' })
        .trim()
        .toLowerCase()
        .email('Formato de correo electrónico inválido')
        .max(254, 'El correo no puede exceder 254 caracteres'),
    customer_phone: z.string({ message: 'El teléfono es obligatorio' })
        .trim()
        .transform(val => val.replace(/[\s\-\(\)]/g, ''))
        .refine(val => {
            if (/^\+504[0-9]{8}$/.test(val)) return true;
            if (/^[0-9]{8}$/.test(val)) return true;
            return false;
        }, 'Formato de teléfono inválido (debe ser +504XXXXXXXX o un número de 8 dígitos)'),
    shipping_department: z.string({ message: 'El departamento es obligatorio' })
        .trim()
        .min(1, 'Departamento de envío requerido')
        .max(100, 'Nombre de departamento demasiado largo')
        .transform(sanitizeText),
    shipping_municipality: z.string({ message: 'El municipio es obligatorio' })
        .trim()
        .min(1, 'Municipio de envío requerido')
        .max(100, 'Nombre de municipio demasiado largo')
        .transform(sanitizeText),
    shipping_address: z.string({ message: 'La dirección es obligatoria' })
        .trim()
        .min(5, 'La dirección debe tener al menos 5 caracteres')
        .max(300, 'La dirección no puede exceder 300 caracteres')
        .transform(sanitizeText),
    payment_method: z.string({ message: 'El método de pago es obligatorio' })
        .trim()
        .min(1, 'El método de pago es obligatorio')
        .max(100, 'Nombre de método de pago demasiado largo'),
    items: z.array(orderItemSchema, { message: 'Debe incluir al menos un artículo' })
        .min(1, 'El carrito no puede estar vacío')
        .max(50, 'No puede incluir más de 50 artículos por pedido'),
    discount_code: z.string().trim().max(50).optional(),
    _honey: z.string().optional(),
    idempotency_key: z.string({ message: 'Falta clave de idempotencia' })
        .trim()
        .min(5, 'Clave de idempotencia demasiado corta'),
});

/**
 * Esquema para validación de cupón de descuento (POST /api/discount/validate).
 */
export const discountValidateSchema = z.object({
    code: z.string({ message: 'Código requerido' })
        .trim()
        .min(1, 'Código vacío')
        .max(50, 'Código demasiado largo')
        .transform(v => v.toUpperCase()),
    email: z.string({ message: 'Email requerido' })
        .trim()
        .toLowerCase()
        .email('Email inválido'),
    items: z.array(z.object({
        product_id: z.string().uuid('ID de producto inválido'),
        variant_id: z.string().uuid('ID de variante inválido'),
        quantity: z.number().int().min(1).max(99),
    })).min(1, 'Carrito vacío'),
});

/**
 * Esquema para validación de comprobante de pago (POST /api/payments/proof).
 */
export const paymentProofSchema = z.object({
    orderId: z.string({ message: 'ID de pedido requerido' })
        .uuid('ID de pedido inválido (debe ser UUID)'),
});

/**
 * Esquema para la gestión de invitación de administradores (POST /api/admin/invite).
 */
export const adminInviteSchema = z.object({
    email: z.string({ message: 'Email requerido' })
        .trim()
        .toLowerCase()
        .email('Email inválido'),
    role: z.enum(['admin', 'super_admin'], {
        message: 'Rol de administrador inválido',
    }).optional().default('admin'),
    password: z.string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .optional(),
});

/**
 * Esquema para registro de pago manual de orden en Admin.
 */
export const registerPaymentSchema = z.object({
    orderId: z.string().uuid('ID de pedido inválido'),
    amount: z.number().positive('El monto del pago debe ser mayor a 0'),
    method: z.string().trim().min(1, 'Método de pago requerido').max(50),
    bank: z.string().trim().min(1, 'Nombre del banco requerido').max(100).transform(sanitizeText),
    reference: z.string().trim().min(1, 'Número de referencia requerido').max(100).transform(sanitizeText),
    date: z.string().trim().min(1, 'Fecha requerida').max(50),
});

/**
 * Esquema para la creación/edición de códigos de descuento en Admin.
 */
export const discountCodeAdminSchema = z.object({
    code: z.string({ message: 'El código es requerido' })
        .trim()
        .min(1, 'El código no puede estar vacío')
        .max(50, 'El código no puede exceder 50 caracteres')
        .transform(v => v.toUpperCase()),
    description: z.string().trim().max(250).transform(sanitizeText).nullable().optional(),
    discount_pct: z.number({ message: 'Porcentaje requerido' })
        .min(1, 'El porcentaje mínimo de descuento es 1%')
        .max(100, 'El porcentaje máximo de descuento es 100%'),
    category_ids: z.array(z.string().uuid('ID de categoría inválido')).optional().default([]),
    league_ids: z.array(z.string().uuid('ID de liga inválido')).optional().default([]),
    team_ids: z.array(z.string().uuid('ID de equipo inválido')).optional().default([]),
    max_uses: z.number().int('Usos máximos debe ser entero').min(1).nullable().optional(),
    expires_at: z.string().nullable().optional(),
    active: z.boolean().optional().default(true),
});

/**
 * Esquema para validación de eventos de analytics (POST /api/analytics/share).
 */
export const shareAnalyticsSchema = z.object({
    product_slug: z.string().trim().max(200).transform(sanitizeText).optional(),
    product_name: z.string().trim().max(200).transform(sanitizeText).optional(),
    team_name: z.string().trim().max(200).transform(sanitizeText).nullable().optional(),
}).refine(data => data.product_slug || data.product_name, {
    message: 'Se requiere al menos el slug o el nombre del producto',
});
