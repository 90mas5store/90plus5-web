export async function POST(request) {
  try {
    const { action, payload } = await request.json();
    const API = process.env.NEXT_PUBLIC_API_BASE;

    if (!action) {
      return new Response(
        JSON.stringify({ success: false, error: "Falta 'action' en body POST" }),
        { status: 400 }
      );
    }

    const res = await fetch(`${API}?action=${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });

    // ⚠️ Google Apps Script a veces devuelve HTML si hay error, lo controlamos:
    const text = await res.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = { success: false, raw: text, error: "Respuesta no válida de backend" };
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
}
