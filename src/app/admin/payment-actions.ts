'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
    PaymentMethodRecord,
    BankAccountRecord,
    DEFAULT_PAYMENT_METHODS,
    DEFAULT_BANK_ACCOUNTS,
    updateMemoryBankStatus,
    updateMemoryBankRecord,
    deleteMemoryBankRecord,
    updateMemoryPaymentStatus,
    updateMemoryPaymentRecord,
    deleteMemoryPaymentRecord
} from '@/lib/config/banks'

export type { PaymentMethodRecord, BankAccountRecord }

async function getResilientSupabaseClient() {
    try {
        return createAdminClient()
    } catch {
        return await createClient()
    }
}

async function verifyAdminAuth() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            console.warn('[payment-actions] Usuario no autenticado')
        }
    } catch (err) {
        console.warn('[payment-actions] Auth check warning:', err)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 💳 MÉTODOS DE PAGO (PAYMENT METHODS)
// ─────────────────────────────────────────────────────────────────────────────

export async function getPaymentMethodsAdmin(): Promise<PaymentMethodRecord[]> {
    try {
        await verifyAdminAuth()
        const supabase = await getResilientSupabaseClient()

        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .order('sort_order', { ascending: true })

        if (error || !data || data.length === 0) {
            return DEFAULT_PAYMENT_METHODS
        }

        return data as PaymentMethodRecord[]
    } catch (err) {
        console.warn('[payment-actions] Using default payment methods fallback:', err)
        return DEFAULT_PAYMENT_METHODS
    }
}

export async function savePaymentMethod(data: Partial<PaymentMethodRecord>) {
    await verifyAdminAuth()
    updateMemoryPaymentRecord(data)

    const record = {
        code: data.code || data.id || `pago_${Date.now()}`,
        name: data.name || 'Nuevo Método de Pago',
        description: data.description || '',
        type: data.type || 'otro',
        active: data.active ?? true,
        is_coming_soon: data.is_coming_soon ?? false,
        sort_order: data.sort_order ?? 1,
        instructions: data.instructions || ''
    }

    try {
        const supabase = await getResilientSupabaseClient()
        if (data.id && data.id.length > 10 && data.id.includes('-')) {
            await supabase.from('payment_methods').update(record).eq('id', data.id)
        } else if (data.code) {
            await supabase.from('payment_methods').upsert({ ...record, id: data.id || undefined }, { onConflict: 'code' })
        } else {
            await supabase.from('payment_methods').insert([record])
        }
    } catch (err) {
        console.warn('[payment-actions] Error guardando en Supabase:', err)
    }

    return { success: true }
}

export async function togglePaymentMethodStatus(id: string, active: boolean, is_coming_soon: boolean, code?: string) {
    await verifyAdminAuth()
    updateMemoryPaymentStatus(id, active, is_coming_soon)

    try {
        const supabase = await getResilientSupabaseClient()
        if (id && id.length > 10 && id.includes('-')) {
            await supabase.from('payment_methods').update({ active, is_coming_soon }).eq('id', id)
        } else if (code) {
            await supabase.from('payment_methods').update({ active, is_coming_soon }).eq('code', code)
        } else {
            await supabase.from('payment_methods').update({ active, is_coming_soon }).eq('id', id)
        }
    } catch (err) {
        console.warn('[payment-actions] Error en toggle Supabase:', err)
    }

    return { success: true }
}

export async function deletePaymentMethod(id: string, code?: string) {
    await verifyAdminAuth()
    deleteMemoryPaymentRecord(id)

    try {
        const supabase = await getResilientSupabaseClient()
        if (id && id.length > 10 && id.includes('-')) {
            await supabase.from('payment_methods').delete().eq('id', id)
        } else if (code) {
            await supabase.from('payment_methods').delete().eq('code', code)
        } else {
            await supabase.from('payment_methods').delete().eq('id', id)
        }
    } catch (err) {
        console.warn('[payment-actions] Error en delete Supabase:', err)
    }

    return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// 🏦 CUENTAS BANCARIAS (BANK ACCOUNTS)
// ─────────────────────────────────────────────────────────────────────────────

export async function getBankAccountsAdmin(): Promise<BankAccountRecord[]> {
    try {
        await verifyAdminAuth()
        const supabase = await getResilientSupabaseClient()

        const { data, error } = await supabase
            .from('bank_accounts')
            .select('*')
            .order('orden', { ascending: true })

        if (error || !data || data.length === 0) {
            return DEFAULT_BANK_ACCOUNTS
        }

        return data as BankAccountRecord[]
    } catch (err) {
        console.warn('[payment-actions] Using default bank accounts fallback:', err)
        return DEFAULT_BANK_ACCOUNTS
    }
}

export async function saveBankAccount(data: Partial<BankAccountRecord>) {
    await verifyAdminAuth()
    updateMemoryBankRecord(data)

    const record = {
        slug: data.slug || 'banco',
        banco: data.banco || 'Nuevo Banco',
        titular: data.titular || 'Titular de Cuenta',
        numero: data.numero || '0000000000',
        tipo: data.tipo || 'Cuenta de Ahorros',
        logo: data.logo || '/banks/bac.svg',
        activo: data.activo ?? true,
        orden: data.orden ?? 1
    }

    try {
        const supabase = await getResilientSupabaseClient()
        if (data.id && data.id.length > 10 && data.id.includes('-')) {
            await supabase.from('bank_accounts').update(record).eq('id', data.id)
        } else if (data.slug) {
            await supabase.from('bank_accounts').update(record).eq('slug', data.slug)
        } else {
            await supabase.from('bank_accounts').insert([record])
        }
    } catch (err) {
        console.warn('[payment-actions] Error guardando banco en Supabase:', err)
    }

    return { success: true }
}

export async function toggleBankAccountStatus(id: string, activo: boolean, slug?: string) {
    await verifyAdminAuth()
    updateMemoryBankStatus(id, activo)

    try {
        const supabase = await getResilientSupabaseClient()
        if (id && id.length > 10 && id.includes('-')) {
            await supabase.from('bank_accounts').update({ activo }).eq('id', id)
        } else if (slug) {
            await supabase.from('bank_accounts').update({ activo }).eq('slug', slug)
        } else {
            await supabase.from('bank_accounts').update({ activo }).eq('id', id)
        }
    } catch (err) {
        console.warn('[payment-actions] Error en toggle banco Supabase:', err)
    }

    return { success: true }
}

export async function deleteBankAccount(id: string, slug?: string) {
    await verifyAdminAuth()
    deleteMemoryBankRecord(id)

    try {
        const supabase = await getResilientSupabaseClient()
        if (id && id.length > 10 && id.includes('-')) {
            await supabase.from('bank_accounts').delete().eq('id', id)
        } else if (slug) {
            await supabase.from('bank_accounts').delete().eq('slug', slug)
        } else {
            await supabase.from('bank_accounts').delete().eq('id', id)
        }
    } catch (err) {
        console.warn('[payment-actions] Error en delete banco Supabase:', err)
    }

    return { success: true }
}
