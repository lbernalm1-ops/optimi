import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CIMA_BASE_URL = "https://cima.aemps.es/cima/rest";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const cn = searchParams.get("cn");

  const url = cn
    ? `${CIMA_BASE_URL}/psuministro/${cn}`
    : `${CIMA_BASE_URL}/psuministro`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al consultar problemas de suministro en CIMA" },
        { status: 502 }
      );
    }

    const data = await res.json();

    // NORMALIZAR: puede ser array o lista dentro del objeto
    const items = Array.isArray(data) ? data : data?.resultados ?? [];

    return NextResponse.json(
      {
        source: "AEMPS-CIMA",
        fetchedAt: new Date().toISOString(),
        count: items.length,
        items,
        raw: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[SUPPLY endpoint] Error:", error);

    return NextResponse.json(
      { error: "Error interno consultando problemas de suministro" },
      { status: 500 }
    );
  }
}
