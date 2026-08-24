import { createAdminClient } from '@/lib/supabase/admin';

export interface BankAccountRecord {
    id: string;
    slug: string;
    banco: string;
    titular: string;
    numero: string;
    tipo: string;
    logo?: string;
    activo: boolean;
    orden: number;
}

export interface PaymentMethodRecord {
    id: string;
    code: string;
    name: string;
    description: string;
    type: 'transferencia' | 'efectivo' | 'link_pago' | 'tarjeta' | 'otro';
    active: boolean;
    is_coming_soon: boolean;
    sort_order: number;
    instructions?: string;
}

export type BankAccount = BankAccountRecord;
export type PaymentMethodConfig = PaymentMethodRecord;

export let DEFAULT_BANK_ACCOUNTS: BankAccountRecord[] = [
    {
        id: 'fallback-bac',
        slug: 'bac',
        banco: 'BAC Credomatic',
        titular: 'Daniel Alejandro Urbizo',
        numero: '759045731',
        tipo: 'Cuenta de Ahorros',
        logo: '/banks/bac.svg?v=2',
        activo: true,
        orden: 1,
    },
    {
        id: 'fallback-atlantida',
        slug: 'atlantida',
        banco: 'Banco Atlántida',
        titular: 'Daniel Alejandro Urbizo',
        numero: '00002020850354',
        tipo: 'Cuenta de Ahorros',
        logo: '/banks/atlantida.svg?v=2',
        activo: true,
        orden: 2,
    },
];

export let DEFAULT_PAYMENT_METHODS: PaymentMethodRecord[] = [
    {
        id: 'pm-transferencia',
        code: 'transferencia',
        name: 'Transferencia Bancaria',
        description: 'Paga el 50% de anticipo vía transferencia a nuestras cuentas bancarias.',
        type: 'transferencia',
        active: true,
        is_coming_soon: false,
        sort_order: 1,
        instructions: 'Realiza el depósito o transferencia y sube tu comprobante.'
    },
    {
        id: 'pm-link_pago',
        code: 'link_pago',
        name: 'Solicitar Link de Pago',
        description: 'Te enviamos un enlace de pago seguro para tarjetas vía WhatsApp.',
        type: 'link_pago',
        active: true,
        is_coming_soon: false,
        sort_order: 2,
        instructions: 'Al completar el pedido, nuestro equipo te enviará el link por WhatsApp.'
    },
    {
        id: 'pm-efectivo',
        code: 'efectivo',
        name: 'Efectivo / Pago al Entregar',
        description: 'Cancela tu pedido directamente en efectivo al recibir.',
        type: 'efectivo',
        active: true,
        is_coming_soon: false,
        sort_order: 3,
        instructions: 'Prepara el monto exacto para entregarlo al repartidor.'
    },
    {
        id: 'pm-tarjeta',
        code: 'tarjeta',
        name: 'Tarjeta de Crédito / Débito',
        description: 'Pago seguro en línea con tarjeta Visa/Mastercard.',
        type: 'tarjeta',
        active: true,
        is_coming_soon: true,
        sort_order: 4,
        instructions: 'Integración en desarrollo.'
    }
];

export function updateMemoryBankStatus(id: string, activo: boolean) {
    DEFAULT_BANK_ACCOUNTS = DEFAULT_BANK_ACCOUNTS.map(b => b.id === id ? { ...b, activo } : b);
}

export function updateMemoryBankRecord(bank: Partial<BankAccountRecord>) {
    const exists = DEFAULT_BANK_ACCOUNTS.some(b => b.id === bank.id);
    if (exists) {
        DEFAULT_BANK_ACCOUNTS = DEFAULT_BANK_ACCOUNTS.map(b => b.id === bank.id ? { ...b, ...bank } as BankAccountRecord : b);
    } else {
        DEFAULT_BANK_ACCOUNTS.push({
            id: bank.id || `bank_${Date.now()}`,
            slug: bank.slug || 'banco',
            banco: bank.banco || 'Nuevo Banco',
            titular: bank.titular || 'Titular',
            numero: bank.numero || '000000',
            tipo: bank.tipo || 'Cuenta de Ahorros',
            logo: bank.logo || '/banks/bac.svg',
            activo: bank.activo ?? true,
            orden: bank.orden ?? DEFAULT_BANK_ACCOUNTS.length + 1
        });
    }
}

export function deleteMemoryBankRecord(id: string) {
    DEFAULT_BANK_ACCOUNTS = DEFAULT_BANK_ACCOUNTS.filter(b => b.id !== id);
}

export function updateMemoryPaymentStatus(id: string, active: boolean, is_coming_soon: boolean) {
    DEFAULT_PAYMENT_METHODS = DEFAULT_PAYMENT_METHODS.map(p => p.id === id ? { ...p, active, is_coming_soon } : p);
}

export function updateMemoryPaymentRecord(method: Partial<PaymentMethodRecord>) {
    const exists = DEFAULT_PAYMENT_METHODS.some(p => p.id === method.id || (method.code && p.code === method.code));
    if (exists) {
        DEFAULT_PAYMENT_METHODS = DEFAULT_PAYMENT_METHODS.map(p => (p.id === method.id || p.code === method.code) ? { ...p, ...method } as PaymentMethodRecord : p);
    } else {
        DEFAULT_PAYMENT_METHODS.push({
            id: method.id || `pm_${Date.now()}`,
            code: method.code || `pago_${Date.now()}`,
            name: method.name || 'Nuevo Método',
            description: method.description || '',
            type: method.type || 'otro',
            active: method.active ?? true,
            is_coming_soon: method.is_coming_soon ?? false,
            sort_order: method.sort_order ?? DEFAULT_PAYMENT_METHODS.length + 1,
            instructions: method.instructions || ''
        });
    }
}

export function deleteMemoryPaymentRecord(id: string) {
    DEFAULT_PAYMENT_METHODS = DEFAULT_PAYMENT_METHODS.filter(p => p.id !== id);
}

export const BANK_ACCOUNTS_FALLBACK = DEFAULT_BANK_ACCOUNTS;
export const PAYMENT_METHODS_FALLBACK = DEFAULT_PAYMENT_METHODS;
export const BANK_ACCOUNTS = DEFAULT_BANK_ACCOUNTS;

/**
 * Obtiene las cuentas bancarias activas desde Supabase.
 */
export async function fetchBankAccounts(): Promise<BankAccountRecord[]> {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('bank_accounts')
            .select('id, slug, banco, titular, numero, tipo, logo, activo, orden')
            .eq('activo', true)
            .order('orden', { ascending: true });

        if (error || !data || data.length === 0) {
            return DEFAULT_BANK_ACCOUNTS.filter(b => b.activo);
        }

        return data as BankAccountRecord[];
    } catch {
        return DEFAULT_BANK_ACCOUNTS.filter(b => b.activo);
    }
}

/**
 * Obtiene las formas de pago desde Supabase.
 */
export async function fetchPaymentMethods(): Promise<PaymentMethodRecord[]> {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('active', true)
            .order('sort_order', { ascending: true });

        if (error || !data || data.length === 0) {
            return DEFAULT_PAYMENT_METHODS.filter(p => p.active);
        }

        return data as PaymentMethodRecord[];
    } catch {
        return DEFAULT_PAYMENT_METHODS.filter(p => p.active);
    }
}
