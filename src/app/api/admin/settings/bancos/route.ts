import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
    DEFAULT_PAYMENT_METHODS,
    DEFAULT_BANK_ACCOUNTS,
    PaymentMethodRecord,
    BankAccountRecord,
    updateMemoryBankStatus,
    updateMemoryBankRecord,
    deleteMemoryBankRecord,
    updateMemoryPaymentStatus,
    updateMemoryPaymentRecord,
    deleteMemoryPaymentRecord
} from '@/lib/config/banks'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
    try {
        let supabase: any
        try {
            supabase = createAdminClient()
        } catch {
            supabase = await createClient()
        }

        // Fetch payment methods from Supabase DB
        const { data: methodsData, error: methodsErr } = await supabase
            .from('payment_methods')
            .select('*')
            .order('sort_order', { ascending: true })

        let methods: PaymentMethodRecord[] = (methodsErr || !methodsData || methodsData.length === 0)
            ? DEFAULT_PAYMENT_METHODS
            : (methodsData as PaymentMethodRecord[])

        // Asegurar que PayPal siempre esté disponible en el listado si la base de datos no lo tenía
        if (!methods.some((m) => m.code === 'paypal')) {
            const paypalDefault = DEFAULT_PAYMENT_METHODS.find((p) => p.code === 'paypal')
            if (paypalDefault) {
                methods.push(paypalDefault)
            }
        }

        // Fetch bank accounts from Supabase DB
        const { data: banksData, error: banksErr } = await supabase
            .from('bank_accounts')
            .select('*')
            .order('orden', { ascending: true })

        const banks: BankAccountRecord[] = (banksErr || !banksData || banksData.length === 0)
            ? DEFAULT_BANK_ACCOUNTS
            : (banksData as BankAccountRecord[])

        return NextResponse.json({ methods, banks }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            }
        })
    } catch (err: unknown) {
        console.warn('API /api/admin/settings/bancos fallback:', err)
        return NextResponse.json({
            methods: DEFAULT_PAYMENT_METHODS,
            banks: DEFAULT_BANK_ACCOUNTS
        }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            }
        })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { type, action, data } = body

        let supabase: any
        try {
            supabase = createAdminClient()
        } catch {
            supabase = await createClient()
        }

        if (type === 'method') {
            if (action === 'toggle') {
                updateMemoryPaymentStatus(data.id, data.active, data.is_coming_soon, data.code)
                const targetCode = data.code || data.id
                if (targetCode) {
                    const { data: updData } = await supabase
                        .from('payment_methods')
                        .update({ active: data.active, is_coming_soon: data.is_coming_soon })
                        .eq('code', targetCode)
                        .select()

                    if (!updData || updData.length === 0) {
                        const fullDefault = DEFAULT_PAYMENT_METHODS.find((p) => p.code === targetCode)
                        if (fullDefault) {
                            await supabase.from('payment_methods').insert([{
                                code: targetCode,
                                name: fullDefault.name,
                                description: fullDefault.description,
                                type: fullDefault.type,
                                active: data.active,
                                is_coming_soon: data.is_coming_soon,
                                sort_order: fullDefault.sort_order,
                                instructions: fullDefault.instructions || ''
                            }])
                        }
                    }
                }
            } else if (action === 'save') {
                updateMemoryPaymentRecord(data)
                const record = {
                    code: data.code || data.id || `pago_${Date.now()}`,
                    name: data.name || 'Método de Pago',
                    description: data.description || '',
                    type: data.type || 'otro',
                    active: data.active ?? true,
                    is_coming_soon: data.is_coming_soon ?? false,
                    sort_order: data.sort_order ?? 1,
                    instructions: data.instructions || ''
                }
                if (data.id && data.id.length > 10 && data.id.includes('-')) {
                    await supabase.from('payment_methods').update(record).eq('id', data.id)
                } else {
                    const { data: updData } = await supabase
                        .from('payment_methods')
                        .update(record)
                        .eq('code', record.code)
                        .select()

                    if (!updData || updData.length === 0) {
                        await supabase.from('payment_methods').insert([record])
                    }
                }
            } else if (action === 'reorder') {
                if (Array.isArray(data)) {
                    for (const item of data) {
                        updateMemoryPaymentRecord(item)
                        const targetCode = item.code || item.id
                        if (targetCode) {
                            const { data: updData } = await supabase
                                .from('payment_methods')
                                .update({ sort_order: item.sort_order })
                                .eq('code', targetCode)
                                .select()

                            if (!updData || updData.length === 0) {
                                const fullDefault = DEFAULT_PAYMENT_METHODS.find((p) => p.code === targetCode)
                                if (fullDefault) {
                                    await supabase.from('payment_methods').insert([{
                                        code: targetCode,
                                        name: fullDefault.name,
                                        description: fullDefault.description,
                                        type: fullDefault.type,
                                        active: fullDefault.active,
                                        is_coming_soon: fullDefault.is_coming_soon,
                                        sort_order: item.sort_order,
                                        instructions: fullDefault.instructions || ''
                                    }])
                                }
                            }
                        }
                    }
                }
            } else if (action === 'delete') {
                deleteMemoryPaymentRecord(data.id)
                if (data.id && data.id.length > 10 && data.id.includes('-')) {
                    await supabase.from('payment_methods').delete().eq('id', data.id)
                } else if (data.code) {
                    await supabase.from('payment_methods').delete().eq('code', data.code)
                }
            }
        } else if (type === 'bank') {
            if (action === 'toggle') {
                updateMemoryBankStatus(data.id, data.activo, data.slug)
                const targetSlug = data.slug || data.id
                if (targetSlug) {
                    const { data: updData } = await supabase
                        .from('bank_accounts')
                        .update({ activo: data.activo })
                        .eq('slug', targetSlug)
                        .select()

                    if (!updData || updData.length === 0) {
                        const fullDefault = DEFAULT_BANK_ACCOUNTS.find((b) => b.slug === targetSlug)
                        if (fullDefault) {
                            await supabase.from('bank_accounts').insert([{
                                slug: targetSlug,
                                banco: fullDefault.banco,
                                titular: fullDefault.titular,
                                numero: fullDefault.numero,
                                tipo: fullDefault.tipo,
                                logo: fullDefault.logo,
                                activo: data.activo,
                                orden: fullDefault.orden
                            }])
                        }
                    }
                }
            } else if (action === 'reorder') {
                if (Array.isArray(data)) {
                    for (const item of data) {
                        updateMemoryBankRecord(item)
                        const targetSlug = item.slug || item.id
                        if (targetSlug) {
                            const { data: updData } = await supabase
                                .from('bank_accounts')
                                .update({ orden: item.orden })
                                .eq('slug', targetSlug)
                                .select()

                            if (!updData || updData.length === 0) {
                                const fullDefault = DEFAULT_BANK_ACCOUNTS.find((b) => b.slug === targetSlug)
                                if (fullDefault) {
                                    await supabase.from('bank_accounts').insert([{
                                        slug: targetSlug,
                                        banco: fullDefault.banco,
                                        titular: fullDefault.titular,
                                        numero: fullDefault.numero,
                                        tipo: fullDefault.tipo,
                                        logo: fullDefault.logo,
                                        activo: fullDefault.activo,
                                        orden: item.orden
                                    }])
                                }
                            }
                        }
                    }
                }
            } else if (action === 'save') {
                updateMemoryBankRecord(data)
                const record = {
                    slug: data.slug || 'banco',
                    banco: data.banco || 'Nuevo Banco',
                    titular: data.titular || 'Titular',
                    numero: data.numero || '0000000000',
                    tipo: data.tipo || 'Cuenta de Ahorros',
                    logo: data.logo || '/banks/bac.svg',
                    activo: data.activo ?? true,
                    orden: data.orden ?? 1
                }
                if (data.id && data.id.length > 10 && data.id.includes('-')) {
                    await supabase.from('bank_accounts').update(record).eq('id', data.id)
                } else {
                    const { data: updData } = await supabase
                        .from('bank_accounts')
                        .update(record)
                        .eq('slug', record.slug)
                        .select()

                    if (!updData || updData.length === 0) {
                        await supabase.from('bank_accounts').insert([record])
                    }
                }
            } else if (action === 'delete') {
                deleteMemoryBankRecord(data.id)
                if (data.id && data.id.length > 10 && data.id.includes('-')) {
                    await supabase.from('bank_accounts').delete().eq('id', data.id)
                } else if (data.slug) {
                    await supabase.from('bank_accounts').delete().eq('slug', data.slug)
                }
            }
        }

        return NextResponse.json({ success: true })
    } catch (err: unknown) {
        console.warn('API POST /api/admin/settings/bancos warning:', err)
        return NextResponse.json({ success: true })
    }
}

