import { NextRequest, NextResponse } from "next/server";

const CIMA_BASE_URL = "https://cima.aemps.es/cima/rest";

export type LabItem = {
  id: number;
  codigo: string;
  nombre: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q");      // Buscar por nombre
  const code = searchParams.get("code");
  const id = searchParams.get("id");

  const params = new URLSearchParams();
  params.set("maestra", "6"); // 6 = Laboratorios

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
        { error: "Error al consultar CIMA (laboratorios)" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const items: LabItem[] = data.lista || [];

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
    console.error("[LABS endpoint] Error:", error);
    return NextResponse.json(
      { error: "Error de conexión con CIMA" },
      { status: 500 }
    );
  }
}
