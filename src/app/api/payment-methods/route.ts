import { NextResponse } from 'next/server'
import { fetchPaymentMethods, fetchBankAccounts, DEFAULT_PAYMENT_METHODS, DEFAULT_BANK_ACCOUNTS } from '@/lib/config/banks'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
    try {
        const [methods, bankAccounts] = await Promise.all([
            fetchPaymentMethods(),
            fetchBankAccounts()
        ])
        return NextResponse.json({ methods, bankAccounts }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            }
        })
    } catch {
        return NextResponse.json({
            methods: DEFAULT_PAYMENT_METHODS,
            bankAccounts: DEFAULT_BANK_ACCOUNTS
        }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            }
        })
    }
}
