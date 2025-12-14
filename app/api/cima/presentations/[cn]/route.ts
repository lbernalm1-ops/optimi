import { NextRequest, NextResponse } from "next/server";
import { normalizeMedication } from "../../medications/normalize";

const CIMA_BASE_URL = "https://cima.aemps.es/cima/rest";

/**
 * GET /api/cima/medications/[cn]
 * Consulta por Código Nacional
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { cn: string } }
) {
  const cn = params.cn;

  // Endpoint oficial CIMA para buscar por Código Nacional
  const url = `${CIMA_BASE_URL}/medicamento?cn=${cn}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 }
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Error consultando CIMA para CN ${cn}` },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: `No existe medicamento con CN ${cn}` },
        { status: 404 }
      );
    }

    // Normalización específica para tu ficha
    const normalized = normalizeMedication(data);

    return NextResponse.json(
      {
        source: "CIMA",
        fetchedAt: new Date().toISOString(),
        cn,
        item: normalized,
        raw: data // opcional para vistas más avanzadas
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("CIMA MEDICATION CN DETAIL ERROR:", error);
    return NextResponse.json(
      { error: "Error interno consultando CIMA" },
      { status: 500 }
    );
  }
}
