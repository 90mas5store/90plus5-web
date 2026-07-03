import { createAdminClient } from '@/lib/supabase/admin';

// 🏦 Configuración Centralizada de Cuentas Bancarias
// Los datos viven en Supabase (tabla bank_accounts)
// Edita las cuentas desde el panel de Supabase sin tocar código.

export interface BankAccount {
    id: string;
    slug: string;
    banco: string;
    titular: string;
    numero: string;
    tipo: string;
    logo?: string;
    activo?: boolean;
    orden?: number;
}

/**
 * Obtiene las cuentas bancarias activas desde Supabase.
 * ⚠️ Solo usar en Server Components, API Routes o Route Handlers.
 * Usa el cliente admin para evitar problemas de RLS en contextos de servidor.
 */
export async function fetchBankAccounts(): Promise<BankAccount[]> {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('bank_accounts')
            .select('id, slug, banco, titular, numero, tipo, logo, activo, orden')
            .eq('activo', true)
            .order('orden', { ascending: true });

        if (error) {
            console.error('❌ Error al obtener cuentas bancarias de Supabase:', error.message);
            return BANK_ACCOUNTS_FALLBACK;
        }

        if (!data || data.length === 0) {
            console.warn('⚠️ No se encontraron cuentas bancarias activas en Supabase. Usando fallback.');
            return BANK_ACCOUNTS_FALLBACK;
        }

        return data as BankAccount[];
    } catch (err) {
        console.error('❌ Excepción al obtener cuentas bancarias:', err);
        return BANK_ACCOUNTS_FALLBACK;
    }
}

/**
 * Fallback estático por si Supabase no responde.
 * Mantener actualizado si cambian las cuentas.
 */
export const BANK_ACCOUNTS_FALLBACK: BankAccount[] = [
    {
        id: 'fallback-bac',
        slug: 'bac',
        banco: 'BAC Credomatic',
        titular: 'Daniel Alejandro Urbizo',
        numero: '759045731',
        tipo: 'Cuenta de Ahorros',
        logo: '/banks/bac.svg?v=2',
    },
    {
        id: 'fallback-atlantida',
        slug: 'atlantida',
        banco: 'Banco Atlántida',
        titular: 'Daniel Alejandro Urbizo',
        numero: '00002020850354',
        tipo: 'Cuenta de Ahorros',
        logo: '/banks/atlantida.svg?v=2',
    },
];

// Alias de compatibilidad — para código que todavía importe BANK_ACCOUNTS
// ⚠️ No usar en código nuevo. Usar fetchBankAccounts() en su lugar.
export const BANK_ACCOUNTS = BANK_ACCOUNTS_FALLBACK;
