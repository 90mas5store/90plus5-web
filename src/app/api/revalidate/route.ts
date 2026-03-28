import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    // Soporta dos métodos de autenticación:
    // 1. Query param ?secret=... (llamadas manuales)
    // 2. Header x-webhook-secret (webhook de Supabase)
    const querySecret = request.nextUrl.searchParams.get("secret");
    const headerSecret = request.headers.get("x-webhook-secret");

    if (querySecret !== process.env.REVALIDATE_SECRET && headerSecret !== process.env.REVALIDATE_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paths: string[] = ["/"];

    // Si viene del webhook de Supabase, el body trae el record con el slug
    try {
        const body = await request.json();
        // Payload de Supabase: { type: "INSERT"|"UPDATE"|"DELETE", table, record, old_record }
        const slug = body.record?.slug || body.old_record?.slug;
        if (slug) {
            paths.push(`/producto/${slug}`);
        }
    } catch {
        // Llamada manual sin body — solo revalida el home
    }

    for (const path of paths) {
        revalidatePath(path);
    }

    return NextResponse.json({
        revalidated: true,
        paths,
        timestamp: new Date().toISOString(),
    });
}
