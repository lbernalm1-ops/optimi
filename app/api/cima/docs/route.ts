import { NextRequest, NextResponse } from "next/server";

const CIMA_BASE = "https://cima.aemps.es/cima";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const id = searchParams.get("id"); // nregistro
  const type = searchParams.get("type"); // ft | p
  const section = searchParams.get("section"); // número de sección opcional
  const format = searchParams.get("format") ?? "json"; // json | html

  if (!id || !type) {
    return NextResponse.json(
      { error: "Parámetros requeridos: id, type" },
      { status: 400 }
    );
  }

  // 1 = FT, 2 = Prospecto
  const tipoDoc = type === "ft" ? 1 : 2;

  let url = "";
  let headers = {};

  if (format === "html") {
    // HTML completo
    url = `${CIMA_BASE}/dochtml/${type}/${id}/${type === "ft" ? "FichaTecnica" : "Prospecto"}.html`;
    headers = { Accept: "text/html" };
  } else {
    // JSON por secciones
    url = `${CIMA_BASE}/rest/docSegmentado/contenido/${tipoDoc}?nregistro=${id}`;
    if (section) url += `&seccion=${section}`;
    headers = { Accept: "application/json" };
  }

  try {
    const res = await fetch(url, {
      headers,
      next: { revalidate: 3600 }, // cache 1h
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Error al obtener documento (${type})` },
        { status: 502 }
      );
    }

    const content =
      format === "html" ? await res.text() : await res.json();

    return NextResponse.json(
      {
        source: "AEMPS-CIMA",
        fetchedAt: new Date().toISOString(),
        id,
        type,
        format,
        content,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[DOCS endpoint] Error:", error);
    return NextResponse.json(
      { error: "Error de conexión con CIMA" },
      { status: 500 }
    );
  }
}
