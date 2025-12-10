import { NextRequest, NextResponse } from "next/server";

const CIMA_BASE_URL = "https://cima.aemps.es/cima/rest";

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  if (!id) {
    return NextResponse.json(
      { error: "El parámetro 'id' es obligatorio (nregistro o CN)." },
      { status: 400 }
    );
  }

  const searchParams = new URL(req.url).searchParams;
  const by = searchParams.get("by") ?? "nregistro"; // nregistro | cn

  const paramName = by === "cn" ? "cn" : "nregistro";
  const url = `${CIMA_BASE_URL}/medicamento?${paramName}=${id}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "No se pudo obtener el medicamento de CIMA." },
        { status: 404 }
      );
    }

    const data = await res.json();

    return NextResponse.json(
      {
        source: "AEMPS-CIMA",
        fetchedAt: new Date().toISOString(),
        id,
        by,
        item: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[MEDICATION by ID endpoint] Error:", error);

    return NextResponse.json(
      { error: "Error de conexión con CIMA." },
      { status: 500 }
    );
  }
}
