export interface CheckoutFormData {
    nombre: string;
    correo: string;
    telefono: string;
    direccion: string;
    departamento: string;
    municipio: string;
    description?: string; // Honeypot
}

export interface CheckoutFormErrors {
    nombre?: boolean;
    correo?: boolean;
    telefono?: boolean;
    direccion?: boolean;
    departamento?: boolean;
    municipio?: boolean;
    metodoPago?: boolean;
}

export interface CreateOrderItemPayload {
    product_id: string;
    variant_id: string | null;
    size_id: string | null;
    patch_id: string | null;
    quantity: number;
    unit_price: number;
    personalization_type: 'none' | 'player' | 'custom';
    player_id: string | null;
    custom_number: number | null;
    custom_name: string | null;
}

export interface CreateOrderPayload {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    shipping_department: string;
    shipping_municipality: string;
    shipping_address: string;
    payment_method: string;
    items: CreateOrderItemPayload[];
    discount_code?: string;
    _honey?: string;
    idempotency_key?: string;
}

export interface DiscountState {
    pct: number;
    amount: number;
    scopeDesc: string;
}

export interface OrderResponse {
    success: boolean;
    order_id?: string;
    order_number?: string;
    total: number;
    deposit: number;
    shipping: number;
    payment_id?: string;
    error?: string;
    details?: string;
}

export interface ToastHook {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
    warning: (msg: string) => void;
    celebrate: (msg: string) => void;
    location: (msg: string) => void;
    dismiss: (id?: string) => void;
    loading: (msg: string) => void;
}
