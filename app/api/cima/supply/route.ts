import { NextRequest, NextResponse } from "next/server";

const CIMA_BASE_URL = "https://cima.aemps.es/cima/rest/medicamento";

/**
 * Normaliza el estado de suministro retornado por CIMA.
 */
function normalizeSupply(m: any) {
  if (!m) {
    return { estado: "normal" };
  }

  // CIMA usa múltiples campos según tipo de medicamento
  const rawEstado =
    m.estadoDistribucion ||
    m.estadoSuministro ||
    m.estado ||
    m.suministro ||
    "";

  let estado: "normal" | "amarillo" | "rojo" = "normal";

  const e = String(rawEstado).toLowerCase();

  if (
    e.includes("desabaste") ||
    e.includes("interrup") ||
    e.includes("cese")
  ) {
    estado = "rojo";
  } else if (
    e.includes("cautelar") ||
    e.includes("problema") ||
    e.includes("suministro") ||
    e.includes("retras")
  ) {
    estado = "amarillo";
  }

  const comentario =
    m.motivoDesabastecimiento ||
    m.motivo ||
    m.comentario ||
    null;

  const fechaPrevista =
    m.fechaPrevistaRestablecimiento ||
    m.fechaPrevista ||
    null;

  return {
    estado,
    comentario: comentario || undefined,
    fechaPrevista: fechaPrevista || undefined,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { cns } = await req.json();

    if (!Array.isArray(cns) || cns.length === 0) {
      return NextResponse.json(
        { error: "Debes enviar un array de CNs." },
        { status: 400 }
      );
    }

    const uniqueCns = [...new Set(cns)];

    const results: Record<string, any> = {};

    // Pedimos CIMA en paralelo para máxima velocidad
    await Promise.all(
      uniqueCns.map(async (cn) => {
        const url = `${CIMA_BASE_URL}?cn=${cn}`;

        try {
          const res = await fetch(url, {
            headers: { Accept: "application/json" },
            next: { revalidate: 600 },
          });

          if (!res.ok) {
            results[cn] = { estado: "normal" };
            return;
          }

          const data = await res.json();
          results[cn] = normalizeSupply(data);
        } catch (err) {
          results[cn] = { estado: "normal" };
        }
      })
    );

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error("[CIMA supply] Error:", error);
    return NextResponse.json(
      { error: "Error interno procesando suministro" },
      { status: 500 }
    );
  }
}
