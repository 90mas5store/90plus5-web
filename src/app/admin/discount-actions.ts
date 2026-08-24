'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { discountCodeAdminSchema } from '@/lib/validations'

interface DiscountCodeData {
    code: string
    description?: string
    discount_pct: number
    category_ids: string[]
    league_ids: string[]
    team_ids: string[]
    max_uses?: number | null
    expires_at?: string | null
    active?: boolean
}

async function getAuthUser() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) throw new Error('Unauthorized')
    return user
}

export async function createDiscountCode(data: DiscountCodeData) {
    const parseResult = discountCodeAdminSchema.safeParse(data);
    if (!parseResult.success) {
        throw new Error(`Datos inválidos: ${parseResult.error.issues.map(i => i.message).join(' | ')}`);
    }

    const validData = parseResult.data;
    const user = await getAuthUser()
    const supabase = createAdminClient()

    const { error } = await supabase
        .from('discount_codes')
        .insert({
            code: validData.code,
            description: validData.description || null,
            discount_pct: validData.discount_pct,
            category_ids: validData.category_ids,
            league_ids: validData.league_ids,
            team_ids: validData.team_ids,
            max_uses: validData.max_uses ?? null,
            expires_at: validData.expires_at ?? null,
            active: validData.active ?? true,
            created_by: user.email ?? user.id,
        })

    if (error) throw new Error(error.message)
    revalidatePath('/admin/descuentos')
    return { success: true }
}

export async function updateDiscountCode(id: string, data: Partial<DiscountCodeData>) {
    await getAuthUser()
    const supabase = createAdminClient()

    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (data.code !== undefined) updatePayload.code = data.code.toUpperCase().trim()
    if (data.description !== undefined) updatePayload.description = data.description || null
    if (data.discount_pct !== undefined) updatePayload.discount_pct = data.discount_pct
    if (data.category_ids !== undefined) updatePayload.category_ids = data.category_ids
    if (data.league_ids !== undefined) updatePayload.league_ids = data.league_ids
    if (data.team_ids !== undefined) updatePayload.team_ids = data.team_ids
    if (data.max_uses !== undefined) updatePayload.max_uses = data.max_uses ?? null
    if (data.expires_at !== undefined) updatePayload.expires_at = data.expires_at ?? null
    if (data.active !== undefined) updatePayload.active = data.active

    const { error } = await supabase
        .from('discount_codes')
        .update(updatePayload)
        .eq('id', id)

    if (error) throw new Error(error.message)
    revalidatePath('/admin/descuentos')
    return { success: true }
}

export async function toggleDiscountCode(id: string, active: boolean) {
    await getAuthUser()
    const supabase = createAdminClient()

    const { error } = await supabase
        .from('discount_codes')
        .update({ active, updated_at: new Date().toISOString() })
        .eq('id', id)

    if (error) throw new Error(error.message)
    revalidatePath('/admin/descuentos')
    return { success: true }
}

export async function deleteDiscountCode(id: string) {
    await getAuthUser()
    const supabase = createAdminClient()

    const { error } = await supabase
        .from('discount_codes')
        .delete()
        .eq('id', id)

    if (error) throw new Error(error.message)
    revalidatePath('/admin/descuentos')
    return { success: true }
}

export async function sendVipCouponEmail(data: {
    customerName: string
    customerEmail: string
    couponCode: string
    discountPct: number
    totalJerseys: number
}) {
    await getAuthUser()
    const { sendVipRewardEmail } = await import('@/lib/email')
    return await sendVipRewardEmail(data)
}
