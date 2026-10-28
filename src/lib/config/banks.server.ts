import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
    DEFAULT_BANK_ACCOUNTS,
    DEFAULT_PAYMENT_METHODS,
    BankAccountRecord,
    PaymentMethodRecord
} from './banks';

/**
 * Obtiene las cuentas bancarias activas desde Supabase (Server-side only).
 */
export async function fetchBankAccounts(): Promise<BankAccountRecord[]> {
    try {
        let supabase: any;
        try {
            supabase = createAdminClient();
        } catch {
            supabase = await createClient();
        }

        const { data, error } = await supabase
            .from('bank_accounts')
            .select('*')
            .eq('activo', true)
            .order('orden', { ascending: true });

        if (error || !data || data.length === 0) {
            return DEFAULT_BANK_ACCOUNTS.filter(b => b.activo).sort((a, b) => (a.orden || 99) - (b.orden || 99));
        }

        return (data as BankAccountRecord[]).sort((a, b) => (a.orden || 99) - (b.orden || 99));
    } catch {
        return DEFAULT_BANK_ACCOUNTS.filter(b => b.activo).sort((a, b) => (a.orden || 99) - (b.orden || 99));
    }
}

/**
 * Obtiene las formas de pago desde Supabase (Server-side only).
 */
export async function fetchPaymentMethods(): Promise<PaymentMethodRecord[]> {
    try {
        let supabase: any;
        try {
            supabase = createAdminClient();
        } catch {
            supabase = await createClient();
        }

        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error || !data || data.length === 0) {
            return DEFAULT_PAYMENT_METHODS.filter(p => p.active).sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99));
        }

        let methods = [...data] as PaymentMethodRecord[];
        methods = methods.filter(m => m.code !== 'paypal' && m.type !== 'paypal');

        const cardIdx = methods.findIndex(p => p.code === 'tarjeta' || p.type === 'tarjeta');
        if (cardIdx === -1) {
            const defaultCard = DEFAULT_PAYMENT_METHODS.find(p => p.code === 'tarjeta');
            if (defaultCard) methods.push(defaultCard);
        }

        return methods
            .filter(p => p.active)
            .sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99));
    } catch {
        return DEFAULT_PAYMENT_METHODS.filter(p => p.active).sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99));
    }
}
