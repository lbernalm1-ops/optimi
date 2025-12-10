import { NextRequest, NextResponse } from "next/server";

const CIMA_BASE_URL = "https://cima.aemps.es/cima/rest";

export type AtcCode = {
  id: number;
  codigo: string;
  nombre: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q"); // búsqueda por nombre
  const code = searchParams.get("code"); // A02B, N02BE01...
  const id = searchParams.get("id");

  const params = new URLSearchParams();
  params.set("maestra", "7"); // Códigos ATC

  if (q) params.set("nombre", q);
  if (code) params.set("codigo", code);
  if (id) params.set("Id", id);

  const url = `${CIMA_BASE_URL}/maestras?${params.toString()}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al consultar CIMA (ATC)" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const items: AtcCode[] = data.lista || [];

    return NextResponse.json(
      {
        source: "AEMPS-CIMA",
        fetchedAt: new Date().toISOString(),
        count: items.length,
        items,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ATC endpoint] error:", error);
    return NextResponse.json(
      { error: "Error de conexión con CIMA" },
      { status: 500 }
    );
  }
}
