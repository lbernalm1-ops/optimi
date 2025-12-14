import { NextRequest, NextResponse } from "next/server";

const CIMA_BASE_URL = "https://cima.aemps.es/cima/rest";

export async function GET(req: NextRequest) {
  const params = new URLSearchParams();
  params.set("maestra", "7"); // ATC

  const url = `${CIMA_BASE_URL}/maestras?${params.toString()}`;

  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });

    if (!res.ok) return NextResponse.json([], { status: 200 });

    const data = await res.json();

    const items = (data.lista ?? []).map((i: any) => ({
      id: i.id,
      codigo: i.codigo ?? "",
      nombre: i.nombre ?? "",
    }));

    return NextResponse.json(items, { status: 200 });
  } catch (e) {
    console.error("ATC ERROR:", e);
    return NextResponse.json([], { status: 200 });
  }
}
