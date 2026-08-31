import { NextResponse } from 'next/server';
import { fetchBankAccounts } from '@/lib/config/banks.server';

/**
 * GET /api/bank-accounts
 *
 * Retorna las cuentas bancarias activas desde Supabase.
 * Endpoint público — sin autenticación requerida.
 * Cache de 5 minutos para no sobrecargar Supabase.
 */
export const revalidate = 300; // 5 minutos

export async function GET() {
    try {
        const accounts = await fetchBankAccounts();

        return NextResponse.json(
            { accounts },
            {
                status: 200,
                headers: {
                    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
                },
            }
        );
    } catch (error) {
        console.error('❌ Error en GET /api/bank-accounts:', error);
        return NextResponse.json(
            { error: 'No se pudieron obtener las cuentas bancarias.' },
            { status: 500 }
        );
    }
}
