import { NextRequest, NextResponse } from "next/server";

const CIMA_BASE_URL = "https://cima.aemps.es/cima/rest";

export type FormItem = {
  id: number;
  codigo: string;
  nombre: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q");
  const code = searchParams.get("code");
  const id = searchParams.get("id");
  const simplified = searchParams.get("simplified") === "true";

  // 3 = formas farmacéuticas, 13 = simplificadas (SNOMED)
  const maestra = simplified ? "13" : "3";

  const params = new URLSearchParams();
  params.set("maestra", maestra);

  if (q) params.set("nombre", q);
  if (code) params.set("codigo", code);
  if (id) params.set("Id", id);

  const url = `${CIMA_BASE_URL}/maestras?${params}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al consultar CIMA (formas farmacéuticas)" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const items: FormItem[] = data.lista || [];

    return NextResponse.json(
      {
        source: "AEMPS-CIMA",
        type: simplified ? "simplified" : "standard",
        fetchedAt: new Date().toISOString(),
        count: items.length,
        items,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[FORMS endpoint] error:", error);
    return NextResponse.json(
      { error: "Error de conexión con CIMA" },
      { status: 500 }
    );
  }
}
